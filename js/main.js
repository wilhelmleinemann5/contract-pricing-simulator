import MarketSimulator from './MarketSimulator.js';

document.addEventListener('DOMContentLoaded', () => {
  const simulator = new MarketSimulator();
  
  // Clear any existing help containers on page load
  setTimeout(() => {
    const existingHelp = document.querySelectorAll('[id*="help"]');
    existingHelp.forEach(container => container.remove());
  }, 100);
  
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
      const helpText = checkFunction(value);
      
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
    const helpContainers = document.querySelectorAll('[id$="-help"], #forecast-help');
    helpContainers.forEach(container => {
      container.innerHTML = '';
      container.style.display = 'none';
    });
  }
  
  // Smart help for volatility
  const triggerVolatilityHelp = addSmartHelp('volatility', 'volatility-help', (value) => {
    if (value <= 1) return '💡 Very low volatility - suitable for stable, predictable markets';
    if (value <= 3) return '✅ Low volatility - good for conservative pricing strategies';
    if (value <= 6) return '⚖️ Normal volatility - typical market conditions';
    if (value <= 9) return '⚠️ High volatility - increases option values significantly';
    if (value > 9) return '🔥 Very high volatility - extreme market uncertainty, use with caution';
    return null;
  });
  
  // Smart help for volume discount
  const triggerVolumeDiscountHelp = addSmartHelp('volumeDiscount', 'volumeDiscount-help', (value) => {
    if (value < 2) return '💡 Low discount - suitable for spot market comparison';
    if (value <= 5) return '✅ Typical discount - standard industry range';
    if (value <= 10) return '⚖️ Good discount - attractive for customers';
    if (value > 15) return '⚠️ High discount - ensure profitability margins';
    return null;
  });
  
  // Smart help for forecast vs current
  const initialSpotInput = document.getElementById('initialSpot');
  const forecastInput = document.getElementById('forecastedRate');
  
  let forecastDebounceTimer = null;
  
  function checkForecastGuidance() {
    const initial = parseFloat(initialSpotInput.value) || 0;
    const forecast = parseFloat(forecastInput.value) || 0;
    
    // Get or create help container, removing any existing ones first
    let helpContainer = document.getElementById('forecast-help');
    if (!helpContainer) {
      // Remove any existing forecast help containers
      const existingContainers = document.querySelectorAll('[id*="forecast"][id*="help"]');
      existingContainers.forEach(container => container.remove());
      
      helpContainer = createHelpContainer('forecastedRate');
      helpContainer.id = 'forecast-help'; // Override the auto-generated ID
    }
    
    if (initial > 0 && forecast > 0) {
      const change = ((forecast - initial) / initial) * 100;
      
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
        // Clear any existing content
        helpContainer.innerHTML = '';
        helpContainer.innerHTML = `<div class="smart-help">${helpText}</div>`;
        helpContainer.style.display = 'block';
      } else {
        helpContainer.innerHTML = '';
        helpContainer.style.display = 'none';
      }
    } else {
      // Clear content and hide when values are invalid
      helpContainer.innerHTML = '';
      helpContainer.style.display = 'none';
    }
  }
  
  function debouncedForecastGuidance() {
    clearTimeout(forecastDebounceTimer);
    forecastDebounceTimer = setTimeout(checkForecastGuidance, 500);
  }
  
  // Use blur events (when leaving field) for immediate feedback
  initialSpotInput.addEventListener('blur', checkForecastGuidance);
  forecastInput.addEventListener('blur', checkForecastGuidance);
  
  // Use debounced input events as backup for real-time feedback (with delay)
  initialSpotInput.addEventListener('input', debouncedForecastGuidance);
  forecastInput.addEventListener('input', debouncedForecastGuidance);
  
  // Example scenarios functionality
  const exampleScenarios = {
    conservative: {
      name: "Stable Market",
      initialSpot: 2800,
      forecastedRate: 2800,
      volatility: 3.0,
      weeks: 13,
      simulations: 10000,
      volumeDiscount: 5.0,
      description: "Stable market with low volatility"
    },
    volatile: {
      name: "Uncertain Future Outlook Market Conditions", 
      initialSpot: 3200,
      forecastedRate: 3300,
      volatility: 10.0,
      weeks: 13,
      simulations: 10000,
      volumeDiscount: 5.0,
      description: "High uncertainty market with significant price swings"
    },
    balanced: {
      name: "Moderate Positive Outlook",
      initialSpot: 3000,
      forecastedRate: 3200,
      volatility: 5.0,
      weeks: 13,
      simulations: 10000,
      volumeDiscount: 5.0,
      description: "Moderate parameters"
    },
    bullish: {
      name: "Bull Market Scenario",
      initialSpot: 2900,
      forecastedRate: 3500,
      volatility: 8.0,
      weeks: 13,
      simulations: 10000,
      volumeDiscount: 2.0,
      description: "Strong upward trend with controlled volatility"
    },
    bearish: {
      name: "Bear Market Scenario", 
      initialSpot: 3400,
      forecastedRate: 2700,
      volatility: 8.0,
      weeks: 13,
      simulations: 10000,
      volumeDiscount: 10.0,
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
    
    // Clear any existing help containers first
    clearAllSmartHelp();
    
    // Trigger smart help updates
    checkForecastGuidance();
    // Trigger help for volatility and volume discount directly
    triggerVolatilityHelp();
    triggerVolumeDiscountHelp();
    
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

