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
  winnerText.textContent = winner;
  modal.classList.add('show');
}

function closeModal() {
  modal.classList.remove('show');
}

drawWheel();
