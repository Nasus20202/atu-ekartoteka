## ADDED Requirements

### Requirement: Streamed Page Sections

Every page that loads data SHALL render its static shell immediately and show each
independent data section behind its own loading boundary, with a skeleton and a
fade-in when the content replaces it. A section SHALL appear as soon as its own data
is ready, without waiting for the others.

#### Scenario: Slow data load

- **WHEN** a signed-in user opens a page and one section's data takes time to load
- **THEN** the shell and every ready section are visible while that section shows its skeleton
- **AND** the section fades in without shifting the layout when its data arrives

#### Scenario: Skeleton shape

- **WHEN** a skeleton is shown
- **THEN** it uses the shared `Skeleton` primitive and reserves the dimensions of the final content to avoid layout shift
- **AND** it is hidden from assistive technology

#### Scenario: Reduced motion

- **GIVEN** the user prefers reduced motion
- **WHEN** a skeleton is shown
- **THEN** it does not pulse

### Requirement: Page Loading Uses Skeletons

A page that loads its data SHALL show skeletons of its own layout, not a spinner card
or a text placeholder. Spinners remain only for an action in progress, such as a
button submitting.

#### Scenario: Admin list loading

- **WHEN** an admin opens an admin list page and its data is not ready
- **THEN** the page header and controls are visible and the list area shows a skeleton of its cards or rows
