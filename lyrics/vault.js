
(function () {
  const listEl = document.getElementById("list");
  const sheet = document.getElementById("sheet");
  const q = document.getElementById("q");
  const count = document.getElementById("count");
  const letters = document.getElementById("letters");
  const mappedHint = document.getElementById("mapped-hint");
  const audio = document.getElementById("audio");
  const nowTitle = document.getElementById("now-title");
  const nowState = document.getElementById("now-state");
  const btnPlay = document.getElementById("btn-play");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const icoPlay = document.getElementById("ico-play");
  const icoPause = document.getElementById("ico-pause");
  const seek = document.getElementById("seek");
  const vol = document.getElementById("vol");
  const full = document.getElementById("full-player");
  const LISTEN = "https://asiancoastline.com/listen.html";

  let songs = [];
  let mapBySlug = {};
  let mapped = [];
  let current = null;
  let playIdx = -1;
  let letterOn = "";
  let seeking = false;

  function vis() {
    const needle = (q.value || "").toLowerCase();
    return songs.filter(function (s) {
      if (letterOn) {
        const ch = (s.title[0] || "").toUpperCase();
        const bucket = /[A-Z]/.test(ch) ? ch : "#";
        if (bucket !== letterOn) return false;
      }
      return !needle || s.title.toLowerCase().indexOf(needle) >= 0;
    });
  }

  function streamFor(song) {
    if (!song) return null;
    const rec = mapBySlug[song.slug];
    return rec && rec.stream_url ? rec : null;
  }

  function show(song) {
    current = song || null;
    if (!song) {
      sheet.innerHTML = "<p class='empty'>Choose a song.</p>";
      return;
    }
    document.querySelectorAll("#list a").forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("href") === "#" + song.slug);
    });
    const h = document.createElement("h2");
    h.textContent = song.title;
    const meta = document.createElement("p");
    meta.className = "sheet-meta";
    const bits = [song.artist || "Excavationpro"];
    if (song.album) bits.push(song.album);
    meta.textContent = bits.join(" · ");
    const pre = document.createElement("pre");
    pre.className = "lyrics";
    pre.textContent = song.lyrics;
    sheet.innerHTML = "";
    sheet.appendChild(h);
    sheet.appendChild(meta);
    sheet.appendChild(pre);
    const st = streamFor(song);
    if (st) {
      nowTitle.textContent = st.stream_title || st.title;
      nowState.textContent = "Mapped catalog stream";
    } else {
      nowState.textContent = "Lyrics only · open full player for the catalog";
    }
    document.title = song.title + " — Lyrics Vault";
  }

  function paintLetters(list) {
    const have = {};
    list.forEach(function (s) {
      const ch = (s.title[0] || "").toUpperCase();
      have[/[A-Z]/.test(ch) ? ch : "#"] = true;
    });
    letters.innerHTML = "";
    ["#"].concat("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")).forEach(function (L) {
      if (!have[L] && L !== letterOn) return;
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = L;
      b.className = letterOn === L ? "on" : "";
      b.addEventListener("click", function () {
        letterOn = letterOn === L ? "" : L;
        paint();
      });
      letters.appendChild(b);
    });
  }

  function paint() {
    const list = vis();
    listEl.innerHTML = "";
    count.textContent = list.length + " songs";
    paintLetters(songs);
    list.forEach(function (s) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + s.slug;
      const name = document.createElement("span");
      name.textContent = s.title;
      const dot = document.createElement("span");
      dot.className = "dot" + (streamFor(s) ? "" : " off");
      dot.title = streamFor(s) ? "Stream mapped" : "Lyrics only";
      a.appendChild(name);
      a.appendChild(dot);
      li.appendChild(a);
      listEl.appendChild(li);
    });
    const slug = (location.hash || "").replace(/^#/, "");
    const cur = list.filter(function (s) { return s.slug === slug; })[0] || list[0];
    show(cur);
  }

  function setPlaying(on) {
    icoPlay.classList.toggle("hide", on);
    icoPause.classList.toggle("hide", !on);
    btnPlay.setAttribute("aria-label", on ? "Pause" : "Play");
  }

  function playRecord(rec) {
    if (!rec || !rec.stream_url) return;
    playIdx = mapped.findIndex(function (m) { return m.slug === rec.slug; });
    audio.src = rec.stream_url;
    audio.play().catch(function () {});
    nowTitle.textContent = rec.stream_title || rec.title;
    nowState.textContent = "Catalog stream · LYGO mini player";
    full.href = LISTEN + "?q=" + encodeURIComponent(rec.title);
  }

  function playOffset(dir) {
    if (!mapped.length) return;
    if (playIdx < 0) playIdx = 0;
    playIdx = (playIdx + dir + mapped.length) % mapped.length;
    playRecord(mapped[playIdx]);
    location.hash = mapped[playIdx].slug;
  }

  btnPlay.addEventListener("click", function () {
    if (!audio.src) {
      const st = streamFor(current) || mapped[0];
      playRecord(st);
      return;
    }
    if (audio.paused) audio.play().catch(function () {});
    else audio.pause();
  });
  btnPrev.addEventListener("click", function () { playOffset(-1); });
  btnNext.addEventListener("click", function () { playOffset(1); });
  audio.addEventListener("play", function () { setPlaying(true); });
  audio.addEventListener("pause", function () { setPlaying(false); });
  audio.addEventListener("ended", function () { playOffset(1); });
  audio.addEventListener("error", function () {
    nowState.textContent = "Stream missed · try full player";
    setPlaying(false);
  });
  audio.addEventListener("timeupdate", function () {
    if (seeking || !audio.duration) return;
    seek.value = String(Math.floor((audio.currentTime / audio.duration) * 1000));
  });
  seek.addEventListener("pointerdown", function () { seeking = true; });
  seek.addEventListener("pointerup", function () { seeking = false; });
  seek.addEventListener("input", function () {
    if (!audio.duration) return;
    audio.currentTime = (parseInt(seek.value, 10) / 1000) * audio.duration;
  });
  vol.addEventListener("input", function () {
    audio.volume = parseInt(vol.value, 10) / 100;
  });
  audio.volume = 0.85;

  document.addEventListener("keydown", function (e) {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.code === "Space") {
      e.preventDefault();
      btnPlay.click();
    } else if (e.key === "ArrowLeft") playOffset(-1);
    else if (e.key === "ArrowRight") playOffset(1);
    else if (e.key === "/") {
      e.preventDefault();
      q.focus();
    }
  });

  Promise.all([
    fetch("songs.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
    fetch("stream-map.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
  ]).then(function (pair) {
    songs = pair[0];
    const sm = pair[1] || {};
    (sm.tracks || []).forEach(function (t) {
      mapBySlug[t.slug] = t;
      if (t.stream_url) mapped.push(t);
    });
    mappedHint.textContent = mapped.length + " with streams";
    paint();
  });
  q.addEventListener("input", paint);
  window.addEventListener("hashchange", paint);
})();
