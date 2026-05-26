const URL = "https://teachablemachine.withgoogle.com/models/V6Bl8_dTD/";

const fruitDatabase = {
    "香蕉": { name: "🍌 烏來山區泉水現採香蕉", price: 20, eco: "支持烏來泰雅部落小農，在地運送零污染！" },
    "紅蘋果": { name: "🍎 淡水在地現摘高山紅蘋果", price: 25, eco: "淡水就地取材，免除跨國坐船海運排碳！" },
    "青蘋果": { name: "🍏 三芝海岸陽光脆甜青蘋果", price: 25, eco: "三芝海風灌溉，食物里程縮短 100 倍！" },
    "奇異果": { name: "🥝 烏來山區有機友善奇異果", price: 30, eco: "保護烏來森林水源，吃得健康又環保！" },
    "楊桃": { name: "🌟 八里觀音山左岸黃金楊桃", price: 20, eco: "八里直送，減少大卡車環島運送的廢氣！" }
};

let model, webcam, labelContainer, maxPredictions;
let shoppingCart = {};
let isCoolingDown = false;
let animationFrameId;

// 建立清脆高音「嗶」音效 (1500Hz)
function playHighBeepSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine'; 
        oscillator.frequency.value = 1500; 
        
        gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
        console.log("音效播放失敗:", e);
    }
}

// 建立新交易「叮咚」雙音節提示音
function playNewTransactionSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        
        // 第一個音
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.frequency.value = 880; 
        gain1.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.15);

        // 第二個音 (延遲 0.1 秒)
        setTimeout(() => {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.frequency.value = 1174.66; 
            gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.2);
        }, 100);

    } catch (e) {
        console.log("音效播放失敗:", e);
    }
}

// 當 HTML 載入完成後觸發
document.addEventListener("DOMContentLoaded", function() {
    console.log("全新安全通道就緒，緩衝 1.2 秒後啟動相機流程...");
    setTimeout(checkAndInit, 1200);
});

function checkAndInit() {
    if (typeof tf !== 'undefined' && typeof tmImage !== 'undefined') {
        document.getElementById("loading-text").style.display = "none";
        initCameraFlow();
    } else {
        console.log("⏳ 正在等待安全通道資源送達大腦...");
        setTimeout(checkAndInit, 500);
    }
}

// 核心鏡頭流程
async function initCameraFlow() {
    document.getElementById("ai-status").innerText = "⏳ 正在與 Google 雲端 AI 大腦連線...";
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        document.getElementById("ai-status").innerText = "🔑 請確認並允許瀏覽器上方的相機存取權限...";
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        tempStream.getTracks().forEach(track => track.stop());

        let targetDeviceId = undefined;

        if (videoDevices.length > 1) {
            let promptMessage = "【AI 商店鏡頭硬體管理中心】\n系統偵測到這台電腦接有多組鏡頭，請輸入號碼指定：\n\n";
            videoDevices.forEach((device, index) => {
                promptMessage += `【${index}】 : ${device.label || '影像硬體裝置 ' + (index+1)}\n`;
            });
            promptMessage += "\n請輸入數字號碼並按下確定 (預設為 0) :";

            const userInput = prompt(promptMessage, "0");
            const selectedIndex = parseInt(userInput, 10);

                    if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < videoDevices.length) {
                targetDeviceId = videoDevices[selectedIndex].deviceId;
            }
        } else if (videoDevices.length === 1) {
            targetDeviceId = videoDevices[0].deviceId;
        }

        await startWebcamWithDevice(targetDeviceId);
        document.getElementById("start-btn").style.display = "none";
        document.getElementById("ai-status").innerText = "🍏 偵測中...請把新北水果拿到鏡頭前！";

    } catch (error) {
        console.error("相機初始化失敗:", error);
        document.getElementById("ai-status").innerText = "❌ 相機硬體啟動失敗";
        document.getElementById("webcam-container").innerHTML = "<div style='color:#e74c3c; padding:20px; font-weight:bold; font-size:14px; text-align:center;'>❌ 啟動失敗！請確認上方有允許相機權限。<br>若已允許，請點擊下方橘色按鈕手動重試。</div>";
        document.getElementById("start-btn").style.display = "block";
    }
}

// 啟動 Webcam
async function startWebcamWithDevice(deviceId) {
    if (webcam) {
        await webcam.stop();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    }

    const flip = true;
    webcam = new tmImage.Webcam(320, 240, flip);

    if (deviceId) {
        await webcam.setup({ deviceId: deviceId });
    } else {
        await webcam.setup();
    }

    await webcam.play();
    animationFrameId = window.requestAnimationFrame(loop);

    const container = document.getElementById("webcam-container");
    container.innerHTML = "";
    container.appendChild(webcam.canvas);

    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "";
    for (let i = 0; i < maxPredictions; i++) {
        const div = document.createElement("div");
        div.className = "label-row";
        labelContainer.appendChild(div);
    }
}

async function loop() {
    webcam.update(); 
    await predict();
    animationFrameId = window.requestAnimationFrame(loop);
}

// AI 辨識
async function predict() {
    if (!model || !webcam) return;

    const prediction = await model.predict(webcam.canvas);
    let highestClass = "";
    let highestProbability = 0;

    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probValue = prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = `<span>${className}</span> <b>${probValue}</b>`;

        if (prediction[i].probability > highestProbability) {
            highestProbability = prediction[i].probability;
            highestClass = className;
        }
    }

    if (highestProbability > 0.85 && highestClass !== "背景" && !isCoolingDown) {
        if (fruitDatabase[highestClass]) {
            addToCart(highestClass);
            triggerCoolDown();
        }
    }
}

function triggerCoolDown() {
    isCoolingDown = true;
    document.getElementById("ai-status").innerHTML = "⚡ 商品感應成功！大腦冷卻防呆中...";
    document.getElementById("ai-status").style.backgroundColor = "#ffeaa7";
    document.getElementById("ai-status").style.color = "#d63031";

    setTimeout(() => {
        isCoolingDown = false;
        document.getElementById("ai-status").innerHTML = "🍏 偵測中...請把新北水果拿到鏡頭前！";
        document.getElementById("ai-status").style.backgroundColor = "#e2f4e9";
        document.getElementById("ai-status").style.color = "#27ae60";
    }, 2500); 
}

function addToCart(label) {
    if (shoppingCart[label]) {
        shoppingCart[label].count++;
    } else {
        shoppingCart[label] = {
            name: fruitDatabase[label].name,
            price: fruitDatabase[label].price,
            count: 1
        };
    }
    
    playHighBeepSound();
    createLeafEffect();
    renderCart();
}

// 開啟新交易
function startNewTransaction() {
    shoppingCart = {};
    renderCart();
    
    const card = document.getElementById("esg-card");
    card.style.display = "none";
    card.innerHTML = "";
    
    playNewTransactionSound();
    document.getElementById("ai-status").innerHTML = "🍏 新交易已開啟！請把新北水果拿到鏡頭前！";
}

function decreaseItem(label) {
    if (shoppingCart[label]) {
        shoppingCart[label].count--;
        if (shoppingCart[label].count <= 0) {
            delete shoppingCart[label];
        }
    }
    renderCart();
}

function renderCart() {
    const cartList = document.getElementById("cart-list");
    cartList.innerHTML = "";
    let total = 0;

    for (let label in shoppingCart) {
        const item = shoppingCart[label];
        const rowTotal = item.price * item.count;
        total += rowTotal;

        const row = document.createElement("div");
        row.className = "item-row";
        row.innerHTML = `
            <span>${item.name} <b>x${item.count}</b></span>
            <div>
                <span style="margin-right:10px;">$${rowTotal}</span>
                <button class="del-btn" onclick="decreaseItem('${label}')">放回去 ↩</button>
            </div>
        `;
        cartList.appendChild(row);
    }
    document.getElementById("total-amount").innerText = total;
}

function createLeafEffect() {
    const icons = ['🌱', '🌿', '💚', '☘️'];
    for (let i = 0; i < 6; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'leaf-particle';
        leaf.innerText = icons[Math.floor(Math.random() * icons.length)];
        leaf.style.left = (window.innerWidth / 2 + (Math.random() * 200 - 100)) + 'px';
        leaf.style.top = (window.innerHeight / 2 + (Math.random() * 200 - 100)) + 'px';
        document.body.appendChild(leaf);
        setTimeout(() => leaf.remove(), 1200);
    }
}

function checkout() {
    const total = document.getElementById("total-amount").innerText;
    if (total == "0") {
        alert("購物車還是空的，拿個水果感應一下吧！");
        return;
    }

    let pName = prompt("請輸入您的名字（將列印在永續大師證書上）：", "花仙子長官");
    if (!pName) pName = "低碳生活實踐者";

    let ecoStory = "";
    for (let label in shoppingCart) {
        ecoStory += `<li><b>${shoppingCart[label].name}</b>：${fruitDatabase[label].eco}</li>`;
    }

    const card = document.getElementById("esg-card");
    card.style.display = "block";
    card.innerHTML = `
        <h2 style="color:#27ae60; margin-top:0;">🏆 花仙子綠色永續生活大師證書 🏆</h2>
        <p style="font-size:18px;">感謝 <b>【${pName}】</b> 總監參與新北市低碳在地消費！</p>
        <p style="font-size:16px; background:white; padding:15px; border-radius:10px; text-align:left; line-height:1.6;">
            本次消費總金額為 <b style="color:#e74c3c; font-size:20px;">$${total}</b> 元。<br>
            您今天購買的都是新北市在地特產，您達成的<b>【低碳減碳成就】</b>有：
            <ul style="text-align:left; padding-left:20px;">
                ${ecoStory}
            </ul>
        </p>
        <h3 style="color:#219653; margin-bottom:0;">🌱 花仙子去味大師與 科丁聯盟 聯名推薦：恭喜你成為新北減碳超人！ 🌱</h3>
    `;
    
    for(let i=0; i<15; i++) {
        setTimeout(createLeafEffect, i * 100);
    }
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}