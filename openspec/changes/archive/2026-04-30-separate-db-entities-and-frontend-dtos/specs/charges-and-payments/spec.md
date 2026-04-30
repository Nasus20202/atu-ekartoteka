## ADDED Requirements

### Requirement: Explicit DTO Contracts for Charge and Payment Rendering

The system SHALL use explicit DTO contracts for charge and payment data passed
from server-side page composition into client-side rendering and download
components.

#### Scenario: Payments page maps to DTO before client rendering

- **WHEN** the tenant payments overview page renders a yearly payment row
- **THEN** the row component receives a named payment DTO contract rather than a
  database entity or serializer-defined alias

#### Scenario: Payment detail page maps download data to DTO

- **WHEN** the tenant payment detail page renders the PDF download action
- **THEN** the download button receives a named payment DTO contract
- **AND** the page continues to render the existing payment summary and table
  without changing user-visible behaviour

#### Scenario: Charges pages map to DTO before client rendering

- **WHEN** a tenant charges page renders grouped charge data
- **THEN** the charge cards and download actions receive named charge DTO
  contracts rather than serializer-defined aliases

#### Scenario: DTO migration does not change displayed content

- **WHEN** charge and payment DTOs replace the previous serializer outputs
- **THEN** the rendered values, labels, grouping, and PDF download availability
  remain unchanged for tenants and admins
