SRH Media Player — deploy-root fix

IMPORTANT: This archive is flattened so index.html and its CSS/JS files are at the ZIP root. Copy the CONTENTS of this ZIP directly into the root of the Git repository used by Netlify/Vercel, replacing existing files. Do not copy the outer folder as a nested folder.

The page includes the audio-track selector and Analyze tracks action. In the video player, select a local video file, then click Analyze tracks. Browser extraction is limited to 600 MiB in media-engine.js; larger files need a native media engine. Embedded track switching is not guaranteed by the browser's native video element, so the Analyze tracks feature uses FFmpeg.wasm and may be limited by browser memory/codec support.

Do not commit copyrighted music unless you have the rights to distribute it.
