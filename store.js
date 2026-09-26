/* 借展排期共享数据层：点位沿用 zfl30Marks，借展数据存 zfl30LoansV1 */
(function (global) {
  const MARKS_KEY = "zfl30Marks";
  const DB_KEY = "zfl30LoansV1";

  const GRADES = [
    { value: "stable", label: "稳定 · 可出展" },
    { value: "fragile", label: "脆弱 · 需减震展柜" },
    { value: "unstable", label: "不稳定 · 禁止出展" }
  ];

  function uid() {
    return (crypto.randomUUID && crypto.randomUUID()) ||
      "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function loadMarks() {
    try { return JSON.parse(localStorage.getItem(MARKS_KEY) || "[]"); }
    catch { return []; }
  }
  function saveMarks(marks) { localStorage.setItem(MARKS_KEY, JSON.stringify(marks)); }

  function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

  function seedDB(marks) {
    const byCode = {};
    marks.forEach(m => { byCode[m.code] = m; });
    const relics = {};
    if (byCode["A-017"]) relics[byCode["A-017"].id] = { accession: "藏-2024-陶-017", grade: "stable", signed: true };
    if (byCode["W-003"]) relics[byCode["W-003"].id] = { accession: "藏-2024-木-003", grade: "fragile", signed: false };
    return {
      borrowers: [
        { id: uid(), name: "宁波港口博物馆", transport: "恒温 18–22℃；相对湿度 50–55%；气囊减震包装，运输车速 ≤60km/h" },
        { id: uid(), name: "泉州海外交通史博物馆", transport: "恒温 19–23℃；相对湿度 45–60%；木构件直立固定，避免挤压" }
      ],
      stations: [
        { id: uid(), name: "宁波站", venue: "宁波港口博物馆 一号厅", cases: ["A-01", "A-02"] },
        { id: uid(), name: "泉州站", venue: "泉州海外交通史博物馆 海船厅", cases: ["B-01", "B-02"] },
        { id: uid(), name: "广州站", venue: "广州海事博物馆 巡展厅", cases: ["C-01", "C-02"] }
      ],
      loans: [],
      relics
    };
  }

  function loadDB() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(DB_KEY) || "null"); } catch { db = null; }
    if (!db) { db = seedDB(loadMarks()); saveDB(db); }
    db.relics = db.relics || {};
    db.loans = db.loans || [];
    db.borrowers = db.borrowers || [];
    db.stations = db.stations || [];
    return db;
  }

  /* 规则一：保存不稳或签字缺失（含未编号未定级）留待处理，不得排期 */
  function relicState(ext) {
    const reasons = [];
    if (!ext || !String(ext.accession || "").trim()) reasons.push("未挂馆藏号");
    if (!ext || !ext.grade) reasons.push("未定保存等级");
    else if (ext.grade === "unstable") reasons.push("保存不稳定");
    if (!ext || !ext.signed) reasons.push("缺负责人签字");
    return { ok: reasons.length === 0, reasons };
  }

  function overlaps(a, b) {
    return Boolean(a.start && a.end && b.start && b.end) && a.start <= b.end && a.end >= b.start;
  }

  /* 规则二：同一展柜日期相撞则不排（含本单各站之间互查） */
  function findConflicts(db, legs, excludeLoanId) {
    const out = [];
    legs.forEach((leg, i) => {
      legs.forEach((other, j) => {
        if (j <= i) return;
        if (leg.stationId === other.stationId && leg.caseId === other.caseId && overlaps(leg, other))
          out.push({ leg, other });
      });
      db.loans.forEach(loan => {
        if (loan.id === excludeLoanId) return;
        loan.legs.forEach(o => {
          if (o.stationId === leg.stationId && o.caseId === leg.caseId && overlaps(leg, o))
            out.push({ leg, other: o, loan });
        });
      });
    });
    return out;
  }

  function stationById(db, id) { return db.stations.find(s => s.id === id); }
  function borrowerById(db, id) { return db.borrowers.find(b => b.id === id); }
  function gradeLabel(g) { const x = GRADES.find(i => i.value === g); return x ? x.label : "未定级"; }
  function latestHandover(loan) {
    return loan.handovers && loan.handovers.length ? loan.handovers[loan.handovers.length - 1] : null;
  }
  function snapshot(loan) { return { legs: clone(loan.legs), returnDate: loan.returnDate || "" }; }

  function fmt(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  /* 调整留档时描述新旧安排差异 */
  function changesText(db, before, after) {
    const lines = [];
    (after.legs || []).forEach((leg, i) => {
      const st = stationById(db, leg.stationId);
      const old = (before.legs || []).find(o => o.stationId === leg.stationId);
      if (old && old.caseId !== leg.caseId)
        lines.push(`${st ? st.name : "巡展站"}展柜 ${old.caseId} → ${leg.caseId}`);
      if (old && old.end !== leg.end)
        lines.push(`${st ? st.name : "巡展站"}展期止日 ${old.end} → ${leg.end}`);
    });
    if ((before.returnDate || "") !== (after.returnDate || ""))
      lines.push(`归还日 ${before.returnDate || "未填"} → ${after.returnDate || "未填"}`);
    return lines;
  }

  global.ZFL = {
    MARKS_KEY, DB_KEY, GRADES,
    uid, clone, loadMarks, saveMarks, loadDB, saveDB,
    relicState, findConflicts, overlaps,
    stationById, borrowerById, gradeLabel, latestHandover, snapshot,
    fmt, changesText
  };
})(window);
