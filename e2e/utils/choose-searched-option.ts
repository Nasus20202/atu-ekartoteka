/** Searchable lists, such as the choice of an association or an apartment. */

import { expect, type Locator } from '@playwright/test';

/**
 * Types into the open list and clicks the option once the search has answered.
 * Until then the earlier options are still shown and move when it does, so a
 * click aimed at one of them can land on nothing.
 */
export async function chooseSearchedOption(
  searchBox: Locator,
  query: string,
  option: Locator
) {
  await searchBox.fill(query);
  await expect(searchBox.page().getByRole('listbox')).toHaveAttribute(
    'aria-busy',
    'false'
  );
  await option.click();
}
