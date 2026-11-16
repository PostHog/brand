// Plain DOM code: ImageMaker.tsx injects MARKUP into the page, then calls mount(), which returns
// a cleanup function. env.host (image-maker/host.ts) provides storage, uploads and downloads, and
// env.data the maker's data (image-maker/data.ts).
/* eslint-disable */
// oxlint-disable
export const MARKUP =
  '<div class="main">\n    <div class="maker-head">\n        <div class="mh-text page-header">\n          <a class="eyebrow" href="/tools/images" data-mk-home title="All image makers">image makers</a>\n          <h1>Event images</h1>\n          <p class="mh-desc">Square event posts with a calendar tile, time, location, partner logos and a hoggie or your own picture.</p>\n        </div>\n        <div class="mh-side">\n          <div class="dl">\n    <label for="dlSize" hidden>Download size</label>\n    <select id="dlSize" title="Download size">\n      <option value="1">1080 \u00d7 1080</option>\n      <option value="2">2160 \u00d7 2160 (2\u00d7)</option>\n    </select>\n    <button class="btn btn-primary" id="downloadBtn" type="button">\n      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>\n      Download PNG\n    </button>\n    </div>\n          <div class="mh-status"><span class="doc-name" id="docName">Untitled event</span><span class="save-state" id="saveState" aria-live="polite"></span></div>\n        </div>\n      </div>\n    <nav class="list" aria-label="Event images">\n      <div class="list-head">\n        <button class="btn new-btn" id="newBtn" type="button">\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>\n          New image\n        </button>\n        <span class="list-label" id="listLabel">Images</span>\n      </div>\n      <div id="notice"></div>\n      <ol class="thumbs" id="thumbs"></ol>\n    </nav>\n\n    <main class="stage">\n      <div class="canvas-wrap"><canvas id="stage" width="1080" height="1080" aria-label="Event image preview"></canvas></div>\n      <p class="stage-hint" id="stageHint">Click the hoggie on the image to choose a different one.</p>\n    </main>\n\n    <aside class="props" aria-label="Image settings">\n      <section class="mk-section">\n        <h2>Event</h2>\n        <div class="field">\n          <label for="fTitle">Headline</label>\n          <textarea class="input" id="fTitle" rows="4" spellcheck="true"></textarea>\n          <span class="hint">Press Enter to start a new line.</span>\n          <span class="hint">To make only some words bold, put two stars on each side: <b>**FREE**</b> PIZZA. The other words go lighter and smaller. Without stars, the whole headline stays bold.</span>\n        </div>\n        <div class="field">\n          <span class="lbl" id="lblStyle">Headline fit</span>\n          <div class="seg" role="group" aria-labelledby="lblStyle">\n            <button type="button" data-headline="fit" aria-pressed="true">Fill the width</button>\n            <button type="button" data-headline="even" aria-pressed="false">Same size</button>\n          </div>\n        </div>\n        <div class="field">\n          <label for="fHlScale">Headline size</label>\n          <div class="range-row"><input id="fHlScale" type="range" min="60" max="150" step="5"><output id="oHlScale" for="fHlScale"></output></div>\n        </div>\n        <div class="field">\n          <label class="switch"><input id="fGlow" type="checkbox"> <span>Headline glow</span></label>\n          <span class="hint" id="glowHint"></span>\n        </div>\n        <div class="field">\n          <label for="fDate">Date</label>\n          <input class="input" id="fDate" type="date">\n        </div>\n        <div class="row2">\n          <div class="field"><label for="fStart">Starts</label><input class="input" id="fStart" type="time"></div>\n          <div class="field"><label for="fEnd">Ends</label><input class="input" id="fEnd" type="time"></div>\n        </div>\n        <div class="field">\n          <label for="fTz">Time zone <span class="hint">(optional)</span></label>\n          <input class="input" id="fTz" type="text" placeholder="e.g. PT, GMT, CET" autocomplete="off">\n        </div>\n        <div class="field">\n          <label for="fLoc">Location</label>\n          <textarea class="input" id="fLoc" rows="3" placeholder="Venue&#10;Street address&#10;City" autocomplete="off"></textarea>\n          <span class="hint">Press Enter for a new line, up to 4 lines.</span>\n        </div>\n      </section>\n\n      <section class="mk-section">\n        <h2>Hoggie</h2>\n        <div class="hog-card">\n          <button class="pic" id="hogPic" type="button" aria-label="Choose hoggie"></button>\n          <div class="info">\n            <span class="name" id="hogName">No hoggie yet</span>\n            <div class="actions">\n              <button class="btn btn-sm" id="chooseHog" type="button">Choose hoggie</button>\n              <button class="btn btn-sm" id="removeHog" type="button">Remove</button>\n            </div>\n          </div>\n        </div>\n        <div class="field">\n          <label for="fSize">Size</label>\n          <div class="range-row"><input id="fSize" type="range" min="50" max="200" step="5"><output id="oSize" for="fSize"></output></div>\n        </div>\n        <div class="field">\n          <label for="fX">Move left / right</label>\n          <div class="range-row"><input id="fX" type="range" min="-50" max="50" step="1"><output id="oX" for="fX"></output></div>\n        </div>\n        <div class="field">\n          <label for="fY">Move down / up</label>\n          <div class="range-row"><input id="fY" type="range" min="-50" max="50" step="1"><output id="oY" for="fY"></output></div>\n        </div>\n        <label class="switch"><input id="fFlip" type="checkbox"> Flip to face the other way</label>\n      </section>\n\n      <section class="mk-section">\n        <h2>Your image</h2>\n        <span class="hint">Add your own picture next to the hoggie or instead of it. They can overlap. PNG with a transparent background works best.</span>\n        <div class="hog-card">\n          <label class="pic" id="photoPic" for="addPhoto" aria-label="Upload an image"></label>\n          <div class="info">\n            <span class="name" id="photoName">No image yet</span>\n            <div class="actions">\n              <label class="btn btn-sm" id="addPhotoLbl" for="addPhoto">Upload image</label>\n              <button class="btn btn-sm" id="removePhoto" type="button">Remove</button>\n            </div>\n          </div>\n        </div>\n        <input id="addPhoto" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" hidden>\n        <span class="hint" id="photoMsg"></span>\n        <div id="photoControls" class="section-inner">\n          <div class="field">\n            <label for="pSize">Size</label>\n            <div class="range-row"><input id="pSize" type="range" min="20" max="200" step="5"><output id="opSize" for="pSize"></output></div>\n          </div>\n          <div class="field">\n            <label for="pX">Move left / right</label>\n            <div class="range-row"><input id="pX" type="range" min="-60" max="60" step="1"><output id="opX" for="pX"></output></div>\n          </div>\n          <div class="field">\n            <label for="pY">Move down / up</label>\n            <div class="range-row"><input id="pY" type="range" min="-60" max="60" step="1"><output id="opY" for="pY"></output></div>\n          </div>\n          <label class="switch"><input id="pFlip" type="checkbox"> Flip</label>\n          <label class="switch"><input id="pFront" type="checkbox"> In front of the hoggie</label>\n        </div>\n      </section>\n\n      <section class="mk-section">\n        <h2>Colors</h2>\n        <div class="field"><span class="lbl" id="lblBg">Background</span><div class="swatches" id="swBg" role="group" aria-labelledby="lblBg"></div></div>\n        <div class="field"><span class="lbl" id="lblCal">Calendar</span><div class="swatches" id="swCal" role="group" aria-labelledby="lblCal"></div></div>\n        <div class="field">\n          <label class="switch"><input id="fCalFlip" type="checkbox"> <span>Flip month text</span></label>\n          <span class="hint" id="calFlipHint"></span>\n        </div>\n        <div class="field"><span class="lbl" id="lblFoot">Footer</span><div class="swatches" id="swFoot" role="group" aria-labelledby="lblFoot"></div></div>\n        <div class="field">\n          <span class="lbl" id="lblLogo">PostHog logo</span>\n          <div class="seg" role="group" aria-labelledby="lblLogo">\n            <button type="button" data-logo="auto" aria-pressed="true">Auto</button>\n            <button type="button" data-logo="white" aria-pressed="false">White</button>\n            <button type="button" data-logo="black" aria-pressed="false">Black</button>\n          </div>\n          <span class="hint" id="logoHint"></span>\n        </div>\n        <div class="field">\n          <label class="switch"><input id="fDark" type="checkbox"> <span>Dark text</span></label>\n          <span class="hint">Text is white unless this is on. Use it on light colors like yellow, lemon or lime.</span>\n        </div>\n      </section>\n\n      <section class="mk-section">\n        <h2>Partner logos</h2>\n        <span class="hint">Up to 4 logos sit next to PostHog in the footer. SVG or PNG with a transparent background works best.</span>\n        <div class="logos" id="logoList"></div>\n        <div class="actions">\n          <label class="btn btn-sm" id="addLogoLbl" for="addLogo">Add logo</label>\n          <input id="addLogo" type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" hidden>\n        </div>\n        <span class="hint" id="logoMsg"></span>\n      </section>\n\n      <section class="mk-section">\n        <h2>This image</h2>\n        <div class="actions" id="imgActions">\n          <button class="btn btn-sm" id="dupBtn" type="button">Duplicate</button>\n          <button class="btn btn-sm danger" id="delBtn" type="button">Delete</button>\n        </div>\n      </section>\n    </aside>\n  </div>\n\n<dialog class="gallery" id="gallery" aria-labelledby="gTitle">\n  <div class="g-wrap">\n    <div class="g-head">\n      <div class="g-title">\n        <h2 id="gTitle">Choose a hoggie</h2>\n        <button class="icon-btn" id="gClose" type="button" aria-label="Close">\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>\n        </button>\n      </div>\n      <div class="g-search">\n        <label for="gQuery" class="hint" hidden>Search hoggies</label>\n        <input class="input" id="gQuery" type="search" placeholder="Search: coffee, detective, celebrate, red shirt\u2026" autocomplete="off">\n        <span class="g-count" id="gCount"></span>\n      </div>\n    </div>\n    <div class="g-grid" id="gGrid"></div>\n  </div>\n</dialog>\n\n'

export function mount(env) {
  "use strict"
  var __listeners = []
  function __on(target, type, fn) {
    target.addEventListener(type, fn)
    __listeners.push([target, type, fn])
  }

  // ---------- Brand data ----------
  var BRAND = {
    blue: [205, 84, 49, 38],
    yellow: [37, 100, 55, 45],
    teal: [165, 67, 56, 44],
    purple: [283, 63, 52, 42],
    "corn-blue": [195, 74, 52, 39],
    coral: [358, 100, 64, 47],
    tangerine: [17, 100, 55, 50],
    lime: [75, 72, 46, 40],
    green: [132, 54, 53, 45],
    violet: [250, 100, 65, 59],
    cobalt: [220, 100, 51, 41],
    lemon: [47, 100, 55, 47],
  }
  var COLOR_KEYS = Object.keys(BRAND)
  var MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  var UI_FONT = '"RoundHog", system-ui, -apple-system, "Segoe UI", sans-serif'
  var HEAD_FONT = '"Squeak", "RoundHog", system-ui, sans-serif'

  var DATA = { fonts: {}, logos: {}, hogs: {} } // filled from app-data.json
  var state = {
    items: [],
    currentId: null,
    db: null,
    assets: null,
    downloads: null,
    live: false,
    pending: {},
    confirmDelete: false,
  }

  function $(id) {
    return document.getElementById(id)
  }
  function lum(h, s, l) {
    s /= 100
    l /= 100
    var a = s * Math.min(l, 1 - l)
    function f(n) {
      var k = (n + h / 30) % 12
      return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
    }
    function lin(c) {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * lin(f(0)) + 0.7152 * lin(f(8)) + 0.0722 * lin(f(4))
  }
  function swatch(key, step) {
    var c = BRAND[key] || BRAND.blue
    var l = step === 700 ? c[3] : c[2]
    return {
      css: "hsl(" + c[0] + ", " + c[1] + "%, " + l + "%)",
      light: 1.05 / (lum(c[0], c[1], l) + 0.05) >= 3,
    }
  }
  function footSwatch(key) {
    return key === "white" ? { css: "#ffffff", light: false } : swatch(key, 500)
  }

  // ---------- Formatting ----------
  function parseDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "")
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null
  }
  function fmtTime(t) {
    var m = /^(\d{1,2}):(\d{2})/.exec(t || "")
    if (!m) return ""
    var h = +m[1],
      mm = m[2],
      ap = h >= 12 ? "PM" : "AM"
    h = h % 12
    if (h === 0) h = 12
    return h + ":" + mm + " " + ap
  }
  function timeLine(d) {
    var s = fmtTime(d.start),
      e = fmtTime(d.end)
    var t = s && e ? s + " – " + e : s || e
    if (!t) return ""
    return d.tz ? t + " " + d.tz : t
  }
  // The whole headline on one line (line breaks become spaces).
  function firstLine(d) {
    return (
      String(d.title || "")
        .replace(/\*\*/g, "")
        .split(/\n|\|/)
        .map(function (t) {
          return t.trim()
        })
        .filter(Boolean)
        .join(" ") || "Untitled event"
    )
  }
  function shortDate(d) {
    var dt = parseDate(d.date)
    return dt
      ? DAYS[dt.getDay()] + ", " + MONTHS[dt.getMonth()].slice(0, 3) + " " + dt.getDate()
      : "No date"
  }
  function isoPlus(days) {
    var t = new Date()
    t.setDate(t.getDate() + days)
    return (
      t.getFullYear() +
      "-" +
      String(t.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(t.getDate()).padStart(2, "0")
    )
  }
  function slug(s) {
    return (
      String(s)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "event"
    )
  }
  function uid() {
    return "img_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }

  function blank() {
    var now = Date.now()
    return {
      title: "Your event\ntitle goes\nhere",
      headline: "fit",
      date: isoPlus(14),
      start: "18:00",
      end: "21:00",
      tz: "",
      location: "Venue, City",
      bg: "blue",
      cal: "tangerine",
      footer: "white",
      hog: "",
      hogSize: 100,
      hogX: 0,
      hogY: 0,
      flip: false,
      hlScale: 100,
      glow: false,
      logos: [],
      createdAt: now,
      updatedAt: now,
    }
  }

  // ---------- Images ----------
  var imgCache = {}
  var redrawQueued = false
  function img(url) {
    if (!url) return null
    var c = imgCache[url]
    if (c) return c.ok ? c.el : null
    var el = new Image()
    c = imgCache[url] = { el: el, ok: false }
    el.onload = function () {
      c.ok = el.naturalWidth > 0 && el.naturalHeight > 0
      queueRedraw()
    }
    el.onerror = function () {
      c.failed = true
    }
    // Hoggie SVGs often have only a viewBox and no width/height, so the canvas can't size
    // or draw them. Give each SVG an explicit size before loading it for drawing.
    fetch(url)
      .then(function (r) {
        var ct = r.headers.get("content-type") || ""
        return ct.indexOf("svg") >= 0 ? r.text() : null
      })
      .then(function (txt) {
        el.src = txt ? sizedSvgUrl(txt) || url : url
      })
      .catch(function () {
        el.src = url
      })
    return null
  }
  function sizedSvgUrl(txt) {
    var m = /<svg\b[^>]*>/i.exec(txt)
    if (!m) return null
    var tag = m[0]
    var vb = /viewBox\s*=\s*["']\s*[-\d.eE]+[\s,]+[-\d.eE]+[\s,]+([\d.eE]+)[\s,]+([\d.eE]+)/i.exec(
      tag,
    )
    var wA = /\swidth\s*=\s*["']\s*([\d.]+)(px)?\s*["']/i.exec(tag),
      hA = /\sheight\s*=\s*["']\s*([\d.]+)(px)?\s*["']/i.exec(tag)
    var w = wA ? +wA[1] : vb ? +vb[1] : 0,
      h = hA ? +hA[1] : vb ? +vb[2] : 0
    if (!w || !h) {
      w = 1000
      h = 1000
    }
    var fixed = tag
      .replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*')/gi, "")
      .replace(/^<svg\b/i, '<svg width="' + w + '" height="' + h + '"')
    var out = txt.slice(0, m.index) + fixed + txt.slice(m.index + tag.length)
    try {
      return URL.createObjectURL(new Blob([out], { type: "image/svg+xml" }))
    } catch (e) {
      return null
    }
  }
  function blob(id) {
    return !id ? "" : /^(\/|blob:|data:|https?:)/.test(id) ? id : "/_blob/" + id
  }
  function hogUrl(name) {
    var h = DATA.hogs[name]
    return h ? blob(h.id) : ""
  }

  // ---------- Renderer (1080 × 1080 units) ----------
  var measureCtx = document.createElement("canvas").getContext("2d")
  function setLS(ctx, v) {
    if ("letterSpacing" in ctx) ctx.letterSpacing = v
  }
  // Location: each typed line wraps to the text width; 4 lines at most.
  function locationLines(ctx, d) {
    ctx.font = "600 40px " + UI_FONT
    var out = []
    String(d.location || "")
      .split("\n")
      .map(function (t) {
        return t.trim()
      })
      .filter(Boolean)
      .forEach(function (para) {
        wrapText(ctx, para, 904, 4).forEach(function (l) {
          out.push(l)
        })
      })
    if (out.length > 4) {
      out = out.slice(0, 4)
      out[3] += "…"
    }
    return out
  }
  // Words between ** stay bold; when any are marked, the rest are drawn lighter (faded) and smaller.
  var LIGHT_SCALE = 0.78,
    LIGHT_ALPHA = 0.6
  // Split the headline into lines of words, each word { t, b } (b = bold).
  function headlineWords(raw) {
    var marked = raw.indexOf("**") >= 0,
      bold = !marked,
      lines = [[]]
    raw.split(/(\*\*|\n|\|)/).forEach(function (tok) {
      if (tok === "**") {
        bold = !bold
        return
      }
      if (tok === "\n" || tok === "|") {
        lines.push([])
        return
      }
      var parts = tok.split(/(\s+)/),
        line = lines[lines.length - 1]
      parts.forEach(function (w) {
        if (!w) return
        if (/^\s+$/.test(w)) {
          if (line.length) line[line.length - 1].sp = true
          return
        }
        var prev = line[line.length - 1]
        if (prev && !prev.sp) line.push({ t: w, b: bold, join: true })
        else line.push({ t: w, b: bold })
      })
    })
    return lines
      .filter(function (l) {
        return l.length
      })
      .map(function (l) {
        l[l.length - 1].sp = false
        return l
      })
  }
  function wordsWidth(ctx, words) {
    var w = 0,
      space = ctx.measureText(" ").width
    words.forEach(function (x, i) {
      var k = x.b ? 1 : LIGHT_SCALE
      if (i > 0 && !x.join) w += space * (x.b ? 1 : LIGHT_SCALE)
      w += ctx.measureText(x.t).width * k
    })
    return w
  }
  // The tallest word drawn on a line sets its height, so a line of only light words isn't spaced as if it were bold.
  function lineSize(l) {
    return l.text.some(function (w) {
      return w.b
    })
      ? l.size
      : l.size * LIGHT_SCALE
  }
  function headlineLines(d, maxH) {
    var colW = 680,
      base = 100
    var scale = Math.min(150, Math.max(60, +d.hlScale || 100)) / 100
    var raw = String(d.title || "").toUpperCase()
    var lines = headlineWords(raw)
    var ctx = measureCtx
    ctx.font = "700 " + base + "px " + HEAD_FONT
    setLS(ctx, "-1px")
    if (lines.length === 1 && wordsWidth(ctx, lines[0]) > colW) {
      var cur = [],
        out = []
      lines[0].forEach(function (w) {
        var n = cur.concat([w])
        if (cur.length && !w.join && wordsWidth(ctx, n) > colW) {
          out.push(cur)
          cur = [w]
        } else cur = n
      })
      if (cur.length) out.push(cur)
      lines = out.map(function (l) {
        var c = l.map(function (x) {
          return { t: x.t, b: x.b, join: x.join }
        })
        c[0].join = false
        return c
      })
    }
    var fit = d.headline !== "even"
    var sized = lines.map(function (t) {
      var w = wordsWidth(ctx, t) || 1
      var target = Math.floor((base * colW * 0.98) / w)
      return {
        text: t,
        size: fit ? Math.max(56, Math.min(200, target)) : Math.min(base, Math.max(56, target)),
      }
    })
    // Size slider, then keep every line inside its width: beside the calendar 680, below it 904.
    var yy = 80
    sized.forEach(function (l) {
      var wBase = wordsWidth(ctx, l.text) || 1
      l.size = Math.round(l.size * scale)
      var maxW = yy < 284 ? colW : 904 // beside the calendar (80 + 188 tall + gap)
      var w = (wBase * l.size) / base
      if (w > maxW) l.size = Math.floor((l.size * maxW) / w)
      yy += lineSize(l) * 0.95
    })
    var total = sized.reduce(function (s, l) {
      return s + lineSize(l) * 0.95
    }, 0)
    var cap = maxH || 440
    if (total > cap) {
      var k = cap / total
      sized.forEach(function (l) {
        l.size = Math.floor(l.size * k)
      })
    }
    return sized
  }
  function wrapText(ctx, text, maxW, maxLines) {
    var words = String(text).split(/\s+/).filter(Boolean),
      lines = [],
      cur = ""
    words.forEach(function (w) {
      var n = cur ? cur + " " + w : w
      if (cur && ctx.measureText(n).width > maxW) {
        lines.push(cur)
        cur = w
      } else cur = n
    })
    if (cur) lines.push(cur)
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines)
      lines[maxLines - 1] += "…"
    }
    return lines
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }
  function containRect(im, bx, by, bw, bh, alignBottom) {
    var k = Math.min(bw / im.naturalWidth, bh / im.naturalHeight)
    var w = im.naturalWidth * k,
      h = im.naturalHeight * k
    return { x: bx + (bw - w) / 2, y: alignBottom ? by + bh - h : by + (bh - h) / 2, w: w, h: h }
  }
  var silhouetteCache = {}
  function silhouette(im, color) {
    var key = im.src + color
    if (silhouetteCache[key]) return silhouetteCache[key]
    var c = document.createElement("canvas")
    c.width = im.naturalWidth || 720
    c.height = im.naturalHeight || 720
    var x = c.getContext("2d")
    x.drawImage(im, 0, 0, c.width, c.height)
    x.globalCompositeOperation = "source-in"
    x.fillStyle = color
    x.fillRect(0, 0, c.width, c.height)
    c.naturalWidth = c.width
    c.naturalHeight = c.height
    silhouetteCache[key] = c
    return c
  }

  // Returns the hoggie's hit rectangle (in 1080 units) so the editor can make it clickable.
  function drawPost(ctx, d, editor) {
    var bg = swatch(d.bg, 500),
      cal = swatch(d.cal, 700),
      foot = footSwatch(d.footer)
    var lightText = !d.darkText // white text by default; "Dark text" switches it
    var fg = lightText ? "#ffffff" : "#1e1f23"
    var fgMuted = lightText ? "rgba(255,255,255,0.5)" : "rgba(30,31,35,0.5)"
    ctx.save()
    ctx.fillStyle = bg.css
    ctx.fillRect(0, 0, 1080, 1080)
    ctx.textBaseline = "alphabetic"
    ctx.textAlign = "left"

    // Headline: as big as the space above the details allows
    var tl = timeLine(d)
    var loc = locationLines(ctx, d)
    var detailsH = 55 + 12 + (tl ? 48 : 0) + 40 + 6 + 40 + 48 * loc.length
    var maxHead = 930 - 40 - 80 - 56 - detailsH
    var y = 80
    ctx.fillStyle = fg
    ctx.save()
    if (d.glow && lightText) {
      var unit = ctx.getTransform ? Math.abs(ctx.getTransform().a) : 1 // shadow blur ignores the canvas scale
      ctx.shadowColor = "rgba(255,255,255,0.55)"
      ctx.shadowBlur = 10 * unit
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
    headlineLines(d, maxHead).forEach(function (l) {
      var lh = lineSize(l) * 0.95,
        x = 88,
        by = y + lh * 0.83
      l.text.forEach(function (w, i) {
        var sz = w.b ? l.size : l.size * LIGHT_SCALE
        ctx.font = "700 " + sz + "px " + HEAD_FONT
        setLS(ctx, -0.01 * sz + "px")
        if (i > 0 && !w.join) x += ctx.measureText(" ").width
        ctx.globalAlpha = w.b ? 1 : LIGHT_ALPHA
        ctx.fillText(w.t, x, by)
        x += ctx.measureText(w.t).width
      })
      ctx.globalAlpha = 1
      y += lh
    })
    ctx.restore()
    setLS(ctx, "0px")

    // Calendar
    var dt = parseDate(d.date)
    // Calendar: 176 wide; 76px month strip, 112px day area; 8px corners; 1px #D9D9D9 stroke; shadow X 0 Y 10 blur 3 #000 25%
    var cx = 816,
      cy = 80,
      cw = 176,
      strip = 76,
      ch = strip + 112,
      rad = 8
    var u = ctx.getTransform ? Math.abs(ctx.getTransform().a) : 1 // shadows ignore the canvas scale
    ctx.save()
    ctx.shadowColor = "rgba(0,0,0,0.25)"
    ctx.shadowBlur = 3 * u
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 10 * u // Figma: X 0, Y 10, blur 3, #000 25%
    roundRect(ctx, cx, cy, cw, ch, rad)
    ctx.fillStyle = "#ffffff"
    ctx.fill()
    ctx.restore()
    ctx.save()
    roundRect(ctx, cx, cy, cw, ch, rad)
    ctx.clip()
    ctx.fillStyle = cal.css
    ctx.fillRect(cx, cy, cw, strip)
    ctx.restore()
    roundRect(ctx, cx + 0.5, cy + 0.5, cw - 1, ch - 1, rad)
    ctx.strokeStyle = "#D9D9D9"
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.textAlign = "center"
    var monthLight = d.calFlip ? !lightText : lightText // "Flip month text" sets the month opposite to the rest of the text
    ctx.fillStyle = monthLight ? "#ffffff" : "#1e1f23"
    ctx.font = "700 48px " + UI_FONT
    setLS(ctx, "3px")
    ctx.fillText(
      dt ? MONTHS[dt.getMonth()].slice(0, 3).toUpperCase() : "MMM",
      cx + cw / 2 + 1.5,
      cy + strip / 2 + 17,
    )
    setLS(ctx, "0px")
    ctx.fillStyle = "#394150"
    ctx.font = "700 84px " + UI_FONT
    ctx.fillText(dt ? String(dt.getDate()) : "DD", cx + cw / 2, cy + strip + 86)
    ctx.textAlign = "left"

    // Details
    y += 56
    ctx.fillStyle = fg
    ctx.font = "600 48px " + UI_FONT
    ctx.fillText(
      dt ? DAYS[dt.getDay()] + ", " + MONTHS[dt.getMonth()] + " " + dt.getDate() : "Day, Month DD",
      88,
      y + 42,
    )
    y += 55 + 12
    if (tl) {
      ctx.fillStyle = fgMuted
      ctx.font = "600 40px " + UI_FONT
      ctx.fillText(tl, 88, y + 36)
      y += 48
    }
    y += 40
    ctx.fillStyle = fg
    roundRect(ctx, 88, y, 100, 6, 3)
    ctx.fill()
    y += 6 + 40
    ctx.font = "600 40px " + UI_FONT
    loc.forEach(function (line) {
      ctx.fillText(line, 88, y + 36)
      y += 48
    })

    // Hoggie (above the text, below the footer)
    var hit = null
    var hsize = Math.min(200, Math.max(50, +d.hogSize || 100)) / 100
    var htx = Math.max(-50, Math.min(50, +d.hogX || 0)) * 10.8,
      hty = -Math.max(-50, Math.min(50, +d.hogY || 0)) * 10.8
    var ox = 720,
      oy = 1050 // bottom centre of the 720px hoggie box (right 0, bottom 30)
    function placed(im, o) {
      o = o || {}
      var size = o.size != null ? o.size : hsize,
        tx = o.tx != null ? o.tx : htx,
        ty = o.ty != null ? o.ty : hty,
        flip = o.flip != null ? o.flip : d.flip
      var r = containRect(im, 360, 330, 720, 720, true)
      ctx.save()
      ctx.translate(ox + tx, oy + ty)
      ctx.scale(flip ? -size : size, size)
      ctx.translate(-ox, -oy)
      ctx.drawImage(im, r.x, r.y, r.w, r.h)
      ctx.restore()
      var x1 = ox + tx + (r.x - ox) * size,
        x2 = ox + tx + (r.x + r.w - ox) * size
      return {
        x: Math.min(x1, x2),
        y: oy + ty + (r.y - oy) * size,
        w: Math.abs(x2 - x1),
        h: r.h * size,
      }
    }
    // Your image: same box as the hoggie, with its own size / move / flip; drawn behind or in front.
    var ph0 = d.photo && d.photo.id ? d.photo : null
    var photoIm = ph0 ? img(blob(ph0.id)) : null
    function drawPhoto() {
      if (!photoIm) return
      placed(photoIm, {
        size: Math.min(200, Math.max(20, +ph0.size || 100)) / 100,
        tx: Math.max(-60, Math.min(60, +ph0.x || 0)) * 10.8,
        ty: -Math.max(-60, Math.min(60, +ph0.y || 0)) * 10.8,
        flip: !!ph0.flip,
      })
    }
    if (ph0 && !ph0.front) drawPhoto()
    var hogIm = d.hog ? img(hogUrl(d.hog)) : null
    if (hogIm) hit = placed(hogIm)
    else if (editor && !ph0) {
      var ph = img(hogUrl("Sitting"))
      if (ph) {
        hit = placed(silhouette(ph, bg.light ? "rgba(255,255,255,0.35)" : "rgba(30,31,35,0.28)"))
      } else {
        hit = { x: 600, y: 520, w: 360, h: 400 }
        ctx.save()
        ctx.setLineDash([14, 10])
        ctx.lineWidth = 4
        ctx.strokeStyle = fgMuted
        roundRect(ctx, hit.x, hit.y, hit.w, hit.h, 24)
        ctx.stroke()
        ctx.restore()
      }
      // "Choose hoggie" pill
      var label = "Choose hoggie"
      ctx.font = "700 30px " + UI_FONT
      var pw = ctx.measureText(label).width + 56,
        phh = 64
      var px = Math.min(1080 - pw - 24, Math.max(24, hit.x + hit.w / 2 - pw / 2)),
        py = Math.min(930 - phh - 24, hit.y + hit.h * 0.45)
      ctx.fillStyle = fg
      roundRect(ctx, px, py, pw, phh, 32)
      ctx.fill()
      ctx.fillStyle = bg.css
      ctx.textAlign = "center"
      ctx.fillText(label, px + pw / 2, py + 42)
      ctx.textAlign = "left"
    }

    if (ph0 && ph0.front) drawPhoto()

    // Footer
    ctx.fillStyle = foot.css
    ctx.fillRect(0, 930, 1080, 150)
    var logoWhite = d.logoColor === "white" ? true : d.logoColor === "black" ? false : foot.light
    var logoIm = img(blob(logoWhite ? DATA.logos.white : DATA.logos.black))
    var parts = []
    var n = Math.min(4, (d.logos || []).length)
    var gap = n > 1 ? 40 : 56
    var slotW = n ? Math.min(280, Math.floor((904 - 230 - gap * n) / n)) : 0
    if (logoIm) {
      var lw = (60 * logoIm.naturalWidth) / logoIm.naturalHeight
      parts.push({ im: logoIm, w: lw, h: 60 })
    }
    for (var i = 0; i < n; i++) {
      var li = img(blob(d.logos[i].id))
      if (!li) continue
      var r = containRect(li, 0, 0, slotW, 64, false)
      parts.push({ im: li, w: r.w, h: r.h })
    }
    var total =
      parts.reduce(function (s, p) {
        return s + p.w
      }, 0) +
      gap * Math.max(0, parts.length - 1)
    var x = (1080 - total) / 2
    parts.forEach(function (p) {
      ctx.drawImage(p.im, x, 1005 - p.h / 2, p.w, p.h)
      x += p.w + gap
    })
    ctx.restore()
    return hit
  }

  // ---------- Stage ----------
  var stage = $("stage"),
    sctx = stage.getContext("2d")
  var hogHit = null
  function current() {
    for (var i = 0; i < state.items.length; i++)
      if (state.items[i].id === state.currentId) return state.items[i]
    return null
  }
  function renderStage() {
    var it = current()
    var rect = stage.getBoundingClientRect()
    var dpr = window.devicePixelRatio || 1
    var px = Math.max(300, Math.round((rect.width || 760) * dpr))
    if (stage.width !== px) {
      stage.width = px
      stage.height = px
    }
    sctx.setTransform(px / 1080, 0, 0, px / 1080, 0, 0)
    sctx.clearRect(0, 0, 1080, 1080)
    if (it) hogHit = drawPost(sctx, it.data, true)
  }
  function renderThumb(canvas, data) {
    var dpr = window.devicePixelRatio || 1,
      px = Math.round(170 * dpr)
    if (canvas.width !== px) {
      canvas.width = px
      canvas.height = px
    }
    var c = canvas.getContext("2d")
    c.setTransform(px / 1080, 0, 0, px / 1080, 0, 0)
    drawPost(c, data, false)
  }
  function queueRedraw() {
    if (redrawQueued) return
    redrawQueued = true
    requestAnimationFrame(function () {
      redrawQueued = false
      renderStage()
      document.querySelectorAll(".thumb canvas").forEach(function (cv) {
        var it = byId(cv.dataset.id)
        if (it) renderThumb(cv, it.data)
      })
    })
  }
  function byId(id) {
    for (var i = 0; i < state.items.length; i++) if (state.items[i].id === id) return state.items[i]
    return null
  }
  function toUnits(ev) {
    var r = stage.getBoundingClientRect()
    return {
      x: ((ev.clientX - r.left) * 1080) / r.width,
      y: ((ev.clientY - r.top) * 1080) / r.height,
    }
  }
  function inHog(p) {
    return (
      hogHit &&
      p.y < 930 &&
      p.x >= hogHit.x &&
      p.x <= hogHit.x + hogHit.w &&
      p.y >= hogHit.y &&
      p.y <= hogHit.y + hogHit.h
    )
  }
  stage.addEventListener("mousemove", function (ev) {
    stage.style.cursor = inHog(toUnits(ev)) ? "pointer" : "default"
  })
  stage.addEventListener("click", function (ev) {
    if (inHog(toUnits(ev))) openGallery()
  })
  __on(window, "resize", queueRedraw)

  // ---------- List ----------
  function renderList() {
    var ol = $("thumbs")
    ol.textContent = ""
    $("listLabel").textContent = state.items.length
      ? "Images (" + state.items.length + ")"
      : "Images"
    if (!state.items.length) {
      var p = document.createElement("li")
      p.className = "list-empty"
      p.textContent = state.live
        ? "No images yet. Select New image to make the first one."
        : "Loading images…"
      ol.appendChild(p)
      return
    }
    state.items.forEach(function (it, i) {
      var li = document.createElement("li")
      var b = document.createElement("button")
      b.type = "button"
      b.className = "thumb"
      b.setAttribute("aria-current", it.id === state.currentId ? "true" : "false")
      var num = document.createElement("span")
      num.className = "num"
      num.textContent = String(i + 1)
      var box = document.createElement("span")
      var cv = document.createElement("canvas")
      cv.dataset.id = it.id
      cv.setAttribute("aria-hidden", "true")
      var meta = document.createElement("span")
      meta.className = "meta"
      var t = document.createElement("span")
      t.className = "t"
      t.textContent = firstLine(it.data)
      var dd = document.createElement("span")
      dd.className = "d"
      dd.textContent = shortDate(it.data)
      meta.appendChild(t)
      meta.appendChild(dd)
      box.appendChild(cv)
      box.appendChild(meta)
      b.appendChild(num)
      b.appendChild(box)
      b.addEventListener("click", function () {
        select(it.id)
      })
      li.appendChild(b)
      ol.appendChild(li)
      renderThumb(cv, it.data)
    })
  }

  // ---------- Properties ----------
  function swatchesInto(el, keys, sel, onPick, footer) {
    el.textContent = ""
    keys.forEach(function (k) {
      var b = document.createElement("button")
      b.type = "button"
      b.className = "sw"
      b.style.background = k === "white" ? "#ffffff" : swatch(k, el.id === "swCal" ? 700 : 500).css
      b.setAttribute("aria-label", k.replace("-", " "))
      b.title = k.replace("-", " ")
      b.setAttribute("aria-pressed", k === sel ? "true" : "false")
      b.addEventListener("click", function () {
        onPick(k)
      })
      el.appendChild(b)
    })
  }
  function fillForm() {
    var it = current()
    if (!it) return
    var d = it.data
    if (document.activeElement !== $("fTitle")) $("fTitle").value = d.title
    $("fDate").value = d.date || ""
    $("fStart").value = d.start || ""
    $("fEnd").value = d.end || ""
    if (document.activeElement !== $("fTz")) $("fTz").value = d.tz || ""
    if (document.activeElement !== $("fLoc")) $("fLoc").value = d.location || ""
    var lc = d.logoColor === "white" || d.logoColor === "black" ? d.logoColor : "auto"
    document.querySelectorAll("[data-logo]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.logo === lc ? "true" : "false")
    })
    $("logoHint").textContent =
      lc === "auto"
        ? "Auto picks " +
          (footSwatch(d.footer).light ? "white" : "black") +
          " for this footer color."
        : ""
    document.querySelectorAll("[data-headline]").forEach(function (b) {
      b.setAttribute(
        "aria-pressed",
        b.dataset.headline === (d.headline || "fit") ? "true" : "false",
      )
    })
    $("fSize").value = d.hogSize
    $("oSize").textContent = d.hogSize + "%"
    $("fX").value = d.hogX
    $("oX").textContent = d.hogX
    $("fY").value = d.hogY
    $("oY").textContent = d.hogY
    $("fFlip").checked = !!d.flip
    var hs = +d.hlScale || 100
    $("fHlScale").value = hs
    $("oHlScale").textContent = hs + "%"
    var whiteHead = !d.darkText
    $("fDark").checked = !!d.darkText
    $("fCalFlip").checked = !!d.calFlip
    $("calFlipHint").textContent =
      "The month on the calendar is " +
      ((d.calFlip ? whiteHead : !whiteHead) ? "dark" : "white") +
      ". Turn this on to make it the opposite of the other text."
    $("fGlow").disabled = !whiteHead
    $("fGlow").checked = !!d.glow && whiteHead
    $("glowHint").textContent = whiteHead
      ? "A soft white glow around the headline."
      : "Glow is only for white text. Turn off Dark text in Colors to use it."
    swatchesInto($("swBg"), COLOR_KEYS, d.bg, function (k) {
      edit({ bg: k })
    })
    swatchesInto($("swCal"), COLOR_KEYS, d.cal, function (k) {
      edit({ cal: k })
    })
    swatchesInto($("swFoot"), ["white"].concat(COLOR_KEYS), d.footer, function (k) {
      edit({ footer: k })
    })
    // Hoggie card
    var pic = $("hogPic")
    pic.textContent = ""
    if (d.hog && DATA.hogs[d.hog]) {
      var im = document.createElement("img")
      im.src = hogUrl(d.hog)
      im.alt = ""
      pic.appendChild(im)
      $("hogName").textContent = d.hog
      $("chooseHog").textContent = "Change"
      $("removeHog").hidden = false
    } else {
      pic.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
      $("hogName").textContent = "No hoggie yet"
      $("chooseHog").textContent = "Choose hoggie"
      $("removeHog").hidden = true
    }
    $("stageHint").textContent = d.hog
      ? "Click the hoggie on the image to swap it."
      : d.photo && d.photo.id
        ? "No hoggie. Add one under Hoggie if you like."
        : "Click “Choose hoggie” on the image to add one."
    // Your image
    var ph = d.photo && d.photo.id ? d.photo : null,
      pp = $("photoPic")
    pp.textContent = ""
    if (ph) {
      var pim = document.createElement("img")
      pim.src = blob(ph.id)
      pim.alt = ""
      pp.appendChild(pim)
    } else
      pp.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
    $("photoName").textContent = ph ? ph.name || "Your image" : "No image yet"
    $("addPhotoLbl").textContent = ph ? "Replace" : "Upload image"
    $("addPhotoLbl").hidden = !state.assets
    $("removePhoto").hidden = !ph
    $("photoControls").hidden = !ph
    if (!state.assets) $("photoMsg").textContent = "Uploading needs edit access to this app."
    else if (/needs edit access/.test($("photoMsg").textContent)) $("photoMsg").textContent = ""
    if (ph) {
      var ps = +ph.size || 100,
        px = +ph.x || 0,
        py = +ph.y || 0
      $("pSize").value = ps
      $("opSize").textContent = ps + "%"
      $("pX").value = px
      $("opX").textContent = px
      $("pY").value = py
      $("opY").textContent = py
      $("pFlip").checked = !!ph.flip
      $("pFront").checked = !!ph.front
    }
    // Logos
    var ll = $("logoList")
    ll.textContent = ""
    ;(d.logos || []).forEach(function (lg, i) {
      var row = document.createElement("div")
      row.className = "logo-item"
      var lp = document.createElement("span")
      lp.className = "lp"
      var li = document.createElement("img")
      li.src = blob(lg.id)
      li.alt = ""
      lp.appendChild(li)
      var ln = document.createElement("span")
      ln.className = "ln"
      ln.textContent = lg.name || "Logo " + (i + 1)
      var rm = document.createElement("button")
      rm.type = "button"
      rm.className = "icon-btn"
      rm.setAttribute("aria-label", "Remove " + (lg.name || "logo"))
      rm.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
      rm.addEventListener("click", function () {
        var a = d.logos.slice()
        a.splice(i, 1)
        edit({ logos: a })
      })
      row.appendChild(lp)
      row.appendChild(ln)
      row.appendChild(rm)
      ll.appendChild(row)
    })
    var full = (d.logos || []).length >= 4
    $("addLogoLbl").hidden = full || !state.assets
    $("logoMsg").textContent = !state.assets
      ? "Adding logos needs edit access to this app."
      : full
        ? "That’s the maximum of 4 logos."
        : ""
    $("docName").textContent = firstLine(d)
    renderDelete()
  }
  function renderDelete() {
    var box = $("imgActions")
    box.textContent = ""
    function btn(label, cls, fn) {
      var b = document.createElement("button")
      b.type = "button"
      b.className = "btn btn-sm " + cls
      b.textContent = label
      b.addEventListener("click", fn)
      box.appendChild(b)
      return b
    }
    if (state.confirmDelete) {
      btn("Yes, delete this image", "danger", function () {
        state.confirmDelete = false
        removeCurrent()
      })
      btn("Cancel", "", function () {
        state.confirmDelete = false
        renderDelete()
      }).focus()
    } else {
      btn("Duplicate", "", duplicate)
      btn("Delete", "danger", function () {
        state.confirmDelete = true
        renderDelete()
      })
    }
  }

  // ---------- Editing & saving ----------
  var saveTimers = {}
  function setSave(t) {
    $("saveState").textContent = t
  }
  function edit(patch, opts) {
    var it = current()
    if (!it) return
    // Saved images arrive from the store as read-only objects, so always edit a fresh copy.
    var next = JSON.parse(JSON.stringify(it.data || {}))
    Object.keys(patch).forEach(function (k) {
      next[k] = patch[k]
    })
    next.updatedAt = Date.now()
    it.data = next
    if (!opts || !opts.noForm) fillForm()
    queueRedraw()
    var t = document.querySelector('.thumb[aria-current="true"] .t')
    if (t) t.textContent = firstLine(it.data)
    var dd = document.querySelector('.thumb[aria-current="true"] .d')
    if (dd) dd.textContent = shortDate(it.data)
    persist(it)
  }
  function persist(it) {
    if (!state.db) {
      return
    }
    state.pending[it.id] = true
    setSave("Saving…")
    clearTimeout(saveTimers[it.id])
    saveTimers[it.id] = setTimeout(function () {
      state.db
        .doc("images/" + it.id)
        .set(JSON.parse(JSON.stringify(it.data)))
        .then(
          function () {
            delete state.pending[it.id]
            setSave("All changes saved")
          },
          function () {
            delete state.pending[it.id]
            setSave("Couldn’t save. Check your connection and try again.")
          },
        )
    }, 450)
  }
  function select(id) {
    state.currentId = id
    state.confirmDelete = false
    renderList()
    fillForm()
    queueRedraw()
  }
  function addItem(data) {
    var it = { id: uid(), data: data }
    state.items.unshift(it)
    select(it.id)
    persist(it)
  }
  function duplicate() {
    var it = current()
    if (!it) return
    var d = JSON.parse(JSON.stringify(it.data))
    d.createdAt = d.updatedAt = Date.now()
    addItem(d)
  }
  function removeCurrent() {
    var it = current()
    if (!it) return
    var idx = state.items.indexOf(it)
    state.items.splice(idx, 1)
    if (state.db)
      state.db
        .doc("images/" + it.id)
        .delete()
        .then(
          function () {
            setSave("Image deleted")
          },
          function () {
            setSave("Couldn’t delete. Try again.")
          },
        )
    if (!state.items.length) {
      addItem(blank())
      return
    }
    select(state.items[Math.min(idx, state.items.length - 1)].id)
  }

  $("newBtn").addEventListener("click", function () {
    addItem(blank())
  })
  $("fTitle").addEventListener("input", function (e) {
    edit({ title: e.target.value }, { noForm: true })
  })
  $("fDate").addEventListener("change", function (e) {
    edit({ date: e.target.value })
  })
  $("fStart").addEventListener("change", function (e) {
    edit({ start: e.target.value })
  })
  $("fEnd").addEventListener("change", function (e) {
    edit({ end: e.target.value })
  })
  $("fTz").addEventListener("input", function (e) {
    edit({ tz: e.target.value.trim() }, { noForm: true })
  })
  $("fLoc").addEventListener("input", function (e) {
    edit({ location: e.target.value }, { noForm: true })
  })
  document.querySelectorAll("[data-logo]").forEach(function (b) {
    b.addEventListener("click", function () {
      edit({ logoColor: b.dataset.logo })
    })
  })
  document.querySelectorAll("[data-headline]").forEach(function (b) {
    b.addEventListener("click", function () {
      edit({ headline: b.dataset.headline })
    })
  })
  $("fSize").addEventListener("input", function (e) {
    $("oSize").textContent = e.target.value + "%"
    edit({ hogSize: +e.target.value }, { noForm: true })
  })
  $("fX").addEventListener("input", function (e) {
    $("oX").textContent = e.target.value
    edit({ hogX: +e.target.value }, { noForm: true })
  })
  $("fY").addEventListener("input", function (e) {
    $("oY").textContent = e.target.value
    edit({ hogY: +e.target.value }, { noForm: true })
  })
  $("fFlip").addEventListener("change", function (e) {
    edit({ flip: e.target.checked })
  })
  $("fHlScale").addEventListener("input", function (e) {
    $("oHlScale").textContent = e.target.value + "%"
    edit({ hlScale: +e.target.value }, { noForm: true })
  })
  $("fGlow").addEventListener("change", function (e) {
    edit({ glow: e.target.checked })
  })
  $("fDark").addEventListener("change", function (e) {
    edit({ darkText: e.target.checked })
  })
  $("fCalFlip").addEventListener("change", function (e) {
    edit({ calFlip: e.target.checked })
  })
  $("removeHog").addEventListener("click", function () {
    edit({ hog: "" })
  })
  $("chooseHog").addEventListener("click", openGallery)
  $("hogPic").addEventListener("click", openGallery)

  $("addLogo").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0]
    e.target.value = ""
    var it = current()
    if (!file || !it || !state.assets) return
    $("logoMsg").textContent = "Uploading " + file.name + "…"
    state.assets.upload(file).then(
      function (res) {
        var a = (it.data.logos || []).slice(0, 3)
        a.push({ id: res.id, name: file.name.replace(/\.[^.]+$/, "") })
        if (state.currentId === it.id) edit({ logos: a })
        else {
          var nd = JSON.parse(JSON.stringify(it.data))
          nd.logos = a
          it.data = nd
          persist(it)
        }
      },
      function (err) {
        $("logoMsg").textContent =
          "That logo didn’t upload" +
          (err && err.code ? " (" + err.code + ")" : "") +
          ". Try an SVG or PNG under 2 MB."
      },
    )
  })

  function editPhoto(patch, opts) {
    var it = current()
    if (!it || !it.data.photo) return
    var p = JSON.parse(JSON.stringify(it.data.photo))
    Object.keys(patch).forEach(function (k) {
      p[k] = patch[k]
    })
    edit({ photo: p }, opts)
  }
  $("pSize").addEventListener("input", function (e) {
    $("opSize").textContent = e.target.value + "%"
    editPhoto({ size: +e.target.value }, { noForm: true })
  })
  $("pX").addEventListener("input", function (e) {
    $("opX").textContent = e.target.value
    editPhoto({ x: +e.target.value }, { noForm: true })
  })
  $("pY").addEventListener("input", function (e) {
    $("opY").textContent = e.target.value
    editPhoto({ y: +e.target.value }, { noForm: true })
  })
  $("pFlip").addEventListener("change", function (e) {
    editPhoto({ flip: e.target.checked })
  })
  $("pFront").addEventListener("change", function (e) {
    editPhoto({ front: e.target.checked })
  })
  $("removePhoto").addEventListener("click", function () {
    $("photoMsg").textContent = ""
    edit({ photo: null })
  })
  $("addPhoto").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0]
    e.target.value = ""
    var it = current()
    if (!file || !it || !state.assets) return
    $("photoMsg").textContent = "Uploading " + file.name + "…"
    state.assets.upload(file).then(
      function (res) {
        var old = it.data.photo || {}
        // A new upload starts in front of the hoggie, shifted left so both show; a replacement keeps its placement.
        var p = old.id
          ? {
              id: res.id,
              name: file.name.replace(/\.[^.]+$/, ""),
              size: old.size,
              x: old.x,
              y: old.y,
              flip: old.flip,
              front: old.front,
            }
          : {
              id: res.id,
              name: file.name.replace(/\.[^.]+$/, ""),
              size: 70,
              x: it.data.hog ? -25 : 0,
              y: 0,
              flip: false,
              front: true,
            }
        $("photoMsg").textContent = ""
        if (state.currentId === it.id) edit({ photo: p })
        else {
          var nd = JSON.parse(JSON.stringify(it.data))
          nd.photo = p
          it.data = nd
          persist(it)
        }
      },
      function (err) {
        $("photoMsg").textContent =
          "That image didn’t upload" +
          (err && err.code ? " (" + err.code + ")" : "") +
          ". Try a smaller PNG or JPG."
      },
    )
  })

  // ---------- Download ----------
  $("downloadBtn").addEventListener("click", function () {
    var it = current()
    if (!it) return
    var k = $("dlSize").value === "2" ? 2 : 1
    var c = document.createElement("canvas")
    c.width = 1080 * k
    c.height = 1080 * k
    var cctx = c.getContext("2d")
    cctx.setTransform(k, 0, 0, k, 0, 0)
    drawPost(cctx, it.data, false)
    var name =
      slug(firstLine(it.data)) +
      (it.data.date ? "-" + it.data.date : "") +
      (k === 2 ? "@2x" : "") +
      ".png"
    try {
      c.toBlob(function (b) {
        if (!b) {
          setSave("Couldn’t make the PNG. Try again.")
          return
        }
        if (!state.downloads) {
          setSave("Couldn’t start the download. Try again.")
          return
        }
        state.downloads.save({ filename: name, data: b }).then(
          function () {
            setSave("Downloaded " + name)
          },
          function (err) {
            if (err && err.code === "declined") setSave("Download cancelled")
            else
              setSave("Download didn’t work here (" + ((err && err.code) || "unavailable") + ").")
          },
        )
      }, "image/png")
    } catch (err) {
      setSave("Couldn’t make the PNG in this view.")
    }
  })

  // ---------- Hoggie gallery ----------
  var gallery = $("gallery")
  function ranked(query) {
    var names = Object.keys(DATA.hogs)
    var q = query.toLowerCase().trim()
    if (!q) return names
    var words = q.split(/[\s,]+/).filter(Boolean),
      out = []
    names.forEach(function (hn) {
      var nm = hn.toLowerCase(),
        tags = (DATA.hogs[hn].tags || "").split("|").filter(Boolean),
        score = 0
      if (nm === q) score += 20
      if (tags.indexOf(q) >= 0) score += 10
      words.forEach(function (w) {
        if ((" " + nm + " ").indexOf(" " + w + " ") >= 0) score += 6
        else if (nm.indexOf(w) >= 0) score += 3
        tags.forEach(function (t) {
          if (t === w) score += 4
          else if ((" " + t + " ").indexOf(" " + w + " ") >= 0) score += 2
          else if (w.length > 2 && t.indexOf(w) >= 0) score += 1
        })
      })
      if (score > 0) out.push({ n: hn, s: score })
    })
    out.sort(function (a, b) {
      return b.s - a.s
    })
    return out.map(function (o) {
      return o.n
    })
  }
  function renderGallery() {
    var q = $("gQuery").value,
      list = ranked(q),
      grid = $("gGrid"),
      it = current()
    grid.textContent = ""
    $("gCount").textContent = q.trim()
      ? list.length
        ? list.length + (list.length === 1 ? " match, best first" : " matches, best first")
        : "No matches. Try another word."
      : list.length + " hoggies"
    list.forEach(function (hn) {
      var b = document.createElement("button")
      b.type = "button"
      b.className = "g-item"
      b.setAttribute("aria-pressed", it && it.data.hog === hn ? "true" : "false")
      var im = document.createElement("img")
      im.loading = "lazy"
      im.src = hogUrl(hn)
      im.alt = ""
      var s = document.createElement("span")
      s.textContent = hn
      b.appendChild(im)
      b.appendChild(s)
      b.addEventListener("click", function () {
        edit({ hog: hn })
        gallery.close()
      })
      grid.appendChild(b)
    })
  }
  function openGallery() {
    if (!Object.keys(DATA.hogs).length) {
      setSave("Hoggies are still loading…")
      return
    }
    renderGallery()
    if (gallery.showModal) gallery.showModal()
    else gallery.setAttribute("open", "")
    $("gQuery").focus()
    $("gQuery").select()
  }
  $("gQuery").addEventListener("input", renderGallery)
  $("gClose").addEventListener("click", function () {
    gallery.close()
  })
  gallery.addEventListener("click", function (e) {
    if (e.target === gallery) gallery.close()
  })

  // ---------- Boot ----------
  // First frame: a working sample image, replaced by the team's saved images once the store answers.
  state.items = [{ id: uid(), data: blank() }]
  state.currentId = state.items[0].id
  renderList()
  fillForm()
  queueRedraw()

  Promise.resolve(env.data)
    .then(function (j) {
      DATA = j

      // RoundHog for everything; Squeak Bold (from the PostHog Brand book) for the headline.
      var faces = [
        ["600", j.fonts.semibold, "RoundHog"],
        ["700", j.fonts.bold, "RoundHog"],
        ["700", j.fonts.squeak, "Squeak"],
      ]
        .filter(function (f) {
          return f[1]
        })
        .map(function (f) {
          var ff = new FontFace(f[2], "url(" + blob(f[1]) + ") format('woff2')", {
            weight: f[0],
            style: "normal",
          })
          document.fonts.add(ff)
          return ff.load()
        })
      Promise.all(faces).then(
        function () {
          renderList()
          queueRedraw()
        },
        function () {},
      )
      img(hogUrl("Sitting"))
      fillForm()
      queueRedraw()
    })
    .catch(function () {
      setSave("Couldn’t load hoggies and fonts. Reload to try again.")
    })

  if (env.host && env.host.use) {
    env.host.use("downloads").then(function (d) {
      state.downloads = d
    })
    env.host.use("assets").then(function (a) {
      state.assets = a
      fillForm()
    })
    env.host.use("db").then(function (db) {
      state.db = db
      var draft = state.items[0],
        touched = false
      db.collection("images")
        .orderBy("createdAt", "desc")
        .onSnapshot(
          function (snap) {
            var remote = snap.docs.map(function (doc) {
              return { id: doc.id, data: JSON.parse(JSON.stringify(doc.data() || {})) }
            })
            // Keep local edits that haven't reached the store yet.
            var merged = remote.map(function (r) {
              if (state.pending[r.id]) {
                var mine = byId(r.id)
                return mine || r
              }
              return r
            })
            state.items.forEach(function (it) {
              if (
                state.pending[it.id] &&
                !merged.some(function (m) {
                  return m.id === it.id
                })
              )
                merged.unshift(it)
            })
            var keepDraft = !touched && !remote.length
            if (keepDraft) {
              state.live = true
              renderList()
              return
            } // empty store: keep the sample as the first, unsaved image
            if (!touched && !state.pending[draft.id]) {
              // The sample was never edited: show the team's images instead.
              state.items = merged
              touched = true
              if (!byId(state.currentId)) state.currentId = merged[0].id
            } else {
              state.items = merged
              touched = true
              if (!byId(state.currentId)) state.currentId = merged.length ? merged[0].id : null
            }
            state.live = true
            if (!state.currentId && !state.items.length) {
              addItem(blank())
              return
            }
            renderList()
            var ae = document.activeElement
            if (!ae || !ae.closest || !ae.closest(".props")) fillForm()
            queueRedraw()
          },
          function () {
            setSave("Couldn’t read saved images. Reload to try again.")
          },
        )
    })
  }

  return function cleanup() {
    __listeners.forEach(function (l) {
      l[0].removeEventListener(l[1], l[2])
    })
  }
}
