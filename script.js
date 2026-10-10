function loadStorage(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        return fallback;
    }
}

let movies = loadStorage('myMovies', [
    {
        title: "Money Heist",
        type: "series",
        banner: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        episodes: ["Episode 1", "Episode 2", "Episode 3"]
    },
    {
        title: "Standalone Action",
        type: "non-part",
        banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        episodes: []
    }
]);

let watchHistory = loadStorage('watchHistory', []);
let requests = loadStorage('myRequests', []);
let comments = loadStorage('myComments', [
    { user: "Fasihariya", text: "Awesome layout!" }
]);

let hideTimeout;
let currentUser = localStorage.getItem('currentUser') || null;
const videoPlayer = document.getElementById("videoPlayer");
const videoControls = document.getElementById("videoControls");
const seekBar = document.getElementById("seekBar");
const currentTimeEl = document.getElementById("currentTime");
const durationTimeEl = document.getElementById("durationTime");

function switchTab(tabName) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    if(tabName === 'home') {
        document.getElementById('home-view').style.display = 'block';
        renderHome();
    } else if(tabName === 'search') {
        document.getElementById('search-view').style.display = 'block';
        renderSearchGrid(movies);
    } else if(tabName === 'history') {
        document.getElementById('history-view').style.display = 'block';
        renderHistoryGrid();
    } else if(tabName === 'request') {
        document.getElementById('request-view').style.display = 'block';
        renderRequests();
    } else if(tabName === 'discussion') {
        document.getElementById('discussion-view').style.display = 'block';
        renderGlobalComments();
    } else if(tabName === 'login') {
        document.getElementById('login-view').style.display = 'block';
        checkLoginState();
    }
}

function renderHome() {
    const grid = document.getElementById('movieGrid');
    if(!grid) return;
    grid.innerHTML = '';
    if(movies.length > 0) {
        document.getElementById('heroBanner').style.backgroundImage = `url(${movies[0].banner})`;
        document.getElementById('heroTitle').innerText = movies[0].title;
    }
    movies.forEach((movie, index) => {
        grid.innerHTML += `
            <div class="movie-card" onclick="openMovie(${index})">
                <img src="${movie.banner}" alt="${movie.title}">
                <p>${movie.title}</p>
            </div>
        `;
    });
}

function playHeroMovie() {
    if(movies.length > 0) openMovie(0);
}

function openMovie(index) {
    const movie = movies[index];
    if(!movie) return;
    
    if(!watchHistory.some(m => m.title === movie.title)) {
        watchHistory.unshift(movie);
        localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
    }

    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById('detail-view').style.display = 'flex';
    
    videoPlayer.src = movie.videoUrl;
    videoPlayer.play().catch(e => console.log(e));
    
    document.getElementById('nowPlayingTitle').innerText = movie.title;
    setupControlsTimer();

    const drawerContent = document.getElementById('drawerContent');
    if(drawerContent) {
        drawerContent.innerHTML = '';
        if(movie.type === 'series' && movie.episodes && movie.episodes.length > 0) {
            let epHTML = `<h3>Seasons & Episodes</h3><div class="episode-list">`;
            movie.episodes.forEach((ep, i) => {
                epHTML += `<div class="episode-item ${i===0?'active':''}">${ep}</div>`;
            });
            epHTML += `</div>`;
            drawerContent.innerHTML = epHTML;
        } else {
            drawerContent.innerHTML = `<h3>Standalone Movie</h3><p class="no-found">No extra parts or episodes.</p>`;
        }
    }
    renderComments();
}

function closePlayer() {
    if(videoPlayer) videoPlayer.pause();
    switchTab('home');
}

// Update Seekbar & Time during playback
if(videoPlayer) {
    videoPlayer.addEventListener('timeupdate', () => {
        if(!isNaN(videoPlayer.duration)) {
            const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
            if(seekBar) seekBar.value = progress;
            if(currentTimeEl) currentTimeEl.innerText = formatTime(videoPlayer.currentTime);
            if(durationTimeEl) durationTimeEl.innerText = formatTime(videoPlayer.duration);
        }
    });
}

function seekVideo(value) {
    if(videoPlayer && !isNaN(videoPlayer.duration)) {
        const time = (value / 100) * videoPlayer.duration;
        videoPlayer.currentTime = time;
    }
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0':''}${m}:${s < 10 ? '0':''}${s}`;
}

function setupControlsTimer() {
    clearTimeout(hideTimeout);
    if(videoControls) videoControls.classList.remove('hidden');
    hideTimeout = setTimeout(() => {
        if(videoControls) videoControls.classList.add('hidden');
    }, 3000);
}

const playerWrapper = document.getElementById("playerWrapper");
if(playerWrapper) {
    playerWrapper.addEventListener('click', () => {
        setupControlsTimer();
    });
}

function togglePlayPause() {
    if(!videoPlayer) return;
    const playPauseBtn = document.getElementById('playPauseBtn');
    if(videoPlayer.paused) {
        videoPlayer.play();
        if(playPauseBtn) playPauseBtn.innerText = "⏸";
    } else {
        videoPlayer.pause();
        if(playPauseBtn) playPauseBtn.innerText = "▶";
    }
}

function skipTime(value) {
    if(videoPlayer) videoPlayer.currentTime += value;
}

function toggleFullscreen(isFull) {
    const wrapper = document.getElementById('playerWrapper');
    const exitBtn = document.getElementById('exitFullBtn');
    if(isFull) {
        if(wrapper && wrapper.requestFullscreen) wrapper.requestFullscreen();
        if(exitBtn) exitBtn.style.display = 'inline-block';
    } else {
        if(document.exitFullscreen) document.exitFullscreen();
        if(exitBtn) exitBtn.style.display = 'none';
    }
}

function toggleDrawer() {
    const drawer = document.getElementById('episodeDrawer');
    if(drawer) {
        drawer.style.transform = drawer.style.transform === 'translateY(-60%)' ? 'translateY(0)' : 'translateY(-60%)';
    }
}

function renderHistoryGrid() {
    const grid = document.getElementById('historyGrid');
    if(!grid) return;
    grid.innerHTML = '';
    if(watchHistory.length === 0) {
        grid.innerHTML = `<p class="no-found">No watch history.</p>`;
        return;
    }
    watchHistory.forEach((movie) => {
        grid.innerHTML += `
            <div class="movie-card">
                <img src="${movie.banner}" alt="${movie.title}">
                <p>${movie.title}</p>
            </div>
        `;
    });
}

function handleLogin() {
    const emailInput = document.getElementById('loginEmail');
    if(!emailInput) return;
    const email = emailInput.value.trim();
    if(email === "gmnaabid94@gmail.com") {
        currentUser = email;
        localStorage.setItem('currentUser', email);
        alert("Admin Login Successful!");
        checkLoginState();
    } else {
        alert("Invalid Admin Email!");
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    checkLoginState();
}

function checkLoginState() {
    const authContainer = document.getElementById('authContainer');
    const adminDashboard = document.getElementById('adminDashboard');
    if(currentUser === "gmnaabid94@gmail.com") {
        if(authContainer) authContainer.style.display = 'none';
        if(adminDashboard) adminDashboard.style.display = 'block';
        renderAdminMovieList();
    } else {
        if(authContainer) authContainer.style.display = 'block';
        if(adminDashboard) adminDashboard.style.display = 'none';
    }
}

function saveAdminMovie() {
    const title = document.getElementById('upTitle').value.trim();
    const type = document.getElementById('upType').value;
    let banner = document.getElementById('upBanner').value.trim();
    const videoUrl = document.getElementById('upVideoUrl').value.trim();
    const epsInput = document.getElementById('upEpisodes').value.trim();
    const editIndex = document.getElementById('editIndex').value;

    if(!title || !videoUrl) {
        alert("Provide Title and Video URL!");
        return;
    }

    if(!banner) banner = "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800";
    const episodes = type === 'series' ? epsInput.split(',').map(e => e.trim()).filter(e => e) : [];

    if(editIndex === "-1") {
        movies.push({ title, type, banner, videoUrl, episodes });
        alert("Movie Added!");
    } else {
        movies[editIndex] = { title, type, banner, videoUrl, episodes };
        alert("Movie Updated!");
        resetAdminForm();
    }

    localStorage.setItem('myMovies', JSON.stringify(movies));
    renderAdminMovieList();
    renderHome();
    
    document.getElementById('upTitle').value = '';
    document.getElementById('upBanner').value = '';
    document.getElementById('upVideoUrl').value = '';
    document.getElementById('upEpisodes').value = '';
}

function renderAdminMovieList() {
    const list = document.getElementById('adminMovieList');
    if(!list) return;
    list.innerHTML = '';
    movies.forEach((m, idx) => {
        list.innerHTML += `
            <div class="admin-item">
                <span><b>${m.title}</b> (${m.type})</span>
                <div>
                    <button class="btn-secondary" onclick="editMovie(${idx})" style="padding:4px 8px; font-size:11px; background:#2196F3;">Edit</button>
                    <button class="btn-primary" onclick="deleteMovie(${idx})" style="padding:4px 8px; font-size:11px;">Delete</button>
                </div>
            </div>
        `;
    });
}

function editMovie(idx) {
    const m = movies[idx];
    if(!m) return;
    document.getElementById('editIndex').value = idx;
    document.getElementById('upTitle').value = m.title;
    document.getElementById('upType').value = m.type;
    document.getElementById('upBanner').value = m.banner;
    document.getElementById('upVideoUrl').value = m.videoUrl;
    document.getElementById('upEpisodes').value = m.episodes.join(', ');
    const formTitle = document.getElementById('formTitle');
    if(formTitle) formTitle.innerText = "Edit Movie";
}

function deleteMovie(idx) {
    if(confirm("Delete this movie?")) {
        movies.splice(idx, 1);
        localStorage.setItem('myMovies', JSON.stringify(movies));
        renderAdminMovieList();
        renderHome();
    }
}

function resetAdminForm() {
    document.getElementById('editIndex').value = '-1';
    const formTitle = document.getElementById('formTitle');
    if(formTitle) formTitle.innerText = "Upload Movie / Series";
    document.getElementById('upTitle').value = '';
    document.getElementById('upBanner').value = '';
    document.getElementById('upVideoUrl').value = '';
    document.getElementById('upEpisodes').value = '';
}

function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    if(!searchInput) return;
    const query = searchInput.value.toLowerCase();
    const filtered = movies.filter(m => m.title.toLowerCase().includes(query));
    renderSearchGrid(filtered);
}

function renderSearchGrid(list) {
    const grid = document.getElementById('searchResultGrid');
    if(!grid) return;
    grid.innerHTML = '';
    list.forEach((movie) => {
        const originalIndex = movies.indexOf(movie);
        grid.innerHTML += `
            <div class="movie-card" onclick="openMovie(${originalIndex})">
                <img src="${movie.banner}" alt="${movie.title}">
                <p>${movie.title}</p>
            </div>
        `;
    });
}

function submitRequest() {
    const reqInput = document.getElementById('reqTitle');
    if(!reqInput) return;
    const reqTitle = reqInput.value.trim();
    if(reqTitle) {
        requests.push(reqTitle);
        localStorage.setItem('myRequests', JSON.stringify(requests));
        reqInput.value = '';
        renderRequests();
        alert("Request Submitted!");
    }
}

function renderRequests() {
    const list = document.getElementById('requestList');
    if(!list) return;
    list.innerHTML = '<h4>Requests:</h4>';
    requests.forEach(r => {
        list.innerHTML += `<div class="comment-card">🎬 ${r}</div>`;
    });
}

function addComment() {
    const commentInput = document.getElementById('commentInput');
    if(!commentInput) return;
    const text = commentInput.value.trim();
    if(text) {
        comments.push({ user: currentUser ? "Admin" : "Viewer", text });
        localStorage.setItem('myComments', JSON.stringify(comments));
        commentInput.value = '';
        renderComments();
    }
}

function renderComments() {
    const list = document.getElementById('commentList');
    if(!list) return;
    list.innerHTML = '';
    comments.forEach(c => {
        list.innerHTML += `<div class="comment-card"><b>${c.user}:</b> ${c.text}</div>`;
    });
}

function addGlobalComment() {
    const globalInput = document.getElementById('globalCommentInput');
    if(!globalInput) return;
    const text = globalInput.value.trim();
    if(text) {
        comments.push({ user: currentUser ? "Admin" : "Viewer", text });
        localStorage.setItem('myComments', JSON.stringify(comments));
        globalInput.value = '';
        renderGlobalComments();
    }
}

function renderGlobalComments() {
    const list = document.getElementById('globalCommentList');
    if(!list) return;
    list.innerHTML = '';
    comments.forEach(c => {
        list.innerHTML += `<div class="comment-card"><b>${c.user}:</b> ${c.text}</div>`;
    });
}

renderHome();
