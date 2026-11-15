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
