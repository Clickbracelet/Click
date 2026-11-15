# Free iOS build on two iPhones: plan

Install the real Click app on two iPhones for an internal NFC demo, with share links that work between them and for anyone without the app. It uses a **free Apple ID** and Xcode: no $99 Apple Developer Program, no App Store, no TestFlight.

The build runs on **any Mac**, including one that has never had Xcode installed. [Part 1](#part-1-set-up-the-build-mac) sets it up from scratch.

---

## What you get, and the limits

| | Free Apple ID (this plan) |
| --- | --- |
| Cost | Free |
| Own icon (the Click "C") and name on the home screen | Yes |
| Runs without the Mac or Expo Go | Yes (Release build, app code bundled inside) |
| Install method | Each phone plugged into the build Mac by cable |
| How long an install lasts | **7 days**, then re-run the build **on the same Mac** to renew |
| Apps per phone signed with the Mac's Apple ID | Up to 3 |
| `clickbracelet://` links (NFC tags, website "Open in app") | Yes |
| `https://` universal links (tag opens app directly from a web address) | **No**, needs the paid account (see [Later](#later-with-the-paid-account)) |
| Demo clicks for brand-new accounts | Yes |

The two phones can be signed in to different Apple IDs. Only Xcode on the build Mac needs the Apple ID that signs the app.

---

## How links work in this build

| Link | Where it comes from | What happens |
| --- | --- | --- |
| `https://click-bracelet.vercel.app/add/<code>` | **Share link and QR code** in You → Share my Click | Opens the website, which works for anyone (sign in, "Add <name>?"). On an iPhone with the app, tap **Open in app** in the website's top bar to continue in Click. |
| `clickbracelet://add/<code>` | **"For NFC tags"** in the same Share sheet | Write it to an NFC tag. Tapping the tag opens Click straight to "Add <name>?". |
| `clickbracelet://click/<click id>` | A click's ID in Supabase (`clicks` table) | Opens Click to that click, expanded. The ID must belong to the account signed in on that phone. |

iPhones (XS or newer) read URL tags in the background, with no NFC permission needed in the app: hold the phone near the tag, tap the banner, and Click opens.

---

## Part 1: set up the build Mac

The build has to happen on a **Mac**: iOS apps can't be built on Windows or Linux without the paid account and Expo's cloud builds. Skip any step that's already done.

### 1.1 Check the Mac
- **macOS:** recent enough for the current Xcode. The Xcode page in the Mac App Store lists the minimum. Update macOS first if needed.
- **Free disk space:** about **40 GB** (Xcode, the iOS platform files and the build).
- **Cables:** a USB cable for each iPhone.

### 1.2 Install Xcode (allow an hour or more)
1. Install **Xcode** from the Mac App Store. It's a large download (well over 10 GB).
2. Open Xcode once. Accept the license, and when it offers platforms, install **iOS**. If you miss it: **Xcode → Settings → Components**, then download the iOS platform.
3. In Terminal, point the command-line tools at Xcode and finish setup:
   ```sh
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -license accept
   xcodebuild -runFirstLaunch
   xcodebuild -version        # should print the Xcode version
   ```
4. **The iPhones' iOS version must be supported by this Xcode.** The newest Xcode supports the newest iOS. If a phone runs a newer iOS than Xcode knows, update Xcode.

### 1.3 Install the developer tools
Using [Homebrew](https://brew.sh) (install it first if `brew -v` fails):

```sh
brew install node@22 cocoapods git watchman
node -v      # must be 22.13 or newer
pod --version
```

If `node -v` still shows an old version, follow Homebrew's printed instructions to put `node@22` on your PATH, or use `nvm`/`fnm`.

### 1.4 Add the Apple ID to Xcode (free)
**Xcode → Settings → Accounts → + → Apple ID**, then sign in with any normal Apple ID. Xcode creates a free **Personal Team** for it. Don't enroll in anything or pay.

### 1.5 Get the code
```sh
git clone https://github.com/Clickbracelet/Click.git
cd Click/mobile-app
npm install
cp .env.example .env
```

Fill in `.env` with the two Supabase values (ask a maintainer, or copy them from Supabase → Project Settings → API):
```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```
These values are built into the app, so they must be set **before** building. Never put a secret or service-role key here.

### 1.6 Prepare each iPhone (once per phone)
1. Plug the phone into the Mac, unlock it, and tap **Trust This Computer**.
2. In Xcode, open **Window → Devices and Simulators** and wait until the phone finishes "Preparing". The first time can take several minutes.
3. On the phone, turn on **Settings → Privacy & Security → Developer Mode** and restart when asked. The option only appears after the phone has been connected to Xcode.

---

## Part 2: build and install

All commands run in `Click/mobile-app`.

### 2.1 Generate the iOS project (first time, and after pulling changes to `app.json`, icons or packages)
```sh
npx expo prebuild --platform ios --clean
```
This creates the `ios/` folder. It's generated, so it's gitignored; never commit it.

### 2.2 Set the signing team (first time)
```sh
open ios/Click.xcworkspace
```
In Xcode, select the **Click** project, then the **Click** target, then **Signing & Capabilities**:
- **Team:** your Personal Team (the Apple ID from 1.4)
- **Automatically manage signing:** on

If Xcode shows an error that the bundle identifier `com.ab360.click-bracelet` is unavailable, another Apple team already owns it. Change `ios.bundleIdentifier` in `app.json` to something unique, for example `com.<yourname>.clickbracelet`, then run 2.1 again and redo this step. Links keep working, because they use the `clickbracelet` scheme, not the bundle ID.

`--clean` in 2.1 resets this setting, so redo 2.2 whenever you run prebuild with `--clean`.

### 2.3 Build and install on the first iPhone
With the first phone plugged in and unlocked:
```sh
npx expo run:ios --device --configuration Release
```
- Pick the phone from the list.
- `Release` bundles the app code inside, so the app runs without the Mac or Expo Go. The first build takes a while.

### 2.4 Trust the app on the phone (first install only)
The first launch is blocked as an "Untrusted Developer". On the phone, go to **Settings → General → VPN & Device Management**, tap the Apple ID and choose **Trust**. Then open Click.

### 2.5 The second iPhone
Plug in the second phone (Part 1.6 first, if it's new to this Mac) and run the same command:
```sh
npx expo run:ios --device --configuration Release
```
Pick the second phone, then do 2.4 on it.

---

## Part 3: test the demo

On each phone:
1. Open Click and tap **Continue with Google**. Each phone uses its own Google account. The return address `clickbracelet://auth/callback` is already allowed in Supabase.
2. A brand-new account gets the demo clicks automatically. Fill in the profile (name, photo, interests, socials) under **You → Edit profile**.

Then try each way of sharing, in both directions:
- **Share link:** on phone A, go to **You → Share my Click → Share link** and send it to phone B. On B, open the link. The website opens; tap **Open in app**, and Click shows "Add <A>?". Tap **Add to my clicks**, and A's card opens expanded.
- **QR code:** phone B scans phone A's QR code with the Camera app, with the same result as the share link.
- **NFC tag:**
  1. In **Share my Click**, copy the **For NFC tags** link (`clickbracelet://add/<code>`).
  2. Write it to a tag as a **URL/URI record**, for example with the free NFC Tools app (Write → Add a record → URL/URI).
  3. Phone B holds near the tag and taps the banner. Click opens straight to "Add <A>?".
- **Click tag:** write `clickbracelet://click/<click id>` for one of phone B's clicks. Tapping it opens that click, expanded.

---

## Every 7 days: renew

The free signing expires after 7 days and the app stops opening. To renew, plug each phone into **the same Mac** and run:
```sh
cd Click/mobile-app
git pull && npm install                      # to include the latest changes
npx expo run:ios --device --configuration Release
```
If `git pull` changed `app.json`, icons or packages, run 2.1 and 2.2 first. Nothing is lost on reinstall: all data lives in Supabase.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `xcode-select: error` or `xcodebuild` not found | Do Part 1.2 step 3. |
| "No such module" / CocoaPods errors | `cd ios && pod install && cd ..`, or rerun `npx expo prebuild --platform ios --clean` (then redo 2.2). |
| Phone not listed by `--device` | Unlock it, check the cable, tap Trust, and wait for "Preparing" in Devices and Simulators to finish. |
| "iOS version not supported" / device support missing | Update Xcode, or install the iOS platform in Xcode → Settings → Components. |
| Developer Mode missing from Settings | Connect the phone to Xcode once (Part 1.6), then look again. |
| "Signing requires a development team" | Do 2.2. |
| Bundle ID unavailable / "No profiles found" | Change `ios.bundleIdentifier` in `app.json` (see 2.2). |
| "Untrusted Developer" on the phone | Do 2.4. |
| App IDs or app limit reached | Free accounts can register only a few app IDs per week and have at most 3 apps per phone. Delete old test apps or wait. |
| App won't open after a week | The 7-day signing expired: renew. |
| App shows "Set EXPO_PUBLIC_SUPABASE_URL…" | `.env` was missing or empty at build time: fill it in (1.5) and rebuild. |
| Google sign-in returns to the wrong place | Check that `clickbracelet://auth/callback` is in Supabase → Authentication → URL Configuration → Redirect URLs. |
| NFC tag opens Safari instead of Click | The tag holds an `https://` link. For tags, use the **For NFC tags** (`clickbracelet://`) link. |
| NFC tag does nothing | The phone must be unlocked with the screen on, not in the Camera or Wallet app. iPhone XS or newer. |

---

## Later, with the paid account

With the $99 Apple Developer Program, the same project can:
- use **universal links**, so `https://click-bracelet.vercel.app/...` on a tag or QR code opens the app directly when installed (an `apple-app-site-association` file on the Vercel site, plus `applinks:click-bracelet.vercel.app` in `app.json`);
- install by link instead of cable (EAS internal distribution), lasting about a year;
- go to TestFlight and the App Store.
