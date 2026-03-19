document.addEventListener('DOMContentLoaded', () => {
    const linkButtonsContainer = document.getElementById('link-buttons');
    let links = [];
    let currentCategory = 'AI 互動學習';

    async function loadCSV() {
        try {
            // 加上時間戳記防止 GitHub 快取舊資料
            const response = await fetch(`links.csv?t=${new Date().getTime()}`);
            const data = await response.text();
            
            // 解析 CSV (跳過第一行 header)
            const rows = data.split(/\r?\n/).slice(1);
            links = rows.filter(row => row.trim() !== '').map(row => {
                const [category, name, url] = row.split(',');
                return { category, name, url };
            });

            renderButtons();
        } catch (error) {
            console.error('CSV 載入錯誤:', error);
        }
    }

    function renderButtons() {
        linkButtonsContainer.innerHTML = '';

        // 建立分類 Tab
        const allCategories = [...new Set(links.map(l => l.category))];
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

        // 建立該分類下的按鈕
        const listContainer = document.createElement('div');
        listContainer.className = 'buttons-sub-grid';

        links.filter(l => l.category === currentCategory).forEach(link => {
            const a = document.createElement('a');
            a.className = 'link-button';
            a.href = link.url;
            a.textContent = `> ${link.name}`;
            
            if (link.url === '#') {
                a.onclick = (e) => e.preventDefault(); // 管理節點不跳轉
            } else {
                a.target = '_blank';
            }
            listContainer.appendChild(a);
        });
        linkButtonsContainer.appendChild(listContainer);
    }

    loadCSV();
});
