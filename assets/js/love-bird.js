/* "Which love bird are you?" — quiz engine. Data: love-bird-data.js (generated). */
(function () {
  var D = window.LOVE_BIRD;
  var card = document.querySelector("[data-quiz]");
  if (!D || !card) return;
  var ORDER = Object.keys(D.birds);
  var IMG = "../assets/img/birds/";
  var PLAY = "https://play.google.com/store/apps/details?id=com.shaadiparrot.app&referrer=" +
    encodeURIComponent("utm_source=parrot_tests&utm_medium=love_bird_result");
  var answers = [];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function score(ans) {
    var pts = {}, prim = {}, last = {};
    ORDER.forEach(function (b) { pts[b] = 0; prim[b] = 0; last[b] = -1; });
    ans.forEach(function (ai, qi) {
      var o = D.questions[qi].a[ai];
      pts[o.p] += 2; prim[o.p] += 1; last[o.p] = qi; pts[o.s] += 1;
    });
    // same tie-break as tools/love_bird.py: points, then +2 hits, then latest, then list order
    return ORDER.slice().sort(function (a, b) {
      return (pts[b] - pts[a]) || (prim[b] - prim[a]) || (last[b] - last[a]) || (ORDER.indexOf(a) - ORDER.indexOf(b));
    })[0];
  }

  function show(html) {
    card.innerHTML = html;
    card.classList.remove("screen-in"); void card.offsetWidth; card.classList.add("screen-in");
    var top = card.getBoundingClientRect().top + window.scrollY - 12;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
  }

  function question(i) {
    var q = D.questions[i];
    var pct = Math.round(i / D.questions.length * 100);
    show(
      '<div class="q-top">' +
        '<button class="q-back" type="button" data-back aria-label="Previous question"' + (i === 0 ? " disabled" : "") + '>' +
          '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4 6.5 10l6 6" fill="none" stroke="#41213E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<div class="q-progress"><b>' + (i + 1) + " / " + D.questions.length + '</b><span class="q-bar"><i style="width:' + pct + '%"></i></span></div><span></span>' +
      "</div>" +
      '<h2 class="q-text" tabindex="-1">' + esc(q.q) + "</h2>" +
      '<div class="q-opts" role="group" aria-label="Answers">' +
        q.a.map(function (o, k) {
          return '<button class="q-opt' + (answers[i] === k ? " picked" : "") + '" type="button" data-opt="' + k + '">' + esc(o.t) + "</button>";
        }).join("") +
      "</div>"
    );
    card.querySelector(".q-text").focus({ preventScroll: true });
    card.querySelectorAll("[data-opt]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        answers[i] = +btn.getAttribute("data-opt");
        card.querySelectorAll(".q-opt").forEach(function (b) { b.classList.remove("picked"); b.disabled = true; });
        btn.classList.add("picked");
        setTimeout(function () {
          if (i + 1 < D.questions.length) question(i + 1); else result(score(answers), true);
        }, 260);
      });
    });
    var back = card.querySelector("[data-back]");
    back.addEventListener("click", function () { if (i > 0) question(i - 1); });
  }

  function shareText(b) {
    return "Found this test on insta 🦜 I’m a " + b.name + ", what are you?";
  }

  // share-to-unlock (same rule and storage as the other tests): the first test on this device is free,
  // after that a share on WhatsApp opens the full result
  var UNLOCK = {
    isFull: function (id) {
      try {
        var first = localStorage.getItem("pt_first");
        if (!first) { localStorage.setItem("pt_first", id); return true; }
        var un = JSON.parse(localStorage.getItem("pt_unlocked") || "[]");
        return first === id || un.indexOf(id) >= 0;
      } catch (e) { return true; }
    },
    unlock: function (id) {
      try {
        var un = JSON.parse(localStorage.getItem("pt_unlocked") || "[]");
        if (un.indexOf(id) < 0) { un.push(id); localStorage.setItem("pt_unlocked", JSON.stringify(un)); }
      } catch (e) {}
    }
  };

  function result(id, fresh, justUnlocked) {
    var b = D.birds[id], m = D.birds[b.match];
    var url = D.site + "/tests/love-bird/" + id + ".html";
    var wa = "https://wa.me/?text=" + encodeURIComponent(shareText(b) + " " + url);
    var full = UNLOCK.isFull("love-bird");
    var details =
        '<ul class="res-traits">' + b.traits.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
        '<p class="res-love">' + esc(b.love) + "</p>" +
        '<div class="res-duo">' +
          '<a class="res-box" href="love-bird/' + b.match + '.html" style="text-decoration:none">' +
            '<img src="' + IMG + b.match + '.webp" width="480" height="480" alt="">' +
            "<div><span>Best match</span><b>" + esc(m.name) + "</b><p>" + esc(b.why) + "</p></div></a>" +
          '<div class="res-box res-flag"><div><span>Red flag</span><p>' + esc(b.flag) + "</p></div></div>" +
        "</div>";
    var locked =
        '<div class="unlock"><div class="unlock-preview" aria-hidden="true">' + details + "</div>" +
        '<div class="unlock-card">' +
          '<p class="unlock-head"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="9" width="12" height="9" rx="2.5" fill="currentColor"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" stroke-width="2"/></svg>Your full bird is ready</p>' +
          "<p>Share this test with a friend on WhatsApp to see your three traits, your best match and your red flag.</p>" +
          '<button class="btn btn-wa" type="button" data-unlock>Share on WhatsApp to unlock</button>' +
          '<p class="unlock-note">Your first test is always free. After that, one share opens each full result.</p>' +
        "</div></div>";
    card.style.setProperty("--tint", b.tint);
    show(
      '<div class="result" style="display:grid;gap:12px;justify-items:center;width:100%">' +
        (justUnlocked ? '<p class="unlocked-note">Unlocked. Thanks for sharing!</p>' : "") +
        '<div class="res-art"><img src="' + IMG + id + '.webp" width="480" height="480" alt=""></div>' +
        '<h2 class="res-name" tabindex="-1"><small>You\u2019re a</small>' + esc(b.name) + "</h2>" +
        '<p class="res-tag">' + esc(b.tagline) + "</p>" +
        (full ? details : locked) +
        '<div class="share-row">' +
          (full ?
            '<button class="btn" type="button" data-share hidden>Share my bird</button>' +
            '<a class="btn btn-wa" href="' + wa + '" target="_blank" rel="noopener">Send on WhatsApp</a>' +
            '<div class="share-2">' +
              '<a class="btn btn-soft" href="../assets/share/love-bird-' + id + '.jpg" download="love-bird-' + id + '.jpg">Save image</a>' +
              '<button class="btn btn-soft" type="button" data-copy>Copy link</button>' +
            "</div>" +
            '<p class="copied" data-copied></p>' : "") +
          '<button class="link-btn" type="button" data-again>Take the test again</button>' +
        "</div>" +
        '<div class="fate-tease">' +
          '<div class="tease-cards" aria-hidden="true"><span></span><span></span><span></span></div>' +
          "<b>Who fits a " + esc(b.name) + "?</b>" +
          "<p>In Shaadi Parrot, Mithu the parrot picks three people for you every morning and shows how you match. Your first three are ready when you join.</p>" +
          '<a class="btn" href="' + PLAY + '" target="_blank" rel="noopener">Open my fates</a>' +
        "</div>" +
      "</div>"
    );
    var holder = prefetchFile("../assets/share/love-bird-" + id + ".jpg");
    var shareBtn = card.querySelector("[data-share]");
    if (shareBtn) {
      var t0 = setInterval(function () { if (holder.file) { shareBtn.hidden = false; clearInterval(t0); } }, 300);
      setTimeout(function () { clearInterval(t0); }, 8000);
      shareBtn.addEventListener("click", function () { shareNow(holder, shareText(b) + " " + url, wa, null); });
    }
    var unlockBtn = card.querySelector("[data-unlock]");
    if (unlockBtn) unlockBtn.addEventListener("click", function () {
      shareNow(holder, shareText(b) + " " + url, wa, function () { UNLOCK.unlock("love-bird"); result(id, false, true); });
    });
    card.querySelector(".res-name").focus({ preventScroll: true });
    card.querySelector("[data-again]").addEventListener("click", function () { answers = []; history.replaceState(null, "", location.pathname); question(0); });
    var copy = card.querySelector("[data-copy]");
    if (copy) copy.addEventListener("click", function () {
      var note = card.querySelector("[data-copied]");
      var text = shareText(b) + " " + url;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { note.textContent = "Link copied. Paste it anywhere."; },
          function () { note.textContent = url; });
      } else {
        note.textContent = url;
      }
    });
    if (fresh) history.replaceState(null, "", "#" + id);
    markGrid(id);
  }

  // on phones: share the result card picture itself (with the text), so the image always arrives
  function prefetchFile(imgPath) {
    var holder = { file: null };
    if (!(navigator.canShare && window.File && window.fetch)) return holder;
    fetch(imgPath).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (blob) {
      var f = new File([blob], "my-love-bird.jpg", { type: "image/jpeg" });
      if (navigator.canShare({ files: [f] })) holder.file = f;
    }).catch(function () {});
    return holder;
  }
  function shareNow(holder, text, wa, onShared) {
    function viaWhatsApp() { window.open(wa, "_blank", "noopener"); if (onShared) setTimeout(onShared, 1200); }
    if (holder.file) {
      navigator.share({ files: [holder.file], text: text })
        .then(function () { if (onShared) onShared(); })
        .catch(function (e) { if (!(e && e.name === "AbortError")) viaWhatsApp(); });
    } else {
      viaWhatsApp();
    }
  }

  function markGrid(id) {
    document.querySelectorAll("[data-birds] a").forEach(function (a) { a.classList.toggle("me", a.getAttribute("data-id") === id); });
  }

  // all 12 birds
  var grid = document.querySelector("[data-birds]");
  if (grid) grid.innerHTML = ORDER.map(function (id) {
    return '<a href="love-bird/' + id + '.html" data-id="' + id + '"><img src="' + IMG + id + '.webp" width="480" height="480" alt="" loading="lazy">' + esc(D.birds[id].name) + "</a>";
  }).join("");

  function bindStart() {
    var s = card.querySelector("[data-start]");
    if (s) s.addEventListener("click", function () { answers = []; question(0); });
  }
  bindStart();

  // a result in the address (#swan) opens straight on that result
  var h = location.hash.slice(1);
  if (D.birds[h]) result(h, false);

  // keyboard: number keys pick an answer
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var k = parseInt(e.key, 10);
    if (k >= 1 && k <= 4) {
      var opts = card.querySelectorAll(".q-opt:not([disabled])");
      if (opts[k - 1]) { e.preventDefault(); opts[k - 1].click(); }
    }
  });
})();
