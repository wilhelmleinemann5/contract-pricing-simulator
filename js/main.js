import MarketSimulator from './MarketSimulator.js';

document.addEventListener('DOMContentLoaded', () => {
  const simulator = new MarketSimulator();
  
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
