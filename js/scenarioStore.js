(function() {
    function saveScenario(scenario) {
        try {
            const scenarios = JSON.parse(localStorage.getItem('scenarios') || '[]');
            scenarios.push(scenario);
            localStorage.setItem('scenarios', JSON.stringify(scenarios));
        } catch (err) {
            console.error('Failed to save scenario', err);
        }
    }

    function getScenarios() {
        try {
            return JSON.parse(localStorage.getItem('scenarios') || '[]');
        } catch (err) {
            console.error('Failed to load scenarios', err);
            return [];
        }
    }

    window.saveScenario = saveScenario;
    window.getScenarios = getScenarios;
})();
