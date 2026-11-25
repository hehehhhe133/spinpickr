document.getElementById('year').textContent = new Date().getFullYear();
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const modal = document.getElementById('resultModal');
const winnerText = document.getElementById('winnerText');
const input = document.getElementById('optionsInput');

let options = (window.PRESET||['Yes','No','Maybe']).slice(0,15);
input.value = options.join('\n');

const colors = ['#ff5a8a', '#5bc0de', '#5cb85c', '#f0ad4e', '#c9a227', '#9b59b6', '#e74c3c', '#1abc9c'];
let currentAngle = 0;
let isSpinning = false;

/* ---------- Sound (Web Audio, no files needed) ---------- */
let soundOn = true;
try { soundOn = localStorage.getItem('spinpickr-sound') !== 'off'; } catch (e) {}
let audioCtx = null;
let lastTick = 0;

function getAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function beep(freq, dur, type, vol, delay) {
  const ac = getAudio();
  if (!ac || !soundOn) return;
  const t = ac.currentTime + (delay || 0);
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function playTick() {
  const now = performance.now();
  if (now - lastTick < 40) return;
  lastTick = now;
  beep(1100, 0.04, 'square', 0.04);
}

function playDing() {
  beep(784, 0.35, 'sine', 0.18, 0);
  beep(1047, 0.5, 'sine', 0.18, 0.12);
}

/* Mute button (added by script, so no HTML changes are needed) */
const soundBtn = document.createElement('button');
soundBtn.type = 'button';
soundBtn.className = 'sound-btn';
function updateSoundBtn() {
  soundBtn.textContent = soundOn ? '\uD83D\uDD0A' : '\uD83D\uDD07';
  soundBtn.setAttribute('aria-label', soundOn ? 'Mute sound' : 'Turn sound on');
  soundBtn.title = soundOn ? 'Sound on' : 'Sound off';
}
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  try { localStorage.setItem('spinpickr-sound', soundOn ? 'on' : 'off'); } catch (e) {}
  updateSoundBtn();
  if (soundOn) { getAudio(); beep(900, 0.08, 'sine', 0.1); }
});
updateSoundBtn();
const soundHost = canvas.closest('.card') || canvas.parentElement;
soundHost.appendChild(soundBtn);

/* Tick whenever a slice edge passes the pointer */
function currentRotation() {
  const tr = getComputedStyle(canvas).transform;
  if (!tr || tr === 'none') return 0;
  const m = tr.match(/matrix\(([^)]+)\)/);
  if (!m) return 0;
  const v = m[1].split(',').map(parseFloat);
  let deg = Math.atan2(v[1], v[0]) * 180 / Math.PI;
  return (deg + 360) % 360;
}

function sliceUnderPointer() {
  const arc = 360 / options.length;
  const pointerAngle = (360 - currentRotation() + 270) % 360;
  return Math.floor(pointerAngle / arc);
}

function watchTicks() {
  let last = sliceUnderPointer();
  function frame() {
    if (!isSpinning) return;
    const now = sliceUnderPointer();
    if (now !== last) { playTick(); last = now; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function drawWheel() {
  const numOptions = options.length;
  const arcSize = (2 * Math.PI) / numOptions;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < numOptions; i++) {
    const startAngle = i * arcSize;
    const endAngle = startAngle + arcSize;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + (arcSize / 2));
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    let text = options[i];
    if(text.length > 15) text = text.substring(0, 12) + '...';
    
    ctx.fillText(text, radius - 40, 10);
    ctx.restore();
  }
}

input.addEventListener('input', () => {
  let val = input.value.trim();
  if(!val) return;
  let arr = val.split('\n').map(s => s.trim()).filter(s => s !== '');
  
  if(arr.length < 2) {
    arr = arr.length === 1 ? [arr[0], 'Other'] : ['Yes', 'No'];
  } else if(arr.length > 15) {
    arr = arr.slice(0, 15);
  }
  options = arr;
  drawWheel();
});

spinBtn.addEventListener('click', () => {
  if (isSpinning || options.length < 2) return;
  isSpinning = true;
  getAudio();
  watchTicks();
  
  const randomSpin = Math.floor(Math.random() * 3) + 5; 
  const targetAngle = currentAngle + (randomSpin * 360) + Math.floor(Math.random() * 360);
  
  canvas.style.transform = `rotate(${targetAngle}deg)`;
  currentAngle = targetAngle;

  setTimeout(() => {
    isSpinning = false;
    const normalizedAngle = targetAngle % 360;
    const arcSizeDegrees = 360 / options.length;
    let pointerAngle = (360 - normalizedAngle + 270) % 360;
    let winningIndex = Math.floor(pointerAngle / arcSizeDegrees);
    
    if(winningIndex >= options.length) winningIndex = 0;
    
    showWinner(options[winningIndex]);
  }, 4000);
});

function showWinner(winner) {
  playDing();
  winnerText.textContent = winner;
  modal.classList.add('show');
}

function closeModal() {
  modal.classList.remove('show');
}

drawWheel();
