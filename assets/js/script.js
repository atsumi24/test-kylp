(function(){
  if (window.__AIDMA_ALL_JS_INITED__) return;
  window.__AIDMA_ALL_JS_INITED__ = true;

  var ROOT_ID = "lp-omiya-kaigo";
  var root = null;

  function getRoot(){
    if (root && document.body && document.body.contains(root)) return root;
    root = document.getElementById(ROOT_ID);
    return root;
  }

  function q(sel, scope){
    return (scope || document).querySelector(sel);
  }

  function qa(sel, scope){
    return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  }

  function rq(sel){
    var r = getRoot();
    return r ? q(sel, r) : null;
  }

  function rqa(sel){
    var r = getRoot();
    return r ? qa(sel, r) : [];
  }

  function onReady(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function onReadyAndLoad(fn){
    onReady(fn);
    window.addEventListener("load", fn, { once:true });
  }

  function setRootVar(name,val){
    var r = getRoot();
    if(!r) return;
    r.style.setProperty(name, val);
  }

  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
  function num(v){ v = parseFloat(v); return isNaN(v) ? 0 : v; }

  function prefersReducedMotion(){
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function getHeaderH(){
    var headerH = 72;
    try{
      var r = getRoot();
      if(r){
        var v = getComputedStyle(r).getPropertyValue("--header-h");
        var n = parseFloat(v);
        if(!isNaN(n)) headerH = n;
      }
    }catch(e){}
    return headerH;
  }

  onReady(function(){
    if(!getRoot()) return;

    (function(){
      var mqlMobile = window.matchMedia("(max-width: 1023px)");
      var OPEN_CLASS = "mnav-open";

      var btnOpen = rq("[data-mnav-open='1']");
      var overlay = rq(".mDrawerOverlay");
      var drawer  = rq(".mDrawer");
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
        var closeBtn = rq("[data-mnav-close='1']");
        if(closeBtn) closeBtn.focus({preventScroll:true});
      }

      function closeMenu(restoreFocus){
        document.documentElement.classList.remove(OPEN_CLASS);
        setExpanded(false);
        if(restoreFocus !== false) btnOpen.focus({preventScroll:true});
      }

      btnOpen.addEventListener("click", function(){
        var on = document.documentElement.classList.contains(OPEN_CLASS);
        if(on) closeMenu();
        else openMenu();
      });

      rqa("[data-mnav-close='1']").forEach(function(el){
        el.addEventListener("click", function(){ closeMenu(); });
      });

      rqa(".mNav a").forEach(function(a){
        a.addEventListener("click", function(){ closeMenu(false); });
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


    (function(){
      var mqlPC = window.matchMedia("(min-width: 1024px)");

      function fitLeftPanel(){
        if(!mqlPC.matches) return;

        var rail  = rq(".aidmaRail--L");
        var inner = rq(".aidmaRail--L .aidmaRail__inner");
        var fit   = rq(".aidmaRail--L [data-pc-leftfit='1']");
        if(!rail || !inner || !fit) return;

        rail.classList.remove("is-scroll");
        setRootVar("--pcleft-scale", "1");

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

          setRootVar("--pcleft-scale", applied.toFixed(3));

          var wouldClipW = (reqW * applied) > (availW + 1);
          var wouldClipH = (reqH * applied) > (availH + 1);
          rail.classList.toggle("is-scroll", (wouldClipW || wouldClipH || need < FLOOR));
        });
      }

      onReadyAndLoad(fitLeftPanel);

      var fit = rq(".aidmaRail--L [data-pc-leftfit='1']");
      if(fit){
        qa("img", fit).forEach(function(img){
          if(img.complete) return;
          img.addEventListener("load", fitLeftPanel, { once:true });
          img.addEventListener("error", fitLeftPanel, { once:true });
        });
      }

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
        var innerEl = rq(".aidmaRail--L .aidmaRail__inner");
        if(innerEl) ro.observe(innerEl);
      }

      if(mqlPC.addEventListener) mqlPC.addEventListener("change", fitLeftPanel);
      else mqlPC.addListener(fitLeftPanel);
    })();


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

        var rail      = rq(".aidmaRail--R");
        var railInner = rq(".aidmaRail--R .aidmaRail__inner");
        var tilt      = rq(".aidmaRail--R .pcTextMenu__tilt");
        if(!rail || !railInner || !tilt) return;

        var innerRect = railInner.getBoundingClientRect();
        var cs = getComputedStyle(railInner);
        var padX = num(cs.paddingLeft) + num(cs.paddingRight);
        var padY = num(cs.paddingTop)  + num(cs.paddingBottom);

        var availW = Math.max(0, innerRect.width  - padX);
        var availH = Math.max(0, innerRect.height - padY);

        var safeW = Math.floor(availW - 8);
        safeW = Math.max(210, Math.min(300, safeW));
        setRootVar("--pcmenu-w", safeW + "px");

        setRootVar("--pcmenu-scale", "1");
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

          setRootVar("--pcmenu-scale", sApplied.toFixed(3));

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
        var ri = rq(".aidmaRail--R .aidmaRail__inner");
        if(ri) ro.observe(ri);
      }

      if(mqlPC.addEventListener) mqlPC.addEventListener("change", fitPcRightMenu);
      else mqlPC.addListener(fitPcRightMenu);
    })();


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
        rqa(MENU_ITEM_SEL).forEach(function(a){
          var on = (a.getAttribute("data-toc") === key);
          a.classList.toggle("is-active", on);
          if(on) a.setAttribute("aria-current","page");
          else a.removeAttribute("aria-current");
        });
      }

      function collectMenuKeys(){
        var items = rqa(MENU_ITEM_SEL);
        var keys = [];
        items.forEach(function(a){
          var k = (a.getAttribute("data-toc") || "").trim();
          if(k) keys.push(k);
        });
        return Array.from(new Set(keys));
      }

      function collectSectionsFromMenu(){
        var r = getRoot();
        if(!r) return { keys:[], sections:[] };

        var keys = collectMenuKeys();
        if(!keys.length) return { keys:[], sections:[] };

        var sections = [];
        keys.forEach(function(key){
          var el = q("#" + CSS.escape(key), r);
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

      function getScrollY(){
        return window.scrollY || document.documentElement.scrollTop || 0;
      }

      function isAtTop(){
        return getScrollY() <= TOP_ACTIVE_PX;
      }

      function isAtBottom(){
        var doc = document.documentElement;
        var y = getScrollY();
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
        if(bestKey){
          setActive(bestKey);
          return;
        }

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
              var r = getRoot();
              var el = r ? q("#" + CSS.escape(id), r) : null;
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

      function sync(){
        if(mqlPC.matches) start();
        else stop();
      }

      if(mqlPC.addEventListener) mqlPC.addEventListener("change", sync);
      else mqlPC.addListener(sync);

      sync();
      window.addEventListener("load", sync, { once:true });
    })();


    (function(){
      var mqlMobile = window.matchMedia("(max-width: 1023px)");
      var obs = null;

      function setActiveMobile(key){
        rqa(".mNav a[data-mtoc]").forEach(function(a){
          var on = (a.getAttribute("data-mtoc") === key);
          if(on) a.setAttribute("aria-current","page");
          else a.removeAttribute("aria-current");
        });
      }

      function start(){
        stop();
        if(!mqlMobile.matches) return;

        var sections = rqa('[data-aidma]');
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

      function stop(){
        if(obs){ obs.disconnect(); obs=null; }
      }

      function sync(){
        if(mqlMobile.matches) start();
        else stop();
      }

      if(mqlMobile.addEventListener) mqlMobile.addEventListener("change", sync);
      else mqlMobile.addListener(sync);

      sync();
      window.addEventListener("load", sync, { once:true });
    })();


(function(){
  var ROOT_HTML = document.documentElement;
  var PREP_CLS = "att-intro-prep";
  var CLS = "att-intro";
  var started = false;
  var timers = [];

  function shouldRun(){
    if(prefersReducedMotion()) return false;
    var att = rq("#Attention");
    if(!att) return false;
    return true;
  }

  function clearTimers(){
    while(timers.length){
      clearTimeout(timers.pop());
    }
  }

  function later(fn, ms){
    var id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function cleanupPrep(){
    ROOT_HTML.classList.remove(PREP_CLS);
  }

  function resetAttentionStates(){
    var att = rq("#Attention");
    if(!att) return null;

    var hero     = q(".attHero", att);
    var kicker   = q(".attHero__kicker", att);
    var chars    = q(".attHero__chars", att);
    var next     = q(".attHero__next", att);
    var nextIcon = q(".attHero__nextIcon", att);
    var face     = q(".catchFace", att);
    var shadow   = q(".catchShadow", att);

    [hero, kicker, chars, next, nextIcon, face, shadow].forEach(function(el){
      if(!el) return;
      el.classList.remove("is-att-spot", "is-att-on", "is-pulse");
    });

    return {
      hero: hero,
      kicker: kicker,
      chars: chars,
      next: next,
      nextIcon: nextIcon,
      face: face,
      shadow: shadow
    };
  }

  function forceReflow(el){
    if(!el) return;
    void el.offsetHeight;
  }

  function run(){
    if(started) return;

    if(!shouldRun()){
      cleanupPrep();
      return;
    }

    started = true;
    clearTimers();

    var parts = resetAttentionStates();
    if(!parts){
      cleanupPrep();
      return;
    }

    requestAnimationFrame(function(){
      cleanupPrep();
      ROOT_HTML.classList.add(CLS);

      forceReflow(parts.hero);

      if(parts.hero) parts.hero.classList.add("is-att-spot");

      later(function(){
        if(parts.kicker) parts.kicker.classList.add("is-att-on");
      }, 70);

      later(function(){
        if(parts.shadow) parts.shadow.classList.add("is-att-on");
        if(parts.face)   parts.face.classList.add("is-att-on");
        if(parts.chars)  parts.chars.classList.add("is-att-on");
      }, 620);

      later(function(){
        if(parts.next) parts.next.classList.add("is-att-on");
      }, 1450);

      later(function(){
        if(parts.nextIcon) parts.nextIcon.classList.add("is-pulse");
      }, 1550);

      later(function(){
        ROOT_HTML.classList.remove(CLS);
      }, 2600);
    });
  }

  function waitAndRun(){
    if(document.readyState === "complete"){
      run();
    }else{
      window.addEventListener("load", run, { once:true });
    }
  }

  waitAndRun();
})();


    (function(){
      function mod(n,m){ return ((n % m) + m) % m; }

      function init(rootEl){
        if(!rootEl) return;

        try{ delete rootEl.__chg_inited; }catch(_e){ rootEl.__chg_inited = false; }
        if(rootEl.__chg_scroll_inited) return;
        rootEl.__chg_scroll_inited = true;

        var track = q('[data-chg-track="1"]', rootEl);
        if(!track) return;

        var slides = qa('.chgSlide', rootEl);
        var n = slides.length;
        if(!n) return;

        var btnPrev = q('[data-chg-prev="1"]', rootEl);
        var btnNext = q('[data-chg-next="1"]', rootEl);

        var dotsWrap = q('[data-chg-dots="1"]', rootEl);
        var dots = [];

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
          dots = qa('[data-chg-dot]', dotsWrap);
        }

        track.style.scrollBehavior = "auto";
        track.style.overscrollBehaviorX = "contain";
        track.style.overflowX = "auto";
        try{ track.style.touchAction = "pan-y"; }catch(_e){}

        var index = 0;
        var isLocked = false;
        var LOCK_MS = 380;

        var pos = [];
        function measure(){
          pos = slides.map(function(s){ return s.offsetLeft; });
          jumpTo(index);
        }

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

        function applyClasses(i, dir){
          rootEl.classList.toggle("is-dir-next", dir === 1);
          rootEl.classList.toggle("is-dir-prev", dir === -1);

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

          try{ track.style.scrollBehavior = "smooth"; }catch(_e){}
          track.scrollTo({ left: (pos[i] || 0), behavior: "smooth" });

          window.setTimeout(function(){
            try{ track.style.scrollBehavior = "auto"; }catch(_e){}
            isLocked = false;
          }, LOCK_MS);
        }

        function next(){ smoothTo(index+1,  1); }
        function prev(){ smoothTo(index-1, -1); }

        dots.forEach(function(btn){
          btn.addEventListener("click", function(){
            var idx = parseInt(btn.getAttribute("data-chg-dot"), 10);
            if(isNaN(idx)) idx = 0;
            var f = mod(idx - index, n);
            var b = mod(index - idx, n);
            smoothTo(idx, (f <= b) ? 1 : -1);
          }, { passive:true });
        });

        if(btnNext) btnNext.addEventListener("click", next);
        if(btnPrev) btnPrev.addEventListener("click", prev);

        track.addEventListener("keydown", function(e){
          if(e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          if(e.key === "ArrowLeft") prev();
          else next();
        });

        var supportsPointer = !!window.PointerEvent;

        var startX=0, startY=0, lastX=0, lastY=0;
        var dragging=false;
        var lock = 0;
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

        jumpTo(0);
      }

      var rootEl = rq('#Changing [data-chg="1"]');
      if(rootEl) init(rootEl);
    })();


    (function(){
      if (window.__BADIMAGE_ONCE_INIT__) return;
      window.__BADIMAGE_ONCE_INIT__ = true;

      function waitAnimationEnd(el, timeoutMs){
        return new Promise(function(resolve){
          if (!el) return resolve();

          var done = false;
          var finish = function(){
            if (done) return;
            done = true;
            el.removeEventListener("animationend", onEnd);
            resolve();
          };

          var onEnd = function(){ finish(); };
          el.addEventListener("animationend", onEnd, { once: true });
          window.setTimeout(finish, Math.max(0, timeoutMs || 0));
        });
      }

      var rootEl = rq("#BadImage");
      if (!rootEl) return;
      if (rootEl.classList.contains("is-done")) return;

      function finalize(){
        rootEl.classList.add("is-done");
        rootEl.classList.remove("is-inview");
        rootEl.dataset.badimageDone = "1";
      }

      function fireOnce(){
        if (rootEl.dataset.badimageDone === "1") return;

        if (prefersReducedMotion()){
          finalize();
          return;
        }

        rootEl.classList.add("is-inview");

        var bubbleLast = q(".badBubble--right > img", rootEl);
        var arrowLast  = q(".badArrowFlow i:nth-child(3)", rootEl);

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
      }, { threshold: 0.75 });

      io.observe(rootEl);
    })();


    (function(){
      if (window.__VOICE_CAROUSEL_INITED__) return;
      window.__VOICE_CAROUSEL_INITED__ = true;

      function mod(n,m){ return ((n % m) + m) % m; }
      function lerp(a,b,t){ return a + (b-a)*t; }
      function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

      var rootEl = rq('#Voice [data-voice-carousel="1"]');
      if(!rootEl) return;

      var $text   = q('[data-voice-text]', rootEl);
      var $meta   = q('[data-voice-meta]', rootEl);
      var $ribbon = q('[data-voice-ribbon]', rootEl);
      var $bubbleSvg = q('[data-voice-bubble-svg]', rootEl);

      var $stage  = q('[data-voice-stage]', rootEl);
      var $prev   = q('[data-voice-prev]', rootEl);
      var $next   = q('[data-voice-next]', rootEl);

      var $imgL2 = q('[data-voice-img="left2"]', rootEl);
      var $imgL  = q('[data-voice-img="left"]', rootEl);
      var $imgM  = q('[data-voice-img="main"]', rootEl);
      var $imgR  = q('[data-voice-img="right"]', rootEl);
      var $imgR2 = q('[data-voice-img="right2"]', rootEl);

      var $dotsWrap = q('[data-voice-dots]', rootEl);

      if(!$stage || !$imgL || !$imgM || !$imgR || !$imgL2 || !$imgR2) return;

      try{ $stage.style.touchAction = "pan-y"; }catch(_e){}

      var VOICES = [
        { img:"assets/senior1.png",
          text:'同期と『最初の職場がここで良かったね』とよく話すくらい、毎日“いいじゃん”と思える瞬間があります。',
          meta:"勤続1年目",
          ribbon:"大宮共立病院 介護チーム一同、<br>あなたと一緒に働ける日を心待ちにしています。"
        },
        { img:"assets/senior2.png",
          text:"患者さんの笑顔に、私の方が元気をもらっています！仲間が一緒に成長できる感覚が一番のやりがいです。",
          meta:"勤続1年目",
          ribbon:"大宮共立病院 介護チーム一同、<br>あなたと一緒に働ける日を心待ちにしています。"
        },
        { img:"assets/senior3.png",
          text:"男性の強みも活かせる職場です。教育制度で目標が明確なので、成長の実感があります。",
          meta:"勤続2年目",
          ribbon:"大宮共立病院 介護チーム一同、<br>あなたと一緒に働ける日を心待ちにしています。"
        },
        { img:"assets/senior4.png",
          text:"相談しやすい環境のおかげで、無理なく続けられています。できることが増えて、成長を実感しています。",
          meta:"勤続4年目",
          ribbon:"大宮共立病院 介護チーム一同、<br>あなたと一緒に働ける日を心待ちにしています。"
        },
        { img:"assets/senior5.png",
          text:"後輩を育てる立場になりました。仲間と一緒に成長できる空気が、この職場の良さです。",
          meta:"勤続6年目",
          ribbon:"大宮共立病院 介護チーム一同、<br>あなたと一緒に働ける日を心待ちにしています。"
        },
        { img:"assets/senior6.png",
          text:"新人さんには、無理せず長く続けてほしいです。やりがいも生活も、大切にできる職場だと思います。",
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
        qa(".voiceDot", $dotsWrap).forEach(function(dot, k){
          dot.classList.toggle("is-active", k===i);
        });
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
        e.stopPropagation();
      }

      function stopClickEvt(e){
        e.preventDefault();
        e.stopPropagation();
      }

      [$prev, $next].forEach(function(btn){
        if(!btn) return;
        btn.addEventListener("pointerdown", stopEvt);
        btn.addEventListener("touchstart", stopEvt, {passive:true});
        btn.addEventListener("click", stopClickEvt);
      });

      function normalizeDrag(){
        var g = baseGap();
        if(!g) return;
        dragX = ((dragX % g) + g) % g;
        if(dragX > g/2) dragX -= g;
      }

      function clickPrev(e){
        if(e){
          e.preventDefault();
          e.stopPropagation();
        }
        if(isLocked) return;
        normalizeDrag();
        commitAnimated(-1, dragX);
      }

      function clickNext(e){
        if(e){
          e.preventDefault();
          e.stopPropagation();
        }
        if(isLocked) return;
        normalizeDrag();
        commitAnimated(1, dragX);
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

      function pointFromEvent(e){
        return (e.touches && e.touches[0]) ? e.touches[0] : e;
      }

      function onDown(e){
        if(isLocked) return;

        var target = e.target;
        if(target && target.closest('[data-voice-prev], [data-voice-next], [data-voice-dots], .voiceDot, a')){
          return;
        }

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
    })();


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
        var imgs = qa("img.dataDigitImg", holder);
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

        var imgs = qa("img.dataDigitImg", holder);
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
        qa(".dataDigits[data-count-to]", sec).forEach(function(holder, i){
          if(holder.dataset.countDone === "1") return;

          var target = parseInt(holder.getAttribute("data-count-to"), 10);
          if(!isFinite(target)) return;

          var duration = 900 + i * 160;

          renderNumber(holder, 1);
          animateCount(holder, target, duration);
        });
      }

      var sec = rq("#Data");
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
    })();
  });
})();


(function(){
  if (window.__AIDMA_FORM_ROUTER__) return;
  window.__AIDMA_FORM_ROUTER__ = true;

  var ROOT_ID = "lp-omiya-kaigo";
  var FORM_HASHES = ["#ActionForm", "#form", "#join", "#joinus"];

  function getRoot(){
    return document.getElementById(ROOT_ID);
  }

  function q(sel, scope){
    return (scope || document).querySelector(sel);
  }

  function isFormHash(h){
    h = (h || location.hash || "").trim();
    return FORM_HASHES.indexOf(h) !== -1;
  }

  function showForm(){
    var r = getRoot();
    if(!r) return;
    document.body.classList.add("is-form");
    requestAnimationFrame(function(){
      try{
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }catch(e){
        window.scrollTo(0, 0);
      }
    });
  }

  function showLP(){
    var r = getRoot();
    if(!r) return;
    document.body.classList.remove("is-form");
  }

  function getHeaderH(){
    var headerH = 72;
    try{
      var r = getRoot();
      if(r){
        var v = getComputedStyle(r).getPropertyValue("--header-h");
        var n = parseFloat(v);
        if(!isNaN(n)) headerH = n;
      }
    }catch(e){}
    return headerH;
  }

  function scrollToHash(hash){
    var r = getRoot();
    if(!r || !hash || hash === "#") return;

    var id = hash.slice(1);
    var el = q("#" + CSS.escape(id), r);
    if(!el) return;

    var top = el.getBoundingClientRect().top + window.pageYOffset - getHeaderH();
    try{
      window.scrollTo({ top: top, behavior: "smooth" });
    }catch(e){
      window.scrollTo(0, top);
    }
  }

  function route(){
    var r = getRoot();
    if(!r) return;

    var h = (location.hash || "#Top").trim();

    if (isFormHash(h)){
      showForm();
      return;
    }

    if (document.body.classList.contains("is-form") && /^#step[1-3]$/.test(h)){
      requestAnimationFrame(function(){ scrollToHash(h); });
      return;
    }

    showLP();

    requestAnimationFrame(function(){
      if (!h || h === "#") h = "#Top";
      if (h && h !== "#ActionForm") scrollToHash(h);
    });
  }

  document.addEventListener("click", function(e){
    var r = getRoot();
    if(!r) return;

    var a = e.target.closest && e.target.closest("a[href]");
    if(!a || !r.contains(a)) return;

    var href = (a.getAttribute("href") || "").trim();
    if(href.indexOf("#") !== 0) return;

    if(isFormHash(href)){
      e.preventDefault();
      history.pushState(null, "", href);
      route();
      return;
    }

    if(/^#step[1-3]$/.test(href)){
      if(document.body.classList.contains("is-form")){
        e.preventDefault();
        history.pushState(null, "", href);
        route();
      }
      return;
    }

    if(document.body.classList.contains("is-form")){
      e.preventDefault();
      history.pushState(null, "", href);
      route();
    }
  }, true);

  document.addEventListener("click", function(e){
    var r = getRoot();
    if(!r) return;

    var btn = e.target.closest && e.target.closest("[data-close-form]");
    if(!btn || !r.contains(btn)) return;

    e.preventDefault();
    history.pushState(null, "", "#Action");
    route();
  });

  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", route, { once:true });
  }else{
    route();
  }
})();
