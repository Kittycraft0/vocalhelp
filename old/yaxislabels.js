window.onload = function() {
const yAxisCanvas = document.getElementById("yaxislabels");
const yAxisCtx = yAxisCanvas.getContext("2d");

const linearFrequencies = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
const logarithmicFrequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
const canvasHeight = yAxisCanvas.height;
const canvasWidth = yAxisCanvas.width;

function drawYAxisLabels() {
    yAxisCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    yAxisCtx.fillStyle = 'black';
    yAxisCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    yAxisCtx.fillStyle = 'white';
    yAxisCtx.font = '12px Arial';
    yAxisCtx.textAlign = 'right';

    const frequencies = data.visualType === "linear" ? linearFrequencies : logarithmicFrequencies;

    frequencies.forEach(frequency => {
        let y;
        if (data.visualType === "linear") {
            y = canvasHeight - (frequency / 10000) * canvasHeight;
        } else {
            y = canvasHeight - (Math.log(frequency) / Math.log(10) - Math.log(20) / Math.log(10)) / (Math.log(20000) / Math.log(10) - Math.log(20) / Math.log(10)) * canvasHeight;
        }
        yAxisCtx.fillText(`${frequency} Hz`, canvasWidth - 5, y);
        yAxisCtx.strokeStyle = 'white';
        yAxisCtx.beginPath();
        yAxisCtx.moveTo(canvasWidth - 5, y);
        yAxisCtx.lineTo(canvasWidth, y);
        yAxisCtx.stroke();
    });
}

drawYAxisLabels();
}