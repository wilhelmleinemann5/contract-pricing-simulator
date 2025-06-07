import MarketSimulator from './MarketSimulator.js';

document.addEventListener('DOMContentLoaded', () => {
  const simulator = new MarketSimulator();
  
  // Smart contextual help system
  function addSmartHelp(inputId, helpId, checkFunction) {
    const input = document.getElementById(inputId);
    const helpContainer = document.getElementById(helpId) || createHelpContainer(inputId);
    
    input.addEventListener('input', () => {
      const value = parseFloat(input.value);
      const helpText = checkFunction(value);
      
      if (helpText) {
        helpContainer.innerHTML = `<div class="smart-help">${helpText}</div>`;
        helpContainer.style.display = 'block';
      } else {
        helpContainer.style.display = 'none';
      }
    });
  }
  
  function createHelpContainer(inputId) {
    const input = document.getElementById(inputId);
    const container = document.createElement('div');
    container.id = inputId + '-help';
    container.style.display = 'none';
    input.parentNode.appendChild(container);
    return container;
  }
  
  // Smart help for volatility
  addSmartHelp('volatility', 'volatility-help', (value) => {
    if (value <= 1) return '💡 Very low volatility - suitable for stable, predictable markets';
    if (value <= 2) return '✅ Low volatility - good for conservative pricing strategies';
    if (value <= 5) return '⚖️ Normal volatility - typical market conditions';
    if (value <= 8) return '⚠️ High volatility - increases option values significantly';
    if (value > 8) return '🔥 Very high volatility - extreme market uncertainty, use with caution';
    return null;
  });
  
  // Smart help for volume discount
  addSmartHelp('volumeDiscount', 'volumeDiscount-help', (value) => {
    if (value < 2) return '💡 Low discount - suitable for spot market comparison';
    if (value <= 5) return '✅ Typical discount - standard industry range';
    if (value <= 10) return '⚖️ Good discount - attractive for customers';
    if (value > 15) return '⚠️ High discount - ensure profitability margins';
    return null;
  });
  
  // Smart help for forecast vs current
  const initialSpotInput = document.getElementById('initialSpot');
  const forecastInput = document.getElementById('forecastedRate');
  
  function checkForecastGuidance() {
    const initial = parseFloat(initialSpotInput.value) || 0;
    const forecast = parseFloat(forecastInput.value) || 0;
    
    if (initial > 0 && forecast > 0) {
      const change = ((forecast - initial) / initial) * 100;
      const helpContainer = document.getElementById('forecast-help') || createHelpContainer('forecastedRate');
      
      let helpText = '';
      if (Math.abs(change) < 2) {
        helpText = '→ Stable market outlook - contracts and spot rates will be similar';
      } else if (change > 10) {
        helpText = '📈 Strong upward forecast - longer contracts become more valuable';
      } else if (change < -10) {
        helpText = '📉 Bearish outlook - shorter contracts may be preferred';
      } else if (change > 0) {
        helpText = '↗️ Mild upward trend - slight premium for longer contracts';
      } else {
        helpText = '↘️ Mild downward trend - spot market may be competitive';
      }
      
      if (helpText) {
        helpContainer.innerHTML = `<div class="smart-help">${helpText}</div>`;
        helpContainer.style.display = 'block';
      }
    }
  }
  
  initialSpotInput.addEventListener('input', checkForecastGuidance);
  forecastInput.addEventListener('input', checkForecastGuidance);
  
  // Example scenarios functionality
  const exampleScenarios = {
    conservative: {
      name: "Conservative Asia-Europe",
      initialSpot: 2800,
      forecastedRate: 2900,
      volatility: 2.0,
      weeks: 13,
      simulations: 10000,
      volumeDiscount: 4.0,
      description: "Stable market with low volatility and modest growth expectations"
    },
    volatile: {
      name: "Volatile Market Conditions", 
      initialSpot: 3200,
      forecastedRate: 3400,
      volatility: 7.5,
      weeks: 13,
      simulations: 15000,
      volumeDiscount: 6.0,
      description: "High uncertainty market with significant price swings"
    },
    balanced: {
      name: "Balanced Portfolio",
      initialSpot: 3000,
      forecastedRate: 3200,
      volatility: 4.0,
      weeks: 13,
      simulations: 10000,
      volumeDiscount: 5.0,
      description: "Moderate parameters suitable for diversified approach"
    },
    bullish: {
      name: "Bull Market Scenario",
      initialSpot: 2900,
      forecastedRate: 3350,
      volatility: 3.5,
      weeks: 13,
      simulations: 10000,
      volumeDiscount: 5.5,
      description: "Strong upward trend with controlled volatility"
    },
    bearish: {
      name: "Bear Market Scenario", 
      initialSpot: 3400,
      forecastedRate: 3100,
      volatility: 6.0,
      weeks: 13,
      simulations: 12000,
      volumeDiscount: 4.5,
      description: "Declining market with higher uncertainty"
    }
  };
  
  // Handle example scenario selection
  document.getElementById('exampleScenarios').addEventListener('change', (e) => {
    const scenarioKey = e.target.value;
    if (!scenarioKey) return;
    
    const scenario = exampleScenarios[scenarioKey];
    if (!scenario) return;
    
    // Load scenario parameters
    document.getElementById('initialSpot').value = scenario.initialSpot;
    document.getElementById('forecastedRate').value = scenario.forecastedRate;
    document.getElementById('volatility').value = scenario.volatility;
    document.getElementById('weeks').value = scenario.weeks;
    document.getElementById('simulations').value = scenario.simulations;
    document.getElementById('volumeDiscount').value = scenario.volumeDiscount;
    
    // Trigger smart help updates
    checkForecastGuidance();
    document.getElementById('volatility').dispatchEvent(new Event('input'));
    document.getElementById('volumeDiscount').dispatchEvent(new Event('input'));
    
    // Show confirmation and auto-run
    const confirmMsg = `Loaded "${scenario.name}"\n${scenario.description}\n\nRun simulation now?`;
    if (confirm(confirmMsg)) {
      simulator.runSimulation();
    }
    
    // Reset dropdown
    e.target.value = '';
  });
  
  // Expose simulator globally for debugging
  window.simulator = simulator;
  
  // Add global test functions
  window.testScenario = () => {
    console.log('Adding test scenario from console...');
    return simulator.addTestScenario();
  };
  
  window.debugScenarios = () => {
    console.log('Current scenarios:', simulator.savedScenarios);
    console.log('Storage available:', simulator.storageAvailable);
    console.log('Comparison visible:', simulator.comparisonVisible);
    return {
      scenarios: simulator.savedScenarios,
      count: simulator.savedScenarios.length,
      storageAvailable: simulator.storageAvailable
    };
  };
  
  console.log('Simulator loaded. Available console commands:');
  console.log('- testScenario() - adds a test scenario');
  console.log('- debugScenarios() - shows current scenario data');
  console.log('- simulator - access to main simulator instance');
});
