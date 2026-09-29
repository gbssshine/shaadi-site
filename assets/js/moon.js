/* Tonight's Moon: sidereal (Lahiri) Moon longitude -> nakshatra.
   Truncated Meeus lunar theory (the largest periodic terms): error well under 0.1°,
   so the nakshatra (13°20' wide) is right except in the last few minutes before a change. */
(function () {
  var NAKS = [
    ["ashwini", "Ashwini", "Quick starts and fresh energy. A good day to make the first move."],
    ["bharani", "Bharani", "Intense and honest. Feelings want to be said out loud."],
    ["krittika", "Krittika", "Sharp and clear. Cut what isn’t working, keep what is."],
    ["rohini", "Rohini", "The Moon’s favourite: beauty, comfort and romance."],
    ["mrigashira", "Mrigashira", "Curious and searching. Ask the question you’ve been holding back."],
    ["ardra", "Ardra", "Stormy, then clear. Let feelings come up so they can pass."],
    ["punarvasu", "Punarvasu", "Return and renewal. Second chances look good today."],
    ["pushya", "Pushya", "Nourishing and kind. The most auspicious of the 27."],
    ["ashlesha", "Ashlesha", "Magnetic and deep. Watch for mind games, including your own."],
    ["magha", "Magha", "Roots and pride. Family and tradition take the stage."],
    ["purva_phalguni", "Purva Phalguni", "Rest, play and pleasure. Romance is in the air."],
    ["uttara_phalguni", "Uttara Phalguni", "Promises and partnership. Good for commitments."],
    ["hasta", "Hasta", "Skilful hands. Small, practical acts of love count double."],
    ["chitra", "Chitra", "Bright and creative. Dress up and make something beautiful."],
    ["swati", "Swati", "Independent and breezy. Give each other a little space."],
    ["vishakha", "Vishakha", "Eyes on the goal. Ambition runs high."],
    ["anuradha", "Anuradha", "Friendship and devotion. Loyal hearts find each other."],
    ["jyeshtha", "Jyeshtha", "The elder star: protective, responsible, a little proud."],
    ["mula", "Mula", "Back to the roots. Honest questions about what you really want."],
    ["purva_ashadha", "Purva Ashadha", "Unstoppable mood. Confidence to say what you feel."],
    ["uttara_ashadha", "Uttara Ashadha", "Slow and steady wins. Keep your word."],
    ["shravana", "Shravana", "A listening day. Hear what’s said, and what isn’t."],
    ["dhanishta", "Dhanishta", "Rhythm and music. Celebrate, dance, gather your people."],
    ["shatabhisha", "Shatabhisha", "A hundred healers. Quiet time heals."],
    ["purva_bhadrapada", "Purva Bhadrapada", "Fiery ideals. Big talks about big dreams."],
    ["uttara_bhadrapada", "Uttara Bhadrapada", "Calm and deep. Be patient with the people you love."],
    ["revati", "Revati", "Gentle endings and safe journeys. Be kind to everyone."]
  ];
  var R = Math.PI / 180;
  // [D, M, M', F, coefficient in 1e-6 degrees] for the Moon's longitude (Meeus, table 47.A)
  var T47 = [
    [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],
    [0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],
    [0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],
    [0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
    [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],
    [4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],
    [1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],
    [2,0,1,-2,-1773],[2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],
    [2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],[2,1,-2,0,691],
    [2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],[4,-1,0,0,520],[1,0,-2,0,-487]
  ];

  function norm(x) { x %= 360; return x < 0 ? x + 360 : x; }

  function siderealMoon(date) {
    var jd = date.getTime() / 86400000 + 2440587.5;
    var T = (jd - 2451545.0) / 36525;
    var Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
    var D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
    var M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
    var Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
    var F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;
    var A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.29 * T;
    var sum = 0;
    for (var i = 0; i < T47.length; i++) {
      var t = T47[i];
      var c = t[4];
      if (Math.abs(t[1]) === 1) c *= E; else if (Math.abs(t[1]) === 2) c *= E * E;
      sum += c * Math.sin((t[0] * D + t[1] * M + t[2] * Mp + t[3] * F) * R);
    }
    sum += 3958 * Math.sin(A1 * R) + 1962 * Math.sin((Lp - F) * R) + 318 * Math.sin(A2 * R);
    var tropical = Lp + sum / 1e6;
    // nutation in longitude (main term) and Lahiri ayanamsa (23°51'11" at J2000, 50.29"/yr)
    var omega = 125.04452 - 1934.136261 * T;
    tropical += -17.2 / 3600 * Math.sin(omega * R);
    var ayanamsa = 23.85306 + (50.2788 * 100 * T + 0.000222 * 1e4 * T * T) / 3600;
    return norm(tropical - ayanamsa);
  }

  var SPAN = 360 / 27;
  function nakAt(date) { return Math.floor(siderealMoon(date) / SPAN); }

  function nextChange(date) {
    var i = nakAt(date), lo = date.getTime(), hi = lo;
    do { hi += 3600e3; } while (nakAt(new Date(hi)) === i && hi - lo < 40 * 3600e3);
    while (hi - lo > 30e3) {
      var mid = (lo + hi) / 2;
      if (nakAt(new Date(mid)) === i) lo = mid; else hi = mid;
    }
    return new Date(hi);
  }

  function fmtIST(d) {
    try {
      var now = new Date();
      var day = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric" });
      var t = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true }).format(d);
      var same = day.format(d) === day.format(now);
      var tomorrow = day.format(d) === day.format(new Date(now.getTime() + 86400e3));
      return (same ? "today at " : tomorrow ? "tomorrow at " : "on " +
        new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long" }).format(d) + " at ") +
        t.replace(/\s?(am|pm)$/i, function (m) { return " " + m.trim().toUpperCase(); }) + " IST";
    } catch (e) { return d.toUTCString(); }
  }

  var now = new Date();
  var i = nakAt(now), n = NAKS[i], next = NAKS[(i + 1) % 27], at = nextChange(now);
  window.Moon = { index: i, key: n[0], name: n[1], line: n[2], next: next[1], nextAt: at, naks: NAKS, nakAt: nakAt };

  function fill() {
    var root = document.documentElement.getAttribute("data-root") || "";
    document.querySelectorAll("[data-moon-name]").forEach(function (el) { el.textContent = n[1]; });
    document.querySelectorAll("[data-moon-line]").forEach(function (el) { el.textContent = n[2]; });
    document.querySelectorAll("[data-moon-next]").forEach(function (el) {
      el.textContent = "Moves into " + next[1] + " " + fmtIST(at) + ".";
    });
    document.querySelectorAll("img[data-moon-img]").forEach(function (el) {
      el.src = root + "assets/img/naks/" + n[0] + ".webp";
      el.alt = n[1] + " nakshatra symbol";
    });
    document.querySelectorAll("[data-nak-grid] [data-nak]").forEach(function (el) {
      if (el.getAttribute("data-nak") === n[0]) el.classList.add("is-now");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fill); else fill();
})();
