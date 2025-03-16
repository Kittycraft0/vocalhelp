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

const colors = ['red', 'green', 'blue', 'orange', 'purple'];
const scrollSpeed = 2; // Adjust scroll speed as needed
const maxFrequency = 8000; // Maximum frequency to display
const sampleRate = data.audioContext.sampleRate; // Sample rate of the audio
const MAX_HISTORY = formantCanvas.width / scrollSpeed;


// Initialize Meyda analyzer
let meydaAnalyzer;
function initializeMeydaAnalyzer(){
console.log("Audio Context:", data.audioContext);
console.log("Audio Source:", data.source);
if (data.audioContext && data.source) {
    try {
        console.log(Meyda.featureExtractors);
        meydaAnalyzer = Meyda.createMeydaAnalyzer({
            audioContext: data.audioContext,
            source: data.source,
            bufferSize: 4096,
            featureExtractors: ['lpc'],
            callback: features => {
                if (features && features.lpc) {
                    const lpcCoefficients = features.lpc;
                    const formants = getFormantsFromLPC(lpcCoefficients);
                    updateFormantData(formants);
                }
            }
        });

        meydaAnalyzer.start();
    } catch (error) {
        console.error("Failed to create Meyda analyzer:", error);
    }
} else {
    console.error("Audio context or source is undefined.");
}

}
// Function to calculate formants using Meyda
function calculateFormants() {
    if (meydaAnalyzer) {
        const features = meydaAnalyzer.get('lpc');
        if (features && features.lpc) {
            const formants = getFormantsFromLPC(features.lpc);
            updateFormantData(formants);
        }
    } else {
        console.error("Meyda analyzer is not initialized.");
    }
}

// Function to get formants from LPC coefficients
function getFormantsFromLPC(lpcCoefficients) {
    const roots = findPolynomialRoots(lpcCoefficients);
    const formants = roots
        .filter(root => root.imaginary >= 0)
        .map(root => (sampleRate / (2 * Math.PI)) * Math.atan2(root.imaginary, root.real))
        .filter(freq => freq > 100 && freq < 6000) // Filter realistic human speech formants
        .sort((a, b) => a - b)
        .slice(0, 5); // Get the first 5 formants
    return formants;
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

function updateFormantData(newData) {
    console.log("New formant data:", newData); // Debug output

    if (newData.length === 0) {
        console.warn("No formants detected.");
        return;
    }
    if (formantData.length >= MAX_HISTORY) {
        formantData.shift(); // Remove oldest entry
    }    
    formantData.push(newData);
    drawFormants();
}

function drawFormants() {
    // Scroll the image left
    const imageData = formantCtx.getImageData(scrollSpeed, 0, formantCanvas.width - scrollSpeed, formantCanvas.height);
    formantCtx.putImageData(imageData, 0, 0);
    formantCtx.fillStyle = 'rgb(0,0,0)';
    formantCtx.fillRect(formantCanvas.width - scrollSpeed, 0, scrollSpeed, formantCanvas.height); // Clear the rightmost pixels

    // Draw horizontal lines for typical feminine ranges
    Object.keys(feminineRanges).forEach((formant, index) => {
        const [min, max] = feminineRanges[formant];
        formantCtx.strokeStyle = colors[index];
        formantCtx.fillStyle = colors[index];
        var hmin = formantCanvas.height - (min / maxFrequency) * formantCanvas.height;
        var hmax = formantCanvas.height - (max / maxFrequency) * formantCanvas.height;
        formantCtx.fillRect(
            formantCanvas.width-1,
            Math.min(hmin,hmax),
            1,
            Math.abs(hmax-hmin));
    });

    // Draw formant data
    formantData.forEach((dataPoint, index) => {
        const x = formantCanvas.width - scrollSpeed + (index * scrollSpeed);
        if (x < 0) return;

        dataPoint.forEach((formant, formantIndex) => {
            formantCtx.fillStyle = colors[formantIndex];
            const x = formantCanvas.width - scrollSpeed; // Always draw new data at the rightmost edge
            const y = formantCanvas.height - (formant / maxFrequency) * formantCanvas.height;
            formantCtx.fillRect(x, y, 2, 2);
        });
    });
}


