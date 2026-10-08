/* Find your rashi: birth date (and time) -> Moon sign and nakshatra (astro-core.js), with the library's words. */
(function () {
  var A = window.Astro, S = window.ToolShare, N = window.NAK_DATA || {};
  var form = document.querySelector("[data-rashi-form]");
  var out = document.querySelector("[data-result]");
  if (!A || !form || !out) return;
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var ME = "sp_me";

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function opt(v, t) { var o = document.createElement("option"); o.value = v; o.textContent = t; return o; }
  form.querySelectorAll("[data-day]").forEach(function (s) { for (var d = 1; d <= 31; d++) s.appendChild(opt(d, d)); });
  form.querySelectorAll("[data-month]").forEach(function (s) { MONTHS.forEach(function (m, i) { s.appendChild(opt(i + 1, m)); }); });
  form.querySelectorAll("[data-year]").forEach(function (s) { for (var y = 2008; y >= 1950; y--) s.appendChild(opt(y, y)); });

  // the 12 rashis under the explainer
  var list = document.querySelector("[data-rashi-list]");
  if (list) list.innerHTML = A.RASHIS.map(function (r) {
    return '<span><i aria-hidden="true">' + r[4] + "</i><b>" + r[0] + "</b><small>" + r[1] + "</small></span>";
  }).join("");

  try {
    var me = JSON.parse(localStorage.getItem(ME) || "null");
    if (me) {
      if (me.d) form.elements["r-d"].value = me.d;
      if (me.mo) form.elements["r-mo"].value = me.mo;
      if (me.y) form.elements["r-y"].value = me.y;
      if (me.t) { form.elements["r-t"].value = me.t; form.elements["r-t"].closest("details").open = true; }
    }
  } catch (e) {}

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = +form.elements["r-d"].value, mo = +form.elements["r-mo"].value, y = +form.elements["r-y"].value;
    var t = (form.elements["r-t"].value || "").match(/^(\d{1,2}):(\d{2})/);
    var box = form.querySelector("[data-dob]"), err = box.querySelector("[data-err]"), msg = "";
    if (!d || !mo || !y) msg = "Pick the day, month and year.";
    else if (new Date(Date.UTC(y, mo - 1, d)).getUTCDate() !== d) msg = MONTHS[mo - 1] + " " + y + " has no day " + d + ".";
    box.classList.toggle("is-err", !!msg); err.hidden = !msg; err.textContent = msg;
    if (msg) { box.querySelector("select").focus(); return; }
    try {
      var keep = JSON.parse(localStorage.getItem(ME) || "{}") || {};
      keep.d = d; keep.mo = mo; keep.y = y; keep.t = t ? t[0] : "";
      localStorage.setItem(ME, JSON.stringify(keep));
    } catch (e2) {}
    var birth = { y: y, m: mo, d: d, h: t ? +t[1] : null, mi: t ? +t[2] : null };
    var segs = t ? null : A.daySegments(y, mo, d);
    var c = A.chart(birth);
    render({ rashi: c.rashi, nak: c.nak, pada: c.pada, timed: !!t }, segs, birth);
  });

  var last = null;

  function segLabel(s, i, n) {
    var from = A.fmtTime(s.from), to = A.fmtTime(s.to);
    if (i === 0) return "Born before " + to;
    if (i === n - 1) return "Born after " + from;
    return "Born " + from + " to " + to;
  }

  function render(m, segs, birth) {
    var r = A.RASHIS[m.rashi], k = A.NAKS[m.nak], info = N[k[0]] || {};
    var url = S.SITE + "/moon-sign/" + k[0] + ".html";
    var text = "My rashi is " + r[0] + " " + r[4] + " and my nakshatra is " + k[1] + " 🌙 What’s yours? Mithu finds it free 🦜\n" + url;
    last = { m: m, r: r, k: k, text: text, cardP: null };
    var choose = "";
    if (segs && segs.length > 1) {
      choose = '<div class="pick-time"><p><b>The Moon moved on your birthday.</b> Which part of the day were you born in?</p><div class="pick-row">' +
        segs.map(function (s, i) {
          var on = s.rashi === m.rashi && s.nak === m.nak;
          return '<button type="button" class="pick' + (on ? " on" : "") + '" data-seg="' + i + '" aria-pressed="' + on + '"><small>' + segLabel(s, i, segs.length) +
            "</small><b>" + A.RASHIS[s.rashi][0] + "</b><span>" + A.NAKS[s.nak][1] + "</span></button>";
        }).join("") + "</div></div>";
    }
    out.innerHTML =
      '<div class="wrap res-grid">' +
        '<div class="score-card rashi-card">' +
          '<p class="kicker">Your rashi (Moon sign)</p>' +
          '<div class="glyph" aria-hidden="true">' + r[4] + "</div>" +
          '<h2 class="score-band" tabindex="-1">' + r[0] + "</h2>" +
          '<p class="rashi-en">' + r[1] + " Moon · ruled by " + r[2] + "</p>" +
          '<div class="moon-card nak-big"><img src="assets/img/naks/' + k[0] + '.webp" width="160" height="160" alt="">' +
            "<div><span>Your nakshatra</span><b>" + k[1] + "</b><small>" + (m.timed ? "Pada " + m.pada + " · " : "") + k[2] + " gana · " + k[4] + " yoni</small></div></div>" +
          choose +
          '<div class="share-box">' +
            '<button class="btn btn-wa btn-big" type="button" data-share>Share on WhatsApp</button>' +
            '<div class="share-2"><button class="btn btn-soft" type="button" data-save>Save picture</button><button class="btn btn-soft" type="button" data-copy>Copy link</button></div>' +
            '<p class="copied" data-copied aria-live="polite"></p>' +
          "</div>" +
        "</div>" +
        '<div class="res-detail">' +
          "<h3 class=\"res-h\">" + k[1] + " in love</h3>" +
          (info.hook ? '<p class="nak-hook">' + esc(info.hook) + "</p>" : "") +
          (info.ideas ? '<ul class="nak-ideas">' + info.ideas.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
          (info.facts ? '<dl class="nak-facts">' + info.facts.map(function (f) { return "<div><dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd></div>"; }).join("") + "</dl>" : "") +
          '<div class="next-tools">' +
            '<a class="next-tool" href="love-today.html#' + r[0].toLowerCase() + '"><img src="assets/img/astro/a_love.webp" width="160" height="160" alt=""><span><b>Love luck today for ' + r[0] + "</b><small>See your hearts for today</small></span></a>" +
            '<a class="next-tool" href="kundli-match.html"><img src="assets/img/astro/a_kundli.webp" width="160" height="160" alt=""><span><b>Kundli match</b><small>Check your gunas with your crush</small></span></a>' +
          "</div>" +
        "</div>" +
      "</div>";
    out.hidden = false;
    window.scrollTo({ top: out.getBoundingClientRect().top + window.scrollY - 8, behavior: "smooth" });
    out.querySelector(".score-band").focus({ preventScroll: true });
    out.querySelectorAll("[data-seg]").forEach(function (b) {
      b.addEventListener("click", function () {
        var s = segs[+b.getAttribute("data-seg")];
        // the pada at the middle of that part of the day
        var mid = A.moonFacts(A.siderealMoon(new Date((s.from.getTime() + s.to.getTime()) / 2)));
        render({ rashi: s.rashi, nak: s.nak, pada: mid.pada, timed: false }, segs, birth);
      });
    });
    var note = out.querySelector("[data-copied]");
    last.cardP = S.card({
      title: "My Moon sign", footer2: "shaadiparrot.com/moon-sign", mithu: "assets/img/mithu_telescope.webp",
      images: { nak: "assets/img/naks/" + k[0] + ".webp" },
      draw: function (c, q) {
        var cx = q.W / 2;
        c.textAlign = "center";
        c.fillStyle = "#FFE3DA"; c.beginPath(); c.arc(cx, 400, 150, 0, 7); c.fill();
        c.fillStyle = q.ROSE; c.font = '700 170px "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Symbols", sans-serif'; c.fillText(r[4], cx, 462);
        c.fillStyle = q.PLUM; c.font = '800 112px "Baloo 2"'; c.fillText(r[0], cx, 680);
        c.font = '700 36px "Plus Jakarta Sans"'; c.fillStyle = q.PLUM2; c.fillText(r[1] + " Moon", cx, 732);
        q.rr(c, 150, 800, q.W - 300, 220, 40); c.fillStyle = "#FFF1EA"; c.fill();
        if (q.img.nak) c.drawImage(q.img.nak, 190, 830, 160, 160);
        c.textAlign = "left"; c.fillStyle = q.PLUM2; c.font = '700 30px "Plus Jakarta Sans"'; c.fillText("My nakshatra", 380, 878);
        c.fillStyle = q.ROSE; c.font = '800 ' + q.fit(c, k[1], '800 {s}px "Baloo 2"', 84, 520) + 'px "Baloo 2"'; c.fillText(k[1], 380, 960);
        c.fillStyle = q.PLUM; c.font = '600 30px "Plus Jakarta Sans"'; c.fillText(k[2] + " gana · " + k[4] + " yoni", 380, 1000);
      }
    });
    out.querySelector("[data-share]").addEventListener("click", function () { last.cardP.then(function (b) { S.share(b, "my-rashi.jpg", last.text); }); });
    out.querySelector("[data-save]").addEventListener("click", function () { last.cardP.then(function (b) { S.save(b, "my-rashi.jpg", "assets/share/og-nak-" + k[0] + ".jpg"); }); });
    out.querySelector("[data-copy]").addEventListener("click", function () { S.copy(last.text, note); });
  }
})();
