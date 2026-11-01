CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(name) BETWEEN 2 AND 100),
 email text NOT NULL UNIQUE CHECK(email = lower(btrim(email)) AND position('@' IN email)>1),
 password_hash text NOT NULL CHECK(length(password_hash)>=60),
 role text NOT NULL CHECK(role IN ('MEMBER','TRAINER')), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,role)
);
CREATE TABLE member_profiles (
 user_id uuid PRIMARY KEY, role text NOT NULL DEFAULT 'MEMBER' CHECK(role='MEMBER'),
 fitness_goals text NOT NULL DEFAULT '' CHECK(length(fitness_goals)<=2000),
 FOREIGN KEY(user_id,role) REFERENCES users(id,role)
);
CREATE TABLE trainer_profiles (
 user_id uuid PRIMARY KEY, role text NOT NULL DEFAULT 'TRAINER' CHECK(role='TRAINER'),
 bio text NOT NULL DEFAULT '' CHECK(length(bio)<=2000), specialties text[] NOT NULL DEFAULT '{}',
 experience_years integer NOT NULL DEFAULT 0 CHECK(experience_years BETWEEN 0 AND 80),
 FOREIGN KEY(user_id,role) REFERENCES users(id,role),
 embedding vector(384), embedding_model text
);
CREATE TABLE trainer_availability (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), trainer_id uuid NOT NULL REFERENCES trainer_profiles(user_id),
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','CLOSED')),
 CHECK(ends_at>starts_at AND ends_at<=starts_at+interval '4 hours'), UNIQUE(id,trainer_id),
 EXCLUDE USING gist(trainer_id WITH =, tstzrange(starts_at,ends_at,'[)') WITH &&)
);
CREATE TABLE bookings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), member_id uuid NOT NULL REFERENCES member_profiles(user_id),
 trainer_id uuid NOT NULL, slot_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'CONFIRMED' CHECK(status IN ('CONFIRMED','CANCELLED')),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(slot_id,trainer_id) REFERENCES trainer_availability(id,trainer_id)
);
CREATE UNIQUE INDEX one_confirmed_booking_per_slot ON bookings(slot_id) WHERE status='CONFIRMED';
CREATE INDEX bookings_member_date ON bookings(member_id,created_at DESC);
CREATE INDEX bookings_trainer ON bookings(trainer_id,status);
CREATE INDEX availability_trainer_date ON trainer_availability(trainer_id,starts_at);
CREATE TABLE booking_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, booking_id uuid NOT NULL REFERENCES bookings(id),
 old_status text, new_status text NOT NULL, changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE exercises (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, muscle_group text NOT NULL,
 description text NOT NULL, difficulty text NOT NULL CHECK(difficulty IN ('BEGINNER','INTERMEDIATE','ADVANCED')),
 category text NOT NULL CHECK(category IN ('STRENGTH','CARDIO','MOBILITY')), embedding vector(384), embedding_model text
);

CREATE FUNCTION validate_booking() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s trainer_availability;
BEGIN
 IF TG_OP='UPDATE' THEN
   IF (NEW.member_id,NEW.trainer_id,NEW.slot_id,NEW.created_at) IS DISTINCT FROM
      (OLD.member_id,OLD.trainer_id,OLD.slot_id,OLD.created_at) THEN
     RAISE EXCEPTION 'Booking identity is immutable' USING ERRCODE='23514';
   END IF;
   IF OLD.status='CANCELLED' AND NEW.status<>'CANCELLED' THEN
     RAISE EXCEPTION 'Create a new reservation after cancellation' USING ERRCODE='23514';
   END IF;
 END IF;
 SELECT * INTO s FROM trainer_availability WHERE id=NEW.slot_id FOR UPDATE;
 IF NEW.status='CONFIRMED' AND (s.status<>'OPEN' OR s.starts_at<=now() OR s.starts_at>now()+interval '90 days') THEN
   RAISE EXCEPTION 'Slot unavailable or outside reservation window' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER booking_validation BEFORE INSERT OR UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION validate_booking();

CREATE FUNCTION audit_booking() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO booking_audit(booking_id,old_status,new_status)
 VALUES(NEW.id,CASE WHEN TG_OP='UPDATE' THEN OLD.status ELSE NULL END,NEW.status);
 RETURN NEW;
END $$;
CREATE TRIGGER booking_changes AFTER INSERT OR UPDATE OF status ON bookings FOR EACH ROW EXECUTE FUNCTION audit_booking();

CREATE FUNCTION reserve_slot(p_member uuid,p_slot uuid) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE s trainer_availability; result uuid;
BEGIN
 SELECT * INTO s FROM trainer_availability WHERE id=p_slot FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found' USING ERRCODE='P0002'; END IF;
 IF s.status<>'OPEN' OR s.starts_at<=now() OR s.starts_at>now()+interval '90 days' THEN
   RAISE EXCEPTION 'Slot unavailable or outside reservation window' USING ERRCODE='23514';
 END IF;
 INSERT INTO bookings(member_id,trainer_id,slot_id) VALUES(p_member,s.trainer_id,s.id) RETURNING id INTO result;
 RETURN result;
END $$;

CREATE FUNCTION protect_availability() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' AND (NEW.starts_at<=now() OR NEW.starts_at>now()+interval '90 days') THEN
   RAISE EXCEPTION 'Availability must start within next 90 days' USING ERRCODE='23514';
 END IF;
 IF TG_OP='UPDATE' AND (NEW.trainer_id,NEW.starts_at,NEW.ends_at) IS DISTINCT FROM (OLD.trainer_id,OLD.starts_at,OLD.ends_at) THEN
   RAISE EXCEPTION 'Close slot and create a new slot to change times' USING ERRCODE='23514';
 END IF;
 IF NEW.status='CLOSED' AND EXISTS(SELECT 1 FROM bookings WHERE slot_id=NEW.id AND status='CONFIRMED') THEN
   RAISE EXCEPTION 'Slot has a confirmed booking' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER availability_guard BEFORE INSERT OR UPDATE ON trainer_availability FOR EACH ROW EXECUTE FUNCTION protect_availability();

CREATE VIEW upcoming_bookings AS
SELECT b.id,b.member_id,b.trainer_id,b.slot_id,b.status,m.name member_name,t.name trainer_name,s.starts_at,s.ends_at
FROM bookings b JOIN users m ON m.id=b.member_id JOIN users t ON t.id=b.trainer_id
JOIN trainer_availability s ON s.id=b.slot_id WHERE s.ends_at>now() AND b.status='CONFIRMED';
CREATE VIEW trainer_utilization AS
SELECT t.user_id,count(s.id) slots,count(b.id) confirmed_bookings
FROM trainer_profiles t LEFT JOIN trainer_availability s ON s.trainer_id=t.user_id
LEFT JOIN bookings b ON b.slot_id=s.id AND b.status='CONFIRMED' GROUP BY t.user_id;
