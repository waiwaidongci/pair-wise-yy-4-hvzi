/* 借展规则：唯一出处。
 * 保存等级、借展单位、巡展站/展柜、运输条件、撞期与启运后调整规则全部集中在此文件，
 * rules.html 的规则页也由这里渲染，页面脚本只调用这里的判断函数。 */
(function () {
  "use strict";

  // 保存等级：eligible=false 的遗物一律留在待处理，不进入排期
  const RELIC_GRADES = [
    { value: "stable", label: "稳定", eligible: true, transport: "常规运输即可" },
    { value: "fragile", label: "脆弱", eligible: true, transport: "仅限恒温恒湿运输" },
    { value: "unstable", label: "保存不稳", eligible: false, transport: "不得外借，留在待处理" }
  ];

  // 借展单位
  const BORROWERS = [
    { id: "B01", name: "国家海洋博物馆" },
    { id: "B02", name: "南海博物馆" },
    { id: "B03", name: "上海中国航海博物馆" },
    { id: "B04", name: "福建省博物院" }
  ];

  // 巡展站与展柜
  const STATIONS = [
    { id: "S1", city: "青岛", venue: "青岛海洋科技馆", cases: ["QG-A1", "QG-A2", "QG-B1"] },
    { id: "S2", city: "上海", venue: "上海中国航海博物馆", cases: ["SH-01", "SH-02"] },
    { id: "S3", city: "广州", venue: "广州海事博物馆", cases: ["GZ-临展1", "GZ-临展2", "GZ-临展3"] }
  ];

  // 运输条件：fragile 等级只允许恒温恒湿
  const TRANSPORTS = [
    { value: "standard", label: "常规运输" },
    { value: "climate", label: "恒温恒湿" },
    { value: "shockproof", label: "防震加固" }
  ];

  const RULES = {
    statuses: [
      { value: "pending", label: "待处理" },
      { value: "scheduled", label: "已排期" },
      { value: "departed", label: "已启运" },
      { value: "returned", label: "已归还" }
    ],
    pending: [
      "保存等级为「保存不稳」的遗物不得外借，提交排期时自动留在待处理。",
      "交接签字缺失的遗物，提交排期时自动留在待处理。",
      "待处理遗物补齐签字或重新定级后，可在排期页「重新检查」再次送审。"
    ],
    conflict: [
      "同一展柜的借展日期（含首尾日）相互重叠即视为相撞，不予排期。",
      "已归还的记录不再占用展柜档期。"
    ],
    afterDeparture: [
      "启运后只允许调整归还日期或展柜，借展单位、巡展站、起展日期与押运人不再改动。",
      "启运时原交接记录冻结留档，每次调整追加一条修订记录。",
      "押运人可在「押运人视图」按姓名查询当前生效的新安排。"
    ]
  };

  function gradeLabel(value) {
    const g = RELIC_GRADES.find(g => g.value === value);
    return g ? g.label : "未定级";
  }

  // 出借资格：返回 { ok, reasons[] }
  function checkEligibility(relic) {
    const reasons = [];
    if (!relic) {
      reasons.push("未选择遗物");
    } else {
      const grade = RELIC_GRADES.find(g => g.value === relic.grade);
      if (!grade) reasons.push("保存等级未定，请先在标记页定级");
      else if (!grade.eligible) reasons.push("保存等级为「" + grade.label + "」，不得外借");
      if (!relic.signed) reasons.push("交接签字缺失");
    }
    return { ok: reasons.length === 0, reasons };
  }

  // 运输条件校验：脆弱遗物必须恒温恒湿
  function checkTransport(relic, transport) {
    if (relic && relic.grade === "fragile" && transport !== "climate") {
      return { ok: false, reasons: ["脆弱遗物仅限恒温恒湿运输"] };
    }
    return { ok: true, reasons: [] };
  }

  // 撞期检测：同一展柜、日期区间（含首尾）重叠，忽略自身与已归还记录
  function overlaps(a1, a2, b1, b2) {
    return a1 <= b2 && b1 <= a2;
  }
  function findConflict(loans, candidate) {
    return loans.find(l =>
      l.id !== candidate.id &&
      l.stationId === candidate.stationId &&
      l.caseNo === candidate.caseNo &&
      l.status !== "returned" &&
      overlaps(l.start, l.end, candidate.start, candidate.end)
    ) || null;
  }

  window.LOAN_RULES = {
    RELIC_GRADES, BORROWERS, STATIONS, TRANSPORTS, RULES,
    gradeLabel, checkEligibility, checkTransport, findConflict
  };
})();
