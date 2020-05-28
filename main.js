const canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    canvas2 = document.createElement('canvas'),
    ctx2 = canvas2.getContext('2d'),
    strokes = [],
    zThreshold = 0.7,
    lineMaxWidth = 32,
    lineMinWidth = 8,
    lineAvgWidth = (lineMinWidth + lineMaxWidth) / 2,
    lineWidthA = (lineMinWidth - lineMaxWidth) / (zThreshold ** 2),
    lineWidthC = lineMaxWidth;

let lastZ = 1,
    curveCoefficient = lineAvgWidth / 2,
    curveExponent = 1;

const ws = new WebSocket('ws://192.168.1.17:8000');

function renderStrokes() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    ctx2.lineCap = 'round';
    ctx2.strokeStyle = 'black';

    for (const s of strokes) {
        if (s.length < 2) continue;

        for (let i = 0; i < s.length - 1; i++) {
            ctx2.beginPath();
            ctx2.moveTo(s[i][0] * canvas2.width, (1 - s[i][1]) * canvas2.height);
            ctx2.lineTo(s[i + 1][0] * canvas2.width, (1 - s[i + 1][1]) * canvas2.height);
            ctx2.lineWidth = s[i][2];
            ctx2.stroke();
            ctx2.closePath();
        }
    }
}

ws.onmessage = e => {
    let { x, y, z } = JSON.parse(e.data);

    if (z < zThreshold) {
        if (lastZ >= zThreshold) {
            strokes.push([]);
        }

        const thickness = lineWidthA * z ** 2 + lineWidthC;
        strokes[strokes.length - 1].push([x, y, thickness]);
        renderStrokes();
    }

    lastZ = z;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas2, 0, 0);

    ctx.beginPath();
    ctx.arc(x * canvas.width, (1 - y) * canvas.height, lineAvgWidth / 2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    const radius = curveCoefficient * z ** curveExponent;
    ctx.arc(x * canvas.width, (1 - y) * canvas.height, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
};

function resize() {
    canvas.width = canvas2.width = window.innerWidth;
    canvas.height = canvas2.height = window.innerHeight;
    curveCoefficient = Math.max(canvas.width, canvas.height);
    curveExponent = Math.log((lineAvgWidth / 2) / curveCoefficient) / Math.log(zThreshold);
    renderStrokes();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas2, 0, 0);
}

window.addEventListener('resize', resize, false);
resize();
