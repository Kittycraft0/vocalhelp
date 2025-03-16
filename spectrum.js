// 3/16/2025

var spectrumcanvas=document.getElementById("spectrumvisualization");
const spectrumctx=spectrumcanvas.getContext("2d");

function drawSpectrum() {
    // Get the frequency data
    data.analyserSmooth.getFloatFrequencyData(data.dataArraySmooth);
    //data.analyserSmooth.getFloatTimeDomainData(data.dataArraySmooth);
    
    // Clear the canvas before drawing
    spectrumctx.fillStyle = 'rgb(0, 0, 0)';
    spectrumctx.fillRect(0, 0, spectrumcanvas.width, spectrumcanvas.height);

    // what why does it need to be reset oh nevermind? or idk? what???
    data.bufferLength = data.dataArraySmooth.length;
    
    if(data.visualtype=="linear"){
    let barHeight = spectrumcanvas.height / data.bufferLength;  // Set bar width based on canvas width and number of bars
    let y = spectrumcanvas.height;

    // Iterate through the frequency data and draw the bars
    for (let i = 0; i < data.bufferLength; i++) {
        let value = data.dataArraySmooth[i];

        // Normalize amplitude to 0-1 (for easier color mapping)
        const normalizedValue = Math.max(0, Math.min(1, (value + 96) / 96));  // Normalize based on the typical -96 dBFS as the lowest value

        // Calculate bar height based on the frequency value (this can be adjusted for desired scaling)
        //let barHeight = (value + 96) * (spectrumcanvas.height / 96);  // Adjust the height based on value (higher frequency will be taller)
        let barWidth = (value + 96) * (spectrumcanvas.width / 96);

        // Calculate color based on the normalized amplitude
        const color = data.amplitudeToColor(value); // Use your existing color function

        // Set the color and draw the bar
        spectrumctx.fillStyle = color;
        spectrumctx.fillRect(0, y, barWidth, barHeight);

        // Increment x position for the next bar
        y -= barHeight;
    }

    }else if(data.visualType=="logarithmic"){
    const canvas = spectrumcanvas;
    const height = canvas.height
    const width = canvas.width
    const context = spectrumctx;
    //context.clearRect(0, 0, width, height)
    audioData=data.dataArray;
    audioDataSmooth=data.dataArraySmooth;
    
    //loop to create the bars so I get to 20k!
    for (let i = 0; i < data.bufferLengthSmooth; i++) {
        let value = audioData[i]
        let valueSmooth = audioDataSmooth[i]
        
        //finding the frequency from the index
        let frequency = Math.round(i * data.audioContext.sampleRate / 2 / data.bufferLength)
        //need to convert db Value because it is -120 to 0
        let barHeight = (value / 2 + 70) * 10/5
        let barHeightSmooth = (valueSmooth / 2 + 70) * 10/5
        let barWidth = width / data.bufferLength * 2.5
        context.fillStyle = data.amplitudeToColor(value)//'rgb(' + (barHeight + 200) + ',100,100)'
        //finding the x location px from the frequency
        let x = data.frequencyToXAxis(frequency)/2.1
        let h = width - barHeight //??? had a /2, did i put that there?
        let hSmooth = width - barHeightSmooth //??? had a /2, did i put that there?
        // bar breadth equals next x position minus current x position!?!?!? what ohh...???? no? what
        //let barbreadth=data.frequencyToXAxis(Math.round((i+1) * data.audioContext.sampleRate / 2 / data.bufferLength)/2.1-x);
        let barbreadth=data.frequencyToXAxis(Math.round((i+1) * data.audioContext.sampleRate / 2 / data.bufferLength))/2.1-x;
        if (h > 0) {
            //context.fillRect(0, height-x, h/8, barbreadth)
            let screaming=false;
            if(screaming){
                context.fillRect(h, x, 1, barHeight)
                //context.fillRect(hSmooth, x, 1, barHeightSmooth)
            }else{
                let b=data.frequencyToXAxis(Math.round(1 * data.audioContext.sampleRate / 2 / data.bufferLength))/2.1
                context.fillRect(0, height-x+b, barHeight, -barbreadth)
                //context.fillRect(0, height-x+b, barHeightSmooth, -barbreadth)
                
            }

            //context.fillStyle = data.amplitudeToColor(valueSmooth)//'rgb(' + (barHeight + 200) + ',100,100)'
            context.fillStyle = 'rgb(0,0,0)'
            if(screaming){
                context.fillRect(hSmooth+barHeightSmooth, x, 1, 1)
                //context.fillRect(h+barHeight, x, 1, 1)
            }else{
                let b=data.frequencyToXAxis(Math.round(1 * data.audioContext.sampleRate / 2 / data.bufferLength))/2.1
                context.fillRect(barHeightSmooth, height-x+b, 1, -barbreadth)
                //context.fillRect(barHeight, height-x+b, 1, -barbreadth)
            }
            
            //context.fillRect(0,0,10,10);
            //context.fillRect(h, x, barHeight, 1)
            //context.fillRect(width-1, height-x, 1, barbreadth)
            //context.fillRect(width-1, height-x, h, barbreadth)
        }
    }
    }else{
        console.log("data.visualtype is not a value value!!!");
    }
}