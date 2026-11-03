## ADDED Requirements

### Requirement: Streaming-Tolerant E2E Locators

End-to-end tests SHALL NOT assume a page contains one copy of its content right
after navigation. Locators that match text or inputs SHALL be visibility-aware, and
page navigation helpers SHALL wait for streamed content to settle and for
hydration before interacting.

#### Scenario: Navigating to a streamed page

- **WHEN** a test navigates to a page whose sections stream in
- **THEN** it interacts only after hidden streaming segments are gone
