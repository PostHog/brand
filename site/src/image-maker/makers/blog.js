// Plain DOM code: ImageMaker.tsx injects MARKUP into the page, then calls mount(), which returns
// a cleanup function. env.host (image-maker/host.ts) provides storage, uploads and downloads, and
// env.data the maker's data (image-maker/data.ts).
/* eslint-disable */
// oxlint-disable
export const MARKUP =
  '<div class="main">\n    <div class="maker-head">\n        <div class="mh-text page-header">\n          <a class="eyebrow" href="/tools/images" data-mk-home title="All image makers">image makers</a>\n          <h1>Blog images</h1>\n          <p class="mh-desc">Post and newsletter headers with a highlighted phrase, the author and a hoggie matched to the title.</p>\n        </div>\n        <div class="mh-side">\n          <div class="dl">\n      <label for="dlSize" hidden>Download size</label>\n      <select id="dlSize" title="Download size">\n        <option value="1">1920 \u00d7 1080</option>\n        <option value="2">3840 \u00d7 2160 (2\u00d7)</option>\n      </select>\n      <button class="btn btn-primary" id="downloadBtn" type="button">\n        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>\n        Download PNG\n      </button>\n    </div>\n          <div class="mh-status"><span class="doc-name" id="docName">Untitled post</span><span class="save-state" id="saveState" aria-live="polite"></span></div>\n        </div>\n      </div>\n    <nav class="list" aria-label="Blog images">\n      <div class="list-head">\n        <button class="btn new-btn" id="newBtn" type="button">\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>\n          New image\n        </button>\n        <span class="list-label" id="listLabel">Images</span>\n      </div>\n      <div id="notice"></div>\n      <ol class="thumbs" id="thumbs"></ol>\n    </nav>\n\n    <main class="stage">\n      <div class="canvas-wrap"><canvas id="stage" width="1920" height="1080" aria-label="Blog image preview"></canvas></div>\n      <p class="stage-hint" id="stageHint">Click the hoggie on the image to choose a different one.</p>\n    </main>\n\n    <aside class="props" aria-label="Image settings">\n      <section class="mk-section">\n        <h2>Post type</h2>\n        <label class="switch"><input id="fSeo" type="checkbox"> <span>SEO / AEO post</span></label>\n        <span class="hint" id="seoHint">Limits hoggies and colors to the SEO / AEO set.</span>\n      </section>\n\n      <section class="mk-section">\n        <h2>Post</h2>\n        <div class="field">\n          <label for="fTitle">Title</label>\n          <textarea class="input" id="fTitle" rows="3" spellcheck="true"></textarea>\n          <span class="hint">Lines wrap on their own. Press Enter to force a line break.</span>\n        </div>\n        <div class="field">\n          <label for="fDesc">Description <span class="hint">(optional)</span></label>\n          <textarea class="input" id="fDesc" rows="2" spellcheck="true"></textarea>\n          <span class="hint">Not drawn on the image. The automatic hoggie matches the title and this text.</span>\n        </div>\n        <div class="field">\n          <label for="fHl">Highlight</label>\n          <input class="input" id="fHl" type="text" autocomplete="off" placeholder="A word or phrase from the title">\n          <span class="hint" id="hlHint">Leave empty for no highlight.</span>\n        </div>\n        <div class="field" id="subRow" hidden>\n          <label for="fSub">Subheading <span class="hint">(optional)</span></label>\n          <textarea class="input" id="fSub" rows="2" spellcheck="true"></textarea>\n          <span class="hint">Wrap words in **double asterisks** to make them bold. Leave empty to hide it.</span>\n        </div>\n        <div class="field">\n          <label for="fAuthor">Author</label>\n          <input class="input" id="fAuthor" type="text" autocomplete="off" placeholder="First Last">\n          <div class="co-authors" id="coAuthors"></div>\n          <div class="actions"><button class="btn btn-sm" id="addAuthor" type="button">Add another author</button></div>\n          <span class="hint" id="authorHint">Each author gets their own line, up to 3.</span>\n        </div>\n      </section>\n\n      <section class="mk-section">\n        <h2>Hoggie</h2>\n        <div class="hog-card">\n          <button class="pic" id="hogPic" type="button" aria-label="Choose hoggie"></button>\n          <div class="info">\n            <span class="name" id="hogName">Hoggie</span>\n            <span class="how" id="hogHow"></span>\n            <div class="actions">\n              <button class="btn btn-sm" id="chooseHog" type="button">Choose hoggie</button>\n            </div>\n          </div>\n        </div>\n        <label class="switch"><input id="fAuto" type="checkbox"> <span>Match the title automatically</span></label>\n        <div class="field">\n          <label for="fSize">Size</label>\n          <div class="range-row"><input id="fSize" type="range" min="75" max="125" step="5"><output id="oSize" for="fSize"></output></div>\n        </div>\n        <div class="field">\n          <label for="fX">Move left / right</label>\n          <div class="range-row"><input id="fX" type="range" min="-20" max="20" step="1"><output id="oX" for="fX"></output></div>\n        </div>\n        <div class="field">\n          <label for="fY">Move down / up</label>\n          <div class="range-row"><input id="fY" type="range" min="-20" max="20" step="1"><output id="oY" for="fY"></output></div>\n        </div>\n        <label class="switch"><input id="fFlip" type="checkbox"> <span>Flip to face the other way</span></label>\n      </section>\n\n      <section class="mk-section">\n        <h2>Colors</h2>\n        <div class="field"><span class="lbl" id="lblBg">Background</span><div class="swatches" id="swBg" role="group" aria-labelledby="lblBg"></div></div>\n        <div class="field" id="toneRow">\n          <span class="lbl" id="lblTone">Tone</span>\n          <div class="seg" role="group" aria-labelledby="lblTone">\n            <button type="button" data-tone="light" aria-pressed="true">Light</button>\n            <button type="button" data-tone="mid" aria-pressed="false">Midtone</button>\n            <button type="button" data-tone="dark" aria-pressed="false">Dark</button>\n          </div>\n          <span class="hint" id="toneHint"></span>\n        </div>\n        <div class="field" id="midRow">\n          <span class="lbl" id="lblMid">Text on midtone</span>\n          <div class="seg" role="group" aria-labelledby="lblMid">\n            <button type="button" data-mid="dark" aria-pressed="true">Dark</button>\n            <button type="button" data-mid="white" aria-pressed="false">White</button>\n          </div>\n        </div>\n        <div class="field" id="hlRow"><span class="lbl" id="lblHl">Highlight</span><div class="swatches" id="swHl" role="group" aria-labelledby="lblHl"></div></div>\n      </section>\n\n      <section class="mk-section">\n        <h2>This image</h2>\n        <div class="actions" id="imgActions"></div>\n      </section>\n    </aside>\n  </div>\n\n<dialog class="gallery" id="gallery" aria-labelledby="gTitle">\n  <div class="g-wrap">\n    <div class="g-head">\n      <div class="g-title">\n        <h2 id="gTitle">Choose a hoggie</h2>\n        <button class="icon-btn" id="gClose" type="button" aria-label="Close">\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>\n        </button>\n      </div>\n      <div class="g-search">\n        <label for="gQuery" hidden>Search hoggies</label>\n        <input class="input" id="gQuery" type="search" placeholder="Search: sql, experiments, coffee, wizard\u2026" autocomplete="off">\n        <span class="g-count" id="gCount"></span>\n      </div>\n    </div>\n    <div class="g-grid" id="gGrid"></div>\n  </div>\n</dialog>\n\n'

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
  var HL = {
    blue: ["hsl(205, 84%, 49%)", "hsla(205, 84%, 49%, 0.2)"],
    teal: ["hsl(165, 67%, 56%)", "hsla(165, 67%, 56%, 0.2)"],
    purple: ["hsl(283, 63%, 52%)", "hsla(283, 63%, 52%, 0.2)"],
    tangerine: ["hsl(17, 100%, 55%)", "hsla(17, 100%, 55%, 0.2)"],
    green: ["hsl(132, 54%, 53%)", "hsla(132, 54%, 53%, 0.2)"],
    white: ["#ffffff", "rgba(255, 255, 255, 0.25)"],
  }
  var COLOR_KEYS = Object.keys(TONES)
  var HL_KEYS = Object.keys(HL)
  // White highlight only works on white text: offered on Dark tone and on Midtone with white text.
  function whiteHlAllowed(d) {
    var t = d.tone || "light"
    return t === "dark" || (t === "mid" && d.midText === "white")
  }
  function hlKeysFor(d) {
    return whiteHlAllowed(d)
      ? HL_KEYS
      : HL_KEYS.filter(function (k) {
          return k !== "white"
        })
  }
  // A tone/text change that would leave a white highlight where it isn't offered falls back to purple.
  function toneEdit(d, patch) {
    var next = {}
    Object.keys(d).forEach(function (k) {
      next[k] = d[k]
    })
    Object.keys(patch).forEach(function (k) {
      next[k] = patch[k]
    })
    if (next.highlight === "white" && !whiteHlAllowed(next)) patch.highlight = "purple"
    return patch
  }
  var AUTO = "Auto (match title)"
  var FALLBACK_HOG = "Hogpatch"
  // SEO / AEO posts: a fixed set of hoggies and light backgrounds; the highlight matches the background.
  var SEO_COLORS = ["tangerine", "lemon", "blue", "green", "purple"]
  var SEO_HL = {
    tangerine: "tangerine",
    lemon: "teal",
    blue: "blue",
    green: "green",
    purple: "purple",
  } // highlight per background
  var SEO_HOGS = ["Reading", "Basketball Coach", "Float", "Organized", "Luchador"] // Luchador shows once it's in the library
  var SEO_AUTHOR = "Natalia Amorim"
  function seoHogs() {
    return SEO_HOGS.filter(function (n) {
      return DATA.hogs[n]
    })
  }
  var FONT = '"RoundHog", system-ui, -apple-system, "Segoe UI", sans-serif'
  var W = 1920,
    H = 1080,
    PAD_X = 128,
    PAD_Y = 120

  var DATA = { fonts: {}, logos: {}, hogs: {} } // filled from app-data.json
  var state = {
    items: [],
    currentId: null,
    db: null,
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
        .slice(0, 60) || "blog-image"
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
  function plainTitle(d) {
    return (
      String(d.title || "")
        .replace(/\s*[\n|]\s*/g, " ")
        .trim() || "Untitled post"
    )
  }

  // Authors: the main one plus up to 2 co-authors, each drawn on its own line.
  var MAX_AUTHORS = 3
  function authorsOf(d) {
    return [d.author]
      .concat(d.coAuthors || [])
      .map(function (a) {
        return String(a || "")
          .replace(/[\n|]/g, " ")
          .trim()
      })
      .filter(Boolean)
  }
  function authorLabel(d) {
    return authorsOf(d).join(", ") || "No author"
  }
  function blank() {
    var now = Date.now()
    return {
      title: "The hidden cost of running your own analytics",
      hlText: "hidden",
      sub: "",
      description: "",
      author: "First Last",
      hog: AUTO,
      hogSize: 100,
      hogX: 0,
      hogY: 0,
      flip: false,
      color: "lemon",
      tone: "light",
      midText: "dark",
      highlight: "purple",
      createdAt: now,
      updatedAt: now,
    }
  }

  // ---------- Auto hoggie: topics score 3, tags score 1 ----------
  function autoHog(d) {
    var kw = DATA.hogs
    var text =
      " " +
      (String(d.title || "") + " " + String(d.sub || "") + " " + String(d.description || ""))
        .toLowerCase()
        .replace(/’/g, "'")
        .replace(/-/g, " ")
        .replace(/[^a-z0-9'\/+ ]+/g, " ")
        .replace(/\s+/g, " ")
        .trim() +
      " "
    function has(k) {
      return k && (text.indexOf(" " + k + " ") >= 0 || text.indexOf(" " + k + "s ") >= 0)
    }
    var pool = d.seo ? seoHogs() : Object.keys(kw)
    var best = d.seo ? pool[0] || FALLBACK_HOG : FALLBACK_HOG,
      bestScore = 0
    pool.forEach(function (name) {
      var s = 0,
        h = kw[name] || {}
      ;(h.topics || "").split("|").forEach(function (k) {
        if (has(k)) s += 3
      })
      ;(h.tags || "").split("|").forEach(function (k) {
        if (has(k)) s += 1
      })
      if (s > bestScore) {
        best = name
        bestScore = s
      }
    })
    return best
  }
  function resolvedHog(d) {
    if (!d.hog || d.hog === AUTO || !DATA.hogs[d.hog]) return autoHog(d)
    if (d.seo && seoHogs().indexOf(d.hog) < 0) return autoHog(d)
    return d.hog
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
    // Hoggie SVGs often have only a viewBox, so give them an explicit size before drawing to canvas.
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

  // ---------- Text layout ----------
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
    var asc = m.fontBoundingBoxAscent || size * 0.93,
      desc = m.fontBoundingBoxDescent || size * 0.24
    return (metricsCache[k] = { asc: asc, desc: desc })
  }

  // Turns text into paragraphs of words; each word is a list of pieces {t, w (weight), hl}.
  // marks: per-character {w, hl}. Breaks at "\n" or "|".
  function toParagraphs(text, marks) {
    var paras = [[]],
      word = null,
      prevPiece = null
    function endWord() {
      if (word && word.length) paras[paras.length - 1].push(word)
      word = null
      prevPiece = null
    }
    for (var i = 0; i < text.length; i++) {
      var ch = text[i]
      if (ch === "\n" || ch === "|") {
        endWord()
        paras.push([])
        continue
      }
      if (/\s/.test(ch)) {
        endWord()
        continue
      }
      var mk = marks[i]
      if (!word) word = []
      if (prevPiece && prevPiece.w === mk.w && prevPiece.hl === mk.hl) prevPiece.t += ch
      else {
        prevPiece = { t: ch, w: mk.w, hl: mk.hl }
        word.push(prevPiece)
      }
    }
    endWord()
    return paras.filter(function (p, idx) {
      return p.length || idx === 0
    })
  }
  function pieceW(p, size, ls) {
    mctx.font = fontStr(p.w, size)
    setLS(mctx, ls + "px")
    var w = mctx.measureText(p.t).width
    setLS(mctx, "0px")
    return w
  }
  // Greedy wrap one paragraph at width maxW. Returns lines of words with measured widths.
  function wrapPara(words, maxW, size, ls, spaceW, hlPad) {
    var lines = [],
      cur = [],
      curW = 0
    words.forEach(function (wd) {
      var ww = wd.reduce(function (s, p) {
        return s + p.width
      }, 0)
      var add = (cur.length ? spaceW : 0) + ww
      if (cur.length && curW + add > maxW) {
        lines.push({ words: cur, w: curW })
        cur = [wd]
        curW = ww
      } else {
        cur.push(wd)
        curW += add
      }
    })
    if (cur.length || !lines.length) lines.push({ words: cur, w: curW })
    return lines
  }
  function layoutBlock(text, marks, opts) {
    var paras = toParagraphs(text, marks)
    mctx.font = fontStr(opts.weight, opts.size)
    setLS(mctx, opts.ls + "px")
    var spaceW = mctx.measureText(" ").width
    setLS(mctx, "0px")
    paras.forEach(function (words) {
      words.forEach(function (wd) {
        wd.forEach(function (p) {
          p.width = pieceW(p, opts.size, opts.ls)
        })
      })
    })
    var out = []
    paras.forEach(function (words) {
      var lines = wrapPara(words, opts.maxW, opts.size, opts.ls, spaceW)
      if (opts.balance && lines.length > 1) {
        // Narrowest width that keeps the same number of lines (CSS text-wrap: balance).
        var lo = opts.maxW * 0.4,
          hi = opts.maxW,
          n = lines.length
        for (var k = 0; k < 18; k++) {
          var mid = (lo + hi) / 2
          if (wrapPara(words, mid, opts.size, opts.ls, spaceW).length > n) lo = mid
          else hi = mid
        }
        lines = wrapPara(words, hi, opts.size, opts.ls, spaceW)
      }
      lines.forEach(function (l) {
        out.push(l)
      })
    })
    return { lines: out, spaceW: spaceW }
  }
  function drawBlock(ctx, block, x, top, opts, colors) {
    var lh = opts.size * opts.lh
    var vm = vMetrics(opts.weight, opts.size)
    var pad = opts.size * 0.1,
      rad = opts.size * 0.125
    block.lines.forEach(function (line, li) {
      var baseline = top + li * lh + (lh - (vm.asc + vm.desc)) / 2 + vm.asc
      // Lay out pieces, adding the highlight padding at each highlighted run's edges.
      var cx = x,
        items = [],
        prevHl = false
      line.words.forEach(function (wd, wi) {
        if (wi > 0) {
          var nextHl = wd[0].hl
          if (prevHl && !nextHl) {
            cx += pad
            prevHl = false
          }
          var sp = { gap: true, x: cx, w: block.spaceW, hl: prevHl && nextHl }
          items.push(sp)
          cx += block.spaceW
        }
        wd.forEach(function (p) {
          if (p.hl && !prevHl) cx += pad
          if (!p.hl && prevHl) cx += pad
          items.push({ p: p, x: cx, w: p.width, hl: p.hl })
          cx += p.width
          prevHl = p.hl
        })
      })
      // Highlight boxes behind each run.
      var run = null
      function closeRun() {
        if (!run) return
        ctx.fillStyle = colors.hlBox
        // Same as the PostHog Deck headings: one band per line, centred on the letters and a little
        // shorter than the line height, so bands on stacked lines never touch or overlap.
        var bandH = lh - Math.max(3, Math.round(opts.size * 0.045)),
          cy = baseline + (vm.desc - vm.asc) / 2
        roundRect(ctx, run.x0 - pad, cy - bandH / 2, run.x1 - run.x0 + pad * 2, bandH, rad)
        ctx.fill()
        run = null
      }
      items.forEach(function (it) {
        if (it.hl) {
          if (!run) run = { x0: it.x, x1: it.x + it.w }
          else run.x1 = it.x + it.w
        } else closeRun()
      })
      closeRun()
      items.forEach(function (it) {
        if (it.gap) return
        ctx.font = fontStr(it.p.w, opts.size)
        setLS(ctx, opts.ls + "px")
        ctx.fillStyle = it.hl ? colors.hl : colors.text
        ctx.fillText(it.p.t, it.x, baseline)
      })
      setLS(ctx, "0px")
    })
    return block.lines.length * lh
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  // ---------- Renderer (1920 × 1080 units, matches the canvas template) ----------
  function look(d) {
    var t = TONES[d.color] || TONES.lemon
    if (d.seo && SEO_COLORS.indexOf(d.color) < 0) t = TONES.tangerine
    var tone = d.seo ? "light" : d.tone === "mid" || d.tone === "dark" ? d.tone : "light"
    var dark = tone === "dark",
      mid = tone === "mid"
    var whiteText = mid && d.midText === "white"
    var lightText = dark || whiteText
    var h = HL[d.highlight] || HL.purple
    if (d.seo) h = HL[SEO_HL[SEO_COLORS.indexOf(d.color) < 0 ? "tangerine" : d.color]]
    return {
      base: mid ? t[1] : dark ? t[2] : t[0],
      wash: mid ? null : dark ? "rgba(30, 31, 35, 0.7)" : "rgba(255, 255, 255, 0.7)",
      text: lightText ? "#ffffff" : "#1e1f23",
      sub: dark
        ? "#d1d5db"
        : whiteText
          ? "rgba(255, 255, 255, 0.9)"
          : mid
            ? "rgba(30, 31, 35, 0.85)"
            : "#374151",
      titleW: lightText ? 500 : 600,
      authorW: lightText ? 400 : 500,
      boldW: lightText ? 600 : 700,
      hl: h[0],
      hlBox: h[1],
    }
  }
  function containTop(im, bx, by, bw, bh) {
    var k = Math.min(bw / im.naturalWidth, bh / im.naturalHeight)
    var w = im.naturalWidth * k,
      h = im.naturalHeight * k
    return { x: bx + (bw - w) / 2, y: by, w: w, h: h }
  }
  function highlightMarks(title, word, weight) {
    var marks = []
    for (var i = 0; i < title.length; i++) marks.push({ w: weight, hl: false })
    var w = String(word || "").trim(),
      idx = w ? title.toLowerCase().indexOf(w.toLowerCase()) : -1
    if (idx >= 0) for (var j = idx; j < idx + w.length; j++) marks[j] = { w: 600, hl: true }
    return { marks: marks, found: idx >= 0 || !w }
  }
  function subMarks(sub, normal, bold) {
    // Remove ** markers; text between pairs is bold.
    var parts = String(sub || "").split("**"),
      text = "",
      marks = []
    parts.forEach(function (part, k) {
      for (var i = 0; i < part.length; i++) {
        text += part[i]
        marks.push({ w: k % 2 ? bold : normal, hl: false })
      }
    })
    return { text: text.trim() ? text : "", marks: marks }
  }

  // Returns the hoggie's hit rectangle (in 1920×1080 units).
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

    // Hoggie: 1000px box, right edge, top 254; scaled and moved around (1420, 1080).
    var hit = null
    var name = resolvedHog(d)
    var im = img(hogUrl(name))
    var size = clamp(d.hogSize, 75, 125, 100) / 100
    var tx = clamp(d.hogX, -20, 20, 0) * 10,
      ty = -clamp(d.hogY, -20, 20, 0) * 10
    var ox = 1420,
      oy = 1080
    if (im) {
      var r = containTop(im, 920, 254, 1000, 1000)
      ctx.save()
      ctx.translate(ox + tx, oy + ty)
      ctx.scale(d.flip ? -size : size, size)
      ctx.translate(-ox, -oy)
      ctx.drawImage(im, r.x, r.y, r.w, r.h)
      ctx.restore()
      var x1 = ox + tx + (r.x - ox) * size,
        x2 = ox + tx + (r.x + r.w - ox) * size
      hit = {
        x: Math.min(x1, x2),
        y: oy + ty + (r.y - oy) * size,
        w: Math.abs(x2 - x1),
        h: r.h * size,
      }
    } else {
      hit = { x: 920, y: 254, w: 1000, h: 826 }
    }

    // Title
    var title = String(d.title || "")
    var hm = highlightMarks(title, d.hlText, L.titleW)
    var tOpts = {
      size: 128,
      weight: L.titleW,
      ls: -1.28,
      lh: 1.05,
      maxW: W - PAD_X * 2,
      balance: true,
    }
    var tBlock = layoutBlock(title, hm.marks, tOpts)
    var titleH = drawBlock(ctx, tBlock, PAD_X, PAD_Y, tOpts, {
      text: L.text,
      hl: L.hl,
      hlBox: L.hlBox,
    })

    // Subheading: one title line (134px) below the title.
    var sm = subMarks(d.sub, 400, L.boldW)
    if (sm.text) {
      var sOpts = { size: 64, weight: 400, ls: 0, lh: 1.2, maxW: 720, balance: false }
      var sBlock = layoutBlock(sm.text, sm.marks, sOpts)
      drawBlock(ctx, sBlock, PAD_X, PAD_Y + titleH + 134, sOpts, {
        text: L.sub,
        hl: L.sub,
        hlBox: "transparent",
      })
    }

    // Author, sitting on the bottom padding.
    var author = authorsOf(d).join("\n")
    if (author) {
      var aOpts = {
        size: 48,
        weight: L.authorW,
        ls: 0,
        lh: 1.2,
        maxW: W - PAD_X * 2,
        balance: false,
      }
      var aMarks = []
      for (var i = 0; i < author.length; i++) aMarks.push({ w: L.authorW, hl: false })
      var aBlock = layoutBlock(author, aMarks, aOpts)
      var aH = aBlock.lines.length * 48 * 1.2
      drawBlock(ctx, aBlock, PAD_X, H - PAD_Y - aH, aOpts, {
        text: L.sub,
        hl: L.sub,
        hlBox: "transparent",
      })
    }
    ctx.restore()
    return { hit: hit, hlFound: hm.found, hog: name }
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
      updateHlHint(res.hlFound, it.data)
      updateHogCard(res.hog, it.data)
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
      t.textContent = plainTitle(it.data)
      var dd = document.createElement("span")
      dd.className = "d"
      dd.textContent = authorLabel(it.data)
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
    var d = it.data
    setVal("fTitle", d.title || "")
    setVal("fHl", d.hlText || "")
    setVal("fDesc", d.description || "")
    setVal("fSub", d.sub || "")
    setVal("fAuthor", d.author || "")
    renderCoAuthors(d)
    // Subheadings are retired for new images: the field only shows on images that already have one.
    $("subRow").hidden = !String(d.sub || "").trim()
    var hs = clamp(d.hogSize, 75, 125, 100),
      hx = clamp(d.hogX, -20, 20, 0),
      hy = clamp(d.hogY, -20, 20, 0)
    $("fSize").value = hs
    $("oSize").textContent = hs + "%"
    $("fX").value = hx
    $("oX").textContent = hx
    $("fY").value = hy
    $("oY").textContent = hy
    $("fFlip").checked = !!d.flip
    $("fAuto").checked = !d.hog || d.hog === AUTO
    var tone = d.tone || "light"
    document.querySelectorAll("[data-tone]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.tone === tone ? "true" : "false")
    })
    document.querySelectorAll("[data-mid]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.mid === (d.midText || "dark") ? "true" : "false")
    })
    var seo = !!d.seo
    $("fSeo").checked = seo
    $("seoHint").textContent = seo
      ? "SEO / AEO hoggies only, light backgrounds, and the highlight matches the background."
      : "Limits hoggies and colors to the SEO / AEO set."
    $("toneRow").hidden = seo
    $("hlRow").hidden = seo
    $("midRow").hidden = seo || tone !== "mid"
    $("toneHint").textContent =
      tone === "light"
        ? "The 300 tone under a 70% white wash."
        : tone === "dark"
          ? "The 700 tone under a 70% dark wash, with white text."
          : "The 500 tone, full strength."
    var bgSel = seo && SEO_COLORS.indexOf(d.color) < 0 ? "tangerine" : d.color
    swatchesInto(
      $("swBg"),
      seo ? SEO_COLORS : COLOR_KEYS,
      bgSel,
      function (k) {
        return TONES[k][1]
      },
      function (k) {
        edit({ color: k })
      },
    )
    swatchesInto(
      $("swHl"),
      hlKeysFor(d),
      d.highlight,
      function (k) {
        return HL[k][0]
      },
      function (k) {
        edit({ highlight: k })
      },
    )
    $("docName").textContent = plainTitle(d)
    renderDelete()
  }
  function updateHlHint(found, d) {
    var h = $("hlHint")
    if (!String(d.hlText || "").trim()) {
      h.textContent = "Leave empty for no highlight."
      h.className = "hint"
    } else if (!found) {
      h.textContent = "That text isn’t in the title, so nothing is highlighted."
      h.className = "hint warn"
    } else {
      h.textContent = "Highlighted in the title. Leave empty for no highlight."
      h.className = "hint"
    }
  }
  var lastCardHog = null
  function updateHogCard(name, d) {
    var auto = !d.hog || d.hog === AUTO
    $("hogName").textContent = name
    $("hogHow").textContent = auto ? "Picked from your title" : "Chosen by you"
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
    else $("docName").textContent = plainTitle(next)
    queueRedraw()
    var t = document.querySelector('.thumb[aria-current="true"] .t')
    if (t) t.textContent = plainTitle(it.data)
    var dd = document.querySelector('.thumb[aria-current="true"] .d')
    if (dd) dd.textContent = authorLabel(it.data)
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
  $("fHl").addEventListener("input", function (e) {
    edit({ hlText: e.target.value }, { noForm: true })
  })
  $("fDesc").addEventListener("input", function (e) {
    edit({ description: e.target.value }, { noForm: true })
  })
  $("fSub").addEventListener("input", function (e) {
    edit({ sub: e.target.value }, { noForm: true })
  })
  $("fAuthor").addEventListener("input", function (e) {
    edit({ author: e.target.value }, { noForm: true })
  })
  function renderCoAuthors(d) {
    var box = $("coAuthors"),
      list = (d.coAuthors || []).slice(0, MAX_AUTHORS - 1)
    // Leave the rows alone while someone is typing in one, so focus and the cursor stay put.
    if (box.contains(document.activeElement) && box.children.length === list.length) return
    box.textContent = ""
    list.forEach(function (name, i) {
      var row = document.createElement("div")
      row.className = "co-row"
      var inp = document.createElement("input")
      inp.className = "input"
      inp.type = "text"
      inp.id = "fCoAuthor" + (i + 2)
      inp.autocomplete = "off"
      inp.placeholder = "First Last"
      inp.value = name || ""
      inp.setAttribute("aria-label", "Author " + (i + 2))
      inp.addEventListener("input", function () {
        var it = current()
        if (!it) return
        var a = (it.data.coAuthors || []).slice()
        a[i] = inp.value
        edit({ coAuthors: a }, { noForm: true })
      })
      var rm = document.createElement("button")
      rm.type = "button"
      rm.className = "icon-btn"
      rm.setAttribute("aria-label", "Remove author " + (i + 2))
      rm.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
      rm.addEventListener("click", function () {
        var it = current()
        if (!it) return
        var a = (it.data.coAuthors || []).slice()
        a.splice(i, 1)
        edit({ coAuthors: a })
      })
      row.appendChild(inp)
      row.appendChild(rm)
      box.appendChild(row)
    })
    $("addAuthor").hidden = list.length >= MAX_AUTHORS - 1
    $("authorHint").textContent =
      list.length >= MAX_AUTHORS - 1
        ? "That’s the most that fit: 3 authors."
        : "Each author gets their own line, up to 3."
  }
  $("addAuthor").addEventListener("click", function () {
    var it = current()
    if (!it) return
    var a = (it.data.coAuthors || []).slice()
    if (a.length >= MAX_AUTHORS - 1) return
    a.push("")
    edit({ coAuthors: a })
    var inp = $("fCoAuthor" + (a.length + 1))
    if (inp) inp.focus()
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
  $("fSeo").addEventListener("change", function (e) {
    var it = current()
    if (!it) return
    if (!e.target.checked) {
      edit({ seo: false })
      return
    }
    var a = String(it.data.author || "").trim(),
      patch = { seo: true }
    if (!a || a === "First Last") patch.author = SEO_AUTHOR
    edit(patch)
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
      var it = current()
      if (!it) return
      var tone = b.dataset.tone
      if (tone === it.data.tone) return
      // Midtone starts with white text and a white highlight.
      edit(
        tone === "mid"
          ? { tone: "mid", midText: "white", highlight: "white" }
          : toneEdit(it.data, { tone: tone }),
      )
    })
  })
  document.querySelectorAll("[data-mid]").forEach(function (b) {
    b.addEventListener("click", function () {
      var it = current()
      if (!it) return
      edit(toneEdit(it.data, { midText: b.dataset.mid }))
    })
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
    var name = slug(plainTitle(it.data)) + (k === 2 ? "@2x" : "") + ".png"
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
    var cur = current()
    var names = cur && cur.data.seo ? seoHogs() : Object.keys(DATA.hogs)
    var q = query.toLowerCase().trim()
    if (!q) return names
    var words = q.split(/[\s,]+/).filter(Boolean),
      out = []
    names.forEach(function (hn) {
      var nm = hn.toLowerCase(),
        h = DATA.hogs[hn]
      var tags = (h.tags || "").split("|").filter(Boolean),
        topics = (h.topics || "").split("|").filter(Boolean),
        score = 0
      if (nm === q) score += 20
      if (tags.indexOf(q) >= 0 || topics.indexOf(q) >= 0) score += 10
      words.forEach(function (w) {
        if ((" " + nm + " ").indexOf(" " + w + " ") >= 0) score += 6
        else if (nm.indexOf(w) >= 0) score += 3
        topics.forEach(function (t) {
          if (t === w || t === w.replace(/s$/, "")) score += 5
        })
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
      s0.textContent = "Auto (match title)"
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
  // #new-<hex>: hex-encoded UTF-8 JSON makes a new image when the page opens. Keys: title
  // (required), description, highlight, author (or authors: [..] up to 3), hoggie, color, tone,
  // highlightColor.
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
      if (!o || typeof o !== "object") return null
      var str = function (v, max) {
        return typeof v === "string" ? v.slice(0, max) : ""
      }
      var title = str(o.title, 300).trim()
      if (!title) return null
      var d = blank()
      d.title = title
      d.hlText = str(o.highlight, 120).trim()
      d.description = str(o.description, 600).trim()
      d.author = str(o.author, 120).trim()
      if (Array.isArray(o.authors)) {
        var au = o.authors
          .map(function (x) {
            return str(x, 120).trim()
          })
          .filter(Boolean)
          .slice(0, 3)
        if (au.length) {
          d.author = au[0]
          d.coAuthors = au.slice(1)
        }
      }
      if (typeof o.hoggie === "string" && o.hoggie.trim()) d.hog = o.hoggie.trim() // an unknown name falls back to Auto
      if (TONES[o.color]) d.color = o.color
      if (o.tone === "light" || o.tone === "mid" || o.tone === "dark") d.tone = o.tone
      if (HL[o.highlightColor]) d.highlight = o.highlightColor
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
  // Makes the image from the link once the saved images are known. Opening the same link again
  // selects the image it already made instead of making a copy.
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
    setSave("Made from link: " + plainTitle(req))
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

      var faces = ["400", "500", "600", "700"]
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
      fillForm()
      renderList()
      queueRedraw()
    })
    .catch(function () {
      setSave("Couldn’t load hoggies and fonts. Reload to try again.")
    })

  if (env.host && env.host.use) {
    env.host.use("downloads").then(function (d) {
      state.downloads = d
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
