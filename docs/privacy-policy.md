# Privacy policy

The application shows a privacy policy at `/privacy`, open to everyone (also to
signed-out visitors and to users who must still change their password). The text
is not in the code: an admin writes it in the settings, and the built-in
template gives a complete starting point. Nothing is published until an admin
saves a text.

The link `Polityka prywatności` sits in the footer of every page (login and
registration pages, the resident panel, the admin panel and the policy page
itself) and in the footer of every e-mail. It is always shown. Until a text is
saved the page says `Polityka prywatności nie została jeszcze opublikowana.`

## Publish the policy

1. Sign in as an admin and open **Ustawienia** (`/admin/settings`).
2. In the **Polityka prywatności** card click **Napisz politykę** (or **Edytuj**).
3. The dialog opens on **Podgląd**, which shows the text exactly as visitors
   will see it. Click **Zacznij od szablonu** or **Wczytaj szablon**. The
   template is only placed in the editor; it is not saved.
4. Every `[[…]]` field is highlighted and counted in the footer of the dialog.
   Open **Edycja**, replace each field with the real value, or delete the
   sentence or section when it does not apply.
5. Click **Zapisz**. Saving is refused while any `[[…]]` remains, so a template
   cannot be published by accident. Saving an empty text unpublishes the page.

If you close the dialog with unsaved changes you are asked to confirm.

## Text format

A small subset of Markdown, shown with React elements only (raw HTML is shown
as plain text):

| You write                | You get                                   |
| ------------------------ | ----------------------------------------- |
| `#`, `##`, `###` + space | headings                                  |
| `- item` or `* item`     | bulleted list                             |
| `1. item`                | numbered list                             |
| `**text**`               | bold                                      |
| `[text](https://…)`      | link (`https:`, `http:`, `mailto:`, `/x`) |
| blank line               | new paragraph                             |

Other link targets, such as `javascript:`, stay as plain text. The limit is
50 000 characters.

## What the template covers

It is written in plain Polish, in the second person, and describes only what the
software does: accounts, the Google sign-in, the owner and apartment data that an
admin imports, the e-mails the application sends, the Cloudflare Turnstile
check, the cookies and local storage it uses, and the measures it enforces. It
follows art. 13 and 14 GDPR (controller, purposes and legal bases, legitimate
interests, recipients, transfers outside the EEA, retention, whether giving the
data is required, automated decisions, rights and the complaint to the
President of the Personal Data Protection Office) and art. 399 of the Electronic
Communications Law for cookies.

Everything that depends on the deployment is a `[[…]]` field: the controller and
its contact details, the data protection officer, the e-mail and hosting
providers, other recipients, the transfer safeguards, retention periods, the
source system of the imported data, the additional security measures and the
effective date.

## Fields to fill in and parts to remove

- **Controller and contact** (`W skrócie`, `Administrator danych i kontakt`, `Jak skorzystać z praw`): name, address, the e-mail
  address for data requests, the NIP or KRS number if there is one.
- **Data protection officer** (`Administrator danych i kontakt`): fill in or delete the paragraph.
- **Processor only** (`Gdy tylko przetwarzamy dane na zlecenie`): keep only when the operator processes the
  data for another controller, such as an association. Otherwise delete the
  whole section.
- **Source system** (`Skąd mamy Twoje dane`): the system the import files come from.
- **Recipients** (`Komu przekazujemy dane`): the e-mail provider, the hosting provider and any
  other recipient. Delete the Cloudflare or Google item when that feature is
  switched off (`TURNSTILE_*` and `GOOGLE_*` in [configuration](configuration.md)).
- **Transfers outside the EEA** (`Czy dane trafiają poza Europejski Obszar Gospodarczy`): the safeguard for each recipient
  outside the EEA, or delete the paragraph when there is none.
- **Retention** (`Jak długo przechowujemy dane`): a period for each category of data, including
  logs and backups.
- **Analytics** (`Pliki cookies i podobne technologie`): if `TRACKING_SCRIPT` is
  set, describe the tool and the consent it needs, or delete the paragraph.
- **Security measures** (`Jak chronimy dane`): add the technical and organisational
  measures of your deployment, or delete the bullet.
- **Effective date and how changes are announced** (`Zmiany tej polityki`).

## Keep it correct

The template is generic and is not legal advice. Before publishing, check it
against what your deployment really does: who the controller is, which
providers receive data, how long data and backups are kept. Review the policy
whenever the processing changes, for example a new e-mail provider, a new
monitoring tool or analytics. The policy saved in the settings replaces the
whole text, so when the application changes what it processes, load the template
again and compare it with your text.

## Logs and traces

The application logs the account ID, never an e-mail address, a name, a token or
an IP address, and spans sent to an OpenTelemetry backend carry no query string
or client address. See [code conventions](code-conventions.md). Describe in the
policy where your logs and backups are kept and for how long.

The page has a back button and a print button (print dialog, so also "save as PDF"). The printed page leaves out the buttons and the footer and is always dark on white.
