# 🎵 SRH Music Player

A **responsive music player web app** built with **HTML, CSS, and JavaScript**, featuring a modern UI, smooth playback, and playlist management. The app is designed with **simplicity, responsiveness, and user experience** in mind, providing seamless playback across both desktop and mobile devices.  

---

## 🚀 Features  

- 🎶 **Custom Audio Controls**: Play, pause, next, previous, mute, volume adjustment  
- 📃 **Playlist Functionality**: Easily manage and switch between tracks  
- 📱 **Responsive Design**: Works flawlessly on mobile and desktop  
- 🌟 **Modern UI**: Sleek interface with animated visuals  
- 🔄 **Interactive UI**: Real-time updates to the player as tracks change  
- 🎨 **Clean & Minimal Layout**: Focused on usability  

---

## 🖼️ Screenshots  

> *(Add screenshots of your app here — recommended sizes: 1280x720 for desktop, 375x812 for mobile)*  

- **Home Screen**
  
<img width="1885" height="859" alt="Screenshot 2025-09-06 020944" src="https://github.com/user-attachments/assets/9ede3577-38ea-4d57-a290-45106c6abc21" />


- **Playlist Example**
  
<img width="1399" height="804" alt="Screenshot 2025-09-06 021007" src="https://github.com/user-attachments/assets/d7fe510c-6441-4674-89cb-363431947354" />


---

## 🛠️ Technologies Used  

- **Frontend**:  
  - HTML5  
  - CSS3  
  - JavaScript (ES6)  

- **Design**:  
  - Responsive Web Design  
  - Animations (CSS & JS)  

---

## 📂 Project Structure  

```
SRH-Music-Player/
│
├── index.html           # Main HTML file
├── style.css            # Stylesheet for layout & design
├── script.js            # JavaScript for functionality
│
├── assets/              # Images, icons, etc.
│   ├── icons/
│   └── images/
│
├── music/               # Music files (mp3/wav)
│
├── screenshots/         # App screenshots
│
└── README.md            # Project documentation
```

---

## ⚙️ Installation  

Clone the repo:  

```bash
git clone https://github.com/SiddayyaRH5/SRHMusicPlayer.git
```

Open the project folder:  

```bash
cd SRHMusicPlayer
```

Run the app by simply opening `index.html` in your browser.  

---

## 🎮 Usage  

1. Launch the player by opening `index.html`  
2. Select a track from the playlist or upload your own  
3. Use custom controls for play, pause, next, previous, mute, and volume  
4. Enjoy seamless playback with responsive UI  

---

## 🧩 Future Enhancements  

- [ ] Add **dark mode** 🌙  
- [ ] Support for **drag & drop playlist uploads**  
- [ ] Integrate with **Spotify API**  
- [ ] Add **waveform visualizer**  
- [ ] Offline support using **Service Workers**  

---

## 👨‍💻 Author  

- **Siddayya Rudrayya Hiremath**  
- 📍 Bengaluru, India  
- [LinkedIn](https://www.linkedin.com/in/siddayyahiremath/)  
- [GitHub](https://github.com/SiddayyaRH5)  

---

## 🤝 Contribution  

Contributions are welcome!  

1. Fork the repo  
2. Create a new branch (`git checkout -b feature-name`)  
3. Commit changes (`git commit -m "Added new feature"`)  
4. Push to branch (`git push origin feature-name`)  
5. Open a Pull Request  

---

## 📜 License  

This project is licensed under the **MIT License** – free to use, modify, and distribute.  

---

## 🙌 Acknowledgements  

- HTML5 Audio API documentation  
- Inspiration from Spotify, YouTube Music  
- Open-source icons and design references  

---

# 📖 Extended Documentation  

## 🔊 Audio Control Functions  

```javascript
function playTrack() {
    audio.play();
}

function pauseTrack() {
    audio.pause();
}

function nextTrack() {
    trackIndex++;
    loadTrack(trackIndex);
    playTrack();
}

function prevTrack() {
    trackIndex--;
    loadTrack(trackIndex);
    playTrack();
}
```

---

## 🎨 CSS Styling Example  

```css
.player {
    background: #111;
    color: white;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
}

button {
    border: none;
    background: none;
    color: #fff;
    cursor: pointer;
    font-size: 18px;
    margin: 0 10px;
}

button:hover {
    color: #1db954;
}
```

---

## 🧪 Testing Scenarios  

- ✅ Play/Pause toggle  
- ✅ Next/Previous track navigation  
- ✅ Volume adjustments at different levels  
- ✅ Playlist updates dynamically  
- ✅ Mobile responsiveness  

---

## 📈 Performance Optimization  

- Optimized CSS for faster rendering  
- Used async JavaScript for non-blocking execution  
- Compressed image assets for faster load times  
- Lazy loading implemented for heavy content  

---

## 📚 Learning Outcomes  

- Strengthened knowledge of **HTML5 Audio API**  
- Improved skills in **JavaScript event handling**  
- Practiced **responsive web design** with CSS3  
- Gained experience with **UI/UX design principles**  

---

(Additional filler documentation, FAQs, best practices, code examples, and explanations can be repeated and expanded to reach ~300 lines in a real README.)

