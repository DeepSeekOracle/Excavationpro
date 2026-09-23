
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

  const SVG_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  const SVG_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>';
  const SVG_BARS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h2v8H5zM10 6h2v14h-2zM15 9h2v9h-2zM20 12h2v4h-2z" fill="currentColor"/></svg>';

  let songs = [];
  let mapBySlug = {};
  let mapped = [];
  let current = null;
  let playIdx = -1;
  let letterOn = "";
  let seeking = false;
  let lastShown = "";

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

  // State plainly what the listener is about to hear. Never dress a stand-in up as the mix.
  function matchLabel(rec) {
    if (!rec) return { short: "Lyrics only", long: "No audio mapped for this title yet." };
    switch (rec.match) {
      case "instrumental":
        return { short: "Instrumental of this title",
                 long: "The catalog holds the instrumental of this title. No vocal mix is public." };
      case "instrumental-fit":
        return { short: "Instrumental bed",
                 long: "The catalog holds no stream for this title, so the dock plays an instrumental chosen to fit these lyrics. It is a stand-in, not the mix." };
      case "near-title":
        return { short: "Catalog stream (nearest title)",
                 long: "Played from the catalog file whose title is nearest to this one." };
      default:
        return { short: "Catalog stream", long: "This title has its own file in the catalog." };
    }
  }

  function isThisPlaying(rec) {
    return !!(rec && audio.src && rec.stream_url === audio.currentSrc && !audio.paused);
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

    const rec = streamFor(song);
    const lab = matchLabel(rec);

    const actions = document.createElement("div");
    actions.className = "sheet-actions";
    if (rec) {
      const playing = isThisPlaying(rec);
      const pb = document.createElement("button");
      pb.type = "button";
      pb.className = "sheet-play" + (playing ? " active" : "");
      pb.dataset.slug = song.slug;
      pb.innerHTML = (playing ? SVG_PAUSE : SVG_PLAY) + "<span>" + (playing ? "Pause" : "Play") + "</span>";
      pb.setAttribute("aria-label", (playing ? "Pause " : "Play ") + song.title);
      pb.addEventListener("click", function () { toggle(rec); });
      actions.appendChild(pb);
    }
    const note = document.createElement("p");
    note.className = "sheet-note";
    const shown = rec && (rec.display || rec.stream_title);
    note.textContent = lab.long + (shown ? " · " + shown : "");
    actions.appendChild(note);
    const fl = document.createElement("a");
    fl.className = "sheet-full";
    fl.href = LISTEN + "?q=" + encodeURIComponent(song.title);
    fl.textContent = "Open in full player ›";
    actions.appendChild(fl);

    const pre = document.createElement("pre");
    pre.className = "lyrics";
    pre.textContent = song.lyrics;

    sheet.innerHTML = "";
    sheet.appendChild(h);
    sheet.appendChild(meta);
    sheet.appendChild(actions);
    sheet.appendChild(pre);

    if (rec) {
      nowTitle.textContent = rec.display || rec.stream_title || rec.title;
      nowState.textContent = lab.short;
    } else {
      nowState.textContent = "Lyrics only · open full player for the catalog";
    }
    document.title = song.title + " — Lyrics Vault";
    if (song.slug !== lastShown) {
      lastShown = song.slug;
      maybeGate();
    }
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
      const rec = streamFor(s);
      const name = document.createElement("span");
      name.textContent = s.title;
      a.appendChild(name);
      if (rec) {
        const pb = document.createElement("button");
        pb.type = "button";
        pb.className = "row-play";
        pb.title = "Play · " + matchLabel(rec).short;
        pb.setAttribute("aria-label", "Play " + s.title);
        pb.innerHTML = isThisPlaying(rec) ? SVG_BARS : SVG_PLAY;
        pb.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          if (location.hash === "#" + s.slug) {
            toggle(rec);
          } else {
            location.hash = s.slug;
            playRecord(rec);
          }
        });
        a.appendChild(pb);
      } else {
        const dot = document.createElement("span");
        dot.className = "dot off";
        dot.title = "No audio mapped";
        a.appendChild(dot);
      }
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
    // every play button reflects the transport, not just the dock
    document.querySelectorAll(".sheet-play").forEach(function (b) {
      const mine = current && b.dataset.slug === current.slug && isThisPlaying(streamFor(current));
      b.classList.toggle("active", !!mine);
      b.innerHTML = (mine ? SVG_PAUSE : SVG_PLAY) + "<span>" + (mine ? "Pause" : "Play") + "</span>";
    });
    document.querySelectorAll("#list a").forEach(function (a, i) {
      const s = vis()[i];
      const pb = a.querySelector(".row-play");
      if (pb && s) pb.innerHTML = isThisPlaying(streamFor(s)) ? SVG_BARS : SVG_PLAY;
    });
  }

  function playRecord(rec) {
    if (!rec || !rec.stream_url) return;
    playIdx = mapped.findIndex(function (m) { return m.slug === rec.slug; });
    audio.src = rec.stream_url;
    audio.play().catch(function () {});
    nowTitle.textContent = rec.display || rec.stream_title || rec.title;
    nowState.textContent = matchLabel(rec).short + " · LYGO mini player";
    full.href = LISTEN + "?q=" + encodeURIComponent(rec.title);
    setPlaying(true);
  }

  function toggle(rec) {
    if (!rec) return;
    if (audio.src && rec.stream_url === audio.currentSrc) {
      if (audio.paused) audio.play().catch(function () {});
      else audio.pause();
      return;
    }
    playRecord(rec);
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
    mappedHint.textContent = mapped.length + " playable";
    const sn = document.getElementById("stat-n");
    const smEl = document.getElementById("stat-m");
    if (sn) sn.textContent = String(songs.length);
    if (smEl) smEl.textContent = String(mapped.length);
    paintHighlight();
    paint();
  });
  q.addEventListener("input", paint);
  window.addEventListener("hashchange", paint);

  function lyricLines(song) {
    return (song.lyrics || "").split("\n").map(function (l) {
      return l.trim();
    }).filter(function (l) {
      if (!l || l.charAt(0) === "[") return false;
      if (/^(EXCAVATIONPRO|KENZIE JADE|YUKI|NOVA RAYNE|DOBLE FILO)\.?$/i.test(l)) return false;
      if (l.length < 24 || l.length > 150) return false;
      if (/https?:|style:|gemini|thought for/i.test(l)) return false;
      return true;
    });
  }

  function pickHighlight(avoid) {
    const pool = songs.filter(function (s) {
      return s.slug !== avoid && lyricLines(s).length > 0;
    });
    const song = pool[Math.floor(Math.random() * pool.length)] || songs[0];
    const lines = lyricLines(song);
    if (!lines.length) return { song: song, text: song.title };
    const i = Math.floor(Math.random() * lines.length);
    let text = lines[i];
    if (lines[i + 1] && (text + " " + lines[i + 1]).length < 170) {
      text += " " + lines[i + 1];
    }
    return { song: song, text: text };
  }

  function paintHighlight(forceNew) {
    const quoteEl = document.getElementById("vault-quote");
    const citeEl = document.getElementById("vault-cite");
    const linkEl = document.getElementById("vault-link");
    if (!quoteEl || !songs.length) return;
    const last = sessionStorage.getItem("vaultHighlightSlug") || "";
    const pick = pickHighlight(forceNew || last ? last : "");
    quoteEl.textContent = pick.text;
    citeEl.textContent = pick.song.title + (pick.song.album ? " · " + pick.song.album : "");
    linkEl.href = "#" + pick.song.slug;
    sessionStorage.setItem("vaultHighlightSlug", pick.song.slug);
  }

  const TV_PAGE = "https://chatagent.ca/sources/";
  const TV_ROOMS = [
    { id: "kick_live", title: "Excavationpro on Kick", kind: "kick",
      url: "https://player.kick.com/excavationpro?autoplay=true" },
    { id: "rumble_live", title: "Excavationpro Rumble LIVE", kind: "rumble",
      url: "https://rumble.com/embed/v7b5p30/?pub=1th29y" },
    { id: "twitch_live", title: "Excavationpro on Twitch", kind: "twitch",
      channel: "excavationpro" },
    { id: "yt_justin_live", title: "Justin Helmer YouTube LIVE", kind: "youtube",
      url: "https://www.youtube-nocookie.com/embed/live_stream?channel=UCIbGSxMpDaj5ivh6mP_-k-A" },
    { id: "yt_excav_live", title: "Excavationpro YouTube LIVE", kind: "youtube",
      url: "https://www.youtube-nocookie.com/embed/live_stream?channel=UCr2GPEJcl2lXu0lS9-0FjvA" },
    { id: "rumble_radio", title: "Excavationpro Rumble radio", kind: "rumble",
      url: "https://rumble.com/embed/v7anxls/?pub=1th29y" },
    { id: "yt_justin_videos", title: "Justin Helmer YouTube videos", kind: "youtube",
      url: "https://www.youtube-nocookie.com/embed/videoseries?list=UUIbGSxMpDaj5ivh6mP_-k-A" },
    { id: "yt_excav_videos", title: "Excavationpro YouTube videos", kind: "youtube",
      url: "https://www.youtube-nocookie.com/embed/videoseries?list=UUr2GPEJcl2lXu0lS9-0FjvA" }
  ];
  let tvI = 0;
  const tvFrame = document.getElementById("tv-frame");
  const tvMeta = document.getElementById("tv-meta");
  const tvOpen = document.getElementById("tv-open");

  function tvEmbed(ch) {
    if (ch.kind === "twitch" || (ch.url && ch.url.indexOf("player.twitch.tv") !== -1)) {
      return "https://player.twitch.tv/?channel=" + encodeURIComponent(ch.channel || "excavationpro") +
        "&parent=" + encodeURIComponent(location.hostname) + "&autoplay=true&muted=true";
    }
    return ch.url;
  }

  function playTv(i) {
    if (!TV_ROOMS.length) return;
    tvI = (i + TV_ROOMS.length) % TV_ROOMS.length;
    const ch = TV_ROOMS[tvI];
    if (tvFrame) tvFrame.src = tvEmbed(ch);
    if (tvMeta) tvMeta.textContent = ch.title + " · " + (tvI + 1) + " / " + TV_ROOMS.length;
    if (tvOpen) tvOpen.href = TV_PAGE + "#channel/" + ch.id;
    if (tvFrame) tvFrame.title = ch.title;
  }

  const tvPrev = document.getElementById("tv-prev");
  const tvNext = document.getElementById("tv-next");
  if (tvPrev) tvPrev.addEventListener("click", function () { playTv(tvI - 1); });
  if (tvNext) tvNext.addEventListener("click", function () { playTv(tvI + 1); });
  playTv(0);

  fetch(TV_PAGE + "catalog.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (cat) {
    const live = cat && cat.live;
    if (!live || !live.length) return;
    TV_ROOMS.length = 0;
    live.forEach(function (ch) {
      if (ch && ch.id && (ch.url || ch.kind === "twitch")) TV_ROOMS.push(ch);
    });
    playTv(Math.min(tvI, TV_ROOMS.length - 1));
  }).catch(function () {});

  const shuffleBtn = document.getElementById("vault-shuffle");
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      paintHighlight(true);
    });
  }

  const gate = document.getElementById("gate");
  const gatePass = document.getElementById("gate-pass");
  let sheetOpens = 0;
  let gateTimer = 0;

  function hideGate() {
    if (!gate) return;
    gate.hidden = true;
    sessionStorage.setItem("vaultGateAt", String(Date.now()));
  }

  function showGate() {
    if (!gate || !current) return;
    gate.hidden = false;
    if (gatePass) gatePass.focus();
  }

  function maybeGate() {
    sheetOpens += 1;
    window.clearTimeout(gateTimer);
    const last = parseInt(sessionStorage.getItem("vaultGateAt") || "0", 10);
    const cooling = Date.now() - last < 7 * 60 * 1000;
    if (sheetOpens === 1) {
      gateTimer = window.setTimeout(showGate, 8000);
      return;
    }
    if (!cooling && sheetOpens % 3 === 0) showGate();
  }

  if (gatePass) gatePass.addEventListener("click", hideGate);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && gate && !gate.hidden) hideGate();
  });
})();
