## MODIFIED Requirements

### Requirement: Email Templates

Every email type SHALL be built from shared React components and SHALL have a plain-text part generated from its rendered HTML. HTML emails SHALL share one layout and one theme derived from the website's design tokens, and the delivered HTML SHALL carry inline styles only.

#### Scenario: HTML rendering

- **GIVEN** an email type and its variables
- **WHEN** its message is built
- **THEN** the HTML is rendered from the shared layout with the variables inserted as escaped text, and no placeholder syntax remains in the result

#### Scenario: Template rendering

- **GIVEN** an email type and its variables
- **WHEN** its message is built
- **THEN** the plain-text part is generated from the rendered HTML, keeps heading case, shows each link once, puts detail labels on their own line and leaves out the brand header and the "copy this address" fallback; values are inserted literally

#### Scenario: Templates loaded at startup

- **GIVEN** the application starts
- **WHEN** an email is built
- **THEN** no template file is read or held in memory; HTML and text come from the same React components

#### Scenario: Shared theme

- **GIVEN** the website's foreground, primary, primary-foreground, muted, muted-foreground and border colours and its card, button and base corner radii
- **WHEN** the email theme is defined
- **THEN** the email theme equals those design tokens, so a change to a token fails the test suite until the theme follows; buttons use the application's primary button colours, size and shadow, and text uses the application's Geist fonts ahead of the system font stack

#### Scenario: Sender identity

- **GIVEN** `EMAIL_FROM_NAME` is set alongside `EMAIL_FROM`
- **WHEN** an email is sent
- **THEN** the `From` header uses the format `"<NAME>" <address>` (e.g., `"ATU Ekartoteka" <noreply@example.com>`)
