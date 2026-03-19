document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('link-buttons');
    let links = [];
    let currentCategory = 'AI 互動學習';

    async function loadCSV() {
        try {
            // 加上隨機數防止舊快取
            const response = await fetch(`links.csv?t=${Date.now()}`);
            const data = await response.text();
            
            const rows = data.split(/\r?\n/).slice(1);
            links = rows.filter(row => row.trim() !== '').map(row => {
                const [category, name, url] = row.split(',');
                return { 
                    category: category.trim(), 
                    name: name.trim(), 
                    url: url.trim() 
                };
            });

            // 設定初始分類（如果 CSV 第一筆不是 AI 互動學習）
            if (links.length > 0 && !links.find(l => l.category === currentCategory)) {
                currentCategory = links[0].category;
            }

            renderContent();
        } catch (error) {
            container.innerHTML = `<div class="loading-message">資料讀取失敗，請稍後再試。</div>`;
            console.error('CSV 載入錯誤:', error);
        }
    }

    function renderContent() {
        container.innerHTML = '';

        // 1. 分類導覽
        const allCategories = [...new Set(links.map(l => l.category))];
        const nav = document.createElement('div');
        nav.className = 'tab-navigation';
        
        allCategories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `tab-btn ${currentCategory === cat ? 'active' : ''}`;
            btn.textContent = cat;
            btn.onclick = () => { 
                currentCategory = cat; 
                renderContent(); 
            };
            nav.appendChild(btn);
        });
        container.appendChild(nav);

        // 2. 連結列表容器
        const listGrid = document.createElement('div');
        listGrid.className = 'buttons-sub-grid';

        // 3. 過濾並建立連結
        const filteredLinks = links.filter(l => l.category === currentCategory);
        filteredLinks.forEach(link => {
            const a = document.createElement('a');
            a.className = 'link-button';
            a.href = link.url;
            a.textContent = link.name; // 移除 ">" 符號，改用 CSS 控制
            
            if (link.url === '#') {
                a.onclick = (e) => e.preventDefault();
            } else {
                a.target = '_blank';
            }
            listGrid.appendChild(a);
        });

        container.appendChild(listGrid);
    }

    loadCSV();
});