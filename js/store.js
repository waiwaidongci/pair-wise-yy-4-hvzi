/* 排期档案：唯一存放处。
 * 点位数据（沿用原 zfl30Marks）与借展排期（zfl30Loans）都保存在 localStorage，
 * 其他页面只通过这里的函数读写，不直接碰 localStorage。 */
(function () {
  "use strict";

  const MARKS_KEY = "zfl30Marks";
  const LOANS_KEY = "zfl30Loans";

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); }
    catch { return []; }
  }
  function write(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function uuid() {
    return crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  // ---- 点位（遗物）----
  function getMarks() { return read(MARKS_KEY); }
  function saveMarks(marks) { write(MARKS_KEY, marks); }

  // ---- 借展排期 ----
  function getLoans() { return read(LOANS_KEY); }
  function saveLoans(loans) { write(LOANS_KEY, loans); }
  function addLoan(loan) {
    const loans = getLoans();
    loan.id = loan.id || uuid();
    loans.push(loan);
    saveLoans(loans);
    return loan;
  }
  function patchLoan(id, patch) {
    const loans = getLoans();
    const loan = loans.find(l => l.id === id);
    if (loan) {
      Object.assign(loan, patch);
      saveLoans(loans);
    }
    return loan;
  }
  function removeLoan(id) {
    saveLoans(getLoans().filter(l => l.id !== id));
  }

  // 首次使用时的示例数据（仅在没有任何档案时生成）
  function seed() {
    if (read(MARKS_KEY).length === 0) {
      const marks = [
        { id: uuid(), code: "A-017", accession: "SW-2026-0017", type: "ceramic", grade: "stable", signed: true, dive: "DIVE-01", x: 42, y: 46, depth: "17.8m", orientation: "东", condition: "边缘残缺", note: "靠近船肋" },
        { id: uuid(), code: "W-003", accession: "SW-2026-0003", type: "wood", grade: "unstable", signed: true, dive: "DIVE-02", x: 58, y: 39, depth: "18.2m", orientation: "西北", condition: "出水后开裂", note: "疑似横梁，保存不稳" },
        { id: uuid(), code: "M-012", accession: "", type: "metal", grade: "fragile", signed: false, dive: "DIVE-03", x: 33, y: 61, depth: "19.1m", orientation: "南", condition: "铜锈活跃", note: "交接单未签字" }
      ];
      saveMarks(marks);

      const loans = [];
      const sample = marks.find(m => m.grade === "stable" && m.signed);
      if (sample) {
        loans.push({
          id: uuid(),
          markId: sample.id,
          accession: sample.accession,
          borrowerId: "B01",
          stationId: "S2",
          caseNo: "SH-01",
          start: "2026-10-01",
          end: "2026-10-20",
          transport: "standard",
          escort: "周海澜",
          status: "scheduled",
          handover: null,
          revisions: [],
          createdAt: new Date().toISOString()
        });
      }
      saveLoans(loans);
    }
  }

  window.STORE = { getMarks, saveMarks, getLoans, saveLoans, addLoan, patchLoan, removeLoan, seed };
})();
