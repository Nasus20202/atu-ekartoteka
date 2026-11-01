export interface IssueGroupInfo {
  title: string;
  description: string;
}

export interface IssueGroup<K extends string, T> extends IssueGroupInfo {
  kind: K;
  items: T[];
}

/** Groups items by kind, in the key order of `groups`; empty groups are left out. */
export function groupByKind<K extends string, T extends { kind: K }>(
  items: T[],
  groups: Record<K, IssueGroupInfo>
): IssueGroup<K, T>[] {
  return (Object.keys(groups) as K[]).flatMap((kind) => {
    const matching = items.filter((item) => item.kind === kind);
    return matching.length > 0
      ? [{ kind, ...groups[kind], items: matching }]
      : [];
  });
}
