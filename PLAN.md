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
