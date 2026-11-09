/**
 * Returns the selected apartment ids after one checkbox change. Checking an
 * apartment that is already selected leaves the list unchanged, so a repeated
 * change event cannot select the same apartment twice.
 */
export function setApartmentSelection(
  selected: string[],
  apartmentId: string,
  checked: boolean
): string[] {
  if (!checked) {
    return selected.filter((id) => id !== apartmentId);
  }
  return selected.includes(apartmentId) ? selected : [...selected, apartmentId];
}
