// GAS API URL
const API_URL = "https://script.google.com/macros/s/AKfycbyUJvXkKyB1oLe_gYJhGGIb5og7_qtTi_5ogRNdZPL7d-qozkQgo-4s8JzGq7YLJNhz7g/exec";

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('sch-date').value = today;
  document.getElementById('dep-date').value = today;
  document.getElementById('exp-date').value = today;

  autoCalculateHours();
  loadDashboard();
  registerServiceWorker();
});

// 自動計算上課時數
function autoCalculateHours() {
  const start = document.getElementById('sch-start').value;
  const end = document.getElementById('sch-end').value;

  if (start && end) {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    let durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (durationMinutes > 0) {
      const hours = durationMinutes / 60;
      document.getElementById('sch-hours').value = hours;
    }
  }
}

// 儲值類型切換
function toggleDepositType() {
  const type = document.getElementById('dep-type').value;
  const rateGroup = document.getElementById('group-rate');
  const amountInput = document.getElementById('dep-amount');

  if (type === '停車費') {
    rateGroup.style.display = 'none';
    amountInput.value = '1000';
  } else {
    rateGroup.style.display = 'block';
    amountInput.value = '15000';
  }
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

// 防休眠 Retry 機制
async function fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
    } else {
      throw err;
    }
  }
}

async function loadDashboard() {
  try {
    const data = await fetchWithRetry(API_URL);
    
    if (data && data.success) {
      const summary = data.summary || {};
      
      document.getElementById('stat-used').innerText = `${summary.hoursUsed || 0} / ${summary.totalHoursPurchased || 0}`;
      document.getElementById('stat-remaining').innerText = `${summary.remainingHours || 0} 小時`;
      document.getElementById('stat-pending-exp').innerText = `$${summary.pendingExpensesAmount || 0}`;
      
      renderHistory(data);
    }
  } catch (err) {
    console.error('API 喚醒中:', err);
  }
}

function renderHistory(data) {
  const listEl = document.getElementById('history-list');
  let html = '<h4 style="margin: 0 0 12px 0; font-size:14px; color:var(--primary);">排課清單與考勤確認</h4>';
  
  // A. 排課紀錄
  if (!data.schedules || data.schedules.length === 0) {
    html += '<p style="color:#999;font-size:13px;">尚無排課紀錄</p>';
  } else {
    data.schedules.forEach(item => {
      const currentStatus = String(item.status || '').trim();
      
      let badgeClass = 'badge-pending';
      if (currentStatus === '已完成' || currentStatus === '已上課') {
        badgeClass = 'badge-done';
      } else if (currentStatus === '已取消') {
        badgeClass = 'badge-cancel';
      }

      let actionBtns = '';
      if (currentStatus === '已排定') {
        actionBtns = `
          <div style="margin-top:8px; display:flex; gap:8px;">
            <button onclick="updateScheduleStatus('${item.schedule_id}', 'completeSchedule')" style="padding:5px 10px; font-size:12px; background:var(--success); color:#FFF; border:none; border-radius:4px; cursor:pointer;">✅ 確認已上課</button>
            <button onclick="updateScheduleStatus('${item.schedule_id}', 'cancelSchedule')" style="padding:5px 10px; font-size:12px; background:var(--danger); color:#FFF; border:none; border-radius:4px; cursor:pointer;">❌ 取消課程</button>
          </div>`;
      }

      html += `
        <div style="padding: 10px 0; border-bottom: 1px solid var(--border);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div><strong>${item.date}</strong> (${item.start_time} ~ ${item.end_time})</div>
            <span class="badge ${badgeClass}">${currentStatus}</span>
          </div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">
            時數：${item.hours} 小時 ${item.note ? '| ' + item.note : ''}
          </div>
          ${actionBtns}
        </div>`;
    });
  }

  // B. 費用紀錄
  html += '<h4 style="margin:20px 0 12px 0; font-size:14px; color:var(--primary);">費用明細 (停車費 / 材料費)</h4>';
  if (!data.expenses || data.expenses.length === 0) {
    html += '<p style="color:#999;font-size:13px;">尚無費用紀錄</p>';
  } else {
    data.expenses.forEach(item => {
      const currentStatus = String(item.status || '').trim();
      let badgeClass = (currentStatus === '已結清' || currentStatus === '已扣款') ? 'badge-done' : 'badge-pending';
      let payBtn = '';
      
      if (currentStatus === '未結清') {
        payBtn = `<button onclick="payExpense('${item.expense_id}')" style="margin-top:6px; padding:4px 8px; font-size:12px; background:var(--accent); color:#FFF; border:none; border-radius:4px; cursor:pointer;">💵 標記家長已給付</button>`;
      }

      html += `
        <div style="padding: 10px 0; border-bottom: 1px solid var(--border);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div><strong>${item.date}</strong> [${item.category}] $${item.amount}</div>
            <span class="badge ${badgeClass}">${currentStatus}</span>
          </div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${item.note || '無備註'}</div>
          ${payBtn}
        </div>`;
    });
  }

  // C. 儲值紀錄
  html += '<h4 style="margin:20px 0 12px 0; font-size:14px; color:var(--primary);">預繳儲值歷史紀錄</h4>';
  if (!data.transactions || data.transactions.length === 0) {
    html += '<p style="color:#999;font-size:13px;">尚無儲值紀錄</p>';
  } else {
    data.transactions.forEach(item => {
      const typeStr = item.type ? `[${item.type}] ` : '';
      const hrsStr = item.hours_added > 0 ? ` (+${item.hours_added}小時)` : '';
      html += `
        <div style="padding: 8px 0; border-bottom: 1px solid var(--border); font-size:13px;">
          <div><strong>${item.date}</strong> ${typeStr}收 $${item.amount_paid}${hrsStr}</div>
          <div style="font-size:12px; color:var(--text-muted);">${item.note || '無備註'}</div>
        </div>`;
    });
  }

  listEl.innerHTML = html;
}

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
    alert('請求已傳送，系統同步處理中！');
  } finally {
    btn.disabled = false;
    btn.innerText = '確認送出';
  }
}

async function updateScheduleStatus(scheduleId, actionType) {
  const confirmMsg = actionType === 'completeSchedule' ? '確定標記此堂課為「已上課」並扣除額度嗎？' : '確定取消此堂課嗎？';
  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: actionType,
        data: { schedule_id: scheduleId }
      })
    });
    const result = await res.json();
    if (result.success) {
      alert(result.message);
      loadDashboard();
    } else {
      alert(`操作失敗：${result.message}`);
    }
  } catch (err) {
    alert('連線處理中，請稍後按重新整理');
  }
}

async function payExpense(expenseId) {
  if (!confirm('確認已收到家長支付的此筆費用了嗎？')) return;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'payExpense',
        data: { expense_id: expenseId }
      })
    });
    const result = await res.json();
    if (result.success) {
      alert(result.message);
      loadDashboard();
    } else {
      alert(`操作失敗：${result.message}`);
    }
  } catch (err) {
    alert('連線處理中，請稍後按重新整理');
  }
}

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
    type: document.getElementById('dep-type').value,
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

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
