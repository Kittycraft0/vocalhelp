// 3/14/2025

var spectrumcanvas=document.getElementById("spectrumvisualization");
const spectrumctx=spectrumcanvas.getContext("2d");
var spectrogramcanvas=document.getElementById("spectrogramcanvas");
const spectrogramctx=spectrogramcanvas.getContext("2d");
var specXaxiscanvas=document.getElementById("spectrogramxaxis");
const specXaxisctx=specXaxiscanvas.getContext("2d");
var amplitudecanvas=document.getElementById("soundlevelmeter");
const amplitudectx=amplitudecanvas.getContext("2d");
spectrogramctx.fillStyle = 'rgb(255, 255, 0)';
spectrogramctx.fillRect(0,0,spectrogramcanvas.width,spectrogramcanvas.height);

//specXaxiscanvas.width=spectrogramcanvas.width;
//specXaxisctx.scale(-1,1);
//specXaxisctx.translate(-specXaxisCanvas.width/2,0);
//specXaxisctx.translate(-specXaxiscanvas.width,0);
//specXaxisctx.fillStyle='rgb(0,0,0)';
//specXaxisctx.fillRect(-5,-5,specXaxiscanvas.width+10,specXaxiscanvas.height+10);
//specXaxisctx.fillStyle='rgb(255,0,0)';
//specXaxisctx.fillRect(-specXaxiscanvas.width/2,-specXaxiscanvas.height/2,specXaxiscanvas.width,specXaxiscanvas.height);

if(false){
let n=1;
setInterval(()=>{
    specXaxisctx.fillStyle=`rgb(0,${n*10},255)`;
    specXaxisctx.fillRect(n,n,n,n);
    n+=1;
},1000/20);
}
//specXaxisctx.


indicatorcanvas();
function indicatorcanvas(){
// making the indicators
const startX = spectrogramcanvas.width; // Starting x-coordinate
const interval = 60; // Distance between numbers and indicators
const numberOfIndicators = Math.floor(specXaxiscanvas.width / interval);

specXaxisctx.font = '16px Arial'; // Set font style
specXaxisctx.textAlign = 'center'; // Center text horizontally
//specXaxisctx.textBaseline = 'middle'; // Center text vertically
specXaxisctx.textBaseline = 'top'; // Center text vertically


// do like the funny ruler thing idk
specXaxisctx.beginPath();
specXaxisctx.moveTo(0, 0); // Start point of the line
specXaxisctx.lineTo(spectrogramcanvas.width,0); // End point of the line
specXaxisctx.stroke();

for(let i=0;i<numberOfIndicators*50;i+=2){
    const x = startX - i/10 * interval;
    const y = 10;//specXaxiscanvas.height / 2; // Vertical position of the text

    // Draw the indicator (a vertical line)
    specXaxisctx.beginPath();
    specXaxisctx.moveTo(x, y - 10); // Start point of the line
    specXaxisctx.lineTo(x, y + 10*(i%10==0)); // End point of the line
    specXaxisctx.stroke();
}
for (let i = 0; i <= numberOfIndicators; i++) {
    const x = startX - i * interval;
    const y = 10;//specXaxiscanvas.height / 2; // Vertical position of the text

    // Draw the number
    specXaxisctx.fillText(i, x, y+15);

    // Draw the indicator (a vertical line)
    specXaxisctx.beginPath();
    specXaxisctx.moveTo(x, y - 10); // Start point of the line
    specXaxisctx.lineTo(x, y + 10); // End point of the line
    specXaxisctx.stroke();
}

// Draw the axis title
specXaxisctx.fillText("Time (s)", spectrogramcanvas.width/2, 50);

}




// Access the Microphone: Request permission to access the user's microphone and obtain a media stream.
navigator.mediaDevices.getUserMedia({ audio: true })
.then(function(stream) {
    // Use the stream
    console.log('Microphone access granted.');

    // Create an Audio Context: Initialize an AudioContext, which serves as the main interface to the Web Audio API.
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 48000});

    // Create a Media Stream Source: Convert the media stream into a source node that the audio context can process.
    const source = audioContext.createMediaStreamSource(stream);
    const sourcesmooth = audioContext.createMediaStreamSource(stream);

    // Create an Analyser Node: Set up an AnalyserNode to extract frequency and amplitude data.
    const analyser = audioContext.createAnalyser();
    const analysersmooth = audioContext.createAnalyser();
    analyser.minDecibels = -96; // Minimum decibel value (default -100)
    analyser.maxDecibels = 0;     // Maximum decibel value (default -30)
    analyser.fftSize = 4096; // Determines the frequency resolution
    analyser.smoothingTimeConstant=0; // (default 0.8)
    source.connect(analyser);

    analysersmooth.minDecibels = -96; // Minimum decibel value (default -100)
    analysersmooth.maxDecibels = 0;     // Maximum decibel value (default -30)
    analysersmooth.fftSize = 4096; // Determines the frequency resolution
    console.log("constant: "+analysersmooth.smoothingTimeConstant);
    sourcesmooth.connect(analysersmooth);
    
    // Extract Frequency Data: Retrieve the frequency data using a Uint8Array.
    const bufferLength = analyser.frequencyBinCount;
    //this.setState({bufferLength}) //????????
    //const dataArray = new Uint8Array(bufferLength);
    const dataArray = new Float32Array(bufferLength);
    const bufferLengthsmooth = analysersmooth.frequencyBinCount;
    //const dataArraysmooth = new Uint8Array(bufferLengthsmooth);
    const dataArraysmooth = new Float32Array(bufferLengthsmooth);

    function getFrequencyData() {
        //analyser.getByteFrequencyData(dataArray);
        analyser.getFloatFrequencyData(dataArray);
        // dataArray now contains frequency data
    }
    // Extract Amplitude (Time-Domain) Data: Obtain the time-domain data to analyze the waveform.
    //const timeDomainDataArray = new Uint8Array(bufferLength);
    const timeDomainDataArray = new Float32Array(bufferLength);

    function getTimeDomainData() {
        //analyser.getByteTimeDomainData(timeDomainDataArray);
        analyser.getFloatTimeDomainData(timeDomainDataArray);
        // timeDomainDataArray now contains amplitude data
    }


    // Spectrogram
    //let drawOffset = 0; //????????
    /*function amplitudeToColor(amplitude) {
        const value = amplitude / 255; // Normalize amplitude to [0, 1]
        //const hue = (1 - value) * 240; // Map amplitude to hue (blue to red)
        const hue = (1 - value*1.5) * 240; // Map amplitude to hue (blue to red)
        return `hsl(${hue}, 100%, 50%)`;
    }*/
    // https://abarrafato.medium.com/building-a-real-time-spectrum-analyzer-plot-using-html5-canvas-web-audio-api-react-46a495a06cbf
    function frequencyToXAxis(frequency) {
        const minF = Math.log(20) / Math.log(10)
        const maxF = Math.log(20000) / Math.log(10)
        
        let range = maxF - minF
        let xAxis = (Math.log(frequency) / Math.log(10) - minF) / range  
         * 945
        return xAxis
    }
    function amplitudeToColor(amplitude) {
        // Normalize amplitude to a 0-1 range, handling -Infinity
        const normalizedAmplitude = amplitude === -Infinity ? 0 : Math.min(1, Math.max(0, (amplitude + 96) / 96));

        // Map normalized amplitude to hue (blue to red)
        const hue = (1 - normalizedAmplitude*1.5) * 240;

        // Return the corresponding HSL color
        return `hsl(${hue}, 100%, 50%)`;
    }
        
    spectrogramctx.fillStyle = 'rgb(0, 0, 0)';
    spectrogramctx.rect(50,50,50,50);
    spectrogramctx.stroke();
    spectrogramctx.fillRect(0,0,spectrogramcanvas.width,spectrogramcanvas.height);
    function drawSpectrogram() {
        //requestAnimationFrame(drawSpectrogram);
      
        //analyser.getByteFrequencyData(dataArray);
        analyser.getFloatFrequencyData(dataArray);
        //console.log(dataArray);
      
        // Scroll the image left
        const imageData = spectrogramctx.getImageData(1, 0, spectrogramcanvas.width - 1, spectrogramcanvas.height);
        spectrogramctx.putImageData(imageData, 0, 0);
      
        // Draw the new frequencies on the right edge
        for (let i = 0; i < bufferLength; i++) {
            const value = dataArray[i];
            const percent = i / bufferLength;
            const y = Math.floor(percent * spectrogramcanvas.height);
            const color = amplitudeToColor(value);
            spectrogramctx.fillStyle = color;
            spectrogramctx.fillRect(spectrogramcanvas.width - 1, spectrogramcanvas.height - y, 1, 1);
            //console.log("b");
        }
        //console.log("aaah");
    }
    
    // Draw red lines on the spectrogram for testing or idk
    setInterval(()=>{
        // Scroll the spectrogram left
        const imageData = spectrogramctx.getImageData(1, 0, spectrogramcanvas.width - 1, spectrogramcanvas.height);
        spectrogramctx.putImageData(imageData, 0, 0);
      
        // Draw red line on the right edge
        spectrogramctx.fillStyle = `rgb(255,0,0)`;
        spectrogramctx.fillRect(spectrogramcanvas.width - 1, 0, 1, spectrogramcanvas.height);
    },1000);
    

    /*    function h(){
        return(<div>hello</div>); //what
    }*/
    // https://abarrafato.medium.com/building-a-real-time-spectrum-analyzer-plot-using-html5-canvas-web-audio-api-react-46a495a06cbf


    // Visualize the Data: Use the extracted data to create visualizations, such as frequency bars or waveforms.
    /*function drawSpectrum() {
        //requestAnimationFrame(draw);
        
        //getFrequencyData();
        //analysersmooth.getByteFrequencyData(dataArraysmooth);
        analysersmooth.getFloatFrequencyData(dataArraysmooth);
        
        
        // Spectrum visualization code here
        spectrumctx.fillStyle = 'rgb(0, 0, 0)';
        spectrumctx.fillRect(0,0,spectrumcanvas.width,spectrumcanvas.height);
        //spectrumctx.clearRect(0,0,spectrumcanvas.width,spectrumcanvas.height);
        let barHeight = (spectrumcanvas.height / bufferLengthsmooth) * 2.5;
        let barWidth;
        let y = spectrumcanvas.height;
        for (let i = 0; i < bufferLengthsmooth; i++) {
            value = dataArraysmooth[i];
            barWidth = value/255*spectrumcanvas.width;
            spectrumctx.fillStyle = 'rgb(' + (value + 100) + ',50,50)';
            // right justified right to left
            //spectrumctx.fillRect(spectrumcanvas.width - barWidth / 2, y, barWidth / 2, barHeight);
            // left justified bottom up
            spectrumctx.fillRect(0, y, barWidth, barHeight);
            y -= spectrumcanvas.height/bufferLength;
        }

        // Spectrogram visualization code here
    }*/
    function drawSpectrum() {
        // Get the frequency data
        analysersmooth.getFloatFrequencyData(dataArraysmooth);
        
        // Clear the canvas before drawing
        spectrumctx.fillStyle = 'rgb(0, 0, 0)';
        spectrumctx.fillRect(0, 0, spectrumcanvas.width, spectrumcanvas.height);
    
        const bufferLength = dataArraysmooth.length;
        let barHeight = spectrumcanvas.height / bufferLength;  // Set bar width based on canvas width and number of bars
        let y = spectrumcanvas.height;
    
        // Iterate through the frequency data and draw the bars
        for (let i = 0; i < bufferLength; i++) {
            let value = dataArraysmooth[i];
    
            // Normalize amplitude to 0-1 (for easier color mapping)
            const normalizedValue = Math.max(0, Math.min(1, (value + 96) / 96));  // Normalize based on the typical -96 dBFS as the lowest value
    
            // Calculate bar height based on the frequency value (this can be adjusted for desired scaling)
            //let barHeight = (value + 96) * (spectrumcanvas.height / 96);  // Adjust the height based on value (higher frequency will be taller)
            let barWidth = (value + 96) * (spectrumcanvas.width / 96);
    
            // Calculate color based on the normalized amplitude
            const color = amplitudeToColor(value); // Use your existing color function
    
            // Set the color and draw the bar
            spectrumctx.fillStyle = color;
            spectrumctx.fillRect(0, y, barWidth, barHeight);
    
            // Increment x position for the next bar
            y -= barHeight;
        }
    }

    // Function to calculate volume (rms)
    function calculateVolume(timeDomainDataArray) {
        let sum = 0;
        for (let i = 0; i < timeDomainDataArray.length; i++) {
            sum += timeDomainDataArray[i] * timeDomainDataArray[i]; // Square each sample
        }
        //console.log(timeDomainDataArray);
        let rms = Math.sqrt(sum / timeDomainDataArray.length); // Root mean square (RMS)
        let volume = Math.max(0, Math.min(1, rms / 128)); // Normalize RMS to a 0-1 range
        return volume;
    }


    // Function to visualize the volume on the canvas
    function visualizeVolume(volume) {
        // .
        //amplitudectx.clearRect(0, 0, amplitudecanvas.width, amplitudecanvas.height); // Clear the previous frame
        //const barHeight = volume * amplitudecanvas.height; // Map volume to canvas height
        ////console.log(volume);
        //amplitudectx.fillStyle = 'rgb(0, 255, 0)'; // Color of the meter
        //amplitudectx.fillRect(0, amplitudecanvas.height - barHeight, amplitudecanvas.width, barHeight);
        // .
        /*amplitudectx.clearRect(0, 0, amplitudecanvas.width, amplitudecanvas.height);

        dataArray.forEach((value, index) => {
            const percent = value / 255;
            const height = amplitudecanvas.height * percent;
            const offset = amplitudecanvas.height - height;
            const barWidth = amplitudecanvas.width / bufferLength;
            amplitudectx.fillStyle = `rgb(${(1 - percent) * 255}, ${percent * 255}, 0)`;
            amplitudectx.fillRect(index * barWidth, offset, barWidth, height);
        }); //... chatgpt why that's the wrong thing...*/
        // .

        //analyser.getByteFrequencyData(dataArray);
        analyser.getFloatFrequencyData(dataArray);
    
        amplitudectx.clearRect(0, 0, amplitudecanvas.width, amplitudecanvas.height);
    
        let sum = 0;
        dataArray.forEach(value => {
            sum += value;
        });
        const average = sum / dataArray.length;
        const dB = -Math.log10(average / 255) * 20;
    
        amplitudectx.fillStyle = 'green';
        amplitudectx.fillRect(0, 0, amplitudecanvas.width, amplitudecanvas.height);
    
        amplitudectx.fillStyle = 'red';
        amplitudectx.fillRect(0, 0, amplitudecanvas.width, (dB / 100) * amplitudecanvas.height);
    
        //requestAnimationFrame(draw);


    }
    

    // Main loop to update the volume visualization
    function updateVolumeMeter() {
        //analyser.getByteTimeDomainData(timeDomainDataArray);
        analyser.getFloatTimeDomainData(timeDomainDataArray);
        
        visualizeVolume(calculateVolume(timeDomainDataArray));
        //requestAnimationFrame(updateVolumeMeter); // Repeat the process
    }

    // Start the volume meter visualization
    //updateVolumeMeter();

      
    setInterval(()=>{
        drawSpectrum();
        drawSpectrogram();
        updateVolumeMeter();
    },1000/60);
    /*requestAnimationFrame(draw);
    console.log("aaa");

    console.log(stream);
    console.log(audioContext);
    console.log(source);
    console.log(analyser);
    console.log(bufferLength);
    console.log(dataArray);
    console.log(timeDomainDataArray);
    
    setTimeout(()=>{
        console.log("stream:");
        console.log(stream);
        console.log("audioContext:");
        console.log(audioContext);
        console.log("source:");
        console.log(source);
        console.log("analyser:");
        console.log(analyser);
        console.log("bufferLength:");
        console.log(bufferLength);
        console.log("dataArray:");
        console.log(dataArray);
        console.log("timeDomainDataArray:");
        console.log(timeDomainDataArray);
    },1000);*/
      

    
    function componentWillUnmount() {
        cancelAnimationFrame(this.rafId)
        this.analyser.disconnect()
        this.source.disconnect()
    }
})
.catch(function(err) {
    console.error('The following error occurred: ' + err);
});
