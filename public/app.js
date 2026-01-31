const audio = document.getElementById('audioPlayer');
const playIcon = document.getElementById('playIcon');
const searchInput = document.getElementById('searchInput');
const progressBar = document.getElementById('progressBar');
const currTime = document.getElementById('currTime');
const durTime = document.getElementById('durTime');

// Default Content saat web dibuka
document.addEventListener('DOMContentLoaded', () => {
    loadHome();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchMusic(searchInput.value);
});

function loadHome() {
    document.getElementById('contentArea').querySelector('h2').innerText = 'Made For You';
    // Cari lagu random populer Indonesia agar tampilan awal tidak kosong
    fetchMusic('lagu indonesia populer terbaru');
}

async function fetchMusic(query) {
    const container = document.getElementById('recommendations');
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #b3b3b3;">Mencari musik...</div>';
    
    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        container.innerHTML = '';
        
        if(data.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Tidak ditemukan lagu.</div>';
            return;
        }

        data.forEach(video => {
            const card = document.createElement('div');
            card.classList.add('card');
            // Menambahkan error handler pada gambar jika gambar rusak
            card.innerHTML = `
                <div style="position: relative;">
                    <img src="${video.thumbnail}" alt="${video.title}" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="play-overlay"><i class="fas fa-play"></i></div>
                </div>
                <h4>${video.title}</h4>
                <p>${video.author}</p>
            `;
            
            card.onclick = () => playMusic(video.url, video.title, video.author, video.thumbnail);
            container.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Gagal memuat data. Coba refresh.</div>';
    }
}

function playMusic(url, title, author, img) {
    // Update Tampilan Player
    document.getElementById('current-title').innerText = title;
    document.getElementById('current-artist').innerText = author;
    document.getElementById('current-thumb').src = img;
    
    // Tanda Loading
    playIcon.className = "fas fa-spinner fa-spin";
    
    // Trik: Tambahkan random number agar browser tidak mengambil cache error sebelumnya
    const streamUrl = `/api/stream?url=${encodeURIComponent(url)}&r=${Math.random()}`;
    
    audio.src = streamUrl;
    audio.play()
        .then(() => {
            playIcon.className = "fas fa-pause";
        })
        .catch(e => {
            console.error("Playback error:", e);
            playIcon.className = "fas fa-play";
        });
}

// Event Listeners Audio
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', () => playIcon.className = "fas fa-play");
audio.addEventListener('waiting', () => playIcon.className = "fas fa-spinner fa-spin");
audio.addEventListener('playing', () => playIcon.className = "fas fa-pause");
audio.addEventListener('error', () => {
    // Jika error, jangan pakai alert box yang jelek. Ganti status text di player.
    document.getElementById('current-artist').innerText = "Gagal memuat (IP Blocked)";
    document.getElementById('current-artist').style.color = "red";
    playIcon.className = "fas fa-exclamation-triangle";
});

function togglePlay() {
    if (!audio.src) return;
    if (audio.paused) audio.play();
    else audio.pause();
}

function updateProgress() {
    const { duration, currentTime } = audio;
    if(isNaN(duration)) return;
    const progressPercent = (currentTime / duration) * 100;
    progressBar.value = progressPercent;
    currTime.innerText = formatTime(currentTime);
    durTime.innerText = formatTime(duration);
}

// Input progress bar
progressBar.addEventListener('input', () => {
    const duration = audio.duration;
    if(duration) audio.currentTime = (progressBar.value * duration) / 100;
});

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}
