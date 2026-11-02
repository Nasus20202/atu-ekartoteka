import '@testing-library/jest-dom/vitest';

import {
  CompressionStream,
  DecompressionStream,
  ReadableStream,
  TransformStream,
  WritableStream,
} from 'node:stream/web';

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
