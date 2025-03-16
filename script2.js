// 3/14/2025

// everything gets put into data!!!!!!!!!!!
data={};
data.amplitudeToColor=(amplitude)=>{
    // Normalize amplitude to a 0-1 range, handling -Infinity
    const normalizedAmplitude = amplitude === -Infinity ? 0 : Math.min(1, Math.max(0, (amplitude + 96) / 96));

    // Map normalized amplitude to hue (blue to red)
    const hue = (1 - normalizedAmplitude*1.5) * 240;

    // Return the corresponding HSL color
    return `hsl(${hue}, 100%, 50%)`;
}
// Spectrogram
//let drawOffset = 0; //????????
/*function data.amplitudeToColor(amplitude) {
    const value = amplitude / 255; // Normalize amplitude to [0, 1]
    //const hue = (1 - value) * 240; // Map amplitude to hue (blue to red)
    const hue = (1 - value*1.5) * 240; // Map amplitude to hue (blue to red)
    return `hsl(${hue}, 100%, 50%)`;
}*/
// https://abarrafato.medium.com/building-a-real-time-spectrum-analyzer-plot-using-html5-canvas-web-audio-api-react-46a495a06cbf
data.frequencyToXAxis=(frequency)=>{
    const minF = Math.log(20) / Math.log(10)
    const maxF = Math.log(20000) / Math.log(10)
    
    let range = maxF - minF
    let xAxis = (Math.log(frequency) / Math.log(10) - minF) / range  
     * 945
    return xAxis
}
// Function to calculate volume (rms)
data.calculateVolume=(timeDomainDataArray)=>{
    /*let sum = 0;
    for (let i = 0; i < timeDomainDataArray.length; i++) {
        sum += timeDomainDataArray[i] * timeDomainDataArray[i]; // Square each sample
    }
    //console.log(timeDomainDataArray);
    let rms = Math.sqrt(sum / timeDomainDataArray.length); // Root mean square (RMS)
    let volume = Math.max(0, Math.min(1, rms / 128)); // Normalize RMS to a 0-1 range
    return volume;*/

    let sumSquares = 0;
    for (let i = 0; i < timeDomainDataArray.length; i++) {
        sumSquares += timeDomainDataArray[i] * timeDomainDataArray[i];
    }
    const rms = Math.sqrt(sumSquares / timeDomainDataArray.length);
    const rmsDb = 20 * Math.log10(rms);
    return rmsDb

}

spectrogramctx.fillStyle = 'rgb(255, 255, 0)';
spectrogramctx.fillRect(0,0,spectrogramcanvas.width,spectrogramcanvas.height);
var formantcanvas=document.getElementById("formantmeter");
const formantctx=formantcanvas.getContext("2d");
var vocalweightcanvas=document.getElementById("vocalweightmeter");
const vocalweightectx=vocalweightcanvas.getContext("2d");
var fullnesscanvas=document.getElementById("fullnessmeter");
const fullnessectx=fullnesscanvas.getContext("2d");







// Access the Microphone: Request permission to access the user's microphone and obtain a media stream.
navigator.mediaDevices.getUserMedia({ audio: true })
.then(function(stream) {
    // Use the stream
    console.log('Microphone access granted.');

    // Create an Audio Context: Initialize an AudioContext, which serves as the main interface to the Web Audio API.
    data.audioContext = new (window.AudioContext || window.webkitAudioContext)();//{sampleRate: data.audioContext.sampleRate});

    // Create a Media Stream Source: Convert the media stream into a source node that the audio context can process.
    const source = data.audioContext.createMediaStreamSource(stream);
    const sourcesmooth = data.audioContext.createMediaStreamSource(stream);

    // Create an Analyser Node: Set up an AnalyserNode to extract frequency and amplitude data.
    data.analyser = data.audioContext.createAnalyser();
    data.analyser = data.audioContext.createAnalyser();
    data.analysersmooth = data.audioContext.createAnalyser();
    // MAX AND MIN DECIBELS DO NOT AFFECT THE Y-AXIS. THEY AFFECT THE INTENSITY. 
    // THE FREQUENCIES ARE NOT CHANGED BY SENSITIVITY TO LOUDNESS. DUHHHhhh...
    data.analyser.minDecibels = -96; // Minimum decibel value (default -100)
    data.analyser.maxDecibels = 0;     // Maximum decibel value (default -30)
    data.analyser.fftSize = 4096; // Determines the frequency resolution
    data.analyser.smoothingTimeConstant=0; // (default 0.8)
    source.connect(data.analyser);

    data.analysersmooth.minDecibels = -96; // Minimum decibel value (default -100)
    data.analysersmooth.maxDecibels = 0;     // Maximum decibel value (default -30)
    data.analysersmooth.fftSize = 4096; // Determines the frequency resolution (default 4096?)
    data.analysersmooth.smoothingTimeConstant=0.8; // (default 0.8)
    console.log("constant: "+data.analysersmooth.smoothingTimeConstant);
    sourcesmooth.connect(data.analysersmooth);
    
    // Extract Frequency Data: Retrieve the frequency data using a Uint8Array.
    data.bufferLength = data.analyser.frequencyBinCount;
    //this.setState({data.bufferLength}) //????????
    //const data.dataArray = new Uint8Array(data.bufferLength);
    data.dataArray = new Float32Array(data.bufferLength);
    data.bufferLengthsmooth = data.analysersmooth.frequencyBinCount;
    //const data.dataArraysmooth = new Uint8Array(data.bufferLengthsmooth);
    data.dataArraysmooth = new Float32Array(data.bufferLengthsmooth);

    function getFrequencyData() {
        //data.analyser.getByteFrequencyData(data.dataArray);
        data.analyser.getFloatFrequencyData(data.dataArray);
        // data.dataArray now contains frequency data
        return data.dataArray;
    }
    // Extract Amplitude (Time-Domain) Data: Obtain the time-domain data to analyze the waveform.
    //const data.timeDomainDataArray = new Uint8Array(data.bufferLength);
    data.timeDomainDataArray = new Float32Array(data.bufferLength);

    function getTimeDomainData() {
        //data.analyser.getByteTimeDomainData(data.timeDomainDataArray);
        data.analyser.getFloatTimeDomainData(data.timeDomainDataArray);
        // data.timeDomainDataArray now contains amplitude data
        return data.timeDomainDataArray;
    }


    
    
    // logarithmic, linear, ...
    data.visualtype="logarithmic";
    spectrogram();
    

    /*    function h(){
        return(<div>hello</div>); //what
    }*/
    // https://abarrafato.medium.com/building-a-real-time-spectrum-analyzer-plot-using-html5-canvas-web-audio-api-react-46a495a06cbf


    // Visualize the Data: Use the extracted data to create visualizations, such as frequency bars or waveforms.
    /*function drawSpectrum() {
        //requestAnimationFrame(draw);
        
        //getFrequencyData();
        //data.analysersmooth.getByteFrequencyData(data.dataArraysmooth);
        data.analysersmooth.getFloatFrequencyData(data.dataArraysmooth);
        
        
        // Spectrum visualization code here
        spectrumctx.fillStyle = 'rgb(0, 0, 0)';
        spectrumctx.fillRect(0,0,spectrumcanvas.width,spectrumcanvas.height);
        //spectrumctx.clearRect(0,0,spectrumcanvas.width,spectrumcanvas.height);
        let barHeight = (spectrumcanvas.height / data.bufferLengthsmooth) * 2.5;
        let barWidth;
        let y = spectrumcanvas.height;
        for (let i = 0; i < data.bufferLengthsmooth; i++) {
            value = data.dataArraysmooth[i];
            barWidth = value/255*spectrumcanvas.width;
            spectrumctx.fillStyle = 'rgb(' + (value + 100) + ',50,50)';
            // right justified right to left
            //spectrumctx.fillRect(spectrumcanvas.width - barWidth / 2, y, barWidth / 2, barHeight);
            // left justified bottom up
            spectrumctx.fillRect(0, y, barWidth, barHeight);
            y -= spectrumcanvas.height/data.bufferLength;
        }

        // Spectrogram visualization code here
    }*/
    

    


    /*// Function to visualize the volume on the canvas
    function visualizeVolume() {
        // .
        //amplitudectx.clearRect(0, 0, amplitudecanvas.width, amplitudecanvas.height); // Clear the previous frame
        //const barHeight = volume * amplitudecanvas.height; // Map volume to canvas height
        ////console.log(volume);
        //amplitudectx.fillStyle = 'rgb(0, 255, 0)'; // Color of the meter
        //amplitudectx.fillRect(0, amplitudecanvas.height - barHeight, amplitudecanvas.width, barHeight);
        // .
        /*amplitudectx.clearRect(0, 0, amplitudecanvas.width, amplitudecanvas.height);

        data.dataArray.forEach((value, index) => {
            const percent = value / 255;
            const height = amplitudecanvas.height * percent;
            const offset = amplitudecanvas.height - height;
            const barWidth = amplitudecanvas.width / data.bufferLength;
            amplitudectx.fillStyle = `rgb(${(1 - percent) * 255}, ${percent * 255}, 0)`;
            amplitudectx.fillRect(index * barWidth, offset, barWidth, height);
        }); //... chatgpt why that's the wrong thing...*
        // .

        //data.analyser.getByteFrequencyData(data.dataArray);
        data.analyser.getFloatFrequencyData(data.dataArray);
    
        amplitudectx.clearRect(0, 0, amplitudecanvas.width, amplitudecanvas.height);
    
        let sum = 0;
        data.dataArray.forEach(value => {
            sum += value*value;
        });
        const rms = Math.sqrt(sum / data.dataArray.length);
        const dB = Math.log10(rms) * 20;
    
        amplitudectx.fillStyle = 'lime';
        amplitudectx.fillRect(0, 0, amplitudecanvas.width, amplitudecanvas.height);
        //console.log(dB);
        amplitudectx.fillStyle = 'red';
        amplitudectx.fillRect(0, 0, amplitudecanvas.width, dB / 60 * amplitudecanvas.height);
        amplitudectx;
        //requestAnimationFrame(draw);


    }*/
        /*function visualizeVolume() {
            // Retrieve time-domain data
            data.analyser.getFloatTimeDomainData(data.dataArray);
        
            // Calculate RMS (Root Mean Square)
            let sumSquares = 0;
            for (let i = 0; i < data.dataArray.length; i++) {
                sumSquares += data.dataArray[i] * data.dataArray[i];
            }
            const rms = Math.sqrt(sumSquares / data.dataArray.length);
        
            // Convert RMS to decibels (dB)
            const dB = 20 * Math.log10(rms);
        
            // Clear the canvas
            amplitudectx.clearRect(0, 0, amplitudecanvas.width, amplitudecanvas.height);
        
            // Map dB to canvas height
            const barHeight = ((dB + 100) / 100) * amplitudecanvas.height; // Adjusting dB range for visualization
        
            // Draw the volume bar
            amplitudectx.fillStyle = 'lime';
            amplitudectx.fillRect(0, amplitudecanvas.height - barHeight, amplitudecanvas.width, barHeight);
        
            // Optionally, request the next animation frame for continuous visualization
            // requestAnimationFrame(visualizeVolume);
        }*/
    



    // 3/15/2025 11:22PM CST
    // chatgpt gave me this thing to calculate uhhh formants
    function getFormants(frequencyData, sampleRate) {
        let peaks = [];
        //let threshold = -50; // dB threshold to detect peaks
        let threshold = -100; // dB threshold to detect peaks
        
        for (let i = 1; i < frequencyData.length - 1; i++) {
            if (
                frequencyData[i] > frequencyData[i - 1] &&
                frequencyData[i] > frequencyData[i + 1] &&
                frequencyData[i] > threshold
            ) {
                let frequency = (i * sampleRate) / (2 * frequencyData.length);
                peaks.push(frequency);
            }
        }
        
        return peaks;
    }
    
    function calculateFormantDispersion(formants) {
        if (formants.length < 2) return 0;
        
        let sumDispersion = 0;
        for (let i = 1; i < formants.length; i++) {
            sumDispersion += formants[i] - formants[i - 1];
        }
        
        return sumDispersion / (formants.length - 1);
    }
    
    function displayFormantDispersion(dispersion) {
        //let formantCanvas;// = document.getElementById('formantCanvas');
        //let formantctx;// = canvas.getContext('2d');
        
        formantctx.clearRect(0, 0, formantcanvas.width, formantcanvas.height);
        formantctx.fillStyle = 'black';
        formantctx.fillRect(0, 0, formantcanvas.width, formantcanvas.height);
        formantctx.fillStyle = 'white';
        formantctx.font = '16px Arial';
        formantctx.fillText(`Formant Dispersion: ${dispersion.toFixed(2)} Hz`, 10, 20);
    }
    
    function processAudioFrame(analyser, sampleRate) {
        let frequencyData = new Float32Array(data.analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(frequencyData);
        
        let formants = getFormants(frequencyData, sampleRate);
        let dispersion = calculateFormantDispersion(formants);
        displayFormantDispersion(dispersion);
    }
    
    // Call processAudioFrame within an animation loop or setInterval
    

    // Start the volume meter visualization
    //updateVolumeMeter();

    // 3/15/2025
    // chatgpt moment
    /*class ThicknessMeter {
        constructor(sampleRate) {
            this.sampleRate = sampleRate;
        }
    
        calculateFormantDispersion(peaks) {
            if (peaks.length < 2) return 0;
            let sum = 0;
            for (let i = 1; i < peaks.length; i++) {
                sum += peaks[i] - peaks[i - 1];
            }
            return sum / (peaks.length - 1);
        }
    
        calculateHNR(signal, noise) {
            if (noise === 0) return 100; // Prevent division by zero
            return 10 * Math.log10(signal / noise);
        }
    
        calculateSpectralTilt(spectrum) {
            let lowEnergy = 0, highEnergy = 0, midpoint = spectrum.length / 2;
            for (let i = 0; i < spectrum.length; i++) {
                if (i < midpoint) lowEnergy += spectrum[i];
                else highEnergy += spectrum[i];
            }
            return 10 * Math.log10(lowEnergy / (highEnergy || 1)); // Avoid division by zero
        }
    
        calculateEnergyDistribution(spectrum) {
            let totalEnergy = spectrum.reduce((sum, v) => sum + v, 0);
            let lowEnergy = spectrum.slice(0, spectrum.length / 2).reduce((sum, v) => sum + v, 0);
            return lowEnergy / totalEnergy;
        }
    
        analyze(audioData, spectrum, peaks, signalPower, noisePower) {
            let dispersion = this.calculateFormantDispersion(peaks);
            let hnr = this.calculateHNR(signalPower, noisePower);
            let tilt = this.calculateSpectralTilt(spectrum);
            let energyDist = this.calculateEnergyDistribution(spectrum);
    
            let thicknessScore = (1 / (1 + dispersion)) * (hnr / 100) * (1 / (1 + Math.abs(tilt))) * energyDist;
            return thicknessScore;
        }
    
        drawMeter(canvas, thicknessScore) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            let barHeight = thicknessScore * canvas.height;
            ctx.fillStyle = "hsl(" + (120 - thicknessScore * 120) + ", 100%, 50%)"; // Green to red
            ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
            
            ctx.fillStyle = "#fff";
            ctx.font = "20px Arial";
            ctx.fillText("Thickness: " + thicknessScore.toFixed(2), 10, 30);
        }
    }

    function calculateSignalPower(audioData) {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
        }
        return sum / audioData.length;
    }
    
    function estimateNoisePower(spectrum) {
        let noiseSum = 0, count = 0;
        for (let i = 0; i < spectrum.length; i++) {
            if (spectrum[i] < -60) { // Assume noise is below -60 dB
                noiseSum += spectrum[i];
                count++;
            }
        }
        return count > 0 ? noiseSum / count : -60; // Default noise floor
    }
    

    
    function detectFormantPeaks(spectrum, frequencyBinCount, sampleRate) {
        let peaks = [];
        let binSize = sampleRate / (2 * frequencyBinCount); // Frequency per bin
    
        for (let i = 1; i < spectrum.length - 1; i++) {
            if (spectrum[i] > spectrum[i - 1] && spectrum[i] > spectrum[i + 1]) {
                peaks.push(i * binSize); // Convert index to Hz
            }
        }
        return peaks.slice(0, 4); // Take the first few peaks
    }
    
    
    
    
    var thicknessmeter=new ThicknessMeter(data.audioContext.sampleRate);    

    // thanks https://27or27.github.io/tm/thickness_meter.htm for inspiration
    function data.data.updateThicknessMeter(){
        //let audioData = new Float32Array(data.analyser.fftSize);
        //data.analyser.getFloatTimeDomainData(audioData);

        //let spectrum = new Float32Array(data.analyser.frequencyBinCount);
        //data.analyser.getFloatFrequencyData(spectrum);
        
        //let signalPower = calculateSignalPower(audioData);
        //let noisePower = estimateNoisePower(spectrum);
        
        //let peaks = detectFormantPeaks(spectrum, data.analyser.frequencyBinCount, data.audioContext.sampleRate);

        //let thicknessScore = thicknessmeter.analyze(audioData, spectrum, peaks, signalPower, noisePower);
        //thicknessmeter.drawMeter(vocalweightcanvas, thicknessScore);


        let audioData = new Float32Array(data.analyser.fftSize);
        data.analyser.getFloatTimeDomainData(audioData);

        let spectrum = new Float32Array(data.analyser.frequencyBinCount);
        data.analyser.getFloatFrequencyData(spectrum);

        let signalPower = calculateSignalPower(audioData);
        let noisePower = estimateNoisePower(spectrum);
        let peaks = detectFormantPeaks(spectrum, data.analyser.frequencyBinCount, data.audioContext.sampleRate);

        let thicknessScore = thicknessmeter.analyze(audioData, spectrum, peaks, signalPower, noisePower);
        thicknessmeter.drawMeter(vocalweightcanvas, thicknessScore);
    }*/

    // nah i think i'll modify what https://27or27.github.io/tm/thickness_meter.htm has already

    
    setInterval(()=>{
        drawSpectrum();
        updateVolumeMeter();
        drawSpectrogram();
        processAudioFrame(data.analyser, data.audioContext.sampleRate);
        //data.updateThicknessMeter();
    },1000/60);
    /*requestAnimationFrame(draw);
    console.log("aaa");

    console.log(stream);
    console.log(data.audioContext);
    console.log(source);
    console.log(data.analyser);
    console.log(data.bufferLength);
    console.log(data.dataArray);
    console.log(data.timeDomainDataArray);
    
    setTimeout(()=>{
        console.log("stream:");
        console.log(stream);
        console.log("data.audioContext:");
        console.log(data.audioContext);
        console.log("source:");
        console.log(source);
        console.log("data.analyser:");
        console.log(data.analyser);
        console.log("data.bufferLength:");
        console.log(data.bufferLength);
        console.log("data.dataArray:");
        console.log(data.dataArray);
        console.log("data.timeDomainDataArray:");
        console.log(data.timeDomainDataArray);
    },1000);*/
      

    
    function componentWillUnmount() {
        cancelAnimationFrame(this.rafId)
        this.data.analyser.disconnect()
        this.source.disconnect()
    }
})
.catch(function(err) {
    console.error('The following error occurred: ' + err);
});
