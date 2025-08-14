console.log("Let Write javascript");


function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);

    mins = mins < 10 ? "0" + mins : mins;
    secs = secs < 10 ? "0" + secs : secs;

    return `${mins}:${secs}`;
}

let audio = new Audio();
let songs = [];

async function getSongs() {
    let a = await fetch("./songs/"); // ✅ relative path
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = []; // ✅ reset the global array
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(decodeURIComponent(element.href.split("/").pop())); // ✅ decode %20 to spaces
        }
    }
    return songs;
}


function cleanSongName(filename) {
    return filename
        .replaceAll("%20", " ")
        .replace(".mp3", "")
        .replaceAll("_", "")
        .trim();
}

const playMusic = (track) => {
    audio.pause();
    audio.src = `./songs/${track}`; // ✅ relative path
    audio.load();
    audio.play();

    document.querySelector(".songinfo").innerHTML = cleanSongName(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    document.querySelector(".playbar").classList.remove("hidden");
    play.src = "./pause.svg"; // ✅ relative

    audio.addEventListener("ended", () => {
        document.querySelector(".playbar").classList.add("hidden");
    });

    audio.addEventListener("playing", () => {
        document.querySelector(".playbar").classList.remove("hidden");
    });
};

async function main() {
    let currentSong;
    songs = await getSongs();

    let songUL = document.querySelector(".songlist ul");
    songUL.innerHTML = "";
    for (const song of songs) {
        let displayName = cleanSongName(song);
        songUL.innerHTML += `
        <li data-song="${song}">
            <div class="music-card">
                <div class="cover">
                    <img src="./music.svg" alt="">
                    <div class="play-icon">▶</div>
                </div>
                <div class="info">
                    <div class="title" title="${displayName}">${displayName}</div>
                    <div class="subtitle" title="Sachin-Jigar,Krishnakali Saha,Sonu Nigham,Amitabh Bhattacharya">
                        Sachin-Jigar,Krishnakali Saha,Sonu Nigham,Amitabh Bhattacharya
                    </div>
                </div>
            </div>
        </li>
    `;
    }
    

    // ✅ Use the real filename
    document.querySelectorAll(".songlist li").forEach(e => {
        e.addEventListener("click", () => {
            const filename = e.getAttribute("data-song");
            playMusic(filename);
        });
    });


    play.addEventListener("click", () => {
        if (audio.paused) {
            audio.play();
            play.src = "./pause.svg"; // ✅ relative
        } else {
            audio.pause();
            play.src = "./play.svg"; // ✅ relative
        }
    });

    audio.addEventListener("timeupdate", () => {
        if (!isNaN(audio.duration)) {
            document.querySelector(".songtime").innerHTML =
                `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        }
        let progress = (audio.currentTime / audio.duration) * 100;
        document.getElementById("seekbar").value = progress || 0;
    });

    document.getElementById("seekbar").addEventListener("input", (e) => {
        const seekPercent = e.target.value;
        audio.currentTime = (seekPercent / 100) * audio.duration;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        audio.pause();
        let index = songs.indexOf(audio.src.split("/").pop()); // ✅ safer
        if (index > 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        audio.pause();
        let index = songs.indexOf(audio.src.split("/").pop()); // ✅ safer
        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
        }
    });

    audio.addEventListener("ended", function () {
        audio.pause();
        let index = songs.indexOf(audio.src.split("/").pop()); // ✅ safer
        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
        }
    });

    document.querySelector(".volume input").addEventListener("change", (e) => {
        audio.volume = parseInt(e.target.value) / 100;
        if (audio.volume <= 0) {
            volumeIcon.src = "./mute.svg"; // ✅ relative
        } else {
            volumeIcon.src = "./volume.svg"; // ✅ relative
        }
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            audio.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            audio.volume = 0.10;
            document.querySelector(".range input").value = 10;
        }
    });

    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
            const songSrc = card.getAttribute('data-song');
            if (songSrc) {
                playMusic(songSrc);
            }
        });
    });
}

main();
