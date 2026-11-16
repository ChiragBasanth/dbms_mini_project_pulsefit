-- SQL command gallery (run after 001_schema.sql and seed.sql)
-- INSERT
INSERT INTO trainer_specializations(trainer_id,name) VALUES(:trainer_id,'Strength') ON CONFLICT DO NOTHING;
-- SELECT + JOIN + filtering
SELECT u.full_name,b.starts_at,b.status FROM bookings b JOIN users u ON u.id=b.trainer_id WHERE b.member_id=:member_id ORDER BY b.starts_at;
-- GROUP BY + HAVING + aggregate
SELECT trainer_id,COUNT(*) sessions,AVG(EXTRACT(EPOCH FROM ends_at-starts_at)/60) avg_minutes FROM bookings GROUP BY trainer_id HAVING COUNT(*)>=1;
-- Subquery
SELECT full_name FROM users WHERE id IN (SELECT trainer_id FROM bookings WHERE status='CONFIRMED');
-- UPDATE / DELETE
UPDATE trainer_availability SET is_open=FALSE WHERE id=:availability_id;
DELETE FROM fitness_goals WHERE id=:goal_id;
-- Transaction: atomic status transition; exclusion constraint rejects overlaps
BEGIN; UPDATE bookings SET status='CANCELLED' WHERE id=:booking_id AND member_id=:member_id AND starts_at>now(); COMMIT;
-- Stored function and view
SELECT create_booking(:member_id,:trainer_id,:starts_at,:ends_at,'Intro session');
SELECT * FROM trainer_booking_summary ORDER BY confirmed_bookings DESC;
