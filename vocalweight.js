// 3/15/2025 - 11:53 PM CST
// copied and modified from https://27or27.github.io/tm/thickness_meter.htm

var vocalWeightCanvas = document.getElementById("vocalweightmeter");
const vocalWeightCtx = vocalWeightCanvas.getContext("2d");

var SETTINGS_VERSION = 1;
var BUFFER_SIZE = 256;
var SAMPLE_RATE = 44100;
var MAX_THICKNESS_BUFFER_SIZE = Math.round(30 * 60 * SAMPLE_RATE / BUFFER_SIZE); // 30 minutes worth of results

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

    drawThicknessGraph();
}

var drawThicknessGraph = function() {
    var thickness_buffer = window.thickness_buffer;

    vocalWeightCtx.fillStyle = '#000';
    vocalWeightCtx.fillRect(0, 0, vocalWeightCanvas.width, vocalWeightCanvas.height);

    var last_color = null;
    var x_offset = Math.max(thickness_buffer.length - vocalWeightCanvas.width, 0);
    for (var i = x_offset; i < thickness_buffer.length; ++i) {
        var thickness = thickness_buffer[i];
        var color = thickness < SecondColorChangeThreshold ? (thickness < FirstColorChangeThreshold ? ThinColor : ThickColor) : VeryThickColor;
        var y = vocalWeightCanvas.height - 1 - (vocalWeightCanvas.height * thickness / 100);

        if (color != last_color) {
            if (last_color) {
                vocalWeightCtx.stroke();
            }
            vocalWeightCtx.beginPath();
            vocalWeightCtx.strokeStyle = color;
            vocalWeightCtx.moveTo(i - x_offset, y);
        } else {
            vocalWeightCtx.lineTo(i - x_offset, y);
        }

        last_color = color;
    }

    if (last_color) {
        vocalWeightCtx.stroke();
    }
}

var startThicknessAnalysis = function() {
    window.thickness_buffer = [];
    Meyda.numberOfMFCCCoefficients = NumBins;
    window.analyzer = analyze_and_graph();
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
