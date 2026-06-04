// app.js — UI controller for Diabetes Risk Predictor
// Handles form interaction, prediction display, history, and charts.

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────
  let history = [];
  try {
    const stored = sessionStorage.getItem('dxHistory');
    if (stored) history = JSON.parse(stored);
  } catch (_) {}

  // ── DOM refs ───────────────────────────────────────────────────────
  const form        = document.getElementById('predictionForm');
  const resultPanel = document.getElementById('resultPanel');
  const emptyState  = document.getElementById('emptyState');
  const historyList = document.getElementById('historyList');
  const historyCount= document.getElementById('historyCount');
  const clearBtn    = document.getElementById('clearHistory');
  const predictBtn  = document.getElementById('predictBtn');

  // ── Range input live display ───────────────────────────────────────
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    const display = document.getElementById(slider.id + 'Val');
    if (display) {
      display.textContent = slider.value;
      slider.addEventListener('input', () => { display.textContent = slider.value; });
    }
  });

  // ── Number input: keep range slider in sync ────────────────────────
  document.querySelectorAll('.field-input').forEach(input => {
    input.addEventListener('input', () => {
      validateField(input);
    });
  });

  function validateField(input) {
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const val = parseFloat(input.value);
    const err = document.getElementById(input.id + 'Err');
    if (isNaN(val)) {
      if (err) err.textContent = 'Please enter a number.';
      input.classList.add('error');
      return false;
    }
    if (!isNaN(min) && val < min) {
      if (err) err.textContent = `Minimum value is ${min}.`;
      input.classList.add('error');
      return false;
    }
    if (!isNaN(max) && val > max) {
      if (err) err.textContent = `Maximum value is ${max}.`;
      input.classList.add('error');
      return false;
    }
    if (err) err.textContent = '';
    input.classList.remove('error');
    return true;
  }

  // ── Form submit ────────────────────────────────────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Collect + validate
    const fields = ['pregnancies', 'glucose', 'bloodPressure', 'skinThickness',
                    'insulin', 'bmi', 'dpf', 'age'];
    let valid = true;
    const vals = fields.map(id => {
      const el = document.getElementById(id);
      if (!validateField(el)) valid = false;
      return parseFloat(el.value);
    });

    if (!valid) {
      shakeForm();
      return;
    }

    // Animate button
    predictBtn.disabled = true;
    predictBtn.innerHTML = '<span class="spinner"></span> Analysing…';

    setTimeout(() => {
      const result = DiabetesModel.predict(vals);
      displayResult(result, vals);
      addToHistory(result, vals);
      predictBtn.disabled = false;
      predictBtn.innerHTML = 'Check My Risk';
    }, 600); // small delay for perceived computation
  });

  // ── Display result ─────────────────────────────────────────────────
  function displayResult(r, inputs) {
    emptyState.style.display = 'none';
    resultPanel.style.display = 'block';
    resultPanel.classList.remove('animate-in');
    void resultPanel.offsetWidth;
    resultPanel.classList.add('animate-in');

    // Risk badge
    document.getElementById('riskBadge').textContent    = r.riskLabel;
    document.getElementById('riskBadge').style.background = r.riskBg;
    document.getElementById('riskBadge').style.color     = r.riskColor;
    document.getElementById('riskBadge').style.borderColor = r.riskBorder;
    document.getElementById('riskEmoji').textContent     = r.riskEmoji;
    document.getElementById('riskEmoji').style.color     = r.riskColor;

    // Probability bar
    const pct = Math.round(r.probDiabetic * 100);
    const bar = document.getElementById('probBar');
    const barFill = document.getElementById('probBarFill');
    const probLabel = document.getElementById('probLabel');
    probLabel.textContent = pct + '% probability of diabetes';
    setTimeout(() => {
      barFill.style.width = pct + '%';
      barFill.style.background = r.riskColor;
    }, 100);

    // Recommendation
    document.getElementById('recommendation').textContent = r.recommendation;

    // Feature contributions chart
    drawContributions(r.topContributors, r.riskColor);

    // Scroll result into view
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Mini bar chart for top feature contributions ───────────────────
  function drawContributions(contributors, color) {
    const container = document.getElementById('contributionsChart');
    container.innerHTML = '';
    const maxAbs = Math.max(...contributors.map(c => Math.abs(c.value)));

    contributors.forEach(c => {
      const pct = maxAbs > 0 ? (Math.abs(c.value) / maxAbs) * 100 : 0;
      const positive = c.value >= 0;
      const row = document.createElement('div');
      row.className = 'contrib-row';
      row.innerHTML = `
        <span class="contrib-name">${c.name}</span>
        <div class="contrib-track">
          <div class="contrib-bar ${positive ? 'pos' : 'neg'}"
               style="width:${pct.toFixed(1)}%; background:${positive ? color : '#94a3b8'}">
          </div>
        </div>
        <span class="contrib-val ${positive ? 'pos' : 'neg'}">${positive ? '+' : ''}${c.value.toFixed(3)}</span>
      `;
      container.appendChild(row);
    });
  }

  // ── History ────────────────────────────────────────────────────────
  function addToHistory(result, inputs) {
    const fieldNames = ['Pregnancies', 'Glucose', 'BP', 'SkinThick', 'Insulin', 'BMI', 'DPF', 'Age'];
    const entry = {
      id:        Date.now(),
      timestamp: new Date().toLocaleString(),
      riskLevel: result.riskLevel,
      riskLabel: result.riskLabel,
      riskColor: result.riskColor,
      riskBg:    result.riskBg,
      prob:      result.probDiabetic,
      inputs:    Object.fromEntries(fieldNames.map((n, i) => [n, inputs[i]]))
    };
    history.unshift(entry);
    if (history.length > 20) history = history.slice(0, 20);
    try { sessionStorage.setItem('dxHistory', JSON.stringify(history)); } catch (_) {}
    renderHistory();
  }

  function renderHistory() {
    historyCount.textContent = history.length;
    historyList.innerHTML = '';

    if (history.length === 0) {
      historyList.innerHTML = '<p class="history-empty">No predictions yet.</p>';
      return;
    }

    history.forEach(entry => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.style.borderLeft = `4px solid ${entry.riskColor}`;
      card.innerHTML = `
        <div class="history-header">
          <span class="history-badge" style="background:${entry.riskBg};color:${entry.riskColor}">
            ${entry.riskLabel}
          </span>
          <span class="history-prob">${Math.round(entry.prob * 100)}%</span>
        </div>
        <div class="history-meta">${entry.timestamp}</div>
        <div class="history-inputs">
          ${Object.entries(entry.inputs).map(([k, v]) =>
            `<span><b>${k}</b>: ${v}</span>`
          ).join('')}
        </div>
      `;
      historyList.appendChild(card);
    });
  }

  clearBtn.addEventListener('click', () => {
    history = [];
    try { sessionStorage.removeItem('dxHistory'); } catch (_) {}
    renderHistory();
  });

  // ── Helpers ────────────────────────────────────────────────────────
  function shakeForm() {
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 500);
  }

  // ── Field info tooltips ────────────────────────────────────────────
  document.querySelectorAll('.info-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      const tip = icon.nextElementSibling;
      if (tip && tip.classList.contains('tooltip')) {
        tip.classList.toggle('visible');
      }
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.tooltip.visible').forEach(t => t.classList.remove('visible'));
  });

  // ── Tab navigation ─────────────────────────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + target).classList.add('active');
    });
  });

  // ── Init ───────────────────────────────────────────────────────────
  renderHistory();
  document.getElementById('yearSpan').textContent = new Date().getFullYear();

})();
