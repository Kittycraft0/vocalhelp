// formant.js

const formantCanvas = document.getElementById("formantmeter");
const formantCtx = formantCanvas.getContext("2d", { willReadFrequently: true });

const formantData = []; // This should be filled with your formant data
const feminineRanges = {
    F1: [200, 800],
    F2: [850, 2500],
    F3: [2500, 3500],
    F4: [3500, 4500],
    F5: [4500, 5500]
};

const colors = ['rgba(255,0,0,0.5)', 'rgba(0,255,0,0.5)', 'rgba(0,0,255,0.5)', 'rgba(255,128,0,0.5)', 'rgba(255,0,128,0.5)'];
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
                callback: processAudio
            });

            analyzer.start();
        } catch (error) {
            console.error("Failed to create Meyda analyzer:", error);
        }
    } else {
        console.error("Audio context or source is undefined.");
    }
}

function processAudio(features) {
    if (features && features.mfcc) {
        const mfccCoefficients = features.mfcc;
        const formants = getFormantsFromMFCC(mfccCoefficients);
        updateFormantData(formants);
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
    if (newData.length === 0) {
        console.warn("No formants detected.");
        return;
    }

    formantData.push(newData);
    if (formantData.length > MAX_HISTORY) {
        formantData.shift();
    }
    drawFormants();
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

var lastFinalPoint=[];
// Optimized scrolling for formant visualization
function drawFormants() {
    const ctx = formantCanvas.getContext("2d");
    // Scroll the image left
    const imageData = formantCtx.getImageData(1, 0, formantCanvas.width - 1, formantCanvas.height);
    formantCtx.putImageData(imageData, 0, 0);
    ctx.clearRect(formantCanvas.width - 1, 0, 2, formantCanvas.height); // Draw a vertical line on the right edge
    
    // Clear the rightmost pixels
    formantCtx.fillStyle = 'rgb(0, 0, 0)';
    formantCtx.fillRect(formantCanvas.width - 1, 0, 1, formantCanvas.height);

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
    const finalPoint = formantData[formantData.length - 1];
    if (data.visualType === "linear") {
        // Draw formant data as rectangles on the right-hand side
        for (let i = 0; i < finalPoint.length; i++) {
            ctx.fillStyle = frequencyToColor(finalPoint[i]);
            const y = formantCanvas.height - (finalPoint[i] / maxFrequency) * formantCanvas.height;
            ctx.fillRect(formantCanvas.width - 1, y, 1, 1); // Draw rectangles with width and height of 1 pixel
        }
    } else if (data.visualType === "logarithmic") {
        // Map frequency to y-coordinate on the canvas using logarithmic scale
        for (let i = 0; i < finalPoint.length; i++) {
            const value = finalPoint[i];
            const frequency = finalPoint[i];// i * data.audioContext.sampleRate / 2 / data.bufferLength;
            const nextFrequency = finalPoint[i+1];
            const yFormula = (frequency) => {
                return formantCanvas.height - (Math.log(frequency) / Math.log(10) - Math.log(20) / Math.log(10)) / (Math.log(20000) / Math.log(10) - Math.log(20) / Math.log(10)) * formantCanvas.height;
            }
            //const y = yFormula(frequency);
            const nexty = yFormula(nextFrequency);
            const color = data.amplitudeToColor(value);
            formantCtx.fillStyle = color;
            //console.log(y);
            //formantCtx.fillRect(formantCanvas.width - 1, Math.min(nexty, y), 1, Math.abs(y - nexty) + 1);
            formantCtx.fillRect(formantCanvas.width - 1, y, 1, 1);
            
            ctx.fillStyle = frequencyToColor(finalPoint[i]);
            const y = formantCanvas.height - (Math.log10(finalPoint[i]) - Math.log10(minFrequency)) / (Math.log10(maxFrequency) - Math.log10(minFrequency)) * formantCanvas.height;
            //const nexty = yFormula(formantCanvas.height - (Math.log10(finalPoint[i+1]) - Math.log10(minFrequency)) / (Math.log10(maxFrequency) - Math.log10(minFrequency)) * formantCanvas.height);
            ctx.fillRect(formantCanvas.width - 1, y, 1, 1); // Draw rectangles with width and height of 1 pixel
        }
    }
    lastFinalPoint=finalPoint;
}

// Call the function to initialize
initializeMeydaAnalyzer();


