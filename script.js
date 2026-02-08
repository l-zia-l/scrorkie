// Getting Elements
const logo = document.querySelector('.logo-box');
const mainNav = document.querySelector('.main-nav')
const btnStart = document.getElementById('btn-start');
const editorView = document.getElementById('editor-view');
const viewerView = document.getElementById('viewer-view');
const speedBadge = document.getElementById('speed-badge');
const libraryView = document.getElementById('library-view');
const songsGrid = document.getElementById('songs-grid');
const btnSavedNav = document.getElementById('btn-saved');
const searchInput = document.getElementById('search-input');
const btnSupport = document.getElementById('btn-support');
const supportDrawer = document.getElementById('support-drawer');
const drawerOverlay = document.getElementById('drawer-overlay');
const btnCloseDrawer = document.getElementById('btn-close-drawer');
const drawerHandle = document.getElementById('drawer-handle');
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('import-input');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');
let badgeTimeout;

const titleInput = document.getElementById('title-input');
const artistInput = document.getElementById('artist-input');
const lyricsInput = document.getElementById('lyrics-input');

const displayTitle = document.getElementById('song-title-display');
const displayLyrics = document.getElementById('lyrics-display');

const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const btnFaster = document.getElementById('btn-faster');
const btnSlower = document.getElementById('btn-slower');
const btnEdit = document.getElementById('btn-edit');
const btnDelete = document.getElementById('btn-delete');

// State Variables
let isScrolling = false;
let scrollSpeed = 50;
let scrollInterval;
let currentSongId = null;

logo.addEventListener('click', () => {
    currentSongId = null;
    titleInput.value = '';
    artistInput.value = '';
    lyricsInput.value = '';
    showView(editorView);
});

logo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') logo.click();
});

function showView(viewToShow) {
    [editorView, viewerView, libraryView].forEach(view => view.classList.add('hidden'));

    viewToShow.classList.remove('hidden');

    if (viewToShow === libraryView) {
        renderLibrary();
    }
}

// Switch Views
btnStart.addEventListener('click', () => {
    saveSong();
    const title = titleInput.value.trim() || "Untitled Draft";
    const artist = artistInput.value.trim() || "Unknown Artist";

    displayTitle.textContent = `${title} - ${artist}`;
    displayLyrics.textContent = lyricsInput.value;

    showView(viewerView);
});

// Editing Mode
btnEdit.addEventListener('click', () => {
    stopScrolling();
    viewerView.classList.add('hidden');
    editorView.classList.remove('hidden');
    lyricsInput.focus();
});

// Deleting Mode
btnDelete.addEventListener('click', () => {
    if (!currentSongId) {
        alert("This song hasn't been saved yet!");
        return;
    }

    const confirmDelete = confirm("Are you sure? This will permanently remove this song from your book.");

    if (confirmDelete) {
        let savedSongs = JSON.parse(localStorage.getItem('scrorkie_songs')) || [];

        savedSongs = savedSongs.filter(s => s.id !== currentSongId);

        localStorage.setItem('scrorkie_songs', JSON.stringify(savedSongs));

        currentSongId = null;
        showView(libraryView);
    }
});

// Scrolling Logic
function startScrolling() {
    if (isScrolling) return;
    isScrolling = true;

    document.body.classList.add('performing');

    btnPlay.classList.add('hidden');
    btnPause.classList.remove('hidden');
    requestWakeLock();

    scrollInterval = setInterval(() => {
        window.scrollBy(0, 1);

    }, scrollSpeed);
}

function stopScrolling() {
    isScrolling = false;

    document.body.classList.remove('performing');

    btnPlay.classList.remove('hidden');
    btnPause.classList.add('hidden');
    clearInterval(scrollInterval);

    if (wakeLock !== null) {
        wakeLock.release().then(() => {
            wakeLock = null;
            console.log("Wake Lock released!");
        });
    }
}

// Control Buttons
btnPlay.addEventListener('click', () => {
    isScrolling ? stopScrolling() : startScrolling();
});

btnPause.addEventListener('click', stopScrolling);

btnReset.addEventListener('click', () => {
    stopScrolling();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Adjust Speed
btnFaster.addEventListener('click', () => {
    if (scrollSpeed > 5) {
        scrollSpeed -= 5;
        updateSpeedUI();
        if (isScrolling) { stopScrolling(); startScrolling(); }
    }
});

btnSlower.addEventListener('click', () => {
    if (scrollSpeed < 100) {
        scrollSpeed += 5;
        updateSpeedUI();
        if (isScrolling) { stopScrolling(); startScrolling(); }
    }
});

// Speed Badge
function updateSpeedUI() {
    const level = Math.max(1, Math.floor((105 - scrollSpeed) / 5));

    speedBadge.textContent = `Speed: ${level}`;
    speedBadge.classList.remove('hidden');

    setTimeout(() => speedBadge.classList.add('visible'), 10);

    clearTimeout(badgeTimeout);
    badgeTimeout = setTimeout(() => {
        speedBadge.classList.remove('visible');
        setTimeout(() => speedBadge.classList.add('hidden'), 300);
    }, 1500);
}

// Anti-Sleep Mode
let wakeLock = null;

async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
    } catch (err) {
        console.log(`${err.name}, ${err.message}`);
    }
}

// Storage Section
function saveSong() {
    const title = titleInput.value.trim() || "Untitled Draft";
    const artist = artistInput.value.trim() || "Unknown Artist";
    const lyrics = lyricsInput.value;

    if (!lyrics) return;

    let savedSongs = JSON.parse(localStorage.getItem('scrorkie_songs')) || [];

    if (currentSongId) {
        const index = savedSongs.findIndex(s => s.id === currentSongId);
        if (index !== -1) {
            savedSongs[index] = {
                id: currentSongId,
                title: title,
                artist: artist,
                lyrics: lyrics
            };
        }
    } else {
        const newId = Date.now();
        const newSong = {
            id: newId,
            title: title,
            artist: artist,
            lyrics: lyrics
        };
        savedSongs.unshift(newSong);
        currentSongId = newId;
    }

    localStorage.setItem('scrorkie_songs', JSON.stringify(savedSongs));
}

function renderLibrary(filterText = '') {
    songsGrid.innerHTML = '';
    const savedSongs = JSON.parse(localStorage.getItem('scrorkie_songs')) || [];

    const filteredSongs = savedSongs.filter(song => {
        const searchLower = filterText.toLowerCase();
        return song.title.toLowerCase().includes(searchLower) ||
            song.artist.toLowerCase().includes(searchLower);
    });

    if (filteredSongs.length === 0) {
        songsGrid.innerHTML = filterText
            ? '<p class="empty-msg">No matches found...</p>'
            : '<p class="empty-msg">No songs saved yet. Go do that!</p>';
        return;
    }

    filteredSongs.forEach(song => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <h3>${song.title}</h3>
            <p>${song.artist}</p>
        `;

        card.addEventListener('click', () => {
            loadSongIntoViewer(song);
        });

        songsGrid.appendChild(card);
    });
}

function loadSongIntoViewer(song) {
    currentSongId = song.id;

    titleInput.value = song.title;
    artistInput.value = song.artist;
    lyricsInput.value = song.lyrics;

    displayTitle.textContent = `${song.title} - ${song.artist}`;
    displayLyrics.textContent = song.lyrics;
    showView(viewerView);
}

btnSavedNav.addEventListener('click', () => showView(libraryView));

// Export
btnExport.addEventListener('click', () => {
    const data = localStorage.getItem('scrorkie_songs');

    if (!data || data === '[]') {
        alert("Your songbook is empty! Nothing to export yet.");
        return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `scrorkie-backup-${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Import
btnImport.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result);

            if (Array.isArray(importedData)) {
                const confirmImport = confirm("This will replace your current songbook with the imported one. Continue?");
                if (confirmImport) {
                    localStorage.setItem('scrorkie_songs', JSON.stringify(importedData));
                    renderLibrary();
                    alert("Songbook restored successfully!");
                }
            } else {
                throw new Error("Invalid format");
            }
        } catch (err) {
            alert("Oops! That file doesn't look like a valid Scrorkie backup.");
            console.error(err);
        }
        importInput.value = '';
    };
    reader.readAsText(file);
});

// Support Me Banner 
btnSupport.addEventListener('click', () => {
    supportDrawer.classList.remove('hidden');
    setTimeout(() => supportDrawer.classList.add('active'), 10);
});

function closeDrawer() {
    supportDrawer.classList.remove('active');
    setTimeout(() => supportDrawer.classList.add('hidden'), 300);
}

btnCloseDrawer.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

drawerHandle.addEventListener('click', closeDrawer);
let touchStart = 0;
drawerHandle.addEventListener('touchstart', (e) => {
    touchStart = e.touches[0].clientY;
});

drawerHandle.addEventListener('touchend', (e) => {
    let touchEnd = e.changedTouches[0].clientY;
    if (touchEnd > touchStart + 20) {
        closeDrawer();
    }
});

// Keyboard Shortcuts
searchInput.addEventListener('input', (e) => {
    const text = e.target.value;
    renderLibrary(text);
});

window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const isViewing = !viewerView.classList.contains('hidden');

    if (e.code === 'Space') {
        e.preventDefault();
        if (isViewing) {
            if (!isScrolling) {
                btnPlay.click();
            } else {
                btnPause.click();
            }
        }
    }
    else if (e.code === 'ArrowUp') {
        if (isViewing) {
            e.preventDefault();
            btnFaster.click();
        }
    }
    else if (e.code === 'ArrowDown') {
        if (isViewing) {
            e.preventDefault();
            btnSlower.click();
        }
    }
});


// Themes
if (localStorage.getItem('scrorkie_theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    const isDark = document.body.classList.contains('dark-mode');

    if (isDark) {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('scrorkie_theme', 'dark');
    } else {
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('scrorkie_theme', 'light');
    }
});
