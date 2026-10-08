/* Kundli Match: two birth dates -> Guna Milan out of 36 (astro-core.js), the 8 kootas, doshas and a share card. */
(function () {
  var A = window.Astro, S = window.ToolShare;
  var form = document.querySelector("[data-match-form]");
  var out = document.querySelector("[data-result]");
  if (!A || !form || !out) return;
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MAX_YEAR = 2008, MIN_YEAR = 1950;   // 18+ (the app is for adults)
  var PLAY = "https://play.google.com/store/apps/details?id=com.shaadiparrot.app&referrer=" +
    encodeURIComponent("utm_source=website&utm_medium=kundli_match_result");
  var ME = "sp_me";

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(sel, el) { return (el || form).querySelector(sel); }
  function opt(v, t) { var o = document.createElement("option"); o.value = v; o.textContent = t; return o; }

  form.querySelectorAll("[data-day]").forEach(function (s) { for (var d = 1; d <= 31; d++) s.appendChild(opt(d, d)); });
  form.querySelectorAll("[data-month]").forEach(function (s) { MONTHS.forEach(function (m, i) { s.appendChild(opt(i + 1, m)); }); });
  form.querySelectorAll("[data-year]").forEach(function (s) { for (var y = MAX_YEAR; y >= MIN_YEAR; y--) s.appendChild(opt(y, y)); });

  // your crush's gender follows yours (opposite) until you pick it yourself
  var bPicked = false;
  form.querySelectorAll('input[name="b-g"]').forEach(function (r) { r.addEventListener("change", function () { bPicked = true; }); });
  form.querySelectorAll('input[name="a-g"]').forEach(function (r) {
    r.addEventListener("change", function () {
      if (bPicked) return;
      var other = form.querySelector('input[name="b-g"][value="' + (r.value === "female" ? "male" : "female") + '"]');
      if (other) other.checked = true;
    });
  });

  function read(p) {
    var g = form.querySelector('input[name="' + p + '-g"]:checked');
    var t = (form.elements[p + "-t"].value || "").match(/^(\d{1,2}):(\d{2})/);
    return {
      g: g ? g.value : "", name: (form.elements[p + "-name"].value || "").trim().slice(0, 18),
      d: +form.elements[p + "-d"].value || 0, mo: +form.elements[p + "-mo"].value || 0, y: +form.elements[p + "-y"].value || 0,
      h: t ? +t[1] : null, mi: t ? +t[2] : null, t: t ? t[0] : ""
    };
  }

  function validDate(x) {
    if (!x.d || !x.mo || !x.y) return "Pick the day, month and year.";
    var dt = new Date(Date.UTC(x.y, x.mo - 1, x.d));
    if (dt.getUTCDate() !== x.d) return MONTHS[x.mo - 1] + " " + x.y + " has no day " + x.d + ".";
    return "";
  }

  // your own details are remembered on this phone only, so checking the next crush is one date away
  try {
    var me = JSON.parse(localStorage.getItem(ME) || "null");
    if (me) {
      if (me.g) { var r0 = form.querySelector('input[name="a-g"][value="' + me.g + '"]'); if (r0) { r0.checked = true; r0.dispatchEvent(new Event("change")); } }
      form.elements["a-name"].value = me.name || "";
      if (me.d) form.elements["a-d"].value = me.d;
      if (me.mo) form.elements["a-mo"].value = me.mo;
      if (me.y) form.elements["a-y"].value = me.y;
      if (me.t) { form.elements["a-t"].value = me.t; form.elements["a-t"].closest("details").open = true; }
    }
  } catch (e) {}

  function band(s) {
    if (s > 32) return { key: "rare", title: "Made in the stars", lines: ["A rare score. Even the parrot is blushing.", "Mithu is already humming the shehnai tune."] };
    if (s >= 25) return { key: "great", title: "A very good match", lines: ["The stars like you two together. Now text first.", "Strong stars. The rest is chai and good timing."] };
    if (s >= 18) return { key: "good", title: "A good match", lines: ["Above the usual 18. Real effort does the rest.", "Good stars and real work: that’s how love stories go."] };
    return { key: "low", title: "Opposites attract?", lines: ["Under the usual 18. Plenty of happy couples score low: talk, don’t assume.", "The stars are shy here. Kindness can outscore any kundli."] };
  }
  function num(x) { return String(x).replace(".5", "½").replace(/^0½$/, "½"); }
  function slug(x) { return String(x).replace(".", "-"); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var a = read("a"), b = read("b"), bad = false;
    [["a", a], ["b", b]].forEach(function (pp) {
      var box = form.querySelector('[data-person="' + pp[0] + '"] [data-dob]'), msg = validDate(pp[1]), err = box.querySelector("[data-err]");
      box.classList.toggle("is-err", !!msg);
      err.hidden = !msg; err.textContent = msg;
      if (msg && !bad) { bad = true; box.querySelector("select").focus(); }
    });
    if (bad) return;
    try { localStorage.setItem(ME, JSON.stringify({ g: a.g, name: a.name, d: a.d, mo: a.mo, y: a.y, t: a.t })); } catch (e2) {}
    var ca = A.chart({ y: a.y, m: a.mo, d: a.d, h: a.h, mi: a.mi });
    var cb = A.chart({ y: b.y, m: b.mo, d: b.d, h: b.h, mi: b.mi });
    render(A.match(ca, cb, a.g, b.g), a, b);
  });
  form.addEventListener("change", function (e) {
    var box = e.target.closest("[data-dob]");
    if (box && box.classList.contains("is-err") && !validDate(read(box.closest("[data-person]").getAttribute("data-person")))) {
      box.classList.remove("is-err"); box.querySelector("[data-err]").hidden = true;
    }
  });

  var last = null;

  function render(r, a, b) {
    var bd = band(r.total), line = bd.lines[Math.round(r.total * 2) % 2];
    var aName = a.name || "You", bName = b.name || "Your crush";
    var names = a.name && b.name ? esc(a.name) + ' <svg aria-hidden="true"><use href="#heart"/></svg> ' + esc(b.name) : "Your kundli match";
    var range = r.precision === "date" && r.totalMin !== r.totalMax;
    var url = S.SITE + "/match/" + slug(r.total) + ".html";
    var who = a.name && b.name ? a.name + " + " + b.name + " got " : "We got ";
    var text = who + num(r.total) + " out of 36 gunas in Kundli Match 💞 Check yours with your crush 🦜\n" + url;
    last = { r: r, a: a, b: b, band: bd, line: line, text: text, blob: null };

    out.innerHTML =
      '<div class="wrap res-grid">' +
        '<div class="score-card band-' + bd.key + '">' +
          '<p class="score-names">' + names + "</p>" +
          '<div class="ring" style="--p:' + (r.total / 36).toFixed(4) + '"><div><b>' + num(r.total) + "</b><small>of 36 gunas</small></div></div>" +
          '<h2 class="score-band" tabindex="-1">' + bd.title + "</h2>" +
          '<p class="mithu-says"><img src="assets/img/logo.webp" width="40" height="40" alt=""><span>' + esc(line) + "</span></p>" +
          (range ? '<p class="range-note">Without birth times your score can be anywhere from <b>' + num(r.totalMin) + "</b> to <b>" + num(r.totalMax) +
            '</b>, depending on the hour. <button class="link-btn" type="button" data-add-time>Add birth times</button></p>' : "") +
          '<div class="share-box">' +
            '<button class="btn btn-wa btn-big" type="button" data-share><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .3-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.4.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z"/></svg>Share on WhatsApp</button>' +
            '<div class="share-2"><button class="btn btn-soft" type="button" data-save>Save picture</button><button class="btn btn-soft" type="button" data-copy>Copy link</button></div>' +
            '<p class="copied" data-copied aria-live="polite"></p>' +
            '<button class="link-btn" type="button" data-again>Check someone else</button>' +
          "</div>" +
        "</div>" +
        '<div class="res-detail">' +
          '<div class="moons">' + moonCard(aName, r.aMoon, ca(a)) + moonCard(bName, r.bMoon, ca(b)) + "</div>" +
          '<h3 class="res-h">All 8 kootas</h3>' +
          '<ul class="kootas">' + r.kootas.map(kootaRow).join("") + "</ul>" +
          '<h3 class="res-h">Doshas</h3>' +
          '<ul class="doshas">' + r.doshas.map(doshaRow).join("") + "</ul>" +
          '<aside class="app-cta"><img src="assets/img/mithu_cards.webp" width="510" height="635" alt="">' +
            "<div><b>Want people whose stars already fit?</b><p>Every morning in Shaadi Parrot, Mithu picks three people for you and shows your Guna Milan with each one.</p>" +
            '<a class="btn btn-small" href="' + PLAY + '" target="_blank" rel="noopener">Get the app, free</a></div></aside>' +
        "</div>" +
      "</div>";
    out.hidden = false;
    var top = out.getBoundingClientRect().top + window.scrollY - 8;
    window.scrollTo({ top: top, behavior: "smooth" });
    out.querySelector(".score-band").focus({ preventScroll: true });
    bind();
    makeCard();
  }

  function ca(p) { return p.h != null; }

  function moonCard(who, m, timed) {
    return '<div class="moon-card"><img src="assets/img/naks/' + m.nakKey + '.webp" width="160" height="160" alt="">' +
      "<div><span>" + esc(who) + "</span><b>" + m.nakshatra + "</b><small>" + m.rashi + " (" + m.rashiEnglish + ") Moon" +
      (timed ? " · pada " + m.pada : "") + "</small></div></div>";
  }

  function kootaRow(k) {
    var p = k.points / k.max, cls = p >= .75 ? "k-good" : p >= .4 ? "k-mid" : "k-low";
    return '<li class="' + cls + '"><div class="k-top"><b>' + k.label + "</b><small>" + k.name + '</small><span class="k-pts">' +
      num(k.points) + "<i>/" + k.max + '</i></span></div><span class="k-bar"><i style="width:' + Math.round(p * 100) + '%"></i></span>' +
      "<p>" + esc(k.meaning) + "</p></li>";
  }

  function doshaRow(d) {
    var cls = !d.present ? "d-none" : d.cancelled ? "d-cancel" : "d-yes";
    var pill = !d.present ? "No dosha" : d.cancelled ? "Cancelled" : "Present";
    return '<li class="' + cls + '"><span class="d-pill">' + pill + "</span><b>" + d.name + "</b><p>" + esc(d.why) + "</p></li>";
  }

  function makeCard() {
    var L = last;
    L.cardP = S.card({
      title: "Kundli Match",
      footer2: "shaadiparrot.com/kundli-match",
      draw: function (c, k) {
        var W = k.W, cx = W / 2;
        // names
        var names = L.a.name && L.b.name ? [L.a.name, L.b.name] : null;
        c.textAlign = "center"; c.fillStyle = k.PLUM;
        if (names) {
          var s = k.fit(c, names[0] + "   " + names[1], '800 {s}px "Baloo 2"', 76, 820);
          c.font = '800 ' + s + 'px "Baloo 2"';
          var w0 = c.measureText(names[0]).width, w1 = c.measureText(names[1]).width, gap = s * .9, total = w0 + gap + w1, x0 = cx - total / 2;
          c.textAlign = "left"; c.fillText(names[0], x0, 318); c.fillText(names[1], x0 + w0 + gap, 318);
          k.heart(c, x0 + w0 + gap / 2, 296, s * .55, "#E0404F");
        } else {
          c.font = '800 64px "Baloo 2"'; c.fillText("Our kundli match", cx, 314);
        }
        // ring
        var R = 190, cy = 570;
        c.lineWidth = 36; c.lineCap = "round";
        c.strokeStyle = "#F7D5CF"; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
        var g = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, "#FF7E8E"); g.addColorStop(1, "#C42F40");
        c.strokeStyle = g; c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(.02, L.r.total / 36)); c.stroke();
        c.textAlign = "center"; c.fillStyle = k.PLUM;
        c.font = '800 150px "Baloo 2"'; c.fillText(num(L.r.total), cx, cy + 40);
        c.font = '700 34px "Plus Jakarta Sans"'; c.fillStyle = k.PLUM2; c.fillText("of 36 gunas", cx, cy + 92);
        // band and Mithu's line
        c.fillStyle = k.ROSE; c.font = '800 ' + k.fit(c, L.band.title, '800 {s}px "Baloo 2"', 78, 860) + 'px "Baloo 2"';
        c.fillText(L.band.title, cx, 868);
        c.fillStyle = k.PLUM; c.font = '600 34px "Plus Jakarta Sans"';
        k.wrap(c, L.line, 800).slice(0, 2).forEach(function (ln, i) { c.fillText(ln, cx, 936 + i * 46); });
        // three koota chips with the best ratios
        var best = L.r.kootas.slice().sort(function (x, y) { return y.points / y.max - x.points / x.max || y.max - x.max; }).slice(0, 3);
        c.font = '700 26px "Plus Jakarta Sans"';
        var chips = best.map(function (q) { return q.label + " " + num(q.points) + "/" + q.max; });
        var widths = chips.map(function (t) { return c.measureText(t).width + 40; }), tot = widths.reduce(function (s, w) { return s + w; }, 0) + 20 * (chips.length - 1);
        if (tot > 900) { chips = chips.slice(0, 2); widths = widths.slice(0, 2); tot = widths[0] + widths[1] + 20; }
        var x = cx - tot / 2;
        chips.forEach(function (t, i) {
          k.rr(c, x, 1050, widths[i], 54, 27); c.fillStyle = "#FFE3DA"; c.fill();
          c.fillStyle = k.PLUM; c.textAlign = "left"; c.fillText(t, x + 20, 1086); x += widths[i] + 20;
        });
      }
    }).then(function (blob) { L.blob = blob; return blob; });
  }

  function bind() {
    var note = out.querySelector("[data-copied]");
    out.querySelector("[data-share]").addEventListener("click", function () {
      var L = last;
      (L.blob ? Promise.resolve(L.blob) : L.cardP).then(function (blob) { S.share(blob, "kundli-match.jpg", L.text); });
    });
    out.querySelector("[data-save]").addEventListener("click", function () {
      var L = last;
      L.cardP.then(function (blob) { S.save(blob, "kundli-match.jpg", "assets/share/og-match-" + slug(L.r.total) + ".jpg"); });
    });
    out.querySelector("[data-copy]").addEventListener("click", function () { S.copy(last.text, note); });
    out.querySelector("[data-again]").addEventListener("click", function () {
      ["b-name", "b-d", "b-mo", "b-y", "b-t"].forEach(function (n) { form.elements[n].value = ""; });
      out.hidden = true; out.innerHTML = "";
      var box = form.querySelector('[data-person="b"]');
      window.scrollTo({ top: box.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" });
      setTimeout(function () { form.elements["b-name"].focus({ preventScroll: true }); }, 400);
    });
    var add = out.querySelector("[data-add-time]");
    if (add) add.addEventListener("click", function () {
      form.querySelectorAll(".time-toggle").forEach(function (d) { d.open = true; });
      window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" });
    });
  }
})();
