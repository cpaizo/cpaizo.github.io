const video = document.getElementById('video');
const canvas = document.getElementById('snapshot');
const captureButton = document.getElementById('capture');
const frame = document.getElementById('frame');
const photo = document.getElementById('photo');

// 請求使用平板的前鏡頭
navigator.mediaDevices.getUserMedia({ 
    video: { facingMode: 'user' } 
})
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(error => {
        console.error('Error accessing the camera', error);
    });

captureButton.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');

    // 顯示拍照結果
    photo.src = imageData;

    // 創建一個連結元素並觸發下載
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'photo.png';
    link.click();
});
