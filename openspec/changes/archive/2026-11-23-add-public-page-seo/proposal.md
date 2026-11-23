# Proposal

## Why

The application has no search presence: the only thing a crawler gets is a
title, a one-line description and `robots.txt`. There are no per-page
descriptions, no canonical URL, no Open Graph or Twitter tags, so shared links
show a bare URL and search results show the same generic snippet for every
page. Public pages can be indexed but say nothing about themselves.

## What Changes

- Add per-page titles, descriptions, canonical URLs and crawler directives for
  the pages a signed-out visitor can open: `/login`, `/register`,
  `/forgot-password` and `/privacy`.
- Add Open Graph and Twitter Card tags (title, description, locale, site name,
  card type) to those pages.
- Keep every other page `noindex, nofollow` by default, including the token
  pages (`/reset-password`, `/verify-email`) that carry a secret in the URL.
- Extend `robots.txt` to disallow nothing new, and keep it and the pages static.
- Add tests that assert the tags for each public page and the default for
  private ones, and a build check that the public pages are still prerendered.

## Out of Scope

- Absolute URLs (`metadataBase`, `og:url`, `og:image`, `sitemap.xml`). Static
  pages are prerendered, so their host is fixed at build time; the project keeps
  the site URL as runtime configuration and refuses to bake it into the build.
  Relative canonical links are emitted instead, and pages carry no
  host-bearing fields.
- A sitemap. A valid sitemap needs absolute URLs, which would either bake the
  host at build time or turn the route request-time.
- Structured data (JSON-LD) for the same reason plus low value: there is no
  public product page to describe.
- Any change to the private application's metadata beyond the default
  `noindex`.

## Capabilities

### New Capabilities

- `public-seo`: crawler policy, canonical and social metadata for the public
  pages, and the default that every other page stays out of the index.

### Modified Capabilities

None: titles keep the behavior of the `page-titles` capability, and the new
metadata lives in `public-seo`.

## Impact

- `src/app/layout.tsx` (root metadata defaults)
- `src/app/(auth)/login/layout.tsx`, `src/app/(auth)/register/layout.tsx`,
  `src/app/(auth)/forgot-password/layout.tsx`, `src/app/privacy/layout.tsx`
- New `src/lib/framework/seo.ts` and its tests
- `src/app/robots.ts` (unchanged rules, kept static)
- `openspec/config.yaml` spec index, `docs/testing.md` only if tests need a new
  pattern
