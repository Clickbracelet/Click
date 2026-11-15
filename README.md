# Click

## Sync real bracelet encounters locally

Use Node.js 24 or later. From the repository folder, run:

```powershell
node scripts/preview-bracelet.mjs
```

1. Open **http://localhost:8081/** in desktop Chrome with Bluetooth enabled.
2. In **Your Clicks**, choose **USER_101** or **USER_202** to match the bracelet
   you want to sync. Click **Sync bracelet**, then select the device in Chrome.
3. Use **Sync now** to read it again, **Switch bracelet** to pick a different
   device, or **Disconnect** to release the Bluetooth connection. Disconnect
   the bracelets from browser tabs before recording another tap.

This local preview combines confirmed encounters from the optional
`click-encounters.json` in the parent folder with records synced to
`.click-preview/encounters.sqlite`. The export and database are ignored by Git.
**All time** includes records with an unknown tap time.

The preview accepts only the two demo accounts and uses the local account picker
for testing. Production sync requires signed-in sessions and verified device
ownership. `POST /api/encounters/batch` returns `acceptedEventIds` after the
database commits, plus the updated timeline for the preview. The bracelet can
reuse those slots once it receives the acknowledgments.

Press **Ctrl+C** in the terminal to stop the preview.
