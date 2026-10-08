/* Sharing for the free tools: a picture drawn in the browser (canvas), shared with the text and link through the
   phone's share sheet (WhatsApp, Instagram, Telegram...), or WhatsApp with the link when files can't be shared. */
(function () {
  var SITE = "https://www.shaadiparrot.com";
  var PLUM = "#41213E", PLUM2 = "#6E5268", ROSE = "#C42F40";
  var FONTS = ['800 64px "Baloo 2"', '800 40px "Plus Jakarta Sans"', '700 34px "Plus Jakarta Sans"', '600 34px "Plus Jakarta Sans"'];

  function loadImg(src) {
    return new Promise(function (ok) {
      var im = new Image();
      im.onload = function () { ok(im); };
      im.onerror = function () { ok(null); };
      im.src = src;
    });
  }

  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(FONTS.map(function (f) { return document.fonts.load(f).catch(function () {}); }));
  }

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  function heart(c, x, y, s, color) {   // centred at x, y; s = width
    c.save(); c.translate(x - s / 2, y - s * .45); c.scale(s / 64, s / 64);
    c.beginPath();
    c.moveTo(32, 57); c.bezierCurveTo(29, 54, 3, 38, 1.3, 20.6); c.bezierCurveTo(0, 9, 8, 1, 18, 1);
    c.bezierCurveTo(24.2, 1, 29, 4.3, 32, 9.4); c.bezierCurveTo(35, 4.3, 39.8, 1, 46, 1);
    c.bezierCurveTo(56, 1, 64, 9, 62.7, 20.6); c.bezierCurveTo(61, 38, 35, 54, 32, 57); c.closePath();
    c.fillStyle = color; c.fill(); c.restore();
  }

  function fit(c, text, weightFamily, size, maxW) {
    while (size > 18) { c.font = weightFamily.replace("{s}", size); if (c.measureText(text).width <= maxW) break; size -= 2; }
    return size;
  }

  function wrap(c, text, maxW) {
    var words = text.split(" "), lines = [], cur = "";
    words.forEach(function (w) {
      var t = cur ? cur + " " + w : w;
      if (c.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    return lines;
  }

  /* The common frame: sky, title pill, white card; draw(c) paints inside. Returns a Promise of a JPEG Blob or null
     (null when the browser can't export, e.g. a page opened from a file). */
  function card(opts) {
    var root = document.documentElement.getAttribute("data-root") || "";
    var extra = opts.images || {}, keys = Object.keys(extra);
    return Promise.all([fontsReady(), loadImg(root + (opts.mithu || "assets/img/mithu_heart.webp")), loadImg(root + "assets/img/logo.webp")]
      .concat(keys.map(function (k) { return loadImg(root + extra[k]); })))
      .then(function (r) {
        var img = {};
        keys.forEach(function (k, i) { img[k] = r[3 + i]; });
        var W = 1080, H = 1350, cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        var c = cv.getContext("2d");
        var g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#F47A85"); g.addColorStop(.55, "#F9A08E"); g.addColorStop(1, "#FDD6B0");
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        // sparkles
        c.fillStyle = "rgba(255,255,255,.55)";
        [[90, 90, 10], [990, 150, 14], [130, 1230, 12], [960, 1010, 9], [60, 600, 8]].forEach(function (s) { c.beginPath(); c.arc(s[0], s[1], s[2], 0, 7); c.fill(); });
        // title
        var logo = r[2];
        c.font = '800 60px "Baloo 2"';
        var tw = c.measureText(opts.title).width, tx = (W - tw - 70) / 2;
        if (logo) { c.save(); rr(c, tx, 52, 56, 56, 15); c.clip(); c.drawImage(logo, tx, 52, 56, 56); c.restore(); }
        c.fillStyle = PLUM; c.textBaseline = "alphabetic"; c.textAlign = "left";
        c.fillText(opts.title, tx + 70, 102);
        c.font = '700 30px "Plus Jakarta Sans"'; c.textAlign = "center"; c.fillStyle = PLUM;
        c.fillText(opts.kicker || "by Mithu, the parrot astrologer", W / 2, 152);
        // card
        c.save(); c.shadowColor = "rgba(122,38,60,.28)"; c.shadowBlur = 40; c.shadowOffsetY = 18;
        rr(c, 60, 196, W - 120, 980, 56); c.fillStyle = "#FFFBF9"; c.fill(); c.restore();
        opts.draw(c, { W: W, H: H, PLUM: PLUM, PLUM2: PLUM2, ROSE: ROSE, heart: heart, fit: fit, wrap: wrap, rr: rr, img: img });
        // Mithu and the footer
        var m = r[1];
        if (m) { var mh = 330, mw = m.width * mh / m.height; c.drawImage(m, W - mw - 26, H - mh - 18, mw, mh); }
        c.textAlign = "left"; c.fillStyle = PLUM;
        c.font = '800 36px "Plus Jakarta Sans"'; c.fillText(opts.footer1 || "Check yours, free:", 80, 1252);
        c.font = '700 32px "Plus Jakarta Sans"'; c.fillStyle = ROSE; c.fillText(opts.footer2, 80, 1298);
        return new Promise(function (ok) {
          try { cv.toBlob(function (b) { ok(b); }, "image/jpeg", .9); } catch (e) { ok(null); }
        });
      }).catch(function () { return null; });
  }

  function waLink(text) { return "https://wa.me/?text=" + encodeURIComponent(text); }

  /* Share sheet with the picture when the phone can, otherwise WhatsApp with the text and link. */
  function share(blob, filename, text) {
    var file = null;
    try { if (blob && window.File) file = new File([blob], filename, { type: "image/jpeg" }); } catch (e) {}
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], text: text }).catch(function (e) {
        if (!(e && e.name === "AbortError")) window.open(waLink(text), "_blank", "noopener");
      });
    }
    window.open(waLink(text), "_blank", "noopener");
    return Promise.resolve();
  }

  function save(blob, filename, fallbackUrl) {
    var a = document.createElement("a");
    if (blob) { a.href = URL.createObjectURL(blob); setTimeout(function () { URL.revokeObjectURL(a.href); }, 30000); }
    else a.href = fallbackUrl;
    a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  }

  function copy(text, note) {
    function done(msg) { if (note) note.textContent = msg; }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done("Copied. Paste it anywhere."); }, function () { done(text); });
    } else done(text);
  }

  window.ToolShare = { SITE: SITE, card: card, share: share, save: save, copy: copy, waLink: waLink, heart: heart };
})();
