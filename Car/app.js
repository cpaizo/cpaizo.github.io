// 你的 GAS Web App 部署網址
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyBieL0vvfRuprH3u6ZiJZGpJATrqbp6YIYkgen6aa0mI6aIR6lpRNf6HDfo8ENE22ZeA/exec";

// 自動帶入當前時間到表單
document.addEventListener('DOMContentLoaded', function() {
  const dateInput = document.getElementById('input-date');
  if (dateInput && !dateInput.value) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.value = now.toISOString().slice(0, 16);
  }
  loadChartData();
});

// 分頁切換邏輯
function switchTab(evt, paneId) {
  const panes = document.querySelectorAll('.section-pane');
  panes.forEach(p => p.classList.remove('active'));
  
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(b => b.classList.remove('active'));
  
  document.getElementById(paneId).classList.add('active');
  evt.currentTarget.classList.add('active');
  
  if(paneId === 'pane-chart1' || paneId === 'pane-chart2' || paneId === 'pane-chart3' || paneId === 'pane-table') {
    loadChartData();
  }
}

let fuelChartInstance = null;
let monthlyKmChartInstance = null;

// 透過 Fetch API 從 GAS 讀取試算表資料並繪製圖表與表格
async function loadChartData() {
  try {
    const response = await fetch(GAS_API_URL);
    const data = await response.json();
    
    if (!data || data.length === 0) return;

    // 圖表用標籤（取月-日即可）
    let labels = data.map(row => row.date ? String(row.date).substring(5, 10) : '');
    // 油耗強制取小數點 2 位
    let kmPerLiterData = data.map(row => row.km_per_liter ? Number(row.km_per_liter).toFixed(2) : 0);
    
    // --- 1. 平均油耗趨勢折線圖 ---
    const ctx1 = document.getElementById('fuelChart');
    if (ctx1) {
      if (fuelChartInstance) fuelChartInstance.destroy();
      fuelChartInstance = new Chart(ctx1.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: '平均油耗 (km/L)',
            data: kmPerLiterData,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            fill: true,
            tension: 0.1
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // --- 2. 總里程累積文字摘要 ---
    const odoContainer = document.getElementById('odoSummary');
    if (odoContainer && data.length > 0) {
      const latestRow = data[data.length - 1]; // 取最後一筆（最新）
      const latestDate = latestRow.date ? String(latestRow.date).substring(0, 10) : '';
      const latestOdo = latestRow.total_odometer || 0;
      
      odoContainer.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; background: #e8f8f5; border-radius: 8px; border: 1px solid #a3e4d7;">
          <div style="font-size: 0.9rem; color: #555; margin-bottom: 5px;">📅 最新紀錄日期：${latestDate}</div>
          <div style="font-size: 1.1rem; font-weight: bold; color: #2c3e50; margin-bottom: 10px;">車牌：BVE-0965 (Honda Fit e:HEV)</div>
          <div style="font-size: 1.8rem; font-weight: bold; color: #16a085;">🚗 總里程：${latestOdo} km</div>
        </div>
      `;
    }

    // --- 3. 計算並繪製「每月開車里程數」長條圖 ---
    let monthlyKmMap = {};
    for (let i = 0; i < data.length; i++) {
      let row = data[i];
      if (row.date && row.total_odometer) {
        let monthKey = String(row.date).substring(0, 7); // 擷取 YYYY-MM
        if (!monthlyKmMap[monthKey]) {
          monthlyKmMap[monthKey] = 0;
        }
        let prevOdo = (i > 0) ? Number(data[i-1].total_odometer) : 0;
        let currentOdo = Number(row.total_odometer);
        let dist = (prevOdo > 0 && currentOdo > prevOdo) ? (currentOdo - prevOdo) : 0;
        monthlyKmMap[monthKey] += dist;
      }
    }

    let monthlyLabels = Object.keys(monthlyKmMap);
    let monthlyValues = Object.values(monthlyKmMap);

    const ctxMonthly = document.getElementById('monthlyKmChart');
    if (ctxMonthly) {
      if (monthlyKmChartInstance) monthlyKmChartInstance.destroy();
      monthlyKmChartInstance = new Chart(ctxMonthly.getContext('2d'), {
        type: 'bar',
        data: {
          labels: monthlyLabels,
          datasets: [{
            label: '每月開車里程數 (km)',
            data: monthlyValues,
            backgroundColor: 'rgba(46, 204, 113, 0.6)',
            borderColor: '#2ecc71',
            borderWidth: 1
          }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    // --- 4. 填入歷史明細表格 (倒序排列，日期只取前 10 碼 YYYY-MM-DD，油耗取小數點 2 位) ---
    const tbody = document.querySelector('#dataTable tbody');
    if (tbody) {
      tbody.innerHTML = '';
      data.slice().reverse().forEach(row => {
        let cleanDate = row.date ? String(row.date).substring(0, 10) : '';
        let formattedKmPerLiter = row.km_per_liter ? Number(row.km_per_liter).toFixed(2) : '-';
        let tr = document.createElement('tr');
        tr.innerHTML = `<td>${cleanDate}</td>` +
                       `<td>${row.total_odometer}</td>` +
                       `<td>${row.liters}</td>` +
                       `<td>${formattedKmPerLiter}</td>`;
        tbody.appendChild(tr);
      });
    }

  } catch (error) {
    console.error("載入資料失敗:", error);
  }
}

// 透過 Fetch API 傳送新增加油紀錄到 GAS 後端
async function submitData() {
  const btn = document.getElementById('submitBtn');
  const payload = {
    date: document.getElementById('input-date').value,
    odo: document.getElementById('input-odo').value,
    liters: document.getElementById('input-liters').value,
    unitPrice: document.getElementById('input-price').value
  };

  if (!payload.odo || !payload.liters || !payload.unitPrice) {
    alert('請填寫完整資訊！');
    return;
  }

  btn.disabled = true;
  btn.textContent = "傳送中...";

  try {
    await fetch(GAS_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    alert('✅ 記帳成功！');
    document.getElementById('input-odo').value = '';
    document.getElementById('input-liters').value = '';
    document.getElementById('input-price').value = '';
    
    setTimeout(loadChartData, 1000);
  } catch (error) {
    alert('❌ 傳送失敗：' + error);
  } finally {
    btn.disabled = false;
    btn.textContent = "送出紀錄";
  }
}
