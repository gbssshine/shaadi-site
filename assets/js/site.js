/* Shaadi Parrot site: menu, mobile dock, Daily Fates demo, YouTube click-to-play. */
(function () {
  var root = document.documentElement.getAttribute("data-root") || "";

  // ---------- mobile menu ----------
  var btn = document.querySelector("[data-menu-btn]");
  var menu = document.querySelector("[data-menu]");
  if (btn && menu) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) { btn.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
        btn.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open"); btn.focus();
      }
    });
  }

  // ---------- dock: appears once the header is off screen ----------
  var dock = document.querySelector("[data-dock]");
  var top = document.querySelector(".top");
  if (dock && top && "IntersectionObserver" in window) {
    // appears once the first screen is scrolled past, then stays put (no sliding in and out while scrolling)
    var dockIO = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) { dock.classList.add("show"); dockIO.disconnect(); }
    }, { threshold: 0 });
    dockIO.observe(top);
  }

  // ---------- Daily Fates demo ----------
  var FATES = [
    { name: "Meera, 27", city: "Pune", img: "meera", score: 94,
      bars: [["Compatibility", 92], ["Relationship outlook", 95], ["Fate alignment", 94]],
      verdict: "She plans the trip, you pick the playlist. Mithu approves. Say hi before lunch." },
    { name: "Kabir, 28", city: "Bengaluru", img: "kabir", score: 91,
      bars: [["Compatibility", 90], ["Relationship outlook", 88], ["Fate alignment", 93]],
      verdict: "He cooks, he calls his mother, and he laughs at your jokes. The parrot has spoken." },
    { name: "Ananya, 25", city: "Delhi", img: "ananya", score: 96,
      bars: [["Compatibility", 97], ["Relationship outlook", 94], ["Fate alignment", 96]],
      verdict: "Same favourite song, same chai order. That’s not a coincidence, that’s a sign." }
  ];
  var LATER = ["Opens tomorrow", "Opens in 2 days"];

  document.querySelectorAll("[data-fates]").forEach(function (box) {
    var cards = Array.prototype.slice.call(box.querySelectorAll("[data-fate]"));
    var reading = box.querySelector("[data-reading]");
    var opened = -1;

    cards.forEach(function (card, i) {
      var f = FATES[i];
      card.querySelector(".fate-front").innerHTML =
        '<img src="' + root + 'assets/img/people/' + f.img + '.webp" width="480" height="640" alt="">' +
        "<b>" + f.name + "</b>";
      card.addEventListener("click", function () {
        if (opened === -1) open(i);
        else if (i !== opened) nudge(card);
      });
    });

    function open(i) {
      opened = i;
      var later = 0;
      cards.forEach(function (c, j) {
        if (j === i) {
          c.classList.add("open");
          c.setAttribute("aria-label", FATES[j].name + ", today’s fate");
          c.querySelector(".fate-note").textContent = FATES[j].city;
        } else {
          c.classList.add("locked");
          c.querySelector(".fate-note").textContent = LATER[later++];
          c.setAttribute("aria-label", "Locked fate card. " + c.querySelector(".fate-note").textContent);
        }
      });
      var f = FATES[i];
      reading.querySelector("[data-r-score]").textContent = f.score + "%";
      reading.querySelector("[data-r-bars]").innerHTML = f.bars.map(function (b) {
        return "<li>" + b[0] + '<span><i style="width:' + b[1] + '%"></i></span><em>' + b[1] + "</em></li>";
      }).join("");
      reading.querySelector("[data-r-verdict]").textContent = "Mithu says: " + f.verdict;
      reading.hidden = false;
    }

    function nudge(card) {
      card.classList.remove("nudge");
      void card.offsetWidth;
      card.classList.add("nudge");
    }

    var reset = box.querySelector("[data-fates-reset]");
    if (reset) reset.addEventListener("click", function () {
      opened = -1;
      reading.hidden = true;
      cards.forEach(function (c, j) {
        c.classList.remove("open", "locked", "nudge");
        c.querySelector(".fate-note").textContent = "";
        c.setAttribute("aria-label", "Open fate card " + (j + 1));
      });
      cards[0].focus();
    });
  });

  // ---------- test catalog: collapsed on phones, open on wider screens ----------
  if (window.matchMedia && window.matchMedia("(max-width: 699px)").matches) {
    document.querySelectorAll("details.cat[open]").forEach(function (d) { d.open = false; });
  }

  // ---------- test browser: filter chips ----------
  document.querySelectorAll("[data-tb]").forEach(function (tb) {
    var chips = tb.querySelectorAll(".chip"), cards = tb.querySelectorAll(".tcard");
    function apply(f) {
      chips.forEach(function (c) { c.classList.toggle("is-on", c.getAttribute("data-f") === f); c.setAttribute("aria-pressed", String(c.getAttribute("data-f") === f)); });
      cards.forEach(function (c) {
        var show = f === "all" || (f === "free" ? c.hasAttribute("data-free") : c.getAttribute("data-cat") === f);
        c.hidden = !show;
      });
      var grid = tb.querySelector(".tb-grid"); if (grid) grid.scrollLeft = 0;
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { apply(c.getAttribute("data-f")); }); });
    apply("free");
  });

  // ---------- pop-up sheet (bottom sheet on phones, centred card on desktop) ----------
  var PLAY = "https://play.google.com/store/apps/details?id=com.shaadiparrot.app&referrer=" +
    encodeURIComponent("utm_source=website&utm_medium=" + (document.body.className.replace(/.*page-(\w+).*/, "$1") || "site"));
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var sheet, lastFocus;
  function openSheet(html) {
    if (!sheet) {
      sheet = document.createElement("dialog");
      sheet.className = "sheet";
      sheet.addEventListener("click", function (e) { if (e.target === sheet || e.target.closest("[data-close]")) closeSheet(); });
      sheet.addEventListener("close", function () { document.body.classList.remove("sheet-open"); if (lastFocus) lastFocus.focus(); });
      document.body.appendChild(sheet);
    }
    lastFocus = document.activeElement;
    sheet.innerHTML = '<div class="sheet-body"><button class="sheet-x" type="button" data-close aria-label="Close">' +
      '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" stroke="#41213E" stroke-width="2.2" stroke-linecap="round"/></svg></button>' + html + "</div>";
    document.body.classList.add("sheet-open");
    if (sheet.showModal) sheet.showModal(); else sheet.setAttribute("open", "");
  }
  function closeSheet() { if (sheet.close) sheet.close(); else { sheet.removeAttribute("open"); document.body.classList.remove("sheet-open"); } }
  var playBtn = function (label) { return '<a class="btn sheet-cta" href="' + PLAY + '" target="_blank" rel="noopener">' + label + "</a>"; };
  var lock = '<svg class="lock" viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="9" width="12" height="9" rx="2.5" fill="currentColor"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

  document.addEventListener("click", function (e) {
    // a test that lives only in the app
    var t = e.target.closest("[data-app-only]");
    if (t) {
      openSheet('<img class="sheet-art" src="' + root + 'assets/img/mithu_pencil.webp" width="640" height="803" alt="">' +
        '<p class="kicker">In the app</p><h3>' + esc(t.getAttribute("data-app-only")) + "</h3>" +
        "<p>This test, with its full result, is in the Shaadi Parrot app along with 89 others. Eighteen of them also work right here in your browser.</p>" +
        playBtn("Take it in the app") + '<a class="text-link" href="' + root + 'tests.html#try" data-close>See tests you can take now</a>');
      return;
    }
    // a nakshatra tile
    var n = e.target.closest("[data-nak]");
    if (n && window.NAK_DATA && window.Moon) {
      var key = n.getAttribute("data-nak"), d = window.NAK_DATA[key];
      var name = (window.Moon.naks.filter(function (x) { return x[0] === key; })[0] || [key, key])[1];
      var line = (window.Moon.naks.filter(function (x) { return x[0] === key; })[0] || [0, 0, ""])[2];
      openSheet('<div class="sheet-nak"><img src="' + root + 'assets/img/naks/' + key + '.webp" width="256" height="256" alt=""></div>' +
        (window.Moon.key === key ? '<p class="kicker">The Moon is here right now</p>' : '<p class="kicker">Nakshatra</p>') +
        "<h3>" + esc(name) + "</h3><p class=\"sheet-line\">" + esc(line) + "</p><p>" + esc(d.hook) + "</p>" +
        '<dl class="facts-dl">' + d.facts.map(function (f) { return "<dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd>"; }).join("") + "</dl>" +
        '<ul class="sheet-ideas">' + d.ideas.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>" +
        '<p class="sheet-note">The full article on ' + esc(name) + " is in the Astrology Library in the app.</p>" + playBtn("Read it in the app"));
      return;
    }
    // an Astrology Library section
    var l = e.target.closest("[data-lib]");
    if (l && window.LIBRARY_DATA) {
      var s = window.LIBRARY_DATA.filter(function (x) { return x.id === l.getAttribute("data-lib"); })[0];
      if (!s) return;
      openSheet('<p class="kicker">Astrology Library · ' + s.topics.length + " articles</p><h3>" + esc(s.title) + "</h3>" +
        (s.preview.hook ? '<div class="sheet-preview"><b>' + esc(s.preview.title) + "</b><p>" + esc(s.preview.hook) + "</p></div>" : "") +
        '<ol class="sheet-topics">' + s.topics.map(function (tt, i) { return "<li>" + (i ? lock : "") + esc(tt) + "</li>"; }).join("") + "</ol>" +
        playBtn("Read all " + s.topics.length + " in the app"));
      return;
    }
  });

  // ---------- YouTube: embeds need http(s); from a local file just open YouTube ----------
  document.querySelectorAll("[data-yt]").forEach(function (a) {
    if (!/^https?:$/.test(location.protocol)) return;
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var id = a.getAttribute("data-yt");
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&playsinline=1&rel=0";
      f.allow = "autoplay; encrypted-media; picture-in-picture";
      f.allowFullscreen = true;
      f.title = "Shaadi Parrot video";
      a.replaceWith(f);
    });
  });
})();
