// Option Pricing UI logic
console.log('Option Pricing script loaded!');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded fired!');
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
      forecastedRate: 3200,
      volatility: 0.03,
      weeks: 13,
      nSimulations: 10000
    };
  }

  // Option Value Over Time functionality
  let timeSeriesChart = null;

  function calculateOptionTimeSeries(params) {
    console.log('Starting calculateOptionTimeSeries with params:', params);
    try {
      const { initialSpot, forecastedRate, volatility, weeks, nSimulations } = params;
      
      // Calculate drift
      const totalDrift = Math.log(forecastedRate / initialSpot);
      const weeklyDrift = totalDrift / 13;
      console.log('Drift calculated:', { totalDrift, weeklyDrift });

      // Run simulation for full 13 weeks
      console.log('Running Monte Carlo simulation...');
      const pricePaths = monteCarloSimulation(initialSpot, forecastedRate, volatility, weeklyDrift, 13, Math.min(nSimulations, 15000));
      console.log('Monte Carlo simulation completed. Price paths:', pricePaths.length);
      
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
            console.warn(`Path missing data for week ${week}:`, path);
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
        
        if (week <= 3) {
          console.log(`Week ${week} calculated:`, {
            meanSpotPrice: meanSpotPrice.toFixed(2),
            callValue: meanCallValue.toFixed(2),
            callValuePercent: callValuePercent.toFixed(2)
          });
        }
      }
      
      console.log('Time series calculation completed successfully');
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
    console.log('Updating option time series...');
    try {
      const params = getSimulationParams();
      console.log('Time series params:', params);
      
      const timeSeriesData = calculateOptionTimeSeries(params);
      console.log('Time series data calculated:', timeSeriesData.length, 'weeks');
      
      renderTimeSeriesChart(timeSeriesData);
      renderTimeSeriesTable(timeSeriesData);
      console.log('Option time series updated successfully');
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

  // Initial render
  renderParamsCard(getSimulationParams());
  updateOptionTimeSeries();

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
    updateOptionTimeSeries();
  });

  // Store last results for export
  let lastPayoffResults = null;

  function showResults(payoffs, stats, params) {
    lastPayoffResults = { payoffs, stats, params };
    // ... existing code ...
  }

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
  });
}); 