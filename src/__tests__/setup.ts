import '@testing-library/jest-dom/vitest';

import {
  CompressionStream,
  DecompressionStream,
  ReadableStream,
  TransformStream,
  WritableStream,
} from 'node:stream/web';

import { SWRConfig } from 'swr';
import { cache, SWRGlobalState } from 'swr/_internal';
import { beforeEach } from 'vitest';

// The VM-based pools (vmForks, vmThreads) run each file in a bare V8 context,
// which does not inherit Node's web-stream globals. jsdom's Blob/File rely on them.
const webStreamGlobals = {
  ReadableStream,
  WritableStream,
  TransformStream,
  CompressionStream,
  DecompressionStream,
};

for (const [name, value] of Object.entries(webStreamGlobals)) {
  if (!(name in globalThis)) {
    Object.defineProperty(globalThis, name, { value, writable: true });
  }
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value() {
    return {
      width: 800,
      height: 320,
      top: 0,
      right: 800,
      bottom: 320,
      left: 0,
      x: 0,
      y: 0,
      toJSON() {
        return this;
      },
    };
  },
});

// SWR keeps a module-level cache and shares a request that is still pending
// between identical keys; every test starts with neither and sees its own mocks.
SWRConfig.defaultValue.dedupingInterval = 0;

beforeEach(() => {
  for (const key of [...cache.keys()]) {
    cache.delete(key);
  }
  const [, mutations, fetches, preloads] = SWRGlobalState.get(cache)!;
  for (const registry of [mutations, fetches, preloads]) {
    for (const key of Object.keys(registry)) {
      delete registry[key];
    }
  }
});
