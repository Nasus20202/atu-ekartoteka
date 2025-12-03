-- Select test users by email pattern
SELECT id FROM "User" WHERE email LIKE '%@e2e-test.com'
