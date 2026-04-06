## 1. Registration Auto-Login

- [x] 1.1 Update registration flow so successful signup triggers automatic credentials sign-in and dashboard redirect
- [x] 1.2 Preserve manual-login fallback messaging when automatic sign-in fails

## 2. Turnstile Compatibility

- [x] 2.1 Ensure post-registration auto-login works when Turnstile is enabled by introducing a secure bypass token path
- [x] 2.2 Keep standard login Turnstile validation unchanged for non-bypass login attempts

## 3. Test Coverage

- [x] 3.1 Add/update unit tests for register page auto-login behavior
- [x] 3.2 Add/update auth provider tests for Turnstile bypass and fallback validation
- [x] 3.3 Update E2E registration test to assert redirect to dashboard after registration
