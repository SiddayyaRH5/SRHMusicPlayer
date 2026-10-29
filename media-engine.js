/* SRH Media Engine: on-demand FFmpeg.wasm track extraction for browser playback.
   This is a real demux/transcode pipeline; browser memory and codec limitations still apply. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const video = $('srhVideo');
  const analyzeBtn = $('analyzeMediaTracksBtn');
  const status = $('mediaEngineStatus');
  const audioSelect = $('videoAudioTrack');
  const subtitleSelect = $('videoSubtitleTrack');
  if (!video || !analyzeBtn || !status) return;

  let ffmpeg = null;
  let engineLoading = null;
  let selectedFile = null;
  let audioTracks = [];
  let subtitleTracks = [];
  let externalAudio = null;
  let externalAudioUrl = null;
  let subtitleTrackElement = null;
  let subtitleObjectUrl = null;
  let currentInputName = 'input-media';
  const MAX_FILE_BYTES = 600 * 1024 * 1024;

  function say(message, error = false) {
    status.textContent = message;
    status.classList.toggle('error', error);
    status.classList.add('visible');
  }
  function syncAudio(force = false) {
    if (!externalAudio || !Number.isFinite(video.currentTime)) return;
    if (force || Math.abs(externalAudio.currentTime - video.currentTime) > 0.4) {
      try { externalAudio.currentTime = video.currentTime; } catch (_) {}
    }
  }
  function stopExternalAudio() {
    if (externalAudio) { externalAudio.pause(); externalAudio.removeAttribute('src'); externalAudio.load(); externalAudio = null; }
    if (externalAudioUrl) URL.revokeObjectURL(externalAudioUrl);
    externalAudioUrl = null;
    video.muted = false;
  }
  function clearExtractedSubtitles() {
    if (subtitleTrackElement) { subtitleTrackElement.remove(); subtitleTrackElement = null; }
    if (subtitleObjectUrl) URL.revokeObjectURL(subtitleObjectUrl);
    subtitleObjectUrl = null;
  }
  function setSelectOptions(select, rows, emptyLabel) {
    if (!select) return;
    select.replaceChildren();
    rows.forEach(row => {
      const option = document.createElement('option');
      option.value = String(row.index);
      option.textContent = row.label;
      select.appendChild(option);
    });
    if (!rows.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = emptyLabel;
      select.appendChild(option);
      select.disabled = true;
    } else select.disabled = false;
  }
  async function loadEngine() {
    if (ffmpeg) return ffmpeg;
    if (engineLoading) return engineLoading;
    engineLoading = (async () => {
      say('Loading FFmpeg media engine. Keep this tab open; first load may take a minute…');
      const ffmpegPkg = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm';
      const { FFmpeg } = await import(`${ffmpegPkg}/index.js`);
      const { toBlobURL } = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js');
      const instance = new FFmpeg();
      instance.on('log', ({ message }) => {
        if (/error|invalid|unsupported/i.test(message)) say(message.slice(0, 180), true);
      });

      // Browsers block Worker() URLs hosted on a different origin. Fetch the
      // FFmpeg class worker, rewrite its ESM imports to absolute CDN URLs, then
      // create a same-origin blob worker and pass it explicitly to FFmpeg.load().
      say('Preparing same-origin media worker…');
      const workerResponse = await fetch(`${ffmpegPkg}/worker.js`, { mode: 'cors' });
      if (!workerResponse.ok) throw new Error(`Could not download FFmpeg worker (${workerResponse.status}).`);
      let workerSource = await workerResponse.text();
      workerSource = workerSource
        .replace(/(["'])\.\/const\.js\1/g, `'${ffmpegPkg}/const.js'`)
        .replace(/(["'])\.\/errors\.js\1/g, `'${ffmpegPkg}/errors.js'`);
      const workerBlobURL = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
      const base = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
      try {
        await instance.load({
          classWorkerURL: workerBlobURL,
          coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm')
        });
      } finally {
        URL.revokeObjectURL(workerBlobURL);
      }
      ffmpeg = instance;
      return instance;
    })().catch(error => {
      engineLoading = null;
      throw error;
    });
    return engineLoading;
  }
  function parseTracks(logText) {
    const audios = [], subtitles = [];
    const lines = logText.split(/\r?\n/);
    for (const line of lines) {
      // FFmpeg reports e.g. "Stream #0:2[0x3](kan): Audio: aac, 48000 Hz..."
      // and "Stream #0:4(eng): Subtitle: subrip".
      const m = line.match(/Stream\s+#\d+:(\d+)(?:\[[^\]]+\])?(?:\(([^)]+)\))?:\s*(Audio|Subtitle):\s*([^,\r\n]+)/i);
      if (!m) continue;
      const streamIndex = Number(m[1]);
      const lang = (m[2] || '').trim();
      const kind = m[3].toLowerCase();
      const codec = m[4].trim();
      const label = `${lang || (kind === 'audio' ? 'Audio' : 'Subtitle')} · ${codec} · stream ${streamIndex}`;
      (kind === 'audio' ? audios : subtitles).push({ index: streamIndex, label, lang, codec });
    }
    return { audios, subtitles };
  }

  async function analyze() {
    const file = selectedFile;
    if (!file) {
      say('First add a video to the player queue, then click Analyze tracks.', true);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      say(`This file is ${Math.round(file.size / 1024 / 1024)} MB. Browser extraction is limited to ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB to avoid freezing your tab. For large MKV files use the native Android/desktop player.`, true);
      return;
    }
    selectedFile = file;
    analyzeBtn.disabled = true;
    try {
      const engine = await loadEngine();
      say('Scanning this video for embedded audio and subtitle streams…');
      currentInputName = `input-${Date.now()}${(file.name.match(/\.[^.]+$/) || ['.mkv'])[0]}`;
      await engine.writeFile(currentInputName, new Uint8Array(await file.arrayBuffer()));
      let logs = '';
      const logListener = ({ message }) => { logs += message + '\n'; };
      engine.on('log', logListener);
      try { await engine.exec(['-hide_banner', '-i', currentInputName]); } catch (_) { /* -i without output intentionally returns non-zero */ }
      engine.off('log', logListener);
      const found = parseTracks(logs);
      audioTracks = found.audios;
      subtitleTracks = found.subtitles.filter(t => !/dvd_subtitle|hdmv_pgs_subtitle|dvb_subtitle/i.test(t.codec));
      setSelectOptions(audioSelect, audioTracks, 'No audio streams found');
      setSelectOptions(subtitleSelect, [{ index: -1, label: 'Subtitles off' }, ...subtitleTracks], 'No text subtitles found');
      if (subtitleSelect) subtitleSelect.value = '-1';
      say(`Found ${audioTracks.length} audio track(s) and ${subtitleTracks.length} extractable text subtitle track(s).`);
      if (audioTracks.length || subtitleTracks.length) {
        if (audioSelect) audioSelect.onchange = () => extractAudio(Number(audioSelect.value));
        if (subtitleSelect) subtitleSelect.onchange = () => extractSubtitle(Number(subtitleSelect.value));
      } else say('No selectable tracks found. This file may use unsupported codecs or bitmap subtitles.', true);
    } catch (error) {
      say(`Media engine failed: ${error?.message || error}. Deploy over HTTPS and try a smaller supported file.`, true);
    } finally {
      analyzeBtn.disabled = false;
    }
  }
  async function extractAudio(streamIndex) {
    const file = selectedFile;
    if (!file || !Number.isInteger(streamIndex)) return;
    try {
      const ext = `audio-${streamIndex}.mp3`;
      say(`Extracting ${audioTracks.find(t => t.index === streamIndex)?.label || 'audio'}…`);
      await ffmpeg.exec(['-y', '-i', currentInputName, '-map', `0:${streamIndex}`, '-vn', '-ac', '2', '-b:a', '192k', ext]);
      const data = await ffmpeg.readFile(ext);
      stopExternalAudio();
      externalAudioUrl = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mpeg' }));
      externalAudio = new Audio(externalAudioUrl);
      externalAudio.preload = 'auto';
      externalAudio.volume = Number($('videoVolume')?.value ?? 0.8);
      externalAudio.playbackRate = video.playbackRate || 1;
      video.muted = true;
      const startAudio = () => {
        syncAudio(true);
        if (!video.paused) externalAudio.play().catch(() => say('Press Play to start the selected audio track.', true));
      };
      externalAudio.addEventListener('loadedmetadata', startAudio, { once: true });
      if (externalAudio.readyState >= 1) startAudio();
      say(`Using ${audioTracks.find(t => t.index === streamIndex)?.label || 'selected audio track'}. Video audio is muted.`);
    } catch (error) {
      say(`Could not extract this audio codec: ${error?.message || error}`, true);
    }
  }
  async function extractSubtitle(streamIndex) {
    clearExtractedSubtitles();
    if (streamIndex === -1) { say('Subtitles off.'); return; }
    const track = subtitleTracks.find(t => t.index === streamIndex);
    if (!track) return;
    try {
      say(`Extracting ${track.label}…`);
      const out = `subtitle-${streamIndex}.vtt`;
      await ffmpeg.exec(['-y', '-i', currentInputName, '-map', `0:${streamIndex}`, '-f', 'webvtt', out]);
      const data = await ffmpeg.readFile(out);
      const blob = new Blob([data], { type: 'text/vtt' });
      subtitleObjectUrl = URL.createObjectURL(blob);
      subtitleTrackElement = document.createElement('track');
      subtitleTrackElement.kind = 'subtitles';
      subtitleTrackElement.label = track.label;
      subtitleTrackElement.srclang = track.lang || 'und';
      subtitleTrackElement.src = subtitleObjectUrl;
      subtitleTrackElement.default = true;
      video.appendChild(subtitleTrackElement);
      subtitleTrackElement.track.mode = 'showing';
      say(`Showing ${track.label}.`);
    } catch (error) {
      say(`Could not extract this subtitle format (bitmap subtitles need a different renderer): ${error?.message || error}`, true);
    }
  }
  window.addEventListener('srh:video-file-selected', event => {
    selectedFile = event.detail?.file || null;
    if (selectedFile) {
      audioTracks = [];
      subtitleTracks = [];
      if (audioSelect) { audioSelect.disabled = true; audioSelect.innerHTML = '<option value="">Click Analyze tracks first</option>'; }
      if (subtitleSelect) subtitleSelect.innerHTML = '<option value="-1">Subtitles off</option>';
      say(`Selected ${event.detail?.name || selectedFile.name}. Click Analyze tracks to scan embedded streams.`);
    }
  });
  analyzeBtn.addEventListener('click', analyze);
  video.addEventListener('play', () => { if (externalAudio) { syncAudio(true); externalAudio.play().catch(() => {}); } });
  video.addEventListener('pause', () => externalAudio?.pause());
  video.addEventListener('seeking', () => syncAudio(true));
  video.addEventListener('seeked', () => syncAudio(true));
  video.addEventListener('timeupdate', () => syncAudio(false));
  video.addEventListener('ratechange', () => { if (externalAudio) externalAudio.playbackRate = video.playbackRate; });
  video.addEventListener('ended', () => externalAudio?.pause());
  video.addEventListener('emptied', () => { stopExternalAudio(); clearExtractedSubtitles(); });
  $('videoVolume')?.addEventListener('input', e => { if (externalAudio) externalAudio.volume = Number(e.target.value); });
  window.addEventListener('beforeunload', () => {
    stopExternalAudio(); clearExtractedSubtitles();
    try { ffmpeg?.terminate(); } catch (_) {}
  });
})();
