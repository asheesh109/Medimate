const EMOJIS = [
  {key: 'very_happy', emoji: '😄', label: 'Very Happy'},
  {key: 'happy', emoji: '😊', label: 'Happy'},
  {key: 'calm', emoji: '😌', label: 'Calm'},
  {key: 'neutral', emoji: '😐', label: 'Neutral'},
  {key: 'sad', emoji: '😢', label: 'Sad'},
  {key: 'anxious', emoji: '😨', label: 'Anxious'}
];

const QUOTES = [
  {text: "You are allowed to be both a masterpiece and a work in progress.", author: "Anonymous"},
  {text: "Small steps every day lead to great journeys.", author: "Medimate"},
  {text: "This too shall pass.", author: "Proverb"},
  {text: "Feelings are visitors. Let them come and go.", author: "M. Rosen"},
  {text: "Breathe. You're doing the best you can.", author: "Anonymous"},
  {text: "The present moment is the only time we truly have.", author: "Thich Nhat Hanh"},
  {text: "Kindness to yourself is an act of strength.", author: "Medimate"},
  {text: "Progress, not perfection.", author: "Anonymous"},
  {text: "You are enough, just as you are.", author: "Anonymous"},
  {text: "Rest is productive.", author: "Anonymous"}
];

// Theme
let currentTheme = 'light';
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  currentTheme = theme;
  chrome.storage.local.set({ theme: theme });
}

// Mood section
const emojiRow = document.getElementById('emoji-row');
let selectedMood = null;
EMOJIS.forEach(e => {
  const btn = document.createElement('div');
  btn.className = 'emoji';
  btn.dataset.key = e.key;
  btn.title = e.label;
  btn.textContent = e.emoji;
  btn.addEventListener('click', () => {
    document.querySelectorAll('.emoji').forEach(x => x.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = e.key;
  });
  emojiRow.appendChild(btn);
});

document.getElementById('save-mood').addEventListener('click', () => {
  if (!selectedMood) {
    alert('Please select a mood first.');
    return;
  }
  const note = document.getElementById('mood-note').value.trim();
  const entry = { when: new Date().toISOString(), mood: selectedMood, note };
  chrome.storage.local.get(['moodLog'], (res) => {
    const arr = res.moodLog || [];
    arr.unshift(entry);
    const trimmed = arr.slice(0, 365); // Keep last year
    chrome.storage.local.set({ moodLog: trimmed }, () => {
      document.getElementById('mood-note').value = '';
      document.querySelectorAll('.emoji').forEach(x => x.classList.remove('selected'));
      selectedMood = null;
      renderRecentMood();
      updateStreak();
    });
  });
});

function renderRecentMood() {
  chrome.storage.local.get(['moodLog'], (res) => {
    const arr = res.moodLog || [];
    const recent = arr[0];
    const el = document.getElementById('recent-mood');
    if (recent) {
      const emo = EMOJIS.find(e => e.key === recent.mood)?.emoji || '🙂';
      const when = new Date(recent.when).toLocaleString([], { hour: 'numeric', minute: '2-digit', day: 'numeric' });
      el.innerHTML = `<strong>${emo}</strong> ${when}<br>${recent.note || ''}`;
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  });
}

function updateStreak() {
  chrome.storage.local.get(['moodLog'], (res) => {
    const log = res.moodLog || [];
    if (log.length === 0) {
      document.getElementById('mood-streak').textContent = '';
      return;
    }
    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0); // Start of today
    while (true) {
      const dayStr = current.toDateString();
      const hasEntry = log.some(entry => new Date(entry.when).toDateString() === dayStr);
      if (!hasEntry) break;
      streak++;
      current.setDate(current.getDate() - 1);
    }
    const streakEl = document.getElementById('mood-streak');
    streakEl.textContent = streak > 0 ? `Streak: ${streak} day${streak > 1 ? 's' : ''}` : '';
  });
}

// Gratitude section
const gratitudeItemsEl = document.getElementById('gratitude-items');
let gratitudeItems = ['', '', ''];

function renderGratitudeInputs() {
  gratitudeItemsEl.innerHTML = gratitudeItems.map((item, idx) => `
    <div class="gratitude-item">
      <input type="text" placeholder="${idx + 1}. What are you grateful for?" value="${item}" data-index="${idx}" />
      <button class="remove-btn" data-index="${idx}">Remove</button>
    </div>
  `).join('');

  // Attach input listeners
  const inputs = gratitudeItemsEl.querySelectorAll('input');
  inputs.forEach((input, idx) => {
    input.addEventListener('input', (e) => {
      gratitudeItems[idx] = e.target.value;
    });
  });

  // Attach remove listeners
  const removeBtns = gratitudeItemsEl.querySelectorAll('.remove-btn');
  removeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index);
      removeGratitudeItem(idx);
    });
  });
}

function removeGratitudeItem(idx) {
  gratitudeItems[idx] = '';
  renderGratitudeInputs();
}

document.getElementById('save-gratitude').addEventListener('click', () => {
  const items = gratitudeItems.filter(item => item.trim()).map(item => item.trim());
  if (items.length === 0) {
    alert('Please add at least one gratitude item.');
    return;
  }
  const entry = { when: new Date().toISOString(), items };
  chrome.storage.local.get(['gratitudeLog'], (res) => {
    const arr = res.gratitudeLog || [];
    arr.unshift(entry);
    const trimmed = arr.slice(0, 365);
    chrome.storage.local.set({ gratitudeLog: trimmed }, () => {
      gratitudeItems = ['', '', ''];
      renderGratitudeInputs();
      renderRecentGratitude();
    });
  });
});

function renderRecentGratitude() {
  chrome.storage.local.get(['gratitudeLog'], (res) => {
    const arr = res.gratitudeLog || [];
    const recent = arr[0];
    const el = document.getElementById('recent-gratitude');
    if (recent) {
      const itemsStr = recent.items.join(' • ');
      const when = new Date(recent.when).toLocaleString([], { hour: 'numeric', minute: '2-digit', day: 'numeric' });
      el.innerHTML = `<strong>🙏</strong> ${when}<br>${itemsStr}`;
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  });
}

// Quotes
function showQuote(idx = null) {
  const q = idx !== null ? QUOTES[idx] : QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.getElementById('quote-text').textContent = `"${q.text}"`;
  document.getElementById('quote-author').textContent = q.author ? `— ${q.author}` : '';
}

document.getElementById('new-quote').addEventListener('click', () => showQuote());

// Breathing
let breathTimer = null;
let breathStep = 0;
let breathSequence = [];
const circle = document.getElementById('breath-circle');
const textEl = document.getElementById('breath-text');
const startBtn = document.getElementById('start-breath');
const stopBtn = document.getElementById('stop-breath');
const visualEl = document.getElementById('breath-visual');

function makeSequence(type) {
  if (type === 'box') {
    return [{label: 'Inhale', seconds: 4}, {label: 'Hold', seconds: 4}, {label: 'Exhale', seconds: 4}, {label: 'Hold', seconds: 4}];
  } else if (type === '478') {
    return [{label: 'Inhale', seconds: 4}, {label: 'Hold', seconds: 7}, {label: 'Exhale', seconds: 8}];
  } else { // diaphragmatic
    return [{label: 'Inhale deeply', seconds: 6}, {label: 'Exhale slowly', seconds: 6}];
  }
}

function startBreath() {
  const type = document.getElementById('breath-type').value;
  breathSequence = makeSequence(type);
  breathStep = 0;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  visualEl.style.display = 'flex';
  runBreathStep();
}

function stopBreath() {
  if (breathTimer) clearTimeout(breathTimer);
  breathTimer = null;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  visualEl.style.display = 'none';
  circle.style.transform = 'scale(1)';
  textEl.textContent = '';
}

function runBreathStep() {
  if (breathSequence.length === 0) return;
  const step = breathSequence[breathStep % breathSequence.length];
  textEl.textContent = `${step.label} (${step.seconds}s)`;
  const scale = step.label.toLowerCase().includes('inhale') ? 1.2 : step.label.toLowerCase().includes('exhale') ? 0.8 : 1;
  circle.style.transform = `scale(${scale})`;
  breathTimer = setTimeout(() => {
    breathStep++;
    runBreathStep();
  }, step.seconds * 1000);
}

startBtn.addEventListener('click', startBreath);
stopBtn.addEventListener('click', stopBreath);

// Settings section
const enableBreakP = document.getElementById('enable-break');
const breakMinutesP = document.getElementById('break-minutes');
const breakMessageP = document.getElementById('break-message');
const enableBedtimeP = document.getElementById('enable-bedtime');
const bedtimeTimeP = document.getElementById('bedtime-time');
const bedtimeMessageP = document.getElementById('bedtime-message');
const enableGratitudeP = document.getElementById('enable-gratitude');
const gratitudeTimeP = document.getElementById('gratitude-time');
const gratitudeMessageP = document.getElementById('gratitude-message');
const darkModePopupEl = document.getElementById('dark-mode-popup');
const saveSettingsBtn = document.getElementById('save-settings');

function loadReminderConfigs() {
  chrome.storage.local.get(['breakConfig', 'bedtimeConfig', 'gratitudeConfig'], (res) => {
    // Break
    const breakConf = res.breakConfig || {enabled: true, minutes: 60, message: 'Stretch, hydrate, breathe — 5 minutes!'};
    enableBreakP.checked = breakConf.enabled;
    breakMinutesP.value = breakConf.minutes || 60;
    breakMessageP.value = breakConf.message || '';

    // Bedtime
    const bedtimeConf = res.bedtimeConfig || {enabled: false, time: '22:00', message: 'Time to wind down. Prioritize rest tonight.'};
    enableBedtimeP.checked = bedtimeConf.enabled;
    bedtimeTimeP.value = bedtimeConf.time || '22:00';
    bedtimeMessageP.value = bedtimeConf.message || '';

    // Gratitude
    const gratitudeConf = res.gratitudeConfig || {enabled: false, time: '20:00', message: 'Evening gratitude: What are 3 things you\'re thankful for today?'};
    enableGratitudeP.checked = gratitudeConf.enabled;
    gratitudeTimeP.value = gratitudeConf.time || '20:00';
    gratitudeMessageP.value = gratitudeConf.message || '';
  });
}

saveSettingsBtn.addEventListener('click', () => {
  const configs = {
    breakConfig: {
      enabled: enableBreakP.checked,
      minutes: Math.max(10, Math.min(240, Number(breakMinutesP.value) || 60)),
      message: breakMessageP.value.trim() || 'Stretch, hydrate, breathe — 5 minutes!'
    },
    bedtimeConfig: {
      enabled: enableBedtimeP.checked,
      time: bedtimeTimeP.value || '22:00',
      message: bedtimeMessageP.value.trim() || 'Time to wind down. Prioritize rest tonight.'
    },
    gratitudeConfig: {
      enabled: enableGratitudeP.checked,
      time: gratitudeTimeP.value || '20:00',
      message: gratitudeMessageP.value.trim() || 'Evening gratitude: What are 3 things you\'re thankful for today?'
    }
  };
  chrome.storage.local.set(configs, () => {
    // Background auto-reschedules via onChanged
  });
});

// Dark mode toggle in popup
darkModePopupEl.addEventListener('change', (e) => {
  applyTheme(e.target.checked ? 'dark' : 'light');
});

// Open options
document.getElementById('open-options').addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options/options.html'));
  }
  window.close();
});

// Init
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['theme'], (res) => {
    applyTheme(res.theme || 'light');
    darkModePopupEl.checked = currentTheme === 'dark';
  });
  renderGratitudeInputs();
  renderRecentMood();
  renderRecentGratitude();
  updateStreak();
  showQuote();
  loadReminderConfigs();
});