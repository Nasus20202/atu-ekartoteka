# privacy-policy Specification

## Purpose

Informs users how their personal data is processed, as GDPR (RODO) art. 13 and 14 require. A public page shows a policy text that an admin maintains in the application settings, and a built-in generic Polish template gives the operator a complete starting point.

## Requirements

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

### Requirement: Footer With Version And Policy Link

The system SHALL end every page of the auth group, the tenant panel, the admin panel and the policy page with a footer that shows the application version on the left and a `Polityka prywatności` link to `/privacy` on the right. The footer SHALL be part of the page flow and SHALL never cover content.

#### Scenario: Auth pages

- **WHEN** any page of the auth group renders (login, register, forgot password, reset password, email verification, change password)
- **THEN** the footer shows the version on the left and the policy link on the right

#### Scenario: Tenant and admin panels

- **WHEN** a dashboard page or an admin page renders
- **THEN** the same footer ends the page, and no version label is fixed to a screen corner

#### Scenario: Short content

- **GIVEN** a page whose content is shorter than the screen
- **WHEN** it renders
- **THEN** the footer is at the bottom edge of the screen and the page does not scroll

#### Scenario: Long content

- **GIVEN** a page whose content is taller than the screen
- **WHEN** the user scrolls to the end
- **THEN** the footer is below the content and covers none of it, on a phone as well as on a desktop

#### Scenario: Legible and easy to hit

- **WHEN** the footer renders in the light or the dark theme
- **THEN** the policy link text has a contrast ratio of at least 4.5:1 against the page background and an interactive area at least 44 px high, while the version is shown more quietly

#### Scenario: Link is always present

- **GIVEN** no policy text is saved
- **WHEN** any page with the footer renders
- **THEN** the link is still shown

### Requirement: Admin Policy Editor

The system SHALL let an admin manage the policy on the `Ustawienia` page at `/admin/settings`: a card shows whether a policy is published, and a modal opened from it edits the text through an admin-only Server Action.

#### Scenario: Status card

- **WHEN** an admin opens `/admin/settings`
- **THEN** a `Polityka prywatności` card, separate from the history window card, shows `Opublikowana` with `Edytuj` and `Zobacz stronę` buttons, or `Nieopublikowana` with a button to write the policy

#### Scenario: Preview by default

- **GIVEN** a saved policy
- **WHEN** the admin clicks `Edytuj`
- **THEN** a modal opens on the `Podgląd` tab, showing the text rendered exactly as `/privacy` renders it, with a `Edycja` tab beside it

#### Scenario: Editing

- **WHEN** the admin opens the `Edycja` tab
- **THEN** a labelled text area contains the Markdown text, with a hint listing the supported syntax and the limit of 50 000 characters

#### Scenario: Unresolved placeholders

- **GIVEN** a text that still contains a `[[` … `]]` placeholder
- **WHEN** it is shown in the preview
- **THEN** each placeholder is highlighted and the modal footer shows how many remain
- **AND** saving is rejected with a message telling the admin to fill in or remove the fields marked with double square brackets, and nothing is stored

#### Scenario: Saving

- **GIVEN** a text without placeholders
- **WHEN** the admin clicks `Zapisz`
- **THEN** the text is stored, the success alert `Zapisano ustawienia` is shown, and `/privacy` shows the new text on the next request

#### Scenario: Loading the template

- **WHEN** the admin clicks `Wczytaj szablon`
- **THEN** the built-in template is placed in the editor without being saved
- **AND** if the editor already had text, the admin is asked to confirm before it is replaced

#### Scenario: Nothing written yet

- **GIVEN** no policy is saved
- **WHEN** the admin opens the modal
- **THEN** an empty state offers `Zacznij od szablonu`

#### Scenario: Empty text unpublishes

- **GIVEN** a saved policy
- **WHEN** the admin clears the text and saves
- **THEN** no text is stored and `/privacy` shows the not-published message

#### Scenario: Unsaved changes

- **GIVEN** edited text that has not been saved
- **WHEN** the admin closes the modal
- **THEN** they are asked to confirm before the changes are discarded

#### Scenario: Text over the limit

- **GIVEN** a text longer than 50 000 characters
- **WHEN** it is saved
- **THEN** the action returns an invalid result and nothing is stored

#### Scenario: Phone width

- **WHEN** the modal opens on a phone-width screen
- **THEN** it fills the screen with its tabs at the top and its buttons fixed at the bottom

#### Scenario: Non-admin cannot save

- **GIVEN** an unauthenticated user or a tenant
- **WHEN** they invoke the save action with a policy text
- **THEN** it returns an unauthenticated or forbidden result and nothing is stored

### Requirement: Built-In Policy Template

The system SHALL ship a generic Polish policy template that the editor can load, complete enough to publish after the operator fills in its placeholders. The template is never published by itself.

#### Scenario: Template is not public

- **GIVEN** no policy text is saved
- **WHEN** anyone opens `/privacy`
- **THEN** the template text is not shown

#### Scenario: Plain language and a summary first

- **WHEN** the template is loaded
- **THEN** it addresses the reader in the second person, opens with a short summary of who processes what and how to reach the controller, and gives every section a heading

#### Scenario: Controller information items

- **WHEN** the template is loaded
- **THEN** it contains sections for the controller and its contact details, the data protection officer if any, the purposes and the legal basis of each processing activity, the legitimate interests pursued, the categories of data, the recipients, transfers outside the European Economic Area, retention periods, whether providing data is required and what follows from not providing it, and automated decision-making

#### Scenario: Different readers

- **WHEN** the template is loaded
- **THEN** it says in separate parts what applies to people who created an account themselves, to owners and tenants whose account an administrator created from imported data, and to people who received an e-mail they did not expect

#### Scenario: Data not obtained from the person

- **WHEN** the template is loaded
- **THEN** a section names the categories of imported data, says the controller's accounting system is its source and who may have added the e-mail address, as art. 14 requires for people who did not give the data themselves

#### Scenario: E-mail the reader did not expect

- **WHEN** the template is loaded
- **THEN** it explains why such an e-mail can arrive, including a mistyped address, and what the reader should do about it

#### Scenario: Operator that only processes data

- **WHEN** the template is loaded
- **THEN** an optional part, marked for removal when it does not apply, explains that when the operator only processes data for another controller, requests to change or delete data go to that controller

#### Scenario: Rights and how to use them

- **WHEN** the template is loaded
- **THEN** it lists the rights of access, rectification, erasure with its exceptions, restriction, portability, objection, not being subject to automated decisions, and withdrawal of consent where consent is used, and the right to complain to the President of the Personal Data Protection Office with its address
- **AND** it says in practice how to submit a request, that the controller may ask for identification, that the answer comes within one month and may be extended by two months for complex requests, and that it is free unless the request is manifestly unfounded or excessive

#### Scenario: Cookies and similar technologies

- **WHEN** the template is loaded
- **THEN** a section explains what cookies and local storage are, lists the strictly necessary session and security cookies, the list-view preference and the data the bot check handles, says that no marketing cookies are used, has an optional analytics paragraph marked for removal, tells the reader how to manage cookies in the browser, and cites art. 399 of the Electronic Communications Law

#### Scenario: Security measures

- **WHEN** the template is loaded
- **THEN** it names only measures the application itself enforces and states that no special categories of data are processed

#### Scenario: Describes only what the application does

- **WHEN** the template is loaded
- **THEN** it covers the accounts, the imported owner and apartment data, the e-mails the application sends, the Cloudflare Turnstile check and the Google sign-in, and it leaves everything an operator decides as a `[[…]]` placeholder: the controller, hosting and other recipients, retention periods and the transfer safeguards

#### Scenario: No deployment-specific content

- **WHEN** the template text is inspected
- **THEN** it names no hosting provider, monitoring or analytics product, cloud region or backup arrangement of any deployment

#### Scenario: Optional parts are marked

- **WHEN** the template is loaded
- **THEN** every part that does not apply to every deployment is marked with a `[[…]]` instruction to remove it if it does not apply

#### Scenario: Template parses cleanly

- **WHEN** the template is rendered with the policy renderer
- **THEN** no heading, list, bold text or link falls back to literal Markdown characters
