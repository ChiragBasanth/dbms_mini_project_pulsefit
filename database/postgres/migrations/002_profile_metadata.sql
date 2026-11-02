-- Safe additive ALTER; migration runner records applied checksums.
ALTER TABLE trainer_profiles ADD COLUMN location text NOT NULL DEFAULT 'PulseFit Campus Gym' CHECK(length(location)<=120);
