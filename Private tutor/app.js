// 您的 GAS API Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbyAaciyZ3V8mdp-6Oyc7Jda8cGejKoPrEXl0Mv4gIomsCpXKQ7lX5XQp38ykBsx00NmGA/exec";

// 初始化預設日期為今天
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('sch-date').value = today;
  document.getElementById('dep-date').value = today;
  document.getElementById('exp-date').value = today;

  loadDashboard();
  registerServiceWorker();
});

// 分頁切換
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

// 讀取儀表板與數據
async function loadDashboard() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    
    if (data.success) {
      document.getElementById('stat-remaining').innerText = data.summary.remainingHours;
      document.getElementById('stat-pending-exp').innerText = `$${data.summary.pendingExpensesAmount}`;
      renderHistory(data);
    }
  } catch (err) {
    alert('讀取失敗，請檢查網路狀態或 GAS 部署設定');
  }
}

// 渲染歷史列表
function renderHistory(data) {
  const listEl = document.getElementById('history-list');
  let html = '<h4>排課紀錄</h4>';
  
  if (data.schedules.length === 0) {
    html += '<p style="color:#999;font-size:13px;">尚無排課紀錄</p>';
  } else {
    data.schedules.forEach(item => {
      let badgeClass = item.status === '已完成' ? 'badge-done' : (item.status === '已取消' ? 'badge-cancel' : 'badge-pending');
      html += `
        <div class="list-item">
          <div><strong>${item.date}</strong> (${item.start_time}~${item.end_time}) - ${item.hours}小時 
            <span class="badge ${badgeClass}">${item.status}</span>
          </div>
          <div style="font-size:12px;color:#666;">${item.note || '無備註'}</div>
        </div>`;
    });
  }

  html += '<h4 style="margin-top:16px;">繳費儲值紀錄</h4>';
  if (data.transactions.length === 0) {
    html += '<p style="color:#999;font-size:13px;">尚無繳費紀錄</p>';
  } else {
    data.transactions.forEach(item => {
      html += `
        <div class="list-item">
          <div><strong>${item.date}</strong> 收 $${item.amount_paid} (+${item.hours_added}小時)</div>
          <div style="font-size:12px;color:#666;">${item.note || ''}</div>
        </div>`;
    });
  }

  listEl.innerHTML = html;
}

// 通用 POST 送出
async function sendData(action, payload, btnId) {
  const btn = document.getElementById(btnId);
  btn.disabled = true;
  btn.innerText = '處理中...';

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: action, data: payload })
    });
    const result = await res.json();

    if (result.success) {
      alert(result.message);
      loadDashboard();
    } else {
      alert(`失敗：${result.message}`);
    }
  } catch (err) {
    alert('傳送失敗！');
  } finally {
    btn.disabled = false;
    btn.innerText = '確認送出';
  }
}

// 表單監聽
document.getElementById('form-schedule').addEventListener('submit', (e) => {
  e.preventDefault();
  sendData('addSchedule', {
    date: document.getElementById('sch-date').value.replace(/-/g, '/'),
    start_time: document.getElementById('sch-start').value,
    end_time: document.getElementById('sch-end').value,
    hours: document.getElementById('sch-hours').value,
    auto_add_parking: document.getElementById('sch-parking').checked,
    note: document.getElementById('sch-note').value
  }, 'btn-sch');
});

document.getElementById('form-deposit').addEventListener('submit', (e) => {
  e.preventDefault();
  sendData('addTransaction', {
    date: document.getElementById('dep-date').value.replace(/-/g, '/'),
    amount_paid: document.getElementById('dep-amount').value,
    hourly_rate: document.getElementById('dep-rate').value,
    note: document.getElementById('dep-note').value
  }, 'btn-dep');
});

document.getElementById('form-expense').addEventListener('submit', (e) => {
  e.preventDefault();
  sendData('addExpense', {
    date: document.getElementById('exp-date').value.replace(/-/g, '/'),
    category: document.getElementById('exp-category').value,
    amount: document.getElementById('exp-amount').value,
    note: document.getElementById('exp-note').value
  }, 'btn-exp');
});

// PWA Service Worker 註冊
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
