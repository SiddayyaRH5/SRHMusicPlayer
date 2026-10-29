# SRH Music Player — DOM-driven Modern Edition with Local Login and Device Songs

## Run locally
1. Open this folder in VS Code.
2. Use VS Code Live Server or another localhost server.
3. Music cards are defined in the `MUSIC_LIBRARY` JavaScript array and generated dynamically using DOM methods.

## Play songs from your phone or computer
- Open the page and choose **Choose songs from device** under **Your Device Songs**.
- Select one or more audio files (MP3, M4A, AAC, WAV, OGG and other browser-supported audio formats).
- Selected songs are added to the page and sidebar for playback, including seek, volume, next and previous controls.
- Browsers require the user to choose files; the website cannot silently scan all phone storage.
- Selected files are not uploaded to a server. They remain accessible to the page only while the current page session is active. Choose the files again after reopening the page.

## Local demo accounts
Accounts and a signed-in state are stored in this browser's localStorage. Passwords use salted PBKDF2-SHA-256 hashes. This is a local demo, not production authentication. Do not reuse a sensitive password.

## Bundled music
Place MP3 files in `songs/` using exact filenames in each `MUSIC_LIBRARY` item's `song` property. The archive may not include audio files.

## New personal-library and playback features
- **Favorites:** use the heart on any song card; favorite selections persist in this browser.
- **Recently played:** see tracks you played most recently (up to 20).
- **Shuffle:** toggle randomized next-track playback.
- **Repeat:** cycle between Off, Repeat All, and Repeat One.
- **Keyboard shortcuts:** `Space` play/pause, `←` / `→` seek by 5 seconds, `M` mute/unmute, `S` shuffle, `R` repeat. Shortcuts pause while typing in a form field.
- **Search:** filter cards by song title, artist, or filename.
- **Responsive layout:** filters and playback options wrap for smaller screens.

Favorites and recent history are stored locally in this browser. Device-selected audio files are not persisted; reselect them after reopening the page.

## SRH Video Player (local device media)

Switch to **Video Player** to open video files from your computer or phone. The player includes a multi-file queue, queue search and removal, drag-and-drop, play/pause, previous/next, 10-second skip controls, seek bar, volume/mute, playback speed (0.25×–2×), repeat-one, shuffle, subtitle loading (`.vtt` and basic `.srt` conversion), picture-in-picture (where supported), fullscreen, video-fit modes, screenshot capture (where allowed), and keyboard shortcuts.

- Files are played from temporary browser object URLs. They are **not uploaded** and the selected files/queue are not retained after closing or refreshing the page.
- Use a current browser and prefer MP4 with H.264/AAC or WebM. Browser playback depends on codec support; browsers generally cannot decode every format supported by desktop VLC, especially some MKV/AVI files.
- Picture-in-picture, fullscreen, screenshots and some file formats depend on browser/device support. Screenshot capture can be blocked for protected or unsupported video sources.
- This is a browser-based local media player inspired by common VLC/MX Player capabilities, not a complete replacement for their native apps. It cannot scan device folders silently, access protected media, decode every codec, or provide hardware-specific features without a native application layer.
- For mobile use, open the site in the browser and choose files through the device file picker. Local files may need to be selected again each session.
