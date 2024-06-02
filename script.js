const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageLoader = document.getElementById('imageLoader');
const colorPicker = document.getElementById('colorPicker');
const redAreaDisplay = document.getElementById('redArea');
const blueAreaDisplay = document.getElementById('blueArea');
const greenAreaDisplay = document.getElementById('greenArea');
const redMultiplierInput = document.getElementById('redMultiplier');
const blueMultiplierInput = document.getElementById('blueMultiplier');
const greenMultiplierInput = document.getElementById('greenMultiplier');
const redResultDisplay = document.getElementById('redResult');
const blueResultDisplay = document.getElementById('blueResult');
const greenResultDisplay = document.getElementById('greenResult');
let drawing = false;
let points = [];
let img = new Image();
const knownBlackArea = 1.0;  // Known black area in square centimeters (cm²)
let calibrationRatio = null;

let polygons = {
    red: [],
    blue: [],
    green: []
};

imageLoader.addEventListener('change', handleImage, false);

function handleImage(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            calculateBlackAreaPixels();
            drawPinkDashedRectangle(); // 載入圖片後繪製粉紅色虛線矩形
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);

function startDrawing(event) {
    drawing = true;
    points = [{ x: event.offsetX, y: event.offsetY }];
}

function draw(event) {
    if (!drawing) return;
    points.push({ x: event.offsetX, y: event.offsetY });
    redraw();
}

function endDrawing(event) {
    drawing = false;
    points.push({ x: event.offsetX, y: event.offsetY });
    let color = colorPicker.value;
    if (!polygons[color]) {
        polygons[color] = [];
    }
    polygons[color].push([...points]);
    calculateArea(color);
    points = [];
    redraw();
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    for (let color in polygons) {
        polygons[color].forEach(poly => {
            ctx.beginPath();
            ctx.moveTo(poly[0].x, poly[0].y);
            for (let i = 1; i < poly.length; i++) {
                ctx.lineTo(poly[i].x, poly[i].y);
            }
            ctx.closePath();
            ctx.strokeStyle = color;
            ctx.stroke();
        });
    }

    if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = colorPicker.value;
        ctx.stroke();
    }
}

function calculateArea(color) {
    const poly = polygons[color][polygons[color].length - 1];
    if (poly.length < 3 || calibrationRatio === null) return;

    let area = 0;
    for (let i = 0; i < poly.length; i++) {
        const j = (i + 1) % poly.length;
        area += poly[i].x * poly[j].y;
        area -= poly[j].x * poly[i].y;
    }
    area = Math.abs(area) / 2;

    const areaCm2 = area * calibrationRatio;
    console.log(`Calculated area in pixels: ${area}, Calibration ratio: ${calibrationRatio}, Area in cm²: ${areaCm2}`);
    
    // 更新顯示的面積
    if (color === 'red') {
        redAreaDisplay.textContent = areaCm2.toFixed(2);
        redResultDisplay.textContent = (areaCm2 * parseFloat(redMultiplierInput.value)).toFixed(2);
    } else if (color === 'blue') {
        blueAreaDisplay.textContent = areaCm2.toFixed(2);
        blueResultDisplay.textContent = (areaCm2 * parseFloat(blueMultiplierInput.value)).toFixed(2);
    } else if (color === 'green') {
        greenAreaDisplay.textContent = areaCm2.toFixed(2);
        greenResultDisplay.textContent = (areaCm2 * parseFloat(greenMultiplierInput.value)).toFixed(2);
    }
}

function calculateBlackAreaPixels() {
    // 取得左上角從 (10, 10) 開始，寬高為 200 像素
    const blackRegion = ctx.getImageData(10, 10, 200, 200); 
    let blackPixels = 0;

    // 遍歷這個區域的每個像素
    for (let i = 0; i < blackRegion.data.length; i += 4) {
        // 每個像素有 4 個值 (R, G, B, A)
        const [r, g, b, a] = blackRegion.data.slice(i, i + 4);
        // 判斷這個像素是否是黑色 (閾值 < 50，透明度 > 200)
        if (r < 50 && g < 50 && b < 50 && a > 200) {
            blackPixels++;
        }
    }

    // 計算校準比例
    if (blackPixels > 0) {
        calibrationRatio = knownBlackArea / blackPixels;
    } else {
        calibrationRatio = null;
    }
    console.log(`黑色區域的像素數: ${blackPixels}, 校準比例: ${calibrationRatio}`);
}

function drawPinkDashedRectangle() {
    // 繪製粉紅色虛線矩形
    ctx.strokeStyle = 'pink'; 
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); 
    ctx.strokeRect(10, 10, 200, 200); // 粉紅色虛線矩形的位置和大小
}
