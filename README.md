# DeskBuddy

A friendly animated character that walks onto your screen and reminds you to drink water, take breaks, stretch and rest your eyes. Works in Chrome, Edge, Firefox and VS Code on Windows, macOS and Linux.

## What is in the free version

- 3 original 2D characters (Mika, Arjun, Zoe) that walk, wave, drink and cheer
- Water, break, stretch, eye rest and one custom reminder, each with its own interval
- "Yes" / "Remind me later" (snooze), pause for 1 hour, daily water count
- Hanging charms (evil eye, lemon and chilli, drishti mask, hamsa hand, Webby the spider) that dangle from the top of the page and swing when touched
- Timed reminders at a set time, with an optional early warning; snooze or skip for the day
- Focus timer, quiet hours and an optional daily summary
- Water drop, rocket, balloon, peek and confetti animations
- Desk pet mode: the buddy strolls along the bottom of the page or the VS Code view
- Pro preview: locked characters and a "your photo as a buddy" teaser with an interest/waitlist form. No payments.

## Folders

| Folder | What |
| --- | --- |
| `shared/buddy-core.js` | Characters, animations and the walking stage. Single source used everywhere. |
| `browser/` | Browser extension (Manifest V3). One codebase, two manifests. |
| `shared/engine.js` | Reminder logic (what is due when). Single source used everywhere. |
| `vscode/` | VS Code extension (plain JavaScript). |
| `desktop/` | Desktop app for macOS, Windows and Linux (Electron). Shows the buddy over the whole screen. |
| `demo/` | Source of the live demo page. |
| `scripts/build.js` | Builds everything into `dist/`. |

## Build

```
node scripts/build.js                      # dist/deskbuddy-chrome-edge.zip, dist/deskbuddy-firefox.zip, dist/demo.html
cd vscode && npx @vscode/vsce package --no-dependencies   # .vsix
```

## Desktop app

```
cd desktop
npm install
npm start            # run it
npm run dist:mac     # build a .dmg (on a Mac)
npm run dist:win     # build a Windows installer
```

Pushing a tag such as `v1.2.0` runs `.github/workflows/desktop-release.yml`, which builds the Mac, Windows and Linux installers and attaches them to a GitHub Release.

The Mac build is ad-hoc signed, so macOS shows an "unidentified developer" warning; open it once through System Settings > Privacy & Security > Open Anyway.

## Try it without a store

- **Chrome / Edge:** unzip `deskbuddy-chrome-edge.zip`, open `chrome://extensions` (or `edge://extensions`), turn on Developer mode, click **Load unpacked** and pick the folder.
- **Firefox:** open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on** and pick `deskbuddy-firefox.zip`.
- **VS Code:** Extensions panel, `...` menu, **Install from VSIX**.

## Pro waitlist

Sign-ups are stored only on the user's device until you set an endpoint:

- `browser/defaults.js` → `WAITLIST_ENDPOINT`
- `vscode/extension.js` → `WAITLIST_ENDPOINT`

It must accept a JSON POST `{ email, source, ts }`. When you turn this on for Firefox, change `data_collection_permissions` in `browser/manifest.firefox.json` from `none` to the right value and add a privacy policy to each store listing.

## Publishing cost

| Store | Fee |
| --- | --- |
| Firefox Add-ons (AMO) | Free |
| Microsoft Edge Add-ons | Free |
| Open VSX (VS Code compatible editors) | Free |
| VS Code Marketplace | Free (needs a Microsoft/Azure DevOps publisher account) |
| Chrome Web Store | One-time US$5 developer registration |

## License

MIT
