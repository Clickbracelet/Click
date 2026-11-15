# Click Project Plan

## Product vision

Click is a companion app for a Bluetooth bracelet that lets people capture meaningful in-person moments with a simple tap. A Click can be saved with the people, place, event, and context that make it memorable, while giving the wearer clear control over what they share and when.

## Current prototype

The prototype is a single-page mobile experience that demonstrates:

- Bracelet pairing and connection status.
- A profile with interests, bio, photo, and connected social accounts.
- A Click timeline with filters and individual-person details.
- Presets for choosing which accounts or details are shared.
- Event-based Click capture, including an optional time window and location.
- Privacy controls, notification sound settings, and a lightweight in-app assistant.

## Goals

1. Make pairing and first-time setup feel fast, welcoming, and trustworthy.
2. Make every Click easy to understand, review, and enrich later.
3. Give people granular, legible control over data sharing and social links.
4. Turn the prototype into a reliable, accessible app that can connect to real bracelet hardware.

## Roadmap

### 1. Validate the product experience

- Refine the onboarding journey: welcome, bracelet pairing, profile, social links, and presets.
- Define what a Click records by default and what always requires user confirmation.
- Test core flows with prospective users, especially first use, meeting someone, and reviewing a past Click.
- Establish visual foundations: warm, personal styling; responsive layout; accessible colors and typography.

### 2. Build the app foundation

- Split the prototype into maintainable app components and screens.
- Add a local data model for people, Clicks, events, presets, and privacy settings.
- Persist state locally and define a migration strategy for future data changes.
- Add automated checks for key UI and data behaviors.

### 3. Integrate bracelet and phone capabilities

- Connect to the bracelet over Bluetooth with clear connection, retry, and recovery states.
- Capture bracelet interactions reliably and queue them when the phone is offline.
- Request location only when needed and explain the reason in context.
- Design for battery use, permissions, device compatibility, and graceful degraded behavior.

### 4. Make sharing intentional

- Let people configure social links and reusable sharing presets.
- Confirm what will be shared before an interaction completes.
- Support editing, deleting, and exporting a Click and its associated details.
- Define consent, blocking, and reporting flows before any multi-person sharing launches.

### 5. Prepare for launch

- Add account, sync, backup, and recovery flows only after privacy expectations are clear.
- Instrument privacy-respecting product analytics and error reporting.
- Complete accessibility, security, performance, and device-compatibility reviews.
- Pilot with a small group, address reliability issues, and document support procedures.

## Guiding decisions

- Privacy and consent come before convenience: no hidden sharing and no surprise location capture.
- The bracelet interaction must remain useful even when connectivity is imperfect.
- Keep the interaction model simple: tap to capture, then review or add context when convenient.
- Treat social links as user-controlled contact details, never as a requirement to use Click.

## Change log

Record meaningful product, design, architecture, and delivery decisions here. Add the date, a concise description, and any follow-up work.

- 2026-11-13 — Created the initial product plan and roadmap.
- 2026-11-13 — Added an Expo mobile wrapper that renders the existing HTML prototype in a WebView for iPhone testing. Native React Native screens can replace the embedded page incrementally.
- 2026-11-14 — Updated the prototype canvas and browser background to Click’s warm cream (`#F5F0E8`), replacing the previous pink-leaning background while retaining rose gold as an accent.
- 2026-11-14 — Made onboarding profile requirements explicit: users must provide a name, a short bio, and at least one usable social handle or link before completing setup.
- 2026-11-14 — Updated the successful pairing indicator: only its outer ring pulses pink with a purple glow; the cream center and gold check remain unchanged.
- 2026-11-14 — Made all three profile descriptor lines required during setup and added a light-pink outline to any line left blank after the user tries to continue.
- 2026-11-14 — Reframed profile descriptors as “Interests & Communities.” One entry is required; this accommodates hobbies, organizations, academic identity, and social groups without awkward adjective/noun phrasing. “Architecture major” is an example within this group, not a separate category.
- 2026-11-14 — Redesigned the profile setup preview as a square, dating-app-inspired card with a large image area above stacked identity details.
- 2026-11-14 — Expanded Interests & Communities to four optional entry boxes while retaining the one-entry minimum; restored “Coffee lover” as an example.
- 2026-11-14 — Updated the preview’s empty state to show example interest groups, then replace them with the user’s actual entries as soon as they type.
- 2026-11-14 — Refined the profile preview with a circular photo treatment and camera placeholder; example interests use light gray and user-entered interests return to the standard brown text color.
- 2026-11-14 — Restyled the profile preview as a tall, centered card inspired by the approved reference; bio text now appears live beneath the user’s interests once entered.
- 2026-11-14 — Combined Name and Interests & Communities into a clear required identity section: if either is missing, the relevant fields turn red and explain the minimum needed to continue.
- 2026-11-14 — Standardized all Name and Interest validation borders. Entering any interest clears the field highlights; the helper message remains until both the name and one interest are present.
- 2026-11-14 — Refined validation feedback so entering a name also clears the red outlines immediately, while the helper message continues until both requirements are complete.
- 2026-11-14 — Split profile identity validation into independent Name and Interests & Communities groups; each clears its own highlight only after its own requirement is met.
- 2026-11-14 — Made Bio optional during setup. Users can continue once Name and at least one Interest or Community are provided; any bio still appears live in the preview.
- 2026-11-14 — Added preview-only mock location and time context rows to illustrate the complete Click profile format without collecting additional user input.
- 2026-11-14 — Centered the preview-only context rows and updated their sample copy to “Location you clicked” and “11:11.”
- 2026-11-14 — Centered each preview context row as a complete icon-and-text unit; updated the sample time to “November 13th, 5pm.”
- 2026-11-14 — Replaced the social-account setup alert with a red inline helper message; refreshed the Expo wrapper so the phone app matches the current prototype.
- 2026-11-14 — Simplified social setup: the top seven platforms appear first, remaining built-ins use a “Show more platforms” control, and additional services must be selected from a real-app/website picker. Custom websites require a valid web address.
- 2026-11-14 — Added a matching “Show less platforms” control so users can collapse the expanded social-platform list back to the top seven.
- 2026-11-14 — Restored the collapsed-view “Show more platforms” control alongside its expanded-view “Show less platforms” companion.
- 2026-11-14 — Refreshed the Expo wrapper’s bundled HTML from the current prototype so `Frontend.html` and the phone app stay aligned for collaborators.
- 2026-11-14 — Disabled “Add another app or website” until the current custom app/site has both its platform and handle or link filled in.
- 2026-11-14 — Replaced the additional-profile-link picker with a searchable text field backed by the supplied 250-app/website catalog. Only catalog entries are accepted.
- 2026-11-14 — Added app-specific handle/link examples for every catalog entry, so each custom profile field shows the expected format as soon as a platform is chosen.
- 2026-11-14 — Moved the incomplete custom-link guidance directly beneath its heading and restyled it as a red, asterisked required-field message.
- 2026-11-14 — Simplified the custom-link heading and required-field copy to make the next action clearer.
- 2026-11-14 — Made the custom-link warning appear only after an unrecognized app/site name is typed; it clears as soon as a catalog app/site is entered.
- 2026-11-14 — Added automatic case normalization and close-typo correction for approved custom app/site names.
- 2026-11-14 — Deferred custom app/site name correction until the field loses focus, preserving the user’s text while they type.
- 2026-11-14 — Removed the custom app/site red asterisk helper while retaining catalog-only validation.
- 2026-11-14 — Completed custom app/site entries now become standard account cards above the platform-expansion controls, with the same active toggle and editable handle field.
- 2026-11-14 — Replaced the additional app/site catalog and its link-format examples with the supplied 150-entry list.
- 2026-11-14 — Replaced the old “Add another app or website” controls with a top-of-list searchable catalog field. Selecting a recognized app/site creates its matching account card and preserves blur-based case and typo correction.
- 2026-11-14 — Updated the searchable catalog field so an exact approved app/site match immediately adds its account card; close typos still resolve when the field loses focus.
- 2026-11-14 — Moved newly created custom account cards directly beneath the catalog search field so the result is immediately visible.
- 2026-11-14 — Renamed the catalog field prompt to “Add apps or websites.”
- 2026-11-14 — Made the app/site field react on every keystroke, immediately creating the matching account card when an approved name is entered.
- 2026-11-14 — Recorded the active Supabase project and the auth/data integration roadmap; added local secret and environment files to `.gitignore`. Google OAuth provider configuration still needs dashboard verification.
- 2026-11-14 — Confirmed Google is enabled in Supabase Auth and its authorize endpoint starts successfully; added a PKCE OAuth callback flow to the Expo layer and bridged the prototype Google and sign-out buttons to native auth.
- 2026-11-14 — Fixed a blank Expo screen caused by unescaped newlines in `html.json`/`Frontend.html`; added `App.web.tsx` so `expo start --web` previews the prototype in an iframe (native Google sign-in is skipped on web).
- 2026-11-14 — Upgraded the Expo app from SDK 54 to SDK 58 (React Native 0.88, React 19.3); moved splash config to the `expo-splash-screen` plugin and removed `newArchEnabled`/`edgeToEdgeEnabled`, which are now always on. Regenerate `ios/` before the next native build.
- 2026-11-14 — Made the prototype fill the device screen: added a viewport meta tag and replaced the fixed 390×844 canvas with `100vw`/`100vh`.
- 2026-11-14 — Saved profiles (name, bio, interests, socials, photo) to Supabase `profiles` and the `avatars` bucket, loaded them after sign-in, and replaced the "restart demo" link with a Sign out button. Added `ASKAIPLAN.md` for the Ask AI design.
- 2026-11-15 — Completed Ask AI Phase 1: added the owner-only `clicks` table and the dev-only `seed_demo_clicks()` test data, loaded each user's clicks in place of the demo `CLICK_DATA`, and saved note, event and remove changes back to Supabase.
- 2026-11-15 — Completed Ask AI Phase 2: deployed the `ask-clicks` Supabase Edge Function, which loads the caller's clicks under their own sign-in and asks Claude Opus 5.5 (low effort, structured output, prompt caching, server-side refusal fallback). Needs the `ANTHROPIC_API_KEY` secret.
- 2026-11-15 — Completed Ask AI Phase 3: the Ask tab sends questions through the Expo app to `ask-clicks` and shows Claude's answer with tappable person cards, falling back to the keyword search when Ask AI is unreachable. Removed the last hair-from-photo wording from Ask.
- 2026-11-15 — Added link handling so a link (for example on an NFC tag) opens one click's profile: `exp://<computer IP>:8081/--/click/<click id>` in Expo Go, `clickbracelet://click/<click id>` in app builds. If the user is still signed in, the app loads their clicks and opens the profile without the welcome screen; otherwise it opens after sign-in.
- 2026-11-15 — Fixed Ask chat person cards sometimes landing away from the click they open: screens now start scrolled to the top, and opening a card from the chat scrolls the expanded click into view.
- 2026-11-15 — Made `npx expo start --web` run the same app as the phone instead of a bare iframe of the prototype: `App.tsx` now hosts the page through `ClickPage` (a WebView on phones, a bridged iframe on web), so Google sign-in (popup, or same-tab redirect if the popup is blocked), profile saving, clicks, Ask AI and click links work in the browser. Removed `App.web.tsx`. Web sign-in needs `http://localhost:8081/**` in the Supabase redirect URLs.
- 2026-11-15 — Confirmed Google sign-in works in the web preview, including through `--tunnel`. Documented the tunnel redirect URL (`https://*.on.expo.app/**`) and the frozen-popup symptom when it's missing in `EXPOINSTRUCTIONS.md`.
- 2026-11-15 — Click links (for example on an NFC tag) now open the clicks list with that click expanded and scrolled into view, the same as tapping a person in the Ask chat, instead of opening the separate profile screen.
- 2026-11-16 — Completed Share my Click Phase 1 (SHAREPLAN.md): added `profiles.share_code` and the `get_my_share_code`, `reset_share_code`, `get_share_preview` and `add_click_from_share` functions. Adding someone from their code saves a click built from their profile (never their email), linked by `other_user_id`, and opening the same link again refreshes that click instead of duplicating it. Only these functions can set share codes.
- 2026-11-16 — Completed Share my Click Phase 2 (SHAREPLAN.md): `App.tsx` opens `add/<share code>` links, confirms with the person's name, adds them through `add_click_from_share` and opens their new click; handles a `share-profile` page message with the share sheet; and logs your share link to the Expo terminal in dev.
- 2026-11-16 — Completed Share my Click Phase 3 (SHAREPLAN.md): a Share my Click button on the You screen opens a sheet with your QR code, link, Share link and Reset link; opening someone's link shows an "Add <name>?" card in the page instead of the phone's dialog. Added the `qrcode-generator` package (run `npm install` after pulling).
- 2026-11-16 — Removed Audrey Guinn Stephenson from the demo clicks: the page's built-in list (and her photo key), `seed_demo_clicks()`, and the demo copies already in accounts (`20261116010000_remove_audrey_demo_click.sql`). The Ask suggestion now asks about the Career Fair, since the AI Hackathon was only her click. Real clicks added through share links are untouched.
- 2026-11-16 — Deployed the web build on Vercel (project `click-bracelet`, Root Directory `mobile-app`, https://click-bracelet.vercel.app). `mobile-app/vercel.json` builds with `npx expo export --platform web` and rewrites every path to the app so `/auth/callback`, `/add/<code>` and `/click/<id>` load. Pushes to `main` deploy to production.
- 2026-11-15 — The website shows an "Have the Click app? Open in app" bar on iPhone and iPad (`mobile-app/src/OpenInAppBar.web.tsx`). It opens the same click or share link in the installed app through `clickbracelet://`, can be dismissed for the visit, and never shows on desktop or in the phone app. Works with any installed build of the app, including a free Xcode build; without the app, Safari says it can't open the address.
- 2026-11-15 — Prepared the free iOS demo build (IOSPLAN.md): the Click "C" logo is the app icon, launch screen, Android icon and website favicon; phone builds seed demo clicks for brand-new accounts; share links and QR codes always use https://click-bracelet.vercel.app/add/<code>, and the Share sheet also shows a `clickbracelet://add/<code>` link for NFC tags.
- 2026-11-15 — Added Delete account under Sign out on the You screen. It asks "Are you sure you want to delete your account?", then the app removes the avatar files and calls `delete_my_account()` (`20261117000000_add_delete_account.sql`), which deletes the user's clicks, every other account's click of them, their profile and their auth user, and the page resets to the welcome screen. Deleted the hello@clickbracelet.com account the same way.
- 2026-11-15 — Fixed the demo clicks' missing profile photos. The prototype's photos were `/_blob/` paths that only load in the design tool's preview, and the patch meant to add the others never applied. Priya, Marcus, Jordan, Sam, Taylor, Lee and Dottie now use small embedded copies of `mobile-app/assets/avatars` (and `assets/profiles` for Dottie); Chloe, Leila, Payton, Sadie and Lola, who have no photo, show their initials. `20261117000100_add_demo_photo_keys.sql` adds the missing `photoKey` to saved demo clicks and to `seed_demo_clicks()`.
- 2026-11-15 — Presets now decide which socials a click receives. `profiles.presets` and `profiles.active_preset` (`20261117010000_add_presets.sql`, defaulting to the page's Party, Networking and Everyday) store the Presets tab; the page sends each change to the app, which saves it, and loads them back at sign-in. `share_snapshot` only includes the socials and custom links in the active preset, so other handles never leave the database. Clicks keep the socials they were given; a later preset change reaches someone only when they open the share link again. The Share sheet names the preset being shared.
