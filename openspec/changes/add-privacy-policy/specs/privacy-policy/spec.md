# Spec Delta

## Purpose

Informs users how their personal data is processed, as GDPR (RODO) art. 13 and 14 require. A public page shows a policy text that an admin maintains in the application settings, and a built-in generic Polish template helps the operator write it.

## ADDED Requirements

### Requirement: Public Privacy Policy Page

The system SHALL serve the saved policy text at `/privacy` to everyone, signed in or not, without redirecting to the login page.

#### Scenario: Signed-out visitor reads the policy

- **GIVEN** an admin has saved a policy text
- **WHEN** a signed-out visitor opens `/privacy`
- **THEN** the text is shown and the visitor is not redirected

#### Scenario: Signed-in user reads the policy

- **GIVEN** an admin has saved a policy text
- **WHEN** a signed-in tenant or admin opens `/privacy`
- **THEN** the same text is shown

#### Scenario: No policy saved yet

- **GIVEN** no policy text is saved
- **WHEN** anyone opens `/privacy`
- **THEN** the page shows `Polityka prywatności nie została jeszcze opublikowana.` and does not show the built-in template

#### Scenario: Page title

- **WHEN** `/privacy` renders
- **THEN** the document title is `Polityka prywatności` followed by the application name

### Requirement: Safe Policy Rendering

The system SHALL render the saved text as a limited Markdown subset into elements built by the application, never as raw HTML. The subset is headings from `#` to `###`, paragraphs, bulleted and numbered lists, bold text and links.

#### Scenario: Supported syntax

- **GIVEN** a saved text with a heading, a paragraph, a bulleted list, a numbered list, `**bold**` and a link
- **WHEN** `/privacy` renders
- **THEN** each is shown as the matching heading, paragraph, list item, bold text and link

#### Scenario: Raw HTML is shown as text

- **GIVEN** a saved text containing `<script>alert(1)</script>`
- **WHEN** `/privacy` renders
- **THEN** the characters are shown literally and nothing is executed

#### Scenario: Only safe link targets become links

- **GIVEN** links using `https:`, `http:`, `mailto:` and `javascript:`
- **WHEN** `/privacy` renders
- **THEN** the first three are links and the `javascript:` one is shown as plain text

#### Scenario: Links to other sites

- **GIVEN** a link to another site
- **WHEN** it renders
- **THEN** it opens with `rel="noopener noreferrer"`

### Requirement: Policy Links and Information Notices

The system SHALL link to `/privacy` with the text `Polityka prywatności` wherever personal data is collected or managed, and SHALL show an information sentence, not a consent checkbox, on the login and register forms.

#### Scenario: Auth pages

- **WHEN** any page of the auth group renders (login, register, forgot password, reset password, email verification, change password)
- **THEN** a `Polityka prywatności` link to `/privacy` is shown in the page footer

#### Scenario: Login and register notice

- **WHEN** the login or the register form renders
- **THEN** a sentence under the form tells the user that using the service involves processing personal data and links to the policy
- **AND** no checkbox is added and submitting does not depend on the link

#### Scenario: Tenant and admin panels

- **WHEN** a dashboard page or an admin page renders
- **THEN** the footer shows the `Polityka prywatności` link next to the version

#### Scenario: Profile page

- **GIVEN** a signed-in user
- **WHEN** they open the profile page
- **THEN** a `Prywatność` card links to the policy and says that questions about personal data and requests under data protection law go to the administrator named in it

#### Scenario: Link is always present

- **GIVEN** no policy text is saved
- **WHEN** any page listed above renders
- **THEN** the link is still shown

### Requirement: Admin Policy Editor

The system SHALL let an admin write and save the policy text on the `Ustawienia` page at `/admin/settings`, in a card separate from the history window card, through an admin-only Server Action.

#### Scenario: Admin sees the saved text

- **GIVEN** an admin with a saved policy
- **WHEN** they open `/admin/settings`
- **THEN** a `Polityka prywatności` card shows a text area labelled `Treść polityki prywatności` containing the saved text, a hint listing the supported syntax and the length limit

#### Scenario: Admin saves the policy

- **GIVEN** an admin who typed a policy text
- **WHEN** they click `Zapisz`
- **THEN** the text is stored, the success alert `Zapisano ustawienia` is shown, and `/privacy` shows the new text on the next request

#### Scenario: Empty text unpublishes

- **GIVEN** an admin with a saved policy
- **WHEN** they clear the text area and save
- **THEN** no text is stored and `/privacy` shows the not-published message

#### Scenario: Loading the template

- **GIVEN** an admin on the settings page
- **WHEN** they click `Wczytaj szablon`
- **THEN** the built-in template is placed in the text area without being saved
- **AND** if the text area already had text, the admin is asked to confirm before it is replaced

#### Scenario: Unresolved placeholders block saving

- **GIVEN** a text that still contains a `[[` … `]]` placeholder
- **WHEN** the admin saves
- **THEN** the save is rejected with an error telling them to fill in or remove the fields marked with double square brackets, and nothing is stored

#### Scenario: Text over the limit

- **GIVEN** a text longer than 50 000 characters
- **WHEN** it is saved
- **THEN** the action returns an invalid result and the database would also reject it

#### Scenario: Non-admin cannot save

- **GIVEN** an unauthenticated user or a tenant
- **WHEN** they invoke the save action with a policy text
- **THEN** it returns an unauthenticated or forbidden result and nothing is stored

### Requirement: Built-In Policy Template

The system SHALL ship a generic Polish policy template that the editor can load. The template is never published by itself.

#### Scenario: Template is not public

- **GIVEN** no policy text is saved
- **WHEN** anyone opens `/privacy`
- **THEN** the template text is not shown

#### Scenario: Controller information items

- **WHEN** the template is loaded
- **THEN** it contains headed sections for the controller and its contact details, the data protection officer if any, the purposes and the legal basis of each processing activity, the legitimate interests pursued, the recipients, transfers outside the European Economic Area, retention periods, the data subject's rights and how to use them, the right to withdraw consent where consent is used, the right to complain to the President of the Personal Data Protection Office, whether providing data is required and what follows from not providing it, and automated decision-making

#### Scenario: Data not obtained from the person

- **WHEN** the template is loaded
- **THEN** a section explains that the data of owners and tenants is imported from the controller's accounting system, names the categories of that data and its source, as art. 14 requires for people who did not give it themselves

#### Scenario: Cookies and similar technologies

- **WHEN** the template is loaded
- **THEN** a section lists the strictly necessary session and security cookies, the list-view preference cookie, the data the bot check handles, and an optional analytics paragraph marked for removal, and cites art. 399 of the Electronic Communications Law

#### Scenario: Describes only what the application does

- **WHEN** the template is loaded
- **THEN** it describes the accounts, the imported owner and apartment data, the e-mails the application sends, the Cloudflare Turnstile check and the Google sign-in, and it leaves everything an operator decides as a `[[…]]` placeholder: the controller, hosting and other recipients, retention periods and the transfer safeguards

#### Scenario: No deployment-specific content

- **WHEN** the template text is inspected
- **THEN** it names no hosting provider, monitoring or analytics product, cloud region or backup arrangement of any deployment

#### Scenario: Optional sections are marked

- **WHEN** the template is loaded
- **THEN** every part that does not apply to every deployment is marked with a `[[…]]` instruction to remove it if it does not apply
