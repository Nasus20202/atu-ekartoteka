## MODIFIED Requirements

### Requirement: Email Templates

Every email type SHALL have an HTML template and a plain-text fallback, both loaded eagerly at module initialisation. HTML templates SHALL contain only the content specific to their email and SHALL be composed with a shared layout, a shared stylesheet and reusable partials when loaded, so that all HTML emails share one look and the delivered markup carries inline styles only.

#### Scenario: Template rendering

- **GIVEN** a template name and a map of variable substitutions
- **WHEN** `renderEmailTemplate` is called
- **THEN** every `{{VARIABLE}}` placeholder in the template is replaced with the corresponding value; unreferenced placeholders remain untouched; the rendered string is returned

#### Scenario: Templates loaded at startup

- **GIVEN** the application starts
- **WHEN** `template-loader` is imported for the first time
- **THEN** all five template pairs, the shared layout, the stylesheet and the partials are read from disk synchronously, the HTML templates are composed and styled once, and the results are held in memory; subsequent renders do not perform I/O

#### Scenario: Shared layout and styles

- **GIVEN** an HTML template body
- **WHEN** the template is loaded
- **THEN** the body is wrapped in the shared layout (document shell, card, header and footer), its partials are expanded, and every class from the shared stylesheet is replaced by inline `style` attributes, so the delivered HTML contains no `class` attributes and no `<style>` block

#### Scenario: Unknown style class or partial

- **GIVEN** a template body referencing a class missing from the stylesheet or a partial that does not exist
- **WHEN** the template is loaded
- **THEN** loading fails with an error naming the class or partial instead of producing an unstyled email

#### Scenario: Sender identity

- **GIVEN** `EMAIL_FROM_NAME` is set alongside `EMAIL_FROM`
- **WHEN** an email is sent
- **THEN** the `From` header uses the format `"<NAME>" <address>` (e.g., `"ATU Ekartoteka" <noreply@example.com>`)
