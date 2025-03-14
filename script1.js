//3/14/2025

// .
// Check for browser support
if (!navigator.mediaDevices.getUserMedia) {
    alert('getUserMedia is not supported in this browser.');
}
  
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
navigator.mediaDevices.getUserMedia({ audio: true })
.then(stream => {
    const source = audioContext.createMediaStreamSource(stream);
    // Further processing will be done here

    // .
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    
    // Set fftSize
    analyser.fftSize = 2048;

    // Calculate buffer length (half of fftSize)
    const bufferLength = analyser.frequencyBinCount; // analyser.frequencyBinCount is equal to fftSize / 2
    
    //// Initialize dataArray as a Uint8Array
    //const dataArray = new Uint8Array(bufferLength);
    //// In your draw or update function
    ////analyser.getByteFrequencyData(dataArray);

    // Initialize dataArray as a Float32Array
    const dataArray = new Float32Array(bufferLength);

    // In your draw or update function
    //analyser.getFloatFrequencyData(dataArray);

    
    // .
    function updatePitch() {
        analyser.getFloatTimeDomainData(dataArray);
        let pitch = autoCorrelate(dataArray, audioContext.sampleRate);
        if (pitch !== -1) {
            console.log('Detected pitch:', pitch, 'Hz');
        }
        requestAnimationFrame(updatePitch);
    }
    
    updatePitch();


    // .
    const canvas = document.getElementById('visualization');
    const canvasCtx = canvas.getContext('2d');
    
    function draw() {
        requestAnimationFrame(draw);
        analyser.getFloatFrequencyData(dataArray);
    
        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    
        let barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        //console.log(bufferLength);
    
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];
            canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
            if(barHeight!=-Infinity){
                console.log(barHeight);
            }
            canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
            x += barWidth + 1;
        }
    }
    
    draw();

        
})
.catch(err => {
    console.error('Error accessing microphone:', err);
});

// pitch detection or something idk
function autoCorrelate(buffer, sampleRate) {
    let SIZE = buffer.length;
    let MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;
  
    for (let i = 0; i < SIZE; i++) {
        let val = buffer[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) // Too quiet
        return -1;
  
    let lastCorrelation = 1;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
        let correlation = 0;
        
        for (let i = 0; i < MAX_SAMPLES; i++) {
            correlation += Math.abs((buffer[i]) - (buffer[i + offset]));
        }
        correlation = 1 - (correlation / MAX_SAMPLES);
        if (correlation > 0.9 && correlation > lastCorrelation) {
            bestCorrelation = correlation;
            bestOffset = offset;
        }
        lastCorrelation = correlation;
    }
    if (bestCorrelation > 0.01) {
        let frequency = sampleRate / bestOffset;
        return frequency;
    }
    return -1;
}


