// 3/15/2025 - 11:53 PM CST
// copied and modified from https://27or27.github.io/tm/thickness_meter.htm

var vocalWeightCanvas = document.getElementById("vocalweightmeter");
const vocalWeightCtx = vocalWeightCanvas.getContext("2d");

var SETTINGS_VERSION = 1;
var BUFFER_SIZE = 256;
var SAMPLE_RATE = 44100;
var MAX_THICKNESS_BUFFER_SIZE = Math.round(30 * 60 * SAMPLE_RATE / BUFFER_SIZE); // 30 minutes worth of results
var PIXELS_PER_SECOND = 60;
var FRAME_RATE = 60;
var PIXELS_PER_FRAME = PIXELS_PER_SECOND / FRAME_RATE;

var analyze_and_graph = function() {
    var analyzer = Meyda.createMeydaAnalyzer({
        audioContext: data.audioContext,
        source: data.source,
        sampleRate: SAMPLE_RATE,
        bufferSize: BUFFER_SIZE,
        featureExtractors: ['mfcc'],
        callback: function(features) {
            var peaks = 0;
            var mels = features.mfcc;
            var max_range = (RangeLimit / 100) * (mels.length - 1);
            for (var i = 1; i < max_range; ++i) {
                if ((mels[i] < IntensityThreshold) && (mels[i] < mels[i - 1]) && (mels[i] < mels[i + 1])) {
                    ++peaks;
                }
            }
            var thickness = Math.min(100, (100 * peaks) / (RangeLimit * NumBins / 300));
            on_thickness_calculated_for_buffer(thickness);
        },
    });
    analyzer.start();
    return analyzer;
}

var on_thickness_calculated_for_buffer = function(thickness) {
    window.thickness_buffer.push(thickness);

    var thickness_buffer = window.thickness_buffer;
    if (thickness_buffer.length > MAX_THICKNESS_BUFFER_SIZE) {
        thickness_buffer.splice(0, thickness_buffer.length - MAX_THICKNESS_BUFFER_SIZE);
    }
}

var last_y = 'black';
var drawThicknessGraph = function() {
    var thickness_buffer = window.thickness_buffer;

    // Scroll the image left
    const imageData = vocalWeightCtx.getImageData(1, 0, vocalWeightCanvas.width - 1, vocalWeightCanvas.height);
    vocalWeightCtx.putImageData(imageData, 0, 0);
    vocalWeightCtx.fillStyle = 'rgb(0,0,0)';
    vocalWeightCtx.fillRect(vocalWeightCanvas.width-1, 0, 1, vocalWeightCanvas.height); // Clear the rightmost pixel
    // Draw the new thickness on the right edge
    var thickness = thickness_buffer[thickness_buffer.length - 1];
    var color = thickness < SecondColorChangeThreshold ? (thickness < FirstColorChangeThreshold ? ThinColor : ThickColor) : VeryThickColor;
    var y = vocalWeightCanvas.height - 1 - (vocalWeightCanvas.height * thickness / 100);
    
    vocalWeightCtx.fillStyle = color;
    if(last_y<y){
        vocalWeightCtx.fillRect(vocalWeightCanvas.width - 1, last_y, 1, y-last_y); // Draw the new thickness on the right edge
    }else if(last_y>y){
        vocalWeightCtx.fillRect(vocalWeightCanvas.width - 1, y, 1, last_y-y); // Draw the new thickness on the right edge
    }else{
        vocalWeightCtx.fillRect(vocalWeightCanvas.width - 1, y, 1, 1); // Draw the new thickness on the right edge
    }
    //vocalWeightCtx.fillRect(vocalWeightCanvas.width - 1, y, 1, y-last_y+1); // Draw the new thickness on the right edge
    last_y = y;
}

var startThicknessAnalysis = function() {
    window.thickness_buffer = [];
    Meyda.numberOfMFCCCoefficients = NumBins;
    window.analyzer = analyze_and_graph();
    // drawThicknessGraph is already run in script2.js along with all the other draw functions
    //setInterval(drawThicknessGraph, 1000 / FRAME_RATE);
}

// Defaults
var NumBins = 100;
var IntensityThreshold = -4;
var FirstColorChangeThreshold = 16.5;
var SecondColorChangeThreshold = 27.5;
var RangeLimit = 100;
var ThinColor = 'green';
var ThickColor = 'red';
var VeryThickColor = 'blue';
