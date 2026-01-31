const audio = document.getElementById('audioPlayer');
const playIcon = document.getElementById('playIcon');
const searchInput = document.getElementById('searchInput');
const progressBar = document.getElementById('progressBar');
const currTime = document.getElementById('currTime');
const durTime = document.getElementById('durTime');

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadHome();
    audio.volume = 1.0;
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchMusic(searchInput.value);
});

function loadHome() {
    document.getElementById('contentArea').querySelector('h2').innerText = 'Top Mixes';
    fetchMusic('indonesian top hits'); // Default search
}

async function fetchMusic(query) {
    const container = document.getElementById('recommendations');
    container.innerHTML = '<p class="loading" style="grid-column: 1/-1; text-align:center;">Searching...</p>';
    
    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        container.innerHTML = '';
        
        data.forEach(video => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <div style="position: relative;">
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                    <div class="play-overlay"><i class="fas fa-play"></i></div>
                </div>
                <h4>${video.title}</h4>
                <p>${video.author}</p>
            `;
            // Kirim data lengkap ke player
            card.onclick = () => playMusic(video.url, video.title, video.author, video.thumbnail);
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = '<p class="loading">Gagal memuat. Coba lagi.</p>';
    }
}

function playMusic(url, title, author, img) {
    // 1. Update UI Player
    document.getElementById('current-title').innerText = title;
    document.getElementById('current-artist').innerText = author;
    document.getElementById('current-thumb').src = img;
    
    // 2. Set Status Loading
    playIcon.className = "fas fa-spinner fa-spin"; 
    
    // 3. Set Audio Source
    // Tambahkan timestamp agar browser tidak meng-cache error sebelumnya
    audio.src = `/api/stream?url=${encodeURIComponent(url)}&t=${Date.now()}`;
    
    // 4. Play
    audio.play().catch(e => {
        console.error("Autoplay blocked:", e);
        playIcon.className = "fas fa-play"; // Balik ke play jika gagal
    });
}

// Event Listeners Audio
audio.addEventListener('playing', () => {
    playIcon.className = "fas fa-pause";
});

audio.addEventListener('pause', () => {
    playIcon.className = "fas fa-play";
});

audio.addEventListener('waiting', () => {
    playIcon.className = "fas fa-spinner fa-spin";
});

audio.addEventListener('error', (e) => {
    console.error("Audio Error:", e);
    alert("Gagal memutar lagu. YouTube mungkin memblokir IP server.");
    playIcon.className = "fas fa-exclamation-triangle";
});

// Kontrol Play/Pause
function togglePlay() {
    if(!audio.src) return;
    if (audio.paused) audio.play();
    else audio.pause();
}

// Progress Bar Logic
audio.addEventListener('timeupdate', () => {
    const { duration, currentTime } = audio;
    if(isNaN(duration)) return;
    const progressPercent = (currentTime / duration) * 100;
    progressBar.value = progressPercent;
    currTime.innerText = formatTime(currentTime);
    durTime.innerText = formatTime(duration);
});

progressBar.addEventListener('input', () => {
    const duration = audio.duration;
    if(duration) audio.currentTime = (progressBar.value * duration) / 100;
});

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}
