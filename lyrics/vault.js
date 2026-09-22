
(function () {
  const listEl = document.getElementById("list");
  const sheet = document.getElementById("sheet");
  const q = document.getElementById("q");
  const count = document.getElementById("count");
  let songs = [];

  function show(song) {
    if (!song) {
      sheet.innerHTML = "<p class='empty'>Choose a song.</p>";
      return;
    }
    document.querySelectorAll("#list a").forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("href") === "#" + song.slug);
    });
    const h = document.createElement("h2");
    h.textContent = song.title;
    const pre = document.createElement("pre");
    pre.className = "lyrics";
    pre.textContent = song.lyrics;
    sheet.innerHTML = "";
    sheet.appendChild(h);
    sheet.appendChild(pre);
    document.title = song.title + " — Lyrics Vault";
  }

  function paint() {
    const needle = (q.value || "").toLowerCase();
    listEl.innerHTML = "";
    const vis = songs.filter(function (s) {
      return !needle || s.title.toLowerCase().indexOf(needle) >= 0;
    });
    count.textContent = vis.length + " songs";
    vis.forEach(function (s) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + s.slug;
      a.textContent = s.title;
      li.appendChild(a);
      listEl.appendChild(li);
    });
    const slug = (location.hash || "").replace(/^#/, "");
    const cur = songs.filter(function (s) { return s.slug === slug; })[0] || vis[0];
    show(cur);
  }

  fetch("songs.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      songs = j;
      paint();
    });
  q.addEventListener("input", paint);
  window.addEventListener("hashchange", paint);
})();
