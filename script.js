document.addEventListener('DOMContentLoaded', () => {
    const linkButtonsContainer = document.getElementById('link-buttons');
    const editPanel = document.getElementById('edit-panel');
    const editUrlInput = document.getElementById('edit-url');
    const editNameInput = document.getElementById('edit-name');
    const editCategoryInput = document.getElementById('edit-category');
    const saveButton = document.getElementById('save-button');
    const cancelButton = document.getElementById('cancel-button');

    const DEFAULT_LINKS = [
        { category: 'AI 互動學習', name: '圖像情境學習：魔法教室詞彙', url: 'https://cpaizo.github.io/english_interactive_app00.html' },
        { category: 'AI 互動學習', name: '浪漫情侶旅遊景點生成器', url: 'https://gemini.google.com/share/447a6f33103b' },
        { category: 'AI 海報工具', name: '小小旅行家 AI 海報 ', url: 'https://reurl.cc/VmMLx5' },
        { category: 'AI 海報工具', name: 'AI 海報設計師', url: 'https://gemini.google.com/share/ba50716adb67' },
        { category: 'AI 海報工具', name: 'AI 海報發表生成器', url: 'https://gemini.google.com/share/de9022b5a007' },
        { category: 'AI 海報工具', name: 'AI 海報提示詞與創作理念自動生成器', url: 'https://gemini.google.com/share/4cefd7f95e15' },
        { category: 'AI 海報工具', name: '永續生活海報靈感範例庫', url: 'https://gemini.google.com/share/6c26e594a2be' },
        { category: 'AI 海報工具', name: '學生專用AI海報設計器', url: 'https://cpaizo.github.io/student_poster_maker.html' },
        { category: 'AI 海報工具', name: '2050 永續海報 AI 中英生成助手', url: 'https://gemini.google.com/share/e732b1379ef5' },
        { category: 'AI 工具', name: '多頁 PDF 視覺編輯器', url: 'https://gemini.google.com/share/4e4f7e9891e5' },
        { category: '個人系統', name: '202601 植髮紀錄系統', url: 'https://script.google.com/macros/s/AKfycbyyLvUR_XBMBRIkyLpUJW7VLwJqM2YCxHATgboyL1RpRstix8UeFuA4BmNLlhRcUw9t/exec' },
        { category: '個人系統', name: '202601 CPAIZO 閱讀分享平台', url: 'https://cpaizo-app.web.app/' },
        { category: '管理', name: 'Node: 編輯此處', url: '#' }
    ];

    let links = JSON.parse(localStorage.getItem('minimalistLinks')) || DEFAULT_LINKS;
    let currentCategory = 'AI 互動學習';
    let currentlyEditingIndex = -1;

    function renderButtons() {
        linkButtonsContainer.innerHTML = '';

        // 1. 分類選單
        const allCategories = [...new Set(links.map(l => l.category || '管理'))];
        const nav = document.createElement('div');
        nav.className = 'tab-navigation';
        
        allCategories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `tab-btn ${currentCategory === cat ? 'active' : ''}`;
            btn.textContent = cat;
            btn.onclick = () => { currentCategory = cat; renderButtons(); };
            nav.appendChild(btn);
        });
        linkButtonsContainer.appendChild(nav);

        // 2. 連結清單 (表格化排列)
        const listContainer = document.createElement('div');
        listContainer.className = 'buttons-sub-grid';

        links.forEach((link, index) => {
            if (link.category === currentCategory) {
                const a = document.createElement('a');
                a.className = 'link-button';
                a.href = link.url;
                a.textContent = `> ${link.name}`; // 加入提示符號增加質感
                
                if (link.url === '#') {
                    a.onclick = (e) => { e.preventDefault(); showEditPanel(index); };
                } else {
                    a.target = '_blank';
                }
                listContainer.appendChild(a);
            }
        });
        linkButtonsContainer.appendChild(listContainer);
    }

    function showEditPanel(index) {
        currentlyEditingIndex = index;
        const link = links[index];
        editUrlInput.value = link.url === '#' ? '' : link.url;
        editNameInput.value = link.name;
        editCategoryInput.value = link.category;
        editPanel.classList.remove('hidden');
        linkButtonsContainer.classList.add('hidden');
    }

    saveButton.onclick = () => {
        links[currentlyEditingIndex] = {
            url: editUrlInput.value || '#',
            name: editNameInput.value,
            category: editCategoryInput.value
        };
        localStorage.setItem('minimalistLinks', JSON.stringify(links));
        editPanel.classList.add('hidden');
        linkButtonsContainer.classList.remove('hidden');
        renderButtons();
    };

    cancelButton.onclick = () => {
        editPanel.classList.add('hidden');
        linkButtonsContainer.classList.remove('hidden');
    };

    renderButtons();
});


