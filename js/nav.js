/* 页面连接：唯一出处。
 * 所有页面的导航链接集中在这里；新增/改路径只需改这一处。
 * 在任何页面 <body> 顶部放 <header id="topbar"><div>...标题...</div><nav id="nav"></nav>...</header> 即可。 */
(function () {
  "use strict";

  const LINKS = [
    { href: "index.html", label: "遗物标记" },
    { href: "loan.html", label: "借展排期" },
    { href: "rules.html", label: "借展规则" }
  ];

  function mount(containerId) {
    const nav = document.getElementById(containerId || "nav");
    if (!nav) return;
    const current = location.pathname.split("/").pop() || "index.html";
    nav.innerHTML = LINKS.map(l =>
      '<a href="' + l.href + '" class="' + (l.href === current ? "active" : "") + '">' + l.label + "</a>"
    ).join("");
  }

  document.addEventListener("DOMContentLoaded", () => mount("nav"));
})();
