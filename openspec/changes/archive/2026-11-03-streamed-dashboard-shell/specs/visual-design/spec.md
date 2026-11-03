## ADDED Requirements

### Requirement: Streamed Page Sections

Every page that loads data SHALL render its static shell immediately and show the
data sections behind separate loading boundaries, each with a skeleton that has
the dimensions of the final content and a fade-in when the content replaces it.
Independent sections SHALL appear as soon as their own data is ready, without
waiting for each other. Skeletons use the shared `Skeleton` primitive.
The skeleton SHALL reserve the dimensions of the final content to avoid layout
shift, SHALL animate only when the user has not requested reduced motion, and
SHALL be hidden from assistive technology.

#### Scenario: Slow data load

- **WHEN** a signed-in user opens a page and one section's data takes time to load
- **THEN** the shell and every ready section are visible while that section shows its skeleton
- **AND** the section fades in without shifting the layout when its data arrives

#### Scenario: Reduced motion

- **GIVEN** the user prefers reduced motion
- **WHEN** a skeleton is shown
- **THEN** it does not pulse
