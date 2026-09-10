# 얼마받지 (moneytools)

한국어 금융 계산기 정적 사이트. GitHub Pages 프로젝트 사이트로 배포됩니다.

- 배포 주소: https://money-tools.org/ (GitHub Pages + 커스텀 도메인)
- 문의 이메일: contact@money-tools.org
- 빌드 도구 없음: 순수 HTML + CSS + 바닐라 JS (`main` 푸시 시 자동 배포)
- Jekyll 처리 방지를 위해 루트에 `.nojekyll` 포함

## 배포 설정 (최초 1회)

GitHub Pages 사이트 생성은 리포 관리자만 할 수 있어 최초 1회 수동 설정이 필요합니다.
리포 **Settings → Pages → Build and deployment → Source**에서 둘 중 하나를 선택:

1. **GitHub Actions** (권장): 포함된 `.github/workflows/pages.yml`이 `main` 푸시마다 자동 배포합니다.
2. **Deploy from a branch** (`main` / root): GitHub 기본 "pages build and deployment" 워크플로가 배포합니다.
   이 방식을 쓰면 `.github/workflows/pages.yml`은 삭제하세요 (두 방식이 충돌합니다).

## 구조

```
/
├── index.html        # 홈 (히어로 + 계산기 카드 + 인기 가이드)
├── salary.html       # 연봉 실수령액 계산기
├── salary-table.html # 2026 연봉 실수령액 표 (정적 표, 계산식은 calc.js와 동일)
├── insurance.html    # 4대보험 계산기 (근로자·사업주 부담)
├── unemployment.html # 실업급여(구직급여) 계산기
├── annual-leave.html # 연차 계산기 (발생 일수·연차수당)
├── savings.html      # 적금 만기 계산기
├── deposit.html      # 예금 이자 계산기
├── loan.html         # 대출 상환 계산기
├── severance.html    # 퇴직금 계산기
├── hourly.html       # 시급 계산기 (주휴수당·최저임금)
├── goal.html         # 목표 저축 역산기
├── guides.html       # 금융 가이드 목록
├── guide-*.html      # 가이드 글 (4대보험/세금/저축/대출/퇴직/재테크, 주 2~3회 추가)
├── about.html        # 소개
├── privacy.html      # 개인정보처리방침
├── 404.html          # 404 (스타일 인라인)
├── ads.txt           # 애드센스 발급 후 pub ID 교체
├── sitemap.xml
├── rss.xml           # 가이드 RSS 피드 (자동 생성, 직접 편집 금지)
├── robots.txt
├── .nojekyll
├── scripts/
│   └── build_rss.py  # guide-*.html → rss.xml 생성기
└── assets/
    ├── style.css     # 공용 스타일 (모바일 우선)
    ├── analytics.js  # ★ GA4 측정 ID (여기만 고치면 전체 반영, 비어 있으면 비활성)
    ├── rates.js      # ★ 요율 상수 (여기만 고치면 전체 반영)
    └── calc.js       # 모든 계산기 로직 + 공용 유틸
```

모든 내부 링크와 정적 파일 경로는 상대 경로라서 `/moneytools/` 하위 경로에서 깨지지 않습니다.

## 요율 갱신 방법

요율이 바뀌면 **`assets/rates.js` 한 파일만** 수정합니다. 각 상수 옆 주석에 출처와 기준일이 적혀 있습니다.

| 항목 | 상수 | 2026-08-30 기준값 |
|---|---|---|
| 국민연금 근로자 부담 | `RATES.pension.employeeRate` | 0.0475 (전체 9.5%) |
| 기준소득월액 상한/하한 | `RATES.pension.incomeMax` / `incomeMin` | 6,590,000 / 410,000 (매년 7월 변경) |
| 건강보험 근로자 부담 | `RATES.health.employeeRate` | 0.03595 (전체 7.19%) |
| 건강보험 전체 요율 | `RATES.health.totalRate` | 0.0719 (장기요양 환산에 사용) |
| 장기요양 (소득 대비) | `RATES.longTermCare.rateOfIncome` | 0.009448 |
| 고용보험 근로자 부담 | `RATES.employment.employeeRate` | 0.009 |
| 이자소득세 | `RATES.interestTax.total` | 0.154 |
| 소득세 세율표·공제 | `RATES.incomeTaxBrackets` 등 | 소득세법 개정 시 갱신 |
| 구직급여 상·하한액 | `RATES.unemployment.dailyMax` / `dailyMin` | 68,100 / 66,048 (매년 1월 고시) |
| 고용안정·산재 요율 | `RATES.employer` | 0.25~0.85% / 평균 1.47% |

갱신 체크 시점:
- 매년 1월: 국민연금 보험료율 (연금개혁으로 2033년까지 매년 0.5%p 인상 예정), 건강보험·장기요양·고용보험 요율, 소득세법 개정 여부
- 매년 7월: 국민연금 기준소득월액 상·하한
- 갱신 후 각 계산기 페이지 하단 `notice`의 기준일 문구와 `rates.js`의 `baseDate`도 함께 수정
- `salary-table.html`·`salary.html`의 연봉별 표와 `hourly.html`의 시급별 표는 정적 HTML이므로, 요율 변경 시 같은 산식으로 다시 생성해 교체

## 가이드 추가 시

1. `guide-*.html` 작성 (기존 가이드를 템플릿으로)
2. `guides.html` 목록 맨 앞에 항목 추가
3. `sitemap.xml`에 URL 추가
4. **`python3 scripts/build_rss.py` 실행** → `rss.xml` 자동 갱신 (직접 편집하지 말 것)

RSS는 네이버 서치어드바이저에 제출되어 새 글을 자동으로 수집하게 합니다.

## 구글 애널리틱스(GA4) 연결

1. analytics.google.com → 관리 → 속성 만들기 → 데이터 스트림 → 웹 → `https://money-tools.org`
2. 발급된 측정 ID(`G-`로 시작)를 `assets/analytics.js` 의 `GA_ID` 에 넣고 배포

```js
var GA_ID = "G-XXXXXXXXXX";
```

`GA_ID` 가 비어 있으면 스크립트를 아예 불러오지 않고 외부 요청도 보내지 않습니다.
전 페이지가 이 파일 하나를 참조하므로 HTML은 손댈 필요가 없습니다.
개인정보처리방침 4항(웹 분석 도구)에 이미 GA 관련 고지와 옵트아웃 링크가 있습니다.

## SEO 구조

- 모든 색인 페이지에 canonical, Open Graph, JSON-LD(계산기 `WebApplication`, 가이드 `Article`, FAQ `FAQPage`, `BreadcrumbList`) 포함
- 가이드 추가 시 `article-meta`의 날짜가 JSON-LD `datePublished`와 일치해야 함 (RSS의 `pubDate`도 이 날짜를 사용)
- 전 페이지 `<head>`에 RSS `alternate` 링크와 `assets/analytics.js` 포함 (404는 절대 경로)

## 애드센스 신청 절차 체크리스트

1. [ ] 사이트 배포 확인 (모든 페이지 정상 로드, 모바일 확인)
2. [ ] 구글 서치콘솔 등록: 각 페이지 head의 `google-site-verification` 주석을 실제 값으로 교체 후 주석 해제, `sitemap.xml` 제출
3. [ ] (선택) 네이버 서치어드바이저 등록: `naver-site-verification` 메타 태그 교체
4. [ ] 애드센스 계정 생성 후 사이트 추가 → 발급받은 `ca-pub-XXXXXXXXXXXXXXXX`로 각 페이지 head의 애드센스 스크립트 주석을 교체 후 주석 해제
5. [ ] 루트 `ads.txt`의 주석을 지우고 `pub-XXXXXXXXXXXXXXXX`를 실제 게시자 ID로 교체
6. [ ] 심사 통과 후 광고 단위 생성 → 각 페이지 본문의 `<!-- AD SLOT -->` 주석 위치에 광고 코드 삽입 (페이지당 2곳)
7. [ ] 개인정보처리방침(`privacy.html`)의 광고·쿠키 조항 최신 상태 유지

## 면책

모든 계산 결과는 참고용 근사치입니다. 근로소득세는 간이세액표를 단순화한 근사식이며, 실제 공제액·이자·퇴직금은 관련 기관과 금융회사의 산정에 따릅니다.
