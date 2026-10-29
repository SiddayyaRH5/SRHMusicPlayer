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


## Fix pack (mobile and video audio)
- Prevents duplicate initialization when `script.js` is accidentally included twice.
- Uses a real accessible hamburger button for mobile sidebar toggling.
- Adds an audio-language selector when the browser exposes multiple audio tracks for the selected video.
- Login/sign-up remain local demo accounts stored in this browser; they are not production authentication. For real cross-device accounts, use a backend.
- Audio-track switching is browser/media dependent. Many browsers do not expose local-file audio tracks to JavaScript.


### Audio/subtitle track selectors
The player now displays browser-exposed audio tracks and text subtitle tracks, including externally loaded subtitle files, with an explicit Subtitles Off option. Browser support for embedded tracks varies, especially for local MKV files. For reliable multi-audio MKV selection, use a native Android Media3 player.


### Mobile layout fix
On narrow screens, song category cards use a responsive two-column grid rather than a clipped horizontal carousel. The original colour palette is unchanged.


### Audio track limitation and workaround
The browser cannot reliably expose embedded audio tracks inside local MKV files. The player now offers an **External audio** control to select a separate audio file and synchronize it to the video timeline; the video's built-in audio is muted while external audio is active. This is a workaround, not embedded track switching. For VLC-style switching of audio/subtitle tracks inside MKV containers, use native Android Media3/ExoPlayer or a dedicated media engine.


### Mobile play-badge adjustment
On touch/mobile layouts, the floating play badge is hidden by default so it does not appear on every song card. Song cards remain tappable; the badge is shown for keyboard focus/currently playing cards.

### Embedded audio/subtitle tracks
A normal HTML video element in many browsers cannot expose or switch embedded audio/subtitle tracks from local MKV files. This ZIP cannot make unsupported browser APIs available. To select tracks embedded in the same MKV file like VLC, implement a native Android player using Media3/ExoPlayer, or a dedicated web demuxing/decoding pipeline. External audio/subtitle files are a separate workaround.


## Browser deployment (Vercel / Netlify / GitHub Pages)

This folder is the static browser version. It needs no backend or build step.

### Deploy to Vercel
1. Push these project files to your GitHub repository.
2. In Vercel, import the repository.
3. Set the **Root Directory** to the folder containing `index.html` (if the files are at repository root, leave it as `./`).
4. Set **Framework Preset** to Other.
5. Leave Build Command and Output Directory empty for a static site, or set the output directory to `.` if required by the UI.
6. Deploy.

### Deploy to Netlify
Drag this folder into Netlify Drop, or connect the GitHub repository and set the publish directory to the folder containing `index.html`. No build command is required.

### Browser media limitations
- Local audio/video files are selected by the user and play in the browser when their formats/codecs are supported.
- External `.vtt` / `.srt` subtitle loading is supported by the website's subtitle workflow.
- Browser support for switching embedded audio/subtitle tracks inside local MKV files is not consistent. If the browser does not expose those tracks, the website cannot select them merely with JavaScript. For reliable VLC-style track switching, use a native media engine in the Android/desktop application.
- Local login is a browser-only demo; it is not secure production authentication.


## Browser media engine (experimental)
The **Analyze tracks** button loads FFmpeg.wasm on demand from jsDelivr, scans a local video container, extracts selectable audio streams to MP3 and text subtitle streams to WebVTT, then synchronizes extracted audio with video seeking/playback. It requires an internet connection on first use and a secure context (HTTPS/localhost). It is intended for smaller files; current limit is 600 MB to reduce browser memory crashes. Bitmap subtitles and unsupported codecs may not extract. Large files (such as 1.4 GB movies) should use the native Android/desktop media engine. This is a browser-side demux/transcode workaround, not a full VLC replacement.


### Same-origin FFmpeg worker fix
The FFmpeg worker is now fetched from jsDelivr, its module imports are rewritten to absolute CDN URLs, and it is loaded as a same-origin blob worker to avoid the cross-origin Worker() error. This requires jsDelivr to be reachable and allow CORS. It has passed syntax checks but still needs browser testing.
