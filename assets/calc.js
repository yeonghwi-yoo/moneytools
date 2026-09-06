/* 머니툴즈 공용 계산 스크립트 — rates.js 를 먼저 로드해야 합니다. */
(function () {
  "use strict";

  // ── 공용 유틸 ──
  function won(n) {
    return Math.round(n).toLocaleString("ko-KR") + "원";
  }

  function floorWon(n) {
    return Math.floor(n);
  }

  // 콤마 포함 문자열 → 숫자. 유효하지 않으면 NaN.
  function parseNum(v) {
    if (v == null) return NaN;
    var s = String(v).replace(/,/g, "").trim();
    if (s === "") return NaN;
    return Number(s);
  }

  // 금액 입력창에 천 단위 콤마 자동 표시
  function attachComma(input) {
    input.addEventListener("input", function () {
      var raw = input.value.replace(/[^\d]/g, "");
      input.value = raw === "" ? "" : Number(raw).toLocaleString("ko-KR");
    });
  }

  document.querySelectorAll("input[data-comma]").forEach(attachComma);

  function showError(el, msg) {
    el.textContent = msg;
    el.style.display = "block";
  }

  function clearError(el) {
    el.textContent = "";
    el.style.display = "none";
  }

  function validatePositive(value, name, errEl, max) {
    if (isNaN(value) || value <= 0) {
      showError(errEl, name + "을(를) 0보다 큰 숫자로 입력해 주세요.");
      return false;
    }
    if (max && value > max) {
      showError(errEl, name + "이(가) 너무 큽니다. " + max.toLocaleString("ko-KR") + " 이하로 입력해 주세요.");
      return false;
    }
    return true;
  }

  // ── 근로소득세 근사 계산 (연간 기준, 간이세액표 근사) ──
  function estimateIncomeTax(annualSalary, familyCount, annualPension, annualOtherIns) {
    // 1) 근로소득공제
    var d = 0;
    var tiers = RATES.earnedIncomeDeduction;
    for (var i = 0; i < tiers.length; i++) {
      if (annualSalary <= tiers[i].limit) {
        d = tiers[i].base + (annualSalary - (tiers[i].over || 0)) * tiers[i].rate;
        break;
      }
    }
    if (d > RATES.earnedIncomeDeductionMax) d = RATES.earnedIncomeDeductionMax;

    // 2) 과세표준 = 총급여 − 근로소득공제 − 인적공제 − 국민연금 − 건강·고용보험료
    var taxBase = annualSalary - d
      - RATES.personalDeduction * familyCount
      - annualPension - annualOtherIns;
    if (taxBase <= 0) return 0;

    // 3) 기본세율 산출세액
    var tax = 0;
    var brackets = RATES.incomeTaxBrackets;
    for (var j = 0; j < brackets.length; j++) {
      if (taxBase <= brackets[j].limit) {
        tax = taxBase * brackets[j].rate - brackets[j].deduction;
        break;
      }
    }
    if (tax <= 0) return 0;

    // 4) 근로소득세액공제 (소득세법 제59조)
    var credit = tax <= 1300000 ? tax * 0.55 : 715000 + (tax - 1300000) * 0.30;
    var creditMax;
    if (annualSalary <= 33000000) creditMax = 740000;
    else if (annualSalary <= 70000000) creditMax = Math.max(660000, 740000 - (annualSalary - 33000000) * 0.008);
    else if (annualSalary <= 120000000) creditMax = Math.max(500000, 660000 - (annualSalary - 70000000) * 0.5);
    else creditMax = Math.max(200000, 500000 - (annualSalary - 120000000) * 0.5);
    if (credit > creditMax) credit = creditMax;

    var finalTax = tax - credit;
    return finalTax > 0 ? finalTax : 0;
  }

  // ── 1. 연봉 실수령액 계산기 ──
  var salaryForm = document.getElementById("salary-form");
  if (salaryForm) {
    salaryForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var errEl = document.getElementById("salary-error");
      clearError(errEl);

      var mode = salaryForm.querySelector("input[name='pay-mode']:checked").value;
      var amount = parseNum(document.getElementById("salary-amount").value);
      var family = parseNum(document.getElementById("salary-family").value);

      if (!validatePositive(amount, "급여", errEl, 100000000000)) return;
      if (isNaN(family) || family < 1 || family > 20 || family % 1 !== 0) {
        showError(errEl, "부양가족 수(본인 포함)는 1~20 사이의 정수로 입력해 주세요.");
        return;
      }

      var annual = mode === "year" ? amount : amount * 12;
      var monthly = annual / 12;

      // 국민연금: 기준소득월액 상·하한 적용
      var pensionBase = Math.min(Math.max(monthly, RATES.pension.incomeMin), RATES.pension.incomeMax);
      var pension = floorWon(pensionBase * RATES.pension.employeeRate);

      // 건강보험 + 장기요양
      var health = floorWon(monthly * RATES.health.employeeRate);
      var care = floorWon(health * (RATES.longTermCare.rateOfIncome / RATES.health.totalRate));

      // 고용보험
      var employment = floorWon(monthly * RATES.employment.employeeRate);

      // 근로소득세(근사) + 지방소득세
      var annualTax = estimateIncomeTax(annual, family, pension * 12, (health + care + employment) * 12);
      var incomeTax = floorWon(annualTax / 12);
      var localTax = floorWon(incomeTax * 0.1);

      var totalDeduction = pension + health + care + employment + incomeTax + localTax;
      var net = monthly - totalDeduction;

      document.getElementById("salary-net").textContent = won(net);
      document.getElementById("salary-gross").textContent = won(monthly);
      document.getElementById("salary-pension").textContent = won(pension);
      document.getElementById("salary-health").textContent = won(health);
      document.getElementById("salary-care").textContent = won(care);
      document.getElementById("salary-emp").textContent = won(employment);
      document.getElementById("salary-tax").textContent = won(incomeTax);
      document.getElementById("salary-local").textContent = won(localTax);
      document.getElementById("salary-total-deduct").textContent = won(totalDeduction);
      document.getElementById("salary-annual-net").textContent = won(net * 12);
      document.getElementById("salary-result").classList.add("show");
    });
  }

  // ── 2. 적금 만기 계산기 ──
  var savingsForm = document.getElementById("savings-form");
  if (savingsForm) {
    savingsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var errEl = document.getElementById("savings-error");
      clearError(errEl);

      var monthly = parseNum(document.getElementById("savings-monthly").value);
      var months = parseNum(document.getElementById("savings-months").value);
      var rate = parseNum(document.getElementById("savings-rate").value);
      var method = savingsForm.querySelector("input[name='savings-method']:checked").value;

      if (!validatePositive(monthly, "월 납입액", errEl, 1000000000)) return;
      if (isNaN(months) || months < 1 || months > 600 || months % 1 !== 0) {
        showError(errEl, "기간은 1~600 사이의 정수(개월)로 입력해 주세요.");
        return;
      }
      if (isNaN(rate) || rate <= 0 || rate > 100) {
        showError(errEl, "연 이자율은 0보다 크고 100 이하인 숫자(%)로 입력해 주세요.");
        return;
      }

      var r = rate / 100;
      var principal = monthly * months;
      var interest;

      if (method === "simple") {
        // 단리: 매월 초 납입, 회차별 남은 개월 수만큼 이자
        interest = monthly * (r / 12) * (months * (months + 1) / 2);
      } else {
        // 월복리: 매월 초 납입
        var i = r / 12;
        var fv = monthly * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
        interest = fv - principal;
      }

      var tax = interest * RATES.interestTax.total;
      var afterTaxInterest = interest - tax;

      document.getElementById("savings-total").textContent = won(principal + afterTaxInterest);
      document.getElementById("savings-principal").textContent = won(principal);
      document.getElementById("savings-interest").textContent = won(interest);
      document.getElementById("savings-tax").textContent = won(tax);
      document.getElementById("savings-after").textContent = won(afterTaxInterest);
      document.getElementById("savings-result").classList.add("show");
    });
  }

  // ── 3. 예금 이자 계산기 ──
  var depositForm = document.getElementById("deposit-form");
  if (depositForm) {
    depositForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var errEl = document.getElementById("deposit-error");
      clearError(errEl);

      var principal = parseNum(document.getElementById("deposit-amount").value);
      var months = parseNum(document.getElementById("deposit-months").value);
      var rate = parseNum(document.getElementById("deposit-rate").value);
      var method = depositForm.querySelector("input[name='deposit-method']:checked").value;

      if (!validatePositive(principal, "예치금", errEl, 1000000000000)) return;
      if (isNaN(months) || months < 1 || months > 600 || months % 1 !== 0) {
        showError(errEl, "기간은 1~600 사이의 정수(개월)로 입력해 주세요.");
        return;
      }
      if (isNaN(rate) || rate <= 0 || rate > 100) {
        showError(errEl, "연 이자율은 0보다 크고 100 이하인 숫자(%)로 입력해 주세요.");
        return;
      }

      var r = rate / 100;
      var interest;
      if (method === "simple") {
        interest = principal * r * (months / 12);
      } else {
        interest = principal * (Math.pow(1 + r / 12, months) - 1);
      }

      var tax = interest * RATES.interestTax.total;
      var afterTaxInterest = interest - tax;

      document.getElementById("deposit-total").textContent = won(principal + afterTaxInterest);
      document.getElementById("deposit-before").textContent = won(interest);
      document.getElementById("deposit-tax").textContent = won(tax);
      document.getElementById("deposit-after").textContent = won(afterTaxInterest);
      document.getElementById("deposit-result").classList.add("show");
    });
  }

  // ── 4. 대출 상환 계산기 ──
  var loanForm = document.getElementById("loan-form");
  if (loanForm) {
    loanForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var errEl = document.getElementById("loan-error");
      clearError(errEl);

      var principal = parseNum(document.getElementById("loan-amount").value);
      var term = parseNum(document.getElementById("loan-term").value);
      var unit = document.getElementById("loan-term-unit").value;
      var rate = parseNum(document.getElementById("loan-rate").value);
      var method = loanForm.querySelector("input[name='loan-method']:checked").value;

      if (!validatePositive(principal, "대출금액", errEl, 1000000000000)) return;
      if (isNaN(term) || term < 1 || term % 1 !== 0) {
        showError(errEl, "대출 기간은 1 이상의 정수로 입력해 주세요.");
        return;
      }
      var months = unit === "year" ? term * 12 : term;
      if (months > 600) {
        showError(errEl, "대출 기간은 최대 50년(600개월)까지 입력할 수 있습니다.");
        return;
      }
      if (isNaN(rate) || rate <= 0 || rate > 100) {
        showError(errEl, "연 이자율은 0보다 크고 100 이하인 숫자(%)로 입력해 주세요.");
        return;
      }

      var i = rate / 100 / 12;
      var schedule = [];   // {no, payment, principalPart, interestPart, balance}
      var totalInterest = 0;
      var firstPayment = 0;
      var n, balance, k, interestPart, principalPart, payment;

      if (method === "annuity") {
        // 원리금균등
        payment = principal * i / (1 - Math.pow(1 + i, -months));
        firstPayment = payment;
        balance = principal;
        for (k = 1; k <= months; k++) {
          interestPart = balance * i;
          principalPart = payment - interestPart;
          balance -= principalPart;
          totalInterest += interestPart;
          if (k <= 12) schedule.push({ no: k, payment: payment, p: principalPart, i: interestPart, bal: Math.max(balance, 0) });
        }
      } else if (method === "equal-principal") {
        // 원금균등
        var fixedPrincipal = principal / months;
        balance = principal;
        for (k = 1; k <= months; k++) {
          interestPart = balance * i;
          payment = fixedPrincipal + interestPart;
          balance -= fixedPrincipal;
          totalInterest += interestPart;
          if (k === 1) firstPayment = payment;
          if (k <= 12) schedule.push({ no: k, payment: payment, p: fixedPrincipal, i: interestPart, bal: Math.max(balance, 0) });
        }
      } else {
        // 만기일시상환
        var monthlyInterest = principal * i;
        totalInterest = monthlyInterest * months;
        firstPayment = monthlyInterest;
        for (k = 1; k <= Math.min(months, 12); k++) {
          var isLast = k === months;
          schedule.push({
            no: k,
            payment: monthlyInterest + (isLast ? principal : 0),
            p: isLast ? principal : 0,
            i: monthlyInterest,
            bal: isLast ? 0 : principal
          });
        }
      }

      var methodLabel = { annuity: "원리금균등", "equal-principal": "원금균등", bullet: "만기일시" }[method];
      document.getElementById("loan-first").textContent = won(firstPayment);
      document.getElementById("loan-first-label").textContent =
        method === "annuity" ? "매월 상환액" : (method === "bullet" ? "매월 이자 납입액" : "첫 달 상환액");
      document.getElementById("loan-method-label").textContent = methodLabel;
      document.getElementById("loan-total-interest").textContent = won(totalInterest);
      document.getElementById("loan-total-payment").textContent = won(principal + totalInterest);

      var tbody = document.getElementById("loan-schedule-body");
      tbody.innerHTML = "";
      schedule.forEach(function (row) {
        var tr = document.createElement("tr");
        [row.no + "회", won(row.payment), won(row.p), won(row.i), won(row.bal)].forEach(function (cell) {
          var td = document.createElement("td");
          td.textContent = cell;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });

      document.getElementById("loan-result").classList.add("show");
    });
  }

  // ── 시급 환산기 ──
  var hourlyForm = document.getElementById("hourly-form");
  if (hourlyForm) {
    hourlyForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var errEl = document.getElementById("hourly-error");
      clearError(errEl);

      var wage = parseNum(document.getElementById("hourly-wage").value);
      var hours = parseNum(document.getElementById("hourly-hours").value);
      var days = parseNum(document.getElementById("hourly-days").value);
      var includeJuhyu = document.getElementById("hourly-juhyu").checked;

      if (!validatePositive(wage, "시급", errEl, 10000000)) return;
      if (isNaN(hours) || hours <= 0 || hours > 24) {
        showError(errEl, "하루 근무시간은 0보다 크고 24 이하로 입력해 주세요.");
        return;
      }
      if (isNaN(days) || days < 1 || days > 7 || days % 1 !== 0) {
        showError(errEl, "주 근무일수는 1~7 사이의 정수로 입력해 주세요.");
        return;
      }

      var weeklyHours = hours * days;
      // 주휴수당: 주 15시간 이상 근무 시, 주 소정근로 40시간 비례(최대 8시간)
      var juhyuHours = 0;
      if (includeJuhyu && weeklyHours >= 15) {
        juhyuHours = Math.min(weeklyHours / 40, 1) * 8;
      }
      var juhyuPay = wage * juhyuHours;
      var weeklyPay = wage * weeklyHours + juhyuPay;
      // 월 근로시간은 정수로 반올림 (고용노동부 방식: 주 48시간 × 4.345주 ≒ 209시간)
      var monthlyHours = Math.round((weeklyHours + juhyuHours) * RATES.minWage.weeksPerMonth);
      var monthly = wage * monthlyHours;
      var annual = monthly * 12;

      document.getElementById("hourly-monthly").textContent = won(monthly);
      document.getElementById("hourly-weekly").textContent = won(weeklyPay);
      document.getElementById("hourly-juhyu-pay").textContent =
        juhyuHours > 0 ? won(juhyuPay) + " (주 " + (Math.round(juhyuHours * 10) / 10) + "시간분)"
                       : (includeJuhyu ? "0원 (주 15시간 미만)" : "미포함");
      document.getElementById("hourly-annual").textContent = won(annual);

      var warnEl = document.getElementById("hourly-minwage-warn");
      if (wage < RATES.minWage.hourly) {
        warnEl.textContent = "⚠ 입력한 시급이 2026년 최저임금(" +
          RATES.minWage.hourly.toLocaleString("ko-KR") + "원)보다 낮습니다.";
        warnEl.style.display = "block";
      } else {
        warnEl.style.display = "none";
      }
      document.getElementById("hourly-result").classList.add("show");
    });
  }

  // ── 목표 저축 역산기 ──
  var goalForm = document.getElementById("goal-form");
  if (goalForm) {
    goalForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var errEl = document.getElementById("goal-error");
      clearError(errEl);

      var target = parseNum(document.getElementById("goal-amount").value);
      var months = parseNum(document.getElementById("goal-months").value);
      var rate = parseNum(document.getElementById("goal-rate").value);
      var method = goalForm.querySelector("input[name='goal-method']:checked").value;
      if (isNaN(rate)) rate = 0;

      if (!validatePositive(target, "목표 금액", errEl, 1000000000000)) return;
      if (isNaN(months) || months < 1 || months > 600 || months % 1 !== 0) {
        showError(errEl, "기간은 1~600 사이의 정수(개월)로 입력해 주세요.");
        return;
      }
      if (rate < 0 || rate > 100) {
        showError(errEl, "연 이자율은 0 이상 100 이하인 숫자(%)로 입력해 주세요.");
        return;
      }

      var afterTax = 1 - RATES.interestTax.total;
      var r = rate / 100;
      var factor;
      if (r === 0) {
        factor = months;
      } else if (method === "simple") {
        // 매월 초 납입 단리: 이자 = m × (r/12) × n(n+1)/2, 세후 반영
        factor = months + (r / 12) * (months * (months + 1) / 2) * afterTax;
      } else {
        var i = r / 12;
        var fvf = ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
        factor = months + (fvf - months) * afterTax;
      }

      var monthly = Math.ceil(target / factor);
      var totalDeposit = monthly * months;
      var interest = target - totalDeposit; // 세후 이자 (근사)
      if (interest < 0) interest = 0;
      var noInterestMonthly = Math.ceil(target / months);

      document.getElementById("goal-monthly").textContent = won(monthly);
      document.getElementById("goal-total").textContent = won(totalDeposit);
      document.getElementById("goal-interest").textContent = won(interest);
      document.getElementById("goal-nointerest").textContent =
        won(noInterestMonthly) + " (이자 도움 월 " + won(noInterestMonthly - monthly) + ")";
      document.getElementById("goal-result").classList.add("show");
    });
  }

  // ── 5. 퇴직금 계산기 ──
  var sevForm = document.getElementById("severance-form");
  if (sevForm) {
    sevForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var errEl = document.getElementById("severance-error");
      clearError(errEl);

      var startVal = document.getElementById("sev-start").value;
      var endVal = document.getElementById("sev-end").value;
      var monthlyWage = parseNum(document.getElementById("sev-wage").value);
      var annualBonus = parseNum(document.getElementById("sev-bonus").value);
      var annualLeavePay = parseNum(document.getElementById("sev-leave").value);
      if (isNaN(annualBonus)) annualBonus = 0;
      if (isNaN(annualLeavePay)) annualLeavePay = 0;

      if (!startVal || !endVal) {
        showError(errEl, "입사일과 퇴직일을 모두 선택해 주세요.");
        return;
      }
      var start = new Date(startVal);
      var end = new Date(endVal);
      if (end <= start) {
        showError(errEl, "퇴직일은 입사일보다 뒤여야 합니다.");
        return;
      }
      if (!validatePositive(monthlyWage, "세전 월급", errEl, 1000000000)) return;
      if (annualBonus < 0 || annualLeavePay < 0) {
        showError(errEl, "상여금과 연차수당은 0 이상으로 입력해 주세요.");
        return;
      }

      var MS_DAY = 24 * 60 * 60 * 1000;
      var serviceDays = Math.round((end - start) / MS_DAY);
      if (serviceDays < 365) {
        showError(errEl, "재직일수가 1년(365일) 미만이면 법정 퇴직금 지급 대상이 아닙니다. (현재 " + serviceDays + "일)");
        return;
      }

      // 퇴직일 이전 3개월 일수 (퇴직일 미포함, 달력 기준)
      var threeMonthsAgo = new Date(end);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      var periodDays = Math.round((end - threeMonthsAgo) / MS_DAY);

      // 3개월 임금총액 = 월급×3 + 연간상여×(3/12) + 연차수당×(3/12)
      var threeMonthTotal = monthlyWage * 3 + annualBonus * 0.25 + annualLeavePay * 0.25;
      var avgDailyWage = threeMonthTotal / periodDays;
      var severancePay = avgDailyWage * RATES.severance.avgWageDays * (serviceDays / RATES.severance.yearDays);

      document.getElementById("sev-total").textContent = won(severancePay);
      document.getElementById("sev-days").textContent = serviceDays.toLocaleString("ko-KR") + "일";
      document.getElementById("sev-period").textContent = periodDays + "일";
      document.getElementById("sev-3month").textContent = won(threeMonthTotal);
      document.getElementById("sev-avg").textContent = won(avgDailyWage);
      document.getElementById("severance-result").classList.add("show");
    });
  }

  // ── 6. 실업급여(구직급여) 계산기 ──
  var unempForm = document.getElementById("unemployment-form");
  if (unempForm) {
    unempForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var errEl = document.getElementById("unemp-error");
      clearError(errEl);

      var monthly = parseNum(document.getElementById("unemp-wage").value);
      var age = parseNum(document.getElementById("unemp-age").value);
      var period = Number(document.getElementById("unemp-period").value);
      var disabled = document.getElementById("unemp-disabled").checked;

      if (!validatePositive(monthly, "월 평균임금", errEl, 1000000000)) return;
      if (isNaN(age) || age < 15 || age > 100 || age % 1 !== 0) {
        showError(errEl, "나이는 15~100 사이의 정수로 입력해 주세요.");
        return;
      }

      var U = RATES.unemployment;
      var avgDaily = monthly * 3 / U.avgWageDays;
      var raw = avgDaily * U.wageRate;
      var daily = Math.min(Math.max(raw, U.dailyMin), U.dailyMax);
      var table = (age >= 50 || disabled) ? U.benefitDaysOver50 : U.benefitDaysUnder50;
      var days = table[period];
      var total = daily * days;

      var note;
      if (raw > U.dailyMax) note = "평균임금의 60%(" + won(raw) + ")가 상한액을 넘어 1일 상한액 " + won(U.dailyMax) + "이 적용됩니다.";
      else if (raw < U.dailyMin) note = "평균임금의 60%(" + won(raw) + ")가 하한액보다 적어 1일 하한액 " + won(U.dailyMin) + "이 적용됩니다.";
      else note = "1일 평균임금 " + won(avgDaily) + "의 60%가 그대로 적용됩니다.";

      document.getElementById("unemp-total").textContent = won(total);
      document.getElementById("unemp-daily").textContent = won(daily);
      document.getElementById("unemp-days").textContent = days + "일";
      document.getElementById("unemp-monthly").textContent = won(daily * 30);
      document.getElementById("unemp-avg").textContent = won(avgDaily);
      document.getElementById("unemp-note").textContent = note;
      document.getElementById("unemployment-result").classList.add("show");
    });
  }

  // ── 7. 연차 계산기 (발생 일수 + 연차수당) ──
  var leaveForm = document.getElementById("leave-form");
  if (leaveForm) {
    var baseInput = document.getElementById("leave-base");
    if (baseInput && !baseInput.value) {
      var t = new Date();
      baseInput.value = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
    }

    function fullMonthsBetween(a, b) {
      var m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
      if (b.getDate() < a.getDate()) m--;
      return m;
    }
    function leaveForYears(y) {
      var L = RATES.annualLeave;
      return Math.min(L.base + Math.floor((y - 1) / 2), L.max);
    }

    leaveForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var errEl = document.getElementById("leave-error");
      clearError(errEl);

      var startVal = document.getElementById("leave-start").value;
      var baseVal = document.getElementById("leave-base").value;
      var wage = parseNum(document.getElementById("leave-wage").value);
      var unused = parseNum(document.getElementById("leave-unused").value);

      var start = startVal ? new Date(startVal + "T00:00:00") : null;
      var base = baseVal ? new Date(baseVal + "T00:00:00") : null;
      if (!start || isNaN(start.getTime()) || !base || isNaN(base.getTime())) {
        showError(errEl, "입사일과 기준일을 모두 선택해 주세요.");
        return;
      }
      if (base <= start) {
        showError(errEl, "기준일은 입사일보다 뒤여야 합니다.");
        return;
      }
      if (!isNaN(wage) && wage < 0) wage = NaN;
      if (isNaN(unused) || unused < 0) unused = 0;

      var L = RATES.annualLeave;
      var months = fullMonthsBetween(start, base);
      var years = Math.floor(months / 12);
      var current, basis;
      if (years < 1) {
        current = Math.min(months, L.firstYearMax);
        basis = "입사 " + months + "개월 차 — 1개월 개근마다 1일 (1년 미만, 최대 " + L.firstYearMax + "일)";
      } else {
        current = leaveForYears(years);
        basis = "근속 " + years + "년 차 — 기본 " + L.base + "일" + (current > L.base ? " + 가산 " + (current - L.base) + "일" : "") + " (1년간 80% 이상 출근 기준)";
      }

      var dailyWage = (!isNaN(wage) && wage > 0) ? wage / L.monthlyHours * L.dailyHours : 0;
      var pay = dailyWage * unused;

      document.getElementById("leave-current").textContent = current + "일";
      document.getElementById("leave-basis").textContent = basis;
      document.getElementById("leave-service").textContent = years + "년 " + (months - years * 12) + "개월";
      document.getElementById("leave-daily-wage").textContent = dailyWage > 0 ? won(dailyWage) : "-";
      document.getElementById("leave-pay").textContent = dailyWage > 0 ? won(pay) + " (" + unused + "일)" : "월 통상임금을 입력하면 계산됩니다";

      var rows = "";
      var last = Math.min(Math.max(years + 4, 7), 21);
      for (var y = 1; y <= last; y++) {
        var cls = (y === years) ? ' class="total"' : "";
        rows += "<tr" + cls + "><td>" + y + "년 이상</td><td>" + leaveForYears(y) + "일</td></tr>";
      }
      document.getElementById("leave-schedule").innerHTML = rows;
      document.getElementById("leave-result").classList.add("show");
    });
  }

  // ── 8. 4대보험 계산기 (근로자·사업주 부담) ──
  var insForm = document.getElementById("insurance-form");
  if (insForm) {
    insForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var errEl = document.getElementById("ins-error");
      clearError(errEl);

      var wage = parseNum(document.getElementById("ins-wage").value);
      var size = document.getElementById("ins-size").value;
      var accRate = parseNum(document.getElementById("ins-accident").value);

      if (!validatePositive(wage, "월 급여", errEl, 1000000000)) return;
      if (isNaN(accRate) || accRate < 0 || accRate > 50) {
        showError(errEl, "산재보험 요율은 0~50 사이 숫자(%)로 입력해 주세요.");
        return;
      }

      var pensionBase = Math.min(Math.max(wage, RATES.pension.incomeMin), RATES.pension.incomeMax);
      var pension = floorWon(pensionBase * RATES.pension.employeeRate);
      var health = floorWon(wage * RATES.health.employeeRate);
      var care = floorWon(health * (RATES.longTermCare.rateOfIncome / RATES.health.totalRate));
      var emp = floorWon(wage * RATES.employment.employeeRate);
      var stability = floorWon(wage * RATES.employer.employmentStability[size]);
      var accident = floorWon(wage * accRate / 100);

      var rows = [
        ["국민연금 (4.75% + 4.75%)", pension, pension],
        ["건강보험 (3.595% + 3.595%)", health, health],
        ["장기요양보험 (건보료의 13.14%)", care, care],
        ["고용보험 실업급여 (0.9% + 0.9%)", emp, emp],
        ["고용안정·직업능력개발 (사업주만)", 0, stability],
        ["산재보험 (사업주만, " + accRate + "%)", 0, accident]
      ];
      var eSum = 0, cSum = 0, html = "";
      rows.forEach(function (r) {
        eSum += r[1]; cSum += r[2];
        html += "<tr><th>" + r[0] + "</th><td>" + (r[1] ? won(r[1]) : "-") + "</td><td>" + won(r[2]) + "</td><td>" + won(r[1] + r[2]) + "</td></tr>";
      });
      html += '<tr class="total"><th>합계</th><td>' + won(eSum) + "</td><td>" + won(cSum) + "</td><td>" + won(eSum + cSum) + "</td></tr>";
      document.getElementById("ins-rows").innerHTML = html;
      document.getElementById("ins-employee").textContent = won(eSum);
      document.getElementById("ins-employer").textContent = won(cSum);
      document.getElementById("ins-after").textContent = won(wage - eSum);
      document.getElementById("ins-cost").textContent = won(wage + cSum);
      document.getElementById("insurance-result").classList.add("show");
    });
  }
})();
