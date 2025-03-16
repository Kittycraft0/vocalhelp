// 3/16/2025

var amplitudecanvas=document.getElementById("soundlevelmeter");
const amplitudectx=amplitudecanvas.getContext("2d");

function visualizeVolume() {
    // Retrieve time-domain data
    data.analyser.getFloatTimeDomainData(data.dataArray);

    // Calculate RMS (Root Mean Square)
    let sumSquares = 0;
    for (let i = 0; i < data.dataArray.length; i++) {
        sumSquares += data.dataArray[i] * data.dataArray[i];
    }
    const rms = Math.sqrt(sumSquares / data.dataArray.length);
    // Convert RMS to decibels (dB)
    const dB = 20 * Math.log10(rms);


    
    // Retrieve time-domain data
    data.analysersmooth.getFloatTimeDomainData(data.dataArraysmooth);
    // Calculate RMS (Root Mean Square)
    let sumSquaressmooth = 0;
    for (let i = 0; i < data.dataArraysmooth.length; i++) {
        sumSquaressmooth += data.dataArraysmooth[i] * data.dataArraysmooth[i];
    }
    const rmssmooth = Math.sqrt(sumSquaressmooth / data.dataArraysmooth.length);
    // Convert RMS to decibels (dB)
    const dBsmooth = 20 * Math.log10(rmssmooth);

    
    // Clear the canvas
    amplitudectx.clearRect(0, 0, amplitudecanvas.width, amplitudecanvas.height);

    // Map dB to canvas height
    const minDB = -80; // Adjust based on noise floor
    const maxDB = 0;   // 0 dB is the max reference level

    const barHeight = ((dB - minDB) / (maxDB - minDB)) * (amplitudecanvas.height-50);
    
    const barHeightsmooth = ((dBsmooth - minDB) / (maxDB - minDB)) * (amplitudecanvas.height-50);
    
    
    // Draw faded background
    //-7.8, -20
    amplitudectx.fillStyle = 'rgb(0,96,0)';
    amplitudectx.fillRect(50, 25, amplitudecanvas.width-50, 80/80*(amplitudecanvas.height-50));
    amplitudectx.fillStyle = 'rgb(128,96,0)';
    amplitudectx.fillRect(50, 25, amplitudecanvas.width-50, 20/80*(amplitudecanvas.height-50));
    amplitudectx.fillStyle = 'rgb(128,0,0)';
    amplitudectx.fillRect(50, 25, amplitudecanvas.width-50, 7.8/80*(amplitudecanvas.height-50));
    

    // Draw the volume bar
    amplitudectx.fillStyle = 'lime';
    amplitudectx.fillRect(50, amplitudecanvas.height - barHeight-25, amplitudecanvas.width - 50, barHeight);
    
    // Draw the thingy
    amplitudectx.fillStyle = 'black';
    amplitudectx.fillRect(50, amplitudecanvas.height - barHeightsmooth-25, amplitudecanvas.width - 50, 5);
    //console.log(dBsmooth);

    // Draw the axis
    amplitudectx.strokeStyle = 'black';
    amplitudectx.lineWidth = 2;
    amplitudectx.beginPath();
    amplitudectx.moveTo(50, 25);
    amplitudectx.lineTo(50, amplitudecanvas.height-25);
    amplitudectx.stroke();

    // Draw labels
    amplitudectx.fillStyle = 'black';
    amplitudectx.font = '12px Arial';
    for (let d = minDB; d <= maxDB; d += 20) {
        const y = amplitudecanvas.height - ((d - minDB) / (maxDB - minDB)) * (amplitudecanvas.height-50)-25;
        amplitudectx.fillText(`${d} dB`, 5, y + 4); // Position labels slightly offset for readability
        amplitudectx.beginPath();
        amplitudectx.moveTo(45, y);
        amplitudectx.lineTo(50, y);
        amplitudectx.stroke();
    }
}




// Main loop to update the volume visualization
function updateVolumeMeter() {
    //data.analyser.getByteTimeDomainData(data.timeDomainDataArray);
    data.analyser.getFloatTimeDomainData(data.timeDomainDataArray);

    visualizeVolume(data.calculateVolume(data.timeDomainDataArray));
    //requestAnimationFrame(updateVolumeMeter); // Repeat the process
}