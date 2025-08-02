
// CalX Enhanced Script with Theme, History, Voice, Memory, and PWA Support
const display = document.getElementById('display');
const preview = document.getElementById('preview');
const historyList = document.getElementById('historyList');
const themeBtn = document.getElementById('toggleTheme');
const buttonsContainer = document.getElementById('buttons');
const micBtn = document.getElementById('voiceBtn');
const clearHistBtn = document.getElementById('clearHistoryBtn');
const saveMemBtn = document.getElementById('saveMemoryBtn');
const loadMemBtn = document.getElementById('loadMemoryBtn');

let themes = ['dark', 'neon', 'rainbow'];
let currentThemeIndex = localStorage.getItem('themeIndex') ? parseInt(localStorage.getItem('themeIndex')) : 0;
document.body.className = themes[currentThemeIndex];

const buttons = ['7','8','9','/','C','4','5','6','*','⌫','1','2','3','-','±','0','.','=','+','%'];

buttons.forEach(label => {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.onclick = () => handleButton(label);
  buttonsContainer.appendChild(btn);
});

function handleButton(val) {
  if (val === 'C') return clearDisplay();
  if (val === '⌫') return backspace();
  if (val === '=') return calculate();
  if (val === '±') return toggleSign();

  if (display.innerText === '0') display.innerText = val;
  else display.innerText += val;

  livePreview();
}

function clearDisplay() {
  display.innerText = '0';
  preview.innerText = '= 0';
}

function backspace() {
  let txt = display.innerText;
  display.innerText = txt.length > 1 ? txt.slice(0, -1) : '0';
  livePreview();
}

function toggleSign() {
  if (display.innerText.startsWith('-')) {
    display.innerText = display.innerText.slice(1);
  } else {
    display.innerText = '-' + display.innerText;
  }
  livePreview();
}

function calculate() {
  try {
    const result = eval(display.innerText);
    display.innerText = result;
    preview.innerText = '= ' + result;
    addToHistory(result);
  } catch {
    preview.innerText = '= Error';
  }
}

function livePreview() {
  try {
    const result = eval(display.innerText);
    preview.innerText = '= ' + result;
  } catch {
    preview.innerText = '= ?';
  }
}

function addToHistory(result) {
  const li = document.createElement('li');
  li.textContent = display.innerText + ' = ' + result;
  li.onclick = () => (display.innerText = li.textContent.split(' = ')[0]);
  historyList.prepend(li);
  saveHistory();
}

function saveHistory() {
  const list = Array.from(historyList.children).map(li => li.textContent);
  localStorage.setItem('calc-history', JSON.stringify(list));
}

function loadHistory() {
  const list = JSON.parse(localStorage.getItem('calc-history') || '[]');
  historyList.innerHTML = '';
  list.forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    li.onclick = () => (display.innerText = li.textContent.split(' = ')[0]);
    historyList.appendChild(li);
  });
}

function clearHistory() {
  historyList.innerHTML = '';
  localStorage.removeItem('calc-history');
}

function saveMemory() {
  localStorage.setItem('calc-memory', display.innerText);
}

function loadMemory() {
  const val = localStorage.getItem('calc-memory') || '0';
  display.innerText = val;
  livePreview();
}

// 🌈 Theme Toggle
themeBtn.onclick = () => {
  currentThemeIndex = ++currentThemeIndex % themes.length;
  localStorage.setItem('themeIndex', currentThemeIndex);
  document.body.className = themes[currentThemeIndex];
};

// 🎙️ Voice Input
function startVoiceInput() {
  try {
    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    rec.lang = 'en-US';
    rec.start();
    rec.onresult = e => {
      display.innerText = e.results[0][0].transcript.replace('x', '*').replace('divided by', '/');
      livePreview();
    };
  } catch (err) {
    alert("Voice recognition not supported on this browser.");
  }
}

// 🔊 Assign control buttons
micBtn.onclick = startVoiceInput;
clearHistBtn.onclick = clearHistory;
saveMemBtn.onclick = saveMemory;
loadMemBtn.onclick = loadMemory;

// ⌨️ Shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') calculate();
  if (e.key === 'Backspace') backspace();
  if (e.key === 'Escape') clearDisplay();
  if (e.ctrlKey && e.key === 'c') navigator.clipboard.writeText(display.innerText);
});

// 📦 Load History on Startup
window.onload = loadHistory;

// 🛜 Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        console.log('✅ Service Worker registered:', reg.scope);
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New content available; please refresh.');
            }
          });
        });
      })
      .catch(err => console.error('SW registration failed:', err));
  });
}
