// formant.js

const formantCanvas = document.getElementById("formantmeter");
const formantCtx = formantCanvas.getContext("2d", { willReadFrequently: true });

let formantData = []; // This should be filled with your formant data
const feminineRanges = {
    F1: [200, 800],
    F2: [850, 2500],
    F3: [2500, 3500],
    F4: [3500, 4500],
    F5: [4500, 5500]
};

const colors = ['rgba(255,0,0,0.5)', 'rgba(0,255,0,0.5)', 'rgba(0,0,255,0.5)', 'rgba(255,128,0,0.5)', 'rgba(255,0,128,0.5)'];
const pointColors = ['rgba(255,0,0,1)', 'rgba(0,255,0,1)', 'rgba(0,0,255,1)', 'rgba(255,128,0,1)', 'rgba(255,0,128,1)'];
const scrollSpeed = 2; // Adjust scroll speed as needed
const maxFrequency = 8000; // Maximum frequency to display
const minFrequency = 20; // Minimum frequency to display
const MAX_HISTORY = formantCanvas.width / scrollSpeed;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let analyzer;
let bufferSize = 512;

// use data.visualType from script2.js
// let visualType=data.visualType;
// don't declare another variable, that's stupid, we don't declare a new data.audioContext 
// whenever we reference it so why would we decleare a new visualType variable?

// Ensure a single AudioContext instance is used
if (!window.data) {
    window.data = {};
}
if (!data.audioContext) {
    data.audioContext = audioContext;
}

// Ensure data.source is created from the same context
async function initializeAudio() {
    if (!data.source) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = data.audioContext.createMediaStreamSource(stream);
        data.source = source; // Reuse this
    }
}

// Ensure Meyda is loaded before initializing
async function initializeMeydaAnalyzer() {
    await initializeAudio(); // Ensure source is initialized first

    await new Promise(resolve => {
        const checkMeyda = () => {
            if (window.Meyda) resolve();
            else setTimeout(checkMeyda, 50);
        };
        checkMeyda();
    });

    // List available feature extractors
    const availableFeatureExtractors = Meyda.listAvailableFeatureExtractors();
    console.log("Available feature extractors:", availableFeatureExtractors);

    if (data.audioContext && data.source) {
        try {
            console.log("Initializing Meyda with existing source.");
            
            analyzer = Meyda.createMeydaAnalyzer({
                audioContext: data.audioContext,
                source: data.source,  // Reuse existing source
                bufferSize: bufferSize,
                featureExtractors: ["mfcc"], // Use an available feature extractor
                callback: processAudio // Process audio data
            });

            analyzer.start();
        } catch (error) {
            console.error("Failed to create Meyda analyzer:", error);
        }
    } else {
        console.error("Audio context or source is undefined.");
    }
}

// Process audio data and update the formant buffer
function processAudio(features) {
    if (features && features.mfcc) {
        const mfccCoefficients = features.mfcc;
        const formants = getFormantsFromMFCC(mfccCoefficients);

        // Update the formant buffer
        data.formantBuffer = formants; // Store the extracted formants in the buffer
    }
}

// Function to get formants from MFCC coefficients
function getFormantsFromMFCC(mfccCoefficients) {
    // Placeholder function to process MFCC coefficients and extract formants
    // This function should be implemented based on your specific requirements
    return mfccCoefficients.slice(0, 5); // Example: return the first 5 MFCC coefficients as formants
}

// Use Levinson-Durbin recursion for stability
function levinsonDurbin(r, order) {
    let a = new Array(order + 1).fill(0);
    let e = r[0];

    if (e === 0) return a;

    a[0] = 1;
    for (let i = 1; i <= order; i++) {
        let lambda = -r[i];
        for (let j = 1; j < i; j++) {
            lambda -= a[j] * r[i - j];
        }
        lambda /= e;

        for (let j = 1; j <= Math.floor(i / 2); j++) {
            let aj = a[j];
            let ai_j = a[i - j];
            a[j] += lambda * ai_j;
            a[i - j] += lambda * aj;
        }
        a[i] = lambda;
        e *= (1 - lambda * lambda);
    }
    return a;
}

// Function to find polynomial roots using the Durand-Kerner method
function findPolynomialRoots(coefficients) {
    const n = coefficients.length - 1;
    let roots = Array.from({ length: n }, (_, i) => math.complex(Math.cos((2 * Math.PI * i) / n), Math.sin((2 * Math.PI * i) / n)));
    let maxIterations = 100;
    let tolerance = 1e-6;

    for (let iter = 0; iter < maxIterations; iter++) {
        let newRoots = roots.map((root, i) => {
            let numerator = math.complex(1, 0);
            let denominator = math.complex(1, 0);

            for (let j = 0; j < n; j++) {
                numerator = math.add(numerator, math.multiply(coefficients[j], math.pow(root, n - j)));
            }

            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    denominator = math.multiply(denominator, math.subtract(root, roots[j]));
                }
            }

            return math.subtract(root, math.divide(numerator, denominator));
        });

        let maxDifference = Math.max(...roots.map((root, i) => math.abs(math.subtract(root, newRoots[i]))));
        roots = newRoots;

        if (maxDifference < tolerance) {
            break;
        }
    }

    return roots;
}

// Function to update formant data and redraw the visualization
function updateFormantData(newData) {
    if(!newData){
        console.log("newData does not exist in this cycle!");
        return;
    }
    if (newData.length === 0) {
        console.warn("No formants detected.");
        return;
    }
    formantData=newData; // Update the formant data with the new data
}

// Function to map frequency to a color gradient
function frequencyToColor(freq) {
    let minFreq = 100;
    let maxFreq = 6000;
    let normalized = (freq - minFreq) / (maxFreq - minFreq);
    let r = Math.max(0, 255 * (1 - normalized));
    let g = Math.max(0, 255 * (1 - Math.abs(normalized - 0.5) * 2));
    let b = Math.max(0, 255 * normalized);
    return `rgb(${r}, ${g}, ${b})`;
}

var lastFinalPoint = [];

// Visualization function
function drawFormants() {
    const ctx = formantCanvas.getContext("2d");
// Scroll the image left
    //const imageData = formantCtx.getImageData(1, 0, formantCanvas.width - 1, formantCanvas.height);
    //formantCtx.putImageData(imageData, 0, 0);
    //ctx.clearRect(formantCanvas.width - 1, 0, 2, formantCanvas.height); // Draw a vertical line on the right edge
    
    // Clear the rightmost pixels
    /*formantCtx.fillStyle = 'rgb(0, 0, 0)';
    formantCtx.fillRect(formantCanvas.width - 1, 0, 1, formantCanvas.height);
    */
    // Draw horizontal lines for typical feminine ranges
    Object.keys(feminineRanges).forEach((formant, index) => {
        const [min, max] = feminineRanges[formant];
        ctx.strokeStyle = colors[index];
        ctx.fillStyle = colors[index];
        var hmin = formantCanvas.height - (min / maxFrequency) * formantCanvas.height;
        var hmax = formantCanvas.height - (max / maxFrequency) * formantCanvas.height;
        ctx.fillRect(
            formantCanvas.width - 1,
            Math.min(hmin, hmax),
            1,
            Math.abs(hmax - hmin));
    });

    // Example of additional visualization logic    
    const finalPoint = formantData;//formantData[formantData.length - 1];
    if(!finalPoint){console.log("finalPoint does not exist in this cycle!");}
    /*if (data.visualType === "linear") {
        // Draw formant data as rectangles on the right-hand side
        for (let i = 0; i < finalPoint.length; i++) {
        const y = formantCanvas.height - (finalPoint[i] / maxFrequency) * formantCanvas.height;
            ctx.fillStyle = frequencyToColor(finalPoint[i]);
            ctx.fillRect(formantCanvas.width - 1, y, 1, 1); // Draw rectangles with width and height of 1 pixel
        }
    } else if (data.visualType === "logarithmic") {
        // Map frequency to y-coordinate on the canvas using logarithmic scale
        for (let i = 0; i < finalPoint.length; i++) {
            const value = finalPoint[i];
            const frequency = finalPoint[i];
            const nextFrequency = finalPoint[i + 1];
            
            const y = formantCanvas.height - formantCanvas.height * data.frequencyToLogScale(frequency)*2;
            //const nexty = formantCanvas.height - formantCanvas.height * data.frequencyToLogScale(nextFrequency);
            const color = data.amplitudeToColor(value);
            formantCtx.fillStyle = color;
        formantCtx.fillRect(formantCanvas.width - 1, y, 1, 1);
            
            ctx.fillStyle = pointColors[pointColors.length-1-i]; //frequencyToColor(finalPoint[i]);
            ctx.fillRect(formantCanvas.width - 1, y, 1, 5); // Draw rectangles with width and height of 1 pixel
        }
    }*/
    lastFinalPoint = finalPoint;
}

// credit to copilot AI that implemented from https://in-formant.app/
// https://github.com/in-formant/in-formant?tab=Apache-2.0-1-ov-file they use the 
// apache 2.0 license so it's ok to use this code
// Function to extract formants using LPC and root-finding
function extractFormants(audioBuffer, sampleRate, lpcOrder = 12) {
    // Step 1: Pre-emphasis filter
    const preEmphasized = audioBuffer.map((sample, i) => {
        return i === 0 ? sample : sample - 0.97 * audioBuffer[i - 1];
    });

    // Step 2: Autocorrelation
    const autocorrelation = Array(lpcOrder + 1).fill(0);
    for (let lag = 0; lag <= lpcOrder; lag++) {
        for (let i = lag; i < preEmphasized.length; i++) {
            autocorrelation[lag] += preEmphasized[i] * preEmphasized[i - lag];
        }
    }

    // Step 3: Levinson-Durbin recursion to calculate LPC coefficients
    const lpcCoefficients = levinsonDurbin(autocorrelation, lpcOrder);

    // Step 4: Find roots of the LPC polynomial
    const roots = findPolynomialRoots(lpcCoefficients);

    // Step 5: Extract formant frequencies from roots
    const formantFrequencies = roots
        .filter(root => root.im >= 0) // Only consider roots with positive imaginary parts
        .map(root => (Math.atan2(root.im, root.re) * sampleRate) / (2 * Math.PI))
        .filter(freq => freq >= 90 && freq <= 5000) // Filter frequencies within the human speech range
        .sort((a, b) => a - b); // Sort frequencies in ascending order

    return formantFrequencies;
}

// Visualization function
function visualizeFormants(formantFrequencies) {
    const ctx = formantCanvas.getContext("2d");

    // Clear the canvas
    //ctx.clearRect(0, 0, formantCanvas.width, formantCanvas.height);

    // Scroll the image left
    const imageData = spectrogramCtx.getImageData(1, 0, spectrogramCanvas.width - 1, spectrogramCanvas.height);
    spectrogramCtx.putImageData(imageData, 0, 0);
    
    // Draw formants as rectangles or points
    formantFrequencies.forEach((frequency, index) => {
        const y = formantCanvas.height - (frequency / maxFrequency) * formantCanvas.height;
        const color = frequencyToColor(frequency);

        // Draw a rectangle for each formant
        ctx.fillStyle = color;
        ctx.fillRect(formantCanvas.width - 1 - index * 10, y, 10, 10);
    });
}

// Process audio buffer and visualize formants
function processAudioBuffer() {
    const sampleRate = data.audioContext.sampleRate;
    const audioBuffer = data.dataArray; // Use the existing audio buffer from the `data` object
    const formantFrequencies = extractFormants(audioBuffer, sampleRate);

    // Visualize the extracted formants
    visualizeFormants(formantFrequencies);
}

// Real-time audio processing using the existing `data` object
function startFormantProcessing() {
    if (!data.audioContext || !data.source || !data.analyser) {
        console.error("Audio context, source, or analyser is not initialized in the `data` object.");
        return;
    }

    function update() {
        data.analyser.getFloatTimeDomainData(data.dataArray); // Use the existing analyser and buffer
        processAudioBuffer();
        requestAnimationFrame(update);
    }

    update();
}


/*


// Function to extract formants using LPC and root-finding
function extractFormants(audioBuffer, sampleRate, lpcOrder = 12) {
    // Step 1: Pre-emphasis filter
    const preEmphasized = audioBuffer.map((sample, i) => {
        return i === 0 ? sample : sample - 0.97 * audioBuffer[i - 1];
    });

    // Step 2: Autocorrelation
    const autocorrelation = Array(lpcOrder + 1).fill(0);
    for (let lag = 0; lag <= lpcOrder; lag++) {
        for (let i = lag; i < preEmphasized.length; i++) {
            autocorrelation[lag] += preEmphasized[i] * preEmphasized[i - lag];
        }
    }

    // Step 3: Levinson-Durbin recursion to calculate LPC coefficients
    const lpcCoefficients = levinsonDurbin(autocorrelation, lpcOrder);

    // Step 4: Find roots of the LPC polynomial
    const roots = findPolynomialRoots(lpcCoefficients);

    // Step 5: Extract formant frequencies from roots
    const formantFrequencies = roots
        .filter(root => root.im >= 0) // Only consider roots with positive imaginary parts
        .map(root => (Math.atan2(root.im, root.re) * sampleRate) / (2 * Math.PI))
        .filter(freq => freq >= 90 && freq <= 5000) // Filter frequencies within the human speech range
        .sort((a, b) => a - b); // Sort frequencies in ascending order

    return formantFrequencies;
}

// Visualization function
function visualizeFormants(formantFrequencies) {
    const ctx = formantCanvas.getContext("2d");

    // Clear the canvas
    //ctx.clearRect(0, 0, formantCanvas.width, formantCanvas.height);

    // Scroll the image left
    const imageData = spectrogramCtx.getImageData(1, 0, spectrogramCanvas.width - 1, spectrogramCanvas.height);
    spectrogramCtx.putImageData(imageData, 0, 0);
    
    // Draw formants as rectangles or points
    formantFrequencies.forEach((frequency, index) => {
        const y = formantCanvas.height - (frequency / maxFrequency) * formantCanvas.height;
        const color = frequencyToColor(frequency);

        // Draw a rectangle for each formant
        ctx.fillStyle = color;
        ctx.fillRect(formantCanvas.width - 1 - index * 10, y, 10, 10);
    });
}

// Process audio buffer and visualize formants
function processAudioBuffer() {
    const sampleRate = data.audioContext.sampleRate;
    const audioBuffer = data.dataArray; // Use the existing audio buffer from the `data` object
    const formantFrequencies = extractFormants(audioBuffer, sampleRate);

    // Visualize the extracted formants
    visualizeFormants(formantFrequencies);
}


*/