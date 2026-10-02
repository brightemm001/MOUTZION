# Mount Zion pre-deployment security audit

**Date:** 1 October 2026. **Decision:** source audit completed with fixes; **not yet cleared for Google Play upload**. The remaining release checks are listed below.

## Scope and evidence

Audited `Mount-Zion-App-Redesigned.zip`, the latest app source available in this chat, containing 93 original files. Its SHA-256 is `23b47a526f593cf571053d17a89940751c4895de656971180c7c09049848cc8a`. This does not cover later edits on your computer, Git history, an existing signed APK/AAB, or provider/server infrastructure that was not supplied.

The app uses Expo 57.0.26, React Native 0.86.3 and React 19.2.3. It has **no app account/login system, backend server, database connection, admin UI or payment verification service**. Authentication flows were not audited. The only forms are prayer/testimony WhatsApp drafts and an optional donation amount. There are no newsletter, push registration, AI, internal chat, profile or upload endpoints.

Source/configuration inspection, redacted credential-pattern scanning, dependency commands, adversarial unit tests, clean-install verification, native configuration generation, public read-only endpoint checks and browser offline/failure tests were performed. Evidence is in `audit-evidence/`. This is a source review and functional security test, not certification or a binary/device penetration test.

## Fixes made

| Finding | Impact and original exposure | Change |
| --- | --- | --- |
| Vulnerable URL decoder — moderate npm advisory | `query-string` used `decode-uri-component` 0.2.2. Malformed URL parameters could consume excessive CPU; Expo Router processes incoming links. | Added a small local CommonJS adapter that calls the unmodified upstream 0.5.0 decoder through the pinned `decode-uri-component-fixed` npm alias. Kept Expo Router and the SDK versions. Tested malformed encoding, router behavior, clean install, browser routes and Hermes export. |
| Vulnerable/deprecated UUID dependency — moderate npm advisory | Expo's Xcode/config toolchain used `uuid` 7.0.3. The advisory concerns buffer bounds in certain UUID APIs; this consumer uses v4. | Scoped `xcode` override to supported CommonJS `uuid` 11.1.1. Tested the consumer and generated both Android and iOS configuration. |
| Insecure/arbitrary external links — hardening | `openLink` accepted any HTTP/HTTPS URL. Current callers were mostly fixed links, but public website/checkout configuration could expand the destination. | Added exact protocol/origin/path checks, blocked credentials/controls/ports/private literal addresses, restricted payment hosts and allowed only the configured checkout URL. Kept the fixed church telephone, WhatsApp number, social profiles, Maps search, church media and Hymnize links. |
| Incomplete secret-file exclusions — preventive | `.env.production`, `.env.development` and other environment variants could be committed. No leaked secret was found. | Expanded `.gitignore`, added `.easignore`, excluded signing/private credential files, and verified ignore behavior in an isolated Git repository. `.env.example` remains available. |
| Form limits relied on text fields — hardening | Submission checked only a nonempty name and a minimum message length. A changed form/state could bypass the UI maximum. | Handler validates types, name ≤100 characters, prayer ≤2,000, testimony ≤5,000, minimum message length, control characters and a 32 KiB text budget. Added counters and a clearer WhatsApp disclosure. |
| Weak cached/downloaded-data validation — availability and local-data hardening | Hymn objects could contain non-string render values; preference lists were unbounded; saved-file checks used a directory prefix. The file issue required manipulated local metadata; no remote path-to-share exploit was found. | Validate complete hymn schemas and numbering, bound preferences/cache data, canonicalize catalog download metadata, and require equality to one allowed file in the current private directory before playback/share/delete. |
| Unbounded downloads/responses — availability | JSON and browser media responses could allocate memory without a received-byte limit. Media had no overall download timeout. | Stream-limit hymn responses to 4 MiB, normalized cache to 2 MiB, media files to 200 MiB, and downloads to five minutes. Validate MIME types; reject unexpected hymn/browser-download redirects. Native downloads also use a 20-second HEAD preflight, progress limit, final size/type checks and cleanup. |
| Raw error details in the default boundary — information exposure | Expo Router's default boundary renders `error.message`, and some error types include URLs/provider details. | Use a generic recovery screen without the error object, stack or server message. Added video loading timeout and handled audio seek rejection. |
| JavaScript executed by the import utility — developer-only risk | The website import used `node:vm` to evaluate initializers. `vm` is not a security boundary. This utility is not available to app users. | Parse allowed literals with the TypeScript AST; reject calls, functions, getters, interpolation, spreads, computed/prototype properties and excessive nesting/size. Validate imported media filenames. |
| Android network/permission configuration — defense in depth | Cleartext was not explicitly disabled; a default vibration permission was unnecessary. | Added the SDK-compatible build-properties plugin with `usesCleartextTraffic: false`, blocked vibration and unnecessary sensitive permissions, and retained `allowBackup: false`. |

Original church pictures, logo, devotional/prayer content and the redesigned visual theme were preserved.

## 1. Secrets and public configuration

The scan covered all 93 original archive files, including assets/previews, and reviewed the requested key terms in configuration/source. **No Paystack secret key, Firebase admin credential, database administrator credential, private key, access token, password or other embedded private credential was found.** Only `.env.example` exists in this copy; there is no `.env`, `.env.local`, `app.config.js/ts` or original native directory. Words such as “secret” in devotional text, “passwords” in the privacy explanation and search “tokens” are not credentials.

| Value/type | Public status |
| --- | --- |
| `EXPO_PUBLIC_WEBSITE_URL`, `EXPO_PUBLIC_CARD_CHECKOUT_URL` | Public URLs; Expo embeds these in the app. The checkout is empty by default. They must identify the verified church/provider. |
| Church contact details, social URLs, addresses, Ecobank recipient details, public Hymnize URLs | Intentionally public website/app information. A receiving account number is not a banking password. Recipient ownership still needs church confirmation. |
| Payment publishable/public keys (`pk_*`) | May be public if introduced; none is currently present. |
| Payment secret keys (`sk_live_*`, `sk_test_*`), admin service accounts, database admin credentials, private API keys | Must remain on an authorized backend. Renaming an environment variable or putting a server key in SecureStore does not make it safe to distribute. |
| Upload signing keys/passwords | Keep in controlled release/build credential management, outside source uploads and runtime configuration. |

Firebase client configuration, if added later, is different from an admin credential and still requires correctly configured backend rules. No Firebase integration exists here.

Git history and actual Git-tracked files were **unavailable** in this archive. Ignore rules do not remove an already tracked secret or undo an old leak. Check your real repository/history and revoke any previously committed credential before release. The compiled exports were also checked for credential signatures, with the result recorded in the final scan evidence.

## 2. Dependencies

Commands run: `npm audit`, `npm outdated`, `npx expo-doctor`.

| Check | Before | After |
| --- | --- | --- |
| `npm audit` | 15 moderate affected-package findings, originating from two advisories; no high/critical findings | Zero reported vulnerabilities |
| Expo Doctor | 21/21 passed | 21/21 passed |
| Dependency installation | Original lock installed | Clean isolated locked install and decoder compatibility check passed |

The advisories are [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) and [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq). No `npm audit fix --force` was used: its proposals would downgrade Expo-related packages. The adapter is reviewed local code; the actual upstream decoder remains a registry dependency with a lockfile integrity hash. Keep the adapter folder and alias together.

`npm outdated` still lists the following newer releases. All installed versions equal the lockfile's wanted versions. There were no advisory reasons to replace the Expo-compatible runtime set with these newer versions.

| Package | Installed | Latest reported |
| --- | --- | --- |
| AsyncStorage | 2.2.0 | 3.1.1 |
| React / React DOM | 19.2.3 | 19.3.0 |
| React Native | 0.86.3 | 0.87.1 |
| Reanimated | 4.5.1 | 4.7.0 |
| Safe area context | 5.7.0 | 5.10.1 |
| Screens | 4.26.2 | 4.28.0 |
| SVG | 15.15.4 | 15.15.5 |
| Worklets | 0.10.1 | 0.13.0 |
| TypeScript | 6.0.3 | 7.0.2 |
| ESLint | 9.39.5 | 10.11.0 |
| Node types | 24.19.0 | 26.6.3 |
| React types | 19.2.18 | 19.3.0 |

**Retained maintenance issue:** ESLint 9.39.5 is deprecated/unsupported. The current Expo lint stack's React/import plugins do not declare support for ESLint 10. It was not forced past their peer constraints. It is development tooling, with no current npm advisory in this audit; move to a fully compatible lint stack when available. Deprecated `uuid` 7 was removed. Exact reports are dated evidence, not a promise that future advisories will stay at zero.

## 3. Android permissions and release configuration

The final generated **source** Android manifest requests:

| Permission | Reason |
| --- | --- |
| `android.permission.INTERNET` | Hymn downloads, media streaming/downloads and external services |
| `android.permission.MODIFY_AUDIO_SETTINGS` | Expo Audio playback configuration; normal permission, not microphone access |

The app does not need location (coarse/precise/background), contacts/accounts, camera, microphone, SMS, phone state/numbers/call logs/direct calls, notifications, public storage/media-library access, overlays, vibration or background recording/playback services. These are blocked in `app.json`; downloads use the private app folder and explicit sharing. Opening the dialer uses `tel:` and does not require direct-call permission. Maps receives a church address, not device location. There is no push module.

Inspected relevant installed native library manifests: sharing/filesystem/clipboard providers are non-exported and use explicit URI grants. The application launcher is exported as required for launch/deep links; no app admin operation is reachable through it. OTA updates are not configured/enabled in the generated manifest.

Backups and cleartext traffic are disabled. Native Android and iOS configuration generated successfully in isolated copies. React Native's installed native defaults specify minimum API 24 and target API 36, matching the current [Play target requirement](https://support.google.com/googleplay/android-developer/answer/11926878). **The final Gradle-merged manifest, transitive Android libraries and signed binary still need inspection.** AndroidX can add normal/signature permissions during merging; the source manifest is not the final AAB permission inventory. No Android SDK/device or release signing setup was available here.

`eas.json` production generates an app bundle and auto-increments the version code. No production signing key/password is in this source. Use your EAS-managed production credentials; generated native templates contain a standard development signing configuration which is not proof of production signing. This ZIP and Hermes export are not Play-upload artifacts.

## 4. API/backend inventory

| Destination / operation | Purpose and direct-call exposure | Controls / limits |
| --- | --- | --- |
| `https://hymnize.com/api/collections/cac%2Fenglish%2Fregular` — GET | Public English regular hymns; callable outside the app | No credentials; 30-second timeout, HTTPS, no redirects/cookies, JSON MIME, 4 MiB limit, full schema/number validation |
| Same prefix with `english%2Fvarious` — GET | Public 50 additional English hymns | Same controls |
| Same prefix with `yoruba%2Fregular` — GET | Public Yoruba regular hymns | Same controls |
| Same prefix with `yoruba%2Fvarious` — GET | Public 50 additional Yoruba hymns | Same controls |
| `{configured HTTPS church origin}/media/sermons/{fixed catalog file}.mp3` or `.mp4` — GET; native download HEAD preflight | Twelve public recordings, two formats each; callable outside the app | Fixed catalog lookup, expected MIME, bounded downloads, private filenames, cleanup and error UI. Native OS blocks HTTP; legacy download redirect behavior remains part of the device check. |
| Church website/Hymnize home/social profiles | External browsing | Explicit destination policy |
| Google Maps search | Opens a fixed church address search | Exact Maps endpoint and encoded query |
| Church `tel:` link | Opens dialer | Exact configured church number |
| WhatsApp app / `https://wa.me/2349154494093?text=…` | User-initiated message draft and giving questions | Encoded/limited text, fixed recipient, visible handoff disclosure; Send occurs in WhatsApp |
| Configured Paystack/Flutterwave checkout | External card payment, currently empty/unconfigured | Exact verified HTTPS checkout link; no card fields or app confirmation |

Public GET endpoints are intended to work outside the app. Hiding a key in the app would not protect them. **There are no app-owned public write endpoints to add backend validation or rate limiting to.** Client form validation is not being presented as server enforcement. WhatsApp, Hymnize, Vercel and any configured payment provider are independently operated; their private infrastructure, rate limits, retention and admin controls were not accessible to audit or change.

If you later add form storage, uploads, AI/chat, notification registration or automatic payment confirmation, that is a new backend security scope: enforce schema/body limits and abuse controls on the server, authorize every admin operation, and keep private keys there.

## 5. Input validation and injection

Prayer/testimony validation runs in `src/services/forms.ts` and is called by the submission handler. Name and message limits cannot depend solely on `TextInput.maxLength`. The UI preserves Yoruba and ordinary punctuation, rejects harmful control characters, and validates after switching form types. No email or user-entered phone fields exist to validate.

The optional donation amount rejects negative/zero/nonfinite values, exponent notation and more than two decimals; it is capped at ₦1 billion. It is a voluntary requested gift, not a trusted invoice amount. Hymn queries are capped at 200 characters and operate locally. Routes validate date/format/recording IDs before using them; arbitrary URLs cannot become player sources.

App text is rendered as React Native text, not HTML. Script/HTML text remains literal and WhatsApp text is URL-encoded. There is no SQL execution, HTML injection sink, `dangerouslySetInnerHTML`, runtime `eval` or app WebView. Input has not been destructively stripped of legitimate Yoruba text. If a future backend renders submitted text as HTML, it must escape/sanitize at that rendering boundary.

## 6–7. HTTPS, external links and WebViews

No production HTTP URL was found in the app's source/configuration. Source tests intentionally contain rejected HTTP examples; SDK development tooling may contain local Metro URLs. The build configuration disables cleartext traffic for the installed release.

`src/services/url-policy.ts` enforces the actual destination policy, and `links.ts` uses it before browser/dialer handoff. Native WhatsApp uses only an internally constructed fixed-recipient intent. Incoming deep-link parameters select existing local content; they cannot create donation/admin actions or supply an arbitrary media URL. The app does not embed a WebView. External browsers/providers can navigate further under their own controls; this allowlist is not proof of merchant identity or a guarantee about a provider's redirects.

## 8. Local storage

| Storage | Contents |
| --- | --- |
| AsyncStorage `mount-zion.preferences.v1` | Language, text size, favourite hymn keys, devotional bookmarks/read dates, prayer checklist progress, and download metadata (catalog ID, format, filename, private URI, size, saved date) |
| AsyncStorage `mount-zion.hymns.v1.manifest` and generation chunks | Public hymn text and download/cache metadata; 35 validated chunks, 2,100 entries |
| Private document directory `mount-zion-media/` | User-selected MP3/MP4 recordings |
| Bundled assets / library-managed app caches | Church pictures/logo/fonts and normal platform asset/media caches |
| Memory only | Form name/message, optional donation amount and current UI state |
| Clipboard, only after Copy | Public receiving account number |

No private credential, prayer message, payment detail or app authorization token is persisted in AsyncStorage. SecureStore is not needed for the current noncredential preferences. Religious reading/progress choices are still personal information: the privacy explanation covers local storage and external handoffs. Uninstall clears private app storage; exported/shared copies, WhatsApp messages and provider records can remain elsewhere.

The hymn cache validates manifest keys/counts/dates, aggregate size, text types, uniqueness and complete books. A refresh publishes the new manifest only after chunks are written; failure keeps the old book. Preferences are bounded before parsing and reject malformed values. File playback/sharing/deletion requires a canonical catalog filename in the current sandbox, not a path prefix.

## 9. Admin functionality

No add/edit sermon, devotional, event, church-information, upload or notification screen/API exists. Content changes are developer-time edits/imports followed by a new build. The import parser was hardened; it is not an authenticated administration service. No hidden route/button is being used as an authorization control.

## 10. Donations/payments

No Paystack secret/public key, payment SDK, raw ATM/card/PIN field, payment initialization/verification endpoint, webhook or frontend “payment verified” state exists. Bank transfer displays the public recipient details; “I have made a transfer” prepares a message and the church must check receipt. Card checkout is empty by default and requests a link through WhatsApp.

No backend transaction verification was added because the app currently does not recognize or fulfill transactions. **It is not an automated verified payment system.** Changing the optional gift amount locally does not grant content or prove payment. If automatic confirmation/receipts are added, the backend must generate/validate references, verify provider transaction status, amount/currency/recipient, handle duplicates and webhooks, and never trust a frontend success callback. [Paystack's verification documentation](https://paystack.com/docs/payments/verify-payments/) requires secret-key server calls.

Verify the account name/number and checkout beneficiary before release. Review giving under [Google Play's payment policy](https://support.google.com/googleplay/android-developer/answer/9858738): the policy has a tax-exempt donation exception, but this audit did not establish the church's eligibility. No paid digital-content entitlement is implemented here.

## 11–12. Logs and failure handling

No app-owned `console.log`, `console.warn`, `console.error` or `debugger` remains in `src`. The import utility prints counts only, during developer use; it does not log user data or keys. SDK/native debug logging was not globally disabled or falsely treated as inspected release output; review actual device/release logs before upload.

The generic route boundary hides raw diagnostics. Forms/handoffs/downloads catch failures and show plain messages. Hymns keep good cached data on refresh failure and guide first-time offline users to connect. Video/audio have loading/error/reload states; unavailable catalog IDs show an empty state. Asset photos/fonts are bundled and were preserved/exported. Recorded browser failures produced no uncaught application errors.

## 13. Offline and adversarial testing

**23 unit tests passed**, including the 13 original behavior tests and added security cases. **38 production-web browser checks passed**, with browser network disabled for offline cases and only local bundled assets fulfilled. Online hymn cases replayed the four real responses retrieved during the audit, with CORS headers for the browser harness. This distinguishes JS/UI testing from native Android testing. No message was sent, payment made or remote record changed.

| Requested area | Result / scope |
| --- | --- |
| Home | Fresh offline content rendered |
| Hymns, searches, favourites, English/Yoruba | First offline failure guidance; all 2,100 entries loaded; cached reload made no API requests; number/lyric/accent-insensitive searches and saved preferences/favourites worked offline |
| Devotional | Offline reading rendered; malformed date link recovered |
| Prayer plans | Bundled offline screen rendered |
| Sermons/media | Catalog rendered offline; unavailable video showed error/reload; missing/unknown recording IDs handled; invalid/redirected/oversized/offline downloads failed cleanly |
| Events | Bundled services/locations screen rendered; no separate event API/screen exists |
| Live, internal chat, profile | Not present; not claimed as tested. WhatsApp is an external contact handoff. |
| External links/forms | Submission limits, Unicode/HTML text encoding, wrong donation amount and failed handoff tested; no external action completed |
| Damaged data / APIs | Corrupt preferences/manifest, malformed/empty/HTML/503/oversized hymn responses did not crash or replace a good cached book |

Timeout/received-byte limits and sandbox attacks were tested in unit cases. Native download cancellation, filesystem cleanup, stored MP3/MP4 playback/sharing, offline cold launch and external-app handling **still require physical Android tests**. Browser tests do not prove those OS behaviors.

## 14. Hymns

The four live public endpoints returned HTTP 200 over HTTPS with no credential. English/Yoruba each had 1,000 regular and 50 additional hymns. The stricter parser accepted all 2,100; the normalized cache was 1,784,439 bytes. Data and cached objects are bounded, type-checked and rendered as plain text; search does not execute remote queries or HTML. Unexpected responses cannot silently become incomplete cached books. Provider outages and future schema changes remain external dependencies.

The API's lack of browser CORS headers affects a fresh web preview; Android networking does not use browser CORS. No broad CORS proxy or private API key was introduced. Public availability alone does not establish permission to redistribute hymn texts/translations: obtain the provider/data owners' permission and required attribution before Play publication.

## Remaining checks before Google Play

1. **Actual Android release:** build/install the preview APK and test offline cold launch, cached English/Yoruba hymns and favourites, local devotional/prayer screens, streamed/unavailable media, download/cancel/delete/share/playback, missing external apps, splash and clean release logs. Inspect the signed production AAB's merged permissions, target API, cleartext/backup/debug flags and production signature. This workspace did not build or submit one.
2. **Privacy/Data safety:** supply an approved public privacy-policy URL and complete Play declarations for the actual optional WhatsApp/form/payment handoffs, network providers and any SDK additions. Include developer/church identity, contact, recipients, retention/deletion practices and local/exported data. Do not state that no data leaves the device merely because there is no login. The app's Privacy text is updated, but no approved hosted policy was supplied here. See [Google's user-data policy](https://support.google.com/googleplay/android-developer/answer/10144311).
3. **Giving:** church confirms recipient details and any checkout link, and determines applicable donation/payment policy eligibility. A real provider checkout or backend verification service was not supplied or tested.
4. **Hymn rights:** confirm API/data redistribution and translation rights/attribution.
5. **Your actual repository/build inputs:** check later local edits, environment files and Git history. Preserve the new ignore rules, vendor adapter, npm alias and lockfile. Rotate a credential if found outside this audited copy. Keep production signing secrets outside runtime/public build values.

## Reproduce source checks

Use Node 24 LTS and the supplied lockfile in the extracted app folder:

```powershell
npm ci
npm test
npm run typecheck
npm run lint
npm audit
npm outdated
npx expo-doctor
npm run export:android
```

`npm outdated` intentionally exits nonzero when newer packages exist; that is not a vulnerability result. Native security configuration takes effect in a newly built installed app, not by changing Expo Go's own permissions. The browser QA result JSON, original/final scans, dependency reports, configuration evidence and test logs accompany this source; the browser harness is supplied for review, with its environment requirements noted in the evidence README.

Relevant primary guidance consulted: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [public environment variables](https://docs.expo.dev/guides/environment-variables/), [Expo Android permissions](https://docs.expo.dev/guides/permissions/), [SDK 57 build properties](https://docs.expo.dev/versions/v57.0.0/sdk/build-properties/), [Android network security](https://developer.android.com/privacy-and-security/security-config), [Node vm limitations](https://nodejs.org/api/vm.html), the two linked vulnerability advisories, and linked Play/Paystack guidance. Checked on the audit date.
