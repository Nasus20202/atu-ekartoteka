import { useState } from 'react';

/**
 * Returns the latest non-null value, so a dialog keeps its content while it
 * animates out after the parent has cleared the value.
 */
export function useRetainedValue<T>(value: T | null | undefined) {
  const [retained, setRetained] = useState(value);

  if (value != null && value !== retained) {
    setRetained(value);
  }

  return value ?? retained;
}
