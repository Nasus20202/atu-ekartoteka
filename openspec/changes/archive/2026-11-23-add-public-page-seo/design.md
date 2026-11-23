# Design

## Context

See `proposal.md` for motivation and `specs/public-seo/spec.md` for the
requirements.

The application is deployed as a Docker image built once and run with a
different `APP_URL` per environment (compose files pass it at runtime), so the
public host is not known when `next build` runs. Public pages are prerendered:
the build already lists `/login`, `/register`, `/forgot-password` and
`/change-password` as static, and `/privacy` as request-time because it reads
the saved policy.

Next.js resolves metadata for a prerendered page during the build and writes it
into the static HTML. Two consequences shape the design:

- a static `metadata` object is fine and keeps the page static;
- `generateMetadata` that reads `headers()`, `cookies()`, the session or
  `connection()` turns the page request-time, and a `metadataBase` from
  `process.env.APP_URL` would freeze the build machine's value into the HTML
  (falling back to `http://localhost:3000`, which is worse than emitting
  nothing).

## Goals / Non-Goals

**Goals:**

- Every public page describes itself for search engines and link previews.
- Private pages are excluded by default, not one by one.
- Static pages stay static; the change adds no request-time API to metadata.

**Non-Goals:**

- Search Console setup, analytics, `sitemap.xml`, JSON-LD, `og:image`,
  `metadataBase`, or any absolute URL. Each needs the host, which is runtime
  configuration here.
- Reworking the private app's titles; `page-titles` already covers them.

## Decisions

**Static `metadata` exports, one helper.** `src/lib/framework/seo.ts` holds
`PUBLIC_PAGES` (path, title, description) and `publicPageMetadata(page)`, which
returns the `Metadata` object. Each public layout exports it. Framework layer
because the file imports Next's `Metadata` type and is the Next edge; the
alternative — `generateMetadata` — would make the pages request-time.

**No `metadataBase`, so no absolute-URL fields.** Canonical links are relative
paths (`/login`), which the HTML specification allows and Google resolves
against the page URL. `og:url` and `og:image` are omitted rather than emitted
pointing at `localhost`. Next.js only warns about a missing `metadataBase` when
resolving image fields, so leaving images out keeps the build quiet.
Alternatives: a build argument (breaks the one-image-many-environments
deployment), and runtime metadata (breaks the static requirement).

**Private by default in the root layout.** The root `metadata` sets
`robots: { index: false, follow: false }`; a public page replaces it with
`index, follow`. Next.js takes the leaf segment's `robots` value, so a new page
is private until it asks for the helper. The sign-in pages that take a token
(`/reset-password`, `/verify-email`) and everything behind `/dashboard` and
`/admin` therefore need no code of their own.

**Twitter card `summary`.** Without an image the card is a title and
description; `summary_large_image` without an image would render worse.

**Descriptions live next to the titles.** `PAGE_TITLES` stays the single source
of titles; `PUBLIC_PAGES` adds the description and the path, so the title and
the preview cannot drift apart.

## Risks / Trade-offs

- [Links shared on social networks have no image] → Accepted: an image URL
  needs the host. Restoring it later means allowing one build-time value or a
  request-time metadata route; the helper is the single place to change.
- [No `sitemap.xml`] → Accepted for four public pages that are reachable from
  `/`, which redirects a signed-out visitor to `/login`. Google discovers them
  by crawling. A sitemap would need absolute URLs.
- [Other crawlers may ignore a relative canonical] → Google, Bing and Yandex
  resolve it against the page URL; the alternative (a wrong absolute URL) is
  strictly worse.
- [`/privacy` stays request-time] → Unchanged by this work: the saved policy is
  read per request with `connection()`. Its metadata is static, so the canonical
  and preview tags are still emitted.
