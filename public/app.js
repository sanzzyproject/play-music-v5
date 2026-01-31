const audio = document.getElementById('audioPlayer');
const playIcon = document.getElementById('playIcon');
const searchInput = document.getElementById('searchInput');
const progressBar = document.getElementById('progressBar');
const currTime = document.getElementById('currTime');
const durTime = document.getElementById('durTime');

// Saat load pertama kali, tampilkan rekomendasi
document.addEventListener('DOMContentLoaded', loadHome);

// Event Listener Search (Enter key)
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchMusic(searchInput.value);
    }
});

function focusSearch() {
    searchInput.focus();
}

function loadHome() {
    document.getElementById('contentArea').querySelector('h2').innerText = 'Made for You';
    fetchMusic(''); // string kosong = trigger rekomendasi di backend
}

// Fetch data dari Backend API Search
async function fetchMusic(query) {
    const container = document.getElementById('recommendations');
    container.innerHTML = '<p class="loading">Searching...</p>';
    
    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        container.innerHTML = '';
        
        data.forEach(video => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <div style="position: relative;">
                    <img src="${video.thumbnail}" alt="${video.title}">
                    <div class="play-overlay"><i class="fas fa-play"></i></div>
                </div>
                <h4>${video.title}</h4>
                <p>${video.author}</p>
            `;
            // Saat kartu diklik, panggil endpoint stream dengan URL video
            card.onclick = () => playMusic(video.url, video.title, video.author, video.thumbnail);
            container.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="loading">Error loading music.</p>';
    }
}

// Play Music logic
function playMusic(url, title, author, img) {
    // Set UI Footer
    document.getElementById('current-title').innerText = title;
    document.getElementById('current-artist').innerText = author;
    document.getElementById('current-thumb').src = img;
    
    playIcon.className = "fas fa-pause";

    // Panggil Endpoint Stream Anda
    // encodeURIComponent penting agar URL youtube tidak rusak saat dikirim sebagai parameter
    audio.src = `/api/stream?url=${encodeURIComponent(url)}`;
    audio.play();
}

// Kontrol Player
function togglePlay() {
    if (audio.paused) {
        audio.play();
        playIcon.className = "fas fa-pause";
    } else {
        audio.pause();
        playIcon.className = "fas fa-play";
    }
}

audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', () => playIcon.className = "fas fa-play");

function updateProgress() {
    const { duration, currentTime } = audio;
    if(isNaN(duration)) return;
    
    const progressPercent = (currentTime / duration) * 100;
    progressBar.value = progressPercent;
    
    // Format Waktu
    currTime.innerText = formatTime(currentTime);
    durTime.innerText = formatTime(duration);
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Set progress bar saat digeser
progressBar.addEventListener('input', () => {
    const duration = audio.duration;
    audio.currentTime = (progressBar.value * duration) / 100;
});

function setVolume(val) {
    audio.volume = val;
}
