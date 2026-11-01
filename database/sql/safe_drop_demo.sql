-- Safe standalone demonstration: temporary object only; never drops project tables.
BEGIN;
CREATE TEMP TABLE pulsefit_drop_demo(id INT PRIMARY KEY);
INSERT INTO pulsefit_drop_demo VALUES(1);
DROP TABLE pulsefit_drop_demo;
ROLLBACK;
