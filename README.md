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
├── savings.html      # 적금 만기 계산기
├── deposit.html      # 예금 이자 계산기
├── loan.html         # 대출 상환 계산기
├── severance.html    # 퇴직금 계산기
├── hourly.html       # 시급 계산기 (주휴수당·최저임금)
├── goal.html         # 목표 저축 역산기
├── guides.html       # 금융 가이드 목록
├── guide-*.html      # 가이드 글 11편 (4대보험/세금/저축/대출/퇴직/재테크)
├── about.html        # 소개
├── privacy.html      # 개인정보처리방침
├── 404.html          # 404 (스타일 인라인)
├── ads.txt           # 애드센스 발급 후 pub ID 교체
├── sitemap.xml
├── robots.txt
├── .nojekyll
└── assets/
    ├── style.css     # 공용 스타일 (모바일 우선)
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

갱신 체크 시점:
- 매년 1월: 국민연금 보험료율 (연금개혁으로 2033년까지 매년 0.5%p 인상 예정), 건강보험·장기요양·고용보험 요율, 소득세법 개정 여부
- 매년 7월: 국민연금 기준소득월액 상·하한
- 갱신 후 각 계산기 페이지 하단 `notice`의 기준일 문구와 `rates.js`의 `baseDate`도 함께 수정

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
