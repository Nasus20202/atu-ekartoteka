/** SWR fetcher: the parsed JSON body, or a thrown error for a non-2xx status. */
export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }
  return response.json();
}
