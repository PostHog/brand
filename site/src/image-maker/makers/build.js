// Plain DOM code: ImageMaker.tsx injects MARKUP into the page, then calls mount(), which returns
// a cleanup function. env.host (image-maker/host.ts) provides storage, uploads and downloads, and
// env.data the maker's data (image-maker/data.ts).
/* eslint-disable */
// oxlint-disable
export const MARKUP =
  '<div class="main">\n    <div class="maker-head">\n        <div class="mh-text page-header">\n          <a class="eyebrow" href="/tools/images" data-mk-home title="All image makers">image makers</a>\n          <h1>Build mode images</h1>\n          <p class="mh-desc">Build mode art on the blueprint grid, made once and exported for LinkedIn, the website, X and Substack.</p>\n        </div>\n        <div class="mh-side">\n          <div class="dl">\n      <button class="btn" id="downloadOne" type="button">Download this size</button>\n      <button class="btn btn-primary" id="downloadAll" type="button">\n        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>\n        Download all sizes\n      </button>\n    </div>\n          <div class="mh-status"><span class="doc-name" id="docName">Untitled post</span><span class="save-state" id="saveState" aria-live="polite"></span></div>\n        </div>\n      </div>\n    <nav class="list" aria-label="Build mode images">\n      <div class="list-head">\n        <button class="btn new-btn" id="newBtn" type="button">\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>\n          New image\n        </button>\n        <span class="list-label" id="listLabel">Images</span>\n      </div>\n      <div id="notice"></div>\n      <ol class="thumbs" id="thumbs"></ol>\n    </nav>\n\n    <main class="stage">\n      <div class="stage-head">\n        <span class="size-name" id="sizeName">LinkedIn</span>\n        <span class="size-dims" id="sizeDims">1920 \u00d7 1080</span>\n        <span class="size-note" id="sizeNote"></span>\n      </div>\n      <div class="canvas-wrap" id="wrap"><canvas id="stage" width="1920" height="1080" aria-label="Build mode image preview"></canvas></div>\n      <div class="strip" id="strip"></div>\n      <p class="stage-hint" id="stageHint">Click the image area to upload or replace the image. Click a smaller size to work on it.</p>\n    </main>\n\n    <aside class="props" aria-label="Image settings">\n      <section class="mk-section">\n        <h2>Post</h2>\n        <div class="field">\n          <label for="fTitle">Title</label>\n          <textarea class="input" id="fTitle" rows="3" spellcheck="true"></textarea>\n          <span class="hint">Lines wrap on their own. Press Enter or type | to force a line break.</span>\n        </div>\n        <div class="field">\n          <label for="fHl">Highlight</label>\n          <input class="input" id="fHl" type="text" autocomplete="off" placeholder="A word or phrase from the title">\n          <span class="hint" id="hlHint">Leave empty for no highlight.</span>\n        </div>\n        <div class="field">\n          <span class="lbl" id="lblHl">Highlight color</span>\n          <div class="swatches" id="swHl" role="group" aria-labelledby="lblHl"></div>\n        </div>\n      </section>\n\n      <section class="mk-section">\n        <h2>Author</h2>\n        <div class="author-row">\n          <div class="avatar" id="authorAvatar" aria-hidden="true"></div>\n          <div class="field">\n            <label for="fAuthor">Author</label>\n            <select class="input" id="fAuthor"></select>\n          </div>\n        </div>\n        <div class="co-authors" id="coAuthors"></div>\n        <div class="actions"><button class="btn btn-sm" id="addAuthor" type="button">Add another author</button></div>\n        <span class="hint">Shows on LinkedIn and X, one row per author, up to 3. To add a person, add their photo to the build mode data in PostHog/brand.</span>\n      </section>\n\n      <section class="mk-section">\n        <h2>Image</h2>\n        <div class="pic-card">\n          <button class="pic" id="imgPic" type="button" aria-label="Upload image"></button>\n          <div class="info">\n            <span class="name" id="imgName">No image yet</span>\n            <span class="how" id="imgHow">PNG with a transparent background works best.</span>\n            <div class="actions">\n              <button class="btn btn-sm" id="uploadBtn" type="button">Upload image</button>\n              <button class="btn btn-sm danger" id="removeImg" type="button">Remove</button>\n            </div>\n          </div>\n        </div>\n        <input id="fileInput" type="file" accept="image/*" hidden>\n        <div class="field">\n          <label for="fImgSize">Size, all sizes</label>\n          <div class="range-row"><input id="fImgSize" type="range" min="50" max="150" step="5"><output id="oImgSize" for="fImgSize"></output></div>\n        </div>\n        <div class="field">\n          <label for="fImgX">Move left / right, all sizes</label>\n          <div class="range-row"><input id="fImgX" type="range" min="-600" max="600" step="10"><output id="oImgX" for="fImgX"></output></div>\n        </div>\n        <div class="field">\n          <label for="fImgY">Move down / up, all sizes</label>\n          <div class="range-row"><input id="fImgY" type="range" min="-600" max="600" step="10"><output id="oImgY" for="fImgY"></output></div>\n        </div>\n        <label class="switch"><input id="fFlip" type="checkbox"> <span>Flip the image</span></label>\n\n        <div class="sub-box">\n          <h3>Adjust for this size <span class="tag" id="fitTag">LinkedIn</span></h3>\n          <div class="field">\n            <label for="fFitSize">Size</label>\n            <div class="range-row"><input id="fFitSize" type="range" min="25" max="200" step="5"><output id="oFitSize" for="fFitSize"></output></div>\n          </div>\n          <div class="field">\n            <label for="fFitX">Move left / right</label>\n            <div class="range-row"><input id="fFitX" type="range" min="-600" max="600" step="10"><output id="oFitX" for="fFitX"></output></div>\n          </div>\n          <div class="field">\n            <label for="fFitY">Move down / up</label>\n            <div class="range-row"><input id="fFitY" type="range" min="-600" max="600" step="10"><output id="oFitY" for="fFitY"></output></div>\n          </div>\n          <div class="field">\n            <label for="fFitR">Rotate</label>\n            <div class="range-row"><input id="fFitR" type="range" min="-180" max="180" step="1"><output id="oFitR" for="fFitR"></output></div>\n          </div>\n          <div class="actions"><button class="btn btn-sm" id="fitReset" type="button">Reset this size</button></div>\n        </div>\n      </section>\n\n      <section class="mk-section">\n        <h2>Layout</h2>\n        <div class="field">\n          <label for="fGrid">Grid size</label>\n          <div class="range-row"><input id="fGrid" type="range" min="24" max="160" step="4"><output id="oGrid" for="fGrid"></output></div>\n        </div>\n        <label class="switch"><input id="fRip" type="checkbox"> <span>Paper rip</span></label>\n        <label class="switch"><input id="fLogo" type="checkbox"> <span>Build mode logo</span></label>\n        <div class="field">\n          <label for="fLogoSize">Logo size</label>\n          <div class="range-row"><input id="fLogoSize" type="range" min="60" max="167" step="1"><output id="oLogoSize" for="fLogoSize"></output></div>\n        </div>\n        <span class="hint">Substack never shows the logo, author or paper rip. Website never shows the author or paper rip.</span>\n      </section>\n\n      <section class="mk-section">\n        <h2>This image</h2>\n        <div class="actions" id="imgActions"></div>\n      </section>\n    </aside>\n  </div>\n\n'

export function mount(env) {
  "use strict"
  var __listeners = []
  function __on(target, type, fn) {
    target.addEventListener(type, fn)
    __listeners.push([target, type, fn])
  }

  // ---------- Formats ----------
  var FORMATS = {
    LinkedIn: { w: 1920, h: 1080, author: true, rip: true, logo: true, file: "linkedin" },
    Website: { w: 1920, h: 1080, author: false, rip: false, logo: true, file: "website" },
    X: {
      w: 1500,
      h: 600,
      author: true,
      rip: true,
      logo: true,
      file: "x",
      tune: { author: 1.45, logo: 1.45, grid: 1.4, title: 1.15, logoInset: 48 },
    },
    Substack: {
      w: 1200,
      h: 630,
      author: false,
      rip: false,
      logo: false,
      file: "substack",
      tune: { grid: 1.2, padX: 170 },
    },
  }
  var ORDER = ["LinkedIn", "Website", "X", "Substack"]
  var HL = {
    teal: ["hsl(165, 67%, 56%)", "hsla(165, 67%, 56%, 0.2)"],
    purple: ["hsl(283, 63%, 52%)", "hsla(283, 63%, 52%, 0.2)"],
    tangerine: ["hsl(17, 100%, 55%)", "hsla(17, 100%, 55%, 0.2)"],
    blue: ["hsl(205, 84%, 49%)", "hsla(205, 84%, 49%, 0.2)"],
  }
  var HL_KEYS = Object.keys(HL)
  var TITLE_INK = "#545E6B",
    GRID_INK = "rgba(76, 198, 219, 0.302)",
    TANGERINE = "hsl(17, 100%, 55%)",
    TANGERINE_BOX = "hsla(17, 100%, 55%, 0.2)"
  var FONT = '"RoundHog", system-ui, -apple-system, "Segoe UI", sans-serif'

  var DATA = { fonts: {}, logos: {}, authors: {}, buildLogo: "", rip: "" } // filled from app-data.json
  var state = {
    items: [],
    currentId: null,
    active: "LinkedIn",
    db: null,
    assets: null,
    downloads: null,
    live: false,
    pending: {},
    confirmDelete: false,
    localImg: {},
    busy: false,
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
        .slice(0, 60) || "build-mode"
    )
  }
  function uid() {
    return "img_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }
  function blob(id) {
    return !id ? "" : /^(\/|blob:|data:|https?:)/.test(id) ? id : "/_blob/" + id
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
  function authorNames() {
    var n = Object.keys(DATA.authors || {})
    return n.length ? n : ["Ian Vanagas", "Jina Yoon", "Cleo Lant"]
  }

  // Authors: the main one plus up to 2 co-authors, one avatar + name row each.
  var MAX_AUTHORS = 3
  function authorsOf(d) {
    var seen = {}
    return [d.author].concat(d.coAuthors || []).filter(function (a) {
      if (!a || seen[a]) return false
      seen[a] = 1
      return true
    })
  }
  function authorLabel(d) {
    return authorsOf(d).join(", ") || "No author"
  }
  function blank() {
    var now = Date.now()
    return {
      title: "The end of engineers?",
      hlText: "engineers?",
      highlight: "purple",
      author: "Ian Vanagas",
      imgId: "",
      imgName: "",
      imgSize: 100,
      imgX: 0,
      imgY: 0,
      flip: false,
      fit: {},
      gridSize: 64,
      showRip: true,
      showLogo: true,
      logoSize: 120,
      createdAt: now,
      updatedAt: now,
    }
  }
  function fitOf(d, fmt) {
    var f = (d.fit && d.fit[fmt]) || {}
    return {
      size: clamp(f.size, 25, 200, 100),
      x: clamp(f.x, -600, 600, 0),
      y: clamp(f.y, -600, 600, 0),
      r: clamp(f.r, -180, 180, 0),
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
    el.src = url
    return null
  }
  function imageUrl(it) {
    if (!it) return ""
    if (state.localImg[it.id]) return state.localImg[it.id]
    return blob(it.data.imgId)
  }

  // ---------- Text ----------
  var mctx = document.createElement("canvas").getContext("2d")
  function setLS(ctx, v) {
    if ("letterSpacing" in ctx) ctx.letterSpacing = v
  }
  function fontStr(weight, size) {
    return weight + " " + size + "px " + FONT
  }
  function measure(t, weight, size, ls) {
    mctx.font = fontStr(weight, size)
    setLS(mctx, ls + "px")
    var w = mctx.measureText(t).width
    setLS(mctx, "0px")
    return w
  }
  function vMetrics(weight, size) {
    mctx.font = fontStr(weight, size)
    var m = mctx.measureText("Hg")
    return {
      asc: m.fontBoundingBoxAscent || size * 0.93,
      desc: m.fontBoundingBoxDescent || size * 0.24,
    }
  }
  // Title tokens: words, with the highlighted phrase kept as one unbreakable token (like the template's inline-block).
  function titleTokens(title, word) {
    var t = String(title || "").replace(/\|/g, "\n")
    var w = String(word || "").trim()
    var idx = w ? t.toLowerCase().indexOf(w.toLowerCase()) : -1
    var parts =
      idx >= 0
        ? [
            { s: t.slice(0, idx), hl: false },
            { s: t.slice(idx, idx + w.length), hl: true },
            { s: t.slice(idx + w.length), hl: false },
          ]
        : [{ s: t, hl: false }]
    var paras = [[]]
    parts.forEach(function (p) {
      if (p.hl) {
        paras[paras.length - 1].push({ t: p.s, hl: true, glueL: true, glueR: true })
        return
      }
      var lines = p.s.split("\n")
      lines.forEach(function (ln, li) {
        if (li > 0) paras.push([])
        var startsSpace = /^\s/.test(ln),
          endsSpace = /\s$/.test(ln)
        var words = ln.split(/\s+/).filter(Boolean)
        words.forEach(function (wd, wi) {
          paras[paras.length - 1].push({
            t: wd,
            hl: false,
            spaceBefore: wi > 0 || startsSpace,
            spaceAfter: wi < words.length - 1 || endsSpace,
          })
        })
      })
    })
    return { paras: paras, found: idx >= 0 || !w }
  }
  function wrapTokens(tokens, maxW, spaceW) {
    var lines = [],
      cur = [],
      curW = 0
    tokens.forEach(function (tk, i) {
      var prev = cur.length ? cur[cur.length - 1] : null
      var gap = 0
      if (prev) {
        // Space between tokens unless the highlight sits directly against a word.
        var touching = (tk.hl && !prev.spaceAfter) || (prev.hl && !tk.spaceBefore)
        gap = touching ? 0 : spaceW
      }
      if (cur.length && curW + gap + tk.w > maxW) {
        lines.push({ toks: cur, w: curW })
        cur = [tk]
        curW = tk.w
        tk._gap = 0
      } else {
        tk._gap = cur.length ? gap : 0
        cur.push(tk)
        curW += (cur.length > 1 ? gap : 0) + tk.w
      }
    })
    if (cur.length || !lines.length) lines.push({ toks: cur, w: curW })
    return lines
  }
  function layoutTitle(title, word, size, maxW) {
    var ls = -0.01 * size,
      pad = 0.1 * size
    var tt = titleTokens(title, word)
    var spaceW = measure(" ", 600, size, ls)
    var out = []
    tt.paras.forEach(function (toks) {
      toks.forEach(function (tk) {
        tk.w = measure(tk.t, 600, size, ls) + (tk.hl ? pad * 2 : 0)
      })
      var lines = wrapTokens(toks, maxW, spaceW)
      if (lines.length > 1) {
        var lo = maxW * 0.4,
          hi = maxW,
          n = lines.length
        for (var k = 0; k < 18; k++) {
          var mid = (lo + hi) / 2
          if (wrapTokens(toks, mid, spaceW).length > n) lo = mid
          else hi = mid
        }
        lines = wrapTokens(toks, hi, spaceW)
      }
      lines.forEach(function (l) {
        out.push(l)
      })
    })
    return { lines: out, found: tt.found, ls: ls, pad: pad }
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

  // ---------- Layout per size (same maths as the canvas template) ----------
  function geom(fmt, d) {
    var F = FORMATS[fmt],
      W = F.w,
      H = F.h,
      tune = F.tune || {}
    var sx = W / 1920,
      sy = H / 1080,
      sc = Math.min(sx, sy)
    var padX = tune.padX != null ? tune.padX : 128 * sx
    var aS = sc * (tune.author || 1)
    return {
      W: W,
      H: H,
      sc: sc,
      grid: clamp(d.gridSize, 24, 160, 64) * sc * (tune.grid || 1),
      padTop: 120 * sy,
      padX: padX,
      titleSize: 140 * sc * (tune.title || 1),
      titleMaxW: tune.padX != null ? W - 2 * padX : 1040 * sx,
      box: { x: 901 * sx, y: 104 * sy, w: 1041 * sx, h: 980 * sy },
      logoH: clamp(d.logoSize, 60, 167, 120) * sc * (tune.logo || 1),
      logoInset: tune.logoInset != null ? tune.logoInset : 48 * sc,
      authorRight: 348 * sx,
      authorBottom: 48 * sy,
      authorGap: 29 * aS,
      avatar: 108 * aS,
      authorSize: 58 * aS,
      label: 36 * sc,
      showAuthor: F.author,
      showRip: F.rip && d.showRip !== false,
      showLogo: F.logo && d.showLogo !== false,
    }
  }

  // Draws one size. Returns the image box hit rectangle in that size's pixels.
  function drawPost(ctx, it, fmt, opts) {
    opts = opts || {}
    var d = it.data,
      g = geom(fmt, d),
      W = g.W,
      H = g.H
    ctx.save()
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, W, H)
    ctx.textBaseline = "alphabetic"
    ctx.textAlign = "left"

    // 1 Grid (bottom)
    var cell = g.grid
    if (cell > 2) {
      ctx.fillStyle = GRID_INK
      var ox = ((W - cell) / 2) % cell
      if (ox < 0) ox += cell
      var oy = ((H - cell) / 2) % cell
      if (oy < 0) oy += cell
      for (var x = ox - cell; x < W; x += cell) ctx.fillRect(Math.round(x), 0, 2, H)
      for (var y = oy - cell; y < H; y += cell) ctx.fillRect(0, Math.round(y), W, 2)
    }

    // 2 Build mode logo
    if (g.showLogo) {
      var lg = img(blob(DATA.buildLogo))
      if (lg) {
        var lw = (g.logoH * lg.naturalWidth) / lg.naturalHeight
        ctx.drawImage(lg, W - g.logoInset - lw, g.logoInset, lw, g.logoH)
      }
    }

    // 3 Title
    var size = g.titleSize,
      hl = HL[d.highlight] || HL.purple
    var L = layoutTitle(d.title, d.hlText, size, g.titleMaxW)
    var vm = vMetrics(600, size),
      lh = size * 1.05
    L.lines.forEach(function (line, li) {
      var baseline = g.padTop + li * lh + (lh - (vm.asc + vm.desc)) / 2 + vm.asc
      var cx = g.padX
      line.toks.forEach(function (tk) {
        cx += tk._gap || 0
        ctx.font = fontStr(600, size)
        setLS(ctx, L.ls + "px")
        if (tk.hl) {
          var center = baseline - vm.asc + (vm.asc + vm.desc) / 2,
            bh = size * 1.1
          ctx.fillStyle = hl[1]
          roundRect(ctx, cx, center - bh / 2, tk.w, bh, size * 0.125)
          ctx.fill()
          ctx.fillStyle = hl[0]
          ctx.fillText(tk.t, cx + L.pad, baseline)
        } else {
          ctx.fillStyle = TITLE_INK
          ctx.fillText(tk.t, cx, baseline)
        }
        cx += tk.w
      })
      setLS(ctx, "0px")
    })

    // 4 Image
    var b = g.box,
      fit = fitOf(d, fmt)
    var s = ((clamp(d.imgSize, 50, 150, 100) / 100) * fit.size) / 100
    var tx = clamp(d.imgX, -600, 600, 0) * g.sc + fit.x,
      ty = -clamp(d.imgY, -600, 600, 0) * g.sc - fit.y
    var cxB = b.x + b.w / 2,
      cyB = b.y + b.h / 2
    var url = imageUrl(it),
      im = img(url)
    ctx.save()
    ctx.translate(cxB + tx, cyB + ty)
    ctx.rotate((fit.r * Math.PI) / 180)
    ctx.scale(d.flip ? -s : s, s)
    ctx.translate(-cxB, -cyB)
    if (im) {
      var k = Math.min(b.w / im.naturalWidth, b.h / im.naturalHeight),
        iw = im.naturalWidth * k,
        ih = im.naturalHeight * k
      ctx.drawImage(im, b.x + (b.w - iw) / 2, b.y + (b.h - ih) / 2, iw, ih)
    } else if (!opts.exporting) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)"
      ctx.fillRect(b.x, b.y, b.w, b.h)
      ctx.strokeStyle = "#9ca3af"
      ctx.lineWidth = Math.max(2, 4 * g.sc)
      ctx.setLineDash([12 * g.sc, 8 * g.sc])
      ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4)
      ctx.setLineDash([])
      if (d.flip) {
        ctx.translate(cxB * 2, 0)
        ctx.scale(-1, 1)
      }
      var ic = 96 * g.sc,
        icx = cxB - ic / 2,
        icy = cyB - ic / 2 - g.label
      ctx.strokeStyle = TITLE_INK
      ctx.lineWidth = Math.max(1.5, 6 * g.sc)
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      roundRect(ctx, icx + ic * 0.125, icy + ic * 0.125, ic * 0.75, ic * 0.75, ic * 0.08)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(icx + ic * 0.375, icy + ic * 0.375, ic * 0.083, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(icx + ic * 0.875, icy + ic * 0.625)
      ctx.lineTo(icx + ic * 0.667, icy + ic * 0.417)
      ctx.lineTo(icx + ic * 0.208, icy + ic * 0.875)
      ctx.stroke()
      ctx.fillStyle = TITLE_INK
      ctx.font = fontStr(500, g.label)
      ctx.textAlign = "center"
      ctx.fillText("Click to add image", cxB, icy + ic + g.label * 1.3)
      ctx.textAlign = "left"
    }
    ctx.restore()
    var hx1 = cxB + tx + (b.x - cxB) * s,
      hx2 = cxB + tx + (b.x + b.w - cxB) * s
    var hit = {
      x: Math.min(hx1, hx2),
      y: cyB + ty + (b.y - cyB) * s,
      w: Math.abs(hx2 - hx1),
      h: b.h * s,
    }

    // 5 Paper rip
    if (g.showRip) {
      var rp = img(blob(DATA.rip))
      if (rp) {
        var rh = (W * rp.naturalHeight) / rp.naturalWidth
        ctx.drawImage(rp, 0, H - rh, W, rh)
      }
    }

    // 6 Author (top)
    var people = authorsOf(d)
    if (g.showAuthor && people.length) {
      var as = g.authorSize,
        av = g.avatar,
        apad = as * 0.1
      var rowH = Math.max(av, as * 1.2),
        rowGap = av * 0.18
      // Stacked rows share one left edge (the widest row keeps the template's right margin).
      var widest = 0
      people.forEach(function (n) {
        widest = Math.max(widest, av + g.authorGap + measure(n, 600, as, 0) + apad * 2)
      })
      var x0 = W - g.authorRight - widest
      people.forEach(function (who, pi) {
        var nameW = measure(who, 600, as, 0) + apad * 2
        var rowBottom = H - g.authorBottom - (people.length - 1 - pi) * (rowH + rowGap),
          rowTop = rowBottom - rowH
        var acy = rowTop + rowH / 2
        ctx.save()
        ctx.beginPath()
        ctx.arc(x0 + av / 2, acy, av / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.fillStyle = TANGERINE
        ctx.fill()
        ctx.clip()
        var aim = img(blob(DATA.authors[who]))
        if (aim) {
          var kk = Math.max(av / aim.naturalWidth, av / aim.naturalHeight),
            aw = aim.naturalWidth * kk
          ctx.drawImage(aim, x0 + (av - aw) / 2, acy - av / 2, aw, aim.naturalHeight * kk)
        }
        ctx.restore()
        var nm = vMetrics(600, as),
          nx = x0 + av + g.authorGap
        var nBase = acy - (nm.asc + nm.desc) / 2 + nm.asc
        ctx.fillStyle = TANGERINE_BOX
        roundRect(ctx, nx, nBase - nm.asc, nameW, nm.asc + nm.desc, as * 0.125)
        ctx.fill()
        ctx.fillStyle = TANGERINE
        ctx.font = fontStr(600, as)
        ctx.fillText(who, nx + apad, nBase)
      })
    }
    ctx.restore()
    return { hit: hit, hlFound: L.found }
  }

  // ---------- Stage ----------
  var stage = $("stage"),
    sctx = stage.getContext("2d")
  var imgHit = null
  function current() {
    return byId(state.currentId)
  }
  function byId(id) {
    for (var i = 0; i < state.items.length; i++) if (state.items[i].id === id) return state.items[i]
    return null
  }
  function paint(canvas, it, fmt, cssW) {
    var F = FORMATS[fmt],
      dpr = window.devicePixelRatio || 1
    var pw = Math.max(200, Math.round(cssW * dpr)),
      ph = Math.round((pw * F.h) / F.w)
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw
      canvas.height = ph
    }
    var c = canvas.getContext("2d")
    c.setTransform(pw / F.w, 0, 0, ph / F.h, 0, 0)
    c.clearRect(0, 0, F.w, F.h)
    return drawPost(c, it, fmt)
  }
  function sizeStage() {
    var F = FORMATS[state.active],
      wrap = $("wrap")
    var box = wrap.parentElement.getBoundingClientRect()
    var maxW = Math.min(box.width - 48, 1200),
      maxH = Math.max(240, window.innerHeight - 56 - 48 - 40 - 200)
    var w = Math.min(maxW, (maxH * F.w) / F.h)
    wrap.style.width = Math.max(240, Math.floor(w)) + "px"
    wrap.style.aspectRatio = F.w + " / " + F.h
  }
  function renderStage() {
    var it = current()
    if (!it) return
    sizeStage()
    var res = paint(stage, it, state.active, $("wrap").getBoundingClientRect().width || 900)
    imgHit = res.hit
    updateHlHint(res.hlFound, it.data)
    document.querySelectorAll(".mini canvas").forEach(function (cv) {
      paint(cv, it, cv.dataset.fmt, cv.getBoundingClientRect().width || 300)
    })
  }
  function renderStrip() {
    var strip = $("strip")
    strip.textContent = ""
    ORDER.filter(function (f) {
      return f !== state.active
    }).forEach(function (f) {
      var F = FORMATS[f]
      var b = document.createElement("button")
      b.type = "button"
      b.className = "mini"
      b.setAttribute("aria-label", "Work on the " + f + " size")
      var cv = document.createElement("canvas")
      cv.dataset.fmt = f
      cv.style.aspectRatio = F.w + " / " + F.h
      cv.setAttribute("aria-hidden", "true")
      var lbl = document.createElement("span")
      lbl.className = "lbl"
      lbl.textContent = f
      var dims = document.createElement("span")
      dims.textContent = F.w + " × " + F.h
      lbl.appendChild(dims)
      b.appendChild(cv)
      b.appendChild(lbl)
      b.addEventListener("click", function () {
        setActive(f)
      })
      strip.appendChild(b)
    })
  }
  function setActive(f) {
    state.active = f
    var F = FORMATS[f]
    $("sizeName").textContent = f
    $("sizeDims").textContent = F.w + " × " + F.h
    var hide = []
    if (!F.author) hide.push("author")
    if (!F.rip) hide.push("paper rip")
    if (!F.logo) hide.push("logo")
    $("sizeNote").textContent = hide.length
      ? "No " + hide.join(", ").replace(/, ([^,]*)$/, " or $1") + " on this size"
      : ""
    $("fitTag").textContent = f
    renderStrip()
    fillForm()
    queueRedraw()
  }
  function renderThumb(canvas, it) {
    paint(canvas, it, "LinkedIn", 220)
  }
  function queueRedraw() {
    if (redrawQueued) return
    redrawQueued = true
    requestAnimationFrame(function () {
      redrawQueued = false
      renderStage()
      document.querySelectorAll(".thumb canvas").forEach(function (cv) {
        var it = byId(cv.dataset.id)
        if (it) renderThumb(cv, it)
      })
    })
  }
  function toUnits(ev) {
    var F = FORMATS[state.active],
      r = stage.getBoundingClientRect()
    return {
      x: ((ev.clientX - r.left) * F.w) / r.width,
      y: ((ev.clientY - r.top) * F.h) / r.height,
    }
  }
  function inImg(p) {
    return (
      imgHit &&
      p.x >= imgHit.x &&
      p.x <= imgHit.x + imgHit.w &&
      p.y >= imgHit.y &&
      p.y <= imgHit.y + imgHit.h
    )
  }
  stage.addEventListener("mousemove", function (ev) {
    stage.style.cursor = inImg(toUnits(ev)) ? "pointer" : "default"
  })
  stage.addEventListener("click", function (ev) {
    if (inImg(toUnits(ev))) pickFile()
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
      renderThumb(cv, it)
    })
  }

  // ---------- Properties ----------
  function setVal(id, v) {
    if (document.activeElement !== $(id)) $(id).value = v
  }
  function setRange(id, out, v, suffix) {
    $(id).value = v
    $(out).textContent = v + (suffix || "")
  }
  function fillForm() {
    var it = current()
    if (!it) return
    var d = it.data
    setVal("fTitle", d.title || "")
    setVal("fHl", d.hlText || "")
    var sel = $("fAuthor"),
      names = authorNames()
    if (sel.options.length !== names.length) {
      sel.textContent = ""
      names.forEach(function (n) {
        var o = document.createElement("option")
        o.value = n
        o.textContent = n
        sel.appendChild(o)
      })
    }
    sel.value = names.indexOf(d.author) >= 0 ? d.author : names[0]
    var av = $("authorAvatar")
    av.textContent = ""
    if (DATA.authors[d.author]) {
      var ai = document.createElement("img")
      ai.src = blob(DATA.authors[d.author])
      ai.alt = ""
      av.appendChild(ai)
    }
    renderCoAuthors(d)
    var hlBox = $("swHl")
    hlBox.textContent = ""
    HL_KEYS.forEach(function (k) {
      var b = document.createElement("button")
      b.type = "button"
      b.className = "sw"
      b.style.background = HL[k][0]
      b.setAttribute("aria-label", k)
      b.title = k
      b.setAttribute("aria-pressed", k === d.highlight ? "true" : "false")
      b.addEventListener("click", function () {
        edit({ highlight: k })
      })
      hlBox.appendChild(b)
    })
    setRange("fImgSize", "oImgSize", clamp(d.imgSize, 50, 150, 100), "%")
    setRange("fImgX", "oImgX", clamp(d.imgX, -600, 600, 0), "")
    setRange("fImgY", "oImgY", clamp(d.imgY, -600, 600, 0), "")
    $("fFlip").checked = !!d.flip
    var f = fitOf(d, state.active)
    setRange("fFitSize", "oFitSize", f.size, "%")
    setRange("fFitX", "oFitX", f.x, "")
    setRange("fFitY", "oFitY", f.y, "")
    setRange("fFitR", "oFitR", f.r, "°")
    setRange("fGrid", "oGrid", clamp(d.gridSize, 24, 160, 64), "px")
    setRange("fLogoSize", "oLogoSize", clamp(d.logoSize, 60, 167, 120), "px")
    $("fRip").checked = d.showRip !== false
    $("fLogo").checked = d.showLogo !== false
    var url = imageUrl(it),
      pic = $("imgPic")
    pic.textContent = ""
    if (url) {
      var pi = document.createElement("img")
      pi.src = url
      pi.alt = ""
      pic.appendChild(pi)
    } else
      pic.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>'
    $("imgName").textContent = url ? d.imgName || "Image" : "No image yet"
    $("imgHow").textContent = state.localImg[it.id]
      ? "Uploads stay in this browser, and the link doesn’t carry them."
      : url
        ? "Shared by all four sizes."
        : "PNG with a transparent background works best."
    $("uploadBtn").textContent = url ? "Replace" : "Upload image"
    $("removeImg").hidden = !url
    $("uploadBtn").disabled = state.busy
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
  function editFit(patch) {
    var it = current()
    if (!it) return
    var fit = JSON.parse(JSON.stringify(it.data.fit || {}))
    var f = fitOf(it.data, state.active)
    Object.keys(patch).forEach(function (k) {
      f[k] = patch[k]
    })
    fit[state.active] = f
    edit({ fit: fit }, { noForm: true })
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
    var src = state.localImg[it.id]
    addItem(d)
    if (src) state.localImg[state.currentId] = src
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

  // ---------- Upload ----------
  function pickFile() {
    if (!state.busy) $("fileInput").click()
  }
  $("fileInput").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0]
    e.target.value = ""
    var it = current()
    if (!file || !it) return
    if (!/^image\//.test(file.type)) {
      setSave("That file isn’t an image. Choose a PNG, JPG or WebP.")
      return
    }
    var name = file.name.replace(/\.[a-z0-9]+$/i, "")
    if (!state.assets) {
      state.localImg[it.id] = URL.createObjectURL(file)
      edit({ imgName: name })
      setSave("Image shown. Uploads stay in this browser, and the link doesn’t carry them.")
      return
    }
    state.busy = true
    fillForm()
    setSave("Uploading " + file.name + "…")
    state.assets.upload(file).then(
      function (res) {
        state.busy = false
        delete state.localImg[it.id]
        if (state.currentId !== it.id) {
          var keep = state.currentId
          state.currentId = it.id
          edit({ imgId: res.id, imgName: name })
          select(keep)
        } else edit({ imgId: res.id, imgName: name })
        setSave("Image uploaded")
      },
      function (err) {
        state.busy = false
        fillForm()
        setSave("Upload didn’t work (" + ((err && err.code) || "error") + "). Try a smaller file.")
      },
    )
  })
  $("uploadBtn").addEventListener("click", pickFile)
  $("imgPic").addEventListener("click", pickFile)
  $("removeImg").addEventListener("click", function () {
    var it = current()
    if (!it) return
    delete state.localImg[it.id]
    edit({ imgId: "", imgName: "" })
  })

  // ---------- Inputs ----------
  $("newBtn").addEventListener("click", function () {
    addItem(blank())
  })
  $("fTitle").addEventListener("input", function (e) {
    edit({ title: e.target.value }, { noForm: true })
  })
  $("fHl").addEventListener("input", function (e) {
    edit({ hlText: e.target.value }, { noForm: true })
  })
  $("fAuthor").addEventListener("change", function (e) {
    edit({ author: e.target.value })
  })
  function renderCoAuthors(d) {
    var box = $("coAuthors"),
      names = authorNames(),
      list = (d.coAuthors || []).slice(0, MAX_AUTHORS - 1)
    box.textContent = ""
    list.forEach(function (name, i) {
      var row = document.createElement("div")
      row.className = "co-row"
      var av = document.createElement("div")
      av.className = "avatar"
      av.setAttribute("aria-hidden", "true")
      if (DATA.authors[name]) {
        var ai = document.createElement("img")
        ai.src = blob(DATA.authors[name])
        ai.alt = ""
        av.appendChild(ai)
      }
      var sel = document.createElement("select")
      sel.className = "input"
      sel.id = "fCoAuthor" + (i + 2)
      sel.setAttribute("aria-label", "Author " + (i + 2))
      names.forEach(function (n) {
        var o = document.createElement("option")
        o.value = n
        o.textContent = n
        sel.appendChild(o)
      })
      sel.value = names.indexOf(name) >= 0 ? name : names[0]
      sel.addEventListener("change", function () {
        var it = current()
        if (!it) return
        var a = (it.data.coAuthors || []).slice()
        a[i] = sel.value
        edit({ coAuthors: a })
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
      row.appendChild(av)
      row.appendChild(sel)
      row.appendChild(rm)
      box.appendChild(row)
    })
    $("addAuthor").hidden = list.length >= MAX_AUTHORS - 1
  }
  $("addAuthor").addEventListener("click", function () {
    var it = current()
    if (!it) return
    var a = (it.data.coAuthors || []).slice()
    if (a.length >= MAX_AUTHORS - 1) return
    // Start with the first person who isn't already on the image.
    var used = authorsOf(it.data),
      next =
        authorNames().filter(function (n) {
          return used.indexOf(n) < 0
        })[0] || authorNames()[0]
    a.push(next)
    edit({ coAuthors: a })
  })
  function bindRange(id, out, suffix, fn) {
    $(id).addEventListener("input", function (e) {
      $(out).textContent = e.target.value + suffix
      fn(+e.target.value)
    })
  }
  bindRange("fImgSize", "oImgSize", "%", function (v) {
    edit({ imgSize: v }, { noForm: true })
  })
  bindRange("fImgX", "oImgX", "", function (v) {
    edit({ imgX: v }, { noForm: true })
  })
  bindRange("fImgY", "oImgY", "", function (v) {
    edit({ imgY: v }, { noForm: true })
  })
  bindRange("fFitSize", "oFitSize", "%", function (v) {
    editFit({ size: v })
  })
  bindRange("fFitX", "oFitX", "", function (v) {
    editFit({ x: v })
  })
  bindRange("fFitY", "oFitY", "", function (v) {
    editFit({ y: v })
  })
  bindRange("fFitR", "oFitR", "°", function (v) {
    editFit({ r: v })
  })
  bindRange("fGrid", "oGrid", "px", function (v) {
    edit({ gridSize: v }, { noForm: true })
  })
  bindRange("fLogoSize", "oLogoSize", "px", function (v) {
    edit({ logoSize: v }, { noForm: true })
  })
  $("fFlip").addEventListener("change", function (e) {
    edit({ flip: e.target.checked })
  })
  $("fRip").addEventListener("change", function (e) {
    edit({ showRip: e.target.checked })
  })
  $("fLogo").addEventListener("change", function (e) {
    edit({ showLogo: e.target.checked })
  })
  $("fitReset").addEventListener("click", function () {
    var it = current()
    if (!it) return
    var fit = JSON.parse(JSON.stringify(it.data.fit || {}))
    delete fit[state.active]
    edit({ fit: fit })
  })

  // ---------- Download ----------
  function renderPng(it, fmt) {
    var F = FORMATS[fmt]
    var c = document.createElement("canvas")
    c.width = F.w
    c.height = F.h
    drawPost(c.getContext("2d"), it, fmt, { exporting: true })
    return new Promise(function (resolve) {
      try {
        c.toBlob(function (b) {
          resolve(b)
        }, "image/png")
      } catch (e) {
        resolve(null)
      }
    })
  }
  function saveOne(it, fmt) {
    var name = slug(plainTitle(it.data)) + "-" + FORMATS[fmt].file + ".png"
    return renderPng(it, fmt).then(function (b) {
      if (!b) throw { code: "render" }
      return state.downloads.save({ filename: name, data: b }).then(function () {
        return name
      })
    })
  }
  function downloadErr(err) {
    if (err && err.code === "declined") setSave("Download cancelled")
    else if (err && err.code === "render") setSave("Couldn’t make the PNG. Try again.")
    else setSave("Download didn’t work here (" + ((err && err.code) || "unavailable") + ").")
  }
  $("downloadOne").addEventListener("click", function () {
    var it = current()
    if (!it) return
    if (!state.downloads) {
      setSave("Couldn’t start the download. Try again.")
      return
    }
    saveOne(it, state.active).then(function (n) {
      setSave("Downloaded " + n)
    }, downloadErr)
  })
  $("downloadAll").addEventListener("click", function () {
    var it = current()
    if (!it) return
    if (!state.downloads) {
      setSave("Couldn’t start the download. Try again.")
      return
    }
    var done = 0
    ORDER.reduce(function (p, fmt) {
      return p.then(function () {
        setSave("Saving " + fmt + "… (" + (done + 1) + " of 4)")
        return saveOne(it, fmt).then(function () {
          done++
        })
      })
    }, Promise.resolve()).then(
      function () {
        setSave("Downloaded all 4 sizes")
      },
      function (err) {
        if (err && err.code === "declined")
          setSave(done ? "Stopped after " + done + " of 4" : "Download cancelled")
        else downloadErr(err)
      },
    )
  })

  // ---------- Boot ----------
  state.items = [{ id: uid(), data: blank() }]
  state.currentId = state.items[0].id
  renderList()
  setActive("LinkedIn")

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
          renderList()
          queueRedraw()
        },
        function () {},
      )
      $("fAuthor").textContent = ""
      fillForm()
      renderList()
      queueRedraw()
    })
    .catch(function () {
      setSave("Couldn’t load fonts and pictures. Reload to try again.")
    })

  if (env.host && env.host.use) {
    env.host.use("downloads").then(function (d) {
      state.downloads = d
    })
    env.host.use("assets").then(function (a) {
      state.assets = a
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
              renderList()
              return
            }
            state.items = merged
            touched = true
            if (!byId(state.currentId)) state.currentId = merged.length ? merged[0].id : null
            state.live = true
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
