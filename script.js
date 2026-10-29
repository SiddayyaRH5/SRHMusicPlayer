"use strict";

/* SRH Music Player — DOM-driven interactions */
if (window.__srhMusicPlayerInitialized) {
    console.warn("SRH Music Player already initialized; skipping duplicate script execution.");
} else {
window.__srhMusicPlayerInitialized = true;
document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const body = document.body;
    const sidebar = $(".left");
    const header = $(".header");
    const songSections = $(".Songs-sections");
    const songList = $(".songlist ul");
    const playbar = $(".playbar");
    const playButton = $("#play");
    const previousButton = $("#previous");
    const nextButton = $("#next");
    const seekbar = $("#seekbar");
    const volumeSlider = $(".volume-slider");
    const volumeIcon = $("#volumeIcon") || $(".volume > img");
    const songInfo = $(".songinfo");
    const songTime = $(".songtime");

    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = 0.5;

    let playlist = [];
    let currentIndex = -1;
    let isSeeking = false;
    let lastVolume = audio.volume;

    const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);

    function cleanSongName(filename = "") {
        return decodeURIComponent(filename)
            .replace(/\.mp3$/i, "")
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function formatTime(seconds) {
        if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    /* Toasts use DOM instead of browser alerts. */
    let toastTimer;
    function showToast(message, kind = "info") {
        let toast = $("#appToast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "appToast";
            toast.className = "app-toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.dataset.kind = kind;
        toast.classList.add("visible");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3600);
    }

    /* Inject a responsive hero and search box into the existing DOM. */
    if (songSections && !$(".hero", songSections)) {
        const hero = document.createElement("section");
        hero.className = "hero";
        hero.innerHTML = `
            <div class="hero-copy">
                <p class="hero-kicker"><i class="fa-solid fa-sparkles"></i> YOUR SOUND. YOUR SPACE.</p>
                <h1>Every mood has a <span>soundtrack.</span></h1>
                <p>Explore trending tracks, revisit timeless melodies, and keep your favorite sounds close with SRH Music Player.</p>
            </div>
            <div class="hero-art" aria-hidden="true"><div class="disc"></div></div>
        `;
        songSections.prepend(hero);
    }

    if (header && !$(".search-wrap", header)) {
        const search = document.createElement("label");
        search.className = "search-wrap";
        search.innerHTML = `
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <input id="musicSearch" type="search" placeholder="Search songs or artists..." autocomplete="off" aria-label="Search songs or artists">
        `;
        const buttons = $(".buttons", header);
        header.insertBefore(search, buttons || null);
    }

    /* Mobile sidebar: DOM class state + backdrop. */
    let backdrop = $(".sidebar-backdrop");
    if (!backdrop) {
        backdrop = document.createElement("button");
        backdrop.type = "button";
        backdrop.className = "sidebar-backdrop";
        backdrop.setAttribute("aria-label", "Close navigation menu");
        document.body.appendChild(backdrop);
    }

    function closeSidebar() {
        sidebar?.classList.remove("open");
        backdrop?.classList.remove("visible");
        body.classList.remove("menu-open");
        $(".hamburger")?.setAttribute("aria-expanded", "false");
    }

    function openSidebar() {
        sidebar?.classList.add("open");
        backdrop?.classList.add("visible");
        body.classList.add("menu-open");
        $(".hamburger")?.setAttribute("aria-expanded", "true");
    }

    $(".hamburger")?.addEventListener("click", () => {
        sidebar?.classList.contains("open") ? closeSidebar() : openSidebar();
    });
    $(".close")?.addEventListener("click", closeSidebar);
    backdrop.addEventListener("click", closeSidebar);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeSidebar();
    });
    window.addEventListener("resize", () => {
        if (window.innerWidth > 850) closeSidebar();
    });


    /* =====================================================
       SONG CATALOGUE + CARDS ARE GENERATED FROM JAVASCRIPT
       HTML keeps only empty category containers. This data
       object is the single source of truth for every card.
    ===================================================== */
    const MUSIC_LIBRARY = [{"category":"Trending Songs","items":[{"title":"Pardesiya - From \"Param Sundari\"","artist":"Sachin-Jigar,Krishnakali Saha,Sonu Nigham,Amitabh Bhattacharya","image":"https://i.scdn.co/image/ab67616d00001e02d5754cde395f5c46792186c7","song":"Pardesiya - From Param Sundari - Sachin-Jigar.mp3","folder":""},{"title":"Bheegi Saree (From \"Param Sundari\")","artist":"Sachin-Jigar,Krishnakali Saha,Sonu Nigham,Amitabh Bhattacharya","image":"https://lh3.googleusercontent.com/SMJl0wXXAkzpHAELBmSzs35nb8GvkIewvjAJIE0DWS_A390L6qny-90P6jx1xW5-gf7SKEiv9YN8jFRa7w=w544-h544-l90-rj","song":"Bheegi Saree (From Param Sundari).mp3","folder":""},{"title":"Coolie Disco (From \"Coolie\")","artist":"Anirudh Ravichander Coolie (Original Motion Picture Soundtrack)2025","image":"https://lh3.googleusercontent.com/rEP8DGXzEu4hQlgTKlKMpJAVH4_hKne4nGq-G-x_w13k--GA2co00q_qNuJuKU_qj6p7GgXWadTdnA8g=w544-h544-l90-rj","song":"Coolie Disco (From Coolie).mp3","folder":""},{"title":"Aavan Jaavan (From \"WAR 2\")","artist":"Arijit Singh & Nikhita Gandhi","image":"https://lh3.googleusercontent.com/CpHtlQNWV3fThtKbZoKuhQ3x3u4BrLPi_3lNG4SXYcbDKK7_Cm9ohUakjbMvVXBMke0_1Yce6-4znJyASA=w544-h544-l90-rj","song":"Aavan Jaavan (From _WAR 2_).mp3","folder":""},{"title":"Beast Mode (From \"Beast\")","artist":"Anirudh Ravichander","image":"https://lh3.googleusercontent.com/qxkprBC3H2RdudbaaWC8mN9FOej5BeN4ZP6grYSjQl-nhiAFW_KJ2OvIRf8YzAYtxJD0C8AHGzLtFQfw=w544-h544-l90-rj","song":"Beast Mode (From _Beast_) - Anirudh Ravichander.mp3","folder":""},{"title":"Don'u Don'u (From \"Maari\") (The Don's Romance)","artist":"Anirudh Ravichander & Alisha Thomasa","image":"https://lh3.googleusercontent.com/e7JBVvlKSP1IAbNolVtZlvIu_qbh9sKA4ukBoYu9JMJ2tYV0XD25PEBv0uiTaD0Rk80RN3NR8R6iTSlkXw=w544-h544-l90-rj","song":"Don'u Don'u Don'u (From Maari) - The Don's Romance - Anirudh Ravichander.mp3","folder":""},{"title":"Pacha Elai (From \"Love Today\")","artist":"Yuvan Shankar Raja & Mathichiyam Bala","image":"https://lh3.googleusercontent.com/eZ6FiHwDcwn2e5mToJjTYXDvpZmeAKEJSD1Amo2mogtzKXoosJ7VJdkrXaZGndxzoAcgNy_VDSqkA6A=w544-h544-l90-rj","song":"Pacha Elai (From _Love Today_) - Yuvan Shankar Raja.mp3","folder":""},{"title":"Vaathi Coming (From \"Master\")","artist":"Anirudh Ravichander & Gana Balachandar","image":"https://lh3.googleusercontent.com/pkXMp7DyktWsOkxNaCfZMx4_7CX0KB5iwNb5mjpuQ34XEF-V_xnnG5q9zggmhEbh3o8kEtm61tpZvrqe0A=w544-h544-l90-rj","song":"Vaathi Coming (From _Master_).mp3","folder":""},{"title":"Nee Singam Dhan (Vocals Only)","artist":"A.R. Rahman & Sid Sriram","image":"https://lh3.googleusercontent.com/YIMTS4gz8nZKOYuxoiTHRdVq80lGtQdYeE5G4uT7ZZA6n5qOhKUuSB5Js74X2kJD3YZYGI3X4OQ56tWs=w544-h544-l90-rj","song":"Nee Singam Dhan - Vocals Only - A.R. Rahman.mp3","folder":""},{"title":"Manasilaayo (From \"Vettaiyan\")","artist":"Anirudh Ravichander, Malaysia Vasudevan,Yugendran Vasudevan & Deepthi\n                                Suresh","image":"https://lh3.googleusercontent.com/NZtKRxkwbd8aJmUIZT3KX04bE3baAgFuma3V0g-bzi5t3Bayw0bUyBSILB9exyvw8CMxJMV-nkqmSWL4=w544-h544-l90-rj","song":"Manasilaayo (From _Vettaiyan_).mp3","folder":""},{"title":"Salambala (From \"Madharaasi\") (Tamil)","artist":"Anirudh Ravichander & Sai Abhyankar","image":"https://lh3.googleusercontent.com/Lzgd7Kn6caC02A-JooYp8bl5_ynpk-2AeGut31T5lCq1GXNLeOPYnJLtPIjwKnAl2_GEsREWjH-pUQai=w544-h544-l90-rj","song":"Salambala (From _Madharaasi_) (Tamil) - Anirudh Ravichander.mp3","folder":""},{"title":"SAIYAARA (From \"SAIYAARA\")","artist":"Arijit Singh & Mithoon","image":"https://lh3.googleusercontent.com/LbSZO8GtotJrdk49H0xQuB7rZD2DpdyJO_it31_XrQ_AMdoKG67VDS33JgZjn02f4C6kOgtvc8S4dfUR=w544-h544-l90-rj","song":"Saiyaara (From _Saiyaara_).mp3","folder":""},{"title":"Firestorm (From \"They Call Him OG\")","artist":"Thaman S STR Raja Kumari Deepak Blue","image":"https://lh3.googleusercontent.com/Y1-ahyzQA-suxg3j35pMrnM1jsg5HLakDM6lTqbKzn1GcLmDeTi8QVoCLz2KHVfR49TPuSMu4dT-VKsL=w544-h544-l90-rj","song":"Firestorm (From _They Call Him OG_) - Thaman S.mp3","folder":""},{"title":"Uyi Amma (From \"Azaad\")","artist":"Amit Trivedi Madhubanti Bagchi Amitabh Bhattacharya","image":"https://lh3.googleusercontent.com/h1LMB4t0dFgZXZrECr1yF59r_k51Vrihwc1QwinVl3ARrElIkepW34u1Ipp-fIFCgi1Y7lOeQGXTSwU=w544-h544-l90-rj","song":"Uyi Amma - From _Azaad_.mp3","folder":""}]},{"category":"Kannada Songs","items":[{"title":"Mungaru Male (Original Motion Picture SoundtracK)","artist":"Krishnakali Saha,Sonu Nigham,Yograj Bhatta","image":"https://i.scdn.co/image/ab67616d0000b273bbf22ed918b9d716dc9cafeb","song":"Mungaru Maleye - Sonu Nigam.mp3","folder":""},{"title":"Dheera Dheera (From \"KGF Chapter 1\")","artist":"Santhosh, Sachin, Puneeth, Mohan, H.Shreenivas, Vijay Aurs, and Ananya\n                                Bhat","image":"https://lh3.googleusercontent.com/DovxZkKUVJjmzyq88W9IiziYb6d4fkSKUM3L8huIUOkrUZ-KfNconQex-HOViCuq9l6aXsnx9VWnPOv8=w544-h544-l90-rj","song":"Dheera Dheera-KGF Chapyet 1.mp3","folder":""},{"title":"Feel The Power (From \"Yuvarathana \")","artist":"Thaman S, Santhosh Ananddram & Shashank Sheshagiri Feel The Power","image":"https://lh3.googleusercontent.com/LvrOfVjy6CF8JRvPqCy73s_BNcerxXmWMMPxgGPbiXiseAmApom3ZkXwAj8vv9w5vad75kn4AKdDAno=w544-h544-l90-rj","song":"Feel The Power - Thaman S.mp3","folder":""},{"title":"Yeno Yeno Aagide (From \"Googly\")","artist":"Haricharan, Apoorva Sridhar, & Kaviraj","image":"https://lh3.googleusercontent.com/mZ-8Wlik42_C8_LMvPrkPVwgARSVRFjIIRT3W_CmnyQS1qRmnwD4e18F5sDZJN32_l7iFB24uXVbZadAJg=w544-h544-l90-rj","song":"Yeno Yeno Aagide (From _Googly_).mp3","folder":""},{"title":"Sapta Sagaradaache Ello (From \"Sapta Sagaradaache Ello - Side A\")","artist":"Charan Raj, Dhananjay Ranjan & Kapil Kapilan","image":"https://lh3.googleusercontent.com/_1RNgb-PakGUdX-86LZLvFnPl3HykMP-7F7IcMzEKStoZhSHug0M_S52FNkdDA_sVQPE4AiWiSMGG7g=w544-h544-l90-rj","song":"Sapta Sagaradaache Ello - Side A Title Track (From _Sapta Sagaradaache Ello - Side A_).mp3","folder":""},{"title":"Belakina Kavithe (From \"Banaras\")","artist":"Charan Raj, Dhananjay Ranjan & Kapil Kapilan","image":"https://lh3.googleusercontent.com/gCMdBZlojMWAQFH9Adcb3ZRcPvMlKKOVB2waNb18h2JoYFNKOeKxAfsCxZJo9D56exMG8idapVwu-2wd=w544-h544-l90-rj","song":"Belakina Kavithe (From _Banaras_) - Sanjith Hegde.mp3","folder":""},{"title":"Singara Siriye (From \"Kantara\")","artist":"B. Ajaneesh Loknath, Vijay Prakash, Ananya Bhat & Nagraj Panar Valtur","image":"https://lh3.googleusercontent.com/ojfOtzIfkSNTHAP3RCJwKf8T3vkvGhsoxQXBhW-s7IdsKsr8MnN6htPiqFJynXfgSG01AdukM8r1hfU=w544-h544-l90-rj","song":"Singara Siriye (From _Kantara_) - B. Ajaneesh Loknath.mp3","folder":""},{"title":"Ra Ra Rakkamma (From \"Vikrant Rona\")","artist":"Nakash Aziz & Sunidhi Chauhan","image":"https://lh3.googleusercontent.com/8BVenOr1ouOZsE4BJJgm0dECn-UvZhWPdOUhd-d9ZytuEgs_P-r8GW-jV7Fx-Cm9Nfm5omC8ykBF1bFV=w544-h544-l90-rj","song":"Ra Ra Rakkamma (From _Vikrant Rona_).mp3","folder":""},{"title":"Arere Avala Naguva (From \"Sa.Hi.Pra.Shaale, Kasaragodu\")","artist":"Sachin-Jigar,Krishnakali Saha,Sonu Nigham,Amitabh Bhattacharya","image":"https://lh3.googleusercontent.com/pf46H6-0HZPUmLGDCkUMnYXkM-fe7AoUk9D3Q05HVBlIK0ddeTu7v_wS0P7uG34gha109TXwH8zhBC2Z9Q=w544-h544-l90-rj","song":"Arere Avala Naguva.mp3","folder":""},{"title":"Rudhira Dhaara (From \"Bagheera\")","artist":"B. Ajaneesh Loknath & Aniruddha Sastry Rudhira Dhaara","image":"https://lh3.googleusercontent.com/-9RNSPJcvxhQUmWjQw1p0petiL6i8AZ_lBCt_0gkiLX1FdagECf4miO5p4zRAZSzjZ_hlxDPnvOA3KI=w544-h544-l90-rj","song":"Rudhira Dhaara (From _Bagheera_) - B. Ajaneesh Loknath.mp3","folder":""},{"title":"Dwapara (From \"Krishnam Pranaya Sakhi\")","artist":"Jaskaran Singh Krishnam Pranaya Sakhi","image":"https://lh3.googleusercontent.com/nu9ca8u4KmT63rg7jZe5Hm34_IGHjAAr7bXVh2OE5q4lCWYMThJYpZUWK1GBKGPsd9ZsxhHRtaBFwEnD=w544-h544-l90-rj","song":"Dwapara (From _Krishnam Pranaya Sakhi_) - Jaskaran Singh.mp3","folder":""},{"title":"Danks Anthem (From \"Su From So\")","artist":"Sumedh K, Raj B Shetty & Anurag Kulkarni","image":"https://lh3.googleusercontent.com/AQVghsPKkgPPm3d8eg3vtKCx7w_I00U9POuGAHEZ_bx1ikzcZwE0I3ini7Gry1dKOydYxE7_pyTvA22OGg=w544-h544-l90-rj","song":"Danks Anthem (From _Su From So_).mp3","folder":""},{"title":"Mungaru Maleyalli (From \"Andondittu Kaala\")","artist":"Sid Sriram,Dhananjay Ranjan & Raghavendra V","image":"https://lh3.googleusercontent.com/JjSm7DQuK0KYUcDzXCOMmir9GduyjX43wfhIdmjjbE0YBshpMZPHh9HDCqKXk9COYBq6x4iWFZ-wEfnozA=w544-h544-l90-rj","song":"Mungaru Maleyalli - From _Andondittu Kaala_ - Sid Sriram.mp3","folder":""},{"title":"Inkem Inkem Inkem Kaavaale (From \"Geetha Govindam\")","artist":"Sid Sriram,Sonu Nigham,Amitabh Bhattacharya","image":"https://lh3.googleusercontent.com/rJ1El4-dPu-vEErSVI2g34EoLLKCjxeqlzEQDtb2hrWwjurDnqNlZ_eM8y16m2MGNK3xu_0avIQ8J5Z5=w544-h544-l90-rj","song":"Inkem Inkem Inkem Kaavaale Kannada Version(From Geetha Govindam).mp3","folder":""}]},{"category":"Romantic Hits","items":[{"title":"Yeno Yeno Aagide (From \"Googly\")","artist":"Haricharan, Apoorva Sridhar, & Kaviraj","image":"https://lh3.googleusercontent.com/mZ-8Wlik42_C8_LMvPrkPVwgARSVRFjIIRT3W_CmnyQS1qRmnwD4e18F5sDZJN32_l7iFB24uXVbZadAJg=w544-h544-l90-rj","song":"Yeno Yeno Aagide (From _Googly_).mp3","folder":""},{"title":"Manasilaayo (From \"Vettaiyan\")","artist":"Anirudh Ravichander, Malaysia Vasudevan, Yugendran Vasudevan & Deepthi\n                                Suresh","image":"https://lh3.googleusercontent.com/NZtKRxkwbd8aJmUIZT3KX04bE3baAgFuma3V0g-bzi5t3Bayw0bUyBSILB9exyvw8CMxJMV-nkqmSWL4=w544-h544-l90-rj","song":"Manasilaayo (From _Vettaiyan_).mp3","folder":""},{"title":"Pardesiya - From \"Param Sundari\"","artist":"Sachin-Jigar, Krishnakali Saha, Sonu Nigham, Amitabh Bhattacharya","image":"https://i.scdn.co/image/ab67616d00001e02d5754cde395f5c46792186c7","song":"Pardesiya - From Param Sundari - Sachin-Jigar.mp3","folder":""},{"title":"Dwapara (From \"Krishnam Pranaya Sakhi\")","artist":"Jaskaran Singh Krishnam Pranaya Sakhi","image":"https://lh3.googleusercontent.com/nu9ca8u4KmT63rg7jZe5Hm34_IGHjAAr7bXVh2OE5q4lCWYMThJYpZUWK1GBKGPsd9ZsxhHRtaBFwEnD=w544-h544-l90-rj","song":"Dwapara (From _Krishnam Pranaya Sakhi_) - Jaskaran Singh.mp3","folder":""},{"title":"Belakina Kavithe (From \"Banaras\")","artist":"Charan Raj, Dhananjay Ranjan & Kapil Kapilan","image":"https://lh3.googleusercontent.com/gCMdBZlojMWAQFH9Adcb3ZRcPvMlKKOVB2waNb18h2JoYFNKOeKxAfsCxZJo9D56exMG8idapVwu-2wd=w544-h544-l90-rj","song":"Belakina Kavithe (From _Banaras_) - Sanjith Hegde.mp3","folder":""}]},{"category":"Party Anthems","items":[{"title":"Vaathi Coming (From \"Master\")","artist":"Anirudh Ravichander & Gana Balachandar","image":"https://lh3.googleusercontent.com/pkXMp7DyktWsOkxNaCfZMx4_7CX0KB5iwNb5mjpuQ34XEF-V_xnnG5q9zggmhEbh3o8kEtm61tpZvrqe0A=w544-h544-l90-rj","song":"Vaathi Coming (From _Master_).mp3","folder":""},{"title":"Uyi Amma (From \"Azaad\")","artist":"Amit Trivedi Madhubanti Bagchi Amitabh Bhattacharya","image":"https://lh3.googleusercontent.com/h1LMB4t0dFgZXZrECr1yF59r_k51Vrihwc1QwinVl3ARrElIkepW34u1Ipp-fIFCgi1Y7lOeQGXTSwU=w544-h544-l90-rj","song":"Uyi Amma - From _Azaad_.mp3","folder":""},{"title":"Danks Anthem (From \"Su From So\")","artist":"Sumedh K, Raj B Shetty & Anurag Kulkarni","image":"https://lh3.googleusercontent.com/AQVghsPKkgPPm3d8eg3vtKCx7w_I00U9POuGAHEZ_bx1ikzcZwE0I3ini7Gry1dKOydYxE7_pyTvA22OGg=w544-h544-l90-rj","song":"Danks Anthem (From _Su From So_).mp3","folder":""},{"title":"Salambala (From \"Madharaasi\") (Tamil)","artist":"Anirudh Ravichander & Sai Abhyankar","image":"https://lh3.googleusercontent.com/Lzgd7Kn6caC02A-JooYp8bl5_ynpk-2AeGut31T5lCq1GXNLeOPYnJLtPIjwKnAl2_GEsREWjH-pUQai=w544-h544-l90-rj","song":"Salambala (From _Madharaasi_) (Tamil) - Anirudh Ravichander.mp3","folder":""},{"title":"Beast Mode (From \"Beast\")","artist":"Anirudh Ravichander","image":"https://lh3.googleusercontent.com/qxkprBC3H2RdudbaaWC8mN9FOej5BeN4ZP6grYSjQl-nhiAFW_KJ2OvIRf8YzAYtxJD0C8AHGzLtFQfw=w544-h544-l90-rj","song":"Beast Mode (From _Beast_) - Anirudh Ravichander.mp3","folder":""},{"title":"Coolie Disco (From \"Coolie Movie\")","artist":"Anirudh Ravichander Coolie (Original Motion Picture Soundtrack) 2025","image":"https://lh3.googleusercontent.com/rEP8DGXzEu4hQlgTKlKMpJAVH4_hKne4nGq-G-x_w13k--GA2co00q_qNuJuKU_qj6p7GgXWadTdnA8g=w544-h544-l90-rj","song":"Coolie Disco (From Coolie).mp3","folder":""},{"title":"Ra Ra Rakkamma (From \"Vikrant Rona\")","artist":"Nakash Aziz & Sunidhi Chauhan","image":"https://lh3.googleusercontent.com/8BVenOr1ouOZsE4BJJgm0dECn-UvZhWPdOUhd-d9ZytuEgs_P-r8GW-jV7Fx-Cm9Nfm5omC8ykBF1bFV=w544-h544-l90-rj","song":"Ra Ra Rakkamma (From _Vikrant Rona_).mp3","folder":""}]},{"category":"Top 2025 Tracks","items":[{"title":"Aavan Jaavan (From \"WAR 2\")","artist":"Arijit Singh & Nikhita Gandhi","image":"https://lh3.googleusercontent.com/CpHtlQNWV3fThtKbZoKuhQ3x3u4BrLPi_3lNG4SXYcbDKK7_Cm9ohUakjbMvVXBMke0_1Yce6-4znJyASA=w544-h544-l90-rj","song":"Aavan Jaavan (From _WAR 2_).mp3","folder":""},{"title":"Mungaru Maleyalli (From \"Andondittu Kaala\")","artist":"Sid Sriram, Dhananjay Ranjan & Raghavendra V","image":"https://lh3.googleusercontent.com/JjSm7DQuK0KYUcDzXCOMmir9GduyjX43wfhIdmjjbE0YBshpMZPHh9HDCqKXk9COYBq6x4iWFZ-wEfnozA=w544-h544-l90-rj","song":"Mungaru Maleyalli - From _Andondittu Kaala_ - Sid Sriram.mp3","folder":""},{"title":"Salambala (From \"Madharaasi\") (Tamil)","artist":"Anirudh Ravichander & Sai Abhyankar","image":"https://lh3.googleusercontent.com/Lzgd7Kn6caC02A-JooYp8bl5_ynpk-2AeGut31T5lCq1GXNLeOPYnJLtPIjwKnAl2_GEsREWjH-pUQai=w544-h544-l90-rj","song":"Salambala (From _Madharaasi_) (Tamil) - Anirudh Ravichander.mp3","folder":""},{"title":"Pardesiya - From \"Param Sundari\"","artist":"Sachin-Jigar,Krishnakali Saha,Sonu Nigham,Amitabh Bhattacharya","image":"https://i.scdn.co/image/ab67616d00001e02d5754cde395f5c46792186c7","song":"Pardesiya - From Param Sundari - Sachin-Jigar.mp3","folder":""},{"title":"Firestorm (From \"They Call Him OG\")","artist":"Thaman S STR Raja Kumari Deepak Blue","image":"https://lh3.googleusercontent.com/Y1-ahyzQA-suxg3j35pMrnM1jsg5HLakDM6lTqbKzn1GcLmDeTi8QVoCLz2KHVfR49TPuSMu4dT-VKsL=w544-h544-l90-rj","song":"Firestorm (From _They Call Him OG_) - Thaman S.mp3","folder":""},{"title":"Bheegi Saree (From \"Param Sundari\")","artist":"Sachin-Jigar,Krishnakali Saha,Sonu Nigham,Amitabh Bhattacharya","image":"https://lh3.googleusercontent.com/SMJl0wXXAkzpHAELBmSzs35nb8GvkIewvjAJIE0DWS_A390L6qny-90P6jx1xW5-gf7SKEiv9YN8jFRa7w=w544-h544-l90-rj","song":"Bheegi Saree (From Param Sundari).mp3","folder":""},{"title":"SAIYAARA (From \"SAIYAARA\")","artist":"Arijit Singh & Mithoon","image":"https://lh3.googleusercontent.com/LbSZO8GtotJrdk49H0xQuB7rZD2DpdyJO_it31_XrQ_AMdoKG67VDS33JgZjn02f4C6kOgtvc8S4dfUR=w544-h544-l90-rj","song":"Saiyaara (From _Saiyaara_).mp3","folder":""},{"title":"Coolie Disco (From \"Coolie Movie\")","artist":"Anirudh Ravichander Coolie (Original Motion Picture Soundtrack)2025","image":"https://lh3.googleusercontent.com/rEP8DGXzEu4hQlgTKlKMpJAVH4_hKne4nGq-G-x_w13k--GA2co00q_qNuJuKU_qj6p7GgXWadTdnA8g=w544-h544-l90-rj","song":"Coolie Disco (From Coolie).mp3","folder":""}]},{"category":"Feel Good Tunes","items":[{"title":"Arere Avala Naguva (From \"Sa.Hi.Pra.Shaale, Kasaragodu\")","artist":"Sachin-Jigar, Krishnakali Saha, Sonu Nigham, Amitabh Bhattacharya","image":"https://lh3.googleusercontent.com/pf46H6-0HZPUmLGDCkUMnYXkM-fe7AoUk9D3Q05HVBlIK0ddeTu7v_wS0P7uG34gha109TXwH8zhBC2Z9Q=w544-h544-l90-rj","song":"Arere Avala Naguva.mp3","folder":""},{"title":"Nee Singam Dhan (Vocals Only)","artist":"A.R. Rahman & Sid Sriram","image":"https://lh3.googleusercontent.com/YIMTS4gz8nZKOYuxoiTHRdVq80lGtQdYeE5G4uT7ZZA6n5qOhKUuSB5Js74X2kJD3YZYGI3X4OQ56tWs=w544-h544-l90-rj","song":"Nee Singam Dhan - Vocals Only - A.R. Rahman.mp3","folder":""},{"title":"Dwapara (From \"Krishnam Pranaya Sakhi\")","artist":"Jaskaran Singh Krishnam Pranaya Sakhi","image":"https://lh3.googleusercontent.com/nu9ca8u4KmT63rg7jZe5Hm34_IGHjAAr7bXVh2OE5q4lCWYMThJYpZUWK1GBKGPsd9ZsxhHRtaBFwEnD=w544-h544-l90-rj","song":"Dwapara (From _Krishnam Pranaya Sakhi_) - Jaskaran Singh.mp3","folder":""},{"title":"Belakina Kavithe (From \"Banaras\")","artist":"Charan Raj, Dhananjay Ranjan & Kapil Kapilan","image":"https://lh3.googleusercontent.com/gCMdBZlojMWAQFH9Adcb3ZRcPvMlKKOVB2waNb18h2JoYFNKOeKxAfsCxZJo9D56exMG8idapVwu-2wd=w544-h544-l90-rj","song":"Belakina Kavithe (From _Banaras_) - Sanjith Hegde.mp3","folder":""},{"title":"Apudo Ipudo","artist":"Apudo Ipudo Siddharth Bommarillu 2006","image":"https://lh3.googleusercontent.com/HFO-WSrGUblmzQTkYQq8apQY4yaSc4lQAuT6SssMma5OWAch5oBCrBlyWWKXc-Z2mOaWrw09WCbarP6J0A=w544-h544-l90-rj","song":"Apudo Ipudo - Siddharth.mp3","folder":""}]},{"category":"Evergreen Melodies","items":[{"title":"Pardesiya - From \"Param Sundari\"","artist":"Sachin-Jigar, Krishnakali Saha, Sonu Nigham, Amitabh Bhattacharya","image":"https://i.scdn.co/image/ab67616d00001e02d5754cde395f5c46792186c7","song":"Pardesiya - From Param Sundari - Sachin-Jigar.mp3","folder":""},{"title":"Dwapara (From \"Krishnam Pranaya Sakhi\")","artist":"Jaskaran Singh Krishnam Pranaya Sakhi","image":"https://lh3.googleusercontent.com/nu9ca8u4KmT63rg7jZe5Hm34_IGHjAAr7bXVh2OE5q4lCWYMThJYpZUWK1GBKGPsd9ZsxhHRtaBFwEnD=w544-h544-l90-rj","song":"Dwapara (From _Krishnam Pranaya Sakhi_) - Jaskaran Singh.mp3","folder":""},{"title":"Belakina Kavithe (From \"Banaras\")","artist":"Charan Raj, Dhananjay Ranjan & Kapil Kapilan","image":"https://lh3.googleusercontent.com/gCMdBZlojMWAQFH9Adcb3ZRcPvMlKKOVB2waNb18h2JoYFNKOeKxAfsCxZJo9D56exMG8idapVwu-2wd=w544-h544-l90-rj","song":"Belakina Kavithe (From _Banaras_) - Sanjith Hegde.mp3","folder":""},{"title":"Yeno Yeno Aagide (From \"Googly\")","artist":"Haricharan, Apoorva Sridhar, & Kaviraj","image":"https://lh3.googleusercontent.com/mZ-8Wlik42_C8_LMvPrkPVwgARSVRFjIIRT3W_CmnyQS1qRmnwD4e18F5sDZJN32_l7iFB24uXVbZadAJg=w544-h544-l90-rj","song":"Yeno Yeno Aagide (From _Googly_).mp3","folder":""},{"title":"Aavan Jaavan (From \"WAR 2\")","artist":"Arijit Singh & Nikhita Gandhi","image":"https://lh3.googleusercontent.com/CpHtlQNWV3fThtKbZoKuhQ3x3u4BrLPi_3lNG4SXYcbDKK7_Cm9ohUakjbMvVXBMke0_1Yce6-4znJyASA=w544-h544-l90-rj","song":"Aavan Jaavan (From _WAR 2_).mp3","folder":""},{"title":"Mungaru Maleyalli (From \"Andondittu Kaala\")","artist":"Sid Sriram, Dhananjay Ranjan & Raghavendra V","image":"https://lh3.googleusercontent.com/JjSm7DQuK0KYUcDzXCOMmir9GduyjX43wfhIdmjjbE0YBshpMZPHh9HDCqKXk9COYBq6x4iWFZ-wEfnozA=w544-h544-l90-rj","song":"Mungaru Maleyalli - From _Andondittu Kaala_ - Sid Sriram.mp3","folder":""}]},{"category":"India's Biggest Hits","items":[{"title":"Kollywood Dance Hitlist","artist":"Anirudh Ravichander, Arivu, Subhalashini","image":"https://lh3.googleusercontent.com/xMk8doYI7x7WszXYYGACenFk407G5B-_dOEG1f3p8AfAsBHsqmLlVgkXnhVM-F1vVkcy2z-NKWuiALo=w544-h544-l90-rj","song":"","folder":""},{"title":"I-Pop South","artist":"Sai Abhyankkar, Paal Dabba, Sahi Siva","image":"https://lh3.googleusercontent.com/Z4bjhJih1r8R7DO_lQpc0PL84oJ7TIuLu0yPaQOPxAI4ZpN7widyuQg8eTqQlY0pmNrObmLo15yWj93q=w544-h544-l90-rj","song":"","folder":""},{"title":"Tollywood Hitlist","artist":"Anirudh Ravichander, Devi Sri Prasad","image":"https://lh3.googleusercontent.com/Xv22St5IaW2oIlYhGnt0c8dy4DXFauRzeBjhwHuypk-txwTlZI5cSGeeg9Qf9F0B2ByS6j8fbzg4Kg=w544-h544-l90-rj","song":"","folder":""},{"title":"Sandalwood Love Hitlist","artist":"G.V. Prakash Kumar, Yuvan Shankar Raja","image":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhF6104R0d57iHS2VXN4JVvTUy_52QbS4_ag&s","song":"","folder":"Sandalwood Hits"},{"title":"Mollywood Romance Hitlist","artist":"Sai Pallavi, Leon James, Nakash Aziz","image":"https://lh3.googleusercontent.com/VoJ3ZRSyOYVcvD6Zg0s_3ygZi9ze61rLa4dkl44ywIq6dIbHldGH4vw19_Xh9a8CnRzF8xIGLXP6P5U=w544-h544-l90-rj","song":"","folder":""},{"title":"Kollywood Hitlist","artist":"Anirudh Ravichander, G.V. Prakash Kumar","image":"https://lh3.googleusercontent.com/lGWtJLqWMZKfI2vLqeul_57nj07n_sa5vHYuvEtfmJNjyknzCHFPWilr3at97lFdERGN7a7Cx7eXoS4=w544-h544-l90-rj","song":"","folder":""},{"title":"Tollywood Dance Hitlist","artist":"Artist Names...","image":"https://lh3.googleusercontent.com/m0IDKWZXoaLg5PuIoT3TCFc1gLN7yy-_Qmy3BCtsuV2mHQo_jIEiXx1zGehgMoCg-5maW2HICwaCHSo=w544-h544-l90-rj","song":"","folder":""},{"title":"Bollywood Hitlist","artist":"Artist Names...","image":"https://lh3.googleusercontent.com/c1sN6qbYiV_FgE9_RtVOtJyg2-qGvxFbudgU_Z3zzICbH07niwdH4Eo2vJz7ALkPrbNaYHMyp-Gx03k=w544-h544-l90-rj","song":"","folder":""}]}];

    function renderMusicCards() {
        const sections = $$(".SongsType");
        sections.forEach((section) => {
            const heading = $(".SongsType h2", section);
            const category = heading?.textContent.trim() || "";
            const container = $(".cardcontainer", section);
            if (!container) return;

            const group = MUSIC_LIBRARY.find((entry) => entry.category === category);
            if (!group) return;

            const fragment = document.createDocumentFragment();

            group.items.forEach((track) => {
                const card = document.createElement("article");
                card.className = "card";
                if (track.song) card.dataset.song = track.song;
                if (track.folder) card.dataset.folder = track.folder;
                card.tabIndex = 0;
                card.setAttribute("role", "button");
                card.setAttribute("aria-label", `${track.song ? "Play" : "Explore"} ${track.title}`);

                const play = document.createElement("div");
                play.className = "play";
                play.setAttribute("aria-hidden", "true");
                const playIcon = document.createElement("img");
                playIcon.src = "playbutton.svg";
                playIcon.alt = "";
                play.appendChild(playIcon);

                const cover = document.createElement("img");
                cover.src = track.image || "music.svg";
                cover.alt = `${track.title} cover`;
                cover.loading = "lazy";
                cover.decoding = "async";
                cover.onerror = () => {
                    cover.onerror = null;
                    cover.src = "music.svg";
                };

                const title = document.createElement("h3");
                title.className = "title";
                title.textContent = track.title;

                const subtitle = document.createElement("p");
                subtitle.className = "subtitle";
                subtitle.textContent = track.artist || (track.folder ? "Playlist" : "SRH Music Player");

                card.append(play, cover, title, subtitle);
                fragment.appendChild(card);
            });

            container.replaceChildren(fragment);
        });
    }

    renderMusicCards();

    /* Personal library: favorites, recently played, shuffle and repeat. */
    const FAVORITES_KEY = "srhMusic.favorites.v1";
    const RECENTS_KEY = "srhMusic.recents.v1";
    let favorites = new Set();
    let recentTracks = [];
    let shuffleEnabled = false;
    let repeatMode = "off"; // off | all | one
    try { favorites = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")); } catch {}
    try { recentTracks = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]").slice(0, 20); } catch {}

    // Idempotent toolbar creation: prevent duplicate controls if this script is
    // accidentally included or executed more than once during deployment.
    // Keep exactly one library toolbar, even if a stale/older page left duplicates.
    const libraryToolbar = songSections?.querySelector(":scope > .library-toolbar") || document.createElement("div");
    const isNewLibraryToolbar = !libraryToolbar.isConnected;
    $$(".library-toolbar").forEach((toolbar) => { if (toolbar !== libraryToolbar) toolbar.remove(); });
    libraryToolbar.className = "library-toolbar";
    libraryToolbar.innerHTML = `
        <div class="library-filters" role="group" aria-label="Filter music library">
            <button type="button" class="library-filter active" data-library-filter="all">All music</button>
            <button type="button" class="library-filter" data-library-filter="favorites"><i class="fa-solid fa-heart"></i> Favorites <span id="favoriteCount">0</span></button>
            <button type="button" class="library-filter" data-library-filter="recent"><i class="fa-solid fa-clock-rotate-left"></i> Recently played</button>
        </div>
        <div class="playback-options">
            <button type="button" id="shuffleToggle" class="player-option" aria-pressed="false" title="Shuffle playback (S)"><i class="fa-solid fa-shuffle"></i> Shuffle</button>
            <button type="button" id="repeatToggle" class="player-option" aria-pressed="false" title="Repeat mode (R)"><i class="fa-solid fa-repeat"></i> Repeat: Off</button>
        </div>`;
    if (isNewLibraryToolbar) {
        const heroForToolbar = songSections?.querySelector(".hero");
        if (heroForToolbar) heroForToolbar.insertAdjacentElement("afterend", libraryToolbar);
        else songSections?.prepend(libraryToolbar);
    }

    function persistLibraryPrefs() {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
            localStorage.setItem(RECENTS_KEY, JSON.stringify(recentTracks.slice(0, 20)));
        } catch { showToast("Your browser storage is full; some library preferences may not be saved.", "error"); }
    }
    function updateFavoriteButtons() {
        $$(".card[data-song]").forEach(card => {
            let button = $(".favorite-toggle", card);
            if (!button) {
                button = document.createElement("button");
                button.type = "button";
                button.className = "favorite-toggle";
                button.setAttribute("aria-label", "Add to favorites");
                button.title = "Add to favorites";
                button.innerHTML = '<i class="fa-regular fa-heart"></i>';
                card.appendChild(button);
            }
            const active = favorites.has(card.dataset.song);
            button.classList.toggle("is-favorite", active);
            button.setAttribute("aria-pressed", String(active));
            button.setAttribute("aria-label", active ? "Remove from favorites" : "Add to favorites");
            button.title = active ? "Remove from favorites" : "Add to favorites";
            button.innerHTML = active ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
        });
        const count = $("#favoriteCount");
        if (count) count.textContent = String(favorites.size);
    }
    function applyLibraryFilter(filter) {
        libraryToolbar.querySelectorAll("[data-library-filter]").forEach(button => button.classList.toggle("active", button.dataset.libraryFilter === filter));
        $$(".card[data-song]").forEach(card => {
            const filename = card.dataset.song;
            const matches = filter === "all" || (filter === "favorites" && favorites.has(filename)) || (filter === "recent" && recentTracks.includes(filename));
            card.classList.toggle("hidden-by-library-filter", !matches);
            const section = card.closest(".SongsType");
            if (section) {
                const cards = $$(".card[data-song]", section);
                section.hidden = filter !== "all" && cards.length > 0 && cards.every(item => item.classList.contains("hidden-by-library-filter"));
            }
        });
        if (filter === "favorites" && favorites.size === 0) showToast("Tap the heart on any song to build your favorites.");
        if (filter === "recent" && recentTracks.length === 0) showToast("Your recently played songs will appear here.");
    }
    updateFavoriteButtons();
    libraryToolbar.addEventListener("click", event => {
        const filterButton = event.target.closest("[data-library-filter]");
        if (filterButton) { applyLibraryFilter(filterButton.dataset.libraryFilter); return; }
        if (event.target.closest("#shuffleToggle")) {
            shuffleEnabled = !shuffleEnabled;
            const button = $("#shuffleToggle");
            button.classList.toggle("active", shuffleEnabled);
            button.setAttribute("aria-pressed", String(shuffleEnabled));
            showToast(shuffleEnabled ? "Shuffle is on." : "Shuffle is off.");
        }
        if (event.target.closest("#repeatToggle")) {
            repeatMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
            const button = $("#repeatToggle");
            button.classList.toggle("active", repeatMode !== "off");
            button.setAttribute("aria-pressed", String(repeatMode !== "off"));
            button.innerHTML = `<i class="fa-solid fa-repeat"></i> Repeat: ${repeatMode === "one" ? "One" : repeatMode === "all" ? "All" : "Off"}`;
            showToast(`Repeat: ${repeatMode === "one" ? "current song" : repeatMode === "all" ? "playlist" : "off"}.`);
        }
    });

    /* Build the sidebar library from all playable cards in the DOM. */

    /* =====================================================
       PLAY MUSIC STORED ON THE USER'S PHONE / COMPUTER
       The user chooses audio files explicitly. Browsers do
       not allow websites to silently scan a device.
    ===================================================== */
    const localTrackUrls = new Map();
    let localTrackCounter = 0;

    const localSection = document.createElement("section");
    localSection.className = "SongsType local-songs-section";
    localSection.id = "deviceSongsSection";
    localSection.innerHTML = `
        <h2>Your Device Songs</h2>
        <p class="device-songs-hint">Choose audio files from your phone or computer to play them here.</p>
        <div class="device-songs-toolbar">
            <button type="button" class="device-pick-button" id="pickDeviceSongs">
                <i class="fa-solid fa-folder-open"></i>
                <span>Choose songs from device</span>
            </button>
            <span class="device-song-count" id="deviceSongCount">No local songs added</span>
        </div>
        <div class="cardcontainer device-song-cards" id="deviceSongCards"></div>
        <input id="deviceSongInput" type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac,.opus" multiple hidden>
    `;
    songSections?.appendChild(localSection);

    const deviceSongInput = $("#deviceSongInput", localSection);
    const deviceSongCards = $("#deviceSongCards", localSection);
    const deviceSongCount = $("#deviceSongCount", localSection);

    function addLocalSidebarItem(track) {
        if (!songList) return;
        const li = document.createElement("li");
        li.dataset.song = track.filename;
        li.dataset.localSong = "true";
        const card = document.createElement("div");
        card.className = "music-card";
        const cover = document.createElement("div");
        cover.className = "cover";
        const img = document.createElement("img");
        img.src = track.cover;
        img.alt = "";
        const playIcon = document.createElement("div");
        playIcon.className = "play-icon";
        playIcon.setAttribute("aria-hidden", "true");
        playIcon.innerHTML = '<i class="fa-solid fa-play"></i>';
        cover.append(img, playIcon);
        const info = document.createElement("div");
        info.className = "info";
        const title = document.createElement("div");
        title.className = "title";
        title.textContent = track.title;
        const subtitle = document.createElement("div");
        subtitle.className = "subtitle";
        subtitle.textContent = "From your device";
        info.append(title, subtitle);
        card.append(cover, info);
        li.appendChild(card);
        songList.appendChild(li);
    }

    function addDeviceSongs(files) {
        const supported = [...files].filter((file) =>
            file.type.startsWith("audio/") || /\.(mp3|m4a|aac|wav|ogg|flac|opus|weba)$/i.test(file.name)
        );
        if (!supported.length) {
            showToast("Choose audio files such as MP3, M4A, WAV or OGG.", "error");
            return;
        }

        supported.forEach((file) => {
            const filename = `device-local-${++localTrackCounter}`;
            const objectUrl = URL.createObjectURL(file);
            const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
            const track = {
                filename,
                title: title || file.name,
                artist: "From your device",
                cover: "music.svg",
                sourceUrl: objectUrl,
                localFile: true,
                sourceCard: null
            };
            playlist.push(track);
            localTrackUrls.set(filename, objectUrl);

            const card = document.createElement("article");
            card.className = "card";
            card.dataset.song = filename;
            card.dataset.localSong = "true";
            card.tabIndex = 0;
            card.setAttribute("role", "button");
            card.setAttribute("aria-label", `Play ${track.title}`);

            const play = document.createElement("div");
            play.className = "play";
            play.setAttribute("aria-hidden", "true");
            const playIcon = document.createElement("img");
            playIcon.src = "playbutton.svg";
            playIcon.alt = "";
            play.appendChild(playIcon);

            const cover = document.createElement("img");
            cover.src = "music.svg";
            cover.alt = "Local audio cover";
            cover.loading = "lazy";

            const titleNode = document.createElement("h3");
            titleNode.className = "title";
            titleNode.textContent = track.title;
            const subtitle = document.createElement("p");
            subtitle.className = "subtitle";
            subtitle.textContent = `${file.type || "Audio file"} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;

            card.append(play, cover, titleNode, subtitle);
            deviceSongCards?.appendChild(card);
            updateFavoriteButtons();
            addLocalSidebarItem(track);
        });

        if (deviceSongCount) {
            const count = localTrackUrls.size;
            deviceSongCount.textContent = `${count} local song${count === 1 ? "" : "s"} ready`;
        }
        showToast(`Added ${supported.length} song${supported.length === 1 ? "" : "s"} from your device.`);
    }

    $("#pickDeviceSongs")?.addEventListener("click", () => deviceSongInput?.click());
    deviceSongInput?.addEventListener("change", () => {
        if (deviceSongInput.files?.length) addDeviceSongs(deviceSongInput.files);
        deviceSongInput.value = "";
    });

    const cardElements = $$(".card[data-song]");
    const seenTracks = new Set();

    cardElements.forEach((card) => {
        const filename = card.dataset.song;
        if (!filename || seenTracks.has(filename)) return;
        seenTracks.add(filename);

        const title = $(".title", card)?.textContent?.trim() || cleanSongName(filename);
        const artist = $(".subtitle", card)?.textContent?.trim() || "SRH Music Player";
        const cover = $("img:not(.play img)", card)?.getAttribute("src") || "music.svg";

        playlist.push({ filename, title, artist, cover, sourceCard: card });

        if (songList) {
            const li = document.createElement("li");
            li.dataset.song = filename;
            li.innerHTML = `
                <div class="music-card">
                    <div class="cover">
                        <img src="${escapeHTML(cover)}" alt="" loading="lazy">
                        <div class="play-icon" aria-hidden="true"><i class="fa-solid fa-play"></i></div>
                    </div>
                    <div class="info">
                        <div class="title" title="${escapeHTML(title)}">${escapeHTML(title)}</div>
                        <div class="subtitle" title="${escapeHTML(artist)}">${escapeHTML(artist)}</div>
                    </div>
                </div>`;
            songList.appendChild(li);
        }
    });

    function markCurrentTrack(filename) {
        $$(".card[data-song]").forEach((card) => {
            const active = card.dataset.song === filename;
            card.classList.toggle("is-playing", active);
            if (active) card.setAttribute("aria-current", "true");
            else card.removeAttribute("aria-current");
        });

        $$(".songlist li").forEach((item) => {
            item.classList.toggle("active", item.dataset.song === filename);
        });
    }

    function updatePlayButton(playing) {
        if (!playButton) return;
        playButton.src = playing ? "pause.svg" : "play.svg";
        playButton.alt = playing ? "Pause" : "Play";
        playButton.setAttribute("aria-label", playing ? "Pause playback" : "Start playback");
        playButton.title = playing ? "Pause" : "Play";
        playbar?.classList.toggle("is-playing", playing);
    }

    function setVolumeIcon() {
        if (!volumeIcon) return;
        volumeIcon.src = audio.muted || audio.volume === 0 ? "mute.svg" : "volume.svg";
        volumeIcon.alt = audio.muted || audio.volume === 0 ? "Unmute" : "Mute";
        volumeIcon.setAttribute("aria-label", volumeIcon.alt);
    }

    function trackUrl(filename) {
        // Keep filenames with spaces and punctuation safe in URLs.
        const encoded = filename.split("/").map((part) => encodeURIComponent(part)).join("/");
        return new URL(`songs/${encoded}`, document.baseURI).href;
    }

    async function playTrack(filename, autoplay = true) {
        const track = playlist.find((item) => item.filename === filename);
        if (!track) {
            showToast("This item does not have an audio file attached yet.");
            return;
        }

        const sourceUrl = track.sourceUrl || trackUrl(filename);
        if (audio.src && audio.src === sourceUrl && !audio.paused) {
            audio.pause();
            return;
        }

        currentIndex = playlist.findIndex((item) => item.filename === filename);
        recentTracks = [filename, ...recentTracks.filter(item => item !== filename)].slice(0, 20);
        persistLibraryPrefs();
        audio.src = sourceUrl;
        audio.load();

        if (songInfo) songInfo.textContent = track.title || cleanSongName(filename);
        if (songTime) songTime.textContent = "00:00 / 00:00";
        if (seekbar) seekbar.value = "0";

        if (playbar) {
            playbar.classList.remove("hidden");
            playbar.setAttribute("aria-label", `Player controls for ${track.title}`);
        }
        markCurrentTrack(filename);
        closeSidebar();

        try {
            if (autoplay) {
                await audio.play();
            } else {
                updatePlayButton(false);
            }
        } catch (error) {
            updatePlayButton(false);
            showToast(track.localFile
                ? "This local file could not be played by your browser."
                : "Couldn't play this track. Check that its MP3 file exists in the songs folder.", "error");
        }
    }

    /* One delegated click handler supports cards added later through the DOM. */
    songSections?.addEventListener("click", (event) => {
        const favoriteButton = event.target.closest(".favorite-toggle");
        if (favoriteButton) {
            event.preventDefault(); event.stopPropagation();
            const card = favoriteButton.closest(".card[data-song]");
            if (!card) return;
            if (favorites.has(card.dataset.song)) favorites.delete(card.dataset.song);
            else favorites.add(card.dataset.song);
            persistLibraryPrefs(); updateFavoriteButtons();
            showToast(favorites.has(card.dataset.song) ? "Added to favorites." : "Removed from favorites.");
            return;
        }
        const card = event.target.closest(".card[data-song]");
        if (!card) return;
        playTrack(card.dataset.song);
    });

    songList?.addEventListener("click", (event) => {
        const item = event.target.closest("li[data-song]");
        if (item) playTrack(item.dataset.song);
    });

    playButton?.addEventListener("click", async () => {
        if (!audio.src) {
            if (playlist[0]) playTrack(playlist[0].filename);
            else showToast("No playable songs were found.");
            return;
        }

        if (audio.paused) {
            try { await audio.play(); }
            catch { showToast("Playback failed. Check that the MP3 file exists in the songs folder.", "error"); }
        } else {
            audio.pause();
        }
    });

    function playRelativeTrack(direction) {
        if (!playlist.length) {
            showToast("No playable songs were found.");
            return;
        }
        if (direction > 0 && repeatMode === "one") { audio.currentTime = 0; audio.play().catch(() => {}); return; }
        let nextIndex;
        if (shuffleEnabled && playlist.length > 1) {
            do { nextIndex = Math.floor(Math.random() * playlist.length); } while (nextIndex === currentIndex);
        } else {
            nextIndex = currentIndex < 0 ? 0 : currentIndex + direction;
            if (nextIndex >= playlist.length) {
                if (repeatMode !== "all") { audio.pause(); audio.currentTime = 0; updatePlayButton(false); return; }
                nextIndex = 0;
            }
            if (nextIndex < 0) nextIndex = repeatMode === "all" ? playlist.length - 1 : 0;
        }
        playTrack(playlist[nextIndex].filename);
    }

    previousButton?.addEventListener("click", () => {
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }
        playRelativeTrack(-1);
    });
    nextButton?.addEventListener("click", () => playRelativeTrack(1));

    audio.addEventListener("play", () => updatePlayButton(true));
    audio.addEventListener("pause", () => updatePlayButton(false));
    audio.addEventListener("playing", () => {
        playbar?.classList.remove("hidden");
        updatePlayButton(true);
    });
    audio.addEventListener("timeupdate", () => {
        if (!isSeeking && seekbar && Number.isFinite(audio.duration) && audio.duration > 0) {
            seekbar.value = String((audio.currentTime / audio.duration) * 100);
        }
        if (songTime) songTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    });
    audio.addEventListener("loadedmetadata", () => {
        if (songTime) songTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    });
    audio.addEventListener("ended", () => playRelativeTrack(1));
    audio.addEventListener("error", () => {
        if (audio.src) {
            updatePlayButton(false);
            showToast("Audio file unavailable. For local tracks, choose the file again from your device.", "error");
        }
    });

    seekbar?.addEventListener("input", () => {
        isSeeking = true;
        if (songTime && Number.isFinite(audio.duration)) {
            songTime.textContent = `${formatTime((Number(seekbar.value) / 100) * audio.duration)} / ${formatTime(audio.duration)}`;
        }
    });
    seekbar?.addEventListener("change", () => {
        if (Number.isFinite(audio.duration)) {
            audio.currentTime = (Number(seekbar.value) / 100) * audio.duration;
        }
        isSeeking = false;
    });
    seekbar?.addEventListener("pointerdown", () => { isSeeking = true; });
    seekbar?.addEventListener("pointerup", () => { isSeeking = false; });

    volumeSlider?.addEventListener("input", (event) => {
        audio.volume = Number(event.target.value) / 100;
        audio.muted = audio.volume === 0;
        if (audio.volume > 0) lastVolume = audio.volume;
        setVolumeIcon();
    });
    volumeIcon?.addEventListener("click", () => {
        if (audio.muted || audio.volume === 0) {
            audio.muted = false;
            audio.volume = lastVolume || 0.5;
            if (volumeSlider) volumeSlider.value = String(audio.volume * 100);
        } else {
            lastVolume = audio.volume;
            audio.muted = true;
            if (volumeSlider) volumeSlider.value = "0";
        }
        setVolumeIcon();
    });

    /* Search filters song cards and sidebar rows as the user types. */
    const searchInput = $("#musicSearch");
    searchInput?.addEventListener("input", () => {
        const query = searchInput.value.trim().toLocaleLowerCase();
        let visible = 0;

        $$(".cardcontainer").forEach((container) => {
            let containerVisible = 0;
            $$(".card", container).forEach((card) => {
                const text = `${card.textContent} ${card.dataset.song || ""}`.toLocaleLowerCase();
                const matches = !query || text.includes(query);
                card.classList.toggle("hidden-by-search", !matches);
                if (matches) {
                    visible++;
                    containerVisible++;
                }
            });
            const section = container.closest(".SongsType");
            if (section) section.hidden = Boolean(query) && containerVisible === 0;
        });

        $$(".songlist li").forEach((item) => {
            const matches = !query || item.textContent.toLocaleLowerCase().includes(query) ||
                (item.dataset.song || "").toLocaleLowerCase().includes(query);
            item.hidden = !matches;
        });

        let emptyState = $("#searchEmptyState");
        if (query && visible === 0) {
            if (!emptyState) {
                emptyState = document.createElement("div");
                emptyState.id = "searchEmptyState";
                emptyState.className = "no-results";
                emptyState.textContent = "No songs found. Try another title or artist.";
                songSections?.appendChild(emptyState);
            }
        } else {
            emptyState?.remove();
        }
    });

    /* Keyboard shortcuts: Space play/pause, arrows skip/seek, M mute, S shuffle, R repeat. */
    document.addEventListener("keydown", event => {
        // Video mode owns its own shortcuts; do not trigger music playback there.
        if (document.getElementById("videoApp") && !document.getElementById("videoApp").hidden) return;
        const target = event.target;
        if (target && (target.matches("input, textarea, select") || target.isContentEditable)) return;
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.code === "Space") { event.preventDefault(); playButton?.click(); }
        else if (event.key === "ArrowRight" && audio.src) { audio.currentTime = Math.min((audio.duration || audio.currentTime) , audio.currentTime + 5); }
        else if (event.key === "ArrowLeft" && audio.src) { audio.currentTime = Math.max(0, audio.currentTime - 5); }
        else if (event.key.toLowerCase() === "m") volumeIcon?.click();
        else if (event.key.toLowerCase() === "s") $("#shuffleToggle")?.click();
        else if (event.key.toLowerCase() === "r") $("#repeatToggle")?.click();
    });

    /* Prevent non-functional navigation/demo controls from jumping to unrelated pages. */
    $$(".buttons .otherbtns").forEach((button) => {
        button.addEventListener("click", () => {
            const label = button.textContent.trim();
            showToast(`${label} is a demo control in this music player.`);
        });
    });
    const installLink = $('#install-app')?.closest("a");
    installLink?.addEventListener("click", (event) => {
        event.preventDefault();
        showToast("Install support can be added when the app manifest is configured.");
    });
    /* =====================================================
       LOCAL DEMO ACCOUNTS
       Accounts and persistent login state stay in this
       browser profile. Passwords are salted PBKDF2 hashes,
       not plaintext. This is NOT production authentication.
    ===================================================== */
    const authOverlay = $("#authOverlay");
    const authForm = $("#authForm");
    const authTitle = $("#authTitle");
    const authIntro = $("#authIntro");
    const authNameWrap = $("#authNameWrap");
    const authName = $("#authName");
    const authEmail = $("#authEmail");
    const authPassword = $("#authPassword");
    const authSubmit = $("#authSubmit");
    const authMessage = $("#authMessage");
    const authOptions = $("#authOptions");
    const authSwitchText = $("#authSwitchText");
    const authSwitch = $("#authSwitch");
    const loginButton = $("#loginBtn");
    const signupButton = $("#signupBtn");
    const rememberMe = $("#rememberMe");
    if (rememberMe) { rememberMe.checked = true; rememberMe.disabled = true; }

    const ACCOUNT_STORAGE_KEY = "srhMusic.localAccounts.v1";
    const SESSION_STORAGE_KEY = "srhMusic.currentUser.v1";
    let authMode = "login";
    let previousFocus = null;
    let currentUser = null;

    function readAccounts() {
        try {
            const parsed = JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY) || "{}");
            return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
        } catch {
            return {};
        }
    }

    function normalizedEmail(value) {
        return String(value || "").trim().toLowerCase();
    }

    function showAuthMessage(message, isError = false) {
        if (!authMessage) return;
        authMessage.textContent = message;
        authMessage.classList.toggle("error", isError);
    }

    function bytesToBase64(bytes) {
        let binary = "";
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        return btoa(binary);
    }

    function base64ToBytes(value) {
        const binary = atob(value);
        return Uint8Array.from(binary, (character) => character.charCodeAt(0));
    }

    function createSalt() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return bytes;
    }

    async function hashPassword(password, saltBytes) {
        if (!window.crypto?.subtle) {
            throw new Error("Secure password hashing needs HTTPS or localhost. Open the project with VS Code Live Server.");
        }
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            "PBKDF2",
            false,
            ["deriveBits"]
        );
        const bits = await crypto.subtle.deriveBits(
            { name: "PBKDF2", salt: saltBytes, iterations: 210000, hash: "SHA-256" },
            key,
            256
        );
        return new Uint8Array(bits);
    }

    function constantTimeEqual(a, b) {
        if (a.length !== b.length) return false;
        let difference = 0;
        for (let index = 0; index < a.length; index++) difference |= a[index] ^ b[index];
        return difference === 0;
    }

    function getPersistedUser() {
        try {
            const email = normalizedEmail(localStorage.getItem(SESSION_STORAGE_KEY));
            if (!email) return null;
            const account = readAccounts()[email];
            return account ? { email, name: account.name || email.split("@")[0] } : null;
        } catch {
            return null;
        }
    }

    function updateAccountUI() {
        if (loginButton) {
            loginButton.innerHTML = currentUser
                ? `<span>Log out</span>`
                : `<span>Log in</span>`;
            loginButton.setAttribute("aria-label", currentUser ? `Log out ${currentUser.name}` : "Log in");
            loginButton.title = currentUser ? `Signed in as ${currentUser.name}. Click to log out.` : "Log in";
        }
        if (signupButton) signupButton.hidden = Boolean(currentUser);
    }

    function setSignedInUser(email) {
        const account = readAccounts()[email];
        if (!account) return false;
        currentUser = { email, name: account.name || email.split("@")[0] };
        try {
            // Explicit "remember me" is the default: this survives browser restarts.
            localStorage.setItem(SESSION_STORAGE_KEY, email);
        } catch {
            showToast("Browser storage is blocked. Your login may not persist.", "error");
        }
        updateAccountUI();
        return true;
    }

    function setAuthMode(mode) {
        authMode = mode === "signup" ? "signup" : "login";
        $$(".auth-tab").forEach((tab) => {
            const active = tab.dataset.authMode === authMode;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
        });

        const signingUp = authMode === "signup";
        if (authTitle) authTitle.textContent = signingUp ? "Create your account" : "Log in to SRH Music";
        if (authIntro) authIntro.textContent = signingUp
            ? "Create a local account and keep your music space on this device."
            : "Sign in to your SRH Music account on this device.";
        if (authNameWrap) authNameWrap.hidden = !signingUp;
        if (authName) authName.required = signingUp;
        if (authPassword) {
            authPassword.autocomplete = signingUp ? "new-password" : "current-password";
            authPassword.placeholder = signingUp ? "Create a password (6+ characters)" : "Enter your password";
        }
        if (authOptions) authOptions.hidden = signingUp;
        if (authSubmit) authSubmit.innerHTML = signingUp
            ? 'Create account <i class="fa-solid fa-arrow-right"></i>'
            : 'Log in <i class="fa-solid fa-arrow-right"></i>';
        if (authSwitchText) authSwitchText.textContent = signingUp ? "Already have an account?" : "New to SRH Music?";
        if (authSwitch) authSwitch.textContent = signingUp ? "Log in" : "Create an account";
        showAuthMessage("");
    }

    function openAuth(mode = "login") {
        if (!authOverlay) {
            showToast("The sign-in panel is unavailable.");
            return;
        }
        previousFocus = document.activeElement;
        setAuthMode(mode);
        authOverlay.hidden = false;
        body.classList.add("auth-open");
        window.setTimeout(() => (authEmail || $(".auth-close"))?.focus(), 30);
    }

    function closeAuth() {
        if (!authOverlay || authOverlay.hidden) return;
        authOverlay.hidden = true;
        body.classList.remove("auth-open");
        if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
    }

    loginButton?.addEventListener("click", () => {
        if (currentUser) {
            const name = currentUser.name;
            currentUser = null;
            try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch {}
            updateAccountUI();
            showToast(`Logged out. See you next time, ${name}!`);
        } else {
            openAuth("login");
        }
    });
    signupButton?.addEventListener("click", () => openAuth("signup"));
    $$(".auth-tab").forEach((tab) => tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode)));
    authSwitch?.addEventListener("click", () => setAuthMode(authMode === "login" ? "signup" : "login"));
    $("#authClose")?.addEventListener("click", closeAuth);

    authOverlay?.addEventListener("click", (event) => {
        if (event.target === authOverlay) closeAuth();
    });

    $("#passwordToggle")?.addEventListener("click", (event) => {
        if (!authPassword) return;
        const reveal = authPassword.type === "password";
        authPassword.type = reveal ? "text" : "password";
        event.currentTarget.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
        event.currentTarget.innerHTML = reveal
            ? '<i class="fa-regular fa-eye-slash"></i>'
            : '<i class="fa-regular fa-eye"></i>';
    });

    $("#forgotPassword")?.addEventListener("click", () => {
        showAuthMessage("This local-only demo cannot email a password reset. If you forget the password, delete this browser's local demo account data and sign up again.", true);
    });

    authForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!authForm.reportValidity()) return;

        const email = normalizedEmail(authEmail?.value);
        const password = authPassword?.value || "";
        const name = String(authName?.value || "").trim();

        if (password.length < 6) {
            showAuthMessage("Use a password with at least 6 characters.", true);
            return;
        }

        if (authSubmit) {
            authSubmit.disabled = true;
            authSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait...';
        }

        try {
            const accounts = readAccounts();

            if (authMode === "signup") {
                if (!name) {
                    showAuthMessage("Please enter your name.", true);
                    return;
                }
                if (accounts[email]) {
                    showAuthMessage("An account with this email already exists on this device. Please log in.", true);
                    return;
                }

                const salt = createSalt();
                const hash = await hashPassword(password, salt);
                accounts[email] = {
                    name,
                    salt: bytesToBase64(salt),
                    passwordHash: bytesToBase64(hash),
                    createdAt: new Date().toISOString()
                };

                localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
                setSignedInUser(email);
                closeAuth();
                authForm.reset();
                showToast(`Welcome to SRH Music, ${name}! Your local account is ready.`);
                return;
            }

            const account = accounts[email];
            if (!account) {
                showAuthMessage("No local account found for this email. Sign up on this device first.", true);
                return;
            }

            const salt = base64ToBytes(account.salt);
            const expectedHash = base64ToBytes(account.passwordHash);
            const suppliedHash = await hashPassword(password, salt);

            if (!constantTimeEqual(expectedHash, suppliedHash)) {
                showAuthMessage("Incorrect email or password.", true);
                return;
            }

            setSignedInUser(email);
            closeAuth();
            authForm.reset();
            showToast(`Welcome back, ${currentUser.name}!`);
        } catch (error) {
            console.error("Local account operation failed:", error);
            showAuthMessage(error?.message || "Could not save this account in browser storage.", true);
        } finally {
            if (authSubmit) {
                authSubmit.disabled = false;
                authSubmit.innerHTML = authMode === "signup"
                    ? 'Create account <i class="fa-solid fa-arrow-right"></i>'
                    : 'Log in <i class="fa-solid fa-arrow-right"></i>';
            }
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeAuth();
    });

    // Restore the saved login after refresh or browser restart.
    currentUser = getPersistedUser();
    updateAccountUI();

    /* Footer actions and current year. */
    $$(".footerYear").forEach((yearNode) => { yearNode.textContent = String(new Date().getFullYear()); });

    $$("[data-footer-action]").forEach((button) => {
        button.addEventListener("click", () => {
            const action = button.dataset.footerAction;
            if (action === "about") {
                showToast("SRH Music Player is a personal music player project built with HTML, CSS and JavaScript.");
            } else if (action === "contact") {
                showToast("Visit the GitHub profile link to connect with the developer.");
            }
        });
    });

    /* Accessible keyboard activation uses event delegation for DOM-rendered cards. */
    songSections?.addEventListener("keydown", (event) => {
        const card = event.target.closest(".card[data-song]");
        if (!card || (event.key !== "Enter" && event.key !== " ")) return;
        if (event.target !== card) return;
        event.preventDefault();
        playTrack(card.dataset.song);
    });

    if (songInfo && !songInfo.textContent.trim()) songInfo.textContent = "Choose a song to start listening";
    if (songTime) songTime.textContent = "00:00 / 00:00";
    if (volumeSlider) volumeSlider.value = String(audio.volume * 100);
    setVolumeIcon();
});
}
