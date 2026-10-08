/* Love luck today: hearts for all 12 rashis from today's Moon (astro-core.js, the same rules as the daily reels). */
(function () {
  var A = window.Astro, S = window.ToolShare;
  var grid = document.querySelector("[data-luck-grid]");
  if (!A || !grid) return;
  var KEY = "sp_rashi";
  var L = A.loveLuck();
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var dateObj = new Date(Date.UTC(L.day.y, L.day.m - 1, L.day.d));
  var dateText = DAYS[dateObj.getUTCDay()] + ", " + L.day.d + " " + MONTHS[L.day.m - 1];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function key(r) { return r.name.toLowerCase(); }
  function hearts(n) {
    var h = "";
    for (var i = 0; i < 5; i++) h += '<svg class="' + (i < n ? "on" : "off") + '" aria-hidden="true"><use href="#heart"/></svg>';
    return '<span class="hearts" role="img" aria-label="' + n + ' of 5 hearts">' + h + "</span>";
  }
  function crowned(r) { return L.crowned.indexOf(r.index) >= 0; }

  var dateEl = document.querySelector("[data-luck-date]");
  if (dateEl) dateEl.textContent = dateText + " · India time";
  var crownEl = document.querySelector("[data-crowned]");
  if (crownEl && L.crowned.length) {
    crownEl.hidden = false;
    crownEl.innerHTML = '<span class="crown-ic" aria-hidden="true">👑</span><span>Luckiest in love today: <b>' +
      L.crowned.map(function (i) { return L.rashis[i].name; }).join("</b> and <b>") + "</b></span>";
  }
  var moonEl = document.querySelector("[data-luck-moon]");
  if (moonEl) moonEl.textContent = "The Moon is in " + L.mainSign + " for most of the day" +
    (L.change ? ", moving from " + L.moonSign6am + " into " + L.change.to + " at " + L.change.time + " IST." : ".");

  // rashi picker
  var pick = document.querySelector("[data-rashi-pick]");
  pick.innerHTML = L.rashis.map(function (r) {
    return '<button type="button" data-pick="' + r.index + '" aria-pressed="false"><i aria-hidden="true">' + r.glyph + "</i>" + r.name + "</button>";
  }).join("");

  grid.innerHTML = L.rashis.map(function (r) {
    return '<li class="luck-card' + (crowned(r) ? " is-crowned" : "") + '" id="' + key(r) + '" data-card="' + r.index + '">' +
      '<button type="button" class="luck-tap" data-pick="' + r.index + '" aria-label="' + r.name + ': make this my rashi"></button>' +
      '<div class="luck-head"><i class="glyph-sm" aria-hidden="true">' + r.glyph + "</i><div><b>" + r.name + "</b><small>" + r.english + "</small></div>" +
      (crowned(r) ? '<span class="crown-pill">Luckiest today</span>' : "") + "</div>" +
      hearts(r.hearts) + "<p>" + esc(r.line) + "</p>" +
      (r.caution ? '<p class="caution">' + esc(r.caution) + "</p>" : "") + "</li>";
  }).join("");

  var mine = document.querySelector("[data-my-luck]");
  var cardP = null, current = null;

  function select(i, scroll) {
    var r = L.rashis[i];
    current = r;
    try { localStorage.setItem(KEY, key(r)); } catch (e) {}
    document.querySelectorAll("[data-pick]").forEach(function (b) {
      if (b.closest(".rashi-pick")) b.setAttribute("aria-pressed", String(+b.getAttribute("data-pick") === i));
    });
    grid.querySelectorAll(".luck-card").forEach(function (c) { c.classList.toggle("is-mine", +c.getAttribute("data-card") === i); });
    var url = S.SITE + "/love-today.html#" + key(r);
    var text = "My love luck today, " + r.name + " " + r.glyph + ": " + "❤️".repeat(r.hearts) + "🤍".repeat(5 - r.hearts) +
      " “" + r.line + "” 🦜 See yours:\n" + url;
    mine.hidden = false;
    mine.innerHTML =
      '<div class="my-luck-card' + (crowned(r) ? " is-crowned" : "") + '">' +
        '<div class="luck-head"><i class="glyph-sm" aria-hidden="true">' + r.glyph + "</i><div><span>Your love luck today</span><b>" + r.name + "</b><small>" + r.english + "</small></div>" +
        (crowned(r) ? '<span class="crown-pill">Luckiest today</span>' : "") + "</div>" +
        hearts(r.hearts) + '<p class="my-line">' + esc(r.line) + "</p>" +
        (r.caution ? '<p class="caution">' + esc(r.caution) + "</p>" : "") +
        '<div class="share-box">' +
          '<button class="btn btn-wa btn-big" type="button" data-share>Share on WhatsApp</button>' +
          '<div class="share-2"><button class="btn btn-soft" type="button" data-save>Save picture</button><button class="btn btn-soft" type="button" data-copy>Copy link</button></div>' +
          '<p class="copied" data-copied aria-live="polite"></p>' +
        "</div>" +
      "</div>";
    var note = mine.querySelector("[data-copied]");
    cardP = S.card({
      title: "Love luck today", kicker: dateText, footer2: "shaadiparrot.com/love-today", mithu: "assets/img/mithu_crown.webp",
      draw: function (c, q) {
        var cx = q.W / 2;
        c.textAlign = "center";
        c.fillStyle = "#FFE3DA"; c.beginPath(); c.arc(cx, 380, 130, 0, 7); c.fill();
        c.fillStyle = q.ROSE; c.font = '700 150px "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Symbols", sans-serif'; c.fillText(r.glyph, cx, 434);
        c.fillStyle = q.PLUM; c.font = '800 104px "Baloo 2"'; c.fillText(r.name, cx, 630);
        c.font = '700 34px "Plus Jakarta Sans"'; c.fillStyle = q.PLUM2; c.fillText(r.english + " Moon sign", cx, 680);
        for (var k = 0; k < 5; k++) q.heart(c, cx + (k - 2) * 96, 780, 80, k < r.hearts ? "#E0404F" : "#F3D6CC");
        c.fillStyle = q.PLUM; c.font = '600 38px "Plus Jakarta Sans"';
        q.wrap(c, r.line, 820).slice(0, 3).forEach(function (ln, i) { c.fillText(ln, cx, 900 + i * 52); });
        if (crowned(r)) {
          c.font = '800 34px "Plus Jakarta Sans"'; var t = "Luckiest in love today", w = c.measureText(t).width + 60;
          q.rr(c, cx - w / 2, 1064, w, 62, 31); c.fillStyle = "#B7791F"; c.fill(); c.fillStyle = "#fff"; c.fillText(t, cx, 1106);
        } else if (r.caution) {
          c.font = '700 30px "Plus Jakarta Sans"'; c.fillStyle = "#8A5A0B"; c.fillText(r.caution, cx, 1100);
        }
      }
    });
    mine.querySelector("[data-share]").addEventListener("click", function () { cardP.then(function (b) { S.share(b, "love-luck-today.jpg", text); }); });
    mine.querySelector("[data-save]").addEventListener("click", function () { cardP.then(function (b) { S.save(b, "love-luck-today.jpg", "assets/share/og-love-today.jpg"); }); });
    mine.querySelector("[data-copy]").addEventListener("click", function () { S.copy(text, note); });
    if (scroll) window.scrollTo({ top: mine.getBoundingClientRect().top + window.scrollY - 12, behavior: "smooth" });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pick]");
    if (b) select(+b.getAttribute("data-pick"), true);
  });

  // a rashi in the address (#tula, from "Find your rashi" or a shared link), else the one picked before
  var want = location.hash.slice(1).toLowerCase(), saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var idx = -1;
  L.rashis.forEach(function (r) { if (key(r) === want) idx = r.index; });
  if (idx < 0) L.rashis.forEach(function (r) { if (key(r) === saved) idx = r.index; });
  if (idx >= 0) select(idx, !!want);
})();
