# DeskBuddy: project context for Claude Code

Read this first. It sums up how this project was built and where everything stands, so a new session can carry on without the original chat.

## What DeskBuddy is

A free, friendly 2D animated character that walks onto the screen and reminds the user to drink water, take breaks, stretch, rest their eyes and catch meetings. Built for:

| Target | Folder | Status (17 Nov 2026) |
| --- | --- | --- |
| Chrome and Edge extension (Manifest V3) | `browser/` + `manifest.chrome.json` | Edge: draft in Partner Center, never published. Chrome Web Store: not listed (US$5 fee, owner chose free stores only). |
| Firefox extension | `browser/` + `manifest.firefox.json` | Live on AMO; store has 1.1.0, 1.2.0 not uploaded yet. |
| VS Code extension | `vscode/` | Live on the Marketplace; store has 1.0.0, 1.2.0 not uploaded yet. |
| Desktop app (macOS, Windows, Linux) | `desktop/` (Electron) | v1.2.0 installers on GitHub Releases, built by CI. |

Owner: JAFFERSHA, brand "Zero to Deploy", support email support@zerotodeploy.in. Licence: MIT.

## Owner's preferences (keep following these)

- **Free only.** No paid store fees or services without asking first. Chrome Web Store (US$5) and Mac App Store (US$99/yr) were skipped for this reason.
- **The owner does every sign-in, password, 2FA, CAPTCHA, ID check and file pick themselves.** Never ask for a password in chat.
- **Ask before any final Submit / Publish button** on a store or GitHub release.
- Explain things simply and step by step; the owner often works from screenshots.
- **No copyrighted characters.** The owner asked for Spider-Man, Naruto and Marvel characters; these were declined. Only original drawings ("Webby" the spider is the original stand-in). Keep it that way: it also protects the store listings.
- "Pro" features are a **locked preview plus waitlist only**. Nothing can be bought.

## Repository layout

```
shared/buddy-core.js   Characters (SVG built in code), stage (walk/wave/drink/cheer), speech bubble,
                       hanging charms (pendulum + drag), reminder effects (drop, rocket, balloon, peek,
                       confetti). Exposes globalThis.DeskBuddy. Single source used by every target.
shared/engine.js       Reminder logic: what is due and when. Pure functions, no DOM. Exposes
                       globalThis.DBEngine and module.exports. tick(), act(), setFocus(), intervalPayload().
browser/defaults.js    Settings model (DB.DEFAULTS, DB.merge validation, DB.REMINDERS, WAITLIST_ENDPOINT).
browser/background.js  Service worker (Chrome) / background script (Firefox). One alarm "tick" every
                       minute runs DBEngine.tick and sends the payload to the active tab; falls back to a
                       system notification where content scripts can't run.
browser/content.js     Draws the buddy, charm and effects in a CLOSED shadow root at the page bottom.
browser/popup/         Settings UI. Also reused as the desktop app's settings window (see below).
vscode/extension.js    Maps VS Code settings onto the engine's settings shape; status bar; commands.
vscode/media/view.js   Sidebar webview (DeskBuddy view in Explorer). Sizes the character to the panel.
vscode/media/pro.js    Pro preview panel with waitlist form.
desktop/main.js        Electron main: transparent, always-on-top, click-through overlay over the work area;
                       tray / menu bar menu; settings window; engine tick every 20 s; JSON store in userData.
desktop/overlay.*      Overlay renderer. Makes only the buddy, bubble, charm and balloon clickable.
desktop/preload-*.js   preload-settings.js fakes a `browser.storage` + `runtime.sendMessage` API so the
                       browser popup works unchanged inside Electron.
desktop/smoke.js       Dev-only self test (DESKBUDDY_SMOKE=<dir>); captures PNGs and logs state.
demo/*.src.html        Demo pages; build.js inlines buddy-core.js into them.
scripts/build.js       Builds everything (see below).
.github/workflows/desktop-release.yml  Builds .dmg / .exe / .AppImage on tag push and attaches them.
```

Generated (git-ignored, recreated by `scripts/build.js`): `dist/`, `vscode/media/buddy-core.js`, `vscode/engine.js`, `desktop/ui/`, `desktop/build/icon.png`.

## Build and test

```bash
node scripts/build.js              # dist/chrome, dist/firefox, the two zips, demo pages, copies shared files
node scripts/build.js --desktop    # only prepares desktop/ui and desktop/build (used by desktop npm scripts / CI)

cd vscode && npx @vscode/vsce package --no-dependencies     # VS Code .vsix
npx web-ext lint -s dist/firefox                            # Firefox check (expect 0 errors, 1 warning)

cd desktop && npm install && npm start                      # run the desktop app
npm run dist:mac | dist:win | dist:linux                    # local installers (Mac only builds on a Mac)
```

Edit `shared/*` once; never edit the generated copies. After changing shared code, rebuild every target.

Testing used so far: a Node script that drives `DBEngine.tick` with a simulated clock across two days; Playwright loading `dist/chrome` as an unpacked extension against a local page; a mock `vscode` module for `extension.js`; the Electron smoke test under `xvfb-run`. No automated test files are committed yet.

## Settings model (browser/defaults.js)

`name, character (mika|arjun|zoe|capy|axo|boo|boba|ducky), pet, reminderIcon (buddy|mix|car|scooter|skate|plane|balloon|ufo|cloud|rocket|webby), sound (off|chime|pop|themed), charm (none|evileye|lemon|mask|hamsa|webby|luckycat|duck|boba|pixelheart|moon|cactus|clover|disco), charmX (0–1), charmLen (px, -1 = default), snooze (5|10|30), pausedUntil, effects, schedules[{id,text,time "HH:MM",repeat once|daily|weekdays,warn 0|5|10|15,on}] (max 20), quiet{on,from,to}, summary{on,time}, focus{work,rest}, reminders{water,rest,stretch,eyes,custom: {on,every,text}}`.

Browser: settings in `storage.sync.settings`; engine state, stats and waitlist in `storage.local`. Desktop: same shape in `userData/deskbuddy.json`. VS Code: real settings under `deskbuddy.*`, converted by `settings()` in `extension.js`; engine state and stats in `globalState`.

## Rides (reminder icons)

`DeskBuddy.plan(reminder, settings.reminderIcon)` picks a ride (or none = the buddy) and drops one-shot effects that would double up. The stage then shows the ride instead of the buddy: it arrives, waits with the bubble and buttons until answered, and leaves with the reply message (cars drive off, rocket launches slow-mo, balloon floats, plane glides). `DeskBuddy.sound(mode, ride)` plays synthesised blips. `DBEngine.weekSummary(stats, now)` feeds the popup's "This week" chart and streak. Desktop Mac builds both arm64 and x64.

## Reminder engine rules (shared/engine.js)

Order inside one `tick`, at most one payload per tick:
1. Timed reminders (always come through, even when paused or in quiet hours). Early warning `warn` minutes before, then "Now" within 15 min of the time. `once` turns itself off (`settingsChanged`).
2. Focus timer: alternates work/break. The "rest" interval reminder is suppressed while it runs.
3. Interval reminders, skipped when paused, in quiet hours, or "Skip today". First tick only starts the clock.
4. Daily summary within an hour after its time.

Payload: `{key, id, kind (interval|sched|focus|summary), title, text, cheer, effect, actions:[{id,label,primary}]}`. Actions: `done`, `later` (snooze), `skip` (interval only), `timeout`. `act()` counts `done` into daily stats.

Effect per reminder: water→drop, rest→rocket, stretch→balloon, eyes→peek, answering→confetti.

## Store and account facts

- **GitHub:** https://github.com/JAFFERSHA/deskbuddy (public, branch `main`). Release `v1.2.0` has `DeskBuddy-1.2.0-arm64.dmg`, `DeskBuddy.Setup.1.2.0.exe`, `DeskBuddy-1.2.0.AppImage`. The Claude GitHub App was granted this repo; pushing tags from a Claude session was refused, so the owner creates releases in the GitHub UI (publishing creates the tag and starts CI).
- **Firefox AMO:** https://addons.mozilla.org/firefox/addon/deskbuddy-reminder-buddy/ . Gecko id `deskbuddy@jaffersha.github.io`, `strict_min_version` 140, `data_collection_permissions: none`. Category Alerts & Updates + Games & Entertainment, MIT. Upload a new version at Developer Hub → My Add-ons → Upload New Version; answer "No" to the source-code question (no build tools/minifiers).
- **VS Code Marketplace:** publisher id `jaffersha`, display name "Zero to Deploy", extension id `jaffersha.deskbuddy`, https://marketplace.visualstudio.com/items?itemName=jaffersha.deskbuddy . Update via marketplace.visualstudio.com/manage → ⋯ → Update → upload .vsix. The owner signs in with a Microsoft account (creating one in the Claude browser was blocked by Microsoft; it was made in their own browser).
- **Edge Add-ons:** Partner Center draft product id `67785a5b-67b4-40b6-99a5-b372b3b50a8c` (Individual account). Package, Availability (public, all markets), Properties (Productivity, support email), Privacy (single purpose, permission reasons, no remote code, no data collected; owner ticked the certifications) and Store listing (description + 300×300 logo) were filled for 1.0.0. To ship: Packages → Replace with the 1.2.0 zip, recheck sections, then Publish (ask the owner first).
- **Microsoft Store (desktop app):** free for individuals, needs ID + selfie verification. Not started. Would need an MSIX target in electron-builder.
- **macOS:** app is ad-hoc signed (`mac.identity: "-"`), not notarized, arm64 only. Users allow it once in System Settings → Privacy & Security → Open Anyway, or run `xattr -dr com.apple.quarantine /Applications/DeskBuddy.app`.

## Permissions, as justified to stores

storage (settings), alarms (the one-minute tick), notifications (fallback where the character can't be drawn), content script on all URLs (draws the character only, in a closed shadow root; never reads page content). No remote code, no data collection. The Pro waitlist only stores the email locally unless `WAITLIST_ENDPOINT` (in `browser/defaults.js` and `vscode/extension.js`) is set; if it ever is, update Firefox `data_collection_permissions` and add a privacy policy everywhere.

## Things that bit us (don't repeat)

- No `innerHTML` anywhere (AMO linter): characters are built with `DOMParser` via `DeskBuddy.render` / `renderCharm`.
- Firefox add-on slug max 30 chars.
- VS Code views can be very short: `view.js` sizes the character from the panel height and, under 210 px, sends the reminder to a VS Code notification instead of the bubble.
- VS Code extensions can't draw over the editor; the buddy and charm only live in the DeskBuddy sidebar view. Commands live in the palette (Cmd+Shift+P), plus header buttons on the view.
- A browser extension can't draw outside its page; whole-screen needs the desktop app.
- `build.js` uses `zip`, which Windows CI lacks; that's why `--desktop` exists.
- Windows installers can't be built on Linux without wine; CI on `windows-latest` does it.
- The Claude browser panel can't choose files from the Mac: the owner picks files for every store upload.

## Not done yet / ideas the owner liked

- Upload 1.2.0 to Firefox, VS Code; replace package and publish Edge.
- Intel Mac build (`mac.target` arch x64 or universal).
- Test the Windows installer and the Mac app on real machines (only Linux was tested). Watch: click-through over transparent areas, buddy sitting above the Dock/taskbar.
- Microsoft Store listing for the desktop app (free).
- Pro (paid later): photo-to-buddy, trending characters, calendar sync (needs a server and OAuth). Currently preview + waitlist only.
- Social posters exist as a Claude Design canvas ("DeskBuddy social posters": Instagram post, story, LinkedIn); live demo pages "DeskBuddy live demo" and "DeskBuddy desktop preview" are Claude artifacts.

## Commit style

Plain, descriptive messages (for example "1.2.0: timed reminders, snooze and skip, …"). Bump versions together in `browser/manifest.*.json`, `vscode/package.json` and `desktop/package.json` when shipping.
