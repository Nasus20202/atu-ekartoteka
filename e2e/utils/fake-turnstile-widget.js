/**
 * Deterministic stand-in for Cloudflare's Turnstile script, served by
 * stubVisibleTurnstileWidget in visual tests.
 *
 * It draws a visible 65px challenge panel in the widget's slot, follows the
 * light/dark theme and never solves itself, so snapshots stay stable and no
 * request reaches Cloudflare.
 */
(() => {
  const renderWidget = (container, options) => {
    const dark =
      options.theme === 'dark' ||
      (options.theme !== 'light' &&
        (document.documentElement.classList.contains('dark') ||
          window.matchMedia('(prefers-color-scheme: dark)').matches));
    const palette = dark
      ? { background: '#232323', foreground: '#f5f5f5', border: '#4d4d4d' }
      : { background: '#fafafa', foreground: '#232323', border: '#c8c8c8' };

    // Cloudflare's flexible layout never renders narrower than 300px
    container.style.width = '100%';
    container.style.minWidth = '300px';
    container.setAttribute('data-fake-turnstile', 'visible');
    container.innerHTML = `
      <div
        style="
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          height: 65px;
          padding: 0 12px;
          border: 1px solid ${palette.border};
          border-radius: 2px;
          background: ${palette.background};
          color: ${palette.foreground};
          font-family: system-ui, sans-serif;
          font-size: 14px;
        "
      >
        <span
          style="
            flex: none;
            width: 24px;
            height: 24px;
            border: 2px solid ${palette.border};
            border-radius: 2px;
            background: ${palette.background};
          "
        ></span>
        <span>Weryfikacja</span>
        <span
          style="
            margin-left: auto;
            font-size: 10px;
            letter-spacing: 0.08em;
            opacity: 0.6;
          "
        >
          CLOUDFLARE
        </span>
      </div>
    `;
  };

  window.turnstile = {
    render(container, options) {
      renderWidget(container, options);
      return 'mock-widget';
    },
    reset() {},
    remove() {},
    getResponse() {
      return null;
    },
    isExpired() {
      return false;
    },
  };

  const onload = new URLSearchParams(
    document.currentScript.src.split('?')[1]
  ).get('onload');
  if (onload && window[onload]) window[onload]();
})();
