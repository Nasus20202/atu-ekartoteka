## ADDED Requirements

### Requirement: Paginated Admin User List

The system SHALL support pagination on the admin user list API.

#### Scenario: API accepts page and limit parameters

- **GIVEN** an authenticated admin
- **WHEN** they call GET /api/admin/users?page=2&limit=20
- **THEN** the response contains the users for that page and pagination metadata (total, totalPages, page, limit)

#### Scenario: Default page size

- **GIVEN** an admin requests the user list without page/limit params
- **WHEN** the API responds
- **THEN** it returns the first 20 users by default
