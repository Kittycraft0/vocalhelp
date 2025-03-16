// 3/14/2025

// everything gets put into data!!!!!!!!!!!
const data = {
    // options: linear, logarithmic
    visualType: "logarithmic",
    drawSpectrogramSecondLines: false,

    stream: "undefined stream!", //await navigator.mediaDevices.getUserMedia({ audio: true }),

    audioContext: new (window.AudioContext || window.webkitAudioContext)(),
    source: "undefined source!", //this.audioContext.createMediaStreamSource(stream),

    analyser: "undefined analyser!", //this.audioContext.createAnalyser(),

    analyserMinDecibels: -96,
    analyserMaxDecibels: 0,
    analyserfftSize: 4096,
    analyserSmoothingTimeConstant: 0,

    bufferLength: "undefined bufferLength!", //this.analyser.frequencyBinCount,
    dataArray: "undefined Float32Array dataArray!", //new Float32Array(this.bufferLength),

    timeDomainDataArray: "undefined Float32Array timeDomainDataArray!", //new Float32Array(this.bufferLength),

    sourceSmooth: "undefined source!", //this.audioContext.createMediaStreamSource(stream),
    analyserSmooth: "undefined analyser!", //this.audioContext.createAnalyser(),

    analyserSmoothMinDecibels: -96,
    analyserSmoothMaxDecibels: 0,
    analyserSmoothfftSize: 4096,
    analyserSmoothSmoothingTimeConstant: 0.8, //distinction between the two analysers

    bufferLengthSmooth: "undefined bufferLength!", //this.analyserSmooth.frequencyBinCount,
    dataArraySmooth: "undefined Float32Array dataArraySmooth!", //new Float32Array(this.bufferLengthSmooth),

    initializeAudio: async function() {
        if (!data.source) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            data.stream = stream;
            data.source = data.audioContext.createMediaStreamSource(stream);
        }

        data.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        data.source = data.audioContext.createMediaStreamSource(data.stream);

        data.analyser = data.audioContext.createAnalyser();

        data.analyser.minDecibels = data.analyserMinDecibels;
        data.analyser.maxDecibels = data.analyserMaxDecibels;
        data.analyser.fftSize = data.analyserfftSize;
        data.analyser.smoothingTimeConstant = data.analyserSmoothingTimeConstant;
        data.source.connect(data.analyser);

        data.bufferLength = data.analyser.frequencyBinCount;
        data.dataArray = new Float32Array(data.bufferLength);

        data.timeDomainDataArray = new Float32Array(data.bufferLength);

        // smooth one
        data.sourceSmooth = data.audioContext.createMediaStreamSource(data.stream);
        data.analyserSmooth = data.audioContext.createAnalyser();

        data.analyserSmooth.minDecibels = data.analyserSmoothMinDecibels;
        data.analyserSmooth.maxDecibels = data.analyserSmoothMaxDecibels;
        data.analyserSmooth.fftSize = data.analyserSmoothfftSize;
        data.analyserSmooth.smoothingTimeConstant = data.analyserSmoothSmoothingTimeConstant;
        data.sourceSmooth.connect(data.analyserSmooth);

        data.bufferLengthSmooth = data.analyserSmooth.frequencyBinCount;
        data.dataArraySmooth = new Float32Array(data.bufferLengthSmooth);
    },

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
    },
    frequencyToLogScale(frequency) {
        const minF = Math.log10(20);
        const maxF = Math.log10(20000);
        const range = maxF - minF;
        const yFormula = (frequency) => {
            return height - (Math.log(frequency) / Math.log(10) - minF) / range * height;
        }
        return (Math.log(frequency) / Math.log(10) - minF) / range;
    }
};

const fullnessCanvas = document.getElementById("fullnessmeter");
const fullnessCtx = fullnessCanvas.getContext("2d");

navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        data.stream = stream;
        console.log('Microphone access granted.');

        // Call initializeAudio after setting data.stream
        data.initializeAudio().then(() => {
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
        });
    })
    .catch(err => {
        console.error('The following error occurred: ' + err);
    });
