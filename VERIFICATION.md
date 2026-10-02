# Verification for version 1.0.0 — redesigned interface

## Security revision — 1 October 2026

The current source passed 23 unit tests, TypeScript, lint with no warnings/errors, 21/21 Expo Doctor checks, and Android Hermes/web production exports. `npm audit` changed from 15 moderate affected-package findings (two underlying advisories) to zero reported vulnerabilities. A clean isolated `npm ci --ignore-scripts` installation reproduced working router URL decoding.

The security browser suite passed 38 offline/failure checks with no uncaught application errors. It used the production web export at a 412 × 892 viewport. Browser network access was disabled for offline cases; only the local bundled assets were fulfilled. Online hymn cases replayed the actual four public API responses retrieved during this audit, with CORS headers added for the browser test. No message was sent or payment made. This checks the app's JavaScript/UI behavior, not Android operating-system behavior.

Native configuration was generated in separate copies for before/after inspection. The final source manifest requests INTERNET and MODIFY_AUDIO_SETTINGS, blocks unnecessary permissions, disables cleartext traffic, and keeps backups disabled. Both Android and iOS generation succeeded. The final Gradle-merged manifest and a signed APK/AAB were not tested: this workspace has no Android SDK or release signing setup.

All 2,100 live hymn entries passed the stricter schema. All 24 MP3/MP4 media URLs responded to HTTPS HEAD checks with correct content types; the largest declared media size was 11,826,919 bytes. Neither check proves redistribution rights or payment recipient identity.

Read `SECURITY-AUDIT.md` for scope, changes, retained outdated/deprecated tooling, test evidence, and outstanding Play release checks. The earlier UI verification below is historical; its broader layout and real-media playback checks were not repeated as part of this security revision.

## Earlier interface verification

Completed on 30 September 2026 using Node.js 24.19.0, Expo 57.0.26, React Native 0.86.3, and React 19.2.3.

The UI revision was checked again on 1 October 2026 (Nigeria time). The 13 core tests, typecheck, lint, 21 Expo Doctor checks, Android Hermes export, and web export passed after the redesign. All twelve browser behaviour groups below also passed with no page runtime errors.

| Check | Result |
| --- | --- |
| Core behaviour tests | 13 passed |
| TypeScript source checks | Passed |
| Expo ESLint | Passed without errors or warnings |
| Expo dependency compatibility | Up to date |
| Expo Doctor | All 21 checks passed |
| Package/lockfile consistency and clean-install dry run | Passed |
| Android production JavaScript export | Passed; Hermes bundle generated |
| Web production JavaScript export | Passed |
| Android native configuration generation | Passed in an isolated copy |
| Android splash resources | Generated using the original church logo |
| Android permissions | Camera, microphone, external-storage access, and overlay permissions removed by configuration |
| Original church logo | SHA-256 matches the website's logo exactly |
| Current hymn API collections | Parsed all 2,100 entries: 1,000 regular + 50 additional per language |
| Website devotional/prayer/media import | 31 bilingual dated readings, 7 complete bilingual prayer plans, 12 recordings |
| Redesigned layouts | 14 screens checked at 320, 390, 430, and 768 px widths; no horizontal page overflow |
| Bundled Inter and Noto Serif fonts | All six font faces loaded during all 56 screen/width checks; Yoruba letters and tone marks present in every font |
| Tab headers and menu buttons | Visible on Home, Hymns, Media, and Devotional at all four widths |

## Mobile browser checks

Twelve behaviour groups passed against the production web bundle in Chromium, with no page runtime errors:

1. Home, all five tabs, and the visible menu button.
2. Complete hymn stanzas, correct number, language switching, favourites, and reading size.
3. Cached Yoruba search after a reload with no hymn API requests; favourite persistence.
4. Prayer completion retained after language switching and reload.
5. October date selection, English/Yoruba readings, bookmarks, read state, and saved-item navigation.
6. Ecobank copying, invalid-amount rejection, and a correctly prepared card-link request.
7. Prayer form validation and a correctly prepared WhatsApp draft.
8. Prayer/sermon/praise filters and playback of real MP4 media bytes.
9. Real MP3 playback/pause and a complete download named `mount-zion-message-and-worship-gathering.mp3`.
10. Download cancellation without a false success notice.
11. Location links, menu access, and reading-setting persistence.
12. Principal screens fitting a 320 px phone width without horizontal page overflow.

The browser hymn checks used snapshots retrieved from all four live Hymnize collection endpoints, supplied through a browser test interception with CORS headers. The upstream API currently lacks those browser headers; Android requests do not depend on browser CORS. Media playback tests used the real files from the current website checkout. No message was sent, payment made, or external account changed during these checks.

The screenshots in `previews/` show the redesigned web rendering at a 390 × 844 phone viewport. `overview.png` combines the Home, Hymns, and Media screens. The gallery is a capture of the running app, rather than an illustration of a proposed design.

## Still to check on a real Android phone

No signed APK/AAB was built and no Google Play submission was made in this workspace. Use the README's preview APK build instructions to check native launch appearance, Android file downloads/offline playback, file export, device playback behaviour, WhatsApp handoff, and any configured checkout provider on a physical phone before release. Browser checks and an Android JavaScript export do not replace that device check.
