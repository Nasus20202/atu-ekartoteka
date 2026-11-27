# utility-settlements Specification

## Purpose

Imports utility settlements, meter readings and annual cost settlements from PDF printouts, checks them against stored data and shows them to the tenant of the apartment and to admins.

## Requirements

### Requirement: Settlement Import Section

The admin import page SHALL have a section `Rozliczenia (PDF)`, separate from the text file import, that takes one or more PDF files, previews them and imports them after the admin confirms. The section SHALL offer a clean import and an import without validation; changing either SHALL discard the preview. Only admins SHALL be able to preview or import.

#### Scenario: Preview before writing

- **GIVEN** an admin who selected settlement PDF files
- **WHEN** they request the preview
- **THEN** each file is listed with its type, records, errors and warnings, and nothing is written

#### Scenario: Import after preview

- **GIVEN** a previewed file without errors
- **WHEN** the admin imports it
- **THEN** its settlements are stored and the result shows how many were created, updated and unchanged

#### Scenario: Findings downloadable

- **GIVEN** a preview or import result with errors or warnings
- **WHEN** the admin downloads them
- **THEN** a text file lists each finding with its file, page and apartment

#### Scenario: Not an admin

- **WHEN** a signed-out user or a tenant calls the preview or the import
- **THEN** the request is rejected and nothing is read or written

#### Scenario: Request body above the limit

- **GIVEN** an admin whose preview or import request declares a body of more than 200 MB
- **WHEN** the request is sent
- **THEN** it is answered with 413 and a Polish message, and nothing is read or written

### Requirement: Document Type Detected From Structure

The system SHALL decide from the structure of the content whether a file is a utility settlement or an annual cost settlement. It SHALL NOT use the file name, the PDF metadata or the document title.

#### Scenario: Utility settlement

- **GIVEN** a file with service blocks and a meter table
- **WHEN** it is previewed
- **THEN** it is treated as a utility settlement

#### Scenario: Annual settlement without a title

- **GIVEN** a file with proportional cost items and no document title
- **WHEN** it is previewed
- **THEN** it is treated as an annual cost settlement

#### Scenario: Unknown document

- **GIVEN** a PDF that is neither, or an unreadable file
- **WHEN** it is previewed
- **THEN** the file has an error and cannot be imported

### Requirement: Unrecognised Content Rejected

The system SHALL reject a file that has unrecognised text inside a settlement record, or a row of settlement data outside any record. Other text above a record's owner block and after its total SHALL be ignored.

#### Scenario: Unknown row inside a record

- **GIVEN** a record with a row that matches no known element
- **WHEN** the file is previewed
- **THEN** the file has an error naming the page and the row

#### Scenario: Data outside a record

- **GIVEN** a service line or meter row that follows no owner block
- **WHEN** the file is previewed
- **THEN** the file has an error naming the page and the row

#### Scenario: Footer note

- **GIVEN** a record followed by payment instructions
- **WHEN** the file is previewed
- **THEN** the instructions are ignored and not stored

### Requirement: Records Assembled Across Pages

The system SHALL build one settlement per apartment, owner and period from all pages of a utility file, and one per apartment, owner and period from the items of an annual file, even when they span several pages. The period SHALL come from the printed dates, never from a title.

#### Scenario: One service per page

- **GIVEN** two owners of one apartment whose pages alternate, each page with one service
- **WHEN** the file is previewed
- **THEN** each owner has one record with all of their lines, summary rows and meters, and a total equal to the sum of their page totals

#### Scenario: Items continue on the next page

- **GIVEN** an annual record whose last item is on a second page
- **WHEN** the file is previewed
- **THEN** that item belongs to the record

#### Scenario: Partial year

- **GIVEN** annual items dated from 1 January to 28 February
- **WHEN** the file is imported
- **THEN** the settlement is stored with exactly that period

#### Scenario: Same record twice

- **GIVEN** the same apartment, owner and period in two of the selected files
- **WHEN** they are previewed
- **THEN** both files have an error naming the other file

### Requirement: Owner And Apartment Matching

The system SHALL match each record to exactly one apartment record by apartment and owner name, ignoring letter case and repeated spaces. A utility record SHALL be found by its printed external apartment ID; an annual record by street, building and flat number. The owner's mailing address SHALL NOT be used.

#### Scenario: Former owner

- **GIVEN** a record naming a former owner of an apartment that now has a new owner
- **WHEN** it is previewed
- **THEN** it is matched to the former owner's apartment record, never to the current owner's

#### Scenario: Name differs by an annotation

- **GIVEN** a printed name that differs from exactly one stored name only by trailing annotations such as `#5` or a single letter
- **WHEN** it is previewed
- **THEN** the record requires the admin's confirmation, showing both names

#### Scenario: No match

- **GIVEN** a record whose apartment or owner matches no stored record, or more than one
- **WHEN** it is previewed
- **THEN** the file has an error naming the apartment and the printed owner

### Requirement: Settlements Stored As Printed

The system SHALL store lines, summary rows, meter rows and cost items with the printed names, dates, quantities, prices and amounts. A result printed as `Nadpłata` SHALL be stored negative and an amount to pay positive. The line kind SHALL come from the column header (`Zaliczka` or `Do zapłaty`). No utility type SHALL be stored.

#### Scenario: Zero consumption line

- **GIVEN** a line under `Do zapłaty` with quantity 0
- **WHEN** it is imported
- **THEN** it is stored as a consumption line

#### Scenario: Unknown column header

- **GIVEN** a service block with another amount column header
- **WHEN** the file is previewed
- **THEN** the file has an error

#### Scenario: Repeated meter rows

- **GIVEN** a record whose pages repeat the same meter rows
- **WHEN** it is imported
- **THEN** each meter row is stored once

### Requirement: Utility Grouping By Code

The system SHALL group utility lines, summary rows and meters by the code used in the summary rows, such as `CW`, `ZW` or `CO`. A line belongs to a code when its name contains exactly one of the record's codes as a separate word.

#### Scenario: Different wording

- **GIVEN** lines named `Wyrównanie zaliczki CW` and `Zaliczka  CO (m3)`
- **WHEN** they are grouped
- **THEN** they belong to `CW` and `CO`

#### Scenario: Name without a code

- **GIVEN** a line whose name contains none of the codes
- **WHEN** the file is previewed
- **THEN** a warning names the line, the checks of that record that depend on grouping are skipped with that stated, and the file can still be imported

### Requirement: Consistency Errors

The system SHALL treat as an error any quantity that contradicts the file itself: a meter consumption that is not the difference of its readings, a summary difference that is not consumption minus advance, grouped line quantities that differ from the summary, and an owner total that differs from the sum of that owner's apartment totals by more than 0.01 zł.

#### Scenario: Wrong reading difference

- **GIVEN** readings 10,000 and 12,000 with consumption 3,000
- **WHEN** the file is previewed
- **THEN** the file has an error and cannot be imported

### Requirement: Ambiguous Rows Are Errors

The system SHALL treat as an error a line or annual item printed twice in one record, rows of one meter that contradict each other, and a value with more digits or decimal places than can be stored.

#### Scenario: Line printed twice

- **GIVEN** a record with the same line twice
- **WHEN** the file is previewed
- **THEN** the file has an error and cannot be imported

### Requirement: Rounding Differences Are Warnings

As in the text file import, the system SHALL report an amount that differs from its calculated value by more than 0.01 zł as a warning, SHALL NOT block the file for it and SHALL store the printed amount. This applies to line amounts, summary amounts, totals and the annual cost formula.

#### Scenario: Within tolerance

- **GIVEN** an amount that differs from the calculated value by 0.01 zł
- **WHEN** the file is previewed
- **THEN** there is no warning

#### Scenario: Annual rounding adjustment

- **GIVEN** a printed item amount of -30.78 where the formula gives -30.7525
- **WHEN** the file is imported
- **THEN** a warning states the difference and -30.78 is stored

#### Scenario: Coefficient mismatch

- **GIVEN** a printed coefficient that is not the flat basis divided by the community basis rounded to 4 decimals
- **WHEN** the file is previewed
- **THEN** a warning is shown

### Requirement: Billed Consumption Compared With Meters

The system SHALL show a warning when the consumption billed for a utility differs from the summed consumption of its meters, or when those meters use different units.

#### Scenario: Billed quantity differs

- **GIVEN** consumption lines of 10.000 for a utility whose meters show 9.000
- **WHEN** the file is previewed
- **THEN** a warning states both values and the file can be imported

### Requirement: Utility Settlements Checked Against Charges

For each utility, the advance quantity, the difference and the settlement amount SHALL equal the apartment's advance and settlement charges in the months of the period, annual allocation charges excluded. Quantities SHALL match exactly and amounts within 0.01 zł; otherwise the file has an error.

#### Scenario: Matching charges

- **GIVEN** stored charges that agree with the settlement
- **WHEN** the file is previewed
- **THEN** no charge finding is shown

#### Scenario: Different quantity

- **GIVEN** an advance quantity that differs from the stored charges
- **WHEN** the file is previewed
- **THEN** the file has an error stating both values

#### Scenario: Period without charges

- **GIVEN** a period for which the apartment lacks charges for any month
- **WHEN** the file is previewed
- **THEN** a warning states that the record is not verified

### Requirement: Annual Settlements Checked Against Charges

The flat basis of each annual item SHALL equal the apartment's charges of that basis in the period, including matching advances for a settlement basis; a difference above 0.01 zł SHALL be an error. A December allocation charge that equals the item amount SHALL be left out of that sum. An allocation charge SHALL NOT be required, because an item amount may be set off against an overpayment. Community totals that differ by more than 0.05 zł SHALL be a warning.

#### Scenario: Flat basis differs

- **GIVEN** stored charges of the period that do not add up to the flat basis of an item
- **WHEN** the file is previewed
- **THEN** the file has an error that states both amounts

#### Scenario: Item without an allocation charge

- **GIVEN** charges that add up to the flat basis and no December allocation charge for the item amount
- **WHEN** the file is previewed
- **THEN** no error is shown for that item

#### Scenario: Community totals differ

- **GIVEN** community charges that do not add up to the community basis plus the community amount
- **WHEN** the file is previewed
- **THEN** a warning states both totals and the file can be imported

#### Scenario: No allocation charges yet

- **GIVEN** a year without allocation charges for the community and basis
- **WHEN** the file is previewed
- **THEN** a warning states that the item is not verified

### Requirement: Checks Against Stored Settlements

The system SHALL compare a new record with stored settlements. A period that overlaps a different period of the same apartment and kind, stored or among the selected files, SHALL be an error. A start reading that differs from the same meter's end reading on the same date, an end reading that differs from a stored start reading on that date, or a serial number stored for another apartment SHALL be a warning, as SHALL a period outside the owner's validity dates.

#### Scenario: Overlapping files

- **GIVEN** two selected files with overlapping periods of one apartment
- **WHEN** they are previewed
- **THEN** both files have an error

#### Scenario: Gap between periods

- **GIVEN** an earlier reading of a meter dated before the new start date
- **WHEN** the file is previewed
- **THEN** no continuity warning is shown

#### Scenario: Broken continuity

- **GIVEN** a stored end reading of 115.800 on a date and a new start reading of 116.000 on that date
- **WHEN** the file is previewed
- **THEN** a warning states both readings

### Requirement: Idempotent And Confirmed Writes

Each file SHALL be written completely or not at all. A record equal to the stored one, ignoring the issue date and file name, SHALL be left unchanged. A record that differs SHALL replace the stored one only after confirmation. A confirmation SHALL apply only to the content that was previewed. When a record is stored by someone else between the check and the write, the file SHALL fail.

#### Scenario: Same file again

- **GIVEN** an imported file
- **WHEN** it is imported again, or reprinted with a new issue date
- **THEN** nothing is written and its records are counted as unchanged

#### Scenario: Missing confirmation

- **GIVEN** a record that requires confirmation
- **WHEN** the file is imported without it
- **THEN** nothing from that file is written

#### Scenario: One file fails

- **GIVEN** two files of which one has an error
- **WHEN** they are imported
- **THEN** only the other file is written

#### Scenario: Clean text import

- **GIVEN** stored settlements
- **WHEN** the admin runs a clean text file import
- **THEN** the settlements are kept

### Requirement: Clean Settlement Import

The admin SHALL be able to choose a clean settlement import, after confirming it twice. It SHALL remove the stored settlements of the same kind, homeowners association and exact period as the settlements in the files, and write the files, in one transaction. It SHALL do so only when every file can be written. The stored settlements it removes SHALL NOT take part in the overlap and meter history checks, and its records SHALL need no replacement confirmation.

#### Scenario: Preview of what is removed

- **GIVEN** stored settlements of the periods in the selected files
- **WHEN** the admin previews them as a clean import
- **THEN** the preview states how many stored settlements would be removed and nothing is changed

#### Scenario: Periods replaced

- **GIVEN** files without errors
- **WHEN** the admin confirms the clean import
- **THEN** the stored settlements of those periods are removed, including those of apartments that are not in the files, and the records of the files are stored

#### Scenario: Other periods kept

- **GIVEN** stored settlements of another kind, association or period
- **WHEN** a clean import runs
- **THEN** they are kept

#### Scenario: A file with an error

- **GIVEN** several files of which one has an error or misses a confirmation
- **WHEN** a clean import runs
- **THEN** nothing is removed or written and every file says why

#### Scenario: Blocked on the preview

- **GIVEN** a clean import preview with a file that has an error or an unticked confirmation
- **WHEN** it is shown
- **THEN** the import cannot be started and each blocking file is named with its reason and what to do

#### Scenario: Write fails

- **WHEN** writing a clean import fails
- **THEN** the removed settlements are still stored

### Requirement: Settlement Confirmations Highlighted

The confirmations a file requires SHALL be highlighted above its findings with the number ticked, and SHALL change their look once all are ticked. While confirmations of a standard import are unticked, a notice beside the import button SHALL say how many, and that their files will be skipped.

#### Scenario: Unticked confirmation

- **GIVEN** a previewed file that requires a confirmation
- **WHEN** it is not ticked
- **THEN** the confirmations are marked as pending and the notice counts it

#### Scenario: All ticked

- **WHEN** the admin ticks every confirmation
- **THEN** the confirmations are marked as complete and the notice disappears

### Requirement: Settlement Import Without Validation

The admin SHALL be able to switch the validation off, after confirming it twice. The findings of the checks SHALL then be warnings that are shown and do not block. A file that cannot be read or is not a settlement, content that is not recognised, a record without exactly one matching apartment, a duplicate, a value that cannot be stored and a missing confirmation SHALL remain errors.

#### Scenario: Failed check

- **GIVEN** a record whose sums or charges do not agree
- **WHEN** the file is imported without validation
- **THEN** its printed values are stored and the finding is listed as a warning

#### Scenario: Apartment not matched

- **GIVEN** a record that matches no apartment
- **WHEN** the file is imported without validation
- **THEN** nothing from that file is written

### Requirement: Tenant Settlements Page

The page `/dashboard/settlements/{apartmentId}` SHALL show a tenant the settlements of one of their apartments, chosen with a `Lokal` select when they have more than one, in the views `Media`, `Liczniki` and `Koszty rzeczywiste`, each with an `Okres` select where it has several periods. The navbar SHALL link to the section as `Rozliczenia`.

#### Scenario: Own apartments only

- **GIVEN** a tenant who requests an apartment that is not assigned to them
- **WHEN** the page loads
- **THEN** a not-found page is shown and no data of that apartment is read

#### Scenario: Nothing imported

- **GIVEN** an apartment without settlements
- **WHEN** a view is shown
- **THEN** it states that there are no settlements

#### Scenario: One apartment

- **GIVEN** a tenant with one apartment
- **WHEN** they open the page
- **THEN** no `Lokal` select is shown and the apartment is named under the title

#### Scenario: Record not visible

- **GIVEN** a record identifier of another apartment, or of a period outside the history window
- **WHEN** the page loads
- **THEN** a not-found page is shown

#### Scenario: Pending account

- **GIVEN** an account that is not approved
- **WHEN** it opens the page
- **THEN** it is redirected to the dashboard

### Requirement: Settlement Page Addresses

The apartment SHALL be part of the path: `/dashboard/settlements` SHALL redirect to the first of the tenant's apartments, and choosing another one SHALL open its path and keep the view. A chosen period SHALL be named by the `period` (utility) or `year` (annual) query parameter.

#### Scenario: Reload keeps the view

- **GIVEN** a tenant who reads the `Liczniki` view
- **WHEN** they reload the page
- **THEN** the `Liczniki` view opens again, because the address names it

#### Scenario: Section address

- **GIVEN** a tenant with an apartment
- **WHEN** they open `/dashboard/settlements`
- **THEN** they are redirected to `/dashboard/settlements/{apartmentId}` of their first apartment
- **AND** the redirect comes before any of the section address is shown, so only the apartment page shows a skeleton

#### Scenario: Another apartment

- **GIVEN** a tenant with two apartments who reads the `Liczniki` view
- **WHEN** they choose the other apartment
- **THEN** its path opens, without a chosen period, in the `Liczniki` view

### Requirement: Settlement View Address

The tenant page and the admin apartment page SHALL name the chosen view by the `view` query parameter, `meters` or `annual`; without it, or with an unknown value, `Media` SHALL be shown. Choosing a view SHALL keep the other query parameters and SHALL NOT read the data again.

#### Scenario: Shared address

- **GIVEN** an address with `view=annual`
- **WHEN** it is opened
- **THEN** the `Koszty rzeczywiste` view is selected

#### Scenario: Back to the first view

- **GIVEN** an address with `view=meters` and a chosen period
- **WHEN** the `Media` view is chosen
- **THEN** the address keeps the period and names no view

### Requirement: Utility View

The `Media` view SHALL show the period result with the sums of advances and consumption, and one card per utility with its meter line `Licznik nr <serial>, odczyty: <start> → <end> <unit>`, consumption against advance, the result as `nadpłata` or `niedopłata`, and expandable line details. Results SHALL NOT rely on colour alone.

#### Scenario: Overpayment

- **GIVEN** a stored total of -287.80
- **WHEN** the view renders
- **THEN** it shows `Nadpłata za media` and `287,80 zł`

#### Scenario: Price change

- **GIVEN** two advance lines of one utility with different prices
- **WHEN** the details are expanded
- **THEN** both lines are listed with their periods and prices

#### Scenario: Unknown utility

- **GIVEN** a summary code the application has no name for, or a line that cannot be grouped
- **WHEN** the view renders
- **THEN** the code is used as the card name, and the line appears under `Pozostałe` with its printed name

#### Scenario: No meter

- **GIVEN** a utility without a meter row
- **WHEN** its card renders
- **THEN** it states that there is no meter reading

### Requirement: Meters View

The `Liczniki` view SHALL show each meter of the chosen period with its serial number, end reading, reading date and consumption, and a table `Odczyty` of the apartment's visible readings with device, serial number, start and end date, start and end reading and consumption.

#### Scenario: Several periods

- **GIVEN** readings from three periods
- **WHEN** the view renders
- **THEN** the table lists the readings of all three periods, newest first

### Requirement: Readings Table Filter And Order

When the readings come from more than one meter, or the address names one, the table `Odczyty` SHALL offer the select `Licznik` that narrows it to one meter or shows `Wszystkie liczniki`. Every column heading SHALL sort the table by its column, reversing the order when chosen again. The meter cards above the table SHALL NOT change.

#### Scenario: One meter

- **GIVEN** readings from three meters
- **WHEN** the reader chooses one meter
- **THEN** only its readings are listed and the address names it

#### Scenario: Sorting

- **GIVEN** the default order, newest first
- **WHEN** the reader chooses the heading `Zużycie`
- **THEN** the readings are listed by consumption, smallest first

### Requirement: Readings Table Query

The filter and the order of the table `Odczyty` SHALL be applied by the database query and named by the `meter`, `readingSort` and `readingOrder` query parameters. Unknown sort values SHALL fall back to the newest readings first.

#### Scenario: Unknown sort value

- **GIVEN** an address with an unknown `readingSort`
- **WHEN** the page is opened
- **THEN** the newest readings are listed first

### Requirement: Annual Costs View

The `Koszty rzeczywiste` view SHALL show the total result and each item with its name, basis, community amount, flat coefficient with both bases, and result as `nadpłata` or `niedopłata`.

#### Scenario: Annual items

- **GIVEN** a settlement with four items
- **WHEN** the view renders
- **THEN** all four are listed with a `Suma` row equal to the stored total

### Requirement: Admin Reads Settlements

The admin apartment page SHALL show a `Rozliczenia` card with the same three views, period selects and PDF buttons as the tenant page, for every stored settlement of that apartment record, without the tenant history window.

#### Scenario: Full history

- **GIVEN** a settlement older than the tenant history window
- **WHEN** an admin opens the apartment page
- **THEN** that settlement and its meter readings can be selected and read

#### Scenario: Former owner

- **GIVEN** a settlement stored on a former owner's apartment record
- **WHEN** an admin opens that record's page
- **THEN** the settlement is shown there, and not on the current owner's record

#### Scenario: No settlements

- **GIVEN** an apartment record without settlements
- **WHEN** an admin opens its page
- **THEN** no `Rozliczenia` card is shown

#### Scenario: Not an admin

- **WHEN** a signed-out user or a tenant requests an admin apartment page
- **THEN** no settlement data is read or shown

### Requirement: All Stored Settlement Data Readable

The tenant and admin views SHALL make every stored value of a settlement readable, including each meter's device and label and each annual item's printed title and period. The details of the imported document (issue date, printed owner name and source file name) SHALL be shown to admins only, and the issue date and source file name SHALL NOT be sent to a tenant.

#### Scenario: Document details for an admin

- **GIVEN** an imported settlement
- **WHEN** an admin reads it on the apartment page
- **THEN** the issue date, printed owner name and source file name are readable

#### Scenario: Document details for a tenant

- **GIVEN** an imported settlement
- **WHEN** its tenant reads it
- **THEN** no document details are shown, and the response holds neither the issue date nor the file name

#### Scenario: Annual item

- **GIVEN** an annual item shown under a short name
- **WHEN** the view is shown
- **THEN** its printed title and period are readable too

### Requirement: Settlements In Database Statistics

The database statistics on `/admin/import` SHALL show the numbers of utility settlements, meter readings and annual cost settlements as rows of the summary table, with their date ranges and last changes, and SHALL be refreshed after a settlement import. Meter readings have no change date of their own and SHALL show a dash in the last change column. The per-association totals of the same section SHALL count the utility settlements and annual cost settlements of each association.

#### Scenario: Counts after an import

- **GIVEN** an admin on the import page
- **WHEN** a settlement import finishes
- **THEN** the statistics are read again and include the imported records

#### Scenario: Settlement range

- **GIVEN** stored utility settlements whose periods run from 1 May 2024 to 30 September 2025
- **WHEN** the statistics are shown
- **THEN** the utility settlements row shows the range `01.05.2024 – 30.09.2025`
