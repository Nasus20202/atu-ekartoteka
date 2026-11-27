/** A run of text with the position of its baseline, measured from the top left. */
export interface PdfItem {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

export interface PdfPage {
  number: number;
  items: PdfItem[];
}

export interface PdfRow {
  page: number;
  /** Left edge of the first item, which tells columns apart */
  x: number;
  text: string;
}
