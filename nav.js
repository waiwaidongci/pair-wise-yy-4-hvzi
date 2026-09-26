/* 页面连接统一维护处：增删页面只改这一处 */
const NAV_LINKS = [
  { href: "index.html", label: "点位地图" },
  { href: "loans.html", label: "借展排期" },
  { href: "archive.html", label: "排期档案" },
  { href: "rules.html", label: "借展规则" }
];
(function mountNav() {
  const box = document.getElementById("siteNav");
  if (!box) return;
  const current = location.pathname.split("/").pop() || "index.html";
  box.className = "sitenav";
  box.innerHTML = NAV_LINKS.map(p =>
    `<a class="navlink${p.href === current ? " active" : ""}" href="${p.href}">${p.label}</a>`
  ).join("");
})();
