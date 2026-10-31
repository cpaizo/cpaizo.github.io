# 🏫 學校點名與課表系統 (PWA) - 系統操作與維護手冊

本手冊提供「學校點名與課表系統」的完整架構說明、系統部署方式、功能操作指南與維護規格，方便管理員與教師快速上手與管理。

---

## 📌 目錄

1. [系統簡介與特色](https://www.google.com/search?q=%231-%E7%B3%BB%E7%B5%B1%E7%B0%A1%E4%BB%8B%E8%88%87%E7%89%B9%E8%89%B2)
2. [系統架構與部署指南](https://www.google.com/search?q=%232-%E7%B3%BB%E7%B5%B1%E6%9E%B6%E6%A7%8B%E8%88%87%E9%83%A8%E7%BD%B2%E6%8C%87%E5%8D%97)
3. [資料庫 (Google 試算表) 結構說明](https://www.google.com/search?q=%233-%E8%B3%87%E6%96%99%E5%BA%AB-google-%E8%A9%A6%E7%AE%97%E8%A1%A8-%E7%B5%90%E6%A7%8B%E8%AA%AA%E6%98%8E)
4. [使用者功能操作指南](https://www.google.com/search?q=%234-%E4%BD%BF%E7%94%A8%E8%80%85%E5%8A%9F%E8%83%BD%E6%93%8D%E4%BD%9C%E6%8C%87%E5%8D%97)
* [4.1 登入與身份切換](https://www.google.com/search?q=%2341-%E7%99%BB%E5%85%A5%E8%88%87%E8%BA%AB%E4%BB%BD%E5%88%87%E6%8F%9B)
* [4.2 課表檢視與管理者功能](https://www.google.com/search?q=%2342-%E8%AA%B2%E8%A1%A8%E6%AA%A2%E8%A6%96%E8%88%87%E7%AE%A1%E7%90%86%E8%80%85%E5%8A%9F%E8%83%BD)
* [4.3 點名與教學摘要紀錄](https://www.google.com/search?q=%2343-%E9%BB%9E%E5%90%8D%E8%88%87%E6%95%99%E5%AD%B8%E6%91%98%E8%A6%81%E7%B4%80%E9%8C%84)
* [4.4 班級座位與走道佈局設定 (Modal)](https://www.google.com/search?q=%2344-%E7%8F%AD%E7%B4%9A%E5%BA%A7%E4%BD%8D%E8%88%87%E8%B5%B0%E9%81%93%E4%BD%88%E5%B1%80%E8%A8%AD%E5%AE%9A-modal)
* [4.5 期末統計與報表 (缺席通知單列印)](https://www.google.com/search?q=%2345-%E6%9C%9F%E6%9C%AB%E7%B5%B1%E8%A8%88%E8%88%87%E5%A0%B1%E8%A1%A8-%E7%BC%BA%E5%B8%AD%E9%80%9A%E7%9F%A5%E5%96%AE%E5%88%97%E5%8D%B0)


5. [前端與後端完整程式碼範例](https://www.google.com/search?q=%235-%E5%89%8D%E7%AB%AF%E8%88%87%E5%BE%8C%E7%AB%AF%E5%AE%8C%E6%95%B4%E7%A8%8B%E5%BC%8F%E7%A2%BC%E7%AF%84%E4%BE%8B)
* [5.1 Code.gs (Apps Script 後端 API)](https://www.google.com/search?q=%2351-codegs-apps-script-%E5%BE%8C%E7%AB%AF-api)
* [5.2 index.html (前端 PWA 架構)](https://www.google.com/search?q=%2352-indexhtml-%E5%89%8D%E7%AB%AF-pwa-%E6%9E%B6%E6%A7%8B)
* [5.3 style.css (日系淺綠 UI 與滿版自適應)](https://www.google.com/search?q=%2353-stylecss-%E6%97%A5%E7%B3%BB%E6%B7%BA%E7%B6%A0-ui-%E8%88%87%E6%BB%BF%E7%89%88%E8%87%AA%E9%81%A9%E6%87%89)
* [5.4 script.js (前端全功能主邏輯)](https://www.google.com/search?q=%2354-scriptjs-%E5%89%8D%E7%AB%AF%E5%85%A8%E5%8A%9F%E8%83%BD%E4%B8%BB%E9%82%8F%E8%BC%AF)



---

## 1. 系統簡介與特色

* **PWA 跨平台支援**：支援手機、平板與桌機使用，可新增至主畫面作為 App 離線啟動。
* **日系淺綠色彩設計**：採用柔和的高對比色彩與卡片式視圖，提供舒適無壓力的教學操作介面。
* **Google 試算表極速後端**：以 Google Apps Script (GAS) Web App 搭配 Google Sheet 作為免費且穩定的雲端資料庫。
* **滿版自適應座位佈局 Modal**：針對高密度座位需求（Y 軸 8～10 列）進行優化，頂部整合控制列，支援單手操作與直排動態重排。
* **兩兩快速對調座位**：點擊選擇兩個座位卡片即可瞬時對調位置或切換走道設定。
* **資料庫覆寫 (Upsert) 機制**：依「學期 + 學校 + 班級」進行比對，自動修正既有資料而不重複新增列。
* **期末通知單列印與匯出**：支援按學校、學期、班級與學生篩選缺席紀錄，可一鍵產生帶有簽章欄位的 PDF 通知單或匯出 CSV。

---

## 2. 系統架構與部署指南

### 步驟 A：建立 Google 試算表資料庫

1. 開啟 [Google 雲端硬碟](https://drive.google.com/)，建立一份新的 Google 試算表。
2. 依照 [3. 資料庫結構說明](https://www.google.com/search?q=%233-%E8%B3%87%E6%96%99%E5%BA%AB-google-%E8%A9%A6%E7%AE%97%E8%A1%A8-%E7%B5%90%E6%A7%8B%E8%AA%AA%E6%98%8E) 建立以下 6 個工作表：
* `帳號管理`
* `作息時間表`
* `課表`
* `學生名單`
* `座位設定`
* `點名紀錄`
* `教學摘要紀錄`



### 步驟 B：部署 Apps Script 後端 API

1. 在試算表上方選單點選 **「擴充功能」 $\rightarrow$ 「Apps Script」**。
2. 將預設程式碼清空，貼入本手冊 [5.1 Code.gs](https://www.google.com/search?q=%2351-codegs-apps-script-%E5%BE%8C%E7%AB%AF-api) 的完整程式碼。
3. 點選右上方 **「部署」 $\rightarrow$ 「新增部署」**。
4. 部署設定：
* 種類選擇：**Web 應用程式 (Web App)**
* 執行身份：**我的帳戶 (Me)**
* 誰有存取權：**所有人 (Anyone)**


5. 點擊 **「部署」** 並授權權限，複製產生的 **Web App URL**。

### 步驟 C：設定前端檔案

1. 將本手冊提供的 `index.html`、`style.css`、`script.js` 與 `manifest.json` 放至您的 Web 伺服器（或 GitHub Pages）。
2. 開開啟 `script.js`，將第一行的 `GAS_API_URL` 變數替換為您在 **步驟 B** 所複製的 Web App URL：
```javascript
const GAS_API_URL = "您的_APPS_SCRIPT_WEB_APP_URL";

```



---

## 3. 資料庫 (Google 試算表) 結構說明

請確保試算表的工作表名稱與第一列欄位名稱完全一致：

### 1. `帳號管理`

| A: 帳號 | B: 密碼 | C: 姓名 | D: 權限 | E: 帶班班級 |
| --- | --- | --- | --- | --- |
| admin | 1234 | 系統管理員 | admin |  |
| A001 | 1234 | 王大明老師 | homeroom | 801 |
| A002 | 1234 | 李小華老師 | teacher |  |

### 2. `作息時間表`

| A: 學校 | B: 節次 | C: 開始時間 | D: 結束時間 |
| --- | --- | --- | --- |
| 八里國中 | 第1節 | 08:15 | 09:00 |
| 八里國中 | 第2節 | 09:10 | 09:55 |

### 3. `課表`

| A: 學期 | B: 學校 | C: 星期 | D: 節次 | E: 科目 | F: 班級 | G: 教師帳號 |
| --- | --- | --- | --- | --- | --- | --- |
| 115-1 | 八里國中 | 星期一 | 第1節 | 資訊科技 | 806 | A001 |
| 115-1 | 八里國中 | 星期一 | 第1節 | 資訊科技 | 701 | A002 |

### 4. `學生名單`

| A: 學期 | B: 學校 | C: 班級 | D: 座號 | E: 學號 | F: 姓名 | G: 狀態 |
| --- | --- | --- | --- | --- | --- | --- |
| 115-1 | 八里國中 | 801 | 01 | 80101 | 陳小明 | 在學 |
| 115-1 | 八里國中 | 801 | 02 | 80102 | 林大同 | 在學 |

### 5. `座位設定` (由系統自動寫入/覆寫)

| A: 學期 | B: 學校 | C: 班級 | D: 欄數X | E: 列數Y | F: 無效座位 | G: 座位資料 |
| --- | --- | --- | --- | --- | --- | --- |


---

## 4. 使用者功能操作指南

### 4.1 登入與身份切換

* **系統預設管理員**：帳號 `admin` / 密碼 `1234`。
* 登入後系統會自動判斷權限：
* **admin (管理員)**：可切換檢視全校所有教師的課表與全校報表。
* **homeroom (導師)**：預設載入自身課表與帶班班級資料。
* **teacher (科任教師)**：僅能檢視個人授課課表與點名權限。



### 4.2 課表檢視與管理者功能

* **課表檢視**：選擇學校與學期後，表格會自動渲染當週課表。
* **管理者切換教師**：若以 `admin` 登入，頂部篩選列會顯示「切換教師 (管理者用)」。
* 選擇特定教師：呈現該教師個人課表。
* 選擇「全體課表 (所有教師)」：同一個時段若有 2 位以上教師授課，儲存格內會以區塊標籤並列呈現所有課程。



### 4.3 點名與教學摘要紀錄

* 點擊課表上的班級即可進入點名視圖。
* **座位點名**：點擊學生座位卡片可循環切換狀態（`出席` $\rightarrow$ `病假` $\rightarrow$ `事假` $\rightarrow$ `公假` $\rightarrow$ `遲到` $\rightarrow$ `曠課`）。
* **教學摘要**：下方提供文字框，輸入完畢後點擊「💾 儲存點名與摘要紀錄」寫入雲端。

### 4.4 班級座位與走道佈局設定 (Modal)

* 點擊「⚙️ 排座位 / 設定走道」開啟全螢幕自適應 Modal 視窗。
* **調整尺寸**：輸入欄數 (X) 與列數 (Y) 後點擊「套用尺寸」，系統會自動將學生依 **直排（由上到下、由左至右）** 重新填充座位。
* **兩兩對調座位**：
1. 點擊第一個學生卡片（卡片呈現黃底珊瑚紅框高亮）。
2. 點擊第二個學生卡片，兩位學生位置即刻互換。


* **設定走道**：點擊無人卡片或已高亮的卡片可切換為灰底走道。
* **頂部控制列**：調整完成後點擊頂部「💾 儲存座位表」，系統將以覆寫機制同步更新至雲端與本地快取。

### 4.5 期末統計與報表 (缺席通知單列印)

* 點擊主畫面右上角「📊 查看期末總報表」。
* 頂部提供「學校」與「學期」二級篩選選單。
* **列印缺席通知單**：按班級或學生篩選後，點擊「🖨️ 列印缺席通知單」，系統會跳出適合 A4 格式的列印預覽，包含家長與導師簽章欄位。
* **匯出功能**：支援一鍵複製全學期摘要或將數據匯出為 CSV 報表。

---

## 5. 前端與後端完整程式碼範例

### 5.1 `Code.gs` (Apps Script 後端 API)

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

// 1. 帳號登入
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
        role: cleanRole,
        classHandled: user.帶班班級 || user.班級 || ""
      }
    };
  } else {
    return { status: "error", message: "帳號或密碼錯誤！" };
  }
}

// 2. 抓取初始化資料
function handleGetInitialData(account, role) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var times = getSheetDataAsObjects(ss.getSheetByName("作息時間表"));
  var schedules = getSheetDataAsObjects(ss.getSheetByName("課表"));
  var allStudents = getSheetDataAsObjects(ss.getSheetByName("學生名單"));
  var seatings = getSheetDataAsObjects(ss.getSheetByName("座位設定"));

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

// 3. 儲存座位表設定 (比對「學期 + 學校 + 班級」，覆寫修改舊資料)
function handleSaveSeating(req) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("座位設定");
  
  if (!sheet) {
    sheet = ss.insertSheet("座位設定");
    sheet.appendRow(["學期", "學校", "班級", "欄數X", "列數Y", "無效座位", "座位資料"]);
  }

  var data = sheet.getDataRange().getDisplayValues();
  var rowIndex = -1;

  var targetSemester = String(req.semester || req.學期 || "").trim();
  var targetSchool = String(req.school || req.學校 || "").trim();
  var targetClass = String(req.className || req.班級 || "").trim();

  for (var i = 1; i < data.length; i++) {
    var rowSemester = String(data[i][0]).trim();
    var rowSchool = String(data[i][1]).trim();
    var rowClass = String(data[i][2]).trim();

    if (rowSemester === targetSemester && 
        rowSchool === targetSchool && 
        rowClass === targetClass) {
      rowIndex = i + 1;
      break;
    }
  }

  var disabledStr = typeof req.disabledSeats === "string" ? req.disabledSeats : JSON.stringify(req.disabledSeats || []);
  var seatDataStr = typeof req.seatData === "string" ? req.seatData : JSON.stringify(req.seatData || {});

  var rowData = [
    targetSemester,
    targetSchool,
    targetClass,
    req.cols || 6,
    req.rows || 5,
    disabledStr,
    seatDataStr
  ];

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { status: "success", message: "座位設定已成功更新 (覆寫修改)！" };
  } else {
    sheet.appendRow(rowData);
    return { status: "success", message: "新座位設定已成功新增！" };
  }
}

// 4. 儲存 / 歷史覆寫點名紀錄
function handleSaveAttendance(req) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var attSheet = ss.getSheetByName("點名紀錄");
  var sumSheet = ss.getSheetByName("教學摘要紀錄");

  var attData = attSheet.getDataRange().getDisplayValues();
  for (var i = attData.length - 1; i >= 1; i--) {
    if (String(attData[i][2]) === String(req.date) &&
        String(attData[i][1]) === String(req.school) &&
        String(attData[i][4]) === String(req.className) &&
        String(attData[i][3]) === String(req.period)) {
      attSheet.deleteRow(i + 1);
    }
  }

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

// 5. 抓取期末統計 (admin 權限無條件放行)
function handleGetSummaryReports(req) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rawAttendances = getSheetDataAsObjects(ss.getSheetByName("點名紀錄"));
  var rawSummaries = getSheetDataAsObjects(ss.getSheetByName("教學摘要紀錄"));

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

  var reqRole = String(req.role || "").toLowerCase().trim();
  
  if (reqRole === "admin") {
    return {
      status: "success",
      attendances: groupedAttendances,
      summaries: formattedSummaries
    };
  }

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

### 5.2 `index.html` (前端 HTML 架構)

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>學校點名與課表系統</title>
  <link rel="manifest" href="manifest.json">
  <link rel="stylesheet" href="style.css">
</head>
<body data-theme="light">
  <div class="container">
    <header class="app-header">
      <div class="logo-group">
        <h2>🏫 學校點名與課表系統</h2>
      </div>
      <div class="header-actions">
        <button id="pwaInstallBtn" class="btn btn-outline hidden" onclick="installPWA()">📱 安裝 App</button>
        <button class="btn btn-outline" onclick="toggleTheme()">🌓 主題</button>
        <button id="logoutBtn" class="btn btn-danger hidden" onclick="logout()">登出</button>
      </div>
    </header>

    <!-- 1. 登入畫面 -->
    <div id="loginView" class="card">
      <h3>🔐 教師登入</h3>
      <div class="form-group">
        <label for="accInput">帳號：</label>
        <input type="text" id="accInput" placeholder="請輸入帳號" value="admin">
      </div>
      <div class="form-group">
        <label for="pwdInput">密碼：</label>
        <input type="password" id="pwdInput" placeholder="請輸入密碼" value="1234">
      </div>
      <button class="btn btn-primary btn-block mt-10" onclick="handleLogin()">登入系統</button>
      <div id="loginMsg" class="error-msg"></div>
    </div>

    <!-- 2. 主畫面 (課表視圖) -->
    <div id="mainView" class="card hidden">
      <div class="header-row">
        <h3 id="welcomeMsg">歡迎登入</h3>
        <button class="btn btn-info" onclick="showReportView()">📊 查看期末總報表</button>
      </div>

      <div class="filter-row mt-15">
        <div class="form-group">
          <label for="schoolSelect">選擇學校：</label>
          <select id="schoolSelect" onchange="renderTimetable()"></select>
        </div>
        <div class="form-group">
          <label for="semesterSelect">選擇學期：</label>
          <select id="semesterSelect" onchange="renderTimetable()"></select>
        </div>
        <div id="teacherSelectBox" class="form-group hidden">
          <label for="teacherSelect">切換教師 (管理者用)：</label>
          <select id="teacherSelect" onchange="renderTimetable()"></select>
        </div>
      </div>

      <div class="table-responsive mt-15">
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

    <!-- 3. 點名與座位管理畫面 -->
    <div id="attendanceView" class="card hidden">
      <div class="header-row">
        <div>
          <h3 id="attendanceTitle">班級點名</h3>
          <div class="date-picker-group">
            <label for="attendanceDate">點名日期：</label>
            <input type="date" id="attendanceDate" onchange="onDateChange()">
          </div>
        </div>
        <div class="action-buttons">
          <button class="btn btn-outline" onclick="openSeatingModal()">⚙️ 排座位 / 設定走道</button>
          <button class="btn btn-secondary" onclick="backToMain()">返回課表</button>
        </div>
      </div>

      <div id="seatingGrid" class="seating-grid-container mt-15"></div>

      <div class="form-group mt-15">
        <label for="summaryInput"><b>📝 教學摘要紀錄：</b></label>
        <textarea id="summaryInput" rows="3" placeholder="請輸入本節課教學內容、交代事項或備註..."></textarea>
      </div>

      <button class="btn btn-success btn-block mt-15" onclick="submitAttendance()">💾 儲存點名與摘要紀錄</button>
    </div>

    <!-- 4. 期末總報表畫面 -->
    <div id="reportView" class="card hidden">
      <div class="header-row">
        <h3>📊 期末統計與報表</h3>
        <button class="btn btn-secondary" onclick="backToMainFromReport()">返回課表</button>
      </div>

      <div class="filter-row mt-15">
        <div class="form-group">
          <label for="reportSchoolFilter">篩選學校：</label>
          <select id="reportSchoolFilter" onchange="onReportSchoolOrSemesterChange()"></select>
        </div>
        <div class="form-group">
          <label for="reportSemesterFilter">篩選學期：</label>
          <select id="reportSemesterFilter" onchange="onReportSchoolOrSemesterChange()"></select>
        </div>
      </div>

      <div class="tab-buttons mt-10">
        <button class="tab-btn active" onclick="switchReportTab('absent')">缺席紀錄統計</button>
        <button class="tab-btn" onclick="switchReportTab('summary')">全學期教學摘要彙整</button>
      </div>

      <div id="absentTabContent" class="tab-content">
        <div class="filter-row mt-10">
          <div class="form-group">
            <label for="reportClassFilter">篩選班級：</label>
            <select id="reportClassFilter" onchange="onReportClassChange()"></select>
          </div>
          <div class="form-group">
            <label for="reportStudentFilter">篩選學生：</label>
            <select id="reportStudentFilter" onchange="renderAbsentReportTable()"></select>
          </div>
          <div class="form-group">
            <label for="reportSortOrder">日期排序：</label>
            <select id="reportSortOrder" onchange="renderAbsentReportTable()">
              <option value="DESC">日期最新在最前 (預設)</option>
              <option value="ASC">日期最舊在最前</option>
            </select>
          </div>
        </div>

        <div class="action-row mt-10">
          <button class="btn btn-info" onclick="printStudentReport()">🖨️ 列印缺席通知單 (含簽章欄)</button>
          <button class="btn btn-success" onclick="exportToExcel()">📥 匯出 CSV 報表</button>
        </div>

        <table class="report-table mt-15">
          <thead>
            <tr>
              <th>日期</th>
              <th>學校 / 班級</th>
              <th>節次</th>
              <th>填報教師</th>
              <th>缺席學生 (假別)</th>
            </tr>
          </thead>
          <tbody id="absentReportBody"></tbody>
        </table>
      </div>

      <div id="summaryTabContent" class="tab-content hidden">
        <div class="action-row mt-10">
          <button class="btn btn-primary" onclick="copySummaries()">📋 一鍵複製全學期摘要</button>
        </div>

        <table class="report-table mt-15">
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

  <!-- ⚙️ 座位設定 Modal -->
  <div id="seatingModal" class="modal hidden">
    <div class="modal-content">
      <div class="modal-header-row">
        <h3>⚙️ 班級座位佈局設定</h3>
        <div class="modal-controls">
          <label for="gridColsInput">欄數 (X)：</label>
          <input type="number" id="gridColsInput" value="6" min="1" max="10">
          <label for="gridRowsInput">列數 (Y)：</label>
          <input type="number" id="gridRowsInput" value="5" min="1" max="10">
          <button class="btn btn-primary" onclick="applyGridDimensions()">套用尺寸</button>
          <button class="btn btn-success" onclick="saveSeatingLayout()">💾 儲存座位表</button>
          <button class="btn btn-secondary" onclick="closeSeatingModal()">取消</button>
        </div>
      </div>
      
      <p style="margin: 6px 0; font-size: 0.85rem; color:#666">
        💡 點擊座位卡片可設定走道，點擊兩位學生可快速對調位置。
      </p>
      
      <div id="modalSeatingGrid" class="seating-grid-container"></div>
    </div>
  </div>

  <script src="script.js"></script>
</body>
</html>

```

---

### 5.3 `style.css` (日系淺綠 UI 與滿版自適應)

```css
:root {
  --bg-color: #f4f7f4;
  --card-bg: #ffffff;
  --text-color: #2d3748;
  --primary-color: #52b788;
  --primary-hover: #40916c;
  --secondary-color: #748cab;
  --info-color: #52a2d7;
  --success-color: #2a9d8f;
  --danger-color: #e76f51;
  --border-color: #d8f3dc;
  --disabled-color: #e9ecef;
}

[data-theme="dark"] {
  --bg-color: #1a2421;
  --card-bg: #24322d;
  --text-color: #e8f5e9;
  --border-color: #2d4a3e;
  --disabled-color: #37474f;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang TC", "Microsoft JhengHei", sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card {
  background-color: var(--card-bg);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid var(--border-color);
}

.hidden { display: none !important; }
.mt-10 { margin-top: 10px; }
.mt-15 { margin-top: 15px; }

/* 按鈕樣式 */
.btn {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-primary { background-color: var(--primary-color); color: #fff; }
.btn-primary:hover { background-color: var(--primary-hover); }
.btn-secondary { background-color: var(--secondary-color); color: #fff; }
.btn-success { background-color: var(--success-color); color: #fff; }
.btn-info { background-color: var(--info-color); color: #fff; }
.btn-danger { background-color: var(--danger-color); color: #fff; }
.btn-outline { background-color: transparent; border: 1px solid var(--primary-color); color: var(--primary-color); }

.form-group { margin-bottom: 12px; }
.form-group label { display: block; margin-bottom: 4px; font-weight: bold; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}

.filter-row { display: flex; gap: 15px; flex-wrap: wrap; }
.header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }

/* 課表樣式 */
.table-responsive { overflow-x: auto; }
.timetable { width: 100%; border-collapse: collapse; text-align: center; }
.timetable th, .timetable td { border: 1px solid var(--border-color); padding: 8px; }
.timetable th { background-color: #d8f3dc; color: #1b4332; }
.timetable td.has-class { background-color: #e8f5e9; cursor: pointer; }
.timetable td.has-class:hover { background-color: #b7e4c7; }

/* 座位卡片與 Modal */
.seating-grid-container {
  display: grid;
  gap: 8px;
}

.seat-card {
  border: 1.5px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--card-bg);
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: transform 0.1s, border-color 0.2s;
}
.seat-card.disabled { background-color: var(--disabled-color); cursor: default; }
.seat-card.reason-缺席, .seat-card.reason-病假, .seat-card.reason-事假, .seat-card.reason-曠課 { background-color: #ffccd5; border-color: #ff4d6d; }
.seat-card.reason-遲到 { background-color: #fff3bf; border-color: #ffd43b; }
.seat-card.reason-公假 { background-color: #d0ebff; border-color: #74c0fc; }

.modal {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 9999;
}
.modal-content {
  background-color: var(--card-bg);
  padding: 16px 20px;
  border-radius: 12px;
  width: 96vw;
  height: 95vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.modal-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}
.modal-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.modal-controls input[type="number"] { width: 55px; padding: 4px; text-align: center; }

#modalSeatingGrid {
  flex: 1;
  display: grid;
  gap: 8px;
  margin-top: 8px;
  overflow: auto !important;
  padding: 4px;
}
#modalSeatingGrid .seat-card {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  min-width: 75px; height: 100%; min-height: 45px; padding: 2px; font-size: 0.9rem;
}

.report-table { width: 100%; border-collapse: collapse; text-align: center; }
.report-table th, .report-table td { border: 1px solid var(--border-color); padding: 8px; }

```

---

### 5.4 `script.js` (前端全功能主邏輯)

```javascript
// ------------------------------------------------------------------
// 學校點名與課表系統 - 前端主邏輯 (script.js)
// ------------------------------------------------------------------

// ⚠️ 請替換為您發布的 Apps Script Web App URL
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwprY_PF7P3JRSo84NAG_8scWiCp2UrCP5rGafu_jc8eVk1Hvmdc1-USQ7NEoue4hBp/exec";

let currentUser = null;
let appData = null;
let currentSession = {}; 
let currentGrid = { cols: 6, rows: 5, seats: {}, disabled: [] };
let currentAbsenteesMap = new Map();
const REASONS = ["出席", "病假", "事假", "公假", "遲到", "曠課"];
let reportData = { attendances: [], summaries: [] };
let selectedSeatKey = null;

function getTodayLocalDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
    msg.innerText = "連線失敗，請檢查網路連線或 API 網址！";
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
    alert("初始化資料載入失敗！");
  }
}

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

    const rawTeacherList = appData.schedules.map(s => {
      let acc = s.教師帳號 || s.教師 || s.點名教師帳號 || "";
      const parts = String(acc).trim().split(/\s+/);
      return parts[parts.length - 1];
    }).filter(Boolean);

    const teachers = [...new Set(rawTeacherList)];

    teacherSelect.innerHTML = `<option value="ALL">全體課表 (所有教師)</option>` + 
      teachers.map(t => `<option value="${t}">${t}</option>`).join('');

    teacherSelect.onchange = renderTimetable;
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
      const matchClasses = filteredSchedules.filter(s => s.星期 === day && s.節次 === p.節次);

      if (matchClasses.length > 0) {
        const classItemsHtml = matchClasses.map(matchClass => {
          let rawAcc = matchClass.教師帳號 || matchClass.教師 || matchClass.點名教師帳號 || "";
          const parts = String(rawAcc).trim().split(/\s+/);
          const teacherCode = parts[parts.length - 1];
          
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

async function showReportView() {
  document.getElementById("mainView").classList.add("hidden");
  document.getElementById("reportView").classList.remove("hidden");

  const schools = [...new Set(appData.times.map(t => t.學校))].filter(Boolean);
  const semesters = [...new Set(appData.schedules.map(s => s.學期))].filter(Boolean);

  const schoolSelect = document.getElementById("reportSchoolFilter");
  const semesterSelect = document.getElementById("reportSemesterFilter");

  if (schoolSelect && semesterSelect) {
    schoolSelect.innerHTML = schools.map(s => `<option value="${s}">${s}</option>`).join('');
    semesterSelect.innerHTML = semesters.map(s => `<option value="${s}">${s}</option>`).join('');

    if (document.getElementById("schoolSelect")?.value) {
      schoolSelect.value = document.getElementById("schoolSelect").value;
    }
    if (semesters.length > 0) {
      semesterSelect.value = semesters[semesters.length - 1];
    }
  }

  await fetchReportData();
}

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

```
