-- Additive migration. Owners retain maintenance access; the application must use
-- a separate non-owner, non-superuser, NOBYPASSRLS login (npm run db:rbac).
CREATE FUNCTION request_actor() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT nullif(current_setting('pulsefit.actor_id',true),'')::uuid
$$;
CREATE FUNCTION request_has_role(expected text) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM users WHERE id=request_actor() AND role=expected)
$$;

ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY member_read ON member_profiles FOR SELECT USING(user_id=request_actor());
CREATE POLICY member_insert ON member_profiles FOR INSERT WITH CHECK(user_id=request_actor() AND request_has_role('MEMBER'));
CREATE POLICY member_update ON member_profiles FOR UPDATE USING(user_id=request_actor() AND request_has_role('MEMBER')) WITH CHECK(user_id=request_actor());
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY trainer_read ON trainer_profiles FOR SELECT USING(true);
CREATE POLICY trainer_insert ON trainer_profiles FOR INSERT WITH CHECK(user_id=request_actor() AND request_has_role('TRAINER'));
CREATE POLICY trainer_update ON trainer_profiles FOR UPDATE USING(user_id=request_actor() AND request_has_role('TRAINER')) WITH CHECK(user_id=request_actor());
ALTER TABLE trainer_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY availability_read ON trainer_availability FOR SELECT USING(true);
CREATE POLICY availability_insert ON trainer_availability FOR INSERT WITH CHECK(trainer_id=request_actor() AND request_has_role('TRAINER'));
CREATE POLICY availability_update ON trainer_availability FOR UPDATE USING(trainer_id=request_actor() AND request_has_role('TRAINER')) WITH CHECK(trainer_id=request_actor());
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY booking_read ON bookings FOR SELECT USING(
 (member_id=request_actor() AND request_has_role('MEMBER')) OR
 (trainer_id=request_actor() AND request_has_role('TRAINER')));
CREATE POLICY booking_cancel ON bookings FOR UPDATE USING(
 member_id=request_actor() AND request_has_role('MEMBER') AND status='CONFIRMED'
 AND EXISTS(SELECT 1 FROM trainer_availability s WHERE s.id=slot_id AND s.starts_at>now()))
 WITH CHECK(member_id=request_actor() AND status='CANCELLED');
ALTER TABLE booking_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_read ON booking_audit FOR SELECT USING(EXISTS(SELECT 1 FROM bookings b WHERE b.id=booking_id));

-- Expose capacity without exposing other members' booking identities.
CREATE VIEW occupied_slots AS SELECT slot_id FROM bookings WHERE status='CONFIRMED';
-- Existing owner-defined reporting views must respect caller RLS.
ALTER VIEW upcoming_bookings SET (security_invoker=true);
ALTER VIEW trainer_utilization SET (security_invoker=true);

-- Trigger helpers may inspect/lock related rows but are not directly callable
-- as mutation APIs. Freeze search_path to the migration's trusted schema.
ALTER FUNCTION validate_booking() SECURITY DEFINER;
ALTER FUNCTION validate_booking() SET search_path FROM CURRENT;
ALTER FUNCTION audit_booking() SECURITY DEFINER;
ALTER FUNCTION audit_booking() SET search_path FROM CURRENT;
REVOKE ALL ON FUNCTION reserve_slot(uuid,uuid) FROM PUBLIC;
CREATE FUNCTION app_reserve_slot(p_member uuid,p_slot uuid) RETURNS uuid
 LANGUAGE plpgsql SECURITY DEFINER SET search_path FROM CURRENT AS $$
BEGIN
 IF p_member IS DISTINCT FROM request_actor() OR NOT request_has_role('MEMBER') THEN
   RAISE EXCEPTION 'Member reservation permission required' USING ERRCODE='42501';
 END IF;
 RETURN reserve_slot(p_member,p_slot);
END $$;
REVOKE ALL ON FUNCTION app_reserve_slot(uuid,uuid) FROM PUBLIC;
