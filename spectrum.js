// 3/16/2025

var spectrumcanvas = document.getElementById("spectrumvisualization");
const spectrumctx = spectrumcanvas.getContext("2d");

function drawSpectrum() {
    // Get the frequency data
    data.analyserSmooth.getFloatFrequencyData(data.dataArraySmooth);
    
    // Clear the canvas before drawing
    spectrumctx.fillStyle = 'rgb(0, 0, 0)';
    spectrumctx.fillRect(0, 0, spectrumcanvas.width, spectrumcanvas.height);

    data.bufferLength = data.dataArraySmooth.length;
    
    if (data.visualType === "linear") {
        let barHeight = spectrumcanvas.height / data.bufferLength;
        let y = spectrumcanvas.height;

        for (let i = 0; i < data.bufferLength; i++) {
            let value = data.dataArraySmooth[i];
            let barWidth = (value + 96) * (spectrumcanvas.width / 96);
            const color = data.amplitudeToColor(value);
            spectrumctx.fillStyle = color;
            spectrumctx.fillRect(0, y, barWidth, barHeight);
            y -= barHeight;
        }
    } else if (data.visualType === "logarithmic") {
        const height = spectrumcanvas.height;
        const width = spectrumcanvas.width;
        const context = spectrumctx;
        const audioData = data.dataArray;
        const audioDataSmooth = data.dataArraySmooth;

        for (let i = 0; i < data.bufferLengthSmooth; i++) {
            let value = audioData[i];
            let valueSmooth = audioDataSmooth[i];
            let frequency = Math.round(i * data.audioContext.sampleRate / 2 / data.bufferLength);
            let barHeight = (value / 2 + 70) * 2;
            let barHeightSmooth = (valueSmooth / 2 + 70) * 2;
            let barWidth = width / data.bufferLength * 2.5;
            context.fillStyle = data.amplitudeToColor(value);
            let x = data.frequencyToXAxis(frequency) / 2.1;
            let h = width - barHeight;
            let hSmooth = width - barHeightSmooth;
            let barbreadth = data.frequencyToXAxis(Math.round((i + 1) * data.audioContext.sampleRate / 2 / data.bufferLength)) / 2.1 - x;

            if (h > 0) {
                let b = data.frequencyToXAxis(Math.round(1 * data.audioContext.sampleRate / 2 / data.bufferLength)) / 2.1;
                context.fillRect(0, height - x + b, barHeight, -barbreadth);
                context.fillStyle = 'rgb(0,0,0)';
                context.fillRect(barHeightSmooth, height - x + b, 1, -barbreadth);
            }
        }
    } else {
        console.error("data.visualType is not a valid value!");
    }
}