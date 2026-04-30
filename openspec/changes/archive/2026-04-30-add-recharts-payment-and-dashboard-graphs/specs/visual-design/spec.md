## ADDED Requirements

### Requirement: Financial Charts Follow Application Visual Language

The system SHALL render financial charts using the same semantic colour, spacing, and card layout conventions as the rest of the application.

#### Scenario: Chart lives inside existing card layout

- **GIVEN** any financial chart added to the tenant or admin UI
- **WHEN** it is rendered
- **THEN** it appears inside an existing or matching `Card` layout with a Polish title/description rather than as a free-floating canvas

#### Scenario: Semantic series styling used

- **GIVEN** a chart series representing payments, charges, or balances
- **WHEN** it is rendered
- **THEN** its styling uses semantic, app-consistent colour choices that distinguish the series without relying on arbitrary raw palette values

#### Scenario: Area charts use restrained fill treatment

- **GIVEN** a financial chart rendered as an area chart
- **WHEN** it is shown in the tenant or admin UI
- **THEN** the filled area uses a restrained opacity or gradient treatment that keeps the chart readable inside the existing card layout
- **AND** the line or edge of the series remains visually distinguishable from the fill

### Requirement: Financial Charts Remain Usable on Mobile and Assistive Technologies

The system SHALL ensure financial charts are responsive, keyboard-safe, and supplemented by readable text context.

#### Scenario: Chart does not cause horizontal page overflow

- **GIVEN** a chart rendered on a viewport width of 375 px or wider
- **WHEN** the page loads
- **THEN** the chart fits within its container and does not cause the page body to scroll horizontally

#### Scenario: Chart has text context

- **GIVEN** a chart rendered on any finance page
- **WHEN** a user reads the surrounding content or uses assistive technology
- **THEN** the page includes a visible label, description, or equivalent text context explaining what the chart represents

#### Scenario: Tooltip values use existing currency formatting

- **GIVEN** a user hovers or focuses a financial chart data point
- **WHEN** the value tooltip is shown
- **THEN** monetary values are formatted consistently with the application's existing PLN currency formatting
