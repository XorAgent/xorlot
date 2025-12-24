const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const namesInput = document.getElementById('names-input');
const updateBtn = document.getElementById('update-btn');
const clearBtn = document.getElementById('clear-btn');
const participantCount = document.getElementById('participant-count');
const modal = document.getElementById('winner-modal');
const modalWinnerName = document.getElementById('modal-winner-name');
const closeModal = document.getElementById('close-modal');

// High-end palette: Alternating Red and Black
const palette = [
    '#ef4444', // Red
    '#111111'  // Black
];

let names = ["XorTest", "XorTest 1", "XorTest 2", "XorTest 3", "XorTest 4", "XorTest 5"];
let colors = [];
let isSpinning = false;
let startAngle = 0;
let arc = Math.PI / (names.length / 2);
let spinTimeout = null;

function init() {
    namesInput.value = names.join('\n');
    updateNames();
}

function updateNames() {
    const rawText = namesInput.value.trim();
    const newNames = rawText ? rawText.split('\n').filter(n => n.trim() !== '') : [];

    names = newNames.length > 0 ? newNames : ["İSİM GİRİN"];
    arc = Math.PI / (names.length / 2);
    participantCount.innerText = newNames.length;

    // Alternating colors with 'Joker' color for odd counts
    colors = names.map((_, i) => {
        if (names.length > 1 && names.length % 2 !== 0 && i === names.length - 1) {
            return '#f59e0b'; // Joker Color: Deep Gold/Amber
        }
        return palette[i % 2];
    });
    drawWheel();
}

function drawWheel() {
    const size = canvas.width;
    const center = size / 2;
    const outsideRadius = center * 0.95;
    const textRadius = center * 0.75;
    const insideRadius = center * 0.2;

    ctx.clearRect(0, 0, size, size);

    // Outer shadow for the whole wheel
    ctx.shadowBlur = 40;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';

    for (let i = 0; i < names.length; i++) {
        const angle = startAngle + i * arc;
        const color = colors[i];

        // 1. Slice Gradient (3D Depth)
        const radGrad = ctx.createRadialGradient(center, center, insideRadius, center, center, outsideRadius);
        radGrad.addColorStop(0, color);
        radGrad.addColorStop(1, adjustColor(color, -40)); // Darker at edges

        ctx.fillStyle = radGrad;
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0; // Reset shadow for individual slices

        ctx.beginPath();
        ctx.arc(center, center, outsideRadius, angle, angle + arc, false);
        ctx.arc(center, center, insideRadius, angle + arc, angle, true);
        ctx.fill();
        ctx.stroke();

        // 2. Glossy Highlight (Top Overlay)
        ctx.save();
        const highlightGrad = ctx.createLinearGradient(center, center - outsideRadius, center, center + outsideRadius);
        highlightGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
        highlightGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
        highlightGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = highlightGrad;
        ctx.fill();
        ctx.restore();

        // 3. Text with subtle shadow
        ctx.save();
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        ctx.font = '800 16px Outfit';
        ctx.translate(center + Math.cos(angle + arc / 2) * textRadius,
            center + Math.sin(angle + arc / 2) * textRadius);
        ctx.rotate(angle + arc / 2 + Math.PI);

        const text = names[i].toUpperCase();
        let displayText = text.length > 15 ? text.substring(0, 15) + '..' : text;
        ctx.fillText(displayText, -ctx.measureText(displayText).width / 2, 5);
        ctx.restore();
    }

    // 4. Center Circle Bevel Effect
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, insideRadius + 5, 0, Math.PI * 2);
    const centerGrad = ctx.createLinearGradient(center - insideRadius, center - insideRadius, center + insideRadius, center + insideRadius);
    centerGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
    centerGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.strokeStyle = centerGrad;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
}

// Helper function to darken/lighten colors
function adjustColor(hex, amt) {
    let usePound = false;
    if (hex[0] == "#") {
        hex = hex.slice(1);
        usePound = true;
    }
    let num = parseInt(hex, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

function spin() {
    if (isSpinning) return;
    if (names[0] === "İSİM GİRİN") return;

    isSpinning = true;
    spinBtn.disabled = true;

    const spinAngleStart = Math.random() * 4 + 8; // Further reduced speed for more weight
    let spinTime = 0;
    const spinTimeTotal = Math.random() * 4000 + 10000; // 10 to 14 seconds of spin duration

    function rotate() {
        spinTime += 16.67; // Approx 60fps
        if (spinTime >= spinTimeTotal) {
            stopRotate();
            return;
        }
        const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
        startAngle += (spinAngle * Math.PI / 180);
        drawWheel();
        requestAnimationFrame(rotate);
    }

    requestAnimationFrame(rotate);
}

function stopRotate() {
    isSpinning = false;

    const degrees = startAngle * 180 / Math.PI + 90;
    const arcd = arc * 180 / Math.PI;
    const index = Math.floor((360 - degrees % 360) / arcd);

    // Wait 500ms after stopping for suspense
    setTimeout(() => {
        showWinner(names[index]);
    }, 500);
}

function easeOut(t, b, c, d) {
    return c * ((t = t / d - 1) * t * t * t * t + 1) + b; // Quintic Ease Out
}

function showWinner(name) {
    modalWinnerName.innerText = name.toUpperCase();
    modal.classList.add('active');
    triggerConfetti();
}

function triggerConfetti() {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 9999 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    // 1. Initial Mega Explosion
    confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.7 },
        colors: ['#ef4444', '#ffffff', '#111111', '#f59e0b'],
        shapes: ['square', 'circle', 'star'],
        scalar: 1.2,
        zIndex: 9999
    });

    // 2. Continuous Show
    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);

        // Left side
        confetti({
            ...defaults,
            particleCount,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.8 },
            colors: ['#ef4444', '#ffffff']
        });

        // Right side
        confetti({
            ...defaults,
            particleCount,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.8 },
            colors: ['#ef4444', '#ffffff']
        });

        // "Firework" bursts
        if (Math.random() > 0.6) {
            confetti({
                ...defaults,
                particleCount: 25,
                origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.1, 0.5) },
                colors: ['#f59e0b', '#ffffff'],
                shapes: ['star'],
                scalar: 0.8,
                gravity: 0.8
            });
        }
    }, 250);
}

// Listeners
spinBtn.addEventListener('click', spin);
updateBtn.addEventListener('click', updateNames);
clearBtn.addEventListener('click', () => {
    namesInput.value = '';
    updateNames();
});
closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
    spinBtn.disabled = false; // Re-enable spin only AFTER modal is closed
});

init();
