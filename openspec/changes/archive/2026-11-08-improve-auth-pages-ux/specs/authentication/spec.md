# Spec Delta

## ADDED Requirements

### Requirement: Instructional Auth Form Placeholders

Every input on the login, registration, forgot-password and reset-password
pages SHALL show a Polish placeholder that tells the user what to enter.
Placeholders SHALL NOT repeat a sample value such as `email@example.com` and
SHALL NOT replace the visible label.

#### Scenario: Email placeholder

- **GIVEN** the login, registration or forgot-password page
- **WHEN** the page is rendered
- **THEN** the email input shows the placeholder `Wprowadź adres e-mail`

#### Scenario: Password placeholders

- **GIVEN** any auth page with a password field
- **WHEN** the page is rendered
- **THEN** the initial password field shows `Wprowadź hasło` (or
  `Wprowadź nowe hasło` on the reset page), and the confirmation field shows
  `Powtórz hasło` (or `Powtórz nowe hasło` on the reset page)

#### Scenario: Labels remain the field names

- **GIVEN** any auth input with a placeholder
- **WHEN** the placeholder is shown
- **THEN** the visible label remains rendered and associated with the input, so
  the field has an accessible name even after the user types

### Requirement: Password Visibility Toggle

Every password field on the auth pages SHALL provide a control that switches
the field between masked and visible text. The control SHALL be a button that
does not submit the form, SHALL be reachable by keyboard, and SHALL be named
`Pokaż hasło` while the value is masked and `Ukryj hasło` while it is visible.

#### Scenario: Password is masked by default

- **GIVEN** an auth page with a password field
- **WHEN** the page renders
- **THEN** the field type is `password` and the toggle is named `Pokaż hasło`

#### Scenario: Reveal and re-hide the password

- **GIVEN** a password field containing a value
- **WHEN** the user activates the visibility toggle twice
- **THEN** the first activation shows the value as text and names the toggle
  `Ukryj hasło`, and the second activation masks it again

#### Scenario: Toggle does not submit the form

- **GIVEN** a filled auth form
- **WHEN** the user activates a password visibility toggle
- **THEN** no authentication request is sent

#### Scenario: Password fields toggle independently

- **GIVEN** the registration or reset form with two password fields
- **WHEN** the user reveals the first field
- **THEN** only the first field becomes visible and the second stays masked

### Requirement: Stable Auth Card While Widgets Load

The auth card SHALL reserve the vertical space needed by the Turnstile widget
and the Google sign-in option before their configuration is known, so loading
them SHALL NOT resize the card or move the form controls the user is about to
interact with. A placeholder SHALL occupy the reserved space while the
configuration is loading; an option that resolves as disabled SHALL collapse
only after the configuration resolves.

#### Scenario: Configuration is slow to load

- **GIVEN** the public Turnstile and Google configuration has not resolved yet
- **WHEN** an auth page renders
- **THEN** each widget area shows a placeholder with the same height as the
  final widget, and the card height does not change when the configuration
  arrives

#### Scenario: A widget is disabled

- **GIVEN** the resolved configuration reports Turnstile or Google as disabled
- **WHEN** the page settles
- **THEN** that option is removed from the card and no empty reserved gap is
  left behind

#### Scenario: Repeat visit uses the browser cache

- **GIVEN** a successful config response that is still fresh in the browser's
  HTTP cache
- **WHEN** the user reloads an auth page
- **THEN** the config request is served from the browser cache without a
  network round-trip and the widgets appear without waiting for the server

### Requirement: Public Auth Configuration Caching

The public Turnstile and Google config endpoints SHALL allow the browser to
cache successful responses with a short freshness window measured in minutes.
Cached entries SHALL contain only public values (site key and enabled flags),
and a response older than the freshness window SHALL be revalidated so a
changed Turnstile or Google configuration is picked up.

#### Scenario: Cacheable response

- **GIVEN** either public config endpoint receives a request
- **WHEN** it responds with the config
- **THEN** the response carries a `Cache-Control` header that allows public
  caching with a non-zero `max-age`

#### Scenario: Fresh response is reused

- **GIVEN** a config response that is still inside its freshness window
- **WHEN** an auth page requests the same endpoint
- **THEN** the browser serves the cached response without contacting the server

#### Scenario: Stale response is revalidated

- **GIVEN** a cached config response older than its freshness window
- **WHEN** an auth page requests the endpoint again
- **THEN** the browser fetches the current response and the page reflects the
  current enabled state

#### Scenario: Payload stays public

- **GIVEN** any cached config response
- **WHEN** it is inspected
- **THEN** it contains only the public site key and enabled flags, never the
  Turnstile secret key or Google client secret

### Requirement: Turnstile Widget Presentation

The Turnstile widget SHALL read as part of the auth form: it SHALL span the same
width as the form controls, SHALL follow the active light or dark application
theme, and SHALL sit in a reserved slot that keeps its height while the
challenge is pending, solved or reset. The widget SHALL NOT render when
Turnstile is disabled or no site key is configured.

#### Scenario: Widget matches the form width

- **GIVEN** an enabled Turnstile configuration
- **WHEN** the widget renders on desktop or mobile
- **THEN** it spans the width of the form controls and does not overflow the
  card

#### Scenario: Widget follows the active theme

- **GIVEN** the application is in dark mode
- **WHEN** the Turnstile widget renders
- **THEN** the widget uses its dark appearance, and in light mode it uses its
  light appearance

#### Scenario: Disabled Turnstile

- **GIVEN** Turnstile is disabled or the site key is missing
- **WHEN** an auth page renders
- **THEN** no Turnstile widget and no empty captcha slot are shown

#### Scenario: Height is stable across challenge states

- **GIVEN** a rendered Turnstile widget
- **WHEN** the challenge moves from pending to solved or is reset after a failed
  submit
- **THEN** the form does not change height

### Requirement: Auth Page Action Order

The login page SHALL present its actions in this order: primary submit, then the
OAuth sign-in option separated by the `Lub` divider, then the registration link.
Other auth pages SHALL keep their primary submit before any return link. The
divider label SHALL be painted on the card background so the line does not show
through it.

#### Scenario: Login action order

- **GIVEN** the login page with Google sign-in enabled
- **WHEN** the page is rendered
- **THEN** the `Zaloguj się` button comes before the `Lub` divider and the
  Google button, and the registration link comes last

#### Scenario: Login without Google

- **GIVEN** the login page with Google sign-in disabled
- **WHEN** the page is rendered
- **THEN** neither the `Lub` divider nor the Google button is shown, and the
  registration link immediately follows the submit button

### Requirement: Consistent Auth Form Feedback

Every auth form SHALL surface a failed submission as an alert with `role`
`alert`, a Polish message, and destructive styling, and the alert SHALL animate
in and out. While a request is in flight the submit button SHALL show a loading
indicator and the form controls SHALL be disabled.

#### Scenario: Failed login shows an alert

- **GIVEN** the login form with invalid credentials
- **WHEN** the user submits it
- **THEN** a destructive alert with `role` `alert` shows the credentials error
  and the form remains usable

#### Scenario: Loading feedback

- **GIVEN** any auth form
- **WHEN** the user submits it and the request is in flight
- **THEN** the submit button shows a spinner and a loading label, and the
  controls cannot be submitted again

#### Scenario: Error alert animates

- **GIVEN** an auth form showing an error alert
- **WHEN** the error is cleared
- **THEN** the alert animates out instead of disappearing abruptly
