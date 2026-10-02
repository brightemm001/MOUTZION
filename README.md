# Mount Zion app

A React Native Android app using Expo SDK 57 and Expo Router. This project carries the current Mount Zion website content into an app, with CAC hymns and local favourites.

Version 1.0.1 adds live church content, automatic refresh, scheduled events, and offline content caching. Read `CONTENT-UPDATES.md` to maintain the public content list.

This source includes the 1 October 2026 security audit fixes. Read `SECURITY-AUDIT.md` before preparing a Play release. The source checks passed; a signed Android release and physical-device tests remain necessary.

## Redesigned interface

This revision replaces the first interface with a warm cream background, magenta accents, clearer navigation, and redesigned home, hymn, media, devotional, prayer, giving, and menu screens. Inter is bundled for the interface and Noto Serif for scripture and hymn reading; the fonts work without a network connection and include Yoruba letters and tone marks. Their SIL Open Font licenses are included in `assets/fonts/`.

The home screen uses the original pastor photograph, four quick actions, and today's devotional. Hymns have a search field, language switch, favourites, and a compact numbered list. Media has scrolling category filters, video/audio actions, and MP3/MP4 downloads. Prayer plans show a night summary and a checklist with saved progress.

See `previews/overview.png` for the actual mobile web screens. The individual previews show a 390 × 844 viewport. The original church photograph and logo files are unchanged.

## Run it on your Android phone

1. Extract the ZIP and open the `mount-zion-app` folder in VS Code. Keep this separate from your existing `MZION` website folder.
2. Install Node.js 24 LTS on your computer and the latest **Expo Go** on your Android phone.
3. In the terminal inside `mount-zion-app`, run:

```powershell
npm ci
npx expo start
```

4. Connect the computer and phone to the same Wi-Fi. Scan the terminal's QR code using Expo Go.

If your network prevents the phone from connecting, stop the server with Ctrl+C and try `npx expo start --tunnel`. Expo may offer to install its tunnel helper. If Expo Go reports an SDK mismatch, update Expo Go; this project uses SDK 57.

The custom church-logo launch screen is configured for the installed Android app. Expo Go has its own launch screen, so use the preview APK below to inspect the complete native splash.

## Included

- Church logo on startup and in the app header; original church photographs.
- Home, Hymns, Media, Devotional, and More navigation, plus a visible menu button.
- CAC English and Yoruba hymn books, including additional hymns. The current API supplies 1,000 regular and 50 additional hymns per language.
- Hymn search by number, opening line, or words from any stanza or chorus. Yoruba searches accept text with or without tone marks.
- Favourite hymns, English/Yoruba switching, adjustable reading size, and offline hymn caching after the first successful download.
- All 31 October 2026 devotionals from the website, in English and Yoruba, plus the website's rotating readings for other dates. Bookmarks, sharing, and reading progress are local.
- Seven bilingual prayer plans, each with three nights and seven points per night. Completed prayer points are remembered.
- All 12 current recordings, with prayer, sermon, praise, and gathering filters; video and audio playback; named MP3/MP4 downloads; offline playback and file sharing on Android.
- Weekly services, three locations, map links, WhatsApp prayer requests and testimonies, calling, Facebook, and TikTok.
- Giving with the website's Ecobank details, copy-account button, and a WhatsApp request for the official card payment link.
- Privacy and source information.

Recordings stream from the existing website instead of adding roughly 141 MB to the app download. Saved recordings remain in the app's own storage; use **Save or share file** to export one. No camera, microphone, storage-access, or overlay permission is requested by the release configuration.

## Giving and website configuration

The bank details match the current website: **Ecobank · 2093029275 · Afolabi Olaniyi**. Check these with the church before publishing a release.

The app prepares a WhatsApp message; the user taps Send in WhatsApp. It does not submit a payment or confirm a transfer itself. The transfer flow copies the receiving account number so the user can paste it in their own bank app. Selecting the user's most frequently used bank and prefilling that bank's transfer screen is not implemented; bank-specific integrations would be needed.

Card checkout currently requests the church's payment link, matching the website. To connect an actual checkout page, copy `.env.example` to `.env` and set `EXPO_PUBLIC_CARD_CHECKOUT_URL` to the church's verified HTTPS checkout URL. Restart Expo after changing it. The payment provider handles card details. An optional gift amount is used in the request message; a configured checkout URL determines its own amount and payment completion flow.

The default website is `https://mountzion-lemon.vercel.app`. If the Vercel address changes, update `EXPO_PUBLIC_WEBSITE_URL`. For cloud builds, put these public values in the selected build profile's `env` object in `eas.json`, or configure them in your Expo project's EAS environment. Never place a payment provider's secret key in an `EXPO_PUBLIC_` variable.

## Create an installable APK

Use your own free Expo account. Run these in the app folder:

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```

`eas init` links this project to your Expo account. EAS can generate and manage the Android signing credentials. After the build finishes, open its download link on your Android phone and install the APK.

No Android Studio or emulator is required for this cloud build. Expo's build service availability and limits depend on your account.

## Prepare the Google Play upload

The Android package is currently **`com.brightemm001.mountzion`**. Confirm that this is the identifier you want before your first store release.

Create the signed Android App Bundle:

```powershell
npx eas-cli@latest build --platform android --profile production
```

Upload the resulting `.aab` through your own Google Play Console account. This source ZIP is not an APK or a store upload, and no Play submission or signed binary is included. Test a preview APK on a real phone first, especially the native splash, playback, offline downloads, sharing, and WhatsApp handoff.

Before release, obtain the hymn provider's permission for this use and verify any rights needed for hymn text and translations. Public API access alone is not a reuse license. Publish a public privacy policy matching the app and complete the Play listing, Data safety information, and any testing steps required for your Play account. The app's **Privacy** screen provides the current behaviour to use when preparing that policy.

Official instructions: [Expo Android production builds](https://docs.expo.dev/build-reference/apk/), [EAS Build setup](https://docs.expo.dev/build/setup/), [Google Play app setup](https://support.google.com/googleplay/android-developer/answer/9859152), and [Google Play user-data policy](https://support.google.com/googleplay/android-developer/answer/10144311).

## Content and maintenance

- Website source: [brightemm001/MOUNTZION](https://github.com/brightemm001/MOUNTZION), snapshot commit `a5411a38cb4e00b42ad9fc9facabfa8b320109eb`.
- Hymn provider: [Hymnize](https://hymnize.com). Four public collection endpoints are fetched directly in the Android app. Their availability and transcription accuracy depend on the provider.
- The API was discovered through [Livingstone17/cac-hymnal-api](https://github.com/Livingstone17/cac-hymnal-api). That repository's code and complete hymn data are not copied into this project.
- The alternative HymnFlow dataset was not used because its English data treated some stanzas as separate hymn numbers.

Hymns download on the first visit to **Hymns** and are then read from local storage. A refresh failure keeps the previous complete cache. Church readings and photographs are bundled and work offline immediately.

Church content now loads from the public HTTPS file at `/app-content.json` on the configured church website. The first launch uses bundled readings while checking online. Valid updates are saved locally and remain available offline. Refresh runs on launch, when returning to the foreground, every five minutes while active, and through **Refresh church content**. Content stays usable if the network is unavailable or a response is invalid.

For future media, bilingual devotional, prayer, and event updates, follow `CONTENT-UPDATES.md`. Updating and publishing the content list does not require another APK. Changes to app screens, native features, the website host, payment configuration, or other bundled configuration still require an app release. Anyone using an older APK must install version 1.0.1 once to get live content.

Daily dates use Nigeria's time zone. October 2026 has the full dated month from the current website; dates outside that month use the existing seven-reading rotation. Additional future dated months have not been created.

`npm run web` provides a browser preview. Hymnize's current API does not return browser CORS headers, so a fresh browser preview may fail to fetch hymns; test the direct API and offline hymn functionality on the Android app. Browser media downloads go to the browser's Downloads folder rather than the app's offline library.

## Checks

```powershell
npm test
npm run typecheck
npm run lint
npx expo-doctor
npm run export:android
```

The tests cover hymn numbering, searches, bilingual readings, prayer plans, date boundaries, giving amounts, corrupted saved data, unsafe links, oversized inputs/responses, sandbox paths, data-only imports, and dependency compatibility. See `VERIFICATION.md` and `SECURITY-AUDIT.md` for the checks completed for this version.

Keep `vendor/decode-uri-component/` and the `decode-uri-component-fixed` dependency when copying this project. The small CommonJS adapter uses the unmodified patched decoder from npm so Expo Router's existing URL parser keeps working. `npm ci` installs the locked versions; avoid `npm audit fix --force` or independently upgrading React Native/Expo packages.

The public website setting must be an HTTPS origin. Card checkout settings accept only a verified Paystack or Flutterwave HTTPS link. Other hosts fail closed to the existing WhatsApp request flow. These public settings cannot hold secret keys. `.env*` files are excluded from Git and EAS uploads except `.env.example`; use the EAS environment or build-profile public settings for cloud builds.
