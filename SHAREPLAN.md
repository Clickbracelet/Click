# Share my Click: plan

Let a user share a link to their account so someone else can add them as a click from another phone.

Building and testing this needs no deployment. The app already handles links (`click/<id>` opens a click), so sharing adds one new link type and a few database functions. Hosting is only needed later, so the link also works for people who aren't running Expo Go against the dev server (see [Do we need to deploy?](#do-we-need-to-deploy)).

---

## How it works

1. You tap **Share my Click** in the app. It shows your link, a QR code and the phone's share sheet (text, AirDrop, etc.).
2. The link carries a **share code** for your account, for example `…/add/k7Qm2xPa9T`. The code isn't your user ID: it's a random code that can't be guessed and that you can reset if a link spreads too far.
3. Another phone opens the link. The app waits until that person signs in and shows a preview card ("Add **Your Name** as a click?"). It never adds silently, so a stray link can't fill someone's list.
4. They tap **Add**. Supabase creates a click in their account from your profile and links it to your account. The app then opens their clicks list with your card expanded and scrolled into view, the same as NFC tag links and Ask cards do now.

The same link can be written to a bracelet's NFC tag. Tapping your bracelet would then add you, which is close to the real product without new hardware.

---

## Phase 1: database (Supabase only) — done

Applied to the Supabase project in `supabase/migrations/20261116000000_add_share_links.sql` and `20261116000100_allow_profile_upsert_id.sql`. The app calls these with `supabase.rpc(...)`:

| Function | Returns |
| --- | --- |
| `get_my_share_code()` | Your share code (made on first call, then the same each time) |
| `reset_share_code()` | A new share code; the old one stops working |
| `get_share_preview(code)` | `{ name, photo_url, description, is_self }`, or no rows if the code is unknown |
| `add_click_from_share(code)` | The new (or refreshed) click's ID. Errors with "That share link is no longer valid" or "That is your own share link" |

All four need a signed-in user. Clients can no longer write `profiles.share_code` directly.


- **`profiles.share_code`:** a unique, random 10-character code, created the first time the user shares.
- **`get_share_preview(code)`:** returns only the name, photo and short description, for the confirm card.
- **`add_click_from_share(code)`:** runs inside the database with permission to read the sharer's profile, which their own access rules otherwise hide. It:
  - refuses if the caller is signed out or the code is their own;
  - builds the click's snapshot (name, interests as the description, bio, photo, socials, custom links) in the database, so nobody can fake what was shared, and never includes the sharer's email;
  - inserts the click into the caller's account with `other_user_id` set to the sharer;
  - is safe to run twice: opening the same link again updates the existing click instead of making a duplicate;
  - returns the click's ID.
- **`reset_share_code()`:** makes a new code, so old links stop working.
- Existing access rules on `clicks` and `profiles` stay as they are. Nothing becomes publicly readable.

## Phase 2: app (`mobile-app/App.tsx`, no new hosting) — done

- `parseLink` reads both `click/<id>` and `add/<code>` links.
- An `add/<code>` link waits for the page and sign-in, looks up who it belongs to, and asks "Add <name>?" (the page's card since Phase 3).
- After adding, the app reloads clicks and opens the new one expanded in the clicks list.
- The page can send the plain message `share-profile` to open the share sheet (`navigator.share` on web, or copy the link if the browser can't share).


- Turn `clickIdFromUrl` into a link parser that knows two routes:
  - `click/<id>`: open an existing click (already works).
  - `add/<code>`: add someone from their share link.
- A pending share code waits for the page to load and the user to sign in, the same way the pending click ID does now.
- A new page message, `share-profile`: the app gets (or creates) the user's code and opens `Share.share` with the link.
- After an add, reload clicks and open the new click with the existing expand-and-scroll (`window.__clickOpenClick`).

Link formats:

| Where | Link |
| --- | --- |
| Expo Go | `exp://<computer IP or tunnel address>/--/add/<code>` |
| App builds | `clickbracelet://add/<code>` |
| Web | `http://localhost:8081/add/<code>`, or the hosted address once deployed |

## Phase 3: page (`Frontend.html`) — done

- **Share my Click** button on the You (settings) screen opens a Share sheet: QR code, the link (selectable), **Share link**, **Reset link** (asks first) and **Done**.
- The app draws the QR code with `qrcode-generator` (pure JavaScript, works in Expo Go) and hands the page a data URL, since the page can't load scripts from the internet.
- "Add <name>?" card with their photo or initial and interests, **Add to my clicks** and **Not now**.
- Page ↔ app messages: `get-share-link`, `reset-share-link`, `share-profile`, and `{ type: 'add-share-answer', add }`. The app fills the page with `shareLink`, `shareQr` and `addPreview`.
- Signing out closes both and clears the link.


- A **Share my Click** button on the profile/settings screen, showing the link and a QR code. Any phone's camera can scan the QR.
- The "Add as a click?" confirm card, with Add and Cancel.
- A **Reset link** option in settings.
- Rebuild `mobile-app/html.json` after editing `Frontend.html`.

## Phase 4: real https links (needs hosting)

- Deploy the web build so links are normal `https://` addresses that work without the dev server.
- Add the hosted domain to the Supabase redirect URLs (Authentication → URL Configuration).
- Later, with a real app build: universal links (iOS) and App Links (Android), so an https link opens the installed app instead of the browser.

---

## Do we need to deploy?

| Goal | Hosting needed? |
| --- | --- |
| Test with you and friends in Expo Go | **No.** Links look like `exp://<your tunnel>/--/add/<code>` and work for anyone with Expo Go while your `--tunnel` server is running. |
| A normal link anyone can open from a text, QR or NFC tag, even without the server running | **Yes:** host the web build. |
| An https link that opens the *installed phone app* instead of the browser | Hosting, plus a real app build (EAS Build and an Apple Developer account, $99/year). Expo Go can't do this. |

**Recommended host: EAS Hosting** (Expo's own) rather than Vercel. The web build already does everything (sign-in, clicks, Ask AI), and deploying it is two commands:

```sh
npx expo export --platform web
eas deploy
```

That gives a free address like `https://click-bracelet.expo.app/add/<code>`. Someone who opens it in a browser can sign in with Google and add you right there.

Vercel would also work. You'd upload the same `dist` folder and add a rewrite so `/add/*` loads the app.

Supabase on its own can't serve the page: Edge Functions on the default domain serve HTML as plain text.

---

## Open decisions

- **One-way or mutual?** The plan adds the sharer to the other person's list only. Mutual (they also show up in the sharer's list) needs a consent step on the sharer's side, so it's left for later.
- **What gets shared:** the whole profile, or one of the prototype's "presets" (choosing what you share per situation)? Starting with the whole profile is simpler.
