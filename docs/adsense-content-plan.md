# 애드센스 대비 본문 보강 계획 (2026-09-13 수립)

목표: "입력창 + 결과창"만 있는 페이지가 하나도 남지 않게. 계산기 설명 본문 1,500자 이상, 가이드 2,500자 이상(공백 제외, `<main>` 내 설명 영역 기준).
하루 3~4페이지씩. 완료한 항목은 `[x]`로 바꾸고 완료일을 적는다.

## 공통 기준 (모든 페이지)

- 계산식과 근거: 어떤 법령·고시·요율표를 쓰는지 출처 명시 (예: 소득세법 제55조, 고용노동부 고시, 은행연합회 공시)
- 숫자를 넣은 예시 2개 이상: 서로 다른 조건으로, 결과는 python3로 직접 계산해 검증한 값만 사용
- "자주 틀리는 지점" 섹션: 실제 명세서·상품과 결과가 다른 이유, 흔한 오해
- 관련 계산기·가이드 링크 3개 이상 (본문 안 자연스러운 위치 + 관련 링크 박스)
- 기존 FAQ는 유지·보강. 표는 `<table>` 사용. 과장·수익보장 표현 금지, 면책 notice 유지
- 시의성 수치는 웹 검색으로 재확인하고 기준일 갱신. 실명·GitHub 계정 금지
- notice의 원래 기준일은 유지하고 "(본문 갱신 YYYY-MM-DD)"만 덧붙임. 가이드는 article-meta 날짜와 JSON-LD datePublished를 절대 바꾸지 않고 dateModified만 갱신 (게시일이 한 날짜로 몰리면 안 됨)
- 섹션 구성은 1~3일차 결과를 따름: 기존 본문 유지 → "계산식과 근거"(법령 조문·고시·공시명) → "계산 예시"(h3 + 표, 계산기는 div.table-scroll>table.data-table, 강조 셀은 td.net) → "자주 틀리는 지점"(6~8개) → 기존 용어정리·FAQ(+1개 추가) → notice. 관련 링크는 본문 문장 안에 자연스럽게. 완성 분량은 3,000자 안팎
- FAQ를 추가하면 `python3 scripts/check_content.py --sync-faq <파일>`로 FAQPage JSON-LD 재생성, 검증은 `python3 scripts/check_content.py <파일들>`
- 완료 표시 형식: `[x] 파일명 (→ N자, YYYY-MM-DD Dn 완료)` 형태로 체크, sitemap.xml 해당 URL lastmod 갱신

## 계산기 (설명 본문 ≥ 1,500자)

- [x] savings.html (→ 3,012자, 2026-09-13 D1 완료)
- [x] deposit.html (→ 2,999자, 2026-09-13 D1 완료)
- [x] loan.html (→ 3,218자, 2026-09-13 D1 완료)
- [x] salary.html (→ 4,219자, 2026-09-13 D1 완료)
- [x] severance.html (→ 3,182자, 2026-09-13 D2 완료)
- [x] goal.html (→ 3,089자, 2026-09-13 D2 완료)
- [x] annual-leave.html (→ 3,352자, 2026-09-13 D2 완료)
- [x] insurance.html (→ 4,033자, 2026-09-13 D2 완료)
- [x] unemployment.html (→ 3,422자, 2026-09-13 D3 완료)
- [x] hourly.html (→ 3,606자, 2026-09-13 D3 완료)

## 가이드 (본문 ≥ 2,500자)

- [x] guide-deposit-protection.html (→ 3,087자, 2026-09-13 D3 완료)
- [x] guide-severance-tax.html (→ 3,267자, 2026-09-14 D4 완료)
- [x] guide-loan-repayment.html (→ 3,251자, 2026-09-14 D4 완료)
- [x] guide-interest-tax.html (→ 3,098자, 2026-09-14 D4 완료)
- [x] guide-savings-vs-deposit.html (→ 3,100자, 2026-09-14 D4 완료)
- [ ] guide-dsr-ltv-dti.html (1,264)
- [ ] guide-year-end-tax.html (1,337)
- [ ] guide-pension-reform-2026.html (1,349)
- [ ] guide-salary-tax.html (1,365)
- [ ] guide-first-salary.html (1,389)
- [ ] guide-insurance-rates-2026.html (1,394)
- [ ] guide-pension-savings-irp.html (1,827)
- [ ] guide-prepayment-strategy.html (2,174 → 2,500 맞추기)

## 기타

- [x] about.html (→ 1,603자, 2026-09-13 D3 완료)

## 이미 기준 충족 (손대지 않음)

guide-isa-account, guide-youth-future-savings, guide-housing-subscription, guide-jeonse-vs-wolse, salary-table
