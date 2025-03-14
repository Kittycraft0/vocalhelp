// 3/14/2025

const spectrumcanvas=document.getElementById("visualization");
const spectrumctx=spectrumcanvas.getContext("2d");
//ctx.fillStyle = 'rgb(255, 0, 0)';
//ctx.fillRect(0,0,canvas.width,canvas.height);


// Access the Microphone: Request permission to access the user's microphone and obtain a media stream.
navigator.mediaDevices.getUserMedia({ audio: true })
.then(function(stream) {
    // Use the stream
    console.log('Microphone access granted.');

    // Create an Audio Context: Initialize an AudioContext, which serves as the main interface to the Web Audio API.
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create a Media Stream Source: Convert the media stream into a source node that the audio context can process.
    const source = audioContext.createMediaStreamSource(stream);

    // Create an Analyser Node: Set up an AnalyserNode to extract frequency and amplitude data.
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // Determines the frequency resolution
    source.connect(analyser);

    // Extract Frequency Data: Retrieve the frequency data using a Uint8Array.
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function getFrequencyData() {
        analyser.getByteFrequencyData(dataArray);
        // dataArray now contains frequency data
    }

    // Extract Amplitude (Time-Domain) Data: Obtain the time-domain data to analyze the waveform.
    const timeDomainDataArray = new Uint8Array(bufferLength);

    function getTimeDomainData() {
        analyser.getByteTimeDomainData(timeDomainDataArray);
        // timeDomainDataArray now contains amplitude data
    }

    // Visualize the Data: Use the extracted data to create visualizations, such as frequency bars or waveforms.
    function draw() {
        requestAnimationFrame(draw);
        
        getFrequencyData();
        
        //console.log("a");
        // Visualization code here
        spectrumctx.fillStyle = 'rgb(0, 0, 0)';
        spectrumctx.fillRect(0,0,spectrumcanvas.width,spectrumcanvas.height);
        spectrumctx.clearRect(0,0,spectrumcanvas.width,spectrumcanvas.height);

        let barWidth = (spectrumcanvas.height / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        //console.log(bufferLength);
    
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];
            spectrumctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
            //if(barHeight!=-Infinity){
            //    console.log(barHeight);
            //}
            spectrumctx.fillRect(x, spectrumcanvas.height - barHeight / 2, barWidth, barHeight / 2);
            x += barWidth + 1;
        }
    }
      
    draw();
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
      



})
.catch(function(err) {
    console.error('The following error occurred: ' + err);
});
