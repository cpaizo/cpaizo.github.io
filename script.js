document.addEventListener('DOMContentLoaded', () => {
    const linkButtonsContainer = document.getElementById('link-buttons');
    const editPanel = document.getElementById('edit-panel');
    const editUrlInput = document.getElementById('edit-url');
    const editNameInput = document.getElementById('edit-name');
    const editCategoryInput = document.getElementById('edit-category');
    const saveButton = document.getElementById('save-button');
    const cancelButton = document.getElementById('cancel-button');
    const resetButton = document.getElementById('reset-storage');

    // 1. 預設資料（確保每個項目都有 category）
    const DEFAULT_LINKS = [
        { category: 'AI 互動學習', name: '圖像情境學習：魔法教室詞彙', url: 'https://cpaizo.github.io/english_interactive_app00.html' },
        { category: 'AI 互動學習', name: '浪漫情侶旅遊景點生成器', url: 'https://gemini.google.com/share/447a6f33103b' },
        { category: 'AI 海報工具', name: '小小旅行家 AI 海報 ', url: 'https://reurl.cc/VmMLx5' },
        { category: 'AI 海報工具', name: 'AI 海報設計師', url: 'https://gemini.google.com/share/ba50716adb67' },
        { category: 'AI 海報工具', name: 'AI 海報發表生成器', url: 'https://gemini.google.com/share/de9022b5a007' },
        { category: 'AI 海報工具', name: 'AI 海報提示詞與創作理念自動生成器', url: 'https://gemini.google.com/share/4cefd7f95e15' },
        { category: 'AI 海報工具', name: '永續生活海報靈感範例庫', url: 'https://gemini.google.com/share/6c26e594a2be' },
        { category: 'AI 海報工具', name: '學生專用AI海報設計器', url: 'https://cpaizo.github.io/student_poster_maker.html' },
        { category: '個人系統', name: '202601 植髮紀錄系統', url: 'https://script.google.com/macros/s/AKfycbyyLvUR_XBMBRIkyLpUJW7VLwJqM2YCxHATgboyL1RpRstix8UeFuA4BmNLlhRcUw9t/exec' },
        { category: '個人系統', name: '202601 CPAIZO 閱讀分享平台', url: 'https://cpaizo-app.web.app/' },
        { category: '管理', name: 'Node: 編輯此處', url: '#' }
    ];

    let links = JSON.parse(localStorage.getItem('minimalistLinks')) || DEFAULT_LINKS;
    let currentlyEditingIndex = -1;
    let currentCategory = links[0].category; // 預設顯示第一個分類

    // 2. 渲染函數（分頁標籤 + 該分頁的按鈕）
    function renderButtons() {
        linkButtonsContainer.innerHTML = '';

        // 取得目前所有不重複的分類
        const allCategories = [...new Set(links.map(link => link.category || '未分類'))];
        
        // 如果目前的分類被刪除或改名了，自動跳轉回第一個
        if (!allCategories.includes(currentCategory)) {
            currentCategory = allCategories[0] || '未分類';
        }

        // --- 建立分頁標籤 (Tabs) ---
        const tabNav = document.createElement('div');
        tabNav.className = 'tab-navigation';
        allCategories.forEach(cat => {
            const tab = document.createElement('button');
            tab.className = `tab-btn ${currentCategory === cat ? 'active' : ''}`;
            tab.textContent = cat;
            tab.onclick = () => {
                currentCategory = cat;
                renderButtons();
            };
            tabNav.appendChild(tab);
        });
        linkButtonsContainer.appendChild(tabNav);

        // --- 建立對應分類的按鈕網格 ---
        const grid = document.createElement('div');
        grid.className = 'buttons-sub-grid';

        links.forEach((link, index) => {
            if ((link.category || '未分類') === currentCategory) {
                const button = document.createElement('a');
                button.className = 'link-button animate-in';
                button.textContent = link.name;
                button.href = link.url;
                
                if (link.url === '#') {
                    button.target = '_self';
                    button.onclick = (e) => {
                        e.preventDefault();
                        showEditPanel(index);
                    };
                } else {
                    button.target = '_blank';
                }
                grid.appendChild(button);
            }
        });
        linkButtonsContainer.appendChild(grid);
    }

    // 3. 編輯面板邏輯
    function showEditPanel(index) {
        currentlyEditingIndex = index;
        const link = links[index];
        editUrlInput.value = link.url === '#' ? '' : link.url;
        editNameInput.value = link.name;
        editCategoryInput.value = link.category || '';
        
        editPanel.classList.remove('hidden');
        linkButtonsContainer.classList.add('hidden'); // 編輯時隱藏按鈕區
        editNameInput.focus();
    }

    function hideEditPanel() {
        editPanel.classList.add('hidden');
        linkButtonsContainer.classList.remove('hidden');
        currentlyEditingIndex = -1;
    }

    // 4. 事件監聽 (儲存、取消、重置)
    saveButton.addEventListener('click', () => {
        if (currentlyEditingIndex !== -1) {
            const newUrl = editUrlInput.value.trim();
            const newName = editNameInput.value.trim();
            const newCategory = editCategoryInput.value.trim() || '未分類';

            if (!newName) {
                alert('名稱不能為空！');
                return;
            }

            links[currentlyEditingIndex] = {
                name: newName,
                url: newUrl || '#',
                category: newCategory
            };

            localStorage.setItem('minimalistLinks', JSON.stringify(links));
            currentCategory = newCategory; // 儲存後自動跳轉到該分類
            renderButtons();
            hideEditPanel();
        }
    });

    cancelButton.addEventListener('click', hideEditPanel);

    resetButton.addEventListener('click', () => {
        if (confirm('確定要清除所有自訂內容並恢復預設嗎？')) {
            localStorage.removeItem('minimalistLinks');
            links = [...DEFAULT_LINKS];
            currentCategory = links[0].category;
            renderButtons();
            alert('已恢復預設！');
        }
    });

    // 初始化執行
    renderButtons();
});
