## ADDED Requirements

### Requirement: Charges and Payments Frontend DTO Mapping

The system SHALL map charge and payment data to named DTO contracts before that
data crosses from server-side query composition into client components, PDF
download triggers, or other frontend-only rendering boundaries.

#### Scenario: Payment row list uses a DTO contract

- **WHEN** the payments overview page prepares yearly payment rows for rendering
- **THEN** it maps the selected payment fields into a named payment DTO instead
  of passing a database-shaped payment entity or an ad-hoc serialized clone

#### Scenario: Charge views use DTO contracts

- **WHEN** the charges overview or per-apartment charges page prepares grouped
  charge data for rendering
- **THEN** each charge item is mapped into a named charge DTO before it is
  passed to client components

#### Scenario: PDF download actions accept DTO props

- **WHEN** a PDF download button receives payment or charge data from a page or
  client component
- **THEN** its props use named DTO types that are stable for the frontend
  boundary
- **AND** any conversion back to PDF-consumer shapes happens inside the PDF
  download flow rather than at the call site

### Requirement: DTOs Preserve Existing Charges and Payments Behaviour

The system SHALL preserve existing charges, payments, and PDF rendering
behaviour while replacing serializer helpers with DTO mappers.

#### Scenario: Payment values remain display-compatible

- **WHEN** a payment DTO is produced for frontend rendering
- **THEN** all decimal and date fields needed by existing client-side payment
  components are represented in a frontend-safe format that preserves the
  current display output

#### Scenario: Charge values remain display-compatible

- **WHEN** a charge DTO is produced for frontend rendering
- **THEN** all decimal and date fields needed by existing charge views and PDF
  download triggers are represented in a frontend-safe format that preserves the
  current display output

### Requirement: User and Apartment API Responses Use DTO Contracts

The system SHALL map user and apartment data to named DTO contracts before that
data is returned from internal API routes to frontend consumers.

#### Scenario: Admin users route returns DTO-mapped users

- **WHEN** the admin users API route returns a paginated list of users
- **THEN** each user payload is mapped to a named user DTO
- **AND** nested apartment assignments are mapped to explicit apartment summary
  DTOs instead of raw apartment rows

#### Scenario: Profile update route returns a DTO-mapped user

- **WHEN** the profile API route returns the updated user after a successful
  profile change
- **THEN** the JSON response uses the named user DTO contract rather than the
  raw mutation result

#### Scenario: Apartment detail route returns a DTO-mapped apartment

- **WHEN** the admin apartment detail API route returns apartment data
- **THEN** the top-level apartment fields are mapped through a named apartment
  DTO
- **AND** nested charges and payments continue using their existing DTO mappers

#### Scenario: Apartment list route returns DTO-mapped apartments

- **WHEN** the admin apartments API route returns apartment rows for selection or
  management views
- **THEN** each apartment payload is mapped to a named apartment summary DTO
  before it is returned to the frontend
