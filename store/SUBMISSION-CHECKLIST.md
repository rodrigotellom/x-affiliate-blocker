# Submission checklist

1. **Developer account.** Same Chrome Web Store developer account as the other
   extensions (one-time $5 fee per account, not per extension).
2. **Push `PRIVACY-POLICY.md`** to the public GitHub repo so its URL resolves.
3. **Build.** `./scripts/build-zip.sh` → `dist/x-affiliate-blocker-<version>.zip`.
   (The `browser_specific_settings` key is for Firefox; Chrome shows a harmless
   warning about it and the store accepts it.)
4. **Create the item.** Dashboard → *New item* → upload the zip.
5. **Store listing tab.** Copy from `store/LISTING.md`. Store icon:
   `icons/icon128.png`. Small promo tile: `store/assets/promo-440x280.png`.
6. **Screenshots (at least 1, 1280x800 or 640x400).** Capture by hand:
   - The popup with a company added and the settings visible.
   - A timeline with a matching post hidden (optional before/after).
7. **Privacy practices tab.** Copy from `store/PRIVACY.md`, including the
   privacy policy URL.
8. **Distribution.** Public, all regions (or Unlisted).
9. **Submit for review.**

## Updating later

Bump `version` in `manifest.json`, rebuild, then *Package → Upload new package*
on the existing item and submit again.

## Known review risks

- **Automated actions on a third-party site.** The extension sends block
  requests to x.com's private API on the user's behalf. That's the riskiest
  part of this listing: expect closer review, and possibly questions about
  X's terms. The built-in delays, the off-by-default blocking and the "hide
  only" default are the points to emphasise if a reviewer asks.
- **MAIN-world fetch/XHR hooking.** Reviewers sometimes flag network
  interception; the justification in `store/PRIVACY.md` explains it reads only
  x.com's own GraphQL responses and never sends them anywhere.
- **Hardcoded bearer token in `inject.js`.** It is the public token baked into
  x.com's own web client, not a secret, used only as a fallback.
