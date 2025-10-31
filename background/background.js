console.log('Medimate service worker started');

// Listen for alarms to show notifications
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'medimate-break') {
    chrome.storage.local.get(['breakConfig'], (res) => {
      const conf = res.breakConfig || {enabled: true, message: 'Time for a short break! Take a breath.'};
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.svg',
        title: 'Medimate — Break Reminder',
        message: conf.message || 'Take a short break!',
        priority: 2
      });
    });
  } else if (alarm.name === 'medimate-bedtime') {
    chrome.storage.local.get(['bedtimeConfig'], (res) => {
      const conf = res.bedtimeConfig || {enabled: false, message: 'Time to wind down. Prioritize rest tonight.', time: '22:00'};
      if (conf.enabled) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.svg',
          title: 'Medimate — Bedtime Reminder',
          message: conf.message || 'Sweet dreams!',
          priority: 2
        });
        // Reschedule for next day
        const [hours, minutes] = conf.time.split(':').map(Number);
        const now = new Date();
        const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours, minutes);
        chrome.alarms.create('medimate-bedtime', { when: nextDay.getTime() });
        console.log('Rescheduled medimate-bedtime for next day at', conf.time);
      }
    });
  } else if (alarm.name === 'medimate-gratitude') {
    chrome.storage.local.get(['gratitudeConfig'], (res) => {
      const conf = res.gratitudeConfig || {enabled: false, message: 'Evening gratitude: What are 3 things you\'re thankful for today?', time: '20:00'};
      if (conf.enabled) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.svg',
          title: 'Medimate — Gratitude Prompt',
          message: conf.message || 'Reflect and be thankful.',
          priority: 2
        });
        // Reschedule for next day
        const [hours, minutes] = conf.time.split(':').map(Number);
        const now = new Date();
        const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours, minutes);
        chrome.alarms.create('medimate-gratitude', { when: nextDay.getTime() });
        console.log('Rescheduled medimate-gratitude for next day at', conf.time);
      }
    });
  }
});

// When extension installed, set defaults
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(null, (items) => {
    const defaults = {
      moodLog: [],
      gratitudeLog: [],
      breakConfig: {enabled: true, minutes: 60, message: 'Stretch, hydrate, breathe — 5 minutes!'},
      bedtimeConfig: {enabled: false, time: '22:00', message: 'Time to wind down. Prioritize rest tonight.'},
      gratitudeConfig: {enabled: false, time: '20:00', message: 'Evening gratitude: What are 3 things you\'re thankful for today?'},
      theme: 'light',
      resources: {
        hotlines: [
          {title: 'National Suicide Prevention Lifeline (US)', number: '988', url: 'https://988lifeline.org/'},
          {title: 'Crisis Text Line (US)', number: 'Text HOME to 741741', url: 'https://www.crisistextline.org/'},
          {title: 'Samaritans (UK)', number: '116 123', url: 'https://www.samaritans.org/'}
        ]
      }
    };
    // only set defaults for keys that don't exist
    const toSet = {};
    for (const k in defaults) {
      if (items[k] === undefined) toSet[k] = defaults[k];
    }
    if (Object.keys(toSet).length) chrome.storage.local.set(toSet);
  });
});

// helper to schedule alarms based on stored config
function scheduleAlarms() {
  // Break alarm
  chrome.storage.local.get(['breakConfig'], (res) => {
    const conf = res.breakConfig || {enabled: false, minutes: 60};
    chrome.alarms.clear('medimate-break', () => {
      if (conf.enabled) {
        chrome.alarms.create('medimate-break', { periodInMinutes: conf.minutes });
        console.log('Scheduled medimate-break every', conf.minutes, 'minutes');
      } else {
        console.log('Break reminders disabled');
      }
    });
  });

  // Bedtime alarm
  chrome.storage.local.get(['bedtimeConfig'], (res) => {
    const conf = res.bedtimeConfig || {enabled: false, time: '22:00'};
    chrome.alarms.clear('medimate-bedtime', () => {
      if (conf.enabled) {
        const [hours, minutes] = conf.time.split(':').map(Number);
        const now = new Date();
        const triggerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        if (triggerTime < now) {
          triggerTime.setDate(triggerTime.getDate() + 1);
        }
        chrome.alarms.create('medimate-bedtime', { when: triggerTime.getTime() });
        console.log('Scheduled medimate-bedtime at', conf.time);
      } else {
        console.log('Bedtime reminders disabled');
      }
    });
  });

  // Gratitude alarm
  chrome.storage.local.get(['gratitudeConfig'], (res) => {
    const conf = res.gratitudeConfig || {enabled: false, time: '20:00'};
    chrome.alarms.clear('medimate-gratitude', () => {
      if (conf.enabled) {
        const [hours, minutes] = conf.time.split(':').map(Number);
        const now = new Date();
        const triggerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        if (triggerTime < now) {
          triggerTime.setDate(triggerTime.getDate() + 1);
        }
        chrome.alarms.create('medimate-gratitude', { when: triggerTime.getTime() });
        console.log('Scheduled medimate-gratitude at', conf.time);
      } else {
        console.log('Gratitude reminders disabled');
      }
    });
  });
}

// Run once on startup
scheduleAlarms();

// React to changes in configs
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.breakConfig || changes.bedtimeConfig || changes.gratitudeConfig) {
      scheduleAlarms();
    }
  }
});