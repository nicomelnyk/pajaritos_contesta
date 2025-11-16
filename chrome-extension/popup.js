// Popup script for managing rules and settings

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle');
  const rulesList = document.getElementById('rulesList');
  const addRuleBtn = document.getElementById('addRule');

  // Load current settings
  chrome.storage.sync.get(['enabled', 'rules'], (result) => {
    const isEnabled = result.enabled || false;
    const rules = result.rules || [];

    // Set toggle state
    if (isEnabled) {
      toggle.classList.add('active');
    }

    // Render rules
    renderRules(rules);
  });

  // Toggle on/off
  toggle.addEventListener('click', () => {
    const isActive = toggle.classList.contains('active');
    const newState = !isActive;

    toggle.classList.toggle('active');
    chrome.storage.sync.set({ enabled: newState }, () => {
      console.log('Extension', newState ? 'enabled' : 'disabled');
    });
  });

  // Add rule button
  addRuleBtn.addEventListener('click', () => {
    const name = prompt('Rule name:');
    if (!name) return;

    const keywords = prompt('Keywords (comma-separated):');
    if (!keywords) return;

    const response = prompt('Response message:');
    if (!response) return;

    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules || [];
      rules.push({
        id: Date.now(),
        name: name,
        keywords: keywords.split(',').map(k => k.trim()),
        response: response,
        enabled: true
      });

      chrome.storage.sync.set({ rules }, () => {
        renderRules(rules);
      });
    });
  });

  // Render rules list
  function renderRules(rules) {
    if (rules.length === 0) {
      rulesList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No rules yet. Add one to get started!</div>';
      return;
    }

    rulesList.innerHTML = rules.map(rule => `
      <div class="rule-item">
        <div class="rule-header">
          <span class="rule-name">${rule.name}</span>
          <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px;" onclick="deleteRule(${rule.id})">Delete</button>
        </div>
        <div class="rule-keywords">
          <strong>Keywords:</strong> ${rule.keywords.join(', ')}
        </div>
        <div class="rule-response">
          <strong>Response:</strong> ${rule.response}
        </div>
      </div>
    `).join('');
  }

  // Delete rule (needs to be global for onclick)
  window.deleteRule = (ruleId) => {
    chrome.storage.sync.get(['rules'], (result) => {
      const rules = result.rules || [];
      const filtered = rules.filter(r => r.id !== ruleId);
      chrome.storage.sync.set({ rules: filtered }, () => {
        renderRules(filtered);
      });
    });
  };
});

