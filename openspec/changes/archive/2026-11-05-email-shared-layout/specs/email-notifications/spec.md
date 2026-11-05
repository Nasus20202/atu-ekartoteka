## MODIFIED Requirements

### Requirement: Email Templates

Every email type SHALL have an HTML body built from shared React components and a plain-text fallback template. HTML emails SHALL share one layout and one theme derived from the website's design tokens, and the delivered HTML SHALL carry inline styles only. Plain-text templates SHALL be loaded eagerly at module initialisation.

#### Scenario: HTML rendering

- **GIVEN** an email type and its variables
- **WHEN** its message is built
- **THEN** the HTML is rendered from the shared layout with the variables inserted as escaped text, and no placeholder syntax remains in the result

#### Scenario: Template rendering

- **GIVEN** a template name and a map of variable substitutions
- **WHEN** `renderEmailTemplate` is called
- **THEN** every `{{VARIABLE}}` placeholder in the plain-text template is replaced with the corresponding value; unreferenced placeholders remain untouched; the rendered string is returned

#### Scenario: Templates loaded at startup

- **GIVEN** the application starts
- **WHEN** `template-loader` is imported for the first time
- **THEN** all five plain-text templates are read from disk synchronously and held in memory; subsequent renders do not perform I/O

#### Scenario: Shared theme

- **GIVEN** the website's primary, primary-foreground, muted, muted-foreground and border colours and its corner radius
- **WHEN** the email theme is defined
- **THEN** the email theme equals those design tokens, so a change to a token fails the test suite until the theme follows

#### Scenario: Sender identity

- **GIVEN** `EMAIL_FROM_NAME` is set alongside `EMAIL_FROM`
- **WHEN** an email is sent
- **THEN** the `From` header uses the format `"<NAME>" <address>` (e.g., `"ATU Ekartoteka" <noreply@example.com>`)
