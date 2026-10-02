# Mount Zion content updates — version 1.0.1

The public feed is already committed to `brightemm001/MOUNTZION` on `main`:
https://mountzion-lemon.vercel.app/app-content.json

There is no public upload/admin API and no secret key in the app. Publishing requires the church operator's existing GitHub access. Everyone can read the public feed. The feed cannot change bank accounts, payment links, contact recipients, API origins or execute JavaScript.

## Start using live content

1. Extract this updated source and open `mount-zion-app` in VS Code.
2. Run `npm ci`.
3. Build a new preview APK:

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```

If already linked to your Expo project, reuse that project and its existing Android signing keystore. This version retains the Android package `com.brightemm001.mountzion`, uses version 1.0.1 and versionCode 2. Keep increasing versionCode for future native builds.

4. Install this APK once on each phone. Older APKs do not gain this capability by themselves.

Afterward, the app checks for content at launch, foregrounding, every five minutes while active, and when the reader taps **Refresh church content**. It displays bundled content on a first offline launch and the latest saved public content on later offline launches. Video/audio streaming still needs internet unless the recording has been downloaded.

## Publish future changes — editable JSON

The editable master is `content/app-content.json` in this app source.

Before editing, run `git pull` in your website folder to get the feed and `vercel.json` already committed during this update.

1. Edit that JSON file. It contains all existing public recordings, English/Yoruba readings, prayer plans, and an empty `events` list ready for scheduled events.
2. To add a recording, add a `media` entry and upload both files to the website's `media/sermons` directory. For example:

```json
{
  "id": "faith-that-overcomes",
  "title": "Faith That Overcomes",
  "category": "sermon",
  "slug": "faith-that-overcomes",
  "file": "faith-that-overcomes",
  "poster": "pastor-preaching"
}
```

Upload `media/sermons/faith-that-overcomes.mp4` and `media/sermons/faith-that-overcomes.mp3`. The app offers playback and downloads for both. Categories are `sermon`, `prayer`, `praise` and `gathering`. Use unique IDs. Keep an existing recording's `id`, `file` and `slug` unchanged so saved downloads remain associated with it. Keep older entries when they are still needed for offline downloads. Available poster keys: `pastor-preaching`, `prayer-gathering`, `revival`, `city-of-prayer`, `pastor`, `womens-ministry`.

3. For a devotional, copy an existing `dated` entry, set its `date` to `YYYY-MM-DD`, and replace all English (`en`) and Yoruba (`yo`) fields. Do not create two entries for the same date. Its message is an array of paragraphs. Dates without a dated reading use the bilingual rotating collection.
4. To add an event, add an entry to `events`:

```json
{
  "id": "december-revival-2026",
  "date": "2026-12-01",
  "title": { "en": "December Revival", "yo": "Ìsọjí Oṣù Kejìlá" },
  "description": { "en": "Join us for worship and prayer.", "yo": "Ẹ bá wa fún ìjọsìn àti àdúrà." },
  "time": "4:00–6:00 PM",
  "location": "Okuku headquarters"
}
```

This is an example only; no event has been announced by the app. Upcoming events appear on Home and Services and locations in the selected language. Past dated events leave the upcoming list automatically.

5. From the **app folder**, validate and copy the feed into your actual website folder:

```powershell
npm run content:publish -- "C:\Users\HP\Documents\MY PROJECT\MZION"
```

6. From the **website folder**, commit/push your revised feed and recordings to the website's repository. With the existing Vercel integration, the website redeploys.

```powershell
git add app-content.json media/sermons
git commit -m "Update church app content"
git push
```

Check the public feed URL, then tap **Refresh church content** in an installed app. No APK rebuild is needed for these content changes. Adding a video only to the website's HTML/JavaScript does not change this separate list automatically: update this list or use the sync command below.

## Alternative: import your existing website catalog

If you maintain recordings through `sermon-library.js` and devotionals/prayers through the existing website JavaScript files, run this from the **app folder**:

```powershell
npm run content:sync -- "C:\Users\HP\Documents\MY PROJECT\MZION"
```

This imports the existing website's October 2026 dated collection, rotating devotionals, bilingual prayer plans, recordings and original photos. It checks that both MP3 and MP4 files exist and generates `app-content.json` in the website folder. Existing feed events and dated readings outside the imported month are preserved. Commit/push the website afterward. Additional future dated readings can be maintained directly in the JSON feed.

## Limits and checks

The app rejects malformed JSON, HTML error pages, redirects, incompatible schema versions, missing language data, duplicate IDs/dates, unsupported categories/posters, invalid filenames, huge arrays, or content over 4 MB. Requests time out after 12 seconds and overlapping refreshes share one request. Failure keeps the previous usable content.

Only plain text is rendered. Remote data cannot add arbitrary external domains or executable code. The website serves the public feed with JSON MIME, public-read CORS headers, and revalidation caching through `vercel.json`. Media remains restricted to the configured HTTPS church website. Offline storage contains public church content, not credentials or submitted prayer requests.

Validation for this change: 30 unit tests, 12 browser integration checks including offline reopening and invalid feeds, lint, typecheck, Android Hermes export and web export. These are source/bundle checks; a signed APK and real Android device testing still need to be performed by the owner.

The earlier `SECURITY-AUDIT.md` and `audit-evidence/` describe the previous audit. New change evidence is in `content-update-evidence/`.
