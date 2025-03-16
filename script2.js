// 3/14/2025

// everything gets put into data!!!!!!!!!!!
const data = {
    visualType:"logarithmic",
    drawSpectrogramSecondLines:false,
    amplitudeToColor(amplitude) {
        const normalizedAmplitude = amplitude === -Infinity ? 0 : Math.min(1, Math.max(0, (amplitude + 96) / 96));
        const hue = (1 - normalizedAmplitude * 1.5) * 240;
        return `hsl(${hue}, 100%, 50%)`;
    },
    frequencyToXAxis(frequency) {
        const minF = Math.log(20) / Math.log(10);
        const maxF = Math.log(20000) / Math.log(10);
        const range = maxF - minF;
        return ((Math.log(frequency) / Math.log(10) - minF) / range) * 945;
    },
    calculateVolume(timeDomainDataArray) {
        let sumSquares = 0;
        for (let i = 0; i < timeDomainDataArray.length; i++) {
            sumSquares += timeDomainDataArray[i] * timeDomainDataArray[i];
        }
        const rms = Math.sqrt(sumSquares / timeDomainDataArray.length);
        return 20 * Math.log10(rms);
    }
};

//const formantCanvas = document.getElementById("formantmeter");
//const formantCtx = formantCanvas.getContext("2d");
//const vocalWeightCanvas = document.getElementById("vocalweightmeter");
//const vocalWeightCtx = vocalWeightCanvas.getContext("2d");
const fullnessCanvas = document.getElementById("fullnessmeter");
const fullnessCtx = fullnessCanvas.getContext("2d");

navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        console.log('Microphone access granted.');

        data.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        data.source = data.audioContext.createMediaStreamSource(stream);
        const sourceSmooth = data.audioContext.createMediaStreamSource(stream);

        data.analyser = data.audioContext.createAnalyser();
        data.analyserSmooth = data.audioContext.createAnalyser();

        data.analyser.minDecibels = -96;
        data.analyser.maxDecibels = 0;
        data.analyser.fftSize = 4096;
        data.analyser.smoothingTimeConstant = 0;
        data.source.connect(data.analyser);

        data.analyserSmooth.minDecibels = -96;
        data.analyserSmooth.maxDecibels = 0;
        data.analyserSmooth.fftSize = 4096;
        data.analyserSmooth.smoothingTimeConstant = 0.8;
        sourceSmooth.connect(data.analyserSmooth);

        data.bufferLength = data.analyser.frequencyBinCount;
        data.dataArray = new Float32Array(data.bufferLength);
        data.bufferLengthSmooth = data.analyserSmooth.frequencyBinCount;
        data.dataArraySmooth = new Float32Array(data.bufferLengthSmooth);
        data.timeDomainDataArray = new Float32Array(data.bufferLength);

        // Call startThicknessAnalysis after initializing the audio context and source
        startThicknessAnalysis();
        // Initialize the Meyda Analyzer for formant.js after initializing the audio context and source
        initializeMeydaAnalyzer();

        

        setInterval(() => {
            drawSpectrum();
            updateVolumeMeter();
            drawSpectrogram();
            drawThicknessGraph();
            drawFormants();
        }, 1000 / 60);
    })
    .catch(err => {
        console.error('The following error occurred: ' + err);
    });
