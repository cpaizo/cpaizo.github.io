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

    let labels = data.map(row => row.date ? String(row.date).substring(5, 10) : '');
    let kmPerLiterData = data.map(row => row.km_per_liter ? Number(row.km_per_liter).toFixed(2) : 0);
    
    // --- 1. 平均油耗趨勢折線圖 (Honda 紅黑科技風色彩) ---
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
            borderColor: '#E40521', // Honda 紅
            backgroundColor: 'rgba(228, 5, 33, 0.08)',
            fill: true,
            tension: 0.1,
            pointBackgroundColor: '#E40521'
          }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { legend: { labels: { font: { weight: 'bold' } } } }
        }
      });
    }

    // --- 2. 總里程累積文字摘要 ---
    const odoContainer = document.getElementById('odoSummary');
    if (odoContainer && data.length > 0) {
      const latestRow = data[data.length - 1]; 
      const latestDate = latestRow.date ? String(latestRow.date).substring(0, 10) : '';
      const latestOdo = latestRow.total_odometer || 0;
      
      odoContainer.innerHTML = `
        <div style="text-align: center; padding: 35px 15px; background: #fafafa; border-radius: 10px; border: 1px solid #e0e0e0; border-top: 4px solid #E40521; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
          <div style="font-size: 0.85rem; color: #777; margin-bottom: 6px; letter-spacing: 1px;">📅 最新紀錄日期：${latestDate}</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: #111; margin-bottom: 12px; letter-spacing: 0.5px;">BVE-0965 | Honda Fit e:HEV</div>
          <div style="font-size: 2rem; font-weight: 900; color: #E40521;">🚗 ${latestOdo} <span style="font-size: 1.2rem; color: #333;">km</span></div>
        </div>
      `;
    }

    // --- 3. 計算並繪製「每月開車里程數」長條圖 (改為淡淡的粉綠色) ---
    let monthlyKmMap = {};
    for (let i = 0; i < data.length; i++) {
      let row = data[i];
      if (row.date && row.total_odometer) {
        let monthKey = String(row.date).substring(0, 7); 
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
            backgroundColor: 'rgba(168, 230, 207, 0.65)', // 淡淡的粉綠色
            borderColor: '#88d8b0', // 柔和粉綠邊框
            borderWidth: 1.5,
            borderRadius: 4
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

    // --- 4. 填入歷史明細表格 (依照月份自動切換柔和底色) ---
    const tbody = document.querySelector('#dataTable tbody');
    if (tbody) {
      tbody.innerHTML = '';
      
      const monthColors = ['#fdf2f2', '#f0f4f8', '#f4f9f4', '#fdf8f0', '#f5f0fd'];
      let monthColorMap = {};
      let colorIndex = 0;

      const reversedData = data.slice().reverse();
      
      reversedData.forEach(row => {
        let cleanDate = row.date ? String(row.date).substring(0, 10) : '';
        let monthKey = cleanDate.substring(0, 7);
        
        if (!monthColorMap[monthKey]) {
          monthColorMap[monthKey] = monthColors[colorIndex % monthColors.length];
          colorIndex++;
        }
        
        let rowBgColor = monthColorMap[monthKey];
        let formattedKmPerLiter = row.km_per_liter ? Number(row.km_per_liter).toFixed(2) : '-';
        
        let tr = document.createElement('tr');
        tr.style.backgroundColor = rowBgColor;
        tr.innerHTML = `<td style="padding: 10px 6px; border-bottom: 1px solid #e5e5e5;">${cleanDate}</td>` +
                       `<td style="padding: 10px 6px; border-bottom: 1px solid #e5e5e5; font-weight: bold;">${row.total_odometer}</td>` +
                       `<td style="padding: 10px 6px; border-bottom: 1px solid #e5e5e5;">${row.liters}</td>` +
                       `<td style="padding: 10px 6px; border-bottom: 1px solid #e5e5e5; color: #E40521; font-weight: bold;">${formattedKmPerLiter}</td>`;
        tbody.appendChild(tr);
      });
    }

  } catch (error) {
    console.error("載入資料失敗:", error);
  }
}

// 傳送新增加油紀錄
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
