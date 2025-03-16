var specXaxisCanvas=document.getElementById("spectrogramxaxis");
const specXaxisctx=specXaxisCanvas.getContext("2d");

//specXaxiscanvas.width=spectrogramcanvas.width;
//specXaxisctx.scale(-1,1);
//specXaxisctx.translate(-specXaxisCanvas.width/2,0);
//specXaxisctx.translate(-specXaxiscanvas.width,0);
//specXaxisctx.fillStyle='rgb(0,0,0)';
//specXaxisctx.fillRect(-5,-5,specXaxiscanvas.width+10,specXaxiscanvas.height+10);
//specXaxisctx.fillStyle='rgb(255,0,0)';
//specXaxisctx.fillRect(-specXaxiscanvas.width/2,-specXaxiscanvas.height/2,specXaxiscanvas.width,specXaxiscanvas.height);

if(false){
    let n=1;
    setInterval(()=>{
        specXaxisctx.fillStyle=`rgb(0,${n*10},255)`;
        specXaxisctx.fillRect(n,n,n,n);
        n+=1;
    },1000/20);
    }
    //specXaxisctx.
    
indicatorcanvas();
function indicatorcanvas(){
// making the indicators
const startX = spectrogramCanvas.width; // Starting x-coordinate
const interval = 60; // Distance between numbers and indicators
const numberOfIndicators = Math.floor(specXaxisCanvas.width / interval);

specXaxisctx.font = '16px Arial'; // Set font style
specXaxisctx.textAlign = 'center'; // Center text horizontally
//specXaxisctx.textBaseline = 'middle'; // Center text vertically
specXaxisctx.textBaseline = 'top'; // Center text vertically


// do like the funny ruler thing idk
specXaxisctx.beginPath();
specXaxisctx.moveTo(0, 0); // Start point of the line
specXaxisctx.lineTo(spectrogramCanvas.width,0); // End point of the line
specXaxisctx.stroke();

for(let i=0;i<numberOfIndicators*50;i+=2){
    const x = startX - i/10 * interval;
    const y = 10;//specXaxiscanvas.height / 2; // Vertical position of the text

    // Draw the indicator (a vertical line)
    specXaxisctx.beginPath();
    specXaxisctx.moveTo(x, y - 10); // Start point of the line
    specXaxisctx.lineTo(x, y + 10*(i%10==0)); // End point of the line
    specXaxisctx.stroke();
}
for (let i = 0; i <= numberOfIndicators; i++) {
    const x = startX - i * interval;
    const y = 10;//specXaxiscanvas.height / 2; // Vertical position of the text

    // Draw the number
    specXaxisctx.fillText(i, x, y+15);

    // Draw the indicator (a vertical line)
    specXaxisctx.beginPath();
    specXaxisctx.moveTo(x, y - 10); // Start point of the line
    specXaxisctx.lineTo(x, y + 10); // End point of the line
    specXaxisctx.stroke();
}

// Draw the axis title
specXaxisctx.fillText("Time (s)", spectrogramCanvas.width/2, 50);

}
