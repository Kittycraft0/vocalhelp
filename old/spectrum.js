// 3/16/2025

var spectrumCanvas = document.getElementById("spectrumvisualization");
const spectrumCtx = spectrumCanvas.getContext("2d");

function drawSpectrum() {
    // Get the frequency data
    data.analyserSmooth.getFloatFrequencyData(data.dataArraySmooth);
    
    // Clear the canvas before drawing
    spectrumCtx.fillStyle = 'rgb(0, 0, 0)';
    spectrumCtx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

    data.bufferLength = data.dataArraySmooth.length;
    
    /*if (data.visualType === "linear") {
        for (let i = 0; i < data.bufferLength; i++) {
            spectrumCtx.fillRect(0, height - y - 1, barWidth, barHeight);
        }
    }*/

    if (data.visualType === "linear") {
        let barHeight = spectrumCanvas.height / data.bufferLength;
        //let y = spectrumCanvas.height;

        for (let i = 0; i < data.bufferLength; i++) {
            let value = data.dataArraySmooth[i];
            let barWidth = (value + 96) * (spectrumCanvas.width / 96);
            const color = data.amplitudeToColor(value);
            
            const percent = i / data.bufferLength;
            const y = Math.floor(percent * spectrumCanvas.height);
            
            spectrumCtx.fillStyle = color;
            spectrumCtx.fillRect(0, spectrumCanvas.height - y - 1, barWidth, barHeight);
            //y -= barHeight;
        }
    } 
    /*else if (data.visualType === "logarithmic") {
        // Map frequency to y-coordinate on the canvas using logarithmic scale
        for (let i = 0; i < data.bufferLength; i++) {
            const color = data.amplitudeToColor(value);
            spectrogramCtx.fillStyle = color;
            spectrogramCtx.fillRect(spectrogramCanvas.width - 1, Math.min(nexty, y), 1, Math.abs(y - nexty)+1);
        }
    }*/
    else if (data.visualType === "logarithmic") {
        const height = spectrumCanvas.height;
        const width = spectrumCanvas.width;
        const context = spectrumCtx;
        const audioData = data.dataArray;
        const audioDataSmooth = data.dataArraySmooth;
        // Map frequency to y-coordinate on the canvas using logarithmic scale
        for (let i = 0; i < data.bufferLength; i++) {
            const value = audioData[i];
            // y1 and y2 before logarithmic transformation
            const frequency = i * data.audioContext.sampleRate / 2 / data.bufferLength;
            const nextFrequency = (i + 1) * data.audioContext.sampleRate / 2 / data.bufferLength;
            // y1 and y2
            const y = height-height*data.frequencyToLogScale(frequency);
            const nexty = height-height*data.frequencyToLogScale(nextFrequency);
            // x2 (x1 is 0)
            const barHeight = (value / 2 + 70) * 2;
            // y2-y1 magnitude
            const barWidth = Math.abs(y-nexty);

            context.fillStyle = data.amplitudeToColor(value);
            context.fillRect(0, Math.min(nexty, y), barHeight, barWidth+1);
        }
        for (let i = 0; i < data.bufferLengthSmooth; i++) {
            const valueSmooth = audioDataSmooth[i];
            // y1 and y2 before logarithmic transformation
            const frequency = i * data.audioContext.sampleRate / 2 / data.bufferLengthSmooth;
            const nextFrequency = (i + 1) * data.audioContext.sampleRate / 2 / data.bufferLengthSmooth;
            // y1 and y2
            const y = height-height*data.frequencyToLogScale(frequency);
            const nexty = height-height*data.frequencyToLogScale(nextFrequency);
            // x1 (x2 is 1)
            const barHeightSmooth = (valueSmooth / 2 + 70) * 2;
            // y2-y1 magnitude
            const barWidth = Math.abs(y-nexty);
            
            context.fillStyle = 'rgb(255,0,0)';
            context.fillRect(barHeightSmooth, y, 1, barWidth+1);
        }
    } else {
        console.error("data.visualType is not a valid value!");
    }
}