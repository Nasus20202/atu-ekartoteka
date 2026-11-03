// A page that is still streaming in, or a route Next.js keeps hidden, can leave a
// hidden copy of its inputs in the DOM; only the visible page's input is wanted.
export const FILE_INPUT_SELECTOR =
  'input[type="file"]:not([hidden] *, [style*="display: none"] *)';
