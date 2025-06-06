// Option Pricing UI logic

document.addEventListener('DOMContentLoaded', () => {
  // Populate week selector (default: 1-13)
  const weekSelect = document.getElementById('optionWeek');
  for (let i = 1; i <= 13; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Week ${i}`;
    weekSelect.appendChild(opt);
  }

  // Strike mode toggle
  const strikeInput = document.getElementById('optionStrike');
  const strikeMode = document.getElementById('strikeMode');
  strikeMode.addEventListener('change', () => {
    if (strikeMode.value === 'percent') {
      strikeInput.placeholder = 'e.g. 125 (for 125%)';
    } else {
      strikeInput.placeholder = 'e.g. 3500';
    }
  });

  // Option payoff calculation logic
  function monteCarloSimulation(initialSpot, forecastedRate, volatility, weeklyDrift, weeks, nSimulations) {
    const pricePaths = [];
    for (let sim = 0; sim < nSimulations; sim++) {
      const path = [initialSpot];
      let currentPrice = initialSpot;
      for (let week = 1; week < weeks; week++) {
        // Geometric Brownian motion
        const randomReturn = randomNormal(weeklyDrift, volatility);
        currentPrice = currentPrice * Math.exp(randomReturn);
        path.push(currentPrice);
      }
      pricePaths.push(path);
    }
    return pricePaths;
  }

  function randomNormal(mean = 0, stdDev = 1) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }

  function percentile(arr, p) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sorted[lower];
    return sorted[lower] * (upper - idx) + sorted[upper] * (idx - lower);
  }

  // Chart.js histogram helper
  let payoffChart = null;
  function renderPayoffHistogram(payoffs) {
    const ctx = document.getElementById('optionPayoffChart').getContext('2d');
    // Bin payoffs for histogram
    const nBins = 30;
    const min = Math.min(...payoffs);
    const max = Math.max(...payoffs);
    const binWidth = (max - min) / nBins || 1;
    const bins = Array(nBins).fill(0);
    payoffs.forEach(val => {
      let idx = Math.floor((val - min) / binWidth);
      if (idx >= nBins) idx = nBins - 1;
      if (idx < 0) idx = 0;
      bins[idx]++;
    });
    const labels = bins.map((_, i) => (min + i * binWidth).toFixed(0));
    // Destroy previous chart if exists
    if (payoffChart) {
      payoffChart.destroy();
    }
    payoffChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Payoff Distribution',
          data: bins,
          backgroundColor: 'rgba(91, 155, 213, 0.7)',
          borderColor: 'rgba(91, 155, 213, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Count: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Payoff ($)' }
          },
          y: {
            title: { display: true, text: 'Frequency' },
            beginAtZero: true
          }
        }
      }
    });
  }

  // Render simulation parameters summary card
  function renderParamsCard(params) {
    const card = document.getElementById('optionParamsCard');
    card.innerHTML = `
      <div><span class="param-label">Starting Market Price:</span> <span class="param-value">$${params.initialSpot.toLocaleString()}</span></div>
      <div><span class="param-label">13-Week Market Forecast:</span> <span class="param-value">$${params.forecastedRate.toLocaleString()}</span></div>
      <div><span class="param-label">Volatility:</span> <span class="param-value">${(params.volatility * 100).toFixed(2)}%</span></div>
      <div><span class="param-label">Simulations:</span> <span class="param-value">${params.nSimulations.toLocaleString()}</span></div>
    `;
  }

  // Import from Main Simulator functionality
  document.getElementById('importParams').addEventListener('click', () => {
    let scenarios = [];
    try {
      const stored = localStorage.getItem('contractSimulatorScenarios');
      scenarios = stored ? JSON.parse(stored) : [];
    } catch (e) {
      alert('Could not load scenarios from main simulator.');
      return;
    }
    if (!scenarios.length) {
      alert('No scenarios found in main simulator. Please save a scenario first.');
      return;
    }
    // Use the most recent scenario (by timestamp)
    scenarios.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latest = scenarios[0];
    // Set as defaults for simulation
    importedParams = {
      initialSpot: parseFloat(latest.initialSpot),
      forecastedRate: parseFloat(latest.forecastedRate),
      volatility: parseFloat(latest.volatility) / 100, // convert % to decimal
      weeks: parseInt(latest.weeks),
      nSimulations: parseInt(latest.simulations),
    };
    alert(`Imported parameters from scenario: ${latest.name}`);
    renderParamsCard(importedParams);
  });

  // Use importedParams if available, otherwise defaults
  let importedParams = null;

  function getSimulationParams() {
    if (importedParams) {
      return { ...importedParams };
    }
    return {
      initialSpot: 3000,
      forecastedRate: 3200,
      volatility: 0.03,
      weeks: 13,
      nSimulations: 10000
    };
  }

  // Initial render
  renderParamsCard(getSimulationParams());

  // Calculate button event
  document.getElementById('calculateOption').addEventListener('click', () => {
    // Get input values
    const week = parseInt(weekSelect.value);
    const strikeRaw = parseFloat(strikeInput.value);
    const mode = strikeMode.value;
    const type = document.getElementById('optionType').value;

    // Input validation
    let errorMsg = '';
    if (isNaN(week) || week < 1 || week > 13) {
      errorMsg += 'Please select a valid week (1-13).<br>';
    }
    if (isNaN(strikeRaw) || strikeRaw <= 0) {
      errorMsg += 'Please enter a positive strike value.<br>';
    }
    if (mode === 'percent' && (strikeRaw < 1 || strikeRaw > 500)) {
      errorMsg += 'Strike percent should be between 1 and 500.<br>';
    }
    if (errorMsg) {
      document.getElementById('optionPayoffStats').innerHTML = `<span style="color: #ED7D31; font-weight: bold;">${errorMsg}</span>`;
      if (payoffChart) payoffChart.destroy();
      return;
    }

    // Simulation parameters (defaults for now)
    // const initialSpot = 3000;
    // const forecastedRate = 3200;
    // const volatility = 0.03; // 3% weekly
    // const weeks = 13;
    // const nSimulations = 10000;

    const { initialSpot, forecastedRate, volatility, weeks, nSimulations } = getSimulationParams();

    // Calculate drift
    const totalDrift = Math.log(forecastedRate / initialSpot);
    const weeklyDrift = totalDrift / 13;

    // Run simulation
    const pricePaths = monteCarloSimulation(initialSpot, forecastedRate, volatility, weeklyDrift, weeks, nSimulations);

    // Determine strike
    let strike;
    if (mode === 'percent') {
      strike = initialSpot * (strikeRaw / 100);
    } else {
      strike = strikeRaw;
    }

    // Calculate option payoffs for selected week
    const weekIdx = week - 1;
    const payoffs = pricePaths.map(path => {
      const price = path[weekIdx];
      if (type === 'call') {
        return Math.max(0, price - strike);
      } else {
        return Math.max(0, strike - price);
      }
    });
    const meanPayoff = payoffs.reduce((a, b) => a + b, 0) / payoffs.length;
    const medianPayoff = percentile(payoffs, 50);
    const p5 = percentile(payoffs, 5);
    const p95 = percentile(payoffs, 95);

    // Display result
    document.getElementById('optionPayoffStats').innerHTML =
      `<div><strong>Expected ${type} payoff (Week ${week}, Strike $${strike.toFixed(2)}):</strong> $${meanPayoff.toFixed(2)}</div>` +
      `<div>Median: $${medianPayoff.toFixed(2)}</div>` +
      `<div>5th Percentile: $${p5.toFixed(2)}</div>` +
      `<div>95th Percentile: $${p95.toFixed(2)}</div>`;

    // Render histogram
    renderPayoffHistogram(payoffs);

    // Store last results for export
    lastPayoffResults = { payoffs, stats: { mean: meanPayoff, median: medianPayoff, p5, p95 }, params: { week, strike, type } };

    // After using getSimulationParams(), update the card in case defaults changed
    renderParamsCard(getSimulationParams());
  });

  // Export CSV functionality
  const exportBtn = document.getElementById('exportOptionCSV');
  exportBtn.addEventListener('click', () => {
    if (!lastPayoffResults || !Array.isArray(lastPayoffResults.payoffs)) {
      alert('Please run a calculation first.');
      return;
    }
    const { payoffs, stats, params } = lastPayoffResults;
    let csv = 'Option Payoff Simulation Results\n';
    csv += `Week,${params.week}\nStrike,${params.strike}\nType,${params.type}\nSimulations,${payoffs.length}\n`;
    csv += `Mean,${stats.mean}\nMedian,${stats.median}\n5th Percentile,${stats.p5}\n95th Percentile,${stats.p95}\n\n`;
    csv += 'Payoff\n';
    csv += payoffs.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `option_payoff_week${params.week}_${params.type}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Store last results for export
  let lastPayoffResults = null;

  function showResults(payoffs, stats, params) {
    lastPayoffResults = { payoffs, stats, params };
    // ... existing code ...
  }
}); 