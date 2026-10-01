const API_URL = "https://script.google.com/macros/s/AKfycbwjEJXEt3d8NDs6O5DyGlcRid-X4-2Avu-KqsXUwir1Gd4C2qANJY-k_UkUohc16-gy3A/exec";

let globalDashboardData = null;
let currentSubTab = 'schedules';

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split('T')[0];
  
  const schDate = document.getElementById('sch-date');
  const depDate = document.getElementById('dep-date');
  const expDate = document.getElementById('exp-date');

  if (schDate) schDate.value = today;
  if (depDate) depDate.value = today;
  if (expDate) expDate.value = today;

  const schStart = document.getElementById('sch-start');
  const schEnd = document.getElementById('sch-end');
  if (schStart) schStart.addEventListener('change', autoCalculateHours);
  if (schEnd) schEnd.addEventListener('change', autoCalculateHours);

  const depType = document.getElementById('dep-type');
  if (depType) depType.addEventListener('change', toggleDepositType);

  autoCalculateHours();
  loadDashboard();
  registerServiceWorker();
});

function autoCalculateHours() {
  const startEl = document.getElementById('sch-start');
  const endEl = document.getElementById('sch-end');
  const hoursEl = document.getElementById('sch-hours');

  if (startEl && endEl && hoursEl) {
    const start = startEl.value;
    const end = endEl.value;

    if (start && end) {
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);

      let durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      if (durationMinutes > 0) {
        hoursEl.value = durationMinutes / 60;
      }
    }
  }
}

function toggleDepositType() {
  const typeEl = document.getElementById('dep-type');
  const rateGroup = document.getElementById('group-rate');
  const amountInput = document.getElementById('dep-amount');

  if (typeEl && rateGroup && amountInput) {
    const val = typeEl.value;
    if (val === '停車費') {
      rateGroup.style.display = 'none';
      amountInput.value = '1000';
    } else if (val === '材料費') {
      rateGroup.style.display = 'none';
      amountInput.value = '1000';
    } else {
      rateGroup.style.display = 'block';
      amountInput.value = '15000';
    }
  }
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  if (event && event.target) {
    event.target.classList.add('active');
  }
  
  const targetContent = document.getElementById(`tab-${tabName}`);
  if (targetContent) targetContent.classList.add('active');
}

function switchSubTab(subTabName) {
  currentSubTab = subTabName;
  
  const btns = document.querySelectorAll('.sub-tab-btn');
  btns.forEach(btn => btn.classList.remove('active'));
  
  if (event && event.target) {
    event.target.classList.add('active');
  }

  renderSubTabContent();
}

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
      globalDashboardData = data;
      const summary = data.summary || {};
      
      const elUsed = document.getElementById('stat-used');
      const elRemaining = document.getElementById('stat-remaining');
      const elParkingBalance = document.getElementById('stat-parking-balance');

      if (elUsed) elUsed.innerText = `${summary.hoursUsed || 0} / ${summary.totalHoursPurchased || 0}`;
      if (elRemaining) elRemaining.innerText = `${summary.remainingHours || 0} 小時`;
      
      // 停車費額度顯示 (若小於 0 顯示紅色負數)
      if (elParkingBalance) {
        const balance = summary.remainingParkingBalance || 0;
        if (balance < 0) {
          elParkingBalance.innerHTML = `<span style="color: var(--danger); font-weight: bold;">- $${Math.abs(balance)}</span>`;
        } else {
          elParkingBalance.innerText = `$${balance}`;
        }
      }
      
      renderSubTabContent();
    }
  } catch (err) {
    console.error('API 載入失敗:', err);
  }
}

function renderSubTabContent() {
  const container = document.getElementById('history-sub-content');
  if (!container) return;

  if (!globalDashboardData) {
    container.innerHTML = '<p style="color:#999;font-size:13px;text-align:center;">資料載入中...</p>';
    return;
  }

  const data = globalDashboardData;
  let html = '';

  if (currentSubTab === 'schedules') {
    html += '<h4 style="margin:0 0 12px 0; font-size:14px; color:var(--primary);">📅 排課清單與考勤確認</h4>';
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
  } 
  else if (currentSubTab === 'parking') {
    html += '<h4 style="margin:0 0 12px 0; font-size:14px; color:var(--primary);">🅿️ 停車費扣款明細</h4>';
    const parkingList = data.parking || [];
    
    if (parkingList.length === 0) {
      html += '<p style="color:#999;font-size:13px;">尚無停車費扣款紀錄</p>';
    } else {
      parkingList.forEach(item => {
        html += `
          <div style="padding: 10px 0; border-bottom: 1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div><strong>${item.date}</strong> <span style="font-size:12px; color:var(--text-muted);">(${item.hours}小時)</span></div>
              <div style="font-weight:600; color:var(--accent);">- $${item.amount}</div>
            </div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${item.note || '自動計算扣除'}</div>
          </div>`;
      });
    }
  } 
  else if (currentSubTab === 'materials') {
    html += '<h4 style="margin:0 0 12px 0; font-size:14px; color:var(--primary);">🛠️ 材料費明細</h4>';
    const materialList = data.materials || [];
    
    if (materialList.length === 0) {
      html += '<p style="color:#999;font-size:13px;">尚無材料費紀錄</p>';
    } else {
      materialList.forEach(item => {
        const currentStatus = String(item.status || '').trim();
        let badgeClass = (currentStatus === '已結清') ? 'badge-done' : 'badge-pending';
        let payBtn = '';
        
        if (currentStatus === '未結清') {
          payBtn = `<button onclick="payExpense('${item.material_id}')" style="margin-top:6px; padding:4px 8px; font-size:12px; background:var(--accent); color:#FFF; border:none; border-radius:4px; cursor:pointer;">💵 標記家長已給付</button>`;
        }

        html += `
          <div style="padding: 10px 0; border-bottom: 1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div><strong>${item.date}</strong> $${item.amount}</div>
              <span class="badge ${badgeClass}">${currentStatus}</span>
            </div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${item.note || '無備註'}</div>
            ${payBtn}
          </div>`;
      });
    }
  } 
  else if (currentSubTab === 'transactions') {
    html += '<h4 style="margin:0 0 12px 0; font-size:14px; color:var(--primary);">💰 預繳儲值歷史紀錄</h4>';
    if (!data.transactions || data.transactions.length === 0) {
      html += '<p style="color:#999;font-size:13px;">尚無儲值紀錄</p>';
    } else {
      data.transactions.forEach(item => {
        const typeStr = item.type ? `[${item.type}] ` : '';
        const hrsStr = item.hours_added > 0 ? ` (+${item.hours_added}小時)` : '';
        html += `
          <div style="padding: 10px 0; border-bottom: 1px solid var(--border); font-size:13px;">
            <div><strong>${item.date}</strong> ${typeStr}收到 $${item.amount_paid}${hrsStr}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${item.note || '無備註'}</div>
          </div>`;
      });
    }
  }

  container.innerHTML = html;
}

async function sendData(action, payload, btnId) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.disabled = true;
    btn.innerText = '處理中...';
  }

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
    if (btn) {
      btn.disabled = false;
      btn.innerText = '確認送出';
    }
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

async function payExpense(materialId) {
  if (!confirm('確認已收到家長支付的此筆材料費了嗎？')) return;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'payExpense',
        data: { material_id: materialId }
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

const formSch = document.getElementById('form-schedule');
if (formSch) {
  formSch.addEventListener('submit', (e) => {
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
}

const formDep = document.getElementById('form-deposit');
if (formDep) {
  formDep.addEventListener('submit', (e) => {
    e.preventDefault();
    sendData('addTransaction', {
      type: document.getElementById('dep-type').value,
      date: document.getElementById('dep-date').value.replace(/-/g, '/'),
      amount_paid: document.getElementById('dep-amount').value,
      hourly_rate: document.getElementById('dep-rate').value,
      note: document.getElementById('dep-note').value
    }, 'btn-dep');
  });
}

const formExp = document.getElementById('form-expense');
if (formExp) {
  formExp.addEventListener('submit', (e) => {
    e.preventDefault();
    sendData('addExpense', {
      date: document.getElementById('exp-date').value.replace(/-/g, '/'),
      category: document.getElementById('exp-category').value,
      amount: document.getElementById('exp-amount').value,
      note: document.getElementById('exp-note').value
    }, 'btn-exp');
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
