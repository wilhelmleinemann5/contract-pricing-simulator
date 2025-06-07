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

  // Render simulation parameters summary card
  function renderParamsCard(params) {
    const card = document.getElementById('optionParamsCard');
    card.innerHTML = `
      <div class="param-row"><span class="param-label">Starting Market Price:</span> <span class="param-value">$${params.initialSpot.toLocaleString()}</span></div>
      <div class="param-row"><span class="param-label">13-Week Market Forecast:</span> <span class="param-value">$${params.forecastedRate.toLocaleString()}</span></div>
      <div class="param-row"><span class="param-label">Volatility:</span> <span class="param-value">${(params.volatility * 100).toFixed(2)}%</span></div>
      <div class="param-row"><span class="param-label">Simulations:</span> <span class="param-value">${params.nSimulations.toLocaleString()}</span></div>
    `;
  }

  // Export CSV button logic
  const exportBtn = document.getElementById('exportOptionCSV');
  exportBtn.disabled = true;
  exportBtn.classList.add('disabled-btn');
  exportBtn.title = 'Run a calculation first';

  exportBtn.addEventListener('click', () => {
    if (!lastPayoffResults || !Array.isArray(lastPayoffResults.payoffs)) {
      exportBtn.title = 'Run a calculation first';
      return;
    }
    exportBtn.title = '';
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

  // Chart.js histogram helper
  let payoffChart = null;
  function renderPayoffHistogram(payoffs) {
    try {
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
      document.getElementById('optionPayoffChart').classList.remove('histogram-error');
    } catch (err) {
      document.getElementById('optionPayoffChart').classList.add('histogram-error');
      document.getElementById('optionPayoffChart').innerText = 'Error rendering histogram.';
      console.error('Histogram error:', err);
    }
  }

  // Use importedParams if available, otherwise defaults
  let importedParams = null;

  function getSimulationParams() {
    if (importedParams) {
      return { ...importedParams };
    }
    return {
      initialSpot: 3000,
      forecastedRate: 3300,
      volatility: 0.06,
      weeks: 13,
      nSimulations: 10000
    };
  }

  // Option Value Over Time functionality
  let timeSeriesChart = null;

  function calculateOptionTimeSeries(params) {
    try {
      const { initialSpot, forecastedRate, volatility, weeks, nSimulations } = params;
      
      // Calculate drift
      const totalDrift = Math.log(forecastedRate / initialSpot);
      const weeklyDrift = totalDrift / 13;

      // Run simulation for full 13 weeks
      const pricePaths = monteCarloSimulation(initialSpot, forecastedRate, volatility, weeklyDrift, 13, Math.min(nSimulations, 15000));
      
      if (!pricePaths || pricePaths.length === 0) {
        throw new Error('Monte Carlo simulation returned no price paths');
      }
      
      const timeSeriesData = [];
      
      // Calculate for each week 1-13
      for (let week = 1; week <= 13; week++) {
        const weekIdx = week - 1;
        
        // Get prices for this week across all simulations
        const weekPrices = pricePaths.map(path => {
          if (!path || path.length <= weekIdx) {
            return initialSpot; // fallback
          }
          return path[weekIdx];
        });
        
        if (weekPrices.length === 0) {
          throw new Error(`No price data for week ${week}`);
        }
        
        // Calculate mean spot price for this week (ATM strike)
        const meanSpotPrice = weekPrices.reduce((a, b) => a + b, 0) / weekPrices.length;
        const strike = meanSpotPrice;
        
        // Calculate call option payoffs for this week with ATM strike
        const callPayoffs = weekPrices.map(price => Math.max(0, price - strike));
        const meanCallValue = callPayoffs.reduce((a, b) => a + b, 0) / callPayoffs.length;
        
        // Calculate as percentage of initial spot
        const callValuePercent = (meanCallValue / initialSpot) * 100;
        
        timeSeriesData.push({
          week,
          meanSpotPrice: meanSpotPrice,
          strike: strike,
          callValue: meanCallValue,
          callValuePercent: callValuePercent
        });
      }
      
      return timeSeriesData;
    } catch (error) {
      console.error('Error in calculateOptionTimeSeries:', error);
      throw error;
    }
  }

  function renderTimeSeriesChart(data) {
    try {
      const ctx = document.getElementById('optionTimeSeriesChart').getContext('2d');
      
      // Destroy previous chart if exists
      if (timeSeriesChart) {
        timeSeriesChart.destroy();
      }
      
      const weeks = data.map(d => `Week ${d.week}`);
      const callValues = data.map(d => d.callValue);
      const callPercents = data.map(d => d.callValuePercent);
      
      timeSeriesChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: weeks,
          datasets: [
            {
              label: 'Call Value ($)',
              data: callValues,
              borderColor: 'rgba(91, 155, 213, 1)',
              backgroundColor: 'rgba(91, 155, 213, 0.1)',
              borderWidth: 3,
              yAxisID: 'y',
              tension: 0.3
            },
            {
              label: 'Call Value (%)',
              data: callPercents,
              borderColor: 'rgba(237, 125, 49, 1)',
              backgroundColor: 'rgba(237, 125, 49, 0.1)',
              borderWidth: 3,
              yAxisID: 'y1',
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  if (context.datasetIndex === 0) {
                    return `Call Value: $${context.parsed.y.toFixed(2)}`;
                  } else {
                    return `Call Value: ${context.parsed.y.toFixed(2)}%`;
                  }
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Week'
              }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Call Value ($)'
              },
              grid: {
                drawOnChartArea: false,
              },
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Call Value (% of Initial)'
              },
              grid: {
                drawOnChartArea: false,
              },
            },
          }
        }
      });
    } catch (err) {
      console.error('Time series chart error:', err);
      document.getElementById('optionTimeSeriesChart').innerHTML = '<div class="histogram-error">Error rendering time series chart.</div>';
    }
  }

  function renderTimeSeriesTable(data) {
    const tableBody = document.getElementById('optionTimeSeriesTableBody');
    tableBody.innerHTML = '';
    
    data.forEach(row => {
      const tr = tableBody.insertRow();
      
      tr.insertCell().textContent = row.week;
      tr.insertCell().textContent = `$${row.meanSpotPrice.toFixed(2)}`;
      tr.insertCell().textContent = `$${row.strike.toFixed(2)}`;
      
      const callValueCell = tr.insertCell();
      callValueCell.textContent = `$${row.callValue.toFixed(2)}`;
      callValueCell.className = row.callValue > 0 ? 'value-positive' : '';
      
      const callPercentCell = tr.insertCell();
      callPercentCell.textContent = `${row.callValuePercent.toFixed(2)}%`;
      callPercentCell.className = row.callValuePercent > 0 ? 'value-positive' : '';
    });
  }

  function updateOptionTimeSeries() {
    try {
      const params = getSimulationParams();
      const timeSeriesData = calculateOptionTimeSeries(params);
      renderTimeSeriesChart(timeSeriesData);
      renderTimeSeriesTable(timeSeriesData);
    } catch (error) {
      console.error('Error updating option time series:', error);
      
      // Show error in table
      const tableBody = document.getElementById('optionTimeSeriesTableBody');
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 20px; color: #ED7D31; font-weight: bold;">
              Error calculating option values: ${error.message}
            </td>
          </tr>
        `;
      }
      
      // Show error in chart area
      const chartCanvas = document.getElementById('optionTimeSeriesChart');
      if (chartCanvas) {
        chartCanvas.style.display = 'none';
        const chartContainer = chartCanvas.parentElement;
        if (chartContainer) {
          chartContainer.innerHTML = `
            <div class="histogram-error">
              Error rendering time series chart: ${error.message}
            </div>
          `;
        }
      }
    }
  }

  // Load and populate saved scenarios dropdown
  function loadSavedScenarios() {
    const scenarioSelect = document.getElementById('savedScenarioSelect');
    const importBtn = document.getElementById('importParams');
    
    try {
      const stored = localStorage.getItem('contractSimulatorScenarios');
      const scenarios = stored ? JSON.parse(stored) : [];
      
      // Clear existing options except the first one
      scenarioSelect.innerHTML = '<option value="">-- Select Scenario to Import --</option>';
      
      if (scenarios.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No scenarios found in main simulator';
        option.disabled = true;
        scenarioSelect.appendChild(option);
        importBtn.disabled = true;
        return;
      }
      
      // Sort scenarios by timestamp (most recent first)
      scenarios.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Add scenarios to dropdown
      scenarios.forEach((scenario, index) => {
        const option = document.createElement('option');
        option.value = scenario.name;
        option.textContent = `${scenario.name} (${new Date(scenario.timestamp).toLocaleDateString()})`;
        scenarioSelect.appendChild(option);
      });
      
      importBtn.disabled = false;
    } catch (error) {
      console.error('Error loading scenarios:', error);
      scenarioSelect.innerHTML = '<option value="">Error loading scenarios</option>';
      importBtn.disabled = true;
    }
  }

  // Handle scenario selection change
  document.getElementById('savedScenarioSelect').addEventListener('change', (e) => {
    const importBtn = document.getElementById('importParams');
    importBtn.disabled = !e.target.value;
  });

  // Initial render
  renderParamsCard(getSimulationParams());
  updateOptionTimeSeries();
  loadSavedScenarios();

  // Import from Main Simulator functionality
  document.getElementById('importParams').addEventListener('click', () => {
    const scenarioSelect = document.getElementById('savedScenarioSelect');
    const selectedScenarioName = scenarioSelect.value;
    
    if (!selectedScenarioName) {
      alert('Please select a scenario to import.');
      return;
    }
    
    let scenarios = [];
    try {
      const stored = localStorage.getItem('contractSimulatorScenarios');
      scenarios = stored ? JSON.parse(stored) : [];
    } catch (e) {
      alert('Could not load scenarios from main simulator.');
      return;
    }
    
    // Find the selected scenario
    const selectedScenario = scenarios.find(s => s.name === selectedScenarioName);
    if (!selectedScenario) {
      alert('Selected scenario not found.');
      return;
    }
    
    // Set as defaults for simulation
    importedParams = {
      initialSpot: parseFloat(selectedScenario.initialSpot),
      forecastedRate: parseFloat(selectedScenario.forecastedRate),
      volatility: parseFloat(selectedScenario.volatility) / 100, // convert % to decimal
      weeks: parseInt(selectedScenario.weeks),
      nSimulations: parseInt(selectedScenario.simulations),
    };
    
    // Clear any existing help containers first
    clearAllSmartHelp();
    
    alert(`Imported parameters from scenario: ${selectedScenario.name}`);
    renderParamsCard(importedParams);
    updateOptionTimeSeries();
    
    // Trigger smart help updates
    triggerStrikeHelp();
    updateWeekGuidance();
    updateOptionTypeGuidance();
  });

  // Store last results for export
  let lastPayoffResults = null;

  function showResults(payoffs, stats, params) {
    lastPayoffResults = { payoffs, stats, params };
    // ... existing code ...
  }

  // Smart contextual help system
  function addSmartHelp(inputId, helpId, checkFunction) {
    const input = document.getElementById(inputId);
    let debounceTimer = null;
    
    function updateHelp() {
      // Always get fresh reference to help container
      let helpContainer = document.getElementById(helpId);
      if (!helpContainer) {
        helpContainer = createHelpContainer(inputId);
        if (helpId !== inputId + '-help') {
          helpContainer.id = helpId; // Override if custom helpId provided
        }
      }
      
      const value = parseFloat(input.value);
      const helpText = checkFunction(value, input);
      
      if (helpText && !isNaN(value)) {
        // Clear any existing content
        helpContainer.innerHTML = '';
        helpContainer.innerHTML = `<div class="smart-help">${helpText}</div>`;
        helpContainer.style.display = 'block';
      } else {
        // Clear content and hide
        helpContainer.innerHTML = '';
        helpContainer.style.display = 'none';
      }
    }
    
    function debouncedUpdate() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateHelp, 400);
    }
    
    // Use blur for immediate feedback when leaving field
    input.addEventListener('blur', updateHelp);
    
    // Use debounced input for real-time feedback with delay
    input.addEventListener('input', debouncedUpdate);
    
    // Return the update function so it can be called manually
    return updateHelp;
  }
  
  function createHelpContainer(inputId) {
    // First, remove any existing help container for this input
    const existingContainer = document.getElementById(inputId + '-help');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    const input = document.getElementById(inputId);
    const container = document.createElement('div');
    container.id = inputId + '-help';
    container.style.display = 'none';
    input.parentNode.appendChild(container);
    return container;
  }
  
  // Function to clear all smart help containers
  function clearAllSmartHelp() {
    const helpContainers = document.querySelectorAll('[id$="-help"], #strike-help');
    helpContainers.forEach(container => {
      container.innerHTML = '';
      container.style.display = 'none';
    });
  }
  
  // Smart help for strike price
  const triggerStrikeHelp = addSmartHelp('optionStrike', 'strike-help', (value, input) => {
    const strikeMode = document.getElementById('strikeMode').value;
    const initialSpot = getSimulationParams().initialSpot;
    
    if (strikeMode === 'percent') {
      if (value < 90) return '🎯 Deep in-the-money - high premium, very likely to be profitable';
      if (value < 95) return '💰 In-the-money - higher cost but good profit probability';
      if (value <= 105) return '⚖️ At-the-money - fair value, most sensitive to market moves';
      if (value <= 115) return '📈 Out-of-the-money - lower cost, need bigger moves to profit';
      if (value > 115) return '🚀 Far out-of-the-money - very cheap but requires significant price movement';
    } else {
      // Absolute value
      const percentOfSpot = (value / initialSpot) * 100;
      if (percentOfSpot < 90) return '🎯 Deep in-the-money - high premium, very likely to be profitable';
      if (percentOfSpot < 95) return '💰 In-the-money - higher cost but good profit probability';
      if (percentOfSpot <= 105) return '⚖️ At-the-money - fair value, most sensitive to market moves';
      if (percentOfSpot <= 115) return '📈 Out-of-the-money - lower cost, need bigger moves to profit';
      if (percentOfSpot > 115) return '🚀 Far out-of-the-money - very cheap but requires significant price movement';
    }
    return null;
  });
  
  // Smart help for week selection based on volatility
  let weekHelpContainer = null;
  function updateWeekGuidance() {
    const week = parseInt(document.getElementById('optionWeek').value);
    const volatility = getSimulationParams().volatility * 100; // Convert to percentage
    
    if (!weekHelpContainer) {
      weekHelpContainer = createHelpContainer('optionWeek');
      weekHelpContainer.id = 'week-help';
    }
    
    if (week && !isNaN(week)) {
      let helpText = '';
      
      if (week <= 4) {
        if (volatility <= 3) {
          helpText = '🕐 Early week + low volatility - conservative play with limited upside';
        } else if (volatility >= 8) {
          helpText = '⚡ Early week + high volatility - good risk/reward balance';
        } else {
          helpText = '📅 Early week - lower uncertainty, smaller potential payoffs';
        }
      } else if (week <= 9) {
        if (volatility <= 3) {
          helpText = '⚖️ Mid-period + low volatility - balanced approach for stable markets';
        } else if (volatility >= 8) {
          helpText = '🎯 Mid-period + high volatility - optimal risk/reward sweet spot';
        } else {
          helpText = '📊 Mid-period - balanced risk and return potential';
        }
      } else {
        if (volatility <= 3) {
          helpText = '📈 Late week + low volatility - limited benefit from extended time';
        } else if (volatility >= 8) {
          helpText = '🚀 Late week + high volatility - maximum potential but highest risk';
        } else {
          helpText = '⏰ Late week - higher potential payoffs but maximum uncertainty';
        }
      }
      
      if (helpText) {
        weekHelpContainer.innerHTML = `<div class="smart-help">${helpText}</div>`;
        weekHelpContainer.style.display = 'block';
      } else {
        weekHelpContainer.innerHTML = '';
        weekHelpContainer.style.display = 'none';
      }
    }
  }
  
  // Smart help for option type based on market conditions
  let optionTypeHelpContainer = null;
  function updateOptionTypeGuidance() {
    const optionType = document.getElementById('optionType').value;
    const params = getSimulationParams();
    const marketChange = ((params.forecastedRate - params.initialSpot) / params.initialSpot) * 100;
    
    if (!optionTypeHelpContainer) {
      optionTypeHelpContainer = createHelpContainer('optionType');
      optionTypeHelpContainer.id = 'optiontype-help';
    }
    
    let helpText = '';
    
    if (optionType === 'call') {
      if (marketChange > 5) {
        helpText = '📈 Call + bullish forecast - aligned with market expectations';
      } else if (marketChange < -5) {
        helpText = '⚠️ Call + bearish forecast - contrarian bet, higher risk';
      } else {
        helpText = '📊 Call option - profits from rate increases above strike';
      }
    } else if (optionType === 'put') {
      if (marketChange < -5) {
        helpText = '📉 Put + bearish forecast - aligned with market expectations';
      } else if (marketChange > 5) {
        helpText = '🛡️ Put + bullish forecast - insurance against downside risk';
      } else {
        helpText = '📊 Put option - profits from rate decreases below strike';
      }
    }
    
    if (helpText) {
      optionTypeHelpContainer.innerHTML = `<div class="smart-help">${helpText}</div>`;
      optionTypeHelpContainer.style.display = 'block';
    } else {
      optionTypeHelpContainer.innerHTML = '';
      optionTypeHelpContainer.style.display = 'none';
    }
  }
  
  // Add event listeners for smart help
  document.getElementById('strikeMode').addEventListener('change', () => {
    triggerStrikeHelp();
  });
  
  document.getElementById('optionWeek').addEventListener('change', updateWeekGuidance);
  document.getElementById('optionType').addEventListener('change', updateOptionTypeGuidance);

  // Initial smart help setup
  setTimeout(() => {
    updateWeekGuidance();
    updateOptionTypeGuidance();
  }, 100);
  
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
      exportBtn.disabled = true;
      exportBtn.classList.add('disabled-btn');
      exportBtn.title = 'Run a calculation first';
      return;
    }

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
      `<div><strong style="color: #ED7D31;">Expected ${type} payoff (Week ${week}, Strike $${strike.toFixed(2)}):</strong> $${meanPayoff.toFixed(2)}</div>` +
      `<div>Median: $${medianPayoff.toFixed(2)}</div>` +
      `<div>5th Percentile: $${p5.toFixed(2)}</div>` +
      `<div>95th Percentile: $${p95.toFixed(2)}</div>`;

    // Render histogram
    renderPayoffHistogram(payoffs);

    // Store last results for export
    lastPayoffResults = { payoffs, stats: { mean: meanPayoff, median: medianPayoff, p5, p95 }, params: { week, strike, type } };

    // Enable export button
    exportBtn.disabled = false;
    exportBtn.classList.remove('disabled-btn');
    exportBtn.title = '';

    // After using getSimulationParams(), update the card in case defaults changed
    renderParamsCard(getSimulationParams());
    
    // Update smart help after calculation
    triggerStrikeHelp();
    updateWeekGuidance();
    updateOptionTypeGuidance();
  });
}); 