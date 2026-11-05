# Spec Delta

## ADDED Requirements

### Requirement: Email Visual Style

Every HTML email SHALL share one layout that matches the application's visual design.

#### Scenario: Shared design tokens

- **GIVEN** any of the five HTML templates
- **WHEN** it is rendered
- **THEN** it uses the application's primary colour, text colours and 0.5rem radius, a system sans-serif font stack, a white card on a muted page background, a header with the application name and a footer, with all styles inline and a table-based layout

#### Scenario: One call to action style

- **GIVEN** a template with an action link
- **WHEN** it is rendered
- **THEN** the action is a primary-coloured button regardless of email type, and the raw URL is shown below it as a fallback

#### Scenario: Narrow screens

- **GIVEN** a viewport of phone width
- **WHEN** an email is displayed
- **THEN** the card fills the width without horizontal scrolling

#### Scenario: Text variant stays equivalent

- **GIVEN** a template pair
- **WHEN** it is rendered with the same variables
- **THEN** the plain-text variant contains every link and value that the HTML variant contains
