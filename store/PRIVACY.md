# Privacy practices tab

## Permission justifications

### `storage`

```
Stores the user's list of companies, their settings (block vs. hide, skip followed accounts, pause), the list of accounts the extension has blocked, and a count of organizations seen while browsing, so they persist across sessions and are shared between the popup and the x.com tabs. All of it is kept in chrome.storage on the user's device.
```

### Host access (content scripts on x.com / twitter.com)

```
The extension only works on x.com and twitter.com. One content script runs in the page context to read the affiliation label that x.com's own API responses already include for each account, and to send block requests to x.com for accounts the user has chosen to block, using the user's existing logged-in session. A second content script hides matching posts with CSS and manages settings. No other site is accessed.
```

### Why a MAIN-world content script

```
The affiliation data and the user's session credentials needed to send a block request only exist in the page's own JavaScript context, so inject.js runs with "world": "MAIN". It observes x.com's GraphQL responses that the page already fetches and posts the relevant account data to the isolated content script.
```

## Remote code

**No, I am not using remote code.** All JavaScript ships in the package.

## Data collection certification

Conservative answers. The extension never sends data to the developer or any
third party, but it does read and store some page data locally:

| Category | Answer | Why |
|---|---|---|
| Website content | **Collected** | Reads account handles, names and affiliation labels from x.com responses; stores handles of blocked accounts locally. |
| Personally identifiable information | Not collected | |
| Health / financial / location | Not collected | |
| Authentication information | Not collected | Uses the page's session to send block requests but never stores or transmits credentials elsewhere. |
| Personal communications | Not collected | |
| Web history | Not collected | |
| User activity | Not collected | |

Tick all three certifications (no selling data, no unrelated use, no
creditworthiness use).

## Privacy policy URL

Required once any category is marked collected. Use:

```
https://github.com/rodrigotellom/x-affiliate-blocker/blob/main/PRIVACY-POLICY.md
```

(`PRIVACY-POLICY.md` must be pushed to the public repo first.)
