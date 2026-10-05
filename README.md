# X Affiliate Blocker

Hide or block X accounts that carry a company's affiliation badge (the little square logo next to the name).

## How it works

The badge comes from X's **Verified Organizations** program: a company affiliates employee accounts, and X
ships that link in its API as `affiliates_highlighted_label` on every user object. This extension:

1. `inject.js` (page world) hooks `fetch`/`XHR`, reads X's GraphQL responses, and extracts every user with
   an affiliation label (org name + org handle).
2. `content.js` matches those against your company list and:
   - **hides** their tweets/user cells via injected CSS (always), and
   - optionally **blocks** them through X's own `blocks/create` endpoint using your logged-in session,
     throttled to one every 3–6 s, with a 15-minute pause on rate limit.
3. `popup.html` lets you manage companies, toggle block mode, and add orgs you've seen with one click.

Only people whose profile data your browser loads are caught. To get everyone at a company, visit
`x.com/<company>/affiliates` and scroll.

## Install

- **Chrome/Edge/Brave/Arc:** `chrome://extensions` → Developer mode → *Load unpacked* → pick this folder.
- **Firefox (128+):** `about:debugging` → This Firefox → *Load Temporary Add-on* → pick `manifest.json`.

## Notes

- Companies match on org handle (`@openai`) or the badge's display name (`OpenAI`), case-insensitive.
- "Skip people I follow" is on by default.
- Hiding a user also hides tweets that quote them.
- Automated mass-blocking is against the spirit of X's automation rules; keep the throttle as is.
