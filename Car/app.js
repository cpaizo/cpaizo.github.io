// 你的 GAS Web App 部署網址
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwYUMF6kDEZN7_MKYw17J_E1MZltnOr5W9jKg3hzHk-C5rNDotxN067r8deotPz5F194g/exec";

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
  
  // 切換到圖表或明細分頁時自動重新載入資料
  if(paneId === 'pane-chart1' || paneId === 'pane-chart2' || paneId === 'pane-table') {
    loadChartData();
  }
}

let fuelChartInstance = null;
let odoChartInstance = null;

// 透過 Fetch API 從 GAS 讀取試算表資料並繪製圖表與表格
async function loadChartData() {
  try {
    const response = await fetch(GAS_API_URL);
    const data = await response.json();
    
    if (!data || data.length === 0) return;

    let labels = data.map(row => row.date ? String(row.date).substring(5, 16) : '');
    let kmPerLiterData = data.map(row => Number(row.km_per_liter) || 0);
    let odoData = data.map(row => Number(row.total_odometer) || 0);

    // 1. 平均油耗趨勢折線圖
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

    // 2. 總里程累積折線圖
    const ctx2 = document.getElementById('odoChart');
    if (ctx2) {
      if (odoChartInstance) odoChartInstance.destroy();
      odoChartInstance = new Chart(ctx2.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: '總里程 (km)',
            data: odoData,
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            fill: true,
            tension: 0.1
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // 3. 填入歷史明細表格 (倒序排列，最新一筆在最上方)
    const tbody = document.querySelector('#dataTable tbody');
    if (tbody) {
      tbody.innerHTML = '';
      data.slice().reverse().forEach(row => {
        let tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.date ? String(row.date).substring(5, 16) : ''}</td>` +
                       `<td>${row.total_odometer}</td>` +
                       `<td>${row.liters}</td>` +
                       `<td>${row.km_per_liter || '-'}</td>`;
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
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      mode: 'no-cors', // 配合 GAS 重新導向特性
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    alert('✅ 記帳成功！');
    document.getElementById('input-odo').value = '';
    document.getElementById('input-liters').value = '';
    document.getElementById('input-price').value = '';
    loadChartData(); // 重新整理圖表與明細
  } catch (error) {
    alert('❌ 傳送失敗：' + error);
  } finally {
    btn.disabled = false;
    btn.textContent = "送出紀錄";
  }
}
