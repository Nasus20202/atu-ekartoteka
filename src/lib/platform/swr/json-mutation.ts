const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

export interface JsonMutationArg<TBody> {
  arg: TBody;
}

/**
 * Fetcher for `useSWRMutation`: POSTs `arg` as JSON to the mutation key (the
 * endpoint URL) and resolves with the parsed body. A non-2xx response throws
 * the server's `error` message, or `fallbackError` when the body has none.
 */
export function jsonPoster<TBody, TResult>(fallbackError: string) {
  return async (
    url: string,
    { arg }: JsonMutationArg<TBody>
  ): Promise<TResult> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(arg),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || fallbackError);
    }

    return data;
  };
}
