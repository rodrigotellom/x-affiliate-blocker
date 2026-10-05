# X Affiliate Blocker

Block everyone who works at a company on X.

Add a company (e.g. `@corgi`), and the extension blocks every account X lists as affiliated with it:
employees, executives, and company-run accounts. You can choose to only hide them instead.

## Usage

1. Install the extension (see below) and open the popup on x.com.
2. Add the companies you want gone, by handle (`@corgi`) or name (`Corgi`).
3. Turn on **Actually block**. With it off, the extension only hides those people's posts, which is a
   good way to check what will be blocked first.
4. To block a company's whole team at once, open `x.com/<company>/affiliates` (e.g. `x.com/corgi/affiliates`)
   and scroll to the bottom. Everyone on that list gets blocked.

After that, anyone new from that company gets blocked as soon as they appear while you browse.

### Options

- **Skip people I follow** (on by default): never blocks or hides accounts you follow.
- **Pause**: stops all hiding and blocking.
- **Organizations seen**: companies whose employees have appeared while you browse, with a one-click add.
- **Recently blocked**: who was blocked and which company they're linked to.

## Install

- **Chrome / Edge / Brave / Arc:** `chrome://extensions` → Developer mode → *Load unpacked* → pick this folder.
- **Firefox 128+:** `about:debugging` → This Firefox → *Load Temporary Add-on* → pick `manifest.json`.

## How it knows who works where

Companies on X's Verified Organizations plan link their employees' accounts to the company account. X
includes that link in the data it sends your browser for each account. It's the same link behind the small
company logo next to employees' names. The extension reads it, so matching is exact rather than guessed
from bios. The flip side: it can only catch people the company has linked. Someone who mentions the
company in their bio but isn't linked won't be blocked.

## Limits

- **Pace:** blocks go out one every 3–6 seconds, using your logged-in session. If X rate-limits you, the
  extension waits 15 minutes and continues. A big company can take a while.
- **Account risk:** X discourages automated mass-blocking. Keep the delay as is.
- **Quotes get hidden too:** hiding someone also hides posts that quote them.
- **X site changes:** this relies on how x.com works today. If it stops catching people, X probably changed
  its data format and the extension needs an update.
