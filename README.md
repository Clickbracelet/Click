# Click

## Sync real bracelet encounters locally

Use Node.js 24 or later. From the repository folder, run:

```powershell
node scripts/preview-bracelet.mjs
```

1. Open **http://localhost:8081/** in desktop Chrome with Bluetooth enabled.
2. Continue through the local sign-in screen. On **Pair your Click**, click
   **Pair bracelet** and choose your `Click-...` device in Chrome. This connects
   to the bracelet and syncs confirmed encounters to the local timeline. Then
   continue through profile setup to **Your Clicks**.
3. Use **Sync now** to read it again, **Switch bracelet** to pick a different
   device, or **Disconnect** to release the Bluetooth connection. When
   disconnected, use **Sync bracelet** to connect again. Disconnect the
   bracelets from browser tabs before recording another tap.

To see names on both timelines, use the same preview URL in two Chrome windows.
Pair a different board in each window, enter that person's name in profile setup,
and click **Continue**. The preview saves each name locally and uses it for
earlier and new taps. If you skipped pairing, connect the board first, then save
the name in **Settings → Edit profile**. Keep **Switch bracelet** for viewing the
other board's timeline within the current session.

This local preview combines confirmed encounters from the optional
`click-encounters.json` in the parent folder with records synced to
`.click-preview/encounters.sqlite`. The export and database are ignored by Git.
**All time** includes records with an unknown tap time.

The preview uses the connected bracelet's firmware ID (`USER_101` or `USER_202`)
to select the timeline. Sign-in and profile setup are local mock screens.
Production sync requires signed-in sessions and verified device ownership.
`POST /api/encounters/batch` returns `acceptedEventIds` after the
database commits, plus the updated timeline for the preview. The bracelet can
reuse those slots once it receives the acknowledgments.

Press **Ctrl+C** in the terminal to stop the preview.
