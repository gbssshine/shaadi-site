/* Parrot Tests — engine for the app's relationship tests (tests/<id>.html).
   window.TEST is written into each page by tools/build_all_tests.py from the app's own test data.
   Scoring mirrors the app (Services/TestResults/AnswerAnalysis.cs): answers 5..1, reverse items flipped,
   average → VeryHigh ≥ 4.25, High ≥ 3.5, VeryLow ≤ 1.75, Low ≤ 2.5, else Undecided (≥ half neutral) or Moderate.
   A result page (tests/<id>-<code>.html, or ?r=<code>) shows the friend's full result above the test.
   Free (listed) tests show the full result; the others show a teaser with the rest locked. */
(function () {
  var T = window.TEST;
  var card = document.querySelector("[data-test]");
  if (!T || !card) return;
  var SCALE = [["Very true", 5], ["Rather true", 4], ["Neutral", 3], ["Rather false", 2], ["Not true at all", 1]];
  var PLAY = "https://play.google.com/store/apps/details?id=com.shaadiparrot.app&referrer=" +
    encodeURIComponent("utm_source=parrot_tests&utm_medium=" + T.id);
  var answers = [];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function show(html) {
    card.innerHTML = html;
    card.classList.remove("screen-in"); void card.offsetWidth; card.classList.add("screen-in");
    var top = card.getBoundingClientRect().top + window.scrollY - 12;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
  }

  // ---------- result blocks ----------
  var SECTIONS = [
    ["behaviors", "How you are in love", "sec-love"],
    ["strengths", "Your strengths", "sec-good"],
    ["weaknesses", "Your blind spots", "sec-warn"],
    ["real", "In real life", "sec-real"],
    ["tips", "Mithu’s tips for you", "sec-tips"]
  ];
  function list(items) { return "<ul>" + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"; }
  function fullSections(b, you) {
    return SECTIONS.filter(function (s) { return b[s[0]] && b[s[0]].length; }).map(function (s) {
      var title = you ? s[1] : s[1].replace("you are", "they are").replace("Your ", "Their ").replace("for you", "for them");
      return '<section class="res-sec ' + s[2] + '"><h3>' + esc(title) + "</h3>" + list(b[s[0]]) + "</section>";
    }).join("");
  }
  function lockedCard(b) {
    var rows = [["How you are in love", (b.behaviors || []).length], ["Your blind spots", (b.weaknesses || []).length],
                ["More real-life moments", Math.max(0, (b.real || []).length - 1)], ["Mithu’s tips for you", (b.tips || []).length]]
      .filter(function (l) { return l[1] > 0; });
    if (!rows.length) return "";
    return '<div class="locked">' +
      '<p class="locked-head"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="9" width="12" height="9" rx="2.5" fill="#C42F40"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="#C42F40" stroke-width="2"/></svg>The rest of your result is in the app</p>' +
      '<ul class="locked-list">' + rows.map(function (l) {
        return "<li><b>" + esc(l[0]) + "</b><span>" + l[1] + (l[1] === 1 ? " insight" : " insights") + "</span><i></i><i></i></li>";
      }).join("") + "</ul>" +
      '<a class="btn" href="' + PLAY + '" target="_blank" rel="noopener">Unlock it free in the app</a></div>';
  }

  // ---------- a friend's shared result: shown in full above the test ----------
  var params = new URLSearchParams(location.search);
  var friend = params.get("r") || T.friend;
  var banner = document.querySelector("[data-friend]");
  if (banner && friend && T.bands[friend]) {
    var fb = T.bands[friend];
    banner.className = "friend-card";
    banner.innerHTML =
      '<p class="pt-kicker">' + esc(T.title) + " · a friend’s result</p>" +
      '<h2 class="res-name res-name-sm">' + esc(fb.label) + "</h2>" +
      '<p class="res-love">' + esc((fb.summaries || [""])[0]) + "</p>" +
      '<details class="friend-more"><summary>See their full result</summary>' + fullSections(fb, false) + "</details>" +
      '<button class="btn pt-start" type="button" data-start-friend>What will you get? Take the test</button>';
    banner.hidden = false;
    banner.querySelector("[data-start-friend]").addEventListener("click", function () { answers = []; question(0); });
  }

  function question(i) {
    var q = T.q[i];
    show(
      '<div class="q-top">' +
        '<button class="q-back" type="button" data-back aria-label="Previous statement"' + (i === 0 ? " disabled" : "") + '>' +
        '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4 6.5 10l6 6" fill="none" stroke="#41213E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<div class="q-progress"><b>' + (i + 1) + " / " + T.q.length + '</b><span class="q-bar"><i style="width:' + Math.round(i / T.q.length * 100) + '%"></i></span></div><span></span>' +
      "</div>" +
      '<p class="pt-kicker">How true is this for you?</p>' +
      '<h2 class="q-text" tabindex="-1">' + esc(q[0]) + "</h2>" +
      '<div class="q-opts" role="group" aria-label="How true is this for you?">' +
        SCALE.map(function (s) {
          return '<button class="q-opt q-center' + (answers[i] === s[1] ? " picked" : "") + '" type="button" data-v="' + s[1] + '">' + s[0] + "</button>";
        }).join("") +
      "</div>"
    );
    card.querySelector(".q-text").focus({ preventScroll: true });
    card.querySelectorAll("[data-v]").forEach(function (b) {
      b.addEventListener("click", function () {
        answers[i] = +b.getAttribute("data-v");
        card.querySelectorAll(".q-opt").forEach(function (x) { x.classList.remove("picked"); x.disabled = true; });
        b.classList.add("picked");
        setTimeout(function () { if (i + 1 < T.q.length) question(i + 1); else result(); }, 230);
      });
    });
    card.querySelector("[data-back]").addEventListener("click", function () { if (i > 0) question(i - 1); });
  }

  function classify() {
    var oriented = T.q.map(function (q, i) { var v = answers[i] || 3; return q[1] ? 6 - v : v; });
    var avg = oriented.reduce(function (s, v) { return s + v; }, 0) / oriented.length;
    var neutral = oriented.filter(function (v) { return v === 3; }).length / oriented.length;
    var code = avg >= 4.25 ? "vh" : avg <= 1.75 ? "vl" : avg >= 3.5 ? "h" : avg <= 2.5 ? "l" : neutral >= 0.5 ? "u" : "m";
    return { avg: avg, code: code };
  }

  // ---------- share: on phones send the result card picture itself, so the image always arrives ----------
  function setupShare(root, imgPath, text, url) {
    var btn = root.querySelector("[data-share]");
    var file = null;
    var canFiles = !!(navigator.canShare && window.File && window.fetch);
    if (!btn) return;
    if (!canFiles) { btn.remove(); return; }
    fetch(imgPath).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (blob) {
      var f = new File([blob], "my-result.jpg", { type: "image/jpeg" });
      if (navigator.canShare({ files: [f] })) file = f; else btn.remove();
    }).catch(function () { btn.remove(); });
    btn.addEventListener("click", function () {
      if (!file) return;
      navigator.share({ files: [file], text: text + " " + url }).catch(function () {});
    });
  }

  function result() {
    var r = classify(), b = T.bands[r.code];
    var pos = Math.round((r.avg - 1) / 4 * 100);
    var url = T.site + "/tests/" + T.id + "-" + r.code + ".html";
    var img = "../assets/share/og-test-" + T.id + "-" + r.code + ".jpg";
    var summary = (b.summaries || [""])[0];
    var text = "Found this test on insta 🦜 I got “" + b.label + "” in " + T.title + ". " + summary + " What do you get?";
    var wa = "https://wa.me/?text=" + encodeURIComponent(text + " " + url);
    var body = T.open
      ? fullSections(b, true)
      : ((b.strengths && b.strengths[0] ? '<div class="res-box res-good"><div><span>Your strength</span><p>' + esc(b.strengths[0]) + "</p></div></div>" : "") +
         (b.real && b.real[0] ? '<div class="res-box"><div><span>In real life</span><p>' + esc(b.real[0]) + "</p></div></div>" : "") +
         lockedCard(b));
    show(
      '<div class="result" style="display:grid;gap:12px;justify-items:center;width:100%">' +
        '<p class="pt-kicker">' + esc(T.title) + " · your result</p>" +
        '<h2 class="res-name res-name-sm" tabindex="-1">' + esc(b.label) + "</h2>" +
        '<div class="meter-big"><span class="q-bar q-bar-dot"><i style="width:' + pos + '%"></i></span>' +
          "<p><span>" + esc(T.low) + "</span><span>" + esc(T.high) + "</span></p></div>" +
        '<p class="res-love">' + esc(summary) + "</p>" +
        body +
        '<div class="share-row">' +
          '<button class="btn" type="button" data-share>Share my result</button>' +
          '<a class="btn btn-wa" href="' + wa + '" target="_blank" rel="noopener">Send on WhatsApp</a>' +
          '<button class="link-btn" type="button" data-again>Take the test again</button>' +
        "</div>" +
        '<div class="fate-tease">' +
          '<div class="tease-cards" aria-hidden="true"><span></span><span></span><span></span></div>' +
          "<b>Three fates are waiting for you</b>" +
          "<p>In Shaadi Parrot, Mithu the parrot picks three people for you every morning and shows how you match. Your first three are ready when you join.</p>" +
          '<a class="btn" href="' + PLAY + '" target="_blank" rel="noopener">Open my fates</a>' +
        "</div>" +
      "</div>"
    );
    setupShare(card, img, text, url);
    card.querySelector(".res-name").focus({ preventScroll: true });
    card.querySelector("[data-again]").addEventListener("click", function () { answers = []; question(0); });
  }

  var start = document.querySelector("[data-start]");
  if (start) start.addEventListener("click", function () { answers = []; question(0); });

  // keyboard: number keys pick an answer
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var k = parseInt(e.key, 10);
    if (k >= 1 && k <= 5) {
      var opts = card.querySelectorAll(".q-opt:not([disabled])");
      if (opts[k - 1]) { e.preventDefault(); opts[k - 1].click(); }
    }
  });
})();
