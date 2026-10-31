## MODIFIED Requirements

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

#### Scenario: Tooltip text readable in dark mode

- **GIVEN** the application is in dark mode
- **WHEN** a financial chart tooltip is shown, including for the balance bar chart
- **THEN** the tooltip title and every value use the theme foreground colour, never fixed black
- **AND** the same holds in light mode
