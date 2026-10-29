/* SRH Media Player: local-device video playback. No file uploads or server storage. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const video = $('srhVideo');
  if (!video) return;
  const els = {
    musicMode: $('musicModeBtn'), videoMode: $('videoModeBtn'), app: $('videoApp'), songs: document.querySelector('.Songs-sections'), playbar: document.querySelector('.playbar'),
    fileInput: $('videoFilesInput'), choose: $('chooseVideosBtn'), emptyChoose: $('emptyChooseVideosBtn'), clear: $('clearVideoQueueBtn'), stage: $('videoStage'), empty: $('videoEmptyState'),
    title: $('videoTitle'), meta: $('videoMeta'), queue: $('videoQueue'), count: $('videoQueueCount'), search: $('videoSearch'), toast: $('videoToast'), seek: $('videoSeek'), current: $('videoCurrentTime'), duration: $('videoDuration'),
    play: $('videoPlayBtn'), previous: $('videoPreviousBtn'), next: $('videoNextBtn'), back: $('videoBackBtn'), forward: $('videoForwardBtn'), mute: $('videoMuteBtn'), volume: $('videoVolume'), speed: $('videoSpeed'), loop: $('videoLoopBtn'), shuffle: $('videoShuffleBtn'),
    subtitle: $('videoSubtitleBtn'), subtitleInput: $('subtitleFileInput'), pip: $('videoPipBtn'), fit: $('videoFitBtn'), screenshot: $('videoScreenshotBtn'), fullscreen: $('videoFullscreenBtn')
  };
  let items = [], currentId = null, nextId = 1, objectUrls = [], subtitleUrl = null, fitMode = 0, shuffleOn = false, toastTimer = null;
  const fitModes = ['contain', 'cover', 'fill'];
  const fmt = (n) => { if (!Number.isFinite(n) || n < 0) return '00:00'; const s = Math.floor(n); return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`.replace(/^00:/,''); };
  function toast(message) { els.toast.textContent = message; els.toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2800); }
  function currentItem() { return items.find(x => x.id === currentId) || null; }
  function prettySize(bytes) { if (!Number.isFinite(bytes)) return ''; const u=['B','KB','MB','GB']; let i=0,n=bytes; while(n>=1024&&i<u.length-1){n/=1024;i++;} return `${n.toFixed(i?1:0)} ${u[i]}`; }
  function renderQueue() {
    const q = els.search.value.trim().toLowerCase(); const shown = items.filter(x => x.name.toLowerCase().includes(q));
    els.count.textContent = `${items.length} ${items.length===1?'video':'videos'}`;
    if (!shown.length) { els.queue.innerHTML = `<div class="srh-queue-empty"><i class="fa-solid fa-photo-film"></i><p>${items.length ? 'No matching videos.' : 'Your video queue is empty.'}</p><span>${items.length ? 'Try another search.' : 'Add videos to get started.'}</span></div>`; return; }
    els.queue.innerHTML = '';
    shown.forEach((item, idx) => {
      const row = document.createElement('div'); row.className = `srh-queue-item${item.id===currentId?' active':''}`; row.dataset.id = String(item.id);
      const thumb = document.createElement('div'); thumb.className='srh-queue-thumb'; thumb.innerHTML='<i class="fa-solid fa-film"></i>';
      const details=document.createElement('div'); details.className='srh-queue-details'; const name=document.createElement('strong'); name.textContent=item.name; const meta=document.createElement('span'); meta.textContent=`${item.duration ? fmt(item.duration) : 'Video'}${item.file ? ' · '+prettySize(item.file.size):''}`; details.append(name,meta);
      const play=document.createElement('button'); play.type='button'; play.className='srh-queue-play'; play.setAttribute('aria-label','Play '+item.name); play.innerHTML=item.id===currentId&&!video.paused?'<i class="fa-solid fa-volume-high"></i>':'<i class="fa-solid fa-play"></i>'; play.addEventListener('click',e=>{e.stopPropagation();loadItem(item.id,true);});
      const remove=document.createElement('button'); remove.type='button'; remove.className='srh-queue-remove'; remove.title='Remove from queue'; remove.setAttribute('aria-label','Remove '+item.name); remove.innerHTML='<i class="fa-solid fa-xmark"></i>'; remove.addEventListener('click',e=>{e.stopPropagation();removeItem(item.id);});
      row.append(thumb,details,play,remove); row.addEventListener('dblclick',()=>loadItem(item.id,true)); row.addEventListener('click',()=>loadItem(item.id,false)); els.queue.append(row);
    });
  }
  function loadItem(id, autoplay) {
    const item=items.find(x=>x.id===id); if(!item)return;
    currentId=id; video.src=item.url; video.load(); els.title.textContent=item.name; els.meta.textContent=`${item.file ? prettySize(item.file.size)+' · ' : ''}${item.file?.type || 'Local video file'}`; els.empty.hidden=true; video.style.display='block'; els.seek.value=0; els.current.textContent='0:00'; els.duration.textContent='0:00';
    renderQueue(); if(autoplay) video.play().catch(()=>toast('Playback could not start automatically. Press Play to try again.'));
  }
  function addFiles(files) {
    const incoming=Array.from(files||[]).filter(f=>f.type.startsWith('video/') || /\.(mp4|m4v|webm|ogv|ogg|mov|avi|mkv|3gp|mpeg|mpg|ts)$/i.test(f.name));
    if(!incoming.length){toast('Choose a video file supported by your browser.');return;}
    incoming.forEach(file=>{const url=URL.createObjectURL(file);objectUrls.push(url);items.push({id:nextId++,file,url,name:file.name,duration:0});});
    renderQueue(); if(!currentItem()) loadItem(items[0].id,false); toast(`${incoming.length} video${incoming.length===1?'':'s'} added to your queue.`);
  }
  function removeItem(id) { const idx=items.findIndex(x=>x.id===id); if(idx<0)return; const [removed]=items.splice(idx,1); if(removed.url) URL.revokeObjectURL(removed.url); if(currentId===id){video.pause();video.removeAttribute('src');video.load();currentId=null; if(items.length)loadItem(items[Math.min(idx,items.length-1)].id,false);else{els.empty.hidden=false;video.style.display='none';els.title.textContent='No video selected';els.meta.textContent='Open a video file to begin';}} renderQueue(); }
  function clearQueue(){video.pause();video.removeAttribute('src');video.load();items.forEach(x=>URL.revokeObjectURL(x.url));items=[];currentId=null;els.empty.hidden=false;video.style.display='none';els.title.textContent='No video selected';els.meta.textContent='Open a video file to begin';els.seek.value=0;els.current.textContent='0:00';els.duration.textContent='0:00';renderQueue();toast('Video queue cleared.');}
  function next(delta=1){if(!items.length)return;let i=items.findIndex(x=>x.id===currentId);let ni;if(shuffleOn&&items.length>1){do{ni=Math.floor(Math.random()*items.length)}while(ni===i)}else ni=(i+delta+items.length)%items.length;loadItem(items[ni].id,true);}
  function switchMode(mode){const videoMode=mode==='video';els.app.hidden=!videoMode;els.songs.hidden=videoMode;if(els.playbar)els.playbar.classList.toggle('srh-musicbar-hidden',videoMode);els.videoMode.classList.toggle('active',videoMode);els.musicMode.classList.toggle('active',!videoMode);if(videoMode)window.scrollTo({top:0,behavior:'smooth'});}
  els.musicMode.addEventListener('click',()=>switchMode('music')); els.videoMode.addEventListener('click',()=>switchMode('video'));
  els.choose.addEventListener('click',()=>els.fileInput.click());els.emptyChoose.addEventListener('click',()=>els.fileInput.click());els.fileInput.addEventListener('change',e=>{addFiles(e.target.files);e.target.value='';});els.clear.addEventListener('click',clearQueue);els.search.addEventListener('input',renderQueue);
  els.play.addEventListener('click',()=>{if(!currentItem()){if(items.length)loadItem(items[0].id,true);else els.fileInput.click();return;}if(video.paused)video.play().catch(()=>toast('This video format may not be supported by your browser.'));else video.pause();});
  els.previous.addEventListener('click',()=>next(-1));els.next.addEventListener('click',()=>next(1));els.back.addEventListener('click',()=>video.currentTime=Math.max(0,video.currentTime-10));els.forward.addEventListener('click',()=>video.currentTime=Math.min(video.duration||Infinity,video.currentTime+10));
  video.addEventListener('play',()=>{els.play.innerHTML='<i class="fa-solid fa-pause"></i>';els.play.setAttribute('aria-label','Pause');renderQueue();});video.addEventListener('pause',()=>{els.play.innerHTML='<i class="fa-solid fa-play"></i>';els.play.setAttribute('aria-label','Play');renderQueue();});
  video.addEventListener('loadedmetadata',()=>{const item=currentItem();if(item)item.duration=video.duration;els.duration.textContent=fmt(video.duration);els.meta.textContent=`${video.videoWidth} × ${video.videoHeight}${item?.file?' · '+prettySize(item.file.size):''}`;renderQueue();});
  video.addEventListener('timeupdate',()=>{els.current.textContent=fmt(video.currentTime);if(Number.isFinite(video.duration)&&video.duration>0)els.seek.value=String(Math.round(video.currentTime/video.duration*1000));});els.seek.addEventListener('input',()=>{if(Number.isFinite(video.duration))video.currentTime=(Number(els.seek.value)/1000)*video.duration;});
  video.addEventListener('ended',()=>{if(!video.loop)next(1);});video.addEventListener('error',()=>{if(currentItem())toast('Unable to play this format. Try MP4 (H.264/AAC) or WebM, depending on your browser.');});
  els.volume.addEventListener('input',()=>{video.volume=Number(els.volume.value);video.muted=video.volume===0;updateMute();});video.volume=.8;
  function updateMute(){els.mute.innerHTML=video.muted||video.volume===0?'<i class="fa-solid fa-volume-xmark"></i>':'<i class="fa-solid fa-volume-high"></i>';}
  els.mute.addEventListener('click',()=>{video.muted=!video.muted;updateMute();});els.speed.addEventListener('change',()=>{video.playbackRate=Number(els.speed.value);toast(`Playback speed ${els.speed.value}×`);});els.loop.addEventListener('click',()=>{video.loop=!video.loop;els.loop.classList.toggle('active',video.loop);toast(video.loop?'Loop current video on':'Loop current video off');});els.shuffle.addEventListener('click',()=>{shuffleOn=!shuffleOn;els.shuffle.classList.toggle('active',shuffleOn);toast(shuffleOn?'Shuffle queue on':'Shuffle queue off');});
  els.subtitle.addEventListener('click',()=>els.subtitleInput.click());els.subtitleInput.addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{let text=await f.text();if(/\.srt$/i.test(f.name)){text='WEBVTT\n\n'+text.replace(/\r/g,'').replace(/^(\d+)\s*\n/gm,'').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g,'$1.$2');}else if(!text.trimStart().startsWith('WEBVTT'))text='WEBVTT\n\n'+text; if(subtitleUrl)URL.revokeObjectURL(subtitleUrl);subtitleUrl=URL.createObjectURL(new Blob([text],{type:'text/vtt'}));video.querySelectorAll('track').forEach(t=>t.remove());const track=document.createElement('track');track.kind='subtitles';track.label=f.name;track.srclang='en';track.src=subtitleUrl;track.default=true;video.append(track);track.addEventListener('load',()=>{try{track.track.mode='showing'}catch{}});els.subtitle.classList.add('active');toast('Subtitles loaded. Use the browser video track controls if they are not visible.');}catch{toast('Could not read this subtitle file.');}});
  els.pip.addEventListener('click',async()=>{try{if(!document.pictureInPictureEnabled||video.readyState<1)throw new Error();if(document.pictureInPictureElement)await document.exitPictureInPicture();else await video.requestPictureInPicture();}catch{toast('Picture-in-picture is not available in this browser or for this video yet.');}});
  els.fit.addEventListener('click',()=>{fitMode=(fitMode+1)%fitModes.length;video.style.objectFit=fitModes[fitMode];toast(`Video fit: ${fitModes[fitMode]}`);});
  els.fullscreen.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await els.stage.requestFullscreen();}catch{toast('Fullscreen is not available here.');}});
  els.screenshot.addEventListener('click',()=>{if(!video.videoWidth){toast('Start a video before taking a screenshot.');return;}try{const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0,c.width,c.height);const a=document.createElement('a');a.download=`srh-screenshot-${Date.now()}.png`;a.href=c.toDataURL('image/png');a.click();toast('Screenshot saved.');}catch{toast('Screenshot is not available for this video.');}});
  ['dragenter','dragover'].forEach(ev=>els.stage.addEventListener(ev,e=>{e.preventDefault();els.stage.classList.add('drag-over');}));['dragleave','drop'].forEach(ev=>els.stage.addEventListener(ev,e=>{e.preventDefault();els.stage.classList.remove('drag-over');}));els.stage.addEventListener('drop',e=>addFiles(e.dataTransfer?.files));
  document.addEventListener('keydown',e=>{if(els.app.hidden||e.ctrlKey||e.metaKey||e.altKey)return;const tag=e.target?.tagName?.toLowerCase();if(['input','textarea','select','button'].includes(tag)||e.target?.isContentEditable)return;switch(e.key.toLowerCase()){case ' ':e.preventDefault();els.play.click();break;case 'arrowleft':e.preventDefault();video.currentTime=Math.max(0,video.currentTime-5);break;case 'arrowright':e.preventDefault();video.currentTime=Math.min(video.duration||Infinity,video.currentTime+5);break;case 'f':els.fullscreen.click();break;case 'm':els.mute.click();break;case 'n':next(1);break;case 'p':next(-1);break;case 'l':els.loop.click();break;case 's':els.shuffle.click();break;}});
  window.addEventListener('beforeunload',()=>{items.forEach(x=>URL.revokeObjectURL(x.url));if(subtitleUrl)URL.revokeObjectURL(subtitleUrl);});
  renderQueue();
})();
