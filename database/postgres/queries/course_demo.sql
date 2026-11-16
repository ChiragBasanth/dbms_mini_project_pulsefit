-- Run against disposable seeded database. All mutations roll back.
BEGIN;
CREATE TEMP TABLE ddl_demonstration(id integer PRIMARY KEY, label text NOT NULL);
ALTER TABLE ddl_demonstration ADD COLUMN recorded_at timestamptz DEFAULT now();
INSERT INTO ddl_demonstration(id,label) VALUES(1,'training fixture');
UPDATE ddl_demonstration SET label='verified fixture' WHERE id=1;
SELECT * FROM ddl_demonstration ORDER BY id;
DELETE FROM ddl_demonstration WHERE id=1;
DROP TABLE ddl_demonstration;
-- Real domain DML, scoped to newly generated fixture identities and rolled back.
CREATE TEMP TABLE fixture_member AS
WITH added AS (
 INSERT INTO users(name,email,password_hash,role)
 SELECT 'Course demonstration member',gen_random_uuid()::text||'@course.example',password_hash,'MEMBER'
 FROM users WHERE role='MEMBER' ORDER BY created_at LIMIT 1 RETURNING id
) SELECT id FROM added;
INSERT INTO member_profiles(user_id,fitness_goals) SELECT id,'Improve everyday stamina' FROM fixture_member;
UPDATE member_profiles SET fitness_goals='Develop aerobic endurance' WHERE user_id IN(SELECT id FROM fixture_member);
SELECT u.name,m.fitness_goals FROM users u JOIN member_profiles m ON m.user_id=u.id WHERE u.id IN(SELECT id FROM fixture_member);
DELETE FROM member_profiles WHERE user_id IN(SELECT id FROM fixture_member);
DELETE FROM users WHERE id IN(SELECT id FROM fixture_member);
SELECT b.id,m.name member,t.name trainer,s.starts_at FROM bookings b
INNER JOIN users m ON b.member_id=m.id INNER JOIN users t ON b.trainer_id=t.id
INNER JOIN trainer_availability s ON s.id=b.slot_id ORDER BY s.starts_at;
SELECT u.name,count(b.id) bookings FROM users u LEFT JOIN bookings b ON b.member_id=u.id
WHERE u.role='MEMBER' GROUP BY u.id HAVING count(b.id)>=0 ORDER BY bookings DESC;
WITH totals AS (SELECT trainer_id,count(*) total FROM bookings WHERE status='CONFIRMED' GROUP BY trainer_id)
SELECT * FROM totals WHERE total >= (SELECT avg(total) FROM totals);
SELECT * FROM upcoming_bookings ORDER BY starts_at;
SELECT * FROM trainer_utilization;
-- Correlated EXISTS: trainers with at least one future open unoccupied slot.
-- Inner queries reference the current outer trainer/slot, unlike an independent subquery.
SELECT u.name FROM trainer_profiles t JOIN users u ON u.id=t.user_id
WHERE EXISTS(SELECT 1 FROM trainer_availability s WHERE s.trainer_id=t.user_id
 AND s.status='OPEN' AND s.starts_at>now()
 AND NOT EXISTS(SELECT 1 FROM bookings b WHERE b.slot_id=s.id AND b.status='CONFIRMED'))
ORDER BY u.name;
-- Explicit nested subquery: members booked with a trainer who has an indexed bio.
SELECT name FROM users WHERE id IN(SELECT member_id FROM bookings WHERE trainer_id IN
 (SELECT user_id FROM trainer_profiles WHERE embedding IS NOT NULL)) ORDER BY name;
-- Recursive seven-day planning report. Expected: exactly seven dates, including
-- zero-capacity days; aggregate future capacity from actual trainer availability.
WITH RECURSIVE training_days(day) AS (
 SELECT current_date
 UNION ALL SELECT day+1 FROM training_days WHERE day<current_date+6
)
SELECT d.day,count(s.id) FILTER(WHERE s.status='OPEN' AND s.starts_at>now()
 AND NOT EXISTS(SELECT 1 FROM bookings b WHERE b.slot_id=s.id AND b.status='CONFIRMED')) AS free_slots
FROM training_days d LEFT JOIN trainer_availability s ON s.starts_at::date=d.day
GROUP BY d.day ORDER BY d.day;
ROLLBACK;
-- Failure exercise (separate transaction): BEGIN; SELECT reserve_slot('<member UUID>','<slot UUID>');
-- Repeat on an occupied slot: SQLSTATE 23505; ROLLBACK restores usable connection.
