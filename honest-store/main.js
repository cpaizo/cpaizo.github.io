// main.js - AI 核心驅動邏輯

// 1. 填入你在【第零階段】複製的雲端模型網址
// ⚠️ 注意：網址最後面一定要有斜線 "/" 喔！
// ⭕ 請換成這串全新活著的蔬果模型網址（包含：背景、有機小黃瓜、網室番茄）
const URL = "https://teachablemachine.withgoogle.com/models/VMUHU47gA/";

let model, webcam, labelContainer, maxPredictions;

// 2. 初始化攝影機與載入 AI 模型
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // 向雲端下載模型結構與分類標籤
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // 設定攝影機參數 (寬度, 高度, 是否開啟翻轉)
    const flip = true; 
    webcam = new tmImage.Webcam(320, 320, flip); 
    
    // 請求瀏覽器權限並開啟網路攝影機
    await webcam.setup(); 
    await webcam.play();
    
    // 啟動主迴圈，讓網頁不斷刷新畫面
    window.requestAnimationFrame(loop);

    // 將攝影機的畫面（canvas）塞進網頁中識別為 webcam-container 的地方
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    
    // 根據 AI 模型的類別數量，動態在網頁上建立對應數量的文字框
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        const div = document.createElement("div");
        div.className = "label-item";
        labelContainer.appendChild(div);
    }
}

// 3. 影像主迴圈：讓鏡頭畫面不斷更新並同步預測
async function loop() {
    webcam.update(); // 更新鏡頭擷取到的最新畫面
    await predict(); // 叫 AI 進行即時預測
    window.requestAnimationFrame(loop);
}

// 4. 叫 AI 計算即時機率並呈現在網頁上
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    for (let i = 0; i < maxPredictions; i++) {
        // 將類別名稱與分數（換算成百分比，並四捨五入去掉小數點），組合在一起
        const classPrediction =
            prediction[i].className + ": " + (prediction[i].probability * 100).toFixed(0) + "%";
        
        // 把組合好的文字更新到網頁對應的欄位中
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}
