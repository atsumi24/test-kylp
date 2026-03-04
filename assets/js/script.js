/* =========================================================
    AIDMA Onefile JS (OPTIMIZED / DROP-IN)  ✅Android swipe改善（確定版）
    ✅ポイント（あなたの現行コードからの改善点）
    - Changing / VOICE ともに「pointer と touch の二重購読」を廃止
      -> PointerEvent 対応環境は pointer のみ、非対応のみ touch にフォールバック
    - 方向ロック（slop付き）で “横確定時だけ” preventDefault()
      -> 横スワイプ後に縦スクロールが鈍くなる問題を回避
    - VOICE は move を requestAnimationFrame で間引き（Androidの体感改善）
    - setPointerCapture で要素外に指が出ても取りこぼしにくく
    - VOICE: thresholdRatio = 0.17（切替軽め）は維持
========================================================= */
(function(){
  if (window.__AIDMA_ALL_JS_INITED__) return;
  window.__AIDMA_ALL_JS_INITED__ = true;

  function q(sel, root){ return (root||document).querySelector(sel); }
  function qa(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function onReady(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  function onReadyAndLoad(fn){
    onReady(fn);
    window.addEventListener("load", fn, { once:true });
  }
  function setVar(name,val){ document.documentElement.style.setProperty(name, val); }
  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
  function num(v){ v = parseFloat(v); return isNaN(v) ? 0 : v; }

  function prefersReducedMotion(){
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* =========================================================
      SP/Tablet：Header + Drawer Menu
  ========================================================= */
  (function(){
    var mqlMobile = window.matchMedia("(max-width: 1023px)");
    var OPEN_CLASS = "mnav-open";

    var btnOpen = q("[data-mnav-open='1']");
    var overlay = q(".mDrawerOverlay");
    var drawer  = q(".mDrawer");
    if(!btnOpen || !overlay || !drawer) return;

    function isMobile(){ return mqlMobile.matches; }

    function setExpanded(on){
      btnOpen.setAttribute("aria-expanded", on ? "true" : "false");
      drawer.setAttribute("aria-hidden", on ? "false" : "true");
      overlay.setAttribute("aria-hidden", on ? "false" : "true");
    }

    function openMenu(){
      if(!isMobile()) return;
      document.documentElement.classList.add(OPEN_CLASS);
      setExpanded(true);
      var closeBtn = q("[data-mnav-close='1']");
      if(closeBtn) closeBtn.focus({preventScroll:true});
    }

    function closeMenu(){
      document.documentElement.classList.remove(OPEN_CLASS);
      setExpanded(false);
      btnOpen.focus({preventScroll:true});
    }

    btnOpen.addEventListener("click", function(){
      var on = document.documentElement.classList.contains(OPEN_CLASS);
      if(on) closeMenu();
      else openMenu();
    });

    qa("[data-mnav-close='1']").forEach(function(el){
      el.addEventListener("click", function(){ closeMenu(); });
    });

    qa(".mNav a").forEach(function(a){
      a.addEventListener("click", function(){ closeMenu(); });
    });

    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && document.documentElement.classList.contains(OPEN_CLASS)){
        closeMenu();
      }
    });

    function sync(){
      if(!isMobile()){
        document.documentElement.classList.remove(OPEN_CLASS);
        setExpanded(false);
      }
    }
    if(mqlMobile.addEventListener) mqlMobile.addEventListener("change", sync);
    else mqlMobile.addListener(sync);

    setExpanded(false);
    sync();
  })();

  /* =========================================================
      PC左パネル：overflow分も含めて「同率縮小」
  ========================================================= */
  (function(){
    var mqlPC = window.matchMedia("(min-width: 1024px)");

    function fitLeftPanel(){
      if(!mqlPC.matches) return;

      var rail  = q(".aidmaRail--L");
      var inner = q(".aidmaRail--L .aidmaRail__inner");
      var fit   = q(".aidmaRail--L [data-pc-leftfit='1']");
      if(!rail || !inner || !fit) return;

      rail.classList.remove("is-scroll");
      setVar("--pcleft-scale", "1");

      requestAnimationFrame(function(){
        var availH = inner.clientHeight;
        var availW = inner.clientWidth;
        if(availH <= 0 || availW <= 0) return;

        var rect = fit.getBoundingClientRect();
        var reqW = Math.max(rect.width,  fit.scrollWidth);
        var reqH = Math.max(rect.height, fit.scrollHeight);
        if(reqW <= 0 || reqH <= 0) return;

        var needW = availW / reqW;
        var needH = availH / reqH;
        var need  = Math.min(needW, needH);

        var s = Math.min(1, need) * 0.985;
        var FLOOR = 0.60;
        var applied = Math.max(FLOOR, s);

        setVar("--pcleft-scale", applied.toFixed(3));

        var wouldClipW = (reqW * applied) > (availW + 1);
        var wouldClipH = (reqH * applied) > (availH + 1);
        rail.classList.toggle("is-scroll", (wouldClipW || wouldClipH || need < FLOOR));
      });
    }

    onReadyAndLoad(fitLeftPanel);

    onReady(function(){
      var fit = q(".aidmaRail--L [data-pc-leftfit='1']");
      if(!fit) return;
      qa("img", fit).forEach(function(img){
        if(img.complete) return;
        img.addEventListener("load", fitLeftPanel, { once:true });
        img.addEventListener("error", fitLeftPanel, { once:true });
      });
    });

    var t=null;
    function onResize(){
      clearTimeout(t);
      t=setTimeout(fitLeftPanel, 60);
    }
    window.addEventListener("resize", onResize);
    if(window.visualViewport){
      window.visualViewport.addEventListener("resize", onResize);
      window.visualViewport.addEventListener("scroll", onResize);
    }

    if(window.ResizeObserver){
      var ro = new ResizeObserver(onResize);
      var innerEl = q(".aidmaRail--L .aidmaRail__inner");
      if(innerEl) ro.observe(innerEl);
    }

    if(mqlPC.addEventListener) mqlPC.addEventListener("change", fitLeftPanel);
    else mqlPC.addListener(fitLeftPanel);
  })();

  /* =========================================================
      PC右メニュー：縦が狭い時に見切れない
  ========================================================= */
  (function(){
    var mqlPC = window.matchMedia("(min-width: 1024px)");

    function getViewport(){
      var vv = window.visualViewport;
      return {
        w: (vv && vv.width)  ? vv.width  : window.innerWidth,
        h: (vv && vv.height) ? vv.height : window.innerHeight
      };
    }
    function viewportCap(){
      var vp = getViewport();
      var BASE_W = 1440, BASE_H = 900;
      var cap = Math.min(1, vp.w / BASE_W, vp.h / BASE_H);
      return Math.max(0.34, cap);
    }

    function fitPcRightMenu(){
      if(!mqlPC.matches) return;

      var rail      = q(".aidmaRail--R");
      var railInner = q(".aidmaRail--R .aidmaRail__inner");
      var tilt      = q(".aidmaRail--R .pcTextMenu__tilt");
      if(!rail || !railInner || !tilt) return;

      var innerRect = railInner.getBoundingClientRect();
      var cs = getComputedStyle(railInner);
      var padX = num(cs.paddingLeft) + num(cs.paddingRight);
      var padY = num(cs.paddingTop)  + num(cs.paddingBottom);

      var availW = Math.max(0, innerRect.width  - padX);
      var availH = Math.max(0, innerRect.height - padY);

      var safeW = Math.floor(availW - 8);
      safeW = Math.max(210, Math.min(300, safeW));
      setVar("--pcmenu-w", safeW + "px");

      setVar("--pcmenu-scale", "1");
      rail.classList.remove("is-scroll");

      requestAnimationFrame(function(){
        var rect = tilt.getBoundingClientRect();
        if(rect.width <= 0 || rect.height <= 0) return;

        var needScaleW = availW / rect.width;
        var needScaleH = availH / rect.height;

        var need = Math.min(needScaleW, needScaleH);
        var cap = viewportCap();

        var s = Math.min(1, need, cap) * 0.985;

        var FLOOR = 0.38;
        var sApplied = Math.max(FLOOR, s);

        setVar("--pcmenu-scale", sApplied.toFixed(3));

        var wouldClipH = (rect.height * sApplied) > (availH + 1);
        var wouldClipW = (rect.width  * sApplied) > (availW + 1);
        rail.classList.toggle("is-scroll", (wouldClipH || wouldClipW));
      });
    }

    onReadyAndLoad(fitPcRightMenu);

    var t = null;
    function onResize(){
      clearTimeout(t);
      t = setTimeout(fitPcRightMenu, 60);
    }
    window.addEventListener("resize", onResize);

    if(window.visualViewport){
      window.visualViewport.addEventListener("resize", onResize);
      window.visualViewport.addEventListener("scroll", onResize);
    }

    if(window.ResizeObserver){
      var ro = new ResizeObserver(onResize);
      var ri = q(".aidmaRail--R .aidmaRail__inner");
      if(ri) ro.observe(ri);
    }

    if(mqlPC.addEventListener) mqlPC.addEventListener("change", fitPcRightMenu);
    else mqlPC.addListener(fitPcRightMenu);
  })();

  /* =========================================================
      Right Menu active (PC only)
  ========================================================= */
  (function(){
    var mqlPC = window.matchMedia("(min-width: 1024px)");
    var obs = null;

    var MENU_SCOPE_SEL = '[data-pc-textmenu="1"]';
    var MENU_ITEM_SEL  = MENU_SCOPE_SEL + ' .pcMenuItem';

    var TOP_KEY = "Top";
    var TOP_ACTIVE_PX = 40;
    var BOTTOM_EPS = 2;

    var IO_THRESHOLD = [0, 0.2, 0.35, 0.5, 0.65];
    var IO_ROOTMARGIN = "-20% 0px -55% 0px";

    function setActive(key){
      var items = document.querySelectorAll(MENU_ITEM_SEL);
      items.forEach(function(a){
        var on = (a.getAttribute("data-toc") === key);
        a.classList.toggle("is-active", on);
        if(on) a.setAttribute("aria-current","page");
        else a.removeAttribute("aria-current");
      });
    }

    function collectMenuKeys(){
      var items = document.querySelectorAll(MENU_ITEM_SEL);
      var keys = [];
      items.forEach(function(a){
        var k = (a.getAttribute("data-toc") || "").trim();
        if(k) keys.push(k);
      });
      return Array.from(new Set(keys));
    }

    function collectSectionsFromMenu(){
      var keys = collectMenuKeys();
      if(!keys.length) return { keys:[], sections:[] };

      var sections = [];
      keys.forEach(function(key){
        var el = document.getElementById(key);
        if(!el) return;
        if(!el.getAttribute("data-aidma")) el.setAttribute("data-aidma", key);
        sections.push(el);
      });

      var uniq = [];
      var seen = new Set();
      sections.forEach(function(el){
        if(seen.has(el)) return;
        seen.add(el);
        uniq.push(el);
      });

      return { keys: keys, sections: uniq };
    }

    var state = new Map();

    function isAtTop(){
      return (window.scrollY || document.documentElement.scrollTop || 0) <= TOP_ACTIVE_PX;
    }
    function isAtBottom(){
      var doc = document.documentElement;
      var y = (window.scrollY || doc.scrollTop || 0);
      var vh = window.innerHeight || 0;
      var sh = doc.scrollHeight || 0;
      return (y + vh) >= (sh - BOTTOM_EPS);
    }

    function pickBest(sections, keys){
      if(keys.indexOf(TOP_KEY) !== -1 && isAtTop()){
        setActive(TOP_KEY);
        return;
      }
      if(isAtBottom()){
        for(var i = keys.length - 1; i >= 0; i--){
          if(keys[i]) { setActive(keys[i]); return; }
        }
      }

      var bestKey = null;
      var bestRatio = -1;
      sections.forEach(function(el){
        var v = state.get(el);
        if(!v || !v.on) return;
        if(v.key === TOP_KEY) return;
        if(v.ratio > bestRatio){
          bestRatio = v.ratio;
          bestKey = v.key;
        }
      });
      if(bestKey){ setActive(bestKey); return; }

      var cy = (window.innerHeight || 0) * 0.45;
      var best = null;
      var bestDist = Infinity;

      sections.forEach(function(el){
        var key = el.getAttribute("data-aidma") || "";
        if(key === TOP_KEY) return;
        var r = el.getBoundingClientRect();

        if(r.top <= cy && cy <= r.bottom){
          bestDist = 0;
          best = key;
          return;
        }
        var dist = Math.min(Math.abs(r.top - cy), Math.abs(r.bottom - cy));
        if(dist < bestDist){
          bestDist = dist;
          best = key;
        }
      });
      if(best) setActive(best);
    }

    function start(){
      stop();
      if(!mqlPC.matches) return;

      var pack = collectSectionsFromMenu();
      var keys = pack.keys;
      var sections = pack.sections;
      if(!sections.length) return;

      state.clear();
      sections.forEach(function(el){
        state.set(el, { key: el.getAttribute("data-aidma"), on:false, ratio:0 });
      });

      obs = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          var v = state.get(e.target);
          if(!v) return;
          v.on = !!e.isIntersecting;
          v.ratio = e.intersectionRatio || 0;
        });
        pickBest(sections, keys);
      },{
        threshold: IO_THRESHOLD,
        rootMargin: IO_ROOTMARGIN
      });

      sections.forEach(function(sec){ obs.observe(sec); });

      setTimeout(function(){
        if(!mqlPC.matches) return;
        if(location.hash){
          var id = location.hash.replace("#","");
          if(id && id !== TOP_KEY){
            var el = document.getElementById(id);
            if(el && el.getAttribute("data-aidma")){
              setActive(el.getAttribute("data-aidma"));
              return;
            }
          }
        }
        pickBest(sections, keys);
      }, 0);

      var raf = 0;
      function onScroll(){
        if(!mqlPC.matches) return;
        if(raf) return;
        raf = requestAnimationFrame(function(){
          raf = 0;
          pickBest(sections, keys);
        });
      }
      window.addEventListener("scroll", onScroll, { passive:true });
      window.addEventListener("resize", onScroll, { passive:true });

      start._onScroll = onScroll;
    }

    function stop(){
      if(obs){ obs.disconnect(); obs = null; }
      state.clear();
      if(start._onScroll){
        window.removeEventListener("scroll", start._onScroll);
        window.removeEventListener("resize", start._onScroll);
        start._onScroll = null;
      }
    }

    function sync(){ if(mqlPC.matches) start(); else stop(); }
    if(mqlPC.addEventListener) mqlPC.addEventListener("change", sync);
    else mqlPC.addListener(sync);

    onReady(sync);
    window.addEventListener("load", sync, { once:true });
  })();

  /* =========================================================
      SP/Tablet：Drawer active
  ========================================================= */
  (function(){
    var mqlMobile = window.matchMedia("(max-width: 1023px)");
    var obs = null;

    function setActiveMobile(key){
      var items = document.querySelectorAll(".mNav a[data-mtoc]");
      items.forEach(function(a){
        var on = (a.getAttribute("data-mtoc") === key);
        if(on) a.setAttribute("aria-current","page");
        else a.removeAttribute("aria-current");
      });
    }

    function start(){
      stop();
      if(!mqlMobile.matches) return;

      var sections = document.querySelectorAll('[data-aidma]');
      if(!sections.length) return;

      obs = new IntersectionObserver(function(entries){
        var visible = entries
          .filter(function(e){ return e.isIntersecting; })
          .sort(function(a,b){ return b.intersectionRatio - a.intersectionRatio; });

        if(visible[0]){
          setActiveMobile(visible[0].target.getAttribute("data-aidma"));
        }
      },{
        threshold:[0.2,0.35,0.5],
        rootMargin:"-30% 0px -55% 0px"
      });

      sections.forEach(function(sec){ obs.observe(sec); });
    }

    function stop(){ if(obs){ obs.disconnect(); obs=null; } }
    function sync(){ if(mqlMobile.matches) start(); else stop(); }

    if(mqlMobile.addEventListener) mqlMobile.addEventListener("change", sync);
    else mqlMobile.addListener(sync);

    onReady(sync);
    window.addEventListener("load", sync, { once:true });
  })();

  /* =========================================================
      Attention Intro Animation : JS
  ========================================================= */
  (function(){
    var ROOT = document.documentElement;
    var CLS  = "att-intro";

    function shouldRun(){
      if(prefersReducedMotion()) return false;
      var att = document.getElementById("Attention");
      if(!att) return false;
      if(location.hash && location.hash !== "" && location.hash !== "#Top" && location.hash !== "#Attention") return false;
      if((window.scrollY || 0) > 12) return false;
      return true;
    }

    function run(){
      if(!shouldRun()) return;

      ROOT.classList.add(CLS);

      var dur = getComputedStyle(ROOT).getPropertyValue("--att-intro-dur") || "4200ms";
      var ms = 4200;
      if(dur.indexOf("ms")>-1) ms = parseFloat(dur);
      else if(dur.indexOf("s")>-1) ms = parseFloat(dur)*1000;

      window.setTimeout(function(){
        ROOT.classList.remove(CLS);
      }, ms + 120);
    }

    onReady(run);
  })();

  /*  NEXT icon pulse */
  (function(){
    if (window.__ATTENTION_NEXTICON_PULSE_INITED__) return;
    window.__ATTENTION_NEXTICON_PULSE_INITED__ = true;

    onReady(function(){
      if (prefersReducedMotion()) return;

      var icon = document.querySelector("#Attention .attHero__nextIcon");
      if(!icon) return;

      var delay = document.documentElement.classList.contains("att-intro") ? 1700 : 0;
      setTimeout(function(){ icon.classList.add("is-pulse"); }, delay);
    });
  })();

/* =========================================================
    ✅ Changing slider：scrollLeft駆動（CSS依存ゼロ / 確実に見た目が変わる）
    - レイアウトは一切変更しない（DOM構造そのまま）
    - 末尾→先頭 / 先頭→末尾でループ
    - dots生成 / クリック移動
    - Android swipe改善：pointer優先 / 方向ロック / 横確定時だけ preventDefault
========================================================= */
(function(){
  function mod(n,m){ return ((n % m) + m) % m; }
  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
  function q(sel, root){ return (root||document).querySelector(sel); }
  function onReady(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function init(root){
    if(!root) return;

    // ✅ 旧版が先に走ってても、scroll版を必ず動かす
    try{ delete root.__chg_inited; }catch(_e){ root.__chg_inited = false; }
    if(root.__chg_scroll_inited) return;
    root.__chg_scroll_inited = true;

    var track = root.querySelector('[data-chg-track="1"]');
    if(!track) return;

    var slides = Array.prototype.slice.call(root.querySelectorAll('.chgSlide'));
    var n = slides.length;
    if(!n) return;

    var btnPrev = root.querySelector('[data-chg-prev="1"]');
    var btnNext = root.querySelector('[data-chg-next="1"]');

    var dotsWrap = root.querySelector('[data-chg-dots="1"]');
    var dots = [];

    // --- dots生成（既存仕様）
    if(dotsWrap){
      dotsWrap.innerHTML = "";
      for(var i=0;i<n;i++){
        var b = document.createElement("button");
        b.type = "button";
        b.className = "chgDot";
        b.setAttribute("data-chg-dot", String(i));
        b.setAttribute("aria-label", (i+1) + "枚目へ");
        dotsWrap.appendChild(b);
      }
      dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('[data-chg-dot]'));
    }

    // --- track設定：横スクロールを実際に動かす
    track.style.scrollBehavior = "auto";
    track.style.overscrollBehaviorX = "contain";
    // ✅ ここが重要：hidden だと scrollLeft しても見た目が詰まる実装があるため auto にする
    // （スクロールバーが気になる場合はCSSで隠すのが正攻法。既に隠してることが多い）
    track.style.overflowX = "auto";
    // ✅ 縦スクロールOK / 横はJSが掴む
    try{ track.style.touchAction = "pan-y"; }catch(_e){}

    var index = 0;
    var isLocked = false;
    var LOCK_MS = 380;

    // スライド位置キャッシュ（offsetLeft 기반）
    var pos = [];
    function measure(){
      pos = slides.map(function(s){ return s.offsetLeft; });
      // 現在indexへ再整列（レイアウト変化時）
      jumpTo(index);
    }
    // 初回計測は load 後が安全
    window.addEventListener("load", measure, { once:true });
    window.addEventListener("resize", function(){
      clearTimeout(measure._t);
      measure._t = setTimeout(measure, 120);
    });

    function setDots(i){
      for(var k=0;k<dots.length;k++){
        var on = (k === i);
        dots[k].classList.toggle('is-active', on);
        if(on) dots[k].setAttribute('aria-current','true');
        else dots[k].removeAttribute('aria-current');
      }
    }

    // （CSSがクラス対応してる場合にも保険で付ける：ただし表示はscrollが主）
    function applyClasses(i, dir){
      root.classList.toggle("is-dir-next", dir === 1);
      root.classList.toggle("is-dir-prev", dir === -1);

      for(var s=0;s<n;s++){
        slides[s].classList.toggle("is-active", s===i);
        slides[s].classList.toggle("is-prev",   s===mod(i-1,n));
        slides[s].classList.toggle("is-next",   s===mod(i+1,n));
      }
    }

    function jumpTo(i){
      i = mod(i,n);
      if(!pos.length) pos = slides.map(function(s){ return s.offsetLeft; });

      track.style.scrollBehavior = "auto";
      track.scrollLeft = pos[i] || 0;

      index = i;
      setDots(index);
      applyClasses(index, 0);
    }

    function smoothTo(i, dir){
      if(isLocked) return;
      isLocked = true;

      i = mod(i,n);
      if(!pos.length) pos = slides.map(function(s){ return s.offsetLeft; });

      applyClasses(i, dir);
      index = i;
      setDots(index);

      // smooth移動
      try{ track.style.scrollBehavior = "smooth"; }catch(_e){}
      track.scrollTo({ left: (pos[i] || 0), behavior: "smooth" });

      window.setTimeout(function(){
        try{ track.style.scrollBehavior = "auto"; }catch(_e){}
        isLocked = false;
      }, LOCK_MS);
    }

    function next(){ smoothTo(index+1,  1); }
    function prev(){ smoothTo(index-1, -1); }

    // dotsクリック
    dots.forEach(function(btn){
      btn.addEventListener("click", function(){
        var idx = parseInt(btn.getAttribute("data-chg-dot"), 10);
        if(isNaN(idx)) idx = 0;
        // 近い方向を選ぶ（循環）
        var f = mod(idx - index, n);
        var b = mod(index - idx, n);
        smoothTo(idx, (f <= b) ? 1 : -1);
      }, { passive:true });
    });

    if(btnNext) btnNext.addEventListener("click", next);
    if(btnPrev) btnPrev.addEventListener("click", prev);

    // キー操作
    track.addEventListener("keydown", function(e){
      if(e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      if(e.key === "ArrowLeft") prev();
      else next();
    });

    /* -------------------------
       ✅ Android安定：方向ロック + Pointer優先（touch二重購読なし）
    ------------------------- */
    var supportsPointer = !!window.PointerEvent;

    var startX=0, startY=0, lastX=0, lastY=0;
    var dragging=false;
    var lock = 0; // 0未判定 / 1横 / -1縦
    var SLOP = 8;
    var THRESH_PX = 44;
    var THRESH_VS_H = 1.25;

    function pointFromEvent(e){
      return (e.touches && e.touches[0]) ? e.touches[0] : e;
    }

    function onDown(e){
      if(isLocked) return;
      dragging = true;
      lock = 0;
      var p = pointFromEvent(e);
      startX = lastX = p.clientX;
      startY = lastY = p.clientY;

      // 取りこぼし防止
      if (supportsPointer && track.setPointerCapture && e.pointerId != null){
        try{ track.setPointerCapture(e.pointerId); }catch(_){}
      }
    }

    function onMove(e){
      if(!dragging) return;
      var p = pointFromEvent(e);
      lastX = p.clientX;
      lastY = p.clientY;

      var dx = lastX - startX;
      var dy = lastY - startY;

      if(lock === 0){
        if(Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
        if(Math.abs(dy) > Math.abs(dx) * THRESH_VS_H){
          dragging = false;
          lock = -1;
          return;
        }
        lock = 1;
      }

      if(lock === 1){
        if(e.cancelable) e.preventDefault();
      }
    }

    function onUp(e){
      if(lock !== 1) { dragging=false; lock=0; return; }
      if(!dragging) { lock=0; return; }
      dragging = false;

      var p = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : e;
      var dx = p.clientX - startX;
      var dy = p.clientY - startY;

      if(Math.abs(dy) > Math.abs(dx) * THRESH_VS_H){ lock=0; return; }

      if(Math.abs(dx) >= THRESH_PX){
        if(dx < 0) next();
        else prev();
      }
      lock = 0;
    }

    if(supportsPointer){
      track.addEventListener("pointerdown", onDown, {passive:true});
      track.addEventListener("pointermove", onMove, {passive:false});
      track.addEventListener("pointerup", onUp, {passive:true});
      track.addEventListener("pointercancel", onUp, {passive:true});
    }else{
      track.addEventListener("touchstart", onDown, {passive:true});
      track.addEventListener("touchmove", onMove, {passive:false});
      track.addEventListener("touchend", onUp, {passive:true});
      track.addEventListener("touchcancel", onUp, {passive:true});
    }

    // 初期
    jumpTo(0);
  }

  onReady(function(){
    var root = q('#Changing [data-chg="1"]');
    if(root) init(root);
  });
})();

  /* =========================================================
      BadImage：inview発火 → 1回だけ再生 → 完了固定（is-done）
  ========================================================= */
  (function(){
    if (window.__BADIMAGE_ONCE_INIT__) return;
    window.__BADIMAGE_ONCE_INIT__ = true;

    function waitAnimationEnd(el, timeoutMs){
      return new Promise((resolve) => {
        if (!el) return resolve();

        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          el.removeEventListener("animationend", onEnd);
          resolve();
        };

        const onEnd = () => finish();
        el.addEventListener("animationend", onEnd, { once: true });
        window.setTimeout(finish, Math.max(0, timeoutMs || 0));
      });
    }

    onReady(function(){
      var root = document.getElementById("BadImage");
      if (!root) return;
      if (root.classList.contains("is-done")) return;

      function finalize(){
        root.classList.add("is-done");
        root.classList.remove("is-inview");
        root.dataset.badimageDone = "1";
      }

      function fireOnce(){
        if (root.dataset.badimageDone === "1") return;

        if (prefersReducedMotion()){
          finalize();
          return;
        }

        root.classList.add("is-inview");

        var bubbleLast = root.querySelector(".badBubble--right > img");
        var arrowLast  = root.querySelector(".badArrowFlow i:nth-child(3)");

        var TIMEOUT_ARROW  = 2900;
        var TIMEOUT_BUBBLE = 1400;

        Promise.all([
          waitAnimationEnd(bubbleLast, TIMEOUT_BUBBLE),
          waitAnimationEnd(arrowLast,  TIMEOUT_ARROW)
        ]).then(finalize);
      }

      if(!("IntersectionObserver" in window)){
        fireOnce();
        return;
      }

      var io = new IntersectionObserver(function(entries){
        for (var i=0; i<entries.length; i++){
          if (!entries[i].isIntersecting) continue;
          fireOnce();
          io.disconnect();
          break;
        }
      }, { threshold: 0.92 });

      io.observe(root);
    });
  })();

  /* =========================================================
      VOICE Carousel（現行仕様維持） ✅Android swipe改善（確定）
  ========================================================= */
  (function(){
    if (window.__VOICE_CAROUSEL_INITED__) return;
    window.__VOICE_CAROUSEL_INITED__ = true;

    function mod(n,m){ return ((n % m) + m) % m; }
    function lerp(a,b,t){ return a + (b-a)*t; }
    function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
    function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

    onReady(function(){
      var root = document.querySelector('#Voice [data-voice-carousel="1"]');
      if(!root) return;

      var $text   = root.querySelector('[data-voice-text]');
      var $meta   = root.querySelector('[data-voice-meta]');
      var $ribbon = root.querySelector('[data-voice-ribbon]');
      var $bubbleSvg = root.querySelector('[data-voice-bubble-svg]');

      var $stage  = root.querySelector('[data-voice-stage]');
      var $prev   = root.querySelector('[data-voice-prev]');
      var $next   = root.querySelector('[data-voice-next]');

      var $imgL2 = root.querySelector('[data-voice-img="left2"]');
      var $imgL  = root.querySelector('[data-voice-img="left"]');
      var $imgM  = root.querySelector('[data-voice-img="main"]');
      var $imgR  = root.querySelector('[data-voice-img="right"]');
      var $imgR2 = root.querySelector('[data-voice-img="right2"]');

      var $dotsWrap = root.querySelector('[data-voice-dots]');

      if(!$stage || !$imgL || !$imgM || !$imgR || !$imgL2 || !$imgR2) return;

      try{ $stage.style.touchAction = "pan-y"; }catch(_e){}

      var VOICES = [
        { img:"assets/senior1.png",
          text:'同期と『最初の職場がここで良かったね』<br>とよく話すくらい、毎日“いいじゃん”<br>と思える瞬間があります。',
          meta:"勤続1年目",
          ribbon:"大宮共立病院 介護チーム一同、<br>あなたと一緒に働ける日を心待ちにしています。"
        },
        { img:"assets/senior2.png",
          text:"一人にしないチーム体制があって安心です。<br>「きついだけの介護にしない」が、<br>仕組みとしてちゃんとあります。",
          meta:"勤続1年目",
          ribbon:"大宮共立病院 介護チーム一同、<br>あなたと一緒に働ける日を心待ちにしています。"
        },
        { img:"assets/senior3.png",
          text:"男性の強みも活かせる職場です。<br>教育制度で目標が明確なので、<br>成長の実感があります。",
          meta:"勤続2年目",
          ribbon:"大宮共立病院 介護チーム一同、<br>あなたと一緒に働ける日を心待ちにしています。"
        },
        { img:"assets/senior4.png",
          text:"相談しやすい環境のおかげで、無理なく<br>続けられています。できることが増えて、<br>成長を実感しています。",
          meta:"勤続4年目",
          ribbon:"大宮共立病院 介護チーム一同、<br>あなたと一緒に働ける日を心待ちにしています。"
        },
        { img:"assets/senior5.png",
          text:"後輩を育てる立場になりました。<br>仲間と一緒に成長できる空気が、<br>この職場の良さです。",
          meta:"勤続6年目",
          ribbon:"大宮共立病院 介護チーム一同、<br>あなたと一緒に働ける日を心待ちにしています。"
        },
        { img:"assets/senior6.png",
          text:"（声6）新人さんには、無理せず長く<br>続けてほしいです。やりがいも生活も、<br>大切にできる職場だと思います。",
          meta:"勤続10年目",
          ribbon:"大宮共立病院 介護チーム一同、<br>あなたと一緒に働ける日を心待ちにしています。"
        }
      ];

      if($dotsWrap){
        $dotsWrap.innerHTML = "";
        for(var i=0;i<VOICES.length;i++){
          var d = document.createElement("span");
          d.className = "voiceDot" + (i===0 ? " is-active" : "");
          $dotsWrap.appendChild(d);
        }
      }
      function setDots(i){
        if(!$dotsWrap) return;
        var dots = $dotsWrap.querySelectorAll(".voiceDot");
        for(var k=0;k<dots.length;k++){
          dots[k].classList.toggle("is-active", k===i);
        }
      }

      function fitVoiceText(){
        if(!$text) return;
        if($text.clientHeight <= 0 || $text.clientWidth <= 0) return;

        var START = 14;
        var MIN   = 10;
        var STEP  = 0.5;

        $text.style.transform = "";
        $text.style.fontSize = START + "px";

        var guard = 0;
        while (START > MIN){
          var overH = ($text.scrollHeight > $text.clientHeight);
          var overW = ($text.scrollWidth  > $text.clientWidth);
          if(!overH && !overW) break;

          START -= STEP;
          $text.style.fontSize = START + "px";
          if(++guard > 120) break;
        }

        if($text.scrollWidth > $text.clientWidth){
          var s = $text.clientWidth / $text.scrollWidth;
          s = Math.max(0.88, Math.min(1, s));
          $text.style.transformOrigin = "50% 50%";
          $text.style.transform = "scaleX(" + s.toFixed(3) + ")";
        }else{
          $text.style.transform = "";
        }
      }
      function fitVoiceTextRAF(){ requestAnimationFrame(fitVoiceText); }

      var center = 0;
      var iL2=0, iL=0, iM=0, iR=0, iR2=0;

      function setContent(i, doFit){
        if($text) $text.innerHTML = VOICES[i].text || "";
        if($meta) $meta.textContent = VOICES[i].meta || "";
        if($ribbon) $ribbon.innerHTML = VOICES[i].ribbon || "";
        if($bubbleSvg){ $bubbleSvg.src = "assets/voice-text" + ((i % 2) + 1) + ".svg"; }
        setDots(i);
        if(doFit) fitVoiceTextRAF();
      }

      function setWindowByCenter(c){
        center = mod(c, VOICES.length);
        iM  = center;
        iL  = mod(center-1, VOICES.length);
        iL2 = mod(center-2, VOICES.length);
        iR  = mod(center+1, VOICES.length);
        iR2 = mod(center+2, VOICES.length);

        $imgL2.src = VOICES[iL2].img || "";
        $imgL .src = VOICES[iL ].img || "";
        $imgM .src = VOICES[iM ].img || "";
        $imgR .src = VOICES[iR ].img || "";
        $imgR2.src = VOICES[iR2].img || "";

        setContent(center, true);
      }

      var dragX = 0;
      var W = 1;
      var thresholdRatio = 0.17;
      var resistance = 0.92;

      var SCALE_MAIN = 1.30;
      var SCALE_SIDE = 0.70;
      var SCALE_FAR  = SCALE_SIDE;

      function measure(){ W = $stage.getBoundingClientRect().width || 1; }
      measure();
      window.addEventListener("resize", measure);

      function baseGap(){ return Math.min(Math.max(W * 0.40, 100), 170); }

      function applyTransforms(x){
        var g = baseGap();

        var pL2 = (-2*g + x);
        var pL  = (-1*g + x);
        var pM  = (0    + x);
        var pR  = (1*g  + x);
        var pR2 = (2*g  + x);

        var t = clamp(Math.abs(x) / g, 0, 1);

        var sL = SCALE_SIDE, sM = SCALE_MAIN, sR = SCALE_SIDE;

        if(x < 0){
          sM = lerp(SCALE_MAIN, SCALE_SIDE, t);
          sR = lerp(SCALE_SIDE, SCALE_MAIN, t);
          sL = lerp(SCALE_SIDE, SCALE_SIDE * 0.96, t);
        }else if(x > 0){
          sM = lerp(SCALE_MAIN, SCALE_SIDE, t);
          sL = lerp(SCALE_SIDE, SCALE_MAIN, t);
          sR = lerp(SCALE_SIDE, SCALE_SIDE * 0.96, t);
        }

        var sL2 = SCALE_FAR;
        var sR2 = SCALE_FAR;

        $imgL2.style.transform = "translateX(calc(-50% + " + pL2.toFixed(2) + "px)) scale(" + sL2.toFixed(3) + ")";
        $imgL .style.transform = "translateX(calc(-50% + " + pL .toFixed(2) + "px)) scale(" + sL .toFixed(3) + ")";
        $imgM .style.transform = "translateX(calc(-50% + " + pM .toFixed(2) + "px)) scale(" + sM .toFixed(3) + ")";
        $imgR .style.transform = "translateX(calc(-50% + " + pR .toFixed(2) + "px)) scale(" + sR .toFixed(3) + ")";
        $imgR2.style.transform = "translateX(calc(-50% + " + pR2.toFixed(2) + "px)) scale(" + sR2.toFixed(3) + ")";

        $imgM .style.zIndex = 3;
        $imgL .style.zIndex = 2;
        $imgR .style.zIndex = 2;
        $imgL2.style.zIndex = 1;
        $imgR2.style.zIndex = 1;
      }

      function resetTransformsInstant(){
        dragX = 0;
        applyTransforms(0);
      }

      function wrapIfNeeded(){
        var g = baseGap();

        while(dragX <= -g){
          dragX += g;

          iL2 = iL;
          iL  = iM;
          iM  = iR;
          iR  = iR2;
          iR2 = mod(iR2 + 1, VOICES.length);

          $imgL2.src = VOICES[iL2].img || "";
          $imgL .src = VOICES[iL ].img || "";
          $imgM .src = VOICES[iM ].img || "";
          $imgR .src = VOICES[iR ].img || "";
          $imgR2.src = VOICES[iR2].img || "";

          center = iM;
        }

        while(dragX >= g){
          dragX -= g;

          iR2 = iR;
          iR  = iM;
          iM  = iL;
          iL  = iL2;
          iL2 = mod(iL2 - 1, VOICES.length);

          $imgL2.src = VOICES[iL2].img || "";
          $imgL .src = VOICES[iL ].img || "";
          $imgM .src = VOICES[iM ].img || "";
          $imgR .src = VOICES[iR ].img || "";
          $imgR2.src = VOICES[iR2].img || "";

          center = iM;
        }
      }

      var preview = -1;
      function syncContent(){
        var g = baseGap();
        var t = clamp(Math.abs(dragX) / g, 0, 1);

        var c = iM;
        if(dragX < 0 && t > 0.5) c = iR;
        if(dragX > 0 && t > 0.5) c = iL;

        if(c !== preview){
          preview = c;
          setContent(preview, true);
        }
      }

      function animateToX(fromX, toX, ms, done){
        var t0 = performance.now();
        function tick(now){
          var p = clamp((now - t0) / ms, 0, 1);
          var e = easeOutCubic(p);
          dragX = fromX + (toX - fromX) * e;

          wrapIfNeeded();
          applyTransforms(dragX);
          syncContent();

          if(p < 1) requestAnimationFrame(tick);
          else done && done();
        }
        requestAnimationFrame(tick);
      }

      var isLocked = false;

      function commitAnimated(dir, fromX){
        if(isLocked) return;
        isLocked = true;

        var g = baseGap();
        var targetX = (dir === 1) ? -g : g;

        $stage.classList.add("is-dragging");
        animateToX(fromX || 0, targetX, 160, function(){
          animateToX(dragX, 0, 80, function(){
            $stage.classList.remove("is-dragging");
            resetTransformsInstant();
            setContent(center, true);
            window.setTimeout(function(){ isLocked = false; }, 40);
          });
        });
      }

      setWindowByCenter(0);
      preview = center;
      resetTransformsInstant();

      function stopEvt(e){
        e.preventDefault();
        e.stopPropagation();
      }
      [$prev, $next].forEach(function(btn){
        if(!btn) return;
        btn.addEventListener("pointerdown", stopEvt);
        btn.addEventListener("touchstart", stopEvt, {passive:false});
      });

      function normalizeDrag(){
        var g = baseGap();
        if(!g) return;
        dragX = ((dragX % g) + g) % g;
        if(dragX > g/2) dragX -= g;
      }

      function clickPrev(){
        if(isLocked) return;
        normalizeDrag();
        commitAnimated(-1, dragX);
      }
      function clickNext(){
        if(isLocked) return;
        normalizeDrag();
        commitAnimated( 1, dragX);
      }

      if($prev) $prev.addEventListener("click", clickPrev);
      if($next) $next.addEventListener("click", clickNext);

      var supportsPointer = !!window.PointerEvent;

      var startX=0, startY=0, curX=0, curY=0;
      var dragging=false;
      var lock = 0;
      var SLOP = 8;

      var raf = 0;
      function draw(){
        raf = 0;
        var dx = curX - startX;

        var damp = 1 - Math.min(Math.abs(dx) / (W*1.2), 0.45);
        dragX = dx * (resistance * damp);

        wrapIfNeeded();
        applyTransforms(dragX);
        syncContent();
      }

      function pointFromEvent(e){ return (e.touches && e.touches[0]) ? e.touches[0] : e; }

      function onDown(e){
        if(isLocked) return;
        measure();

        dragging = true;
        lock = 0;

        var p = pointFromEvent(e);
        startX = curX = p.clientX;
        startY = curY = p.clientY;

        dragX = 0;
        $stage.classList.add("is-dragging");

        if (supportsPointer && $stage.setPointerCapture && e.pointerId != null){
          try{ $stage.setPointerCapture(e.pointerId); }catch(_){}
        }
      }

      function onMove(e){
        if(!dragging) return;

        var p = pointFromEvent(e);
        curX = p.clientX;
        curY = p.clientY;

        var dx = curX - startX;
        var dy = curY - startY;

        if(lock === 0){
          if(Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;

          if(Math.abs(dy) > Math.abs(dx) * 1.25){
            dragging = false;
            lock = -1;
            $stage.classList.remove("is-dragging");
            resetTransformsInstant();
            return;
          }
          lock = 1;
        }

        if(lock === 1){
          if(e.cancelable) e.preventDefault();
          if(!raf) raf = requestAnimationFrame(draw);
        }
      }

      function onUp(e){
        if(lock !== 1){
          dragging = false;
          lock = 0;
          return;
        }
        if(!dragging){
          lock = 0;
          return;
        }
        dragging = false;

        var ratio = Math.abs(dragX) / W;
        if(ratio >= thresholdRatio){
          if(dragX < 0) commitAnimated( 1, dragX);
          else         commitAnimated(-1, dragX);
          lock = 0;
          return;
        }

        var from = dragX;
        $stage.classList.add("is-dragging");
        animateToX(from, 0, 140, function(){
          $stage.classList.remove("is-dragging");
          resetTransformsInstant();
          setContent(center, true);
        });

        lock = 0;
      }

      if(supportsPointer){
        $stage.addEventListener("pointerdown", onDown, {passive:true});
        $stage.addEventListener("pointermove", onMove, {passive:false});
        $stage.addEventListener("pointerup", onUp, {passive:true});
        $stage.addEventListener("pointercancel", onUp, {passive:true});
      }else{
        $stage.addEventListener("touchstart", onDown, {passive:true});
        $stage.addEventListener("touchmove", onMove, {passive:false});
        $stage.addEventListener("touchend", onUp, {passive:true});
        $stage.addEventListener("touchcancel", onUp, {passive:true});
      }

      window.addEventListener("load", function(){ fitVoiceTextRAF(); });

      var __vf_t = null;
      window.addEventListener("resize", function(){
        clearTimeout(__vf_t);
        __vf_t = setTimeout(function(){
          measure();
          fitVoiceTextRAF();
        }, 120);
      });
    });
  })();

  /* =========================================================
      DATA Count Up（SVG digits版：スクロール発火）
  ========================================================= */
  (function(){
    if (window.__DATA_SVG_DIGITS_COUNT_INITED__) return;
    window.__DATA_SVG_DIGITS_COUNT_INITED__ = true;

    var DIR_CANDIDATES = ["assets/", "/assets/"];
    var DIGIT_EXT = ".svg";
    var WORKING_DIR = null;

    function detectDir(cb){
      var i = 0;
      function tryNext(){
        if(i >= DIR_CANDIDATES.length){ cb(null); return; }
        var dir = DIR_CANDIDATES[i++];
        var im = new Image();
        im.onload = function(){ cb(dir); };
        im.onerror = tryNext;
        im.src = dir + "0" + DIGIT_EXT + "?v=" + Date.now();
      }
      tryNext();
    }

    function padLeft(str, len){
      str = String(str);
      while(str.length < len) str = "0" + str;
      return str;
    }

    function ensureImgs(holder, count){
      var imgs = holder.querySelectorAll("img.dataDigitImg");
      if(imgs.length === count) return;
      holder.innerHTML = "";
      for(var i=0;i<count;i++){
        var img = document.createElement("img");
        img.className = "dataDigitImg";
        img.alt = "";
        img.decoding = "async";
        img.loading = "eager";
        holder.appendChild(img);
      }
    }

    function digitSrc(d){ return WORKING_DIR + d + DIGIT_EXT; }

    function renderNumber(holder, value){
      var digitsOpt = parseInt(holder.getAttribute("data-digits") || "0", 10);
      var str = String(value);
      if(digitsOpt && digitsOpt > 0) str = padLeft(str, digitsOpt);

      if(!WORKING_DIR){
        holder.textContent = str;
        return;
      }

      ensureImgs(holder, str.length);

      var imgs = holder.querySelectorAll("img.dataDigitImg");
      for(var i=0;i<str.length;i++){
        var d = str.charCodeAt(i) - 48;
        imgs[i].src = digitSrc(d);
      }
      holder.setAttribute("aria-label", String(value));
    }

    function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

    function animateCount(holder, target, duration){
      var start = 1;
      var t0 = performance.now();

      if(prefersReducedMotion()){
        renderNumber(holder, target);
        holder.dataset.countDone = "1";
        return;
      }

      function tick(now){
        var p = Math.min(1, (now - t0) / duration);
        var v = Math.floor(start + (target - start) * easeOutCubic(p));
        renderNumber(holder, v);

        if(p < 1) requestAnimationFrame(tick);
        else{
          renderNumber(holder, target);
          holder.dataset.countDone = "1";
        }
      }
      requestAnimationFrame(tick);
    }

    function runCounts(sec){
      var holders = sec.querySelectorAll(".dataDigits[data-count-to]");
      holders.forEach(function(holder, i){
        if(holder.dataset.countDone === "1") return;

        var target = parseInt(holder.getAttribute("data-count-to"), 10);
        if(!isFinite(target)) return;

        var duration = 900 + i * 160;

        renderNumber(holder, 1);
        animateCount(holder, target, duration);
      });
    }

    onReady(function(){
      var sec = document.getElementById("Data");
      if(!sec) return;

      detectDir(function(dir){
        WORKING_DIR = dir;

        if("IntersectionObserver" in window){
          var io = new IntersectionObserver(function(entries){
            entries.forEach(function(e){
              if(e.isIntersecting){
                runCounts(sec);
                io.disconnect();
              }
            });
          }, { threshold: 0.35 });
          io.observe(sec);
        }else{
          runCounts(sec);
        }
      });
    });
  })();

})();

/* =========================================================
  [APPEND] LP ⇄ FORM 切替（1HTML統合 / ハッシュルーティング）
  - #ActionForm / #form / #join / #joinus でフォーム表示
  - フォーム表示中に #Top/#BadImage... を押したら
    → LPへ戻してから該当セクションへスクロール
  - 戻るボタン： [data-close-form="1"]
========================================================= */
(function(){
  if (window.__AIDMA_FORM_ROUTER__) return;
  window.__AIDMA_FORM_ROUTER__ = true;

  var FORM_HASHES = ["#ActionForm", "#form", "#join", "#joinus"];
  var body = document.body;

  function isFormHash(h){
    h = (h || location.hash || "").trim();
    return FORM_HASHES.indexOf(h) !== -1;
  }

  function showForm(){
    body.classList.add("is-form");
    // フォーム表示の先頭へ（好みで削除可）
    requestAnimationFrame(function(){
      try{
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }catch(e){
        window.scrollTo(0, 0);
      }
    });
  }

  function showLP(){
    body.classList.remove("is-form");
  }

  function getHeaderH(){
    // 既存CSSに --header-h があればそれを優先
    var headerH = 72;
    try{
      var v = getComputedStyle(document.documentElement).getPropertyValue("--header-h");
      var n = parseFloat(v);
      if(!isNaN(n)) headerH = n;
    }catch(e){}
    return headerH;
  }

  function scrollToHash(hash){
    if(!hash || hash === "#") return;
    var id = hash.slice(1);
    var el = document.getElementById(id);
    if(!el) return;

    var top = el.getBoundingClientRect().top + window.pageYOffset - getHeaderH();
    try{
      window.scrollTo({ top: top, behavior: "smooth" });
    }catch(e){
      window.scrollTo(0, top);
    }
  }

  function route(){
    var h = (location.hash || "#Top").trim();

    // フォームを開く
    if (isFormHash(h)){
      showForm();
      return;
    }

    // フォーム内STEP（フォーム表示中のみ）
    if (body.classList.contains("is-form") && /^#step[1-3]$/.test(h)){
      requestAnimationFrame(function(){ scrollToHash(h); });
      return;
    }

    // それ以外 → LPへ戻す
    var wasForm = body.classList.contains("is-form");
    showLP();

    // フォーム→LPに戻った直後のスクロールを安定化
    requestAnimationFrame(function(){
      // ハッシュが無い場合はTopへ
      if (!h || h === "#") h = "#Top";
      // フォームから戻った場合でも、該当箇所へ
      if (h && h !== "#ActionForm") scrollToHash(h);
    });
  }

  // ✅ クリック横取り（captureで先に拾う）
  document.addEventListener("click", function(e){
    var a = e.target.closest && e.target.closest("a[href]");
    if(!a) return;

    var href = (a.getAttribute("href") || "").trim();
    if(href.indexOf("#") !== 0) return; // 外部リンク等はそのまま

    // フォームを開く
    if(isFormHash(href)){
      e.preventDefault();
      history.pushState(null, "", href);
      route();
      return;
    }

    // フォーム内STEP（フォーム表示中だけ）
    if(/^#step[1-3]$/.test(href)){
      if(body.classList.contains("is-form")){
        e.preventDefault();
        history.pushState(null, "", href);
        route();
      }
      return;
    }

    // フォーム表示中にLPアンカーを押した → LPへ戻してスクロール
    if(body.classList.contains("is-form")){
      e.preventDefault();
      history.pushState(null, "", href);
      route();
    }
  }, true);

  // ✅ フォームを閉じるボタン
  document.addEventListener("click", function(e){
    var btn = e.target.closest && e.target.closest("[data-close-form]");
    if(!btn) return;
    e.preventDefault();
    // 戻り先は Action（好みで #Top にしてもOK）
    history.pushState(null, "", "#Action");
    route();
  });

  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);

  // 初期
  route();
})();