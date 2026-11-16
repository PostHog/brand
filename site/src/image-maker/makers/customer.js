// Plain DOM code: ImageMaker.tsx injects MARKUP into the page, then calls mount(), which returns
// a cleanup function. env.host (image-maker/host.ts) provides storage, uploads and downloads, and
// env.data the maker's data (image-maker/data.ts).
/* eslint-disable */
// oxlint-disable
export const MARKUP =
  '<div class="main">\n    <div class="maker-head">\n        <div class="mh-text page-header">\n          <a class="eyebrow" href="/tools/images" data-mk-home title="All image makers">image makers</a>\n          <h1>Customer story images</h1>\n          <p class="mh-desc">Customer story headers with the company\u2019s logo from posthog.com/customers, a hoggie and brand colors.</p>\n        </div>\n        <div class="mh-side">\n          <div class="dl">\n      <label for="dlSize" hidden>Download size</label>\n      <select id="dlSize" title="Download size">\n        <option value="1">1920 \u00d7 1080</option>\n        <option value="2">3840 \u00d7 2160 (2\u00d7)</option>\n      </select>\n      <button class="btn btn-primary" id="downloadBtn" type="button">\n        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>\n        Download PNG\n      </button>\n    </div>\n          <div class="mh-status"><span class="doc-name" id="docName">Untitled story</span><span class="save-state" id="saveState" aria-live="polite"></span></div>\n        </div>\n      </div>\n    <nav class="list" aria-label="Customer story images">\n      <div class="list-head">\n        <button class="btn new-btn" id="newBtn" type="button">\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>\n          New image\n        </button>\n        <span class="list-label" id="listLabel">Images</span>\n      </div>\n      <div id="notice"></div>\n      <ol class="thumbs" id="thumbs"></ol>\n    </nav>\n\n    <main class="stage">\n      <div class="canvas-wrap"><canvas id="stage" width="1920" height="1080" aria-label="Customer story image preview"></canvas></div>\n      <p class="stage-hint" id="stageHint">Click the hoggie on the image to choose a different one.</p>\n    </main>\n\n    <aside class="props" aria-label="Image settings">\n      <section class="mk-section">\n        <h2>Customer</h2>\n        <div class="field">\n          <label for="fCompany">Company</label>\n          <div class="find-row">\n            <input class="input" id="fCompany" type="text" autocomplete="off" placeholder="Name or website, e.g. Supabase">\n            <button class="btn btn-sm primary" id="findBtn" type="button">Find logo</button>\n          </div>\n          <span class="hint">Type the name or paste their website, then select Find logo to look it up in the posthog.com/customers logos.</span>\n          <div class="find-result" id="findResult" aria-live="polite"></div>\n        </div>\n        <div class="field">\n          <span class="lbl">Logo</span>\n          <div class="logo-status">\n            <span class="lp" id="logoPreview"><span>No logo</span></span>\n            <div class="info">\n              <span class="hint" id="logoSource">No logo yet.</span>\n            </div>\n          </div>\n          <div class="actions">\n            <label class="btn btn-sm" id="uploadLbl" for="uploadLogo">Upload a logo</label>\n            <button class="btn btn-sm" id="clearUpload" type="button">Use the posthog.com logo</button>\n          </div>\n          <input id="uploadLogo" type="file" accept="image/svg+xml,image/png,image/webp,image/jpeg" hidden>\n          <span class="hint" id="uploadMsg"></span>\n        </div>\n        <div class="field">\n          <span class="lbl" id="lblLogoCol">Logo color</span>\n          <div class="seg" role="group" aria-labelledby="lblLogoCol">\n            <button type="button" data-logomode="match" aria-pressed="true">Match text</button>\n            <button type="button" data-logomode="original" aria-pressed="false">Original colors</button>\n          </div>\n          <span class="hint" id="logoModeHint">One solid color, the same as the text.</span>\n        </div>\n        <div class="field">\n          <label for="fLogoSize">Logo size</label>\n          <div class="range-row"><input id="fLogoSize" type="range" min="50" max="130" step="5"><output id="oLogoSize" for="fLogoSize"></output></div>\n        </div>\n      </section>\n\n      <section class="mk-section">\n        <h2>Hoggie</h2>\n        <div class="hog-card">\n          <button class="pic" id="hogPic" type="button" aria-label="Choose hoggie"></button>\n          <div class="info">\n            <span class="name" id="hogName">Hoggie</span>\n            <span class="how" id="hogHow"></span>\n            <div class="actions">\n              <button class="btn btn-sm" id="chooseHog" type="button">Choose hoggie</button>\n            </div>\n          </div>\n        </div>\n        <label class="switch"><input id="fAuto" type="checkbox"> <span>Match the company automatically</span></label>\n        <div class="field">\n          <label for="fSize">Size</label>\n          <div class="range-row"><input id="fSize" type="range" min="75" max="125" step="5"><output id="oSize" for="fSize"></output></div>\n        </div>\n        <div class="field">\n          <label for="fX">Move left / right</label>\n          <div class="range-row"><input id="fX" type="range" min="-20" max="20" step="1"><output id="oX" for="fX"></output></div>\n        </div>\n        <div class="field">\n          <label for="fY">Move down / up</label>\n          <div class="range-row"><input id="fY" type="range" min="-20" max="20" step="1"><output id="oY" for="fY"></output></div>\n        </div>\n        <label class="switch"><input id="fFlip" type="checkbox"> <span>Flip to face the other way</span></label>\n      </section>\n\n      <section class="mk-section">\n        <h2>Colors</h2>\n        <div class="field"><span class="lbl" id="lblBg">Background</span><div class="swatches" id="swBg" role="group" aria-labelledby="lblBg"></div></div>\n        <div class="field">\n          <span class="lbl" id="lblTone">Tone</span>\n          <div class="seg" role="group" aria-labelledby="lblTone">\n            <button type="button" data-tone="light" aria-pressed="false">Light</button>\n            <button type="button" data-tone="mid" aria-pressed="true">Midtone</button>\n            <button type="button" data-tone="dark" aria-pressed="false">Dark</button>\n          </div>\n          <span class="hint" id="toneHint"></span>\n        </div>\n        <div class="field">\n          <span class="lbl" id="lblInk">Text</span>\n          <div class="seg" role="group" aria-labelledby="lblInk">\n            <button type="button" data-ink="dark" aria-pressed="false">Dark</button>\n            <button type="button" data-ink="light" aria-pressed="true">White</button>\n          </div>\n        </div>\n      </section>\n\n      <section class="mk-section">\n        <h2>This image</h2>\n        <div class="actions" id="imgActions"></div>\n      </section>\n    </aside>\n  </div>\n\n<dialog class="gallery" id="gallery" aria-labelledby="gTitle">\n  <div class="g-wrap">\n    <div class="g-head">\n      <div class="g-title">\n        <h2 id="gTitle">Choose a hoggie</h2>\n        <button class="icon-btn" id="gClose" type="button" aria-label="Close">\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>\n        </button>\n      </div>\n      <div class="g-search">\n        <label for="gQuery" hidden>Search hoggies</label>\n        <input class="input" id="gQuery" type="search" placeholder="Search: music, money, coffee, detective\u2026" autocomplete="off">\n        <span class="g-count" id="gCount"></span>\n      </div>\n    </div>\n    <div class="g-grid" id="gGrid"></div>\n  </div>\n</dialog>\n\n'

export function mount(env) {
  "use strict"
  var __listeners = []
  function __on(target, type, fn) {
    target.addEventListener(type, fn)
    __listeners.push([target, type, fn])
  }

  // ---------- Brand data (PostHog Brand tokens) ----------
  // [300, 500, 700]
  var TONES = {
    blue: ["hsl(205, 84%, 80%)", "hsl(205, 84%, 49%)", "hsl(205, 84%, 38%)"],
    yellow: ["hsl(37, 100%, 82%)", "hsl(37, 100%, 55%)", "hsl(37, 100%, 45%)"],
    teal: ["hsl(165, 67%, 82%)", "hsl(165, 67%, 56%)", "hsl(165, 67%, 44%)"],
    purple: ["hsl(283, 63%, 81%)", "hsl(283, 63%, 52%)", "hsl(283, 64%, 42%)"],
    "corn-blue": ["hsl(194, 73%, 81%)", "hsl(195, 74%, 52%)", "hsl(195, 74%, 39%)"],
    coral: ["hsl(358, 100%, 86%)", "hsl(358, 100%, 64%)", "hsl(358, 100%, 47%)"],
    tangerine: ["hsl(17, 100%, 82%)", "hsl(17, 100%, 55%)", "hsl(17, 100%, 50%)"],
    lime: ["hsl(75, 72%, 76%)", "hsl(75, 72%, 46%)", "hsl(75, 72%, 40%)"],
    green: ["hsl(132, 54%, 82%)", "hsl(132, 54%, 53%)", "hsl(132, 54%, 45%)"],
    violet: ["hsl(250, 100%, 86%)", "hsl(250, 100%, 65%)", "hsl(250, 100%, 59%)"],
    cobalt: ["hsl(220, 100%, 80%)", "hsl(220, 100%, 51%)", "hsl(220, 100%, 41%)"],
    lemon: ["hsl(47, 100%, 82%)", "hsl(47, 100%, 55%)", "hsl(47, 100%, 47%)"],
  }
  var COLOR_KEYS = Object.keys(TONES)
  // These colors have no dark tone in the template: Dark falls back to Midtone.
  var NO_DARK = { yellow: 1, coral: 1, tangerine: 1, lemon: 1, lime: 1 }
  var AUTO = "Auto (match company)"
  var FALLBACK_HOG = "Hand Clasp"
  var FONT = '"RoundHog", system-ui, -apple-system, "Segoe UI", sans-serif'
  var W = 1920,
    H = 1080,
    PAD_X = 144,
    PAD_Y = 128

  var DATA = { fonts: {}, logos: {}, hogs: {}, customers: [], themes: [] } // filled from app-data.json
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
  function slug(s) {
    return (
      String(s)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "customer-story"
    )
  }
  function uid() {
    return "img_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }
  function blob(id) {
    return !id ? "" : /^(\/|blob:|data:|https?:)/.test(id) ? id : "/_blob/" + id
  }
  function hogUrl(name) {
    var h = DATA.hogs[name]
    return h ? blob(h.id) : ""
  }
  function clamp(v, lo, hi, dflt) {
    v = Number(v)
    if (!isFinite(v)) v = dflt
    return Math.min(hi, Math.max(lo, v))
  }
  function key(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
  }

  function blank() {
    var now = Date.now()
    return {
      company: "SoundBoost",
      lib: "soundboost",
      upload: null,
      logoMode: "",
      logoSize: 100,
      hog: AUTO,
      hogSize: 100,
      hogX: 0,
      hogY: 0,
      flip: false,
      color: "blue",
      tone: "mid",
      ink: "light",
      createdAt: now,
      updatedAt: now,
    }
  }

  // ---------- Company → name, library logo, auto hoggie ----------
  function parseCompany(d) {
    var raw = String(d.company == null ? "" : d.company).trim()
    var host = raw
      .toLowerCase()
      .replace(/^[a-z]+:\/\//, "")
      .replace(/^www\./, "")
      .split(/[\/?#]/)[0]
    var isUrl = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) && raw.indexOf(" ") < 0
    var stem = isUrl ? host.split(".")[0] : raw
    return {
      raw: raw,
      host: isUrl ? host : "",
      stem: stem,
      display: isUrl ? host : raw || "[Company]",
    }
  }
  var custIndex = null
  function bySlug(slug) {
    var cs = DATA.customers || []
    for (var i = 0; i < cs.length; i++) if (cs[i].slug === slug) return cs[i]
    return null
  }
  // The customer picked by the last "Find logo" (stored on the image as d.lib).
  function customerFor(d) {
    return d.lib ? bySlug(d.lib) : null
  }
  // Looks the company up in the posthog.com/customers list: exact name, slug or website match first,
  // then partial matches (several come back as choices).
  function searchCustomers(d) {
    if (!custIndex) {
      custIndex = {}
      ;(DATA.customers || []).forEach(function (c) {
        ;[c.slug, c.name].concat(c.aliases || []).forEach(function (k) {
          if (key(k)) custIndex[key(k)] = c
        })
      })
    }
    var p = parseCompany(d),
      q1 = key(p.stem),
      q2 = key(p.raw)
    var exact = custIndex[q1] || custIndex[q2]
    if (exact) return { exact: exact, near: [] }
    var near = []
    if (q1.length >= 3)
      (DATA.customers || []).forEach(function (c) {
        var ks = [c.slug, c.name].concat(c.aliases || []).map(key)
        if (
          ks.some(function (k) {
            return k.indexOf(q1) >= 0 || (k.length >= 3 && q1.indexOf(k) >= 0)
          })
        )
          near.push(c)
      })
    return { exact: null, near: near.slice(0, 6) }
  }
  function displayName(d) {
    var c = customerFor(d)
    return c ? c.name : parseCompany(d).display
  }
  function autoHog(d) {
    var c = customerFor(d)
    if (c && c.hog && DATA.hogs[c.hog]) return c.hog
    var p = parseCompany(d)
    var hay =
      " " +
      (p.raw + " " + p.host.replace(/\./g, " ") + " " + (c ? (c.industries || []).join(" ") : ""))
        .toLowerCase()
        .replace(/[^a-z0-9+ ]+/g, " ")
        .replace(/\s+/g, " ") +
      " "
    var themes = DATA.themes || []
    for (var i = 0; i < themes.length; i++) {
      var words = themes[i][1].split("|")
      for (var j = 0; j < words.length; j++)
        if (hay.indexOf(" " + words[j] + " ") >= 0 && DATA.hogs[themes[i][0]]) return themes[i][0]
    }
    return DATA.hogs[FALLBACK_HOG] ? FALLBACK_HOG : Object.keys(DATA.hogs)[0]
  }
  function resolvedHog(d) {
    return !d.hog || d.hog === AUTO || !DATA.hogs[d.hog] ? autoHog(d) : d.hog
  }
  // Where the logo comes from: an upload wins over the library.
  function logoInfo(d, lightText) {
    var c = customerFor(d)
    var mode =
      d.logoMode === "match" || d.logoMode === "original"
        ? d.logoMode
        : (!d.upload && c && c.prefer) || "match"
    if (d.upload && d.upload.id) return { src: "upload", id: d.upload.id, mode: mode, customer: c }
    if (c && c.light)
      return {
        src: "library",
        id: mode === "original" && lightText ? c.dark || c.light : c.light,
        mode: mode,
        customer: c,
      }
    return { src: "none", mode: mode, customer: c }
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
    // SVGs often have only a viewBox, so give them an explicit size before drawing to canvas.
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
    // Logos are small vectors: draw them at least 1600px wide so they stay sharp at 2×.
    var k = Math.max(1, 1600 / w)
    w = Math.round(w * k)
    h = Math.round(h * k)
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
  // A one-color copy of an image (for "Match text").
  var tintCache = {}
  function tinted(im, url, color) {
    var k = url + "|" + color
    if (tintCache[k]) return tintCache[k]
    var c = document.createElement("canvas")
    c.width = im.naturalWidth
    c.height = im.naturalHeight
    var x = c.getContext("2d")
    x.drawImage(im, 0, 0, c.width, c.height)
    x.globalCompositeOperation = "source-in"
    x.fillStyle = color
    x.fillRect(0, 0, c.width, c.height)
    c.naturalWidth = c.width
    c.naturalHeight = c.height
    return (tintCache[k] = c)
  }

  // ---------- Text ----------
  var mctx = document.createElement("canvas").getContext("2d")
  function setLS(ctx, v) {
    if ("letterSpacing" in ctx) ctx.letterSpacing = v
  }
  function fontStr(weight, size) {
    return weight + " " + size + "px " + FONT
  }
  var metricsCache = {}
  function vMetrics(weight, size) {
    var k = weight + "/" + size
    if (metricsCache[k]) return metricsCache[k]
    mctx.font = fontStr(weight, size)
    var m = mctx.measureText("Hg")
    return (metricsCache[k] = {
      asc: m.fontBoundingBoxAscent || size * 0.93,
      desc: m.fontBoundingBoxDescent || size * 0.24,
    })
  }
  function wrapWords(text, maxW, ctx) {
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
    return lines.length ? lines : [""]
  }

  // ---------- Renderer (1920 × 1080 units, matches the canvas template) ----------
  function look(d) {
    var colorKey = TONES[d.color] ? d.color : "blue",
      t = TONES[colorKey]
    var tone = d.tone === "light" || d.tone === "dark" ? d.tone : "mid"
    if (tone === "dark" && NO_DARK[colorKey]) tone = "mid"
    var lightText = d.ink !== "dark"
    return {
      tone: tone,
      base: tone === "mid" ? t[1] : tone === "dark" ? t[2] : t[0],
      wash:
        tone === "mid"
          ? null
          : tone === "dark"
            ? "rgba(30, 31, 35, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
      text: lightText ? "#ffffff" : "#1e1f23",
      lightText: lightText,
    }
  }
  function contain(im, bx, by, bw, bh, alignTop, alignLeft) {
    var k = Math.min(bw / im.naturalWidth, bh / im.naturalHeight)
    var w = im.naturalWidth * k,
      h = im.naturalHeight * k
    return {
      x: alignLeft ? bx : bx + (bw - w) / 2,
      y: alignTop ? by : by + (bh - h) / 2,
      w: w,
      h: h,
    }
  }

  function drawPost(ctx, d) {
    var L = look(d)
    ctx.save()
    ctx.fillStyle = L.base
    ctx.fillRect(0, 0, W, H)
    if (L.wash) {
      ctx.fillStyle = L.wash
      ctx.fillRect(0, 0, W, H)
    }
    ctx.textBaseline = "alphabetic"
    ctx.textAlign = "left"

    // Hoggie: 1240px box (top 220, right -110), drawn from its top; scaled and moved around (1410, 1080).
    var hit = null,
      name = resolvedHog(d),
      him = img(hogUrl(name))
    var size = clamp(d.hogSize, 75, 125, 100) / 100
    var tx = clamp(d.hogX, -20, 20, 0) * 10,
      ty = -clamp(d.hogY, -20, 20, 0) * 10
    var ox = 1410,
      oy = 1080
    if (him) {
      var r = contain(him, 790, 220, 1240, 1240, true, false)
      ctx.save()
      ctx.translate(ox + tx, oy + ty)
      ctx.scale(d.flip ? -size : size, size)
      ctx.translate(-ox, -oy)
      ctx.drawImage(him, r.x, r.y, r.w, r.h)
      ctx.restore()
      var x1 = ox + tx + (r.x - ox) * size,
        x2 = ox + tx + (r.x + r.w - ox) * size
      hit = {
        x: Math.min(x1, x2),
        y: oy + ty + (r.y - oy) * size,
        w: Math.abs(x2 - x1),
        h: Math.min(H, r.h * size),
      }
    } else hit = { x: 900, y: 220, w: 1020, h: 860 }

    // "Customer story" label: 64px, 40% of the text color.
    var vm = vMetrics(600, 64)
    ctx.font = fontStr(600, 64)
    ctx.globalAlpha = 0.4
    ctx.fillStyle = L.text
    ctx.fillText("Customer story", PAD_X, PAD_Y + (64 - (vm.asc + vm.desc)) / 2 + vm.asc)
    ctx.globalAlpha = 1

    // Logo (880 × 163 box, left-aligned) or the company name until there is one.
    var top = PAD_Y + 64 + 48
    var li = logoInfo(d, L.lightText),
      drawn = false
    if (li.id) {
      var url = blob(li.id),
        lim = img(url)
      if (lim) {
        var s = clamp(d.logoSize, 50, 130, 100) / 100,
          bw = 880 * s,
          bh = 163 * s
        var src = li.mode === "match" ? tinted(lim, url, L.text) : lim
        var lr = contain(src, PAD_X, top + (163 - bh) / 2, bw, bh, false, true)
        ctx.drawImage(src, lr.x, lr.y, lr.w, lr.h)
        drawn = true
      } else if (!imgCache[url] || !imgCache[url].failed) drawn = true // still loading: leave the space empty
    }
    if (!drawn) {
      ctx.font = fontStr(700, 140)
      setLS(ctx, "-1.4px")
      ctx.fillStyle = L.text
      var vm2 = vMetrics(700, 140),
        lh = 147
      wrapWords(displayName(d), 1000, ctx)
        .slice(0, 4)
        .forEach(function (line, i) {
          ctx.fillText(line, PAD_X, top + i * lh + (lh - (vm2.asc + vm2.desc)) / 2 + vm2.asc)
        })
      setLS(ctx, "0px")
    }
    ctx.restore()
    return { hit: hit, hog: name, logo: li }
  }

  // ---------- Stage ----------
  var stage = $("stage"),
    sctx = stage.getContext("2d")
  var hogHit = null
  function current() {
    return byId(state.currentId)
  }
  function byId(id) {
    for (var i = 0; i < state.items.length; i++) if (state.items[i].id === id) return state.items[i]
    return null
  }
  function renderStage() {
    var it = current()
    var rect = stage.getBoundingClientRect()
    var dpr = window.devicePixelRatio || 1
    var pw = Math.max(480, Math.round((rect.width || 1100) * dpr)),
      ph = Math.round((pw * 9) / 16)
    if (stage.width !== pw) {
      stage.width = pw
      stage.height = ph
    }
    sctx.setTransform(pw / W, 0, 0, ph / H, 0, 0)
    sctx.clearRect(0, 0, W, H)
    if (it) {
      var res = drawPost(sctx, it.data)
      hogHit = res.hit
      updateHogCard(res.hog, it.data)
      updateLogoCard(res.logo, it.data)
    }
  }
  function renderThumb(canvas, data) {
    var dpr = window.devicePixelRatio || 1,
      pw = Math.round(220 * dpr),
      ph = Math.round((pw * 9) / 16)
    if (canvas.width !== pw) {
      canvas.width = pw
      canvas.height = ph
    }
    var c = canvas.getContext("2d")
    c.setTransform(pw / W, 0, 0, ph / H, 0, 0)
    drawPost(c, data)
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
  function toUnits(ev) {
    var r = stage.getBoundingClientRect()
    return { x: ((ev.clientX - r.left) * W) / r.width, y: ((ev.clientY - r.top) * H) / r.height }
  }
  function inHog(p) {
    return (
      hogHit &&
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
  function logoLabel(d) {
    return d.upload && d.upload.id
      ? "Uploaded logo"
      : customerFor(d)
        ? "posthog.com logo"
        : "No logo yet"
  }
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
      t.textContent = displayName(it.data)
      var dd = document.createElement("span")
      dd.className = "d"
      dd.textContent = logoLabel(it.data)
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
  function swatchesInto(el, keys, sel, css, onPick) {
    el.textContent = ""
    keys.forEach(function (k) {
      var b = document.createElement("button")
      b.type = "button"
      b.className = "sw"
      b.style.background = css(k)
      var label = k.replace("-", " ")
      b.setAttribute("aria-label", label)
      b.title = label
      b.setAttribute("aria-pressed", k === sel ? "true" : "false")
      b.addEventListener("click", function () {
        onPick(k)
      })
      el.appendChild(b)
    })
  }
  function setVal(id, v) {
    if (document.activeElement !== $(id)) $(id).value = v
  }
  function fillForm() {
    var it = current()
    if (!it) return
    var d = it.data,
      L = look(d)
    setVal("fCompany", d.company || "")
    var hs = clamp(d.hogSize, 75, 125, 100),
      hx = clamp(d.hogX, -20, 20, 0),
      hy = clamp(d.hogY, -20, 20, 0),
      ls = clamp(d.logoSize, 50, 130, 100)
    $("fSize").value = hs
    $("oSize").textContent = hs + "%"
    $("fX").value = hx
    $("oX").textContent = hx
    $("fY").value = hy
    $("oY").textContent = hy
    $("fLogoSize").value = ls
    $("oLogoSize").textContent = ls + "%"
    $("fFlip").checked = !!d.flip
    $("fAuto").checked = !d.hog || d.hog === AUTO
    var tone = d.tone === "light" || d.tone === "dark" ? d.tone : "mid"
    document.querySelectorAll("[data-tone]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.tone === tone ? "true" : "false")
    })
    document.querySelectorAll("[data-ink]").forEach(function (b) {
      b.setAttribute(
        "aria-pressed",
        b.dataset.ink === (d.ink === "dark" ? "dark" : "light") ? "true" : "false",
      )
    })
    $("toneHint").textContent =
      tone === "dark" && L.tone !== "dark"
        ? "This color has no dark tone, so it shows as Midtone."
        : L.tone === "light"
          ? "The 300 tone under a 70% white wash."
          : L.tone === "dark"
            ? "The 700 tone under a 70% dark wash."
            : "The 500 tone, full strength."
    swatchesInto(
      $("swBg"),
      COLOR_KEYS,
      TONES[d.color] ? d.color : "blue",
      function (k) {
        return TONES[k][1]
      },
      function (k) {
        edit({ color: k })
      },
    )
    $("docName").textContent = displayName(d)
    renderDelete()
  }
  var lastCardHog = null
  function updateHogCard(name, d) {
    var auto = !d.hog || d.hog === AUTO
    $("hogName").textContent = name
    $("hogHow").textContent = auto ? "Picked from the company" : "Chosen by you"
    $("chooseHog").textContent = auto ? "Choose a different one" : "Change"
    if (lastCardHog !== name) {
      lastCardHog = name
      var pic = $("hogPic")
      pic.textContent = ""
      var url = hogUrl(name)
      if (url) {
        var im = document.createElement("img")
        im.src = url
        im.alt = ""
        pic.appendChild(im)
      }
    }
  }
  var lastLogoKey = null
  function updateLogoCard(li, d) {
    var L = look(d)
    var name = displayName(d)
    $("logoSource").textContent =
      li.src === "upload"
        ? "Your uploaded logo" + (d.upload.name ? " (" + d.upload.name + ")" : "") + "."
        : li.src === "library"
          ? "From posthog.com/customers: " + li.customer.name + "."
          : String(d.company || "").trim()
            ? "No logo yet, so the image shows the name. Select Find logo, or upload one."
            : "Type a company, then select Find logo."
    $("clearUpload").hidden = li.src !== "upload"
    $("clearUpload").textContent = li.customer ? "Use the posthog.com logo" : "Remove upload"
    $("uploadLbl").hidden = !state.assets
    $("uploadLbl").textContent =
      li.src === "upload"
        ? "Upload a different logo"
        : li.src === "library"
          ? "Upload your own instead"
          : "Upload a logo"
    if (!state.assets) $("uploadMsg").textContent = "Uploading needs edit access to this app."
    else if (/needs edit access/.test($("uploadMsg").textContent)) $("uploadMsg").textContent = ""
    document.querySelectorAll("[data-logomode]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.logomode === li.mode ? "true" : "false")
    })
    $("logoModeHint").textContent =
      li.mode === "match"
        ? "One solid color, the same as the text."
        : "The logo’s own colors. Check it reads on this background."
    // The preview shows the logo file as it is: a dark-mode file on dark, everything else on white.
    var onDark =
      li.src === "library" && li.customer && li.customer.dark && li.id === li.customer.dark
    var k = (li.id || "none") + "|" + onDark
    if (k !== lastLogoKey) {
      lastLogoKey = k
      var lp = $("logoPreview")
      lp.textContent = ""
      lp.className = "lp" + (onDark ? " dark" : "")
      if (li.id) {
        var im = document.createElement("img")
        im.src = blob(li.id)
        im.alt = ""
        lp.appendChild(im)
      } else {
        var s = document.createElement("span")
        s.textContent = "No logo"
        lp.appendChild(s)
      }
    }
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
    var next = JSON.parse(JSON.stringify(it.data || {}))
    Object.keys(patch).forEach(function (k) {
      next[k] = patch[k]
    })
    next.updatedAt = Date.now()
    it.data = next
    if (!opts || !opts.noForm) fillForm()
    else $("docName").textContent = displayName(next)
    queueRedraw()
    var t = document.querySelector('.thumb[aria-current="true"] .t')
    if (t) t.textContent = displayName(it.data)
    var dd = document.querySelector('.thumb[aria-current="true"] .d')
    if (dd) dd.textContent = logoLabel(it.data)
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
    lastLogoKey = null
    findResult("", "")
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
    delete d.linkKey
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

  function findResult(cls, text, picks) {
    var box = $("findResult")
    box.textContent = ""
    box.className = "find-result" + (cls ? " " + cls : "")
    if (!text) return
    var p = document.createElement("span")
    p.textContent = text
    box.appendChild(p)
    if (picks && picks.length) {
      var row = document.createElement("div")
      row.className = "picks"
      picks.forEach(function (c) {
        var b = document.createElement("button")
        b.type = "button"
        b.className = "btn btn-sm"
        b.textContent = c.name
        b.addEventListener("click", function () {
          edit({ company: c.name, lib: c.slug, upload: null })
          findResult(
            "ok",
            "Found " + c.name + " on posthog.com/customers. Its logo is on the image.",
          )
        })
        row.appendChild(b)
      })
      box.appendChild(row)
    }
  }
  function runFind() {
    var it = current()
    if (!it) return
    var name = parseCompany(it.data).display
    if (!String(it.data.company || "").trim()) {
      findResult("miss", "Type a company name or website first.")
      return
    }
    if (!(DATA.customers || []).length) {
      findResult("", "Still loading the posthog.com/customers logos… try again in a moment.")
      return
    }
    $("findBtn").disabled = true
    $("findBtn").textContent = "Looking…"
    findResult(
      "",
      "Looking for “" +
        name +
        "” in the " +
        DATA.customers.filter(function (c) {
          return c.light
        }).length +
        " posthog.com/customers logos…",
    )
    setTimeout(function () {
      $("findBtn").disabled = false
      $("findBtn").textContent = "Find logo"
      var r = searchCustomers(it.data)
      if (r.exact && r.exact.light) {
        edit({ lib: r.exact.slug, upload: null })
        findResult(
          "ok",
          "Found " + r.exact.name + " on posthog.com/customers. Its logo is on the image.",
        )
      } else if (r.exact) {
        edit({ lib: "" })
        findResult(
          "miss",
          r.exact.name +
            " is on posthog.com/customers, but its logo isn’t in this app yet. Upload it below.",
        )
      } else if (r.near.length) {
        edit({ lib: "" })
        findResult(
          "miss",
          "No exact match for “" + name + "”. Did you mean:",
          r.near.filter(function (c) {
            return c.light
          }),
        )
      } else {
        edit({ lib: "" })
        findResult(
          "miss",
          "“" +
            name +
            "” isn’t on posthog.com/customers, so the image shows the name. Upload their logo below.",
        )
      }
    }, 350)
  }
  $("findBtn").addEventListener("click", runFind)
  $("fCompany").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault()
      runFind()
    }
  })

  $("newBtn").addEventListener("click", function () {
    addItem(blank())
  })
  $("fCompany").addEventListener("input", function (e) {
    var it = current()
    if (!it) return
    var patch = { company: e.target.value }
    var c = customerFor(it.data)
    if (c) {
      var k = key(parseCompany({ company: e.target.value }).stem)
      if (
        [c.slug, c.name]
          .concat(c.aliases || [])
          .map(key)
          .indexOf(k) < 0
      ) {
        patch.lib = ""
        findResult("", "Select Find logo to look up “" + e.target.value.trim() + "”.")
      }
    } else if (e.target.value.trim())
      findResult("", "Select Find logo to look up “" + e.target.value.trim() + "”.")
    edit(patch, { noForm: true })
  })
  $("fLogoSize").addEventListener("input", function (e) {
    $("oLogoSize").textContent = e.target.value + "%"
    edit({ logoSize: +e.target.value }, { noForm: true })
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
  $("fAuto").addEventListener("change", function (e) {
    var it = current()
    if (!it) return
    edit({ hog: e.target.checked ? AUTO : resolvedHog(it.data) })
  })
  document.querySelectorAll("[data-tone]").forEach(function (b) {
    b.addEventListener("click", function () {
      edit({ tone: b.dataset.tone })
    })
  })
  document.querySelectorAll("[data-ink]").forEach(function (b) {
    b.addEventListener("click", function () {
      edit({ ink: b.dataset.ink })
    })
  })
  document.querySelectorAll("[data-logomode]").forEach(function (b) {
    b.addEventListener("click", function () {
      edit({ logoMode: b.dataset.logomode })
    })
  })
  $("clearUpload").addEventListener("click", function () {
    $("uploadMsg").textContent = ""
    edit({ upload: null })
  })
  $("uploadLogo").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0]
    e.target.value = ""
    var it = current()
    if (!file || !it || !state.assets) return
    $("uploadMsg").textContent = "Uploading " + file.name + "…"
    state.assets.upload(file).then(
      function (res) {
        var up = { id: res.id, name: file.name.replace(/\.[^.]+$/, "") }
        $("uploadMsg").textContent = ""
        if (state.currentId === it.id) edit({ upload: up })
        else {
          var nd = JSON.parse(JSON.stringify(it.data))
          nd.upload = up
          it.data = nd
          persist(it)
        }
      },
      function (err) {
        $("uploadMsg").textContent =
          "That logo didn’t upload" +
          (err && err.code ? " (" + err.code + ")" : "") +
          ". Try an SVG under 2 MB or a PNG."
      },
    )
  })
  $("chooseHog").addEventListener("click", openGallery)
  $("hogPic").addEventListener("click", openGallery)

  // ---------- Download ----------
  $("downloadBtn").addEventListener("click", function () {
    var it = current()
    if (!it) return
    var k = $("dlSize").value === "2" ? 2 : 1
    var c = document.createElement("canvas")
    c.width = W * k
    c.height = H * k
    var cctx = c.getContext("2d")
    cctx.setTransform(k, 0, 0, k, 0, 0)
    drawPost(cctx, it.data)
    var name = "customer-story-" + slug(displayName(it.data)) + (k === 2 ? "@2x" : "") + ".png"
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
        h = DATA.hogs[hn]
      var tags = (h.tags || "").split("|").filter(Boolean),
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
    var auto = it && (!it.data.hog || it.data.hog === AUTO)
    grid.textContent = ""
    $("gCount").textContent = q.trim()
      ? list.length
        ? list.length + (list.length === 1 ? " match, best first" : " matches, best first")
        : "No matches. Try another word."
      : list.length + " hoggies"
    if (!q.trim()) {
      var a = document.createElement("button")
      a.type = "button"
      a.className = "g-item auto"
      a.setAttribute("aria-pressed", auto ? "true" : "false")
      a.innerHTML =
        '<span class="auto-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg></span>'
      var s0 = document.createElement("span")
      s0.textContent = "Auto (match company)"
      a.appendChild(s0)
      a.addEventListener("click", function () {
        edit({ hog: AUTO })
        gallery.close()
      })
      grid.appendChild(a)
    }
    list.forEach(function (hn) {
      var b = document.createElement("button")
      b.type = "button"
      b.className = "g-item"
      b.setAttribute("aria-pressed", it && !auto && it.data.hog === hn ? "true" : "false")
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
    $("gQuery").value = ""
    renderGallery()
    if (gallery.showModal) gallery.showModal()
    else gallery.setAttribute("open", "")
    $("gQuery").focus()
  }
  $("gQuery").addEventListener("input", renderGallery)
  $("gClose").addEventListener("click", function () {
    gallery.close()
  })
  gallery.addEventListener("click", function (e) {
    if (e.target === gallery) gallery.close()
  })

  // ---------- Links that make an image (for agents and scripts) ----------
  // Values travel as hex-encoded UTF-8 JSON: #new-<hex>. Keys: company (required), hoggie, color, tone, ink.
  function hashStr(s) {
    var h = 5381
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
    return (h >>> 0).toString(36) + "-" + s.length.toString(36)
  }
  function readLinkRequest() {
    var m = /^#new-([0-9a-fA-F]+)$/.exec(location.hash || "")
    if (!m || m[1].length % 2) return null
    try {
      var hex = m[1].toLowerCase(),
        bytes = new Uint8Array(hex.length / 2)
      for (var i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
      var o = JSON.parse(new TextDecoder().decode(bytes))
      if (!o || typeof o !== "object" || typeof o.company !== "string" || !o.company.trim())
        return null
      var d = blank()
      d.company = o.company.trim().slice(0, 200)
      d.lib = ""
      d.findOnOpen = true
      if (typeof o.hoggie === "string" && o.hoggie.trim()) d.hog = o.hoggie.trim()
      if (TONES[o.color]) d.color = o.color
      if (o.tone === "light" || o.tone === "mid" || o.tone === "dark") d.tone = o.tone
      if (o.ink === "light" || o.ink === "dark") d.ink = o.ink
      d.linkKey = hashStr(hex)
      return d
    } catch (e) {
      return null
    }
  }
  var linkReq = readLinkRequest()
  function clearHash() {
    try {
      history.replaceState(null, "", location.pathname + location.search)
    } catch (e) {
      try {
        location.hash = ""
      } catch (e2) {}
    }
  }
  function applyLinkRequest() {
    if (!linkReq) return false
    var req = linkReq
    linkReq = null
    clearHash()
    var existing = state.items.filter(function (it) {
      return it.data && it.data.linkKey === req.linkKey
    })[0]
    if (existing) {
      select(existing.id)
      setSave("Opened the image made from this link")
      return true
    }
    state.items = state.items.filter(function (it) {
      return !it.sample
    })
    addItem(req)
    setSave("Made from link: " + displayName(req))
    if ((DATA.customers || []).length) {
      edit({ findOnOpen: false })
      runFind()
    }
    return true
  }
  __on(window, "hashchange", function () {
    var r = readLinkRequest()
    if (r) {
      linkReq = r
      if (state.live) applyLinkRequest()
    }
  })

  // ---------- Boot ----------
  state.items = [{ id: uid(), data: blank(), sample: true }]
  state.currentId = state.items[0].id
  renderList()
  fillForm()
  queueRedraw()

  Promise.resolve(env.data)
    .then(function (j) {
      DATA = j
      custIndex = null

      var faces = ["600", "700"]
        .filter(function (w) {
          return j.fonts[w]
        })
        .map(function (w) {
          var ff = new FontFace("RoundHog", "url(" + blob(j.fonts[w]) + ") format('woff2')", {
            weight: w,
            style: "normal",
          })
          document.fonts.add(ff)
          return ff.load()
        })
      Promise.all(faces).then(
        function () {
          metricsCache = {}
          renderList()
          queueRedraw()
        },
        function () {},
      )
      lastCardHog = null
      lastLogoKey = null
      fillForm()
      renderList()
      queueRedraw()
      var ci = current()
      if (ci && ci.data.findOnOpen) {
        edit({ findOnOpen: false })
        runFind()
      }
    })
    .catch(function () {
      setSave("Couldn’t load hoggies, logos and fonts. Reload to try again.")
    })

  if (env.host && env.host.use) {
    env.host.use("downloads").then(function (d) {
      state.downloads = d
    })
    env.host.use("assets").then(function (a) {
      state.assets = a
      lastLogoKey = null
      queueRedraw()
    })
    env.host.use("db").then(function (db) {
      state.db = db
      var touched = false
      db.collection("images")
        .orderBy("createdAt", "desc")
        .onSnapshot(
          function (snap) {
            var remote = snap.docs.map(function (doc) {
              return { id: doc.id, data: JSON.parse(JSON.stringify(doc.data() || {})) }
            })
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
            if (!touched && !remote.length) {
              state.live = true
              if (!applyLinkRequest()) renderList()
              return
            } // empty store: keep the sample, unsaved
            state.items = merged
            touched = true
            if (!byId(state.currentId)) state.currentId = merged.length ? merged[0].id : null
            state.live = true
            if (applyLinkRequest()) return
            if (!state.currentId) {
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
