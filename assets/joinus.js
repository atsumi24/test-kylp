(() => {
  const STORE_KEY = "joinus_step1_v1";

  const $ = (id) => document.getElementById(id);

  const panes = {
    1: $("step1"),
    2: $("step2"),
    3: $("step3")
  };

  const stepLinks = Array.from(document.querySelectorAll("[data-step-link]"));
  const stepIcons = {
    1: document.querySelector('[data-step-icon="1"]'),
    2: document.querySelector('[data-step-icon="2"]'),
    3: document.querySelector('[data-step-icon="3"]')
  };

  const form = $("joinForm");
  const errBox = $("formError");

  const noData = $("noData");
  const confirmBody = $("confirmBody");
  const btnBack = $("btnBack");
  const btnSend = $("btnSend");
  const btnTop  = $("btnTop");

  const load = () => {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  };

  const save = (data) => {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(data));
  };

  const kindLabel = (v) => ({
    trial: "仕事体験",
    tour:  "見学会",
    web:   "WEB説明会"
  }[v] || (v || ""));

  const timeLabel = (v) => ({
    "10-12":"10時〜12時",
    "12-14":"12時〜14時",
    "14-16":"14時〜16時",
    any:"何時でも可"
  }[v] || (v || ""));

  const fmtDate = (iso) => {
    if (!iso) return "";
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return iso;
    return `${m[1]}/${m[2]}/${m[3]}`;
  };

  const safeText = (v) => (v == null || String(v).trim() === "") ? "—" : String(v);

  const setActiveStepUI = (n) => {
    stepLinks.forEach(a => {
      const key = Number(a.getAttribute("data-step-link"));
      const on = key === n;

      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current","step");
      else a.removeAttribute("aria-current");

      // SPAではクリック遷移させない（見た目だけ）
      a.setAttribute("aria-disabled", "true");
    });

    [1,2,3].forEach(k => {
      if (!stepIcons[k]) return;
      stepIcons[k].src = (k === n) ? "assets/Thumbs-up_green.svg" : "assets/Thumbs-up_def.svg";
    });
  };

  const showStep = (n) => {
    [1,2,3].forEach(k => panes[k]?.classList.toggle("is-show", k === n));
    setActiveStepUI(n);
    window.scrollTo({ top: 0, behavior: "auto" });
    location.hash = `step${n}`;
  };

  const validate = (d) => {
    if (!d.name)  return "お名前は必須です。";
    if (!d.kind)  return "種別は必須です。";
    if (!d.email) return "メールアドレスは必須です。";
    if (!d.tel)   return "電話番号は必須です。";
    if (!d.date1) return "希望候補日1は必須です。";
    if (!d.date2) return "希望候補日2は必須です。";
    if (!d.date3) return "希望候補日3は必須です。";
    return "";
  };

  const fillForm = (data) => {
    if (!form || !data) return;

    form.name.value  = data.name  || "";
    form.email.value = data.email || "";
    form.tel.value   = data.tel   || "";
    form.date1.value = data.date1 || "";
    form.date2.value = data.date2 || "";
    form.date3.value = data.date3 || "";
    form.note.value  = data.note  || "";

    if (data.kind) {
      const r = form.querySelector(`[name="kind"][value="${CSS.escape(data.kind)}"]`);
      if (r) r.checked = true;
    }
    ["time1","time2","time3"].forEach((k) => {
      if (data[k]) {
        const r = form.querySelector(`[name="${k}"][value="${CSS.escape(data[k])}"]`);
        if (r) r.checked = true;
      }
    });
  };

  const collectForm = () => {
    const fd = new FormData(form);
    return {
      name: (fd.get("name")  || "").toString().trim(),
      kind: (fd.get("kind")  || "").toString(),
      email:(fd.get("email") || "").toString().trim(),
      tel:  (fd.get("tel")   || "").toString().trim(),
      date1:(fd.get("date1") || "").toString(),
      time1:(fd.get("time1") || "").toString(),
      date2:(fd.get("date2") || "").toString(),
      time2:(fd.get("time2") || "").toString(),
      date3:(fd.get("date3") || "").toString(),
      time3:(fd.get("time3") || "").toString(),
      note: (fd.get("note")  || "").toString().trim()
    };
  };

  const renderConfirm = (d) => {
    $("v_name").textContent  = safeText(d.name);
    $("v_kind").textContent  = safeText(kindLabel(d.kind));
    $("v_email").textContent = safeText(d.email);
    $("v_tel").textContent   = safeText(d.tel);

    $("v_date1").textContent = safeText(fmtDate(d.date1));
    $("v_time1").textContent = safeText(timeLabel(d.time1));

    $("v_date2").textContent = safeText(fmtDate(d.date2));
    $("v_time2").textContent = safeText(timeLabel(d.time2));

    $("v_date3").textContent = safeText(fmtDate(d.date3));
    $("v_time3").textContent = safeText(timeLabel(d.time3));

    $("v_note").textContent  = safeText(d.note);
  };

  const ensureStep2 = () => {
    const data = load();
    if (!data) {
      if (noData) noData.style.display = "block";
      if (confirmBody) confirmBody.style.display = "none";
      if (btnSend) btnSend.disabled = true;
      showStep(1);
      return null;
    }
    if (noData) noData.style.display = "none";
    if (confirmBody) confirmBody.style.display = "block";
    if (btnSend) btnSend.disabled = false;
    renderConfirm(data);
    return data;
  };

  // ===== init =====
  const initial = load();
  fillForm(initial);

  const hash = (location.hash || "").replace("#","");
  const reqStep = hash === "step2" ? 2 : hash === "step3" ? 3 : 1;

  if ((reqStep === 2 || reqStep === 3) && !initial) {
    showStep(1);
  } else {
    showStep(reqStep);
    if (reqStep === 2 && initial) ensureStep2();
  }

  // STEP1 submit -> save -> STEP2
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const data = collectForm();
      const msg = validate(data);

      if (msg) {
        if (errBox) {
          errBox.style.display = "block";
          errBox.textContent = msg;
          errBox.scrollIntoView({ behavior:"smooth", block:"center" });
        }
        return;
      }

      if (errBox) errBox.style.display = "none";
      save(data);

      ensureStep2();
      showStep(2);
    });
  }

  // STEP2 back
  if (btnBack) btnBack.addEventListener("click", () => showStep(1));

  // STEP2 send -> STEP3（デモ）
  if (btnSend) {
    btnSend.addEventListener("click", () => {
      const d = load();
      if (!d) {
        alert("入力内容が見つかりません。STEP1から入力してください。");
        showStep(1);
        return;
      }

      // TODO: ここに実送信(fetch)を実装
      // sessionStorage.removeItem(STORE_KEY); // 送信後に消すなら有効化
      showStep(3);
    });
  }

  // STEP3 top
  if (btnTop) btnTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
})();