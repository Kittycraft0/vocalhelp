// 3/16/2025 @ 12:21 AM CST
var spectrogramCanvas = document.getElementById("spectrogramvisualization");
const spectrogramCtx = spectrogramCanvas.getContext("2d");

window.onload = function() {
    // Initialize the spectrogram canvas with a black background
    spectrogramCtx.fillStyle = 'rgb(0, 0, 0)';
    spectrogramCtx.fillRect(0, 0, spectrogramCanvas.width, spectrogramCanvas.height);
// Draw red lines on the spectrogram, code present for reference and use. Keep it with the spectrogram code.
if(data.drawSpectrogramSecondLines){
setInterval(()=>{
    // Scroll the spectrogram left
    const imageData = spectrogramCtx.getImageData(1, 0, spectrogramCanvas.width-1, spectrogramCanvas.height);
    spectrogramCtx.putImageData(imageData, 0, 0);
  
    // Draw red line on the right edge
    spectrogramCtx.fillStyle = `rgb(255,0,0)`;
    spectrogramCtx.fillRect(spectrogramCanvas.width - 1, 0, 1, spectrogramCanvas.height);
},1000);
}
}

function drawSpectrogram() {
    // Get the frequency data
    data.analyser.getFloatFrequencyData(data.dataArray);
    
    // Scroll the image left
    const imageData = spectrogramCtx.getImageData(1, 0, spectrogramCanvas.width - 1, spectrogramCanvas.height);
    spectrogramCtx.putImageData(imageData, 0, 0);
    
    // Clear the rightmost pixels
    spectrogramCtx.fillStyle = 'rgb(0, 0, 0)';
    spectrogramCtx.fillRect(spectrogramCanvas.width - 1, 0, 1, spectrogramCanvas.height);

    const width = spectrogramCanvas.width;
    const height = spectrogramCanvas.height;

    if (data.visualType === "linear") {
        for (let i = 0; i < data.bufferLength; i++) {
            const value = data.dataArray[i];
            const percent = i / data.bufferLength;
            const y = Math.floor(percent * height);
            const color = data.amplitudeToColor(value);
            spectrogramCtx.fillStyle = color;
            spectrogramCtx.fillRect(spectrogramCanvas.width - 1, height - y - 1, 1, 1);
        }
    } else if (data.visualType === "logarithmic") {
        // Map frequency to y-coordinate on the canvas using logarithmic scale
        for (let i = 0; i < data.bufferLength; i++) {
            const value = data.dataArray[i];
            const frequency = i * data.audioContext.sampleRate / 2 / data.bufferLength;
            const nextFrequency = (i + 1) * data.audioContext.sampleRate / 2 / data.bufferLength;
            const yFormula = (frequency) => {
                return height - (Math.log(frequency) / Math.log(10) - Math.log(20) / Math.log(10)) / (Math.log(20000) / Math.log(10) - Math.log(20) / Math.log(10)) * height;
            }
            const y = yFormula(frequency);
            const nexty = yFormula(nextFrequency);
            const color = data.amplitudeToColor(value);
            spectrogramCtx.fillStyle = color;
            spectrogramCtx.fillRect(spectrogramCanvas.width - 1, Math.min(nexty, y), 1, Math.abs(y - nexty)+1);
        }
    }
}
// drawSpectrogram(); is already called in script2.js along with all the other draw functions, 
// so no need to call it again here.
// setInterval(drawSpectrogram, 1000 / 60);