// --- DOM Elements ---
const startButton = document.getElementById("startButton");
const statusElement = document.getElementById("status");
const speakerTargetSelect = document.getElementById("speakerTargetSelect"); // New

const volumeCanvas = document.getElementById("volumeMeterCanvas");
const frequencyAxisCanvas = document.getElementById("frequencyAxisCanvas");
const spectrogramCanvas = document.getElementById("spectrogramCanvas");
const weightCanvas = document.getElementById("weightCanvas");
const spectrumCanvas = document.getElementById("spectrumCanvas");
const formantCanvas = document.getElementById("formantCanvas");
const formantLabelCanvas = document.getElementById("formantLabelCanvas");

// Contexts with willReadFrequently hint where needed
const volumeCtx = volumeCanvas.getContext("2d", { willReadFrequently: true });
const frequencyAxisCtx = frequencyAxisCanvas.getContext("2d");
const spectrogramCtx = spectrogramCanvas.getContext("2d", { willReadFrequently: true });
const weightCtx = weightCanvas.getContext("2d", { willReadFrequently: true });
const spectrumCtx = spectrumCanvas.getContext("2d");
const formantCtx = formantCanvas.getContext("2d", { willReadFrequently: true });
const formantLabelCtx = formantLabelCanvas.getContext("2d");


// --- Audio Context and Analyzer ---
let audioContext;
let analyser;
let microphoneSource;
let animationFrameId;

// --- Configuration ---
const FFT_SIZE = 2048;
let SAMPLE_RATE;
let MAX_FREQ;
const MIN_DISPLAY_FREQ = 50;
const MAX_DISPLAY_FREQ = 16000; // Lowered max display slightly
const F0_ESTIMATION_RANGE = { min: 80, max: 400 }; // Hz range for F0 proxy
const F0_PEAK_THRESHOLD = 100; // Min amplitude (0-255) for F0 peak proxy
const FORMANT_PEAK_THRESHOLD = 100; // Threshold for detecting any peak for formant guide
const FORMANT_CANDIDATE_COLOR = "white"; // Color for strongest F1/F2/F3 candidates


// Buffers for data
let frequencyData;
let timeDomainData;

// --- Vocal Weight Config ---
const WEIGHT_LOW_BAND = { min: 100, max: 700 };
const WEIGHT_HIGH_BAND = { min: 1000, max: 5000 };
const WEIGHT_TILT_MIN_DB = -15;
const WEIGHT_TILT_MAX_DB = 35;
const WEIGHT_COLOR_LOW_THRESHOLD = 0.35; // Below this = Light (Cyan)
const WEIGHT_COLOR_HIGH_THRESHOLD = 0.65; // Above this = Heavy (Red)

// --- Speaker Target Definitions ---
const SPEAKER_TARGETS = {
    feminine: {
        label: "Feminine",
        formants: [
            { min: 500, max: 1000, color: "rgba(255, 100, 100, 0.8)", label: "F1" },
            { min: 1500, max: 2800, color: "rgba(100, 255, 100, 0.8)", label: "F2" },
            { min: 2500, max: 3500, color: "rgba(100, 100, 255, 0.8)", label: "F3" },
        ]
    },
    androgynous: {
        label: "Androgynous",
        formants: [
            { min: 400, max: 850, color: "rgba(255, 165, 0, 0.8)", label: "F1" }, // Orange
            { min: 1200, max: 2200, color: "rgba(173, 216, 230, 0.8)", label: "F2" }, // Light Blue
            { min: 2200, max: 3200, color: "rgba(221, 160, 221, 0.8)", label: "F3" }, // Plum
        ]
    },
    masculine: {
        label: "Masculine",
        formants: [
            { min: 300, max: 700, color: "rgba(255, 0, 0, 0.8)", label: "F1" }, // Red
            { min: 1000, max: 1800, color: "rgba(0, 128, 0, 0.8)", label: "F2" }, // Green
            { min: 2000, max: 3000, color: "rgba(0, 0, 255, 0.8)", label: "F3" }, // Blue
        ]
    }
};

// --- State ---
let isRunning = false;
let currentSpeakerTarget = SPEAKER_TARGETS.feminine; // Default
let estimatedF0Hz = null; // Store estimated F0

// --- Helper Functions ---
function amplitudeToDb(value) {
    const linear = value / 255.0;
    return linear === 0 ? -100 : 20 * Math.log10(linear);
}

function freqToY(freq, canvasHeight) {
    if (!canvasHeight || !MAX_FREQ) return canvasHeight;
    if (freq <= MIN_DISPLAY_FREQ) return canvasHeight;
    // Cap frequency at the display max or actual max before log calculation
    const effectiveMaxFreq = Math.min(MAX_DISPLAY_FREQ, MAX_FREQ);
    if (freq >= effectiveMaxFreq) return 0;

    const minLog = Math.log10(MIN_DISPLAY_FREQ);
    const maxLog = Math.log10(effectiveMaxFreq);
    const rangeLog = maxLog - minLog;
    if (rangeLog <= 0) return canvasHeight;

    const freqLog = Math.log10(freq);
    const proportion = (freqLog - minLog) / rangeLog;
    return canvasHeight * (1 - Math.max(0, Math.min(1, proportion)));
}

// --- Initialization ---
function initAudio() {
    try {
        statusElement.textContent = "Status: Initializing Audio...";
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        SAMPLE_RATE = audioContext.sampleRate;
        MAX_FREQ = SAMPLE_RATE / 2;

        analyser = audioContext.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = 0.4;

        frequencyData = new Uint8Array(analyser.frequencyBinCount);
        timeDomainData = new Uint8Array(analyser.fftSize);

        // Set initial target from dropdown
        currentSpeakerTarget = SPEAKER_TARGETS[speakerTargetSelect.value] || SPEAKER_TARGETS.feminine;

        navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((stream) => {
            microphoneSource = audioContext.createMediaStreamSource(stream);
            microphoneSource.connect(analyser);

            statusElement.textContent = `Status: Mic Connected (${SAMPLE_RATE} Hz). Ready.`;
            startButton.textContent = "Stop Microphone";
            speakerTargetSelect.disabled = true; // Disable dropdown while running
            isRunning = true;

            // Draw static elements ONCE after mic is connected
            drawFrequencyAxis();
            drawFormantLabels(); // Uses currentSpeakerTarget
            drawWeightAxis();    // Draw static weight background

            clearDynamicCanvases();
            draw(); // Start animation loop
        })
        .catch((err) => {
            console.error("Error accessing microphone:", err);
            statusElement.textContent = `Error: ${err.message}`;
            cleanupAudio();
        });
    } catch (e) {
        console.error("Web Audio API is not supported:", e);
        statusElement.textContent = "Error: Web Audio API not supported.";
        alert("Web Audio API is not supported.");
    }
}

function cleanupAudio() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (microphoneSource?.mediaStream?.getTracks) {
        microphoneSource.mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (microphoneSource) {
        microphoneSource.disconnect();
        microphoneSource = null;
    }
    if (audioContext && audioContext.state !== "closed") {
        audioContext.close().then(() => { audioContext = null; });
    } else {
        audioContext = null;
    }

    analyser = null;
    isRunning = false;
    estimatedF0Hz = null; // Reset F0 estimate
    startButton.textContent = "Start Microphone";
    speakerTargetSelect.disabled = false; // Re-enable dropdown
    statusElement.textContent = "Status: Idle";
}

// Clear only the canvases that scroll or change dynamically each frame
function clearDynamicCanvases() {
    [volumeCtx, spectrogramCtx, spectrumCtx, formantCtx].forEach(ctx => {
        if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    });
    // Clear weight canvas but keep static background drawn in drawWeightAxis
    if (weightCtx) {
        weightCtx.fillStyle = '#000000'; // Set fill to black for scrolling part
        // Don't clearRect here, let drawWeightAxis handle initial background
    }
}

// --- Static Drawing Functions (Called Once or on change) ---

function drawFrequencyAxis() {
    if (!frequencyAxisCtx) return;
    const ctx = frequencyAxisCtx;
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f0f0f0'; // Background
    ctx.fillRect(0, 0, width, height);

    // Frequencies to label (adjust as needed)
    const frequencies = [100, 200, 300, 500, 700, 1000, 1500, 2000, 3000, 5000, 7000, 10000, 15000];

    ctx.fillStyle = '#333'; // Label color
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    frequencies.forEach(freq => {
        if (freq >= MIN_DISPLAY_FREQ && freq <= MAX_DISPLAY_FREQ) {
            const y = freqToY(freq, height);
            // Draw tick mark
            ctx.beginPath();
            ctx.moveTo(width - 5, y);
            ctx.lineTo(width, y);
            ctx.strokeStyle = '#666';
            ctx.stroke();

            // Draw label
            let label = freq < 1000 ? `${freq}` : `${(freq / 1000).toFixed(freq < 10000 ? 1 : 0)}k`;
            ctx.fillText(label, width - 8, y);
        }
    });
}

function drawFormantLabels() {
    // Uses global currentSpeakerTarget
    if (!formantLabelCtx || !currentSpeakerTarget) return;
    const ctx = formantLabelCtx;
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f0f0f0'; // Background
    ctx.fillRect(0, 0, width, height);

    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    currentSpeakerTarget.formants.forEach(range => {
        const yMin = freqToY(range.max, height); // Max freq = lower Y
        const yMax = freqToY(range.min, height); // Min freq = higher Y
        const yCenter = (yMin + yMax) / 2;

        // Draw colored rectangle indicating range
        ctx.fillStyle = range.color.replace(/[\d.]+\)$/, '0.3)'); // Semi-transparent background bar
    ctx.fillRect(5, yMin, width - 10, yMax - yMin);

    // Draw label
    ctx.fillStyle = range.color.replace('rgba', 'rgb').replace(/, [0-9.]+\)/, ')'); // Solid color for text
    ctx.fillText(range.label, 10, yCenter);
    });
}

function drawWeightAxis() {
    // Draws static background onto weightCanvas
    if (!weightCtx) return;
    const ctx = weightCtx;
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    // Clear and set background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    weightCanvas.classList.remove('drawing'); // Ensure background is visible

    // Draw threshold lines
    const yLow = WEIGHT_COLOR_LOW_THRESHOLD * height;
    const yHigh = WEIGHT_COLOR_HIGH_THRESHOLD * height;

    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]); // Dashed lines

    ctx.beginPath();
    ctx.moveTo(0, yLow);
    ctx.lineTo(width, yLow);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, yHigh);
    ctx.lineTo(width, yHigh);
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash

    // Draw labels
    ctx.fillStyle = '#555';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.fillText('Light', 5, yLow / 2); // Label top zone
    ctx.fillText('Medium', 5, (yLow + yHigh) / 2); // Label middle zone
    ctx.fillText('Heavy', 5, (yHigh + height) / 2); // Label bottom zone

    // Set fill style for subsequent drawing operations in drawWeightMeter
    ctx.fillStyle = '#000000';
}


// --- Dynamic Drawing Functions (Called Each Frame) ---

function drawVolumeMeter() {
    if (!analyser || !volumeCtx) return;
    analyser.getByteTimeDomainData(timeDomainData);

    let sumSquares = 0.0;
    for (const amplitude of timeDomainData) {
        const norm = (amplitude / 128.0) - 1.0;
        sumSquares += norm * norm;
    }
    const rms = Math.sqrt(sumSquares / timeDomainData.length);
    const db = 20 * Math.log10(rms || 1e-9); // Avoid log(0)
    const volume = Math.min(1, Math.max(0, (db + 60) / 60));

    const canvas = volumeCanvas;
    const ctx = volumeCtx;
    const height = canvas.height;
    const width = canvas.width;
    const meterHeight = volume * height;

    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, "green");
    gradient.addColorStop(0.7, "yellow");
    gradient.addColorStop(1, "red");

    if (meterHeight > 0) {
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - meterHeight, width, meterHeight);
    }

    ctx.fillStyle = "white";
    ctx.font = "10px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let dbVal = 0; dbVal >= -50; dbVal -= 10) {
        const y = height - ((dbVal + 60) / 60) * height;
        ctx.fillText(`${dbVal}`, width - 5, y);
    }
}

function drawSpectrogram() {
    if (!analyser || !spectrogramCtx || !frequencyData) return;
    const canvas = spectrogramCanvas;
    const ctx = spectrogramCtx;
    const width = canvas.width;
    const height = canvas.height;
    const binCount = analyser.frequencyBinCount;

    const columnX = width - 1;

    // 1. Shift image
    if (width > 1 && height > 0) {
        try {
            const imageData = ctx.getImageData(1, 0, width - 1, height);
            ctx.putImageData(imageData, 0, 0);
        } catch (e) { console.warn("Spectrogram scroll error:", e); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); }
    } else if (width > 0 && height > 0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); }

    // 2. Clear drawing column
    if (columnX >= 0) { ctx.clearRect(columnX, 0, 1, height); }

    // 3. Draw new data slice with vertical fill
    let y_previous = height;
    if (columnX >= 0) { // Only draw if column is valid
        for (let i = 0; i < binCount; i++) {
            const freq = (i / binCount) * MAX_FREQ;
            if (freq < MIN_DISPLAY_FREQ) continue;
            if (freq > MAX_DISPLAY_FREQ) break;

            const value = frequencyData[i];
            const percent = value / 255;
            const y_current = freqToY(freq, height);

            const hue = 240 - percent * 240;
            const lightness = 10 + percent * 40;
            const color = `hsl(${hue}, 100%, ${lightness}%)`;

            // Fill rectangle from previous y down to current y
            if (y_previous > y_current) {
                ctx.fillStyle = color;
                // Use Math.ceil and +1 to ensure overlap and fill gaps
                ctx.fillRect(columnX, y_current, 1, Math.ceil(y_previous - y_current + 1));
            }
            y_previous = y_current;
        }

        // Draw Estimated F0 Line
        if (estimatedF0Hz !== null) {
            const yF0 = freqToY(estimatedF0Hz, height);
            ctx.fillStyle = 'white';
            ctx.fillRect(columnX, Math.round(yF0) -1, 1, 3); // Small white line
        }
    }
}

function drawSpectrum() {
    if (!analyser || !spectrumCtx || !frequencyData || !currentSpeakerTarget) return;
    const canvas = spectrumCanvas;
    const ctx = spectrumCtx;
    const width = canvas.width;
    const height = canvas.height;
    const binCount = analyser.frequencyBinCount;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    // Draw Formant Target Frequency Ranges (Vertical Bars)
    currentSpeakerTarget.formants.forEach(range => {
        const yMin = freqToY(range.max, height);
        const yMax = freqToY(range.min, height);
        ctx.fillStyle = range.color.replace(/[\d.]+\)$/, '0.1)'); // Very transparent
    ctx.fillRect(0, yMin, width, yMax - yMin);
    });


    // Draw Spectrum Data
    let y_previous = height;
    for (let i = 0; i < binCount; i++) {
        const freq = (i / binCount) * MAX_FREQ;
        if (freq < MIN_DISPLAY_FREQ) continue;
        if (freq > MAX_DISPLAY_FREQ) break;

        const value = frequencyData[i];
        const percent = value / 255;
        const y_current = freqToY(freq, height);
        const barWidth = percent * width;

        const hue = 240 - percent * 240;
        const lightness = 10 + percent * 40;
        const color = `hsl(${hue}, 100%, ${lightness}%)`;

        // Fill rectangle from previous y down to current y
        if (barWidth > 0 && y_previous > y_current) {
            ctx.fillStyle = color;
            ctx.fillRect(0, y_current, barWidth, Math.ceil(y_previous - y_current + 1));
        }
        y_previous = y_current;
    }

    // Draw Estimated F0 Line
    if (estimatedF0Hz !== null) {
        const yF0 = freqToY(estimatedF0Hz, height);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, yF0);
        ctx.lineTo(width, yF0); // Line across spectrum width
        ctx.stroke();
    }
}

function drawWeightMeter() {
    if (!analyser || !weightCtx || !frequencyData) return;
    const canvas = weightCanvas;
    const ctx = weightCtx;
    const width = canvas.width;
    const height = canvas.height;
    const binCount = analyser.frequencyBinCount;

    // Ensure canvas has black background class for drawing phase
    if (!canvas.classList.contains('drawing')) {
        canvas.classList.add('drawing');
    }

    // --- Calculate Spectral Tilt ---
    let lowSumDb = 0, lowCount = 0, highSumDb = 0, highCount = 0;
    for (let i = 0; i < binCount; i++) {
        const freq = (i / binCount) * MAX_FREQ;
        const valueDb = amplitudeToDb(frequencyData[i]);
        if (freq >= WEIGHT_LOW_BAND.min && freq <= WEIGHT_LOW_BAND.max) {
            lowSumDb += valueDb; lowCount++;
        } else if (freq >= WEIGHT_HIGH_BAND.min && freq <= WEIGHT_HIGH_BAND.max) {
            highSumDb += valueDb; highCount++;
        }
    }
    const lowAvgDb = lowCount > 0 ? lowSumDb / lowCount : -100;
    const highAvgDb = highCount > 0 ? highSumDb / highCount : -100;
    const tiltDb = lowAvgDb - highAvgDb;
    const clampedTilt = Math.max(WEIGHT_TILT_MIN_DB, Math.min(WEIGHT_TILT_MAX_DB, tiltDb));
    const normalizedWeight = (clampedTilt - WEIGHT_TILT_MIN_DB) / (WEIGHT_TILT_MAX_DB - WEIGHT_TILT_MIN_DB);

    // --- Drawing ---
    const columnX = width - 1;

    // 1. Shift image (Draws over static background)
    if (width > 1 && height > 0) {
        try {
            // Capture from column 1 up to width-1
            const imageData = ctx.getImageData(1, 0, width - 1, height);
            // Put it back starting at column 0
            ctx.putImageData(imageData, 0, 0);
        } catch (e) { console.warn("Weight scroll error:", e); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); }
    } else if (width > 0 && height > 0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); }

    // 2. Clear drawing column (over static background)
    if (columnX >= 0) {
        // Clear with black before drawing new line
        ctx.fillStyle = '#000000';
        ctx.fillRect(columnX, 0, 1, height);
    }

    // 3. Draw new weight value (Heavy = Bottom)
    // Y-axis: 0 = top (light), height = bottom (heavy)
    const y = Math.round(normalizedWeight * height);

    let weightColor = "red"; // Medium
    if (normalizedWeight < WEIGHT_COLOR_LOW_THRESHOLD) weightColor = "cyan"; // heavy
    else if (normalizedWeight > WEIGHT_COLOR_HIGH_THRESHOLD) weightColor = "green"; // Light

    ctx.fillStyle = weightColor;
    if (y >= 0 && y < height && columnX >= 0) {
        ctx.fillRect(columnX, Math.max(0, y - 1), 1, 3); // Draw dot/line
    }
}

function drawFormantGuide() {
    if (!analyser || !formantCtx || !frequencyData || !currentSpeakerTarget) return;
    const canvas = formantCanvas;
    const ctx = formantCtx;
    const width = canvas.width;
    const height = canvas.height;
    const binCount = analyser.frequencyBinCount;

    // --- Drawing ---
    const columnX = width - 1;

    // 1. Shift image
    if (width > 1 && height > 0) {
        try {
            const imageData = ctx.getImageData(1, 0, width - 1, height);
            ctx.putImageData(imageData, 0, 0);
        } catch (e) { console.warn("Formant scroll error:", e); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); }
    } else if (width > 0 && height > 0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); }

    // 2. Clear drawing column
    if (columnX >= 0) { ctx.clearRect(columnX, 0, 1, height); }

    // --- Peak Finding and Processing ---
    let allPeaks = []; // Store all detected peaks: { freq, amp }
    let strongestFormantPeaks = {}; // Store strongest peak in each range: { F1: {freq, amp}, F2: ... }

    if (columnX >= 0) { // Only process if column is valid
        // --- Pass 1: Find ALL local peaks above threshold ---
        for (let i = 1; i < binCount - 1; i++) {
            const freq = (i / binCount) * MAX_FREQ;
            if (freq < MIN_DISPLAY_FREQ || freq > MAX_DISPLAY_FREQ) continue;

            const amplitude = frequencyData[i];
            if (amplitude > frequencyData[i-1] &&
                amplitude > frequencyData[i+1] &&
                amplitude > FORMANT_PEAK_THRESHOLD) // Use specific threshold
            {
                allPeaks.push({ freq: freq, amp: amplitude });
            }
        }

        // --- Pass 2: Find the strongest peak within each target formant range ---
        currentSpeakerTarget.formants.forEach(range => {
            let strongestPeakInRange = null;
            let maxAmp = -1;

            allPeaks.forEach(peak => {
                if (peak.freq >= range.min && peak.freq <= range.max) {
                    if (peak.amp > maxAmp) {
                        maxAmp = peak.amp;
                        strongestPeakInRange = peak;
                    }
                }
            });
            // Store the strongest peak found for this formant label (F1, F2, etc.)
            if (strongestPeakInRange) {
                strongestFormantPeaks[range.label] = strongestPeakInRange;
            }
        });

        // --- Pass 3: Draw Backgrounds and Peaks ---
        // Draw static ranges background first
        currentSpeakerTarget.formants.forEach(range => {
            const yMin = freqToY(range.max, height);
            const yMax = freqToY(range.min, height);
            ctx.fillStyle = range.color.replace(/[\d.]+\)$/, '0.4)'); // Background alpha
        for (let y = Math.round(yMin); y <= Math.round(yMax); y++) {
            if (y >= 0 && y < height) { ctx.fillRect(columnX, y, 1, 1); }
        }
        });

        // Create a quick lookup map for strongest formant frequencies for efficiency
        const strongestFreqMap = new Map();
        Object.values(strongestFormantPeaks).forEach(peak => {
            if (peak) strongestFreqMap.set(peak.freq, true);
        });

            // Draw all detected peaks with appropriate color
            allPeaks.forEach(peak => {
                const y = freqToY(peak.freq, height);
                if (y >= 0 && y < height) {
                    let peakColor;
                    // Check if this peak is one of the identified strongest formants
                    if (strongestFreqMap.has(peak.freq)) {
                        peakColor = FORMANT_CANDIDATE_COLOR; // White for F1/F2/F3 candidates
                    } else {
                        // Otherwise, color based on intensity heatmap
                        const percent = peak.amp / 255;
                        const hue = 240 - percent * 240; // Blue->Red
                        const lightness = 15 + percent * 50; // Dim->Bright
                        peakColor = `hsl(${hue}, 100%, ${lightness}%)`;
                    }
                    ctx.fillStyle = peakColor;
                    ctx.fillRect(columnX, Math.round(y), 1, 1); // Draw peak dot
                }
            });
    } // End if (columnX >= 0)
}


// --- Basic F0 Estimation Proxy ---
function estimateF0() {
    if (!analyser || !frequencyData) {
        estimatedF0Hz = null;
        return;
    }
    const binCount = analyser.frequencyBinCount;
    let f0Bin = -1;
    // let maxPeakAmp = 0; // Use if finding strongest peak instead of first

    for (let i = 1; i < binCount - 1; i++) {
        const freq = (i / binCount) * MAX_FREQ;

        // Only consider peaks within the defined F0 range
        if (freq >= F0_ESTIMATION_RANGE.min && freq <= F0_ESTIMATION_RANGE.max) {
            const amplitude = frequencyData[i];
            // Basic peak detection (higher than neighbors and threshold)
            if (amplitude > frequencyData[i-1] &&
                amplitude > frequencyData[i+1] &&
                amplitude > F0_PEAK_THRESHOLD)
            {
                // Take the *first* strong peak found in the range
                if (f0Bin === -1) {
                    f0Bin = i;
                    break; // Found the first likely candidate
                }
            }
        }
        // Stop searching if frequency exceeds F0 range
        if (freq > F0_ESTIMATION_RANGE.max) {
            break;
        }
    }

    if (f0Bin !== -1) {
        estimatedF0Hz = (f0Bin / binCount) * MAX_FREQ;
    } else {
        estimatedF0Hz = null; // No suitable peak found
    }
}


// --- Main Animation Loop ---
function draw() {
    if (!isRunning || !analyser) {
        animationFrameId = null;
        return;
    };

    if (analyser) {
        analyser.getByteFrequencyData(frequencyData);
        estimateF0(); // Run F0 estimation proxy
    } else {
        cleanupAudio(); return;
    }

    // Draw dynamic canvases
    drawVolumeMeter();
    drawSpectrogram();
    drawSpectrum();
    drawWeightMeter();
    drawFormantGuide(); // Updated peak drawing

    animationFrameId = requestAnimationFrame(draw);
}

// --- Event Listeners ---
startButton.addEventListener("click", () => {
    if (isRunning) {
        cleanupAudio();
    } else {
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close().then(() => { audioContext = null; initAudio(); });
        } else {
            audioContext = null; initAudio();
        }
    }
});

speakerTargetSelect.addEventListener('change', (event) => {
    const selectedTarget = event.target.value;
    currentSpeakerTarget = SPEAKER_TARGETS[selectedTarget] || SPEAKER_TARGETS.feminine;
    console.log("Speaker target changed to:", currentSpeakerTarget.label);
    // Redraw static labels immediately
    drawFormantLabels();
    // If not running, also redraw weight axis in case its appearance changes
    if (!isRunning) {
        drawWeightAxis();
    }
    // The dynamic canvases (spectrum, formant guide) will update on the next frame
});


// --- Initial Setup ---
// Set initial target and draw static elements on load
window.addEventListener('load', () => {
    currentSpeakerTarget = SPEAKER_TARGETS[speakerTargetSelect.value] || SPEAKER_TARGETS.feminine;
    drawFrequencyAxis();
    drawFormantLabels();
    drawWeightAxis(); // Draw initial weight background
    clearDynamicCanvases(); // Clear scrolling canvases
});
