(() => {
  const ROOT_ID = "lp-omiya-kaigo";
  const STORE_KEY = "joinus_step1_v1";

  const root = document.getElementById(ROOT_ID);
  if (!root) return;

  const formRoot = root.querySelector('[data-joinus-root="1"]');
  if (!formRoot) return;

  const $ = (id) => formRoot.querySelector(`#${CSS.escape(id)}`);
  const $$ = (sel, scope) => Array.from((scope || formRoot).querySelectorAll(sel));

  const panes = {
    1: $("step1"),
    2: $("step2"),
    3: $("step3")
  };

  const stepLinks = $$("[data-step-link]");
  const stepIcons = {
    1: formRoot.querySelector('[data-step-icon="1"]'),
    2: formRoot.querySelector('[data-step-icon="2"]'),
    3: formRoot.querySelector('[data-step-icon="3"]')
  };

  const form = formRoot.querySelector('[data-join-form="1"]') || $("joinForm");
  const errBox = $("formError");

  const noData = $("noData");
  const confirmBody = $("confirmBody");
  const btnBack = $("btnBack");
  const btnSend = $("btnSend");
  const btnTop  = $("btnTop");

  const load = () => {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
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

  const safeText = (v) => {
    return (v == null || String(v).trim() === "") ? "—" : String(v);
  };

  const scrollTopNow = () => {
    try {
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  const setHash = (stepNum) => {
    const hash = `#step${stepNum}`;
    if (location.hash === hash) return;
    try {
      history.replaceState(null, "", hash);
    } catch {
      location.hash = `step${stepNum}`;
    }
  };

  const setActiveStepUI = (n) => {
    stepLinks.forEach((a) => {
      const key = Number(a.getAttribute("data-step-link"));
      const on = key === n;

      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "step");
      else a.removeAttribute("aria-current");

      a.setAttribute("aria-disabled", "true");
    });

    [1,2,3].forEach((k) => {
      if (!stepIcons[k]) return;
      stepIcons[k].src = (k === n)
        ? "assets/Thumbs-up_green.svg"
        : "assets/Thumbs-up_def.svg";
    });
  };

  const showStep = (n) => {
    [1,2,3].forEach((k) => {
      if (panes[k]) panes[k].classList.toggle("is-show", k === n);
    });
    setActiveStepUI(n);
    scrollTopNow();
    setHash(n);
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

    if (form.elements.name)  form.elements.name.value  = data.name  || "";
    if (form.elements.email) form.elements.email.value = data.email || "";
    if (form.elements.tel)   form.elements.tel.value   = data.tel   || "";
    if (form.elements.date1) form.elements.date1.value = data.date1 || "";
    if (form.elements.date2) form.elements.date2.value = data.date2 || "";
    if (form.elements.date3) form.elements.date3.value = data.date3 || "";
    if (form.elements.note)  form.elements.note.value  = data.note  || "";

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
      name:  (fd.get("name")  || "").toString().trim(),
      kind:  (fd.get("kind")  || "").toString(),
      email: (fd.get("email") || "").toString().trim(),
      tel:   (fd.get("tel")   || "").toString().trim(),
      date1: (fd.get("date1") || "").toString(),
      time1: (fd.get("time1") || "").toString(),
      date2: (fd.get("date2") || "").toString(),
      time2: (fd.get("time2") || "").toString(),
      date3: (fd.get("date3") || "").toString(),
      time3: (fd.get("time3") || "").toString(),
      note:  (fd.get("note")  || "").toString().trim()
    };
  };

  const renderConfirm = (d) => {
    const vName  = $("v_name");
    const vKind  = $("v_kind");
    const vEmail = $("v_email");
    const vTel   = $("v_tel");
    const vDate1 = $("v_date1");
    const vTime1 = $("v_time1");
    const vDate2 = $("v_date2");
    const vTime2 = $("v_time2");
    const vDate3 = $("v_date3");
    const vTime3 = $("v_time3");
    const vNote  = $("v_note");

    if (vName)  vName.textContent  = safeText(d.name);
    if (vKind)  vKind.textContent  = safeText(kindLabel(d.kind));
    if (vEmail) vEmail.textContent = safeText(d.email);
    if (vTel)   vTel.textContent   = safeText(d.tel);

    if (vDate1) vDate1.textContent = safeText(fmtDate(d.date1));
    if (vTime1) vTime1.textContent = safeText(timeLabel(d.time1));

    if (vDate2) vDate2.textContent = safeText(fmtDate(d.date2));
    if (vTime2) vTime2.textContent = safeText(timeLabel(d.time2));

    if (vDate3) vDate3.textContent = safeText(fmtDate(d.date3));
    if (vTime3) vTime3.textContent = safeText(timeLabel(d.time3));

    if (vNote)  vNote.textContent  = safeText(d.note);
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

  const initial = load();
  fillForm(initial);

  const hash = (location.hash || "").replace("#", "");
  const reqStep = hash === "step2" ? 2 : hash === "step3" ? 3 : 1;

  if ((reqStep === 2 || reqStep === 3) && !initial) {
    showStep(1);
  } else {
    showStep(reqStep);
    if (reqStep === 2 && initial) ensureStep2();
  }

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

      if (errBox) {
        errBox.style.display = "none";
        errBox.textContent = "";
      }

      save(data);
      ensureStep2();
      showStep(2);
    });
  }

  if (btnBack) {
    btnBack.addEventListener("click", () => {
      showStep(1);
    });
  }

  if (btnSend) {
    btnSend.addEventListener("click", () => {
      const d = load();
      if (!d) {
        alert("入力内容が見つかりません。STEP1から入力してください。");
        showStep(1);
        return;
      }

      // TODO: ここに実送信(fetch)を実装
      // sessionStorage.removeItem(STORE_KEY);
      showStep(3);
    });
  }

  if (btnTop) {
    btnTop.addEventListener("click", () => {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        window.scrollTo(0, 0);
      }
    });
  }
})();