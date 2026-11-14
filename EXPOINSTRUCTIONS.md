# Running the Click app with Expo Go

This guide gets the Click mobile app running from your own computer and onto your phone with **Expo Go**. No Xcode or Android Studio build is needed.

The app lives in the `mobile-app/` folder. It is an Expo (SDK 58) project that shows the Click prototype inside a WebView and handles Google sign-in through Supabase.

---

## 1. Install the prerequisites

| Tool | Version | How to get it |
| --- | --- | --- |
| **Node.js** | 22.13 or newer (22 LTS or 24 LTS recommended) | <https://nodejs.org> or a version manager like `nvm` / `fnm` |
| **npm** | Comes with Node.js | — |
| **Git** | Any recent version | <https://git-scm.com> |
| **Expo Go** (on your phone) | Latest version from the store; it must support **SDK 58** | iOS App Store or Google Play |

Check your versions:

```sh
node -v   # must print v22.13.0 or higher
npm -v
git --version
```

You do **not** need to install the Expo CLI globally. `npx expo` uses the copy installed in the project.

Optional:
- **macOS:** [Watchman](https://facebook.github.io/watchman/) (`brew install watchman`) makes file watching faster and avoids "too many open files" errors.
- **A GitHub account with access** to the `Clickbracelet/Click` repository.

---

## 2. Get the code

```sh
git clone https://github.com/Clickbracelet/Click.git
cd Click/mobile-app
```

All commands below are run from inside the `mobile-app` folder.

---

## 3. Install the project dependencies

```sh
npm install
```

This installs Expo, React Native, Supabase and everything else listed in `package.json`. Use `npm`, not `yarn` or `pnpm`, because the repo ships a `package-lock.json`.

---

## 4. Create your `.env` file

The app refuses to start without Supabase settings. Copy the example file:

```sh
# macOS / Linux
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Then open `.env` and fill in the real values:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Ask a project maintainer for these two values, or copy them from the Supabase dashboard under **Project Settings → API**.

- Only use the **publishable** key. Never put a `secret` or `service_role` key in this file. Anything starting with `EXPO_PUBLIC_` is bundled into the app and visible to users.
- `.env` is gitignored. Never commit it.

---

## 5. Start the Expo server

```sh
npx expo start
```

A QR code appears in the terminal.

- **iPhone:** open the normal **Camera** app, point it at the QR code, and tap the banner to open it in Expo Go.
- **Android:** open **Expo Go** and tap **Scan QR code**.

The first load takes a little while as the app bundles. After that, saving a file reloads the app automatically. In the terminal, press `r` to reload manually, or `?` to see all shortcuts.

> **Do not use `npm run ios` or `npm run android`.** In this project, those run `expo run:ios` / `expo run:android`, which do full native builds with Xcode / Android Studio. For Expo Go, always use `npx expo start`.

### Your phone and computer must be able to reach each other

By default, Expo Go connects straight to your computer over the local network. Both devices must be on the **same Wi-Fi network**, and that network must allow devices to talk to each other. Many university, office and public networks block this. See [Can't connect from the phone](#cant-connect-from-the-phone-stuck-loading-or-could-not-connect-to-server) below.

### Optional: preview in a web browser

```sh
npx expo start --web
```

This opens the app in your browser, which is handy for checking layouts quickly. On web, the **Continue with Google** button skips the real sign-in and goes straight to the next screen. Real sign-in only works on a phone.

---

## 6. (Maintainers) Allow Google sign-in from Expo Go

Google sign-in sends the user back to the app using a redirect URL. Supabase must allow that URL, or sign-in fails with a redirect error.

In the Supabase dashboard, go to **Authentication → URL Configuration → Redirect URLs** and add:

- `exp://**` — covers the Expo Go URLs on any computer or network (for example `exp://192.168.1.20:8081/--/auth/callback`).
- `clickbracelet://auth/callback` — used by native builds of the app.

This only needs doing once per Supabase project, not once per computer.

---

## Troubleshooting

### Can't connect from the phone (stuck loading, or "Could not connect to server")

Try these in order:

1. **Allow local network access (iPhone).** Go to **Settings → Privacy & Security → Local Network** and turn on **Expo Go**. If this is off, Expo Go can never reach your computer.
2. **Same network?** Check that your phone isn't on cellular data or a different Wi-Fi network (for example, a guest network).
3. **Use a phone hotspot.** Turn on your phone's Personal Hotspot, connect your computer to it, and run `npx expo start` again. This gets around networks that block device-to-device traffic, which is common on campus Wi-Fi. Only real internet traffic (Supabase, Google) uses mobile data. The app code is sent directly between the two devices.
4. **Use a tunnel.**
   ```sh
   npx expo start --tunnel
   ```
   This sends the connection through the internet (ngrok), so it works on any network. The first time, it asks to install `@expo/ngrok`; answer yes. It is slower, and the tunnel sometimes drops. If you see "tunnel connection has been closed", stop the server and start it again.
5. **Firewall.** Allow Node.js through your computer's firewall, or allow incoming connections on port `8081`. On Windows, choose **Private network** when the firewall prompt appears.
6. **VPN.** Turn off any VPN on the computer or phone and try again.

Logging in to Expo Go and the Expo CLI with the same account (`npx expo login`) makes your server appear in Expo Go's list without scanning, but it does **not** fix connection problems.

### "Project is incompatible with this version of Expo Go" / SDK mismatch

Expo Go only supports the newest SDK. Update Expo Go from the App Store / Play Store. If the project's SDK (`expo` in `package.json`) is older than what Expo Go supports, the project has to be upgraded. See <https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/>.

### Error: "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in mobile-app/.env."

The `.env` file is missing, is in the wrong folder, or is missing a value. It must be at `mobile-app/.env`, not the repo root. After creating or changing it, stop the server and restart it with a cleared cache:

```sh
npx expo start --clear
```

### Blank white screen, or "SyntaxError: html.json"

The whole prototype UI is stored as one JSON string in `mobile-app/html.json`. If anyone edits it by hand and leaves a raw line break inside the string, the app fails to build and shows a blank screen. Check it:

```sh
node -e "JSON.parse(require('fs').readFileSync('html.json','utf8')); console.log('html.json OK')"
```

If it fails, regenerate it from the source page in the repo root:

```sh
node -e "const fs=require('fs'); fs.writeFileSync('html.json', JSON.stringify(fs.readFileSync('../Frontend.html','utf8'))+'\n')"
```

Always edit `Frontend.html`, then regenerate `html.json` with the command above. Never edit `html.json` directly.

### "Port 8081 is being used by another process"

Another Expo or Metro server is already running. Close it, or answer **yes** to use a different port when asked. To find what's using the port:

```sh
# macOS / Linux
lsof -i :8081
# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 8081
```

### Strange build errors after pulling new changes

Dependencies or the bundler cache may be out of date:

```sh
npm install
npx expo start --clear
```

If that doesn't help, reinstall from scratch:

```sh
# macOS / Linux
rm -rf node_modules .expo
# Windows (PowerShell)
Remove-Item -Recurse -Force node_modules, .expo

npm install
npx expo start --clear
```

You can also run Expo's built-in checker:

```sh
npx expo-doctor
```

### "EMFILE: too many open files" (macOS)

Install Watchman (`brew install watchman`) and restart the server.

### Node version errors (e.g. "Unsupported engine" or syntax errors from Expo itself)

Your Node.js is too old. Install Node 22.13 or newer, then delete `node_modules` and run `npm install` again.

### Google sign-in fails or returns to the wrong place

- Make sure the Expo Go redirect URLs are allowed in Supabase (see [step 6](#6-maintainers-allow-google-sign-in-from-expo-go)).
- Check the `.env` values point to the correct Supabase project.
- Remember that sign-in is skipped in the web preview. Test it on a phone.

### The app looks tiny or doesn't fill the screen

The page in `Frontend.html` needs its `<meta name="viewport" ...>` tag and full-screen (`100vw` / `100vh`) sizing. If someone replaces `Frontend.html` with a fresh export from a design tool, these may be lost and need to be added again.

---

## Quick reference

```sh
git clone https://github.com/Clickbracelet/Click.git
cd Click/mobile-app
npm install
cp .env.example .env        # then fill in the Supabase values
npx expo start              # scan the QR code with your phone
npx expo start --tunnel     # if your Wi-Fi blocks the connection
npx expo start --web        # browser preview
npx expo start --clear      # restart with a cleared cache
```
