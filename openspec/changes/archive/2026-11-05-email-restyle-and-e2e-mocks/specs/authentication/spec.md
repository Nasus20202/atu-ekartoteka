# Spec Delta

## ADDED Requirements

### Requirement: Provider Endpoint Overrides

The system SHALL allow the Cloudflare Turnstile verification endpoint and the Google OpenID issuer to be overridden by environment variables for local and test environments, defaulting to the real endpoints.

#### Scenario: Defaults

- **GIVEN** `TURNSTILE_VERIFY_URL` and `GOOGLE_ISSUER_URL` are unset
- **WHEN** a Turnstile token is verified or a Google sign-in starts
- **THEN** the Cloudflare siteverify endpoint and Google's own endpoints are used

#### Scenario: Turnstile override

- **GIVEN** `TURNSTILE_VERIFY_URL` is set
- **WHEN** a token is verified
- **THEN** the secret and token are posted to that URL and the result is handled exactly as for Cloudflare, failing closed on any error

#### Scenario: Google override

- **GIVEN** `GOOGLE_ISSUER_URL` is set
- **WHEN** a user signs in with Google
- **THEN** the OIDC flow uses that issuer's discovery document, and account creation and linking behave as for the real provider
