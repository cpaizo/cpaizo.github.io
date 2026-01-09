document.addEventListener('DOMContentLoaded', () => {
    const linkButtonsContainer = document.getElementById('link-buttons');
    const editPanel = document.getElementById('edit-panel');
    const editUrlInput = document.getElementById('edit-url');
    const editNameInput = document.getElementById('edit-name');
    const saveButton = document.getElementById('save-button');
    const cancelButton = document.getElementById('cancel-button');

    // 預設 5 個連結的初始狀態
    const DEFAULT_LINKS = [
        { name: '圖像情境學習：魔法教室詞彙', url: 'https://cpaizo.github.io/english_interactive_app00.html' },
        { name: '浪漫情侶旅遊景點生成器', url: 'https://gemini.google.com/share/447a6f33103b' },
        { name: '小小旅行家 AI 海報 ', url: 'https://reurl.cc/VmMLx5' },
        { name: 'AI 海報設計師', url: 'https://gemini.google.com/share/ba50716adb67' },
        { name: 'AI 海報發表生成器', url: 'https://gemini.google.com/share/de9022b5a007' },
        { name: 'AI 海報提示詞與創作理念自動生成器', url: 'https://gemini.google.com/share/4cefd7f95e15' },
        { name: '永續生活海報靈感範例庫', url: 'https://gemini.google.com/share/6c26e594a2be' },
        { name: '學生專用AI海報設計器', url: 'https://cpaizo.github.io/student_poster_maker.html' },
        { name: '202601植髮紀錄系統', url: 'https://script.google.com/macros/s/AKfycbyyLvUR_XBMBRIkyLpUJW7VLwJqM2YCxHATgboyL1RpRstix8UeFuA4BmNLlhRcUw9t/exec' },
        { name: '202601CPAIZO 閱讀分享平台', url: 'https://cpaizo-app.web.app/' },
        { name: 'Node 08: 編輯此處', url: '#' }
    ];
    
    // 從 localStorage 載入連結，如果沒有則使用預設值
    let links = JSON.parse(localStorage.getItem('minimalistLinks')) || DEFAULT_LINKS;
    let currentlyEditingIndex = -1; // 用來追蹤目前正在編輯哪個按鈕

    // 渲染按鈕到頁面
    function renderButtons() {
        linkButtonsContainer.innerHTML = '';
        links.forEach((link, index) => {
            const button = document.createElement('a');
            button.className = 'link-button';
            button.textContent = link.name;
            button.href = link.url;
            
            // 如果網址是 '#' (未設定)，則點擊會進入編輯模式
            if (link.url === '#') {
                button.target = '_self'; // 在同一頁面打開
                button.onclick = (e) => {
                    e.preventDefault(); // 阻止跳轉
                    showEditPanel(index);
                };
            } else {
                button.target = '_blank'; // 開啟新視窗
            }

            linkButtonsContainer.appendChild(button);
        });
    }

    // 顯示編輯面板
    function showEditPanel(index) {
        currentlyEditingIndex = index;
        const link = links[index];
        
        // 將當前的連結資訊填入輸入框
        editUrlInput.value = link.url === '#' ? '' : link.url;
        editNameInput.value = link.name;
        
        editPanel.classList.remove('hidden');
        linkButtonsContainer.classList.add('hidden'); // 隱藏按鈕區
        editNameInput.focus();
    }

    // 隱藏編輯面板
    function hideEditPanel() {
        editPanel.classList.add('hidden');
        linkButtonsContainer.classList.remove('hidden'); // 顯示按鈕區
        currentlyEditingIndex = -1;
    }

    // 儲存變更
    saveButton.addEventListener('click', () => {
        if (currentlyEditingIndex !== -1) {
            const newUrl = editUrlInput.value.trim();
            const newName = editNameInput.value.trim();

            if (!newName) {
                alert('按鈕名稱不能為空！');
                return;
            }

            // 更新 links 陣列中的資料
            links[currentlyEditingIndex].url = newUrl || '#'; 
            links[currentlyEditingIndex].name = newName;

            // 儲存到本地儲存 (Local Storage)
            localStorage.setItem('minimalistLinks', JSON.stringify(links));

            renderButtons(); // 重新渲染按鈕
            hideEditPanel(); // 隱藏編輯面板
        }
    });

    // 取消編輯
    cancelButton.addEventListener('click', () => {
        hideEditPanel();
    });

    // 初始化頁面
    renderButtons();

});



