// ------------------------------------------------------------------
// 學校點名與課表系統 - 前端主邏輯 (script.js)
// ------------------------------------------------------------------

// ⚠️ 請確認為您發布的 Apps Script Web App URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzN9gOOJVndaZ4-OeLaCXrSe0ael1w-oAmOdHgF5Ua67w3kyEdYw_NKCee0YB0NEIe1/exec";

let currentUser = null;
let appData = null;
let currentSession = {}; 
let currentGrid = { cols: 6, rows: 5, seats: {}, disabled: [] };
let currentAbsenteesMap = new Map();
const REASONS = ["出席", "病假", "事假", "公假", "遲到", "曠課"];
let reportData = { attendances: [], summaries: [] };

// 記錄 Modal 中準備換座位的第一個選取位置 (例如 "1-2")
let selectedSeatKey = null;

// 取得台灣本地日期 (YYYY-MM-DD)，避免 UTC 跨午夜時區偏移問題
function getTodayLocalDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 頁面初始載入與 LocalStorage 自動登入檢查
window.onload = function() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  const savedUser = localStorage.getItem("attendance_user");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showMainView();
  }
};

// 切換明亮 / 暗黑主題模式
function toggleTheme() {
  const body = document.body;
  body.setAttribute("data-theme", body.getAttribute("data-theme") === "dark" ? "light" : "dark");
}

// 1. 登入邏輯
async function handleLogin() {
  const acc = document.getElementById("accInput").value.trim();
  const pwd = document.getElementById("pwdInput").value.trim();
  const msg = document.getElementById("loginMsg");
  msg.innerText = "驗證中...";

  try {
    const res = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "login", account: acc, password: pwd })
    });
    const data = await res.json();

    if (data.status === "success") {
      currentUser = data.user;
      currentUser.role = String(currentUser.role || 'teacher').toLowerCase().trim();
      localStorage.setItem("attendance_user", JSON.stringify(currentUser));
      msg.innerText = "";
      showMainView();
    } else {
      msg.innerText = data.message;
    }
  } catch (err) {
    msg.innerText = "連線失敗，請檢查網路連線或 API 網址！";
  }
}

// 登出系統
function logout() {
  localStorage.removeItem("attendance_user");
  currentUser = null;
  document.getElementById("loginView").classList.remove("hidden");
  document.getElementById("mainView").classList.add("hidden");
  document.getElementById("attendanceView").classList.add("hidden");
  document.getElementById("reportView").classList.add("hidden");
  document.getElementById("logoutBtn").classList.add("hidden");
}

// 2. 顯示主畫面 (課表)
async function showMainView() {
  document.getElementById("loginView").classList.add("hidden");
  document.getElementById("mainView").classList.remove("hidden");
  document.getElementById("attendanceView").classList.add("hidden");
  document.getElementById("reportView").classList.add("hidden");
  document.getElementById("logoutBtn").classList.remove("hidden");

  const isAdmin = (currentUser.role === 'admin');
  let roleText = isAdmin ? '管理者' : (currentUser.role === 'homeroom' ? `導師 (${currentUser.classHandled}班)` : '科任教師');
  document.getElementById("welcomeMsg").innerText = `歡迎，${currentUser.name} [${roleText}]`;

  try {
    const res = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getInitialData", account: currentUser.account, role: currentUser.role })
    });
    const result = await res.json();

    if (result.status === "success") {
      appData = result.data;
      initControls();
      renderTimetable();
    }
  } catch (err) {
    alert("初始化資料載入失敗！");
  }
}

// 下拉選單初始化 (主畫面)
function initControls() {
  const schools = [...new Set(appData.times.map(t => t.學校))].filter(Boolean);
  const semesters = [...new Set(appData.schedules.map(s => s.學期))].filter(Boolean);

  const schoolSelect = document.getElementById("schoolSelect");
  const semesterSelect = document.getElementById("semesterSelect");

  schoolSelect.innerHTML = schools.map(s => `<option value="${s}">${s}</option>`).join('');
  semesterSelect.innerHTML = semesters.map(s => `<option value="${s}">${s}</option>`).join('');
  if (semesters.length > 0) semesterSelect.value = semesters[semesters.length - 1];

  schoolSelect.onchange = renderTimetable;
  semesterSelect.onchange = renderTimetable;

  const box = document.getElementById("teacherSelectBox");
  if (currentUser.role === "admin") {
    box.classList.remove("hidden");
    const teacherSelect = document.getElementById("teacherSelect");

    // 💡 抓取所有不重複的教師帳號 (自動過濾與拆分文字)
    const rawTeacherList = appData.schedules.map(s => {
      let acc = s.教師帳號 || s.教師 || s.點名教師帳號 || "";
      // 若欄位包含多餘字串 (例如 "806 A001")，自動取出後方的代碼 A001
      const parts = String(acc).trim().split(/\s+/);
      return parts[parts.length - 1]; // 取最後一項即為 A001, A002
    }).filter(Boolean);

    const teachers = [...new Set(rawTeacherList)];

    teacherSelect.innerHTML = `<option value="ALL">全體課表 (所有教師)</option>` + 
      teachers.map(t => `<option value="${t}">${t}</option>`).join('');

    teacherSelect.onchange = renderTimetable;
  } else {
    box.classList.add("hidden");
  }
}

// 渲染課表 (支援管理者檢視多位教師同個時段課表)
function renderTimetable() {
  const selectedSchool = document.getElementById("schoolSelect").value;
  const selectedSemester = document.getElementById("semesterSelect").value;
  
  let selectedTeacher = currentUser.account;
  if (currentUser.role === "admin") {
    const tSelect = document.getElementById("teacherSelect");
    if (tSelect && tSelect.value) {
      selectedTeacher = tSelect.value;
    }
  }

  const periods = appData.times.filter(t => t.學校 === selectedSchool);
  
  // 篩選出符合學校、學期與教師條件的所有課表
  const filteredSchedules = appData.schedules.filter(s => {
    const matchSchool = String(s.學校).trim() === String(selectedSchool).trim();
    const matchSemester = String(s.學期).trim() === String(selectedSemester).trim();
    
    let rawAcc = s.教師帳號 || s.教師 || s.點名教師帳號 || "";
    const parts = String(rawAcc).trim().split(/\s+/);
    const rowTeacher = parts[parts.length - 1];

    let matchTeacher = false;
    if (currentUser.role === "admin") {
      matchTeacher = (selectedTeacher === "ALL") || (rowTeacher === String(selectedTeacher).trim());
    } else {
      matchTeacher = (rowTeacher === String(currentUser.account).trim());
    }

    return matchSchool && matchSemester && matchTeacher;
  });

  const days = ["星期一", "星期二", "星期三", "星期四", "星期五"];
  const tbody = document.getElementById("timetableBody");
  tbody.innerHTML = "";

  periods.forEach(p => {
    let tr = document.createElement("tr");
    tr.innerHTML = `<td><b>${p.節次}</b><br><small style="color:#777">${p.開始時間}-${p.結束時間}</small></td>`;

    days.forEach(day => {
      // 💡 關鍵修復：改用 filter 抓出該時段「所有」課程
      const matchClasses = filteredSchedules.filter(s => s.星期 === day && s.節次 === p.節次);

      if (matchClasses.length > 0) {
        // 將該時段的每一門課轉為 HTML 區塊
        const classItemsHtml = matchClasses.map(matchClass => {
          let rawAcc = matchClass.教師帳號 || matchClass.教師 || matchClass.點名教師帳號 || "";
          const parts = String(rawAcc).trim().split(/\s+/);
          const teacherCode = parts[parts.length - 1];
          
          // 如果是全體模式，呈現格式為：[老師代碼] 班級 (科目)
          const teacherTag = (selectedTeacher === "ALL" && teacherCode) ? `<span style="font-size:0.75rem; color:#2d6a4f; font-weight:bold;">[${teacherCode}]</span> ` : '';

          return `
            <div class="timetable-item" 
                 style="padding: 4px 0; border-bottom: 1px dashed #c8e6c9; cursor: pointer;"
                 onclick="enterAttendance('${selectedSchool}', '${selectedSemester}', '${matchClass.班級}', '${matchClass.科目}', '${p.節次}')">
              ${teacherTag}<b>${matchClass.班級}</b> <small style="color:#555">(${matchClass.科目})</small>
            </div>
          `;
        }).join('');

        tr.innerHTML += `<td class="has-class" style="vertical-align: top; padding: 4px;">${classItemsHtml}</td>`;
      } else {
        tr.innerHTML += `<td class="empty">-</td>`;
      }
    });
    tbody.appendChild(tr);
  });
}

// ----------------- 3. 點名與座位管理 -----------------

async function enterAttendance(school, semester, className, subject, period) {
  const today = getTodayLocalDate();
  currentSession = { school, semester, className, subject, period, date: today };

  document.getElementById("mainView").classList.add("hidden");
  document.getElementById("attendanceView").classList.remove("hidden");
  document.getElementById("attendanceTitle").innerText = `${className} - ${subject} (${period})`;
  document.getElementById("attendanceDate").value = today;

  loadSeatingData();
  await fetchExistingAttendance();
}

async function onDateChange() {
  const selectedDate = document.getElementById("attendanceDate").value;
  if (selectedDate) {
    currentSession.date = selectedDate;
    await fetchExistingAttendance();
  }
}

async function fetchExistingAttendance() {
  currentAbsenteesMap.clear();
  document.getElementById("summaryInput").value = "";
  renderSeatingGrid();

  try {
    const res = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getSummaryReports",
        account: currentUser.account,
        role: currentUser.role,
        school: currentSession.school,
        semester: currentSession.semester,
        classHandled: currentUser.classHandled
      })
    });
    const result = await res.json();

    if (result.status === "success") {
      const matchAtt = result.attendances.find(a => 
        a.日期 === currentSession.date && 
        a.班級 === currentSession.className && 
        a.節次 === currentSession.period
      );

      if (matchAtt && matchAtt.缺席學生) {
        const classStudents = appData.students.filter(s => 
          s.學校 === currentSession.school && s.學期 === currentSession.semester && s.班級 === currentSession.className
        );
        
        classStudents.forEach(st => {
          if (matchAtt.缺席學生.includes(st.學號) || matchAtt.缺席學生.includes(st.姓名)) {
            let reason = "缺席";
            REASONS.forEach(r => {
              if (matchAtt.缺席學生.includes(`${st.姓名}(${r})`)) reason = r;
            });
            currentAbsenteesMap.set(st.學號, reason);
          }
        });
      }

      const matchSum = result.summaries.find(s => 
        s.日期 === currentSession.date && 
        s.班級 === currentSession.className && 
        s.節次 === currentSession.period
      );

      if (matchSum) {
        document.getElementById("summaryInput").value = matchSum.教學摘要 || "";
      }

      renderSeatingGrid();
    }
  } catch (err) {
    console.error("讀取點名紀錄失敗：", err);
  }
}

function backToMain() {
  document.getElementById("attendanceView").classList.add("hidden");
  document.getElementById("mainView").classList.remove("hidden");
}

// 載入與比對雲端座位表 (強效數值化 X/Y 尺寸)
function loadSeatingData() {
  const saved = appData.seatings.find(s => 
    String(s.學校) === String(currentSession.school) && 
    String(s.學期) === String(currentSession.semester) && 
    String(s.班級) === String(currentSession.className)
  );

  if (saved) {
    currentGrid.cols = parseInt(saved.欄數X || saved.cols) || 6;
    currentGrid.rows = parseInt(saved.列數Y || saved.rows) || 5;
    currentGrid.disabled = typeof saved.無效座位 === "string" ? JSON.parse(saved.無效座位 || "[]") : (saved.無效座位 || []);
    currentGrid.seats = typeof saved.座位資料 === "string" ? JSON.parse(saved.座位資料 || "{}") : (saved.座位資料 || {});
  } else {
    currentGrid.cols = 6; 
    currentGrid.rows = 5; 
    currentGrid.disabled = [];
    autoAssignSeatsVertical();
  }
}

function autoAssignSeatsVertical() {
  currentGrid.seats = {};
  const classStudents = appData.students.filter(s => 
    String(s.學校) === String(currentSession.school) && 
    String(s.學期) === String(currentSession.semester) && 
    String(s.班級) === String(currentSession.className)
  );

  let idx = 0;
  for (let c = 1; c <= currentGrid.cols; c++) {
    for (let r = 1; r <= currentGrid.rows; r++) {
      if (idx < classStudents.length) {
        currentGrid.seats[`${r}-${c}`] = classStudents[idx].學號;
        idx++;
      }
    }
  }
}

function renderSeatingGrid() {
  const gridContainer = document.getElementById("seatingGrid");
  if (!gridContainer) return;

  gridContainer.style.gridTemplateColumns = `repeat(${currentGrid.cols}, 1fr)`;
  gridContainer.innerHTML = "";

  const classStudents = appData.students.filter(s => 
    String(s.學校) === String(currentSession.school) && 
    String(s.學期) === String(currentSession.semester) && 
    String(s.班級) === String(currentSession.className)
  );

  for (let r = 1; r <= currentGrid.rows; r++) {
    for (let c = 1; c <= currentGrid.cols; c++) {
      const posKey = `${r}-${c}`;
      const seatCard = document.createElement("div");
      const isDisabled = currentGrid.disabled.includes(posKey);
      const studentId = currentGrid.seats[posKey];
      const student = classStudents.find(s => String(s.學號) === String(studentId));

      seatCard.className = `seat-card ${isDisabled ? 'disabled' : ''}`;

      if (!isDisabled && student) {
        const reason = currentAbsenteesMap.get(student.學號);
        if (reason) {
          seatCard.classList.add(`reason-${reason}`);
        }
        seatCard.onclick = () => cycleAttendanceReason(student.學號);
        seatCard.innerHTML = `<div><b>${student.學號}</b></div><div>${student.姓名}</div>${reason ? `<small><b>[${reason}]</b></small>` : ''}`;
      } else if (isDisabled) {
        seatCard.innerHTML = `<small style="color:#aaa">走道</small>`;
      } else {
        seatCard.innerHTML = `<small style="color:#bbb">空位</small>`;
      }

      gridContainer.appendChild(seatCard);
    }
  }
}

function cycleAttendanceReason(studentId) {
  const currentReason = currentAbsenteesMap.get(studentId) || "出席";
  const currentIndex = REASONS.indexOf(currentReason);
  const nextIndex = (currentIndex + 1) % REASONS.length;
  const nextReason = REASONS[nextIndex];

  if (nextReason === "出席") {
    currentAbsenteesMap.delete(studentId);
  } else {
    currentAbsenteesMap.set(studentId, nextReason);
  }
  renderSeatingGrid();
}

// ----------------- ⚙️ 排座位 Modal 視窗與對調邏輯 -----------------

function openSeatingModal() {
  selectedSeatKey = null;
  document.getElementById("seatingModal").classList.remove("hidden");
  document.getElementById("gridColsInput").value = currentGrid.cols;
  document.getElementById("gridRowsInput").value = currentGrid.rows;
  renderModalSeatingGrid();
}

function closeSeatingModal() {
  document.getElementById("seatingModal").classList.add("hidden");
}

// 套用尺寸時按學生順序直排填充
function applyGridDimensions() {
  currentGrid.cols = parseInt(document.getElementById("gridColsInput").value) || 6;
  currentGrid.rows = parseInt(document.getElementById("gridRowsInput").value) || 5;
  currentGrid.disabled = [];
  
  autoAssignSeatsVertical();
  selectedSeatKey = null;
  renderModalSeatingGrid();
}

function renderModalSeatingGrid() {
  const container = document.getElementById("modalSeatingGrid");
  if (!container) return;

  container.style.gridTemplateColumns = `repeat(${currentGrid.cols}, 1fr)`;
  container.innerHTML = "";

  const classStudents = appData.students.filter(s => 
    String(s.學校) === String(currentSession.school) && 
    String(s.學期) === String(currentSession.semester) && 
    String(s.班級) === String(currentSession.className)
  );

  for (let r = 1; r <= currentGrid.rows; r++) {
    for (let c = 1; c <= currentGrid.cols; c++) {
      const posKey = `${r}-${c}`;
      const seatCard = document.createElement("div");
      const isDisabled = currentGrid.disabled.includes(posKey);
      const studentId = currentGrid.seats[posKey];
      const student = classStudents.find(s => String(s.學號) === String(studentId));

      seatCard.className = `seat-card ${isDisabled ? 'disabled' : ''}`;
      
      if (posKey === selectedSeatKey) {
        seatCard.style.border = "2.5px solid #e07a5f";
        seatCard.style.backgroundColor = "#fefae0";
      }

      seatCard.onclick = () => handleSeatClickInModal(posKey);

      if (isDisabled) {
        seatCard.innerHTML = `<small style="color:#aaa">走道 (點擊切換)</small>`;
      } else if (student) {
        seatCard.innerHTML = `<div><b>${student.學號}</b></div><div>${student.姓名}</div>`;
      } else {
        seatCard.innerHTML = `<small style="color:#bbb">空位</small>`;
      }

      container.appendChild(seatCard);
    }
  }
}

function handleSeatClickInModal(posKey) {
  const isDisabled = currentGrid.disabled.includes(posKey);

  if (!selectedSeatKey) {
    if (isDisabled) {
      const idx = currentGrid.disabled.indexOf(posKey);
      currentGrid.disabled.splice(idx, 1);
    } else {
      selectedSeatKey = posKey;
    }
  } 
  else if (selectedSeatKey === posKey) {
    toggleDisabledSeat(posKey);
    selectedSeatKey = null;
  } 
  else {
    const targetIsDisabled = currentGrid.disabled.includes(posKey);
    
    if (!targetIsDisabled) {
      const studentA = currentGrid.seats[selectedSeatKey];
      const studentB = currentGrid.seats[posKey];

      if (studentB) {
        currentGrid.seats[selectedSeatKey] = studentB;
      } else {
        delete currentGrid.seats[selectedSeatKey];
      }

      if (studentA) {
        currentGrid.seats[posKey] = studentA;
      } else {
        delete currentGrid.seats[posKey];
      }
    }
    selectedSeatKey = null;
  }

  renderModalSeatingGrid();
}

function toggleDisabledSeat(posKey) {
  const idx = currentGrid.disabled.indexOf(posKey);
  if (idx > -1) {
    currentGrid.disabled.splice(idx, 1);
  } else {
    currentGrid.disabled.push(posKey);
    delete currentGrid.seats[posKey];
  }
  renderModalSeatingGrid();
}

// 儲存座位表與尺寸佈局 (同步寫回本地記憶體 appData)
async function saveSeatingLayout() {
  const payload = {
    action: "saveSeating",
    account: currentUser.account,
    school: currentSession.school,
    semester: currentSession.semester,
    className: currentSession.className,
    cols: currentGrid.cols,
    rows: currentGrid.rows,
    disabledSeats: currentGrid.disabled,
    seatData: currentGrid.seats
  };

  try {
    const res = await fetch(GAS_API_URL, { method: "POST", body: JSON.stringify(payload) });
    const result = await res.json();
    
    if (result.status === "success") {
      alert("✅ 座位佈局與 X/Y 尺寸已成功儲存至雲端！");
      
      let savedIndex = appData.seatings.findIndex(s => 
        String(s.學校) === String(currentSession.school) && 
        String(s.學期) === String(currentSession.semester) && 
        String(s.班級) === String(currentSession.className)
      );

      const newSeatingObj = {
        學期: currentSession.semester,
        學校: currentSession.school,
        班級: currentSession.className,
        欄數X: currentGrid.cols,
        列數Y: currentGrid.rows,
        無效座位: JSON.stringify(currentGrid.disabled),
        座位資料: JSON.stringify(currentGrid.seats)
      };

      if (savedIndex > -1) {
        appData.seatings[savedIndex] = newSeatingObj;
      } else {
        appData.seatings.push(newSeatingObj);
      }

      closeSeatingModal();
      renderSeatingGrid();
    }
  } catch (err) {
    alert("儲存座位設定失敗，請檢查網路連線。");
  }
}

async function submitAttendance() {
  const classStudents = appData.students.filter(s => 
    String(s.學校) === String(currentSession.school) && 
    String(s.學期) === String(currentSession.semester) && 
    String(s.班級) === String(currentSession.className)
  );

  const absenteesList = [];
  currentAbsenteesMap.forEach((reason, id) => {
    const st = classStudents.find(s => String(s.學號) === String(id));
    if (st) absenteesList.push({ id: st.學號, name: st.姓名, reason: reason });
  });

  const payload = {
    action: "saveAttendance",
    account: currentUser.account,
    semester: currentSession.semester,
    school: currentSession.school,
    date: currentSession.date,
    period: currentSession.period,
    className: currentSession.className,
    absentees: absenteesList,
    summary: document.getElementById("summaryInput").value.trim()
  };

  try {
    const res = await fetch(GAS_API_URL, { method: "POST", body: JSON.stringify(payload) });
    const result = await res.json();
    if (result.status === "success") {
      alert(`✅ 【${currentSession.className}】點名與摘要已成功儲存！`);
      backToMain();
    }
  } catch (err) {
    alert("送出失敗，請檢查連線");
  }
}

// ----------------- 4. 期末報表邏輯 -----------------

// 開啟期末報表畫面並初始化「學校」與「學期」下拉選單
async function showReportView() {
  document.getElementById("mainView").classList.add("hidden");
  document.getElementById("reportView").classList.remove("hidden");

  // 1. 從全域資料 (appData) 抓取所有不重複的學校與學期清單
  const schools = [...new Set(appData.times.map(t => t.學校))].filter(Boolean);
  const semesters = [...new Set(appData.schedules.map(s => s.學期))].filter(Boolean);

  const schoolSelect = document.getElementById("reportSchoolFilter");
  const semesterSelect = document.getElementById("reportSemesterFilter");

  if (schoolSelect && semesterSelect) {
    schoolSelect.innerHTML = schools.map(s => `<option value="${s}">${s}</option>`).join('');
    semesterSelect.innerHTML = semesters.map(s => `<option value="${s}">${s}</option>`).join('');

    // 自動帶入主畫面當前選取的學校與最新學期
    if (document.getElementById("schoolSelect")?.value) {
      schoolSelect.value = document.getElementById("schoolSelect").value;
    }
    if (semesters.length > 0) {
      semesterSelect.value = semesters[semesters.length - 1];
    }
  }

  // 2. 根據所選的學校與學期，向雲端抓取對應報表資料
  await fetchReportData();
}

// 根據當前選擇的「學校」與「學期」向 Apps Script 請求報表
async function fetchReportData() {
  const selectedSchool = document.getElementById("reportSchoolFilter")?.value || "";
  const selectedSemester = document.getElementById("reportSemesterFilter")?.value || "";

  try {
    const res = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getSummaryReports",
        account: currentUser.account,
        role: currentUser.role,
        school: selectedSchool,
        semester: selectedSemester,
        classHandled: currentUser.classHandled
      })
    });
    const result = await res.json();

    if (result.status === "success") {
      reportData = result;
      initReportClassFilter();
      renderReports();
    }
  } catch (err) {
    alert("載入期末紀錄失敗，請檢查網路連線！");
  }
}

// 當使用者切換報表頁面的「學校」或「學期」選單時觸發連動
async function onReportSchoolOrSemesterChange() {
  await fetchReportData();
}

function backToMainFromReport() {
  document.getElementById("reportView").classList.add("hidden");
  document.getElementById("mainView").classList.remove("hidden");
}

function switchReportTab(tab) {
  const btns = document.querySelectorAll("#reportView .tab-btn");
  btns[0].classList.toggle("active", tab === 'absent');
  btns[1].classList.toggle("active", tab === 'summary');

  document.getElementById("absentTabContent").classList.toggle("hidden", tab !== 'absent');
  document.getElementById("summaryTabContent").classList.toggle("hidden", tab !== 'summary');
}

function initReportClassFilter() {
  const classSelect = document.getElementById("reportClassFilter");
  const classes = [...new Set(reportData.attendances.map(a => a.班級))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  
  classSelect.innerHTML = `<option value="ALL">全選 (所有班級)</option>` + 
    classes.map(c => `<option value="${c}">班級：${c}</option>`).join('');

  onReportClassChange();
}

function onReportClassChange() {
  const selectedClass = document.getElementById("reportClassFilter").value;
  const studentSelect = document.getElementById("reportStudentFilter");

  let filteredAtts = reportData.attendances;
  if (selectedClass !== "ALL") {
    filteredAtts = filteredAtts.filter(a => a.班級 === selectedClass);
  }

  const studentSet = new Set();
  filteredAtts.forEach(a => {
    if (a.缺席學生 && a.缺席學生 !== '全勤') {
      const items = a.缺席學生.split(', ');
      items.forEach(st => studentSet.add(st.trim()));
    }
  });

  const students = Array.from(studentSet).sort((a, b) => {
    const numA = parseInt(a.match(/^\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.match(/^\d+/)?.[0] || '0', 10);
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  studentSelect.innerHTML = `<option value="ALL">全選 (所有學生)</option>` + 
    students.map(st => `<option value="${st}">${st}</option>`).join('');

  renderAbsentReportTable();
}

function renderAbsentReportTable() {
  const selectedClass = document.getElementById("reportClassFilter").value;
  const selectedStudent = document.getElementById("reportStudentFilter").value;
  const sortOrder = document.getElementById("reportSortOrder").value;
  const absentBody = document.getElementById("absentReportBody");

  let list = [...reportData.attendances];

  if (selectedClass !== "ALL") {
    list = list.filter(a => a.班級 === selectedClass);
  }

  if (selectedStudent !== "ALL") {
    list = list.filter(a => a.缺席學生 && a.缺席學生.includes(selectedStudent));
  }

  list.sort((a, b) => {
    const dateA = new Date(a.日期 || '1970-01-01');
    const dateB = new Date(b.日期 || '1970-01-01');
    return sortOrder === 'DESC' ? dateB - dateA : dateA - dateB;
  });

  if (list.length > 0) {
    absentBody.innerHTML = list.map(a => {
      let studentDisplay = a.缺席學生 || '全勤';

      if (selectedStudent !== "ALL") {
        const items = (a.缺席學生 || '').split(', ');
        const matchedItem = items.find(st => st.includes(selectedStudent));
        studentDisplay = matchedItem ? `<mark style="background:#f8d7da; color:#721c24; padding:2px 6px; border-radius:4px; font-weight:bold;">${matchedItem}</mark>` : selectedStudent;
      }

      return `
        <tr>
          <td>${a.日期 || ''}</td>
          <td>${a.學校 || ''} - ${a.班級 || ''}</td>
          <td>${a.節次 || ''}</td>
          <td>${a.教師帳號 || a.點名教師帳號 || ''}</td>
          <td style="color:#d9534f;">${studentDisplay}</td>
        </tr>
      `;
    }).join('');
  } else {
    absentBody.innerHTML = `<tr><td colspan="5" style="color:#999;">查無符合條件的缺席紀錄</td></tr>`;
  }
}

// 🖨️ 列印缺席通知單 (支援彈出視窗與安全防封鎖檢查)
function printStudentReport() {
  const selectedClass = document.getElementById("reportClassFilter").value;
  const selectedStudent = document.getElementById("reportStudentFilter").value;
  const selectedSchool = document.getElementById("reportSchoolFilter")?.value || "";
  const selectedSemester = document.getElementById("reportSemesterFilter")?.value || "";
  const tableObj = document.querySelector("#absentTabContent .report-table");

  if (!tableObj) {
    alert("目前沒有可供列印的缺席表格資料！");
    return;
  }

  const tableHtml = tableObj.outerHTML;
  const todayStr = getTodayLocalDate();

  let cleanStudentName = (selectedStudent !== 'ALL') ? selectedStudent.replace(/[()]/g, '') : '全體學生';
  let pdfFileName = `${selectedClass !== 'ALL' ? selectedClass : '全校'}_${cleanStudentName}_缺席紀錄通知單_${todayStr}`;

  const printWindow = window.open('', '_blank', 'width=850,height=650');
  
  if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
    alert("⚠️ 列印視窗被瀏覽器阻擋！\n請允許此網站開啓「彈出式視窗 (Pop-ups)」後再試一次。");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${pdfFileName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC", "Microsoft JhengHei", sans-serif; padding: 25px; color: #333; }
          h2 { text-align: center; margin-bottom: 5px; letter-spacing: 0.05em; }
          .subtitle { text-align: center; font-size: 14px; color: #555; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1.5px solid #333; padding: 8px 10px; text-align: center; font-size: 14px; }
          th { background-color: #f2f4f2; font-weight: bold; }
          mark { background-color: transparent !important; color: #000 !important; font-weight: bold; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 14px; padding: 0 10px; }
          @page { size: auto; margin: 15mm; }
        </style>
      </head>
      <body>
        <h2>學生缺席紀錄通知單</h2>
        <div class="subtitle">
          學校/學期：${selectedSchool} (${selectedSemester}) &nbsp;|&nbsp; 班級：${selectedClass} &nbsp;|&nbsp; 查詢學生：${selectedStudent !== 'ALL' ? selectedStudent : '全體學生'} &nbsp;|&nbsp; 列印日期：${todayStr}
        </div>
        ${tableHtml}
        <div class="footer">
          <div>導師簽章：__________________</div>
          <div>家長簽章：__________________</div>
        </div>
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
  }, 300);
}

function renderReports() {
  renderAbsentReportTable();

  const summaryBody = document.getElementById("summaryReportBody");
  if (reportData.summaries && reportData.summaries.length > 0) {
    summaryBody.innerHTML = reportData.summaries.map(s => `
      <tr>
        <td>${s.日期 || ''}</td>
        <td>${s.學校 || ''} - ${s.班級 || ''}</td>
        <td>${s.節次 || ''}</td>
        <td>${s.教師帳號 || s.填寫教師帳號 || ''}</td>
        <td style="text-align:left;">${s.教學摘要 || ''}</td>
      </tr>
    `).join('');
  } else {
    summaryBody.innerHTML = `<tr><td colspan="5" style="color:#999;">查無教學摘要紀錄</td></tr>`;
  }
}

function copySummaries() {
  const text = reportData.summaries.map(s => 
    `【${s.日期} ${s.班級} ${s.節次}】${s.教學摘要}`
  ).join('\n');

  navigator.clipboard.writeText(text).then(() => {
    alert("📋 已將全學期教學摘要複製至剪貼簿！");
  });
}

function exportToExcel() {
  let csvContent = "\uFEFF"; 
  csvContent += "=== 缺席紀錄統計 ===\n日期,學期,學校,班級,節次,填報教師,缺席學生\n";
  reportData.attendances.forEach(a => {
    csvContent += `"${a.日期}","${a.學期}","${a.學校}","${a.班級}","${a.節次}","${a.教師帳號}","${a.缺席學生}"\n`;
  });

  csvContent += "\n=== 教學摘要紀錄 ===\n日期,學期,學校,班級,節次,填報教師,教學摘要\n";
  reportData.summaries.forEach(s => {
    csvContent += `"${s.日期}","${s.學期}","${s.學校}","${s.班級}","${s.節次}","${s.教師帳號}","${s.教學摘要}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `點名與教學摘要彙整報表_${getTodayLocalDate()}.csv`;
  link.click();
}

// PWA 安裝提示按鈕邏輯
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('pwaInstallBtn');
  if (btn) btn.classList.remove('hidden');
});

async function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    const btn = document.getElementById('pwaInstallBtn');
    if (btn) btn.classList.add('hidden');
  }
  deferredPrompt = null;
}