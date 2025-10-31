// options.js
const THEMES = ['light', 'dark'];

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  chrome.storage.local.set({ 'theme': theme });
}

function loadTheme() {
  chrome.storage.local.get(['theme'], (res) => {
    const theme = res.theme || 'light';
    applyTheme(theme);
    document.getElementById('dark-mode').checked = theme === 'dark';
  });
}

// Break config
const enableBreakEl = document.getElementById('enable-break');
const breakMinutesEl = document.getElementById('break-minutes');
const breakMessageEl = document.getElementById('break-message');

// Bedtime config
const enableBedtimeEl = document.getElementById('enable-bedtime');
const bedtimeTimeEl = document.getElementById('bedtime-time');
const bedtimeMessageEl = document.getElementById('bedtime-message');

// Gratitude config
const enableGratitudeEl = document.getElementById('enable-gratitude');
const gratitudeTimeEl = document.getElementById('gratitude-time');
const gratitudeMessageEl = document.getElementById('gratitude-message');

// Dark mode
const darkModeEl = document.getElementById('dark-mode');

// Save button
const saveBtn = document.getElementById('save-all');

// History elements
const moodHistoryEl = document.getElementById('mood-history');
const gratitudeHistoryEl = document.getElementById('gratitude-history');

// Clear and export buttons
const clearMoodBtn = document.getElementById('clear-mood-logs');
const exportMoodBtn = document.getElementById('export-mood');
const clearGratitudeBtn = document.getElementById('clear-gratitude-logs');
const exportGratitudeBtn = document.getElementById('export-gratitude');
const downloadLink = document.getElementById('download-link');

// Load all configs
function loadConfigs() {
  chrome.storage.local.get([
    'breakConfig', 'bedtimeConfig', 'gratitudeConfig', 'theme'
  ], (res) => {
    // Break
    const breakConf = res.breakConfig || {enabled: false, minutes: 60, message: ''};
    enableBreakEl.checked = breakConf.enabled;
    breakMinutesEl.value = breakConf.minutes || 60;
    breakMessageEl.value = breakConf.message || '';

    // Bedtime
    const bedtimeConf = res.bedtimeConfig || {enabled: false, time: '22:00', message: ''};
    enableBedtimeEl.checked = bedtimeConf.enabled;
    bedtimeTimeEl.value = bedtimeConf.time || '22:00';
    bedtimeMessageEl.value = bedtimeConf.message || '';

    // Gratitude
    const gratitudeConf = res.gratitudeConfig || {enabled: false, time: '20:00', message: ''};
    enableGratitudeEl.checked = gratitudeConf.enabled;
    gratitudeTimeEl.value = gratitudeConf.time || '20:00';
    gratitudeMessageEl.value = gratitudeConf.message || '';
  });
}

// Save all
saveBtn.addEventListener('click', () => {
  const configs = {
    breakConfig: {
      enabled: enableBreakEl.checked,
      minutes: Math.max(10, Math.min(240, Number(breakMinutesEl.value) || 60)),
      message: breakMessageEl.value.trim() || 'Stretch, hydrate, breathe — 5 minutes!'
    },
    bedtimeConfig: {
      enabled: enableBedtimeEl.checked,
      time: bedtimeTimeEl.value || '22:00',
      message: bedtimeMessageEl.value.trim() || 'Time to wind down. Prioritize rest tonight.'
    },
    gratitudeConfig: {
      enabled: enableGratitudeEl.checked,
      time: gratitudeTimeEl.value || '20:00',
      message: gratitudeMessageEl.value.trim() || 'Evening gratitude: What are 3 things you\'re thankful for today?'
    }
  };
  chrome.storage.local.set(configs, () => {
    alert('Settings saved successfully.');
  });
});

// Dark mode toggle
darkModeEl.addEventListener('change', (e) => {
  applyTheme(e.target.checked ? 'dark' : 'light');
});

// Load mood history
function loadMoodHistory() {
  chrome.storage.local.get(['moodLog'], (res) => {
    const log = res.moodLog || [];
    const recent = log.slice(0, 10).reverse(); // Show last 10, oldest first
    moodHistoryEl.innerHTML = recent.length ? recent.map(entry => `
      <div class="mood-entry">
        <span class="mood-emoji">${getEmojiForMood(entry.mood)}</span>
        <div class="mood-date">${new Date(entry.when).toLocaleDateString()}</div>
        <div class="mood-note">${entry.note || 'No note'}</div>
      </div>
    `).join('') : '<p style="color: var(--muted);">No mood entries yet.</p>';
  });
}

// Load gratitude history
function loadGratitudeHistory() {
  chrome.storage.local.get(['gratitudeLog'], (res) => {
    const log = res.gratitudeLog || [];
    const recent = log.slice(0, 10).reverse();
    gratitudeHistoryEl.innerHTML = recent.length ? recent.map(entry => `
      <div class="mood-entry">
        <span class="mood-emoji">🙏</span>
        <div class="mood-date">${new Date(entry.when).toLocaleDateString()}</div>
        <div class="mood-note">${entry.items.join(', ') || 'No items'}</div>
      </div>
    `).join('') : '<p style="color: var(--muted);">No gratitude entries yet.</p>';
  });
}

// Clear mood logs
clearMoodBtn.addEventListener('click', () => {
  if (confirm('Clear all mood logs? This cannot be undone.')) {
    chrome.storage.local.set({moodLog: []}, () => {
      loadMoodHistory();
      alert('Mood logs cleared.');
    });
  }
});

// Export mood
exportMoodBtn.addEventListener('click', () => {
  chrome.storage.local.get(['moodLog'], (res) => {
    const data = res.moodLog || [];
    downloadData(data, 'medimate-moodlog.json');
  });
});

// Clear gratitude logs
clearGratitudeBtn.addEventListener('click', () => {
  if (confirm('Clear all gratitude logs? This cannot be undone.')) {
    chrome.storage.local.set({gratitudeLog: []}, () => {
      loadGratitudeHistory();
      alert('Gratitude logs cleared.');
    });
  }
});

// Export gratitude
exportGratitudeBtn.addEventListener('click', () => {
  chrome.storage.local.get(['gratitudeLog'], (res) => {
    const data = res.gratitudeLog || [];
    downloadData(data, 'medimate-gratitudelog.json');
  });
});

// Helper to download
function downloadData(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  downloadLink.href = url;
  downloadLink.download = filename;
  downloadLink.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Load resources
function loadResources() {
  chrome.storage.local.get(['resources'], (res) => {
    const resources = res.resources?.hotlines || [];
    const list = document.getElementById('resources-list');
    list.innerHTML = resources.map(r => `
      <li>
        <strong>${r.title}</strong><br>
        <span style="color: var(--muted);">${r.number}</span><br>
        <a href="${r.url}" class="resource-link" target="_blank">Get Help</a>
      </li>
    `).join('');
  });
}

// Emoji mapper
function getEmojiForMood(key) {
  const map = {
    very_happy: '😄',
    happy: '😊',
    calm: '😌',
    neutral: '😐',
    sad: '😢',
    anxious: '😨'
  };
  return map[key] || '🙂';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadConfigs();
  loadTheme();
  loadMoodHistory();
  loadGratitudeHistory();
  loadResources();
});