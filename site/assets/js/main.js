/* 双城记 · 交互脚本 v2 (vanilla, 无依赖) */
(function () {
  "use strict";
  var doc = document;
  var win = window;
  var prefersReduced = win.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 导航滚动状态 + 滚动进度条 ---------- */
  var nav = doc.querySelector(".nav");
  var progress = doc.querySelector(".scroll-progress");
  var ticking = false;

  function onScroll() {
    var y = win.scrollY || doc.documentElement.scrollTop;
    if (nav) nav.classList.toggle("is-scrolled", y > 8);
    if (progress) {
      var h = doc.documentElement.scrollHeight - win.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
    ticking = false;
  }
  win.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; win.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- 2. 移动端导航 ---------- */
  var burger = doc.querySelector(".nav__burger");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", nav.classList.contains("is-open"));
    });
    doc.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target)) {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- 3. 入场动画 (IntersectionObserver) ---------- */
  var revealEls = doc.querySelectorAll(".reveal");
  if (!prefersReduced && "IntersectionObserver" in win && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- 4. 图片加载系统 (blur-up + 滤镜 + 渐变) ---------- */
  // 4a. blur-up 加载过渡: 所有图片容器自动增强
  doc.querySelectorAll(".blur-up img, .img-zoom img, .route-card .rc-img img, .play-card .pc-img img, .city-card img, .scenery-card img, .city-hero-banner img").forEach(function (img) {
    var wrap = img.closest(".blur-up") || img.closest(".img-zoom") || img.closest(".rc-img") || img.closest(".pc-img");
    if (wrap) wrap.classList.add("is-shimmer");
    function loaded() {
      img.classList.add("is-loaded");
      if (wrap) {
        wrap.classList.remove("is-shimmer");
        img.classList.add("is-loaded");
      }
    }
    if (img.complete && img.naturalWidth > 0) { loaded(); }
    else { img.addEventListener("load", loaded, { once: true }); }
    // 加载失败兜底: 保留柔和底色
    img.addEventListener("error", function () {
      if (wrap) wrap.classList.remove("is-shimmer");
    }, { once: true });
  });

  // 4b. 社交滤镜: 图片容器加 social-img 类自动应用暖色滤镜
  doc.querySelectorAll(".city-card img, .route-card .rc-img img, .play-card .pc-img img, .img-zoom img, .scenery-card img").forEach(function (img) {
    img.classList.add("social-img");
  });

  // 4c. 渐变叠加层: 内容图片容器加 img-grad
  doc.querySelectorAll(".city-card, .scenery-card, .city-hero-banner, .img-zoom[style*='border-radius']").forEach(function (el) {
    el.classList.add("img-grad");
  });

  /* ---------- 5. FAQ 折叠 ---------- */
  doc.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    if (!q) return;
    q.addEventListener("click", function () {
      var wasOpen = item.classList.contains("is-open");
      item.parentElement.querySelectorAll(".faq-item.is-open").forEach(function (o) {
        o.classList.remove("is-open");
        o.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("is-open");
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- 6. 资料卡筛选 ---------- */
  var filterBar = doc.querySelector("[data-filterbar]");
  if (filterBar) {
    var cards = Array.prototype.slice.call(doc.querySelectorAll("[data-people-card]"));
    var chips = Array.prototype.slice.call(filterBar.querySelectorAll(".filter-chip"));
    var empty = doc.getElementById("people-empty");
    var countLabel = doc.getElementById("people-count");

    function activeFilters() {
      var f = {};
      chips.forEach(function (c) {
        if (c.classList.contains("is-on")) {
          var key = c.getAttribute("data-filter");
          var val = c.getAttribute("data-value");
          (f[key] = f[key] || []).push(val);
        }
      });
      return f;
    }

    function apply() {
      var f = activeFilters();
      var visible = 0;
      cards.forEach(function (card) {
        var data = card.dataset;
        var ok = true;
        Object.keys(f).forEach(function (key) {
          if (!ok) return;
          var vals = f[key];
          var cardVal = (data[key] || "").split(",");
          if (!vals.some(function (v) { return cardVal.indexOf(v) > -1; })) ok = false;
        });
        card.style.display = ok ? "" : "none";
        if (ok) visible++;
      });
      if (countLabel) countLabel.textContent = "共 " + visible + " 位";
      if (empty) empty.style.display = visible ? "none" : "";
    }

    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        c.classList.toggle("is-on");
        apply();
      });
    });
    apply();
  }

  /* ---------- 7. 城市 Tab ---------- */
  var cityTabs = doc.querySelectorAll("[data-city-tab]");
  var cityPanels = doc.querySelectorAll("[data-city-panel]");
  if (cityTabs.length) {
    cityTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var key = tab.getAttribute("data-city-tab");
        cityTabs.forEach(function (t) {
          t.classList.toggle("is-on", t === tab);
          t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        cityPanels.forEach(function (p) {
          var show = p.getAttribute("data-city-panel") === key;
          p.style.display = show ? "" : "none";
          if (show) {
            p.querySelectorAll(".reveal").forEach(function (el, i) {
              el.classList.add("is-in");
              el.style.transitionDelay = (i % 6 * 0.06) + "s";
            });
          }
        });
      });
    });
  }

  /* ---------- 8. Chip 多选 ---------- */
  doc.querySelectorAll(".chip-group").forEach(function (group) {
    group.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      chip.classList.toggle("is-on");
      var input = chip.querySelector("input");
      if (input) input.checked = chip.classList.contains("is-on");
    });
  });

  /* ---------- 9. 需求表单提交 → match.html ---------- */
  var demandForm = doc.getElementById("demand-form");
  if (demandForm) {
    demandForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var required = demandForm.querySelectorAll("[required]");
      var firstBad = null;
      required.forEach(function (el) {
        var field = el.closest(".field");
        var bad = !el.value.trim();
        if (field) field.classList.toggle("is-error", bad);
        if (bad && !firstBad) firstBad = field || el;
      });
      if (firstBad) {
        firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      var want = demandForm.querySelector('[name="want"]:checked');
      var wantVal = want ? want.value : "找搭子";
      var params = new URLSearchParams();
      params.set("want", wantVal);
      var loc = demandForm.querySelector('[name="location"]');
      if (loc && loc.value) params.set("city", loc.value);
      location.href = "match.html?" + params.toString();
    });
  }

  /* ---------- 10. 报名表单 ---------- */
  var joinForm = doc.getElementById("join-form");
  if (joinForm) {
    joinForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var required = joinForm.querySelectorAll("[required]");
      var firstBad = null;
      required.forEach(function (el) {
        var field = el.closest(".field");
        var bad = !el.value.trim();
        if (field) field.classList.toggle("is-error", bad);
        if (bad && !firstBad) firstBad = field || el;
      });
      if (firstBad) {
        firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      var formWrap = joinForm.closest(".form-card");
      var success = doc.getElementById("join-success");
      if (success && formWrap) {
        formWrap.style.display = "none";
        success.style.display = "";
        success.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  /* ---------- 11. 约局弹窗 ---------- */
  doc.querySelectorAll("[data-join-pop]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var name = btn.getAttribute("data-join-pop") || "对方";
      var target = doc.getElementById("join-pop");
      if (target) {
        var nameEl = target.querySelector("[data-pop-name]");
        if (nameEl) nameEl.textContent = name;
        target.showModal ? target.showModal() : target.setAttribute("open", "");
      }
    });
  });
  var popClose = doc.getElementById("join-pop-close");
  var popDialog = doc.getElementById("join-pop");
  if (popClose && popDialog) {
    popClose.addEventListener("click", function () {
      popDialog.close ? popDialog.close() : popDialog.removeAttribute("open");
    });
    popDialog.addEventListener("click", function (e) {
      if (e.target === popDialog) popDialog.close ? popDialog.close() : popDialog.removeAttribute("open");
    });
  }

  /* ---------- 12. 卡片 spotlight 光晕跟随鼠标 ---------- */
  if (!prefersReduced) {
    doc.querySelectorAll(".spotlight").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- 13. 磁吸按钮 (轻微) ---------- */
  if (!prefersReduced && win.matchMedia("(pointer: fine)").matches) {
    doc.querySelectorAll(".magnetic").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / r.width;
        var dy = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = "translate(" + (dx * 6) + "px," + (dy * 6) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ---------- 14. 年份 ---------- */
  doc.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
