/* Shared Vedic astrology for the free tools: Kundli Match, Find your rashi and Love luck today.
   Moon: truncated Meeus lunar theory plus a Lahiri ayanamsa fitted to Swiss Ephemeris (within ~20", well under a minute
   of the Moon's motion), so signs and nakshatras agree with the app except in the last seconds before a change.
   Guna Milan: the same tables and rules as the app's Daily Fates (shaadiparrot-face-verification/fates_astro.py),
   checked against it by tools/check_astro.py. Love luck: the same rules as the daily reels (cartoon tools/daily.py).
   Everything runs in the browser; nothing is sent anywhere. */
(function () {
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
  function mod(a, n) { return ((a % n) + n) % n; }

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
      var t = T47[i], c = t[4];
      if (Math.abs(t[1]) === 1) c *= E; else if (Math.abs(t[1]) === 2) c *= E * E;
      sum += c * Math.sin((t[0] * D + t[1] * M + t[2] * Mp + t[3] * F) * R);
    }
    sum += 3958 * Math.sin(A1 * R) + 1962 * Math.sin((Lp - F) * R) + 318 * Math.sin(A2 * R);
    var tropical = Lp + sum / 1e6;
    // Lahiri ayanamsa, fitted to Swiss Ephemeris' sidereal Moon over 1950-2030 (tools/check_astro.py): it works in the
    // mean frame, so no nutation here; that leaves about 5" of scatter, a few seconds of the Moon's motion.
    var ayanamsa = 23.85306 + (50.2788 * 100 * T + 0.000222 * 1e4 * T * T) / 3600 - (18.48 + 30.74 * T) / 3600;
    return norm(tropical - ayanamsa);
  }

  // ------------------------------------------------------------------ names and tables (fates_astro.py)
  var NAKS = [   // key, name, gana, nadi, yoni
    ["ashwini", "Ashwini", "Deva", "Adi", "Horse"], ["bharani", "Bharani", "Manushya", "Madhya", "Elephant"],
    ["krittika", "Krittika", "Rakshasa", "Antya", "Sheep"], ["rohini", "Rohini", "Manushya", "Antya", "Serpent"],
    ["mrigashira", "Mrigashira", "Deva", "Madhya", "Serpent"], ["ardra", "Ardra", "Manushya", "Adi", "Dog"],
    ["punarvasu", "Punarvasu", "Deva", "Adi", "Cat"], ["pushya", "Pushya", "Deva", "Madhya", "Sheep"],
    ["ashlesha", "Ashlesha", "Rakshasa", "Antya", "Cat"], ["magha", "Magha", "Rakshasa", "Antya", "Rat"],
    ["purva_phalguni", "Purva Phalguni", "Manushya", "Madhya", "Rat"], ["uttara_phalguni", "Uttara Phalguni", "Manushya", "Adi", "Cow"],
    ["hasta", "Hasta", "Deva", "Adi", "Buffalo"], ["chitra", "Chitra", "Rakshasa", "Madhya", "Tiger"],
    ["swati", "Swati", "Deva", "Antya", "Buffalo"], ["vishakha", "Vishakha", "Rakshasa", "Antya", "Tiger"],
    ["anuradha", "Anuradha", "Deva", "Madhya", "Deer"], ["jyeshtha", "Jyeshtha", "Rakshasa", "Adi", "Deer"],
    ["mula", "Mula", "Rakshasa", "Adi", "Dog"], ["purva_ashadha", "Purva Ashadha", "Manushya", "Madhya", "Monkey"],
    ["uttara_ashadha", "Uttara Ashadha", "Manushya", "Antya", "Mongoose"], ["shravana", "Shravana", "Deva", "Antya", "Monkey"],
    ["dhanishta", "Dhanishta", "Rakshasa", "Madhya", "Lion"], ["shatabhisha", "Shatabhisha", "Rakshasa", "Adi", "Horse"],
    ["purva_bhadrapada", "Purva Bhadrapada", "Manushya", "Adi", "Lion"], ["uttara_bhadrapada", "Uttara Bhadrapada", "Manushya", "Madhya", "Cow"],
    ["revati", "Revati", "Deva", "Antya", "Elephant"]
  ];
  var RASHIS = [   // name, western, lord, varna, glyph (U+FE0E: drawn as a symbol, not a purple emoji)
    ["Mesha", "Aries", "Mars", "Kshatriya", "♈\uFE0E"], ["Vrishabha", "Taurus", "Venus", "Vaishya", "♉\uFE0E"],
    ["Mithuna", "Gemini", "Mercury", "Shudra", "♊\uFE0E"], ["Karka", "Cancer", "Moon", "Brahmin", "♋\uFE0E"],
    ["Simha", "Leo", "Sun", "Kshatriya", "♌\uFE0E"], ["Kanya", "Virgo", "Mercury", "Vaishya", "♍\uFE0E"],
    ["Tula", "Libra", "Venus", "Shudra", "♎\uFE0E"], ["Vrishchika", "Scorpio", "Mars", "Brahmin", "♏\uFE0E"],
    ["Dhanu", "Sagittarius", "Jupiter", "Kshatriya", "♐\uFE0E"], ["Makara", "Capricorn", "Saturn", "Vaishya", "♑\uFE0E"],
    ["Kumbha", "Aquarius", "Saturn", "Shudra", "♒\uFE0E"], ["Meena", "Pisces", "Jupiter", "Brahmin", "♓\uFE0E"]
  ];
  var VASHYA_BY_RASHI = ["Chatushpada", "Chatushpada", "Manava", "Jalachara", "Vanachara", "Manava",
                         "Manava", "Keeta", null, null, "Manava", "Jalachara"];   // Dhanu/Makara split at 15°
  var VARNA_RANK = { Shudra: 0, Vaishya: 1, Kshatriya: 2, Brahmin: 3 };
  var VASHYA_ORDER = ["Chatushpada", "Manava", "Jalachara", "Vanachara", "Keeta"];
  var VASHYA = [[2, 1, 1, 0, 1], [1, 2, 0.5, 0, 1], [1, 0.5, 2, 1, 1], [0, 0, 1, 2, 0], [1, 1, 1, 0, 2]];
  var YONI_ORDER = ["Horse", "Elephant", "Sheep", "Serpent", "Dog", "Cat", "Rat", "Cow", "Buffalo", "Tiger",
                    "Deer", "Monkey", "Mongoose", "Lion"];
  var YONI = [
    [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 1, 3, 2, 1], [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
    [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1], [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
    [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1], [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
    [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2], [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
    [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 2], [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
    [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1], [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
    [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2], [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4]
  ];
  var PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  var GRAHA_MAITRI = [
    [5, 5, 5, 4, 5, 0, 0], [5, 5, 4, 1, 4, 0.5, 0.5], [5, 4, 5, 0.5, 5, 3, 0.5], [4, 1, 0.5, 5, 0.5, 5, 4],
    [5, 4, 5, 0.5, 5, 0.5, 3], [0, 0.5, 3, 5, 0.5, 5, 5], [0, 0.5, 0.5, 4, 3, 5, 5]
  ];
  var FRIENDS = {
    Sun: ["Moon", "Mars", "Jupiter"], Moon: ["Sun", "Mercury"], Mars: ["Sun", "Moon", "Jupiter"],
    Mercury: ["Sun", "Venus"], Jupiter: ["Sun", "Moon", "Mars"], Venus: ["Mercury", "Saturn"], Saturn: ["Mercury", "Venus"]
  };
  var GANA_ORDER = ["Deva", "Manushya", "Rakshasa"];
  var GANA = [[6, 6, 0], [5, 6, 0], [1, 0, 6]];
  var BHAKOOT_BAD = { 2: "2/12", 12: "2/12", 5: "5/9", 9: "5/9", 6: "6/8", 8: "6/8" };
  var KOOTAS = ["Varna", "Vashya", "Tara", "Yoni", "Graha Maitri", "Gana", "Bhakoot", "Nadi"];
  var KOOTA_MAX = { "Varna": 1, "Vashya": 2, "Tara": 3, "Yoni": 4, "Graha Maitri": 5, "Gana": 6, "Bhakoot": 7, "Nadi": 8 };
  var KOOTA_LABEL = { "Varna": "Work and ego", "Vashya": "Attraction", "Tara": "Luck and health", "Yoni": "Physical ease",
                      "Graha Maitri": "How you think", "Gana": "Temperament", "Bhakoot": "Family and money", "Nadi": "Health and family" };

  // ------------------------------------------------------------------ charts
  var NAK_SPAN = 360 / 27, PADA_SPAN = NAK_SPAN / 4;

  /* A moment given in India time (IST, UTC+5:30). */
  function ist(y, m, d, h, mi) { return new Date(Date.UTC(y, m - 1, d, h || 0, mi || 0) - 330 * 60000); }

  function moonFacts(lon) {
    return { lon: lon, rashi: Math.floor(lon / 30) % 12, nak: Math.floor(lon / NAK_SPAN) % 27,
             pada: Math.floor((lon % NAK_SPAN) / PADA_SPAN) + 1 };
  }

  /* b = {y, m, d, h?, mi?}; birth time in IST. Without a time: noon, plus every Moon position the day allows
     (the app's chart_from_birth does the same), so a match can report a range. */
  function chart(b) {
    var timed = b.h != null && b.h !== "";
    var f = moonFacts(siderealMoon(ist(b.y, b.m, b.d, timed ? +b.h : 12, timed ? +b.mi || 0 : 0)));
    f.timeKnown = timed;
    f.precision = timed ? "time" : "date";
    var opts = [[f.rashi, f.nak]];
    if (!timed) {
      var start = ist(b.y, b.m, b.d, 0, 0).getTime();
      for (var s = 0; s <= 24; s += 2) {
        var g = moonFacts(siderealMoon(new Date(start + s * 3600e3 - (s === 24 ? 60e3 : 0))));
        if (!opts.some(function (o) { return o[0] === g.rashi && o[1] === g.nak; })) opts.push([g.rashi, g.nak]);
      }
    }
    f.options = opts;
    return f;
  }

  /* The Moon's nakshatra/rashi segments over one IST day: [{from, to, rashi, nak}] with Date bounds. */
  function daySegments(y, m, d) {
    var t0 = ist(y, m, d, 0, 0).getTime(), t1 = t0 + 86400e3, step = 15 * 60e3;
    function key(t) { var f = moonFacts(siderealMoon(new Date(t))); return f.rashi * 100 + f.nak; }
    var segs = [], from = t0, k = key(t0);
    for (var t = t0 + step; t <= t1; t += step) {
      var k2 = key(Math.min(t, t1 - 1));
      if (k2 !== k) {
        var lo = t - step, hi = t;
        while (hi - lo > 20e3) { var mid = (lo + hi) / 2; if (key(mid) === k) lo = mid; else hi = mid; }
        segs.push({ from: new Date(from), to: new Date(hi), rashi: Math.floor(k / 100), nak: k % 100 });
        from = hi; k = k2;
      }
    }
    segs.push({ from: new Date(from), to: new Date(t1), rashi: Math.floor(k / 100), nak: k % 100 });
    return segs;
  }

  // ------------------------------------------------------------------ Guna Milan (fates_astro.koota_points)
  function vashyaGroup(rashi, lon) {
    var g = VASHYA_BY_RASHI[rashi];
    if (g) return g;
    var within = lon != null ? lon % 30 : 7.5;
    if (rashi === 8) return within < 15 ? "Manava" : "Chatushpada";   // Dhanu
    return within < 15 ? "Chatushpada" : "Jalachara";                 // Makara
  }
  function taraGood(count) { var r = count % 9; return r !== 3 && r !== 5 && r !== 7; }

  function kootaPoints(boy, girl) {
    var br = boy.rashi, gr = girl.rashi, bn = boy.nak, gn = girl.nak, pts = {};
    pts["Varna"] = VARNA_RANK[RASHIS[br][3]] >= VARNA_RANK[RASHIS[gr][3]] ? 1 : 0;
    pts["Vashya"] = VASHYA[VASHYA_ORDER.indexOf(vashyaGroup(br, boy.lon))][VASHYA_ORDER.indexOf(vashyaGroup(gr, girl.lon))];
    var g2b = mod(bn - gn, 27) + 1, b2g = mod(gn - bn, 27) + 1;
    pts["Tara"] = 1.5 * ((taraGood(g2b) ? 1 : 0) + (taraGood(b2g) ? 1 : 0));
    pts["Yoni"] = YONI[YONI_ORDER.indexOf(NAKS[bn][4])][YONI_ORDER.indexOf(NAKS[gn][4])];
    pts["Graha Maitri"] = GRAHA_MAITRI[PLANETS.indexOf(RASHIS[br][2])][PLANETS.indexOf(RASHIS[gr][2])];
    pts["Gana"] = GANA[GANA_ORDER.indexOf(NAKS[bn][2])][GANA_ORDER.indexOf(NAKS[gn][2])];
    var d = mod(gr - br, 12) + 1;
    pts["Bhakoot"] = BHAKOOT_BAD[d] ? 0 : 7;
    pts["Nadi"] = NAKS[bn][3] === NAKS[gn][3] ? 0 : 8;
    return pts;
  }

  function mutualFriends(a, b) { return FRIENDS[a].indexOf(b) >= 0 && FRIENDS[b].indexOf(a) >= 0; }

  function nadiDosha(a, b) {
    var nadi = NAKS[a.nak][3];
    if (nadi !== NAKS[b.nak][3]) return { name: "Nadi dosha", present: false, cancelled: false, why: "Your Nadis differ." };
    var sameRashi = a.rashi === b.rashi, sameNak = a.nak === b.nak, reason = null;
    if (sameRashi && !sameNak) reason = "same Moon sign, different nakshatras";
    else if (sameNak && !sameRashi) reason = "same nakshatra, different Moon signs";
    else if (sameNak && a.pada && b.pada && a.pada !== b.pada) reason = "same nakshatra, different padas";
    else if (!sameRashi && RASHIS[a.rashi][2] === RASHIS[b.rashi][2]) reason = "both Moon signs are ruled by " + RASHIS[a.rashi][2];
    if (reason) return { name: "Nadi dosha", present: true, cancelled: true, why: "Same Nadi (" + nadi + "), cancelled: " + reason + "." };
    return { name: "Nadi dosha", present: true, cancelled: false,
             why: "You share the same Nadi (" + nadi + "). Traditionally the weightiest dosha; a family pandit can advise remedies." };
  }

  function bhakootDosha(boy, girl) {
    var d = mod(girl.rashi - boy.rashi, 12) + 1;
    if (!BHAKOOT_BAD[d]) return { name: "Bhakoot dosha", present: false, cancelled: false, why: "Your Moon signs sit well together." };
    var la = RASHIS[boy.rashi][2], lb = RASHIS[girl.rashi][2], rel = BHAKOOT_BAD[d];
    if (la === lb) return { name: "Bhakoot dosha", present: true, cancelled: true,
                            why: "Your Moon signs sit " + rel + ", but both are ruled by " + la + ", which cancels it." };
    if (mutualFriends(la, lb)) return { name: "Bhakoot dosha", present: true, cancelled: true,
                                        why: "Your Moon signs sit " + rel + ", but their lords, " + la + " and " + lb + ", are friends, which cancels it." };
    return { name: "Bhakoot dosha", present: true, cancelled: false, why: "Your Moon signs sit " + rel + ": plan money and family matters together." };
  }

  function ganaDosha(pts) {
    if (pts["Gana"] > 1) return null;
    if (pts["Graha Maitri"] >= 5 || pts["Tara"] >= 3)
      return { name: "Gana dosha", present: true, cancelled: true,
               why: "Your temperaments differ, cancelled by " + (pts["Graha Maitri"] >= 5 ? "friendly Moon lords." : "kind birth stars.") };
    return { name: "Gana dosha", present: true, cancelled: false, why: "Your temperaments differ: give each other room." };
  }

  function meaning(name, pts, boy, girl, aIsBoy) {
    var a = aIsBoy ? boy : girl, b = aIsBoy ? girl : boy;
    if (name === "Varna") return pts >= 1 ? "Work and ego: no fight over who leads." : "Work and ego: agree early on how you share decisions.";
    if (name === "Vashya") return ({ 2: "A natural pull towards each other.", 1: "The pull between you is steady rather than magnetic.",
                                     0.5: "One of you may feel more drawn than the other." })[pts] || "Little natural pull; attraction grows with time together.";
    if (name === "Tara") return ({ 3: "Your birth stars are good for each other’s luck and health.",
                                   1.5: "One birth star favours the other more; care keeps it balanced." })[pts] || "Your birth stars don’t favour each other; small kindnesses matter more.";
    if (name === "Yoni") {
      var ya = NAKS[a.nak][4], yb = NAKS[b.nak][4];
      if (pts >= 4) return "Same Yoni, " + ya + ": physical ease comes naturally.";
      if (pts >= 3) return "Friendly Yonis (" + ya + " and " + yb + "): physical ease comes easily.";
      if (pts >= 2) return "Neutral Yonis (" + ya + " and " + yb + "): closeness grows with time.";
      if (pts >= 1) return "Different instincts (" + ya + " and " + yb + "): go at a pace you both like.";
      return "Opposite Yonis (" + ya + " and " + yb + "): be patient with each other’s rhythm.";
    }
    if (name === "Graha Maitri") {
      var la = RASHIS[a.rashi][2], lb = RASHIS[b.rashi][2];
      if (la === lb) return "The same Moon lord, " + la + ": you think alike.";
      if (pts >= 5) return la + " and " + lb + " are friends: you think alike.";
      if (pts >= 4) return la + " and " + lb + " get on: easy to understand each other.";
      if (pts >= 3) return la + " and " + lb + " are neutral: you’ll learn each other’s way of thinking.";
      return la + " and " + lb + " don’t get on: explain, don’t assume.";
    }
    if (name === "Gana") {
      var ga = NAKS[a.nak][2], gb = NAKS[b.nak][2];
      if (ga === gb) return "Same nature, " + ga + ": at ease with each other.";
      if (pts >= 5) return ga + " and " + gb + ": gentle with each other.";
      return ga + " and " + gb + ": different temperaments, give each other room.";
    }
    if (name === "Bhakoot") {
      var d = mod(girl.rashi - boy.rashi, 12) + 1;
      return pts >= 7 ? "Your Moon signs sit well together: good for family and money." : "Your Moon signs sit " + BHAKOOT_BAD[d] + ": plan money and family together.";
    }
    if (name === "Nadi") return pts >= 8 ? "Different Nadi: no Nadi dosha." : "Same Nadi (" + NAKS[a.nak][3] + "): see the doshas below.";
    return "";
  }

  function moonInfo(c) {
    var r = c.rashi, n = c.nak;
    return { rashi: RASHIS[r][0], rashiEnglish: RASHIS[r][1], glyph: RASHIS[r][4], nakshatra: NAKS[n][1], nakKey: NAKS[n][0],
             pada: c.pada || 0, lord: RASHIS[r][2], gana: NAKS[n][2], nadi: NAKS[n][3], yoni: NAKS[n][4] };
  }

  function moonOf(c, rashi, nak) {
    var given = rashi != null;
    return { rashi: given ? rashi : c.rashi, nak: given ? nak : c.nak, lon: given ? null : c.lon, pada: given ? null : c.pada };
  }

  /* fates_astro.match_charts without Manglik (that needs Mars and the Lagna, which the app has). a = the viewer.
     Genders "male" / "female": roles follow gender; same or unknown genders average both directions. */
  function match(a, b, aGender, bGender) {
    var orientations;
    if (aGender === "male" && bGender !== "male") orientations = [true];
    else if (bGender === "male" && aGender !== "male") orientations = [false];
    else if (aGender === "female" && bGender !== "female") orientations = [false];
    else orientations = [true, false];

    var ma = moonOf(a), mb = moonOf(b);
    function score(x, y) {
      var runs = orientations.map(function (o) { return o ? kootaPoints(x, y) : kootaPoints(y, x); }), out = {};
      KOOTAS.forEach(function (k) { out[k] = runs.reduce(function (s, r) { return s + r[k]; }, 0) / runs.length; });
      return out;
    }
    function sum(p) { return KOOTAS.reduce(function (s, k) { return s + p[k]; }, 0); }

    var pts = score(ma, mb), total = sum(pts), totals = [];
    (a.options || [[a.rashi, a.nak]]).forEach(function (oa) {
      (b.options || [[b.rashi, b.nak]]).forEach(function (ob) { totals.push(sum(score(moonOf(a, oa[0], oa[1]), moonOf(b, ob[0], ob[1])))); });
    });
    var aIsBoy = orientations[0], boy = aIsBoy ? ma : mb, girl = aIsBoy ? mb : ma;
    var kootas = KOOTAS.map(function (k) {
      return { name: k, label: KOOTA_LABEL[k], points: pts[k], max: KOOTA_MAX[k], meaning: meaning(k, pts[k], boy, girl, aIsBoy) };
    });
    var doshas = [nadiDosha(ma, mb), bhakootDosha(boy, girl)];
    var g = ganaDosha(pts);
    if (g) doshas.push(g);
    return {
      total: Math.round(total * 2) / 2, totalMin: Math.min.apply(null, totals), totalMax: Math.max.apply(null, totals),
      precision: a.precision === "time" && b.precision === "time" ? "time" : "date",
      kootas: kootas, doshas: doshas, aMoon: moonInfo(a), bMoon: moonInfo(b)
    };
  }

  // ------------------------------------------------------------------ love luck today (cartoon tools/daily.py)
  var LINES = {
    1: ["The Moon is in your sign. Feelings run high, so say what you need, gently.", "You're glowing today. Let someone see the real you."],
    2: ["Choose soft words today. Family may ask about your plans.", "A sweet text lands better than a long debate today."],
    3: ["A brave day. Send that message you've been drafting.", "Your courage is up. It's a good day to make the first move."],
    4: ["Stay cosy. Call someone who feels like home.", "A quiet night in beats a big plan today."],
    5: ["Flirty, playful energy. Enjoy it, but don't overthink replies.", "Romance is in the air. Keep it light and fun."],
    6: ["Small hurdles clear easily. Sort out that little misunderstanding.", "A good day to fix what's been bugging you in love."],
    7: ["A lovely day for one-to-one time with someone special.", "Partnership energy is strong. Plan a proper chai date."],
    8: ["Chandrashtama day. Keep big talks for later and be gentle with yourself.", "A sensitive day. Don't take silence personally."],
    9: ["An elder's advice about love could be surprisingly useful.", "Think about what you really want in a partner."],
    10: ["Work may take over. A short sweet message keeps the spark alive.", "Busy day. Show love with small, thoughtful actions."],
    11: ["A lucky social day. A friend could introduce someone new.", "Wishes come closer. Say yes to the group plan."],
    12: ["Low-energy day. Rest, and don't spend to impress anyone.", "Let go of an old feeling. Tomorrow feels lighter."]
  };
  var HEARTS = { 1: 4, 2: 3, 3: 4, 4: 3, 5: 3, 6: 4, 7: 5, 8: 1, 9: 3, 10: 4, 11: 5, 12: 2 };

  /* Today's date in India. */
  function istToday(now) {
    var t = new Date((now || new Date()).getTime() + 330 * 60000);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
  }

  function fmtTime(date) {
    var t = new Date(date.getTime() + 330 * 60000), h = t.getUTCHours(), mi = t.getUTCMinutes();
    return ((h % 12) || 12) + ":" + (mi < 10 ? "0" : "") + mi + (h < 12 ? " AM" : " PM");
  }

  function loveLuck(day) {
    day = day || istToday();
    var sign = function (date) { return Math.floor(siderealMoon(date) / 30); };
    // daily.py scans 06:00 to midnight a minute at a time, so its last step looks one minute past midnight
    var t6 = ist(day.y, day.m, day.d, 6, 0).getTime(), t24 = t6 + 18 * 3600e3 + 60e3;
    var s0 = sign(new Date(t6)), change = null;
    for (var t = t6; t < t24 && !change; t += 600e3) {
      var t2 = Math.min(t + 600e3, t24);
      if (sign(new Date(t2)) !== s0) {
        var lo = t, hi = t2;
        while (hi - lo > 1000) { var mid = (lo + hi) / 2; if (sign(new Date(mid)) === s0) lo = mid; else hi = mid; }
        var at = new Date(Math.floor((hi + 30e3) / 60e3) * 60e3);
        change = { at: at, time: fmtTime(at), to: sign(new Date(t2)) };
      }
    }
    // the sign ruling most of the waking day (06-22 IST); a tie goes to the earlier sign, as Python's max() does
    var counts = {}, seen = [];
    for (var h = 6; h < 22; h++) {
      var s = sign(ist(day.y, day.m, day.d, h, 30));
      if (!(s in counts)) { counts[s] = 0; seen.push(s); }
      counts[s] += 1;
    }
    var main = seen.reduce(function (best, x) { return counts[x] > counts[best] ? x : best; }, seen[0]);
    var caution = {};
    if (change) for (var r = 0; r < 12; r++) {
      if (mod(s0 - r, 12) + 1 === 8) caution[r] = "Go slow until " + change.time + " (Chandrashtama)";
      if (mod(change.to - r, 12) + 1 === 8) caution[r] = "Go slow from " + change.time + " (Chandrashtama)";
    }
    var ordinal = Math.floor(Date.UTC(day.y, day.m - 1, day.d) / 86400000) + 719163;   // Python date.toordinal()
    var rashis = RASHIS.map(function (rs, i) {
      var house = mod(main - i, 12) + 1;
      return { index: i, name: rs[0], english: rs[1], glyph: rs[4], house: house, hearts: HEARTS[house],
               line: LINES[house][ordinal % 2], caution: caution[i] || null };
    });
    var lucky = rashis.filter(function (x) { return x.hearts === 5 && !x.caution; });
    var crowned = lucky.length ? lucky.slice(0, 2)
      : rashis.filter(function (x) { return !x.caution; }).sort(function (x, y) { return y.hearts - x.hearts || x.index - y.index; }).slice(0, 1);
    var moonNow = moonFacts(siderealMoon(new Date(t6)));
    return { day: day, mainSign: RASHIS[main][0], moonSign6am: RASHIS[s0][0], moonNak6am: NAKS[moonNow.nak][1],
             change: change ? { time: change.time, to: RASHIS[change.to][0] } : null,
             rashis: rashis, crowned: crowned.map(function (x) { return x.index; }) };
  }

  window.Astro = {
    siderealMoon: siderealMoon, ist: ist, moonFacts: moonFacts, chart: chart, daySegments: daySegments,
    kootaPoints: kootaPoints, match: match, moonInfo: moonInfo, loveLuck: loveLuck, istToday: istToday, fmtTime: fmtTime,
    NAKS: NAKS, RASHIS: RASHIS, KOOTAS: KOOTAS, KOOTA_MAX: KOOTA_MAX, KOOTA_LABEL: KOOTA_LABEL
  };
  if (typeof module !== "undefined") module.exports = window.Astro;
})();
