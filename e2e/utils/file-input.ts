// A page that is still streaming in, or a route Next.js keeps hidden, can leave a
// hidden copy of its inputs in the DOM; only the visible page's input is wanted.
const visibleInput = (id: string) =>
  `input#${id}:not([hidden] *, [style*="display: none"] *)`;

/** The folder of text files of the data import. */
export const FILE_INPUT_SELECTOR = visibleInput('files');
export const SETTLEMENT_INPUT_SELECTOR = visibleInput('settlementFiles');
