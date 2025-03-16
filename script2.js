// 3/14/2025

// everything gets put into data!!!!!!!!!!!
const data = {
    visualType:"logarithmic",
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

const formantCanvas = document.getElementById("formantmeter");
const formantCtx = formantCanvas.getContext("2d");
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

        function getFormants(frequencyData, sampleRate) {
            const peaks = [];
            const threshold = -100;

            for (let i = 1; i < frequencyData.length - 1; i++) {
                if (frequencyData[i] > frequencyData[i - 1] && frequencyData[i] > frequencyData[i + 1] && frequencyData[i] > threshold) {
                    const frequency = (i * sampleRate) / (2 * frequencyData.length);
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
            formantCtx.clearRect(0, 0, formantCanvas.width, formantCanvas.height);
            formantCtx.fillStyle = 'black';
            formantCtx.fillRect(0, 0, formantCanvas.width, formantCanvas.height);
            formantCtx.fillStyle = 'white';
            formantCtx.font = '16px Arial';
            formantCtx.fillText(`Formant Dispersion: ${dispersion.toFixed(2)} Hz`, 10, 20);
        }

        function processAudioFrame(analyser, sampleRate) {
            const frequencyData = new Float32Array(data.analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(frequencyData);

            const formants = getFormants(frequencyData, sampleRate);
            const dispersion = calculateFormantDispersion(formants);
            displayFormantDispersion(dispersion);
        }

        setInterval(() => {
            drawSpectrum();
            updateVolumeMeter();
            drawSpectrogram();
            processAudioFrame(data.analyser, data.audioContext.sampleRate);
        }, 1000 / 60);

        function componentWillUnmount() {
            cancelAnimationFrame(this.rafId);
            this.data.analyser.disconnect();
            this.source.disconnect();
        }
    })
    .catch(err => {
        console.error('The following error occurred: ' + err);
    });
