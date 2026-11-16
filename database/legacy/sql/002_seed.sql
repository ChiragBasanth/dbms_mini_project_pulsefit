-- Demo-only seed. Password values are bcrypt hashes for `PulseFitDemo!2026`.
-- Run after 001_schema.sql. It is safe to run repeatedly because emails are unique.
INSERT INTO users(email,password_hash,full_name,role) VALUES
 ('member.demo@pulsefit.local','$2a$12$J0VtwDOMKgmRPTlLbREDtu3MxEEPYyXmedfvhJWprfD94ozly/8b.','Aarav Mehta','MEMBER'),
 ('trainer.maya@pulsefit.local','$2a$12$J0VtwDOMKgmRPTlLbREDtu3MxEEPYyXmedfvhJWprfD94ozly/8b.','Maya Chen','TRAINER') ON CONFLICT(email) DO NOTHING;
INSERT INTO member_profiles(user_id) SELECT id FROM users WHERE email='member.demo@pulsefit.local' ON CONFLICT DO NOTHING;
INSERT INTO trainer_profiles(user_id,headline,biography,hourly_rate,years_experience,rating) SELECT id,'Strength & Mobility Coach','Build usable strength, confidence and resilient movement.',900,8,4.9 FROM users WHERE email='trainer.maya@pulsefit.local' ON CONFLICT DO NOTHING;
INSERT INTO trainer_specializations(trainer_id,name) SELECT u.id,'Strength' FROM users u WHERE u.email='trainer.maya@pulsefit.local' ON CONFLICT DO NOTHING;
INSERT INTO trainer_specializations(trainer_id,name) SELECT u.id,'Mobility' FROM users u WHERE u.email='trainer.maya@pulsefit.local' ON CONFLICT DO NOTHING;
INSERT INTO trainer_availability(trainer_id,starts_at,ends_at)
SELECT id, date_trunc('day',now()) + interval '1 day 10 hours', date_trunc('day',now()) + interval '1 day 11 hours'
FROM users WHERE email='trainer.maya@pulsefit.local' ON CONFLICT DO NOTHING;
