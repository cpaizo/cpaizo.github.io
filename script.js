document.addEventListener('DOMContentLoaded', () => {
    const linkButtonsContainer = document.getElementById('link-buttons');
    const editPanel = document.getElementById('edit-panel');
    const editUrlInput = document.getElementById('edit-url');
    const editNameInput = document.getElementById('edit-name');
    const editCategoryInput = document.getElementById('edit-category'); // 新增分類輸入
    const saveButton = document.getElementById('save-button');
    const cancelButton = document.getElementById('cancel-button');
    const resetButton = document.getElementById('reset-storage'); // 新增重置按鈕

    // 預設資料（已加入 category 欄位）
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

    // 渲染按鈕邏輯：改為按分類分組
    function renderButtons() {
        linkButtonsContainer.innerHTML = '';

        // 1. 將資料按 category 分組
        const groups = links.reduce((acc, link) => {
            const cat = link.category || '未分類';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(link);
            return acc;
        }, {});

        // 2. 跑迴圈產生各分類區塊
        for (const category in groups) {
            const section = document.createElement('div');
            section.className = 'category-group';
            section.innerHTML = `<h3 class="category-title">${category}</h3><div class="buttons-sub-grid"></div>`;
            
            const grid = section.querySelector('.buttons-sub-grid');

            groups[category].forEach((link) => {
                // 找出該 link 在原始 links 陣列中的索引（為了編輯功能）
                const originalIndex = links.indexOf(link);
                
                const button = document.createElement('a');
                button.className = 'link-button';
                button.textContent = link.name;
                button.href = link.url;
                
                if (link.url === '#') {
                    button.target = '_self';
                    button.onclick = (e) => {
                        e.preventDefault();
                        showEditPanel(originalIndex);
                    };
                } else {
                    button.target = '_blank';
                }
                grid.appendChild(button);
            });
            linkButtonsContainer.appendChild(section);
        }
    }

    function showEditPanel(index) {
        currentlyEditingIndex = index;
        const link = links[index];
        editUrlInput.value = link.url === '#' ? '' : link.url;
        editNameInput.value = link.name;
        editCategoryInput.value = link.category || '';
        
        editPanel.classList.remove('hidden');
        linkButtonsContainer.classList.add('hidden');
        editNameInput.focus();
    }

    function hideEditPanel() {
        editPanel.classList.add('hidden');
        linkButtonsContainer.classList.remove('hidden');
        currentlyEditingIndex = -1;
    }

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
            renderButtons();
            hideEditPanel();
        }
    });

    cancelButton.addEventListener('click', hideEditPanel);

    // 強制重置功能
    resetButton.addEventListener('click', () => {
        if (confirm('確定要重置所有連結嗎？這會清除您的自訂修改並恢復預設。')) {
            localStorage.removeItem('minimalistLinks');
            links = [...DEFAULT_LINKS];
            renderButtons();
            alert('已成功恢復預設值！');
        }
    });

    renderButtons();
});
