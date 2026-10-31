# 🏫 學校點名與課表系統建置與使用教學手冊 (System Manual)

本手冊提供從零開始建置、部署至日常操作的完整 Step-by-Step 指引，並附上專案所有前端與後端的**完整原碼**。

---

## 📋 目錄

1. [系統架構與特色](#1-系統架構與特色)
2. [第一階段：後端 Google 試算表與 GAS 部署](#第一階段後端-google-試算表與-gas-部署)
   * [Step 1. 建立 Google 試算表工作表](#step-1-建立-google-試算表工作表)
   * [Step 2. 貼入 Code.gs 完整程式碼](#step-2-貼入-codegs-完整程式碼)
   * [Step 3. 部署 Web App](#step-3-部署-web-app)
3. [第二階段：前端專案檔案配置與完整程式碼](#第二階段前端專案檔案配置與完整程式碼)
   * [📄 index.html (主結構)](#-indexhtml-主結構)
   * [🎨 style.css (樣式檔)](#-stylecss-樣式檔)
   * [⚙️ script.js (邏輯檔)](#️-scriptjs-邏輯檔)
   * [📱 manifest.json (PWA 宣告)](#-manifestjson-pwa-宣告)
   * [⚡ sw.js (離線快取)](#-swjs-離線快取)
4. [第三階段：發布與上線測試 (GitHub Pages / Live Server)](#第三階段發布與上線測試-github-pages--live-server)
5. [第四階段：使用者權限與日常操作指南](#第四階段使用者權限與日常操作指南)
6. [常見問題與維護注意事項](#常見問題與維護注意事項)

---

## 1. 系統架構與特色

* **前端 (Frontend)**：原生 HTML5 / CSS3 / ES6 JavaScript（模組化切分，具備 PWA 支援與響應式切換）。
* **後端 (Backend)**：Google Apps Script (GAS) Web App API。
* **資料庫 (Database)**：Google 試算表 (Google Sheets)。
* **關鍵技術**：
  * **角色權限管理**：最高管理者 (`admin`) 放行、導師 (`homeroom`) 帶班與個人檢視、科任 (`teacher`) 個人存取。
  * **本地時區修正**：使用 `getTodayLocalDate()` 解決 `toISOString()` 跨午夜（UTC+8）日期落後一天問題。
  * **自然數排序**：班級（701, 702...）與學生（01, 02...）全數經過自然排序處理。
  * **假別循環點名**：預設出席 ➔ 病假 ➔ 事假 ➔ 公假 ➔ 遲到 ➔ 曠課。
  * **一鍵 PDF 簽名報表**：自動格式化報表標題與檔名，帶有導師/家長簽章欄。

---

## 第一階段：後端 Google 試算表與 GAS 部署

### Step 1. 建立 Google 試算表工作表

在 Google 雲端硬碟建立全新的「Google 試算表」，並建立以下 7 個工作表（頁籤）。第 1 列為標題列，文字必須完全精準一致：

1. **`帳號管理`**：`帳號` | `密碼` | `姓名` | `權限` | `帶班班級`
   * *權限值範例：`admin` (管理者)、`homeroom` (導師)、`teacher` (科任教師)。*
2. **`作息時間表`**：`學校` | `節次` | `開始時間` | `結束時間`
3. **`課表`**：`學期` | `學校` | `班級` | `星期` | `節次` | `科目` | `教師帳號`
4. **`學生名單`**：`學期` | `學校` | `班級` | `座號` | `學號` | `姓名` | `狀態`
   * *狀態欄位：填寫 `在學` 或空白；若非在學請填 `轉學` 或 `休學`（系統將自動排除）。*
5. **`座位設定`**：`學期` | `學校` | `班級` | `欄數X` | `列數Y` | `無效座位` | `座位資料`
6. **`點名紀錄`**：`學期` | `學校` | `日期` | `節次` | `班級` | `學號` | `姓名` | `狀態` | `點名教師帳號`
7. **`教學摘要紀錄`**：`學期` | `學校` | `日期` | `節次` | `班級` | `教學摘要內容` | `填寫教師帳號`

---

### Step 2. 貼入 `Code.gs` 完整程式碼

點擊試算表選單 **「擴充功能」➔「Apps Script」**，清空後貼入以下完整原碼：

```javascript
// ------------------------------------------------------------------
// 學校點名與課表系統 - 後端 API (Code.gs)
// ------------------------------------------------------------------

function doPost(e) {
  try {
    var request = JSON.parse(e.postData.contents);
    var action = request.action;
    var result = {};

    switch (action) {
      case "login":
        result = handleLogin(request.account, request.password);
        break;
      case "getInitialData":
        result = handleGetInitialData(request.account, request.role);
        break;
      case "saveSeating":
        result = handleSaveSeating(request);
        break;
      case "saveAttendance":
        result = handleSaveAttendance(request);
        break;
      case "getSummaryReports":
        result = handleGetSummaryReports(request);
        break;
      default:
        result = { status: "error", message: "未知的 action 指令" };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "伺服器發生錯誤：" + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 1. 帳號登入 (同時相容「權限」與「權限角色」欄位，並清除多餘空白與大小寫)
function handleLogin(account, password) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("帳號管理");
  var data = getSheetDataAsObjects(sheet);

  var user = data.find(function(item) {
    return String(item.帳號).trim() === String(account).trim() && 
           String(item.密碼).trim() === String(password).trim();
  });

  if (user) {
    var rawRole = user.權限 || user.權限角色 || "teacher";
    var cleanRole = String(rawRole).toLowerCase().trim();
    
    return {
      status: "success",
      user: {
        account: user.帳號,
        name: user.姓名,
        role: cleanRole, // "admin", "homeroom", "teacher"
        classHandled: user.帶班班級 || user.班級 || ""
      }
    };
  } else {
    return { status: "error", message: "帳號或密碼錯誤！" };
  }
}

// 2. 抓取初始化資料 (作息、課表、學生名單、座位設定)
function handleGetInitialData(account, role) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var times = getSheetDataAsObjects(ss.getSheetByName("作息時間表"));
  var schedules = getSheetDataAsObjects(ss.getSheetByName("課表"));
  var allStudents = getSheetDataAsObjects(ss.getSheetByName("學生名單"));
  var seatings = getSheetDataAsObjects(ss.getSheetByName("座位設定"));

  // 自動排除非「在學」學生
  var activeStudents = allStudents.filter(function(st) {
    var status = String(st.狀態 || "").trim();
    return status === "" || status === "在學";
  });

  return {
    status: "success",
    data: {
      times: times,
      schedules: schedules,
      students: activeStudents,
      seatings: seatings
    }
  };
}

// 3. 儲存座位表設定
function handleSaveSeating(req) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("座位設定");
  var data = sheet.getDataRange().getDisplayValues();

  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(req.學期) &&
        String(data[i][1]) === String(req.學校) &&
        String(data[i][2]) === String(req.className)) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowData = [
    req.學期, req.學校, req.className, req.cols, req.rows,
    JSON.stringify(req.disabledSeats || []), JSON.stringify(req.seatData || {})
  ];

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { status: "success", message: "座位設定已成功更新！" };
}

// 4. 儲存 / 歷史覆寫點名紀錄 (含缺席原因與摘要)
function handleSaveAttendance(req) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var attSheet = ss.getSheetByName("點名紀錄");
  var sumSheet = ss.getSheetByName("教學摘要紀錄");

  // A. 刪除同日、同班、同節次之舊紀錄 (Upsert 歷史覆寫)
  var attData = attSheet.getDataRange().getDisplayValues();
  for (var i = attData.length - 1; i >= 1; i--) {
    if (String(attData[i][2]) === String(req.date) &&
        String(attData[i][1]) === String(req.school) &&
        String(attData[i][4]) === String(req.className) &&
        String(attData[i][3]) === String(req.period)) {
      attSheet.deleteRow(i + 1);
    }
  }

  // B. 寫入缺席學生與假別狀態
  if (req.absentees && req.absentees.length > 0) {
    req.absentees.forEach(function(st) {
      attSheet.appendRow([
        req.semester,
        req.school,
        req.date,
        req.period,
        req.className,
        st.id,
        st.name,
        st.reason || "缺席",
        req.account
      ]);
    });
  }

  // C. 寫入或更新教學摘要紀錄
  if (req.summary) {
    var sumData = sumSheet.getDataRange().getDisplayValues();
    var sumRowIndex = -1;

    for (var j = 1; j < sumData.length; j++) {
      if (String(sumData[j][2]) === String(req.date) &&
          String(sumData[j][1]) === String(req.school) &&
          String(sumData[j][4]) === String(req.className) &&
          String(sumData[j][3]) === String(req.period)) {
        sumRowIndex = j + 1;
        break;
      }
    }

    var sumRowData = [
      req.semester, req.school, req.date, req.period, req.className, req.summary, req.account
    ];

    if (sumRowIndex > -1) {
      sumSheet.getRange(sumRowIndex, 1, 1, sumRowData.length).setValues([sumRowData]);
    } else {
      sumSheet.appendRow(sumRowData);
    }
  }

  return { status: "success", message: "點名紀錄與教學摘要已成功更新！" };
}

// 5. 抓取期末統計 (admin 角色最高權限無條件 100% 優先放行)
function handleGetSummaryReports(req) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rawAttendances = getSheetDataAsObjects(ss.getSheetByName("點名紀錄"));
  var rawSummaries = getSheetDataAsObjects(ss.getSheetByName("教學摘要紀錄"));

  // A. 將同日同班同節次的缺席學生進行群組合併
  var groupedMap = {};
  rawAttendances.forEach(function(row) {
    var key = row.日期 + "_" + row.學校 + "_" + row.班級 + "_" + row.節次;
    var teacherAcc = row.點名教師帳號 || row.填寫教師帳號 || row.教師帳號 || "";

    if (!groupedMap[key]) {
      groupedMap[key] = {
        日期: row.日期,
        學期: row.學期,
        學校: row.學校,
        班級: row.班級,
        節次: row.節次,
        教師帳號: teacherAcc,
        students: []
      };
    }

    var idNum = row.學號 || row.座號 || "";
    var reason = row.狀態 || "缺席";
    var nameStr = idNum ? (idNum + " " + row.姓名 + "(" + reason + ")") : (row.姓名 + "(" + reason + ")");
    groupedMap[key].students.push(nameStr);
  });

  var groupedAttendances = [];
  for (var k in groupedMap) {
    var item = groupedMap[k];
    item.缺席學生 = item.students.join(", ");
    delete item.students;
    groupedAttendances.push(item);
  }

  var formattedSummaries = rawSummaries.map(function(s) {
    return {
      日期: s.日期 || "",
      學期: s.學期 || "",
      學校: s.學校 || "",
      班級: s.班級 || "",
      節次: s.節次 || "",
      教師帳號: s.填寫教師帳號 || s.點名教師帳號 || s.教師帳號 || "",
      教學摘要: s.教學摘要內容 || s.教學摘要 || ""
    };
  });

  // 💡 B. admin 角色直接全數放行
  var reqRole = String(req.role || "").toLowerCase().trim();
  
  if (reqRole === "admin") {
    return {
      status: "success",
      attendances: groupedAttendances,
      summaries: formattedSummaries
    };
  }

  // C. 一般教師 (homeroom / teacher) 的權限過濾邏輯
  var filteredAttendances = groupedAttendances.filter(function(a) {
    var matchSchool = !req.school || a.學校 === req.school;
    var matchSemester = !req.semester || a.學期 === req.semester;
    var matchPermission = (reqRole === "homeroom") 
      ? ((req.classHandled && a.班級 === req.classHandled) || a.教師帳號 === req.account) 
      : (a.教師帳號 === req.account);
      
    return matchSchool && matchSemester && matchPermission;
  });

  var filteredSummaries = formattedSummaries.filter(function(s) {
    var matchSchool = !req.school || s.學校 === req.school;
    var matchSemester = !req.semester || s.學期 === req.semester;
    var matchPermission = (reqRole === "homeroom") 
      ? ((req.classHandled && s.班級 === req.classHandled) || s.教師帳號 === req.account) 
      : (s.教師帳號 === req.account);
      
    return matchSchool && matchSemester && matchPermission;
  });

  return {
    status: "success",
    attendances: filteredAttendances,
    summaries: filteredSummaries
  };
}

// 輔助函式：將工作表內容轉為 JavaScript 物件陣列
function getSheetDataAsObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) return [];

  var headers = data[0];
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var obj = {};
    var hasValue = false;
    for (var j = 0; j < headers.length; j++) {
      var headerName = String(headers[j]).trim();
      if (headerName) {
        var cellValue = String(data[i][j]).trim();
        obj[headerName] = cellValue;
        if (cellValue !== "") hasValue = true;
      }
    }
    if (hasValue) result.push(obj);
  }
  return result;
}
```

---

### Step 3. 部署 Web App

1. 點擊右上角 **「部署」 ➔ 「新增部署」**（若更新程式則選擇「管理部署」➔ 點擊鉛筆修改）。
2. 點擊齒輪圖示選取 **「Web 應用程式 (Web App)」**。
3. 關鍵參數設定：
   * **執行身份**：`我 (Me)`
   * **誰有存取權**：`所有人 (Anyone)`
   * **版本**：`新版本 (New Version)` *(每次修改程式碼必須選新版本)*
4. 點擊 **「部署」**，完成 GCP 授權，並複製出生成的 **Web App URL**。

---

## 第二階段：前端專案檔案配置與完整程式碼

請在前端專案資料夾根目錄建立以下 5 個獨立檔案：

### 📄 `index.html` (主結構)

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>學校點名與課表系統</title>
  
  <!-- PWA 宣告檔 -->
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#a8c3b0">
  <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/3429/3429149.png">

  <!-- 引入外部 CSS -->
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <header>
    <h2>學校點名與課表系統</h2>
    <div>
      <button onclick="toggleTheme()" style="padding:6px 12px;">☀️/🌙</button>
      <button id="logoutBtn" class="hidden btn-secondary" onclick="logout()" style="padding:6px 12px;">登出</button>
    </div>
  </header>

  <div class="container">
    
    <!-- 1. 登入區塊 -->
    <div id="loginView" class="card" style="max-width:400px; margin: 40px auto;">
      <h3 style="margin-top:0;">🔐 帳號登入</h3>
      <div class="form-group">
        <label>帳號</label>
        <input type="text" id="accInput" placeholder="請輸入帳號 (例：admin 或 A001)">
      </div>
      <div class="form-group">
        <label>密碼</label>
        <input type="password" id="pwdInput" placeholder="請輸入密碼">
      </div>
      <button onclick="handleLogin()" style="width:100%;">登入系統</button>
      <p id="loginMsg" style="color:#d9534f; text-align:center; margin-top:10px;"></p>
    </div>

    <!-- 2. 首頁課表區塊 -->
    <div id="mainView" class="card hidden">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
        <h3 id="welcomeMsg" style="margin:0;">歡迎使用</h3>
        <button onclick="showReportView()" class="btn-outline">📊 期末紀錄與彙整查詢</button>
      </div>

      <!-- 學期鎖定與選擇列 -->
      <div style="display:flex; gap:10px; margin-bottom:15px; align-items:center; background:var(--empty-cell); padding:10px; border-radius:8px;">
        <div style="flex:1;">
          <label style="font-size:12px; margin:0;">🔒 學期鎖定：</label>
          <select id="semesterSelect" onchange="renderTimetable()"></select>
        </div>
        <div style="flex:1;">
          <label style="font-size:12px; margin:0;">🏫 學校選擇：</label>
          <select id="schoolSelect" onchange="renderTimetable()"></select>
        </div>
        <div style="flex:1;" id="teacherSelectBox" class="hidden">
          <label style="font-size:12px; margin:0;">👤 教師篩選：</label>
          <select id="teacherSelect" onchange="renderTimetable()"></select>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table class="timetable">
          <thead>
            <tr>
              <th>節次 / 時間</th>
              <th>星期一</th>
              <th>星期二</th>
              <th>星期三</th>
              <th>星期四</th>
              <th>星期五</th>
            </tr>
          </thead>
          <tbody id="timetableBody"></tbody>
        </table>
      </div>
    </div>

    <!-- 3. 點名與座位表區塊 -->
    <div id="attendanceView" class="card hidden">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
        <button onclick="backToMain()" class="btn-secondary">← 返回課表</button>
        <div style="display:flex; align-items:center; gap:8px;">
          <h3 id="attendanceTitle" style="margin:0;">班級點名</h3>
          <input type="date" id="attendanceDate" onchange="onDateChange()" style="padding:6px 10px; width:auto; font-size:14px;">
        </div>
        <button id="editSeatBtn" onclick="toggleEditMode()" class="btn-secondary">⚙️ 排座位</button>
      </div>

      <div class="podium">講 台 方 向</div>

      <div id="seatingGrid" class="seating-grid"></div>

      <div style="font-size:13px; color:#666; margin-bottom:15px; background:var(--empty-cell); padding:8px 12px; border-radius:6px;">
        💡 <b>點擊座位說明：</b> 預設全勤 ➔ 病假 ➔ 事假 ➔ 公假 ➔ 遲到 ➔ 曠課 ➔ 恢復出席
      </div>

      <div class="form-group">
        <label>📝 當堂教學摘要：</label>
        <textarea id="summaryInput" rows="3" placeholder="請輸入本次課程教學進度或備註..."></textarea>
      </div>

      <button onclick="submitAttendance()" style="width:100%; padding:14px; font-size:16px;">🚀 送出點名與教學摘要</button>
    </div>

    <!-- 4. 期末查詢與匯出區塊 -->
    <div id="reportView" class="card hidden">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <button onclick="backToMainFromReport()" class="btn-secondary">← 返回課表</button>
        <h3 style="margin:0;">📊 期末紀錄與匯出</h3>
        <button onclick="exportToExcel()" style="background-color:#28a745;">📥 匯出 Excel (CSV)</button>
      </div>

      <div class="tab-bar">
        <button class="tab-btn active" onclick="switchReportTab('absent')">🚨 缺席紀錄統計</button>
        <button class="tab-btn" onclick="switchReportTab('summary')">📝 全學期教學摘要</button>
      </div>

      <!-- 缺席統計分頁 -->
      <div id="absentTabContent">
        <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap; align-items:center; background:var(--empty-cell); padding:12px; border-radius:8px;">
          <div style="flex:1; min-width:140px;">
            <label style="font-size:12px; margin-bottom:2px;">🏫 選擇班級：</label>
            <select id="reportClassFilter" onchange="onReportClassChange()" style="padding:6px 10px; font-size:14px;">
              <option value="ALL">全選 (所有班級)</option>
            </select>
          </div>
          <div style="flex:1; min-width:160px;">
            <label style="font-size:12px; margin-bottom:2px;">👤 選擇學生：</label>
            <select id="reportStudentFilter" onchange="renderAbsentReportTable()" style="padding:6px 10px; font-size:14px;">
              <option value="ALL">全選 (所有學生)</option>
            </select>
          </div>
          <div style="flex:0.8; min-width:130px;">
            <label style="font-size:12px; margin-bottom:2px;">📅 日期排序：</label>
            <select id="reportSortOrder" onchange="renderAbsentReportTable()" style="padding:6px 10px; font-size:14px;">
              <option value="DESC">最新 ➔ 最舊</option>
              <option value="ASC">最舊 ➔ 最新</option>
            </select>
          </div>
          <div style="flex:0.6; min-width:110px; display:flex; align-items:flex-end;">
            <button onclick="printStudentReport()" style="background-color:#17a2b8; width:100%; padding:8px; font-size:14px;">🖨️ 列印報表</button>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table class="report-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>學校 / 班級</th>
                <th>節次</th>
                <th>填報教師</th>
                <th>缺席學生與假別</th>
              </tr>
            </thead>
            <tbody id="absentReportBody"></tbody>
          </table>
        </div>
      </div>

      <!-- 教學摘要分頁 -->
      <div id="summaryTabContent" class="hidden">
        <button onclick="copySummaries()" class="btn-outline" style="margin-bottom:10px;">📋 一鍵複製全學期摘要文字</button>
        <div style="overflow-x:auto;">
          <table class="report-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>學校 / 班級</th>
                <th>節次</th>
                <th>填報教師</th>
                <th>教學摘要內容</th>
              </tr>
            </thead>
            <tbody id="summaryReportBody"></tbody>
          </table>
        </div>
      </div>
    </div>

  </div>

  <!-- 引入外部 JavaScript -->
  <script src="script.js"></script>
</body>
</html>
```

---

### 🎨 `style.css` (樣式檔)

```css
:root {
  --bg-color: #f7f9f6;             /* 米綠淺色背景 */
  --card-bg: #ffffff;             
  --text-color: #38423b;           
  --primary-color: #6e8b74;        /* 抹茶綠主色 */
  --primary-hover: #5d7763;
  --border-color: #d1dad3;         
  --table-border-color: #a8b8ac;   /* 加深 1.5px 表格網格線 */
  --empty-cell: #f2f4f1;
  
  --header-bg: #a8c3b0;            /* 頂部霧綠列 */
  --header-text: #2f4033;          
  --table-header-bg: #c5d8cb;      
  --table-header-text: #2f4033;    
  --class-cell-bg: #e4efe7;        
  --class-cell-hover: #d3e4d7;     
  
  --seat-present: #e4efe7;
  --seat-disabled: #e9ecef;
}

[data-theme="dark"] {
  --bg-color: #1a201c;             
  --card-bg: #242c26;             
  --text-color: #dce3dd;           
  --primary-color: #5d7a64;        
  --primary-hover: #4e6854;
  --border-color: #323d35;
  --table-border-color: #4a5c4e;   
  --empty-cell: #1f2621;

  --header-bg: #2d3b31;
  --header-text: #dce3dd;
  --table-header-bg: #354539;      
  --table-header-text: #dce3dd;    
  --class-cell-bg: #2b3b2f;        
  --class-cell-hover: #36493a;     

  --seat-present: #2b3b2f;
  --seat-disabled: #2d3238;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC", "Microsoft JhengHei", sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  margin: 0; padding: 0;
  letter-spacing: 0.03em;
  line-height: 1.6;
}

.container {
  max-width: 950px;
  margin: 0 auto;
  padding: 20px;
}

header {
  background-color: var(--header-bg);
  color: var(--header-text);
  padding: 18px 24px;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1.5px solid var(--table-border-color);
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}

header h2 { font-weight: 600; font-size: 1.25rem; margin: 0; color: var(--header-text); }

.card {
  background-color: var(--card-bg);
  border-radius: 12px; padding: 24px; margin-top: 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
}

.form-group { margin-bottom: 15px; }
label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem; opacity: 0.85; }

input, select, textarea {
  width: 100%; padding: 10px 14px;
  border: 1.5px solid var(--table-border-color);
  border-radius: 8px; box-sizing: border-box; font-size: 15px;
  background-color: var(--card-bg); color: var(--text-color);
}

button {
  padding: 10px 16px; background-color: var(--primary-color); color: white;
  border: none; border-radius: 8px; font-weight: 500; font-size: 15px; cursor: pointer;
  transition: background-color 0.2s;
}

button:hover { background-color: var(--primary-hover); }
.btn-secondary { background-color: #6c757d; }
.btn-secondary:hover { background-color: #5a6268; }
.btn-outline { background-color: transparent; color: var(--text-color); border: 1.5px solid var(--table-border-color); }
.hidden { display: none !important; }

/* 課表與表格網格樣式 */
.timetable, .report-table {
  width: 100%; border-collapse: collapse; margin-top: 10px; text-align: center;
  border-radius: 8px; overflow: hidden; border: 1.5px solid var(--table-border-color);
}
.timetable th, .timetable td, .report-table th, .report-table td {
  border: 1.5px solid var(--table-border-color); padding: 12px 8px; font-size: 14px;
}
.timetable th, .report-table th { background-color: var(--table-header-bg); color: var(--table-header-text); font-weight: 600; }
.timetable td.has-class { background-color: var(--class-cell-bg); cursor: pointer; font-weight: 600; }
.timetable td.has-class:hover { background-color: var(--class-cell-hover); }
.timetable td.empty { background-color: var(--empty-cell); color: #a0aab0; }

/* 座位表與假別色彩標記 */
.podium {
  background-color: var(--table-header-bg); color: var(--table-header-text);
  text-align: center; padding: 8px; border-radius: 6px; font-weight: 600; margin-bottom: 20px;
  border: 1.5px solid var(--table-border-color);
}

.seating-grid { display: grid; gap: 12px; margin-bottom: 20px; }

.seat-card {
  border: 1.5px solid var(--table-border-color); border-radius: 8px; padding: 8px;
  text-align: center; min-height: 65px; display: flex; flex-direction: column;
  justify-content: center; align-items: center; background-color: var(--seat-present);
  cursor: pointer; user-select: none; transition: all 0.2s ease;
}

/* 假別專屬色彩 */
.seat-card.reason-病假 { background-color: #fff3cd; border-color: #ffeeba; color: #856404; }
.seat-card.reason-事假 { background-color: #cce5ff; border-color: #b8daff; color: #004085; }
.seat-card.reason-公假 { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
.seat-card.reason-遲到 { background-color: #e2e3e5; border-color: #d6d8db; color: #383d41; }
.seat-card.reason-曠課, .seat-card.reason-缺席 { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; font-weight: bold; }
.seat-card.disabled { background-color: var(--seat-disabled); border-style: dashed; opacity: 0.6; }

/* 頁籤切換 */
.tab-bar { display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 2px solid var(--table-border-color); }
.tab-btn { background: none; color: var(--text-color); border: none; padding: 10px 18px; font-size: 15px; cursor: pointer; border-radius: 8px 8px 0 0; }
.tab-btn.active { background-color: var(--table-header-bg); font-weight: bold; border-bottom: 3px solid var(--primary-color); }
```

---

### ⚙️ `script.js` (邏輯檔)

```javascript
// ⚠️ 請填入您的 GAS Web App URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwprY_PF7P3JRSo84NAG_8scWiCp2UrCP5rGafu_jc8eVk1Hvmdc1-USQ7NEoue4hBp/exec";

let currentUser = null;
let appData = null;
let currentSession = {}; 
let currentGrid = { cols: 6, rows: 5, seats: {}, disabled: [] };
let currentAbsenteesMap = new Map();
const REASONS = ["出席", "病假", "事假", "公假", "遲到", "曠課"];
let reportData = { attendances: [], summaries: [] };

// 💡 取得本地 (台灣時間 UTC+8) YYYY-MM-DD 格式，解決跨午夜日期落後一天問題
function getTodayLocalDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

window.onload = function() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }

  const savedUser = localStorage.getItem("attendance_user");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showMainView();
  }
};

function toggleTheme() {
  const body = document.body;
  body.setAttribute("data-theme", body.getAttribute("data-theme") === "dark" ? "light" : "dark");
}

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
    msg.innerText = "連線失敗，請檢查網路或 API 網址";
  }
}

function logout() {
  localStorage.removeItem("attendance_user");
  currentUser = null;
  document.getElementById("loginView").classList.remove("hidden");
  document.getElementById("mainView").classList.add("hidden");
  document.getElementById("attendanceView").classList.add("hidden");
  document.getElementById("reportView").classList.add("hidden");
  document.getElementById("logoutBtn").classList.add("hidden");
}

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
    alert("資料載入失敗！");
  }
}

function initControls() {
  const schools = [...new Set(appData.times.map(t => t.學校))].filter(Boolean);
  const semesters = [...new Set(appData.schedules.map(s => s.學期))].filter(Boolean);

  document.getElementById("schoolSelect").innerHTML = schools.map(s => `<option value="${s}">${s}</option>`).join('');
  
  const semSelect = document.getElementById("semesterSelect");
  semSelect.innerHTML = semesters.map(s => `<option value="${s}">${s}</option>`).join('');
  if (semesters.length > 0) semSelect.value = semesters[semesters.length - 1];

  const box = document.getElementById("teacherSelectBox");
  if (currentUser.role === "admin") {
    box.classList.remove("hidden");
    const teacherSelect = document.getElementById("teacherSelect");
    const teachers = [...new Set(appData.schedules.map(s => s.教師帳號))].filter(Boolean);
    teacherSelect.innerHTML = `<option value="ALL">全體課表</option>` + 
      teachers.map(t => `<option value="${t}">${t}</option>`).join('');
  } else {
    box.classList.add("hidden");
  }
}

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
  
  const filteredSchedules = appData.schedules.filter(s => {
    const matchSchool = s.學校 === selectedSchool;
    const matchSemester = s.學期 === selectedSemester;
    const matchTeacher = (selectedTeacher === "ALL" || currentUser.role === "admin") ? true : (s.教師帳號 === currentUser.account || s.填寫教師帳號 === currentUser.account || s.教師帳號 === selectedTeacher);
    
    return matchSchool && matchSemester && matchTeacher;
  });

  const days = ["星期一", "星期二", "星期三", "星期四", "星期五"];
  const tbody = document.getElementById("timetableBody");
  tbody.innerHTML = "";

  periods.forEach(p => {
    let tr = document.createElement("tr");
    tr.innerHTML = `<td><b>${p.節次}</b><br><small style="color:#777">${p.開始時間}-${p.結束時間}</small></td>`;

    days.forEach(day => {
      const matchClass = filteredSchedules.find(s => s.星期 === day && s.節次 === p.節次);
      if (matchClass) {
        tr.innerHTML += `
          <td class="has-class" onclick="enterAttendance('${selectedSchool}', '${selectedSemester}', '${matchClass.班級}', '${matchClass.科目}', '${p.節次}')">
            ${matchClass.班級}<br><small>${matchClass.科目}</small>
          </td>`;
      } else {
        tr.innerHTML += `<td class="empty">-</td>`;
      }
    });
    tbody.appendChild(tr);
  });
}

// ----------------- 點名與座位假別切換 -----------------

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
    console.error("讀取歷史點名紀錄失敗：", err);
  }
}

function backToMain() {
  document.getElementById("attendanceView").classList.add("hidden");
  document.getElementById("mainView").classList.remove("hidden");
}

function loadSeatingData() {
  const saved = appData.seatings.find(s => 
    s.學校 === currentSession.school && s.學期 === currentSession.semester && s.班級 === currentSession.className
  );

  if (saved) {
    currentGrid.cols = parseInt(saved.欄數X) || 6;
    currentGrid.rows = parseInt(saved.列數Y) || 5;
    currentGrid.disabled = saved.無效座位 ? JSON.parse(saved.無效座位) : [];
    currentGrid.seats = saved.座位資料 ? JSON.parse(saved.座位資料) : {};
  } else {
    currentGrid.cols = 6; currentGrid.rows = 5; currentGrid.disabled = [];
    autoAssignSeatsVertical();
  }
}

function autoAssignSeatsVertical() {
  currentGrid.seats = {};
  const classStudents = appData.students.filter(s => 
    s.學校 === currentSession.school && s.學期 === currentSession.semester && s.班級 === currentSession.className
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
  gridContainer.style.gridTemplateColumns = `repeat(${currentGrid.cols}, 1fr)`;
  gridContainer.innerHTML = "";

  const classStudents = appData.students.filter(s => 
    s.學校 === currentSession.school && s.學期 === currentSession.semester && s.班級 === currentSession.className
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

async function submitAttendance() {
  const classStudents = appData.students.filter(s => 
    s.學校 === currentSession.school && s.學期 === currentSession.semester && s.班級 === currentSession.className
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

// ----------------- 期末報表與自然數排序、PDF 列印邏輯 -----------------

async function showReportView() {
  document.getElementById("mainView").classList.add("hidden");
  document.getElementById("reportView").classList.remove("hidden");

  const selectedSchool = document.getElementById("schoolSelect").value;
  const selectedSemester = document.getElementById("semesterSelect").value;

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
    alert("載入期末紀錄失敗！");
  }
}

function backToMainFromReport() {
  document.getElementById("reportView").classList.add("hidden");
  document.getElementById("mainView").classList.remove("hidden");
}

function switchReportTab(tab) {
  const btns = document.querySelectorAll(".tab-btn");
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
    if (numA !== numB) {
      return numA - numB;
    }
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

function printStudentReport() {
  const selectedClass = document.getElementById("reportClassFilter").value;
  const selectedStudent = document.getElementById("reportStudentFilter").value;
  const tableHtml = document.querySelector("#absentTabContent .report-table").outerHTML;
  const todayStr = getTodayLocalDate();

  let cleanStudentName = selectedStudent !== 'ALL' ? selectedStudent.replace(/[()]/g, '') : '全體學生';
  let pdfFileName = `${selectedClass !== 'ALL' ? selectedClass : '全校'}_${cleanStudentName}_缺席紀錄通知單_${todayStr}`;

  const printWindow = window.open('', '', 'width=850,height=650');
  printWindow.document.write(`
    <html>
      <head>
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
          班級：${selectedClass} &nbsp;|&nbsp; 查詢學生：${selectedStudent !== 'ALL' ? selectedStudent : '全體學生'} &nbsp;|&nbsp; 列印日期：${todayStr}
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
    printWindow.close();
  }, 250);
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
```

---

### 📱 `manifest.json` (PWA 宣告)

```json
{
  "name": "學校點名與課表系統",
  "short_name": "點名系統",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#a8c3b0",
  "icons": [
    {
      "src": "https://cdn-icons-png.flaticon.com/512/3429/3429149.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

### ⚡ `sw.js` (離線快取)

```javascript
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // 保持即時連線至 GAS API
});
```

---

## 第三階段：發布與上線測試 (GitHub Pages / Live Server)

由於現代瀏覽器限制 `file://` 直接開啟檔案載入 Service Worker 及安全 CORS 策略，請選用以下兩種方式測試：

### 🌐 1. 線上發布（GitHub Pages - 最推薦）
1. 將專案全部 5 個檔案提交（Push）至 GitHub 儲存庫（Repository）。
2. 進入儲存庫 **Settings ➔ Pages**。
3. Source 選擇 `Deploy from a branch`，Branch 選擇 `main` (或 `master`) ➔ `/root` 點擊 **Save**。
4. 約 1~2 分鐘後開啟產生的 `https://<your-username>.github.io/<repo-name>/` 網址即可完整使用！

### 💻 2. 電腦本機測試（VS Code Live Server）
1. 使用 VS Code 開啟專案資料夾。
2. 安裝擴充套件 **Live Server**。
3. 在 `index.html` 按右鍵選 **「Open with Live Server」**（透過 `http://127.0.0.1:5500` 開啟），即可排除 CORS 阻擋。

---

## 第四階段：使用者權限與日常操作指南

### 1. 權限分流設定
* **管理者 (`admin`)**：
  * 試算表 D1 欄位標題可為 `權限` 或 `權限角色`，值必須填寫小寫 **`admin`**。
  * 「帶班班級」請**留空**。登入後可切換選擇全校所有教師與班級課表。
* **班級導師 (`homeroom`)**：
  * 「帶班班級」填寫如 `704`。可檢視 704 班所有科目的點名與缺席，並可進行個人授課節次點名。
* **科任教師 (`teacher`)**：
  * 僅顯示個人授課的課表與班級，確保資訊安全。

### 2. 日常點名與假別切換
1. 在課表中點擊有課的綠色格子進入點名頁面。
2. 點擊學生座位區可循環切換假別：
   * **點 1 下**：`病假`（黃色）
   * **點 2 下**：`事假`（藍色）
   * **點 3 下**：`公假`（綠色）
   * **點 4 下**：`遲到`（灰色）
   * **點 5 下**：`曠課`（紅色）
   * **點 6 下**：恢復 `出席`
3. 在下方文字框輸入當堂「教學摘要」。
4. 點擊 **「🚀 送出點名與教學摘要」**。

### 3. 一鍵 PDF 報表匯出與簽章
1. 點擊右上角 **「📊 期末紀錄與彙整查詢」**。
2. 選擇指定班級與學生（下拉選單具備自然數排序）。
3. 點擊 **「🖨️ 列印報表」**。
4. 瀏覽器彈出列印視窗，目的端選擇 **「另存為 PDF」**。
5. 預設檔名將自動帶入 `班級_學生姓名_缺席紀錄通知單_日期.pdf`，底部帶有導師與家長簽章欄位，可直接存檔列印。

---

## 常見問題與維護注意事項

1. **修改後端程式碼後沒反應？**
   * 修改 `Code.gs` 後，必須點選 **「部署」 ➔ 「管理部署」 ➔ 點鉛筆圖示 ➔ 版本選擇『新版本』** 再點擊部署才會更新生效！
2. **管理者登入後看不到班級選單？**
   * 請確認「帳號管理」工作表中的權限字尾是否多按了空白鍵。點擊網頁「登出」後重新登入即可。
3. **跨午夜日期顯示為前一天？**
   * 本系統 `script.js` 採用 `getTodayLocalDate()` 本地時區（UTC+8）算式，已徹底修復 `toISOString()` 導致跨午夜日期偏落後一天的現象。