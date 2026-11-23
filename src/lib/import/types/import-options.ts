export interface ImportOptions {
  cleanImport?: boolean;
  skipValidation?: boolean;
  // Import time, used to decide which owner periods have ended
  now?: Date;
}

export interface ImportFileGroup {
  // Several files of one kind (e.g. wplaty1.txt, wplaty2.txt) are merged
  lokFiles?: File[];
  chargesFiles?: File[];
  notificationsFiles?: File[];
  paymentsFiles?: File[];
  // Per-data-type WMB snapshot date files; the newest date among them is used
  apartmentsWmbFiles?: File[];
  chargesWmbFiles?: File[];
  notificationsWmbFiles?: File[];
}
