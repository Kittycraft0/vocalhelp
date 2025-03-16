// 3/16/2025 @ 12:21 AM CST
var spectrogramcanvas=document.getElementById("spectrogramvisualization");
const spectrogramctx=spectrogramcanvas.getContext("2d");

spectrogramctx.fillStyle = 'rgb(255, 255, 0)';
spectrogramctx.fillRect(0,0,spectrogramcanvas.width,spectrogramcanvas.height);

spectrogramctx.fillStyle = 'rgb(0, 0, 0)';
spectrogramctx.rect(50,50,50,50);
spectrogramctx.stroke();
spectrogramctx.fillRect(0,0,spectrogramcanvas.width,spectrogramcanvas.height);

// Draw red lines on the spectrogram, code present for reference and use
/*setInterval(()=>{
    // Scroll the spectrogram left
    const imageData = spectrogramctx.getImageData(1, 0, spectrogramcanvas.width - 1, spectrogramcanvas.height);
    spectrogramctx.putImageData(imageData, 0, 0);
  
    // Draw red line on the right edge
    spectrogramctx.fillStyle = `rgb(255,0,0)`;
    spectrogramctx.fillRect(spectrogramcanvas.width - 1, 0, 1, spectrogramcanvas.height);
},1000);*/

function drawSpectrogram() {
// Get the frequency data
    data.analyser.getFloatFrequencyData(data.dataArray);
    
    // Scroll the image left
    const imageData = spectrogramctx.getImageData(1, 0, spectrogramcanvas.width - 1, spectrogramcanvas.height);
    spectrogramctx.putImageData(imageData, 0, 0);
    
    if(data.visualType=="linear"){
    // Draw the new frequencies on the right edge
    for (let i = 0; i < data.bufferLength; i++) {
        const value = data.dataArray[i];
        const percent = i / data.bufferLength;
        
        //finding the frequency from the index
        let frequency = Math.round(i * data.audioContext.sampleRate / 2 / data.bufferLength)
        //need to convert db Value because it is -120 to 0
        let barHeight = (value / 2 + 70) * 10
        //let y = data.frequencyToXAxis(frequency)

        const y = Math.floor(percent * spectrogramcanvas.height);
        const color = data.amplitudeToColor(value);
        spectrogramctx.fillStyle = color;
        spectrogramctx.fillRect(spectrogramcanvas.width - 1, spectrogramcanvas.height - y, 1, 1);
    }
    }else if(data.visualType=="logarithmic"){
        const canvas = spectrogramcanvas;
        const height = canvas.height
        const width = canvas.width
        const context = spectrogramctx;
        audioData=data.dataArray;
        
        //loop to create the bars so I get to 20k! (???)
        for (let i = 0; i < data.bufferLength; i++) {
        let value = audioData[i]
        
        //finding the frequency from the index
        let frequency = Math.round(i * data.audioContext.sampleRate / 2 / data.bufferLength)
        //need to convert db Value because it is -120 to 0
        let barHeight = (value / 2 + 70) * 10/5
        let barWidth = width / data.bufferLength * 2.5
        context.fillStyle = data.amplitudeToColor(value)//'rgb(' + (barHeight + 200) + ',100,100)'
        //finding the x location px from the frequency
        let x = data.frequencyToXAxis(frequency)/2.1
        let h = width - barHeight //??? had a /2, did i put that there?
        // bar breadth equals next x position minus current x position!?!?!? what ohh...???? no? what
        //let barbreadth=data.frequencyToXAxis(Math.round((i+1) * data.audioContext.sampleRate / 2 / data.bufferLength)/2.1-x);
        let barbreadth=data.frequencyToXAxis(Math.round((i+1) * data.audioContext.sampleRate / 2 / data.bufferLength))/2.1-x;
        if (h > 0) {
            //context.fillRect(0, height-x, h/8, barbreadth)
            let screaming=false;
            if(screaming){
                context.fillRect(h, x, 1, barHeight)
            }else{
                let b=data.frequencyToXAxis(Math.round(1 * data.audioContext.sampleRate / 2 / data.bufferLength))/2.1
                // math moment
                // it failed :(
    //let b=(Math.log(Math.round(0*data.audioContext.sampleRate/2/data.bufferLength))/Math.log(10)-Math.log(20)/Math.log(10))/(Math.log(20000)/Math.log(10)-Math.log(20)/Math.log(10))*945
    // cringe log of 0
    // what
    //let b=(Math.log(0)/Math.log(10)-Math.log(20)/Math.log(10))/(Math.log(20000)/Math.log(10)-Math.log(20)/Math.log(10))*945
                
                // yay it worked ok i fixed it nice

                context.fillRect(width-1, height-x+b, 1, -barbreadth)
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
      //}
    //console.log("aaah");
}