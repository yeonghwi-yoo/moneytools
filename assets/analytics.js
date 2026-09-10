/*
 * 얼마받지 방문 분석 (Google Analytics 4)
 * ─────────────────────────────────────────────────────────────
 * 측정 ID를 아래 GA_ID 에 넣으면 전 페이지에 한 번에 적용됩니다.
 *   예) var GA_ID = "G-XXXXXXXXXX";
 *
 * 비어 있거나 형식이 맞지 않으면 아무 스크립트도 불러오지 않고
 * 외부로 요청도 보내지 않습니다. (지금 상태)
 *
 * 측정 ID 발급: analytics.google.com → 관리 → 속성 만들기 →
 *               데이터 스트림 → 웹 → https://money-tools.org
 * ─────────────────────────────────────────────────────────────
 */
(function () {
  "use strict";

  var GA_ID = "G-GMDKK7X8ER";   // ← 여기만 바꾸면 됩니다

  if (!/^G-[A-Z0-9]{6,}$/.test(GA_ID)) return;

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID);
})();
