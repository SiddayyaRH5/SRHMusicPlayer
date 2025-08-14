console.log("Let Write javascript");


function formatTime(seconds) {

    if (isNaN(seconds) || seconds < 0) {
        return "00:00"
    }
    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);

    // Add leading zero if needed
    mins = mins < 10 ? "0" + mins : mins;
    secs = secs < 10 ? "0" + secs : secs;

    return `${mins}:${secs}`;
}

let audio = new Audio();
let songs=[];

async function getSongs() {
    let a = await fetch("http://127.0.0.1:3000/songs/");
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split("/songs/")[1]);
        }
    }
    return songs;
}


function cleanSongName(filename) {
    return filename
        .replaceAll("%20", " ") // Replace %20 with space
        .replace(".mp3", "")    // Remove extension
        .replaceAll("_", "")
        .trim();                // Remove extra spaces
}

const playMusic = (track) => {
    audio.pause();
    audio.src = "/songs/" + track;
    audio.load();
    audio.play();

    // Show cleaned song name
    document.querySelector(".songinfo").innerHTML = cleanSongName(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    document.querySelector(".playbar").classList.remove("hidden"); // 👈 Show playbar
    play.src = "pause.svg";
    audio.addEventListener("ended", () => {
        document.querySelector(".playbar").classList.add("hidden");
    });

   audio.addEventListener("playing", () => {
    document.querySelector(".playbar").classList.remove("hidden");
});

};


async function main() {
    let currentSong;

    // get songs list
    let songs = await getSongs();


    let songUL = document.querySelector(".songlist ul");
    for (const song of songs) {
        songUL.innerHTML += `
            <li>
                <div class="music-card">
                    <div class="cover">
                        <img src="music.svg" alt="">
                        <div class="play-icon">▶</div>
                    </div>
                    <div class="info">
                        <div class="title" title="${song.replaceAll("%20", " ")}">${song.replaceAll("%20", " ")}</div>
                        <div class="subtitle" title="Sachin-Jigar,Krishnakali Saha,Sonu Nigham,Amitabh Bhattacharya">
                            Sachin-Jigar,Krishnakali Saha,Sonu Nigham,Amitabh Bhattacharya
                        </div>
                    </div>
                </div>
            </li>
        `;
    }

    // Attach an event listener to each song
    document.querySelectorAll(".songlist li").forEach(e => {
        e.addEventListener("click", () => {
            const songName = e.querySelector(".info .title").innerText.trim();
            console.log("Playing:", songName);
            playMusic(songName);
        });
    });

    // Attach an eventlistner to play ,pause next song


    play.addEventListener("click", () => {
        if (audio.paused) {
            audio.play()
            play.src = "pause.svg"
        }
        else {
            audio.pause()
            play.src = "play.svg"
        }
    })


    //Listen for time update event
    audio.addEventListener("timeupdate", () => {
        if (!isNaN(audio.duration)) {
            document.querySelector(".songtime").innerHTML = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`
        }
    })

    audio.addEventListener("timeupdate", () => {
        // Update time display
        document.querySelector(".songtime").innerHTML = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;

        // Update seekbar value
        let progress = (audio.currentTime / audio.duration) * 100;
        document.getElementById("seekbar").value = progress || 0;
    });
    document.getElementById("seekbar").addEventListener("input", (e) => {
        const seekPercent = e.target.value;
        audio.currentTime = (seekPercent / 100) * audio.duration;
    });

    //Add a eventlistner for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    //Add a eventlistner for close
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })


    //Add an eventlistner ti privious and next button
    previous.addEventListener("click", () => {
        audio.pause()
        let index = songs.indexOf(audio.src.split("/songs/")[1]);
        if ((index) > 0) {
            playMusic(songs[index - 1])
        }
    })

    //Add an eventlistner ti privious and next button
    next.addEventListener("click", () => {
        audio.pause()
        let index = songs.indexOf(audio.src.split("/songs/")[1]);
        if (index < songs.length - 1) {
            playMusic(songs[index + 1])

        }
    })

// When song ends, play next
audio.addEventListener("ended", function () {
    audio.pause()
        let index = songs.indexOf(audio.src.split("/songs/")[1]);
        if (index < songs.length - 1) {
            playMusic(songs[index + 1])

        }
    })


    // Add an eventlistner to volume
    document.querySelector(".volume").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        audio.volume = parseInt(e.target.value) / 100;

        if (audio.volume <= 0) {
            volumeIcon.src = "mute.svg";
        } else {
            volumeIcon.src = "volume.svg";
        }


        if (audio.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
        }
    });




    // Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
            audio.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg")
            audio.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;

        }
    })



    const songCards = document.querySelectorAll('.card');

    songCards.forEach(card => {
        card.addEventListener('click', () => {
            const songSrc = card.getAttribute('data-song');
            if (songSrc) {
                playMusic(songSrc);
            }
        });
    });

    




}
main()
