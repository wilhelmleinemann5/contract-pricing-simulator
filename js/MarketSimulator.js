export default class MarketSimulator {
    constructor() {
        this.chart = null;
        this.costDistributionChart = null;
        
        // Initialize storage with fallback
        console.log('Initializing MarketSimulator...');
        this.storageAvailable = this.testLocalStorage();
        this.savedScenarios = this.loadScenariosFromStorage();
        console.log('Loaded scenarios from storage:', this.savedScenarios.length);
        
        this.comparisonVisible = false;
        this.initializeEventListeners();
        
        // Update debug info
        this.updateDebugInfo();
        
        // Only run initial simulation after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.runInitialSimulation();
        }, 100);
    }

    // Test localStorage functionality
    testLocalStorage() {
        try {
            const testKey = 'contractSimulatorTest';
            const testValue = 'test-value';
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            const success = retrieved === testValue;
            console.log('localStorage test:', success ? 'PASSED' : 'FAILED');
            return success;
        } catch (error) {
            console.error('localStorage test FAILED:', error);
            return false;
        }
    }

    initializeEventListeners() {
        const runButton = document.getElementById('runSimulation');
        if (!runButton) {
            console.error('Run simulation button not found!');
            return;
        }
        runButton.addEventListener('click', () => this.runSimulation());

        // Scenario management event listeners
        const saveButton = document.getElementById('saveScenario');
        const loadSelect = document.getElementById('savedScenarios');
        const deleteButton = document.getElementById('deleteScenario');
        const compareButton = document.getElementById('toggleComparison');

        if (saveButton) saveButton.addEventListener('click', () => this.saveScenario());
        if (loadSelect) loadSelect.addEventListener('change', () => this.loadScenario());
        if (deleteButton) deleteButton.addEventListener('click', () => this.deleteScenario());
        if (compareButton) compareButton.addEventListener('click', () => this.toggleComparison());

        // Add enter key support for inputs
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.runSimulation();
                }
            });
        });

        // Initialize scenario dropdown
        this.updateScenarioDropdown();
    }

    // Generate random normal distribution using Box-Muller transform
    randomNormal(mean = 0, stdDev = 1) {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return z * stdDev + mean;
    }

    runSimulation() {
        console.log('Running simulation...');
        const container = document.querySelector('.container');
        container.classList.add('loading');
        
        // Small delay to show loading state
        setTimeout(() => {
            try {
                this.performSimulation();
                container.classList.remove('loading');
            } catch (error) {
                console.error('Error in simulation:', error);
                container.classList.remove('loading');
                alert('Error running simulation: ' + error.message);
            }
        }, 100);
    }

    performSimulation() {
        console.log('Performing simulation...');
        
        // Get input values
        const initialSpotEl = document.getElementById('initialSpot');
        const forecastedRateEl = document.getElementById('forecastedRate');
        const volatilityEl = document.getElementById('volatility');
        const weeksEl = document.getElementById('weeks');
        const nSimulationsEl = document.getElementById('simulations');
        const volumeDiscountEl = document.getElementById('volumeDiscount');

        // Check if elements exist
        if (!initialSpotEl || !forecastedRateEl || !volatilityEl || !weeksEl || !nSimulationsEl || !volumeDiscountEl) {
            throw new Error('Required input elements not found in DOM');
        }

        const initialSpot = parseFloat(initialSpotEl.value);
        const forecastedRate = parseFloat(forecastedRateEl.value);
        const volatility = parseFloat(volatilityEl.value) / 100; // Convert percentage to decimal
        const weeks = parseInt(weeksEl.value);
        const nSimulations = parseInt(nSimulationsEl.value);
        const volumeDiscount = parseFloat(volumeDiscountEl.value) / 100; // Convert percentage to decimal

        console.log('Input values:', { initialSpot, forecastedRate, volatility, weeks, nSimulations, volumeDiscount });

        // Validate inputs
        if (isNaN(initialSpot) || isNaN(forecastedRate) || isNaN(volatility) || isNaN(weeks) || isNaN(nSimulations) || isNaN(volumeDiscount)) {
            throw new Error('Please ensure all fields contain valid numbers.');
        }

        if (initialSpot <= 0 || forecastedRate <= 0 || volatility < 0 || weeks <= 0 || nSimulations <= 0 || volumeDiscount < 0) {
            throw new Error('All values must be positive numbers.');
        }

        if (volumeDiscount >= 1) {
            throw new Error('Volume discount must be less than 100%.');
        }

        // Calculate drift parameter: ln(forecasted_rate/starting_rate) / 13 weeks (always 13-week forecast)
        const totalDrift = Math.log(forecastedRate / initialSpot);
        const weeklyDrift = totalDrift / 13; // Always based on 13-week forecast horizon

        console.log('Drift calculation:', { totalDrift, weeklyDrift, forecastHorizon: '13 weeks', contractDuration: weeks });

        // Run Monte Carlo simulation
        const results = this.monteCarloSimulation(initialSpot, forecastedRate, volatility, weeklyDrift, weeks, nSimulations, volumeDiscount);
        
        // Store results for use in suggested rates calculation
        this.lastSimulationResults = results;
        
        console.log('Simulation results:', results);

        // Update chart and statistics
        this.updateChart(results);
        this.updateStatistics(results, initialSpot, forecastedRate);
        this.updateCostDistributionChart(results);
        this.updateContractStatistics(results, volumeDiscount);
        this.updateSuggestedRates(initialSpot, forecastedRate, volatility, weeklyDrift, nSimulations, volumeDiscount);
        this.updateComparisonTable();
        
        console.log('Simulation completed successfully');
    }

    monteCarloSimulation(initialSpot, forecastedRate, volatility, weeklyDrift, weeks, nSimulations, volumeDiscount) {
        const pricePaths = [];
        const finalPrices = [];
        const syntheticContractPrices = [];

        for (let sim = 0; sim < nSimulations; sim++) {
            const path = [initialSpot];
            const discountedPath = [initialSpot * (1 - volumeDiscount)]; // Apply discount to initial price
            let currentPrice = initialSpot;

            for (let week = 1; week < weeks; week++) {
                // Generate random return with drift using geometric Brownian motion
                // dS = S * (μ*dt + σ*dW) where μ is drift, σ is volatility, dW is random normal
                const randomReturn = this.randomNormal(weeklyDrift, volatility);
                currentPrice = currentPrice * Math.exp(randomReturn);
                path.push(currentPrice);
                
                // Apply volume discount at each step
                const discountedPrice = currentPrice * (1 - volumeDiscount);
                discountedPath.push(discountedPrice);
            }
            
            pricePaths.push(path);
            finalPrices.push(currentPrice);
            
            // Calculate synthetic contract price: average of all weekly discounted prices
            const syntheticContractPrice = discountedPath.reduce((sum, price) => sum + price, 0) / discountedPath.length;
            syntheticContractPrices.push(syntheticContractPrice);
        }

        // Calculate percentiles for each week
        const percentiles = {
            p5: [],
            p25: [],
            p50: [],
            p75: [],
            p95: [],
            mean: []
        };

        for (let week = 0; week < weeks; week++) {
            const weekPrices = pricePaths.map(path => path[week]).sort((a, b) => a - b);
            
            percentiles.p5.push(this.percentile(weekPrices, 5));
            percentiles.p25.push(this.percentile(weekPrices, 25));
            percentiles.p50.push(this.percentile(weekPrices, 50));
            percentiles.p75.push(this.percentile(weekPrices, 75));
            percentiles.p95.push(this.percentile(weekPrices, 95));
            percentiles.mean.push(weekPrices.reduce((a, b) => a + b, 0) / weekPrices.length);
        }

        return {
            pricePaths,
            finalPrices,
            syntheticContractPrices,
            percentiles,
            weeks,
            forecastedRate,
            initialSpot,
            weeklyDrift,
            volumeDiscount
        };
    }

    percentile(arr, p) {
        const sorted = [...arr].sort((a, b) => a - b);
        const index = (p / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        
        if (lower === upper) {
            return sorted[lower];
        }
        
        return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
    }

    updateChart(results) {
        try {
            console.log('Updating chart...');
            const ctx = document.getElementById('priceChart').getContext('2d');
            
            if (!ctx) {
                throw new Error('Chart canvas not found');
            }
            
            if (this.chart) {
                this.chart.destroy();
            }

            const weeks = Array.from({length: results.weeks}, (_, i) => i);

            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: weeks,
                    datasets: [
                        {
                            label: '5th-95th Percentile',
                            data: weeks.map(i => results.percentiles.p95[i]),
                            borderColor: 'rgba(165, 165, 165, 0.5)',
                            backgroundColor: 'rgba(165, 165, 165, 0.2)',
                            fill: '+1',
                            pointRadius: 0,
                            borderWidth: 1
                        },
                        {
                            label: '5th Percentile',
                            data: weeks.map(i => results.percentiles.p5[i]),
                            borderColor: 'rgba(165, 165, 165, 0.5)',
                            backgroundColor: 'rgba(165, 165, 165, 0.2)',
                            fill: false,
                            pointRadius: 0,
                            borderWidth: 1
                        },
                        {
                            label: '25th-75th Percentile',
                            data: weeks.map(i => results.percentiles.p75[i]),
                            borderColor: 'rgba(91, 155, 213, 0.7)',
                            backgroundColor: 'rgba(91, 155, 213, 0.3)',
                            fill: '+1',
                            pointRadius: 0,
                            borderWidth: 2
                        },
                        {
                            label: '25th Percentile',
                            data: weeks.map(i => results.percentiles.p25[i]),
                            borderColor: 'rgba(91, 155, 213, 0.7)',
                            backgroundColor: 'rgba(91, 155, 213, 0.3)',
                            fill: false,
                            pointRadius: 0,
                            borderWidth: 2
                        },
                        {
                            label: 'Mean Price',
                            data: weeks.map(i => results.percentiles.mean[i]),
                            borderColor: '#4472C4',
                            backgroundColor: '#4472C4',
                            fill: false,
                            pointRadius: 2,
                            borderWidth: 3
                        },
                        {
                            label: 'Mean Contract Price',
                            data: weeks.map(() => {
                                const contractPrices = results.syntheticContractPrices;
                                const meanContractPrice = contractPrices.reduce((a, b) => a + b, 0) / contractPrices.length;
                                return meanContractPrice;
                            }),
                            borderColor: '#ED7D31',
                            backgroundColor: '#ED7D31',
                            fill: false,
                            pointRadius: 0,
                            borderWidth: 3,
                            borderDash: [15, 5]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 20,
                            bottom: 20,
                            left: 10,
                            right: 10
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Weeks',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                display: true,
                                color: 'rgba(0,0,0,0.05)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Price ($)',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                display: true,
                                color: 'rgba(0,0,0,0.05)'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Simulated Spot Price Evolution (13-Week Market Forecast)',
                            font: {
                                size: 18,
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                padding: 15,
                                usePointStyle: true
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    elements: {
                        point: {
                            hoverRadius: 6
                        }
                    }
                }
            });
            console.log('Chart updated successfully');
        } catch (error) {
            console.error('Error updating chart:', error);
            throw error;
        }
    }

    updateStatistics(results, initialSpot, forecastedRate) {
        try {
            console.log('Updating statistics...');
            const finalPrices = results.finalPrices.sort((a, b) => a - b);
            const mean = finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length;
            const median = this.percentile(finalPrices, 50);
            const p5 = this.percentile(finalPrices, 5);
            const p95 = this.percentile(finalPrices, 95);
            
            // Price statistics
            const priceStatsHTML = `
                <div class="stat-item">
                    <span class="stat-label">Mean Final Price</span>
                    <span class="stat-value">$${mean.toFixed(0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Median Final Price</span>
                    <span class="stat-value">$${median.toFixed(0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Price Range</span>
                    <span class="stat-value">$${(p95 - p5).toFixed(0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Standard Deviation</span>
                    <span class="stat-value">$${Math.sqrt(finalPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / finalPrices.length).toFixed(0)}</span>
                </div>
            `;

            // New Business-Focused Risk Metrics
            const contractWeeks = results.weeks;
            
            // Calculate total costs for comparison
            const contractPrices = results.syntheticContractPrices;
            const meanContractPrice = contractPrices.reduce((a, b) => a + b, 0) / contractPrices.length;
            const totalContractCost = meanContractPrice * contractWeeks;
            
            // Calculate total spot costs for each simulation
            const totalSpotCosts = results.pricePaths.map(path => 
                path.reduce((sum, price) => sum + price, 0)
            );
            const meanTotalSpotCost = totalSpotCosts.reduce((a, b) => a + b, 0) / totalSpotCosts.length;
            const medianTotalSpotCost = this.percentile(totalSpotCosts, 50);
            
            // Probability analysis
            const contractCheaperCount = totalSpotCosts.filter(spotCost => totalContractCost < spotCost).length;
            const probContractCheaper = (contractCheaperCount / totalSpotCosts.length) * 100;
            
            // Average savings (negative means contract costs more)
            const avgSavings = meanTotalSpotCost - totalContractCost;
            const savingsPerWeek = avgSavings / contractWeeks;
            
            // Threshold probabilities (business-relevant)
            const threshold1000Above = initialSpot + 1000;
            const threshold1000Below = initialSpot - 1000;
            const probAbove1000 = (finalPrices.filter(p => p > threshold1000Above).length / finalPrices.length) * 100;
            const probBelow1000 = (finalPrices.filter(p => p < threshold1000Below).length / finalPrices.length) * 100;
            
            const riskMetricsHTML = `
                <div class="stat-item">
                    <span class="stat-label">95th Percentile (High Case)</span>
                    <span class="stat-value" title="In the riskiest 5% of simulations, spot ends above this price">$${p95.toFixed(0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">5th Percentile (Low Case)</span>
                    <span class="stat-value" title="In the safest 5% of simulations, spot ends below this price">$${p5.toFixed(0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Chance spot > $${threshold1000Above.toLocaleString()}</span>
                    <span class="stat-value ${probAbove1000 > 25 ? 'positive' : ''}">${probAbove1000.toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Chance spot < $${threshold1000Below.toLocaleString()}</span>
                    <span class="stat-value ${probBelow1000 > 25 ? 'negative' : ''}">${probBelow1000.toFixed(1)}%</span>
                </div>
            `;

            const priceStatsEl = document.getElementById('priceStats');
            const riskMetricsEl = document.getElementById('riskMetrics');
            
            if (!priceStatsEl || !riskMetricsEl) {
                throw new Error('Statistics containers not found in DOM');
            }

            priceStatsEl.innerHTML = priceStatsHTML;
            riskMetricsEl.innerHTML = riskMetricsHTML;
            
            // Store data for contract statistics update
            this.totalCostData = {
                totalContractCost,
                meanTotalSpotCost,
                medianTotalSpotCost,
                probContractCheaper,
                avgSavings,
                savingsPerWeek,
                contractWeeks
            };
            
            console.log('Statistics updated successfully');
        } catch (error) {
            console.error('Error updating statistics:', error);
            throw error;
        }
    }

    updateContractStatistics(results, volumeDiscount) {
        try {
            console.log('Updating contract statistics...');
            
            // Use the total cost data calculated in updateStatistics
            if (!this.totalCostData) {
                console.error('Total cost data not available');
                return;
            }
            
            const {
                totalContractCost,
                meanTotalSpotCost,
                medianTotalSpotCost,
                probContractCheaper,
                avgSavings,
                savingsPerWeek,
                contractWeeks
            } = this.totalCostData;
            
            // Format savings display
            const savingsText = avgSavings >= 0 ? 
                `+$${Math.abs(avgSavings).toFixed(0)}` : 
                `−$${Math.abs(avgSavings).toFixed(0)}`;
            const savingsClass = avgSavings >= 0 ? 'positive' : 'negative';
            const savingsDescription = avgSavings >= 0 ? 'savings' : 'extra cost';
            
            // Total Payout Comparison
            const contractStatsHTML = `
                <div class="stat-item">
                    <span class="stat-label">Contract (${contractWeeks}-week total)</span>
                    <span class="stat-value">$${totalContractCost.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Spot (mean total)</span>
                    <span class="stat-value">$${meanTotalSpotCost.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Contract cheaper in</span>
                    <span class="stat-value ${probContractCheaper > 50 ? 'positive' : 'negative'}">${probContractCheaper.toFixed(1)}% of scenarios</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Avg contract ${savingsDescription}</span>
                    <span class="stat-value ${savingsClass}" title="Negative means contract costs more">${savingsText}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Average spot rate</span>
                    <span class="stat-value">$${(meanTotalSpotCost / contractWeeks).toFixed(0)}/week</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Per week impact</span>
                    <span class="stat-value ${savingsClass}">$${Math.abs(savingsPerWeek).toFixed(0)}/week</span>
                </div>
            `;

            const contractStatsEl = document.getElementById('contractStats');
            
            if (!contractStatsEl) {
                throw new Error('Contract statistics container not found in DOM');
            }

            contractStatsEl.innerHTML = contractStatsHTML;
            
            console.log('Contract statistics updated successfully');
        } catch (error) {
            console.error('Error updating contract statistics:', error);
            throw error;
        }
    }

    updateSuggestedRates(initialSpot, forecastedRate, volatility, weeklyDrift, nSimulations, volumeDiscount) {
        try {
            console.log('Calculating suggested contract rates...');
            
            // Get the current contract duration from the main simulation
            const currentWeeks = parseInt(document.getElementById('weeks').value);
            
            let oneMonthRate, threeMonthRate;
            
            // Calculate 1-month (4-week) contract rate
            if (currentWeeks === 4) {
                // Use main simulation results if current duration is 4 weeks
                if (!this.lastSimulationResults || !this.lastSimulationResults.syntheticContractPrices) {
                    throw new Error('Main simulation results not available for 1-month rate calculation');
                }
                oneMonthRate = this.lastSimulationResults.syntheticContractPrices.reduce((a, b) => a + b, 0) / this.lastSimulationResults.syntheticContractPrices.length;
                console.log('Using main simulation results for 1-month rate:', oneMonthRate);
            } else {
                // Run separate simulation for 4 weeks using EXACT same parameters as main simulation
                const oneMonthResults = this.monteCarloSimulation(
                    initialSpot, 
                    forecastedRate, 
                    volatility, 
                    weeklyDrift, 
                    4,
                    Math.min(nSimulations, 5000),
                    volumeDiscount
                );
                oneMonthRate = oneMonthResults.syntheticContractPrices.reduce((a, b) => a + b, 0) / oneMonthResults.syntheticContractPrices.length;
                console.log('Calculated separate 1-month rate:', oneMonthRate);
            }
            
            // Calculate 3-month (13-week) contract rate
            if (currentWeeks === 13) {
                // Use main simulation results if current duration is 13 weeks
                if (!this.lastSimulationResults || !this.lastSimulationResults.syntheticContractPrices) {
                    throw new Error('Main simulation results not available for 3-month rate calculation');
                }
                threeMonthRate = this.lastSimulationResults.syntheticContractPrices.reduce((a, b) => a + b, 0) / this.lastSimulationResults.syntheticContractPrices.length;
                console.log('Using main simulation results for 3-month rate:', threeMonthRate);
            } else {
                // Run separate simulation for 13 weeks using EXACT same parameters as main simulation
                const threeMonthResults = this.monteCarloSimulation(
                    initialSpot, 
                    forecastedRate, 
                    volatility, 
                    weeklyDrift, 
                    13,
                    Math.min(nSimulations, 5000),
                    volumeDiscount
                );
                threeMonthRate = threeMonthResults.syntheticContractPrices.reduce((a, b) => a + b, 0) / threeMonthResults.syntheticContractPrices.length;
                console.log('Calculated separate 3-month rate:', threeMonthRate);
            }
            
            // Verify that when current duration is 13 weeks, the 3-month rate matches the main contract price
            if (currentWeeks === 13) {
                const mainContractPrice = this.lastSimulationResults.syntheticContractPrices.reduce((a, b) => a + b, 0) / this.lastSimulationResults.syntheticContractPrices.length;
                console.log('Verification - Main contract price:', mainContractPrice, '3-month rate:', threeMonthRate, 'Match:', Math.abs(mainContractPrice - threeMonthRate) < 0.01);
            }
            
            // Calculate rate difference and percentage
            const rateDifference = threeMonthRate - oneMonthRate;
            const rateIncrease = ((threeMonthRate / oneMonthRate - 1) * 100);
            
            // Display suggested rates
            const suggestedRatesHTML = `
                <div class="stat-item">
                    <span class="stat-label">1-Month Contract Rate</span>
                    <span class="stat-value">$${oneMonthRate.toFixed(0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">3-Month Contract Rate</span>
                    <span class="stat-value">$${threeMonthRate.toFixed(0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Rate Difference</span>
                    <span class="stat-value ${rateDifference > 0 ? 'positive' : 'negative'}">$${rateDifference.toFixed(0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">3M vs 1M Premium</span>
                    <span class="stat-value ${rateIncrease > 0 ? 'positive' : 'negative'}">${rateIncrease.toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Based on Forecast</span>
                    <span class="stat-value">$${forecastedRate.toFixed(0)} (13w)</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Volume Discount</span>
                    <span class="stat-value">${(volumeDiscount * 100).toFixed(1)}%</span>
                </div>
            `;

            const suggestedRatesEl = document.getElementById('suggestedRates');
            
            if (!suggestedRatesEl) {
                throw new Error('Suggested rates container not found in DOM');
            }

            suggestedRatesEl.innerHTML = suggestedRatesHTML;
            
            console.log('Suggested contract rates updated successfully', {
                oneMonthRate: oneMonthRate.toFixed(0),
                threeMonthRate: threeMonthRate.toFixed(0),
                rateDifference: rateDifference.toFixed(0),
                volatilityUsed: (volatility * 100).toFixed(1) + '%',
                currentWeeks: currentWeeks,
                usedMainResults: currentWeeks === 4 || currentWeeks === 13
            });
        } catch (error) {
            console.error('Error updating suggested rates:', error);
            // Don't re-throw to prevent breaking the entire simulation
            
            // Show error message in the panel
            const suggestedRatesEl = document.getElementById('suggestedRates');
            if (suggestedRatesEl) {
                suggestedRatesEl.innerHTML = `
                    <div class="stat-item">
                        <span class="stat-label">Error</span>
                        <span class="stat-value negative">Failed to calculate</span>
                    </div>
                `;
            }
        }
    }

    runInitialSimulation() {
        try {
            console.log('Running initial simulation...');
            // Check if all required elements exist before running
            const requiredElements = ['initialSpot', 'forecastedRate', 'volatility', 'weeks', 'simulations', 'volumeDiscount', 'priceStats', 'riskMetrics', 'contractStats', 'suggestedRates'];
            const missingElements = requiredElements.filter(id => !document.getElementById(id));
            
            if (missingElements.length > 0) {
                console.warn('Missing elements for initial simulation:', missingElements);
                return;
            }
            
            // Run simulation with default values on page load
            this.performSimulation();
        } catch (error) {
            console.error('Error in initial simulation:', error);
            // Don't show alert on initial load, just log the error
        }
    }

    // Scenario Management Methods
    getCurrentScenarioData() {
        return {
            name: document.getElementById('scenarioName').value || 'Unnamed Scenario',
            initialSpot: parseFloat(document.getElementById('initialSpot').value),
            forecastedRate: parseFloat(document.getElementById('forecastedRate').value),
            volatility: parseFloat(document.getElementById('volatility').value),
            weeks: parseInt(document.getElementById('weeks').value),
            simulations: parseInt(document.getElementById('simulations').value),
            volumeDiscount: parseFloat(document.getElementById('volumeDiscount').value),
            timestamp: new Date().toISOString()
        };
    }

    saveScenario() {
        try {
            console.log('Save scenario button clicked');
            const scenarioData = this.getCurrentScenarioData();
            console.log('Current scenario data:', scenarioData);
            
            if (!scenarioData.name.trim()) {
                alert('Please enter a scenario name');
                return;
            }

            // Check if scenario name already exists
            const existingScenario = this.savedScenarios.find(s => s.name === scenarioData.name);
            if (existingScenario) {
                if (!confirm(`Scenario "${scenarioData.name}" already exists. Overwrite?`)) {
                    return;
                }
                // Remove existing scenario
                this.savedScenarios = this.savedScenarios.filter(s => s.name !== scenarioData.name);
                console.log('Removing existing scenario:', scenarioData.name);
            }

            this.savedScenarios.push(scenarioData);
            console.log('Saved scenarios:', this.savedScenarios.length);
            
            this.saveScenariosToStorage();
            this.updateScenarioDropdown();
            this.updateComparisonTable(); // Always update comparison table
            this.updateDebugInfo(); // Update debug info
            
            // Clear the scenario name field
            document.getElementById('scenarioName').value = '';
            
            console.log(`Scenario "${scenarioData.name}" saved successfully`);
            
            // If comparison is visible, make sure it updates
            if (this.comparisonVisible) {
                setTimeout(() => this.updateComparisonTable(), 100);
            }
        } catch (error) {
            console.error('Error saving scenario:', error);
            alert('Error saving scenario: ' + error.message);
        }
    }

    // Add a test scenario for debugging
    addTestScenario() {
        console.log('Adding test scenario');
        const testScenario = {
            name: 'Test Scenario ' + Date.now(),
            initialSpot: 3000,
            forecastedRate: 3200,
            volatility: 3,
            weeks: 13,
            simulations: 10000,
            volumeDiscount: 5,
            timestamp: new Date().toISOString()
        };
        
        this.savedScenarios.push(testScenario);
        this.updateScenarioDropdown();
        this.updateComparisonTable();
        this.updateDebugInfo();
        
        console.log('Test scenario added:', testScenario.name);
        return testScenario;
    }

    loadScenario() {
        try {
            const selectedName = document.getElementById('savedScenarios').value;
            if (!selectedName) return;

            const scenario = this.savedScenarios.find(s => s.name === selectedName);
            if (!scenario) {
                alert('Scenario not found');
                return;
            }

            // Load scenario data into form
            document.getElementById('initialSpot').value = scenario.initialSpot;
            document.getElementById('forecastedRate').value = scenario.forecastedRate;
            document.getElementById('volatility').value = scenario.volatility;
            document.getElementById('weeks').value = scenario.weeks;
            document.getElementById('simulations').value = scenario.simulations;
            document.getElementById('volumeDiscount').value = scenario.volumeDiscount;

            console.log(`Scenario "${selectedName}" loaded successfully`);
            
            // Automatically run simulation with loaded data
            this.runSimulation();
        } catch (error) {
            console.error('Error loading scenario:', error);
            alert('Error loading scenario: ' + error.message);
        }
    }

    deleteScenario() {
        try {
            const selectedName = document.getElementById('savedScenarios').value;
            if (!selectedName) {
                alert('Please select a scenario to delete');
                return;
            }

            if (confirm(`Are you sure you want to delete scenario "${selectedName}"?`)) {
                this.savedScenarios = this.savedScenarios.filter(s => s.name !== selectedName);
                this.saveScenariosToStorage();
                this.updateScenarioDropdown();
                this.updateComparisonTable();
                console.log(`Scenario "${selectedName}" deleted successfully`);
            }
        } catch (error) {
            console.error('Error deleting scenario:', error);
            alert('Error deleting scenario: ' + error.message);
        }
    }

    loadScenariosFromStorage() {
        if (!this.storageAvailable) {
            console.warn('localStorage not available, using memory storage');
            return this.savedScenarios || [];
        }
        
        try {
            const stored = localStorage.getItem('contractSimulatorScenarios');
            const scenarios = stored ? JSON.parse(stored) : [];
            console.log('Loaded from localStorage:', scenarios);
            return scenarios;
        } catch (error) {
            console.error('Error loading scenarios from storage:', error);
            return [];
        }
    }

    saveScenariosToStorage() {
        if (!this.storageAvailable) {
            console.warn('localStorage not available, storing in memory only');
            return;
        }
        
        try {
            localStorage.setItem('contractSimulatorScenarios', JSON.stringify(this.savedScenarios));
            console.log('Saved to localStorage:', this.savedScenarios.length, 'scenarios');
        } catch (error) {
            console.error('Error saving scenarios to storage:', error);
        }
    }

    updateScenarioDropdown() {
        const dropdown = document.getElementById('savedScenarios');
        if (!dropdown) return;

        // Clear existing options except the first one
        dropdown.innerHTML = '<option value="">-- Select Scenario --</option>';

        // Add saved scenarios
        this.savedScenarios.forEach(scenario => {
            const option = document.createElement('option');
            option.value = scenario.name;
            option.textContent = scenario.name;
            dropdown.appendChild(option);
        });
    }

    toggleComparison() {
        this.comparisonVisible = !this.comparisonVisible;
        const comparisonSection = document.getElementById('comparisonSection');
        const toggleButton = document.getElementById('toggleComparison');
        
        console.log('Toggling comparison view:', this.comparisonVisible);
        
        if (this.comparisonVisible) {
            comparisonSection.classList.remove('hidden');
            toggleButton.textContent = 'Hide Comparison';
            this.updateComparisonTable();
            console.log('Comparison table shown');
        } else {
            comparisonSection.classList.add('hidden');
            toggleButton.textContent = 'Compare Scenarios';
            console.log('Comparison table hidden');
        }
    }

    updateComparisonTable() {
        const tableBody = document.getElementById('comparisonTableBody');
        if (!tableBody) {
            console.warn('Comparison table body not found');
            return;
        }

        console.log('Updating comparison table with', this.savedScenarios.length, 'scenarios');

        // Clear existing rows
        tableBody.innerHTML = '';

        if (this.savedScenarios.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 9;
            cell.textContent = 'No saved scenarios to compare. Save some scenarios first!';
            cell.style.textAlign = 'center';
            cell.style.fontStyle = 'italic';
            cell.style.color = '#6c757d';
            cell.style.padding = '20px';
            return;
        }

        // Add rows for each saved scenario
        this.savedScenarios.forEach((scenario, index) => {
            console.log(`Adding scenario ${index + 1}:`, scenario.name);
            const row = tableBody.insertRow();
            
            // Calculate contract rates for this scenario using Monte Carlo (consistent with suggested rates)
            const totalDrift = Math.log(scenario.forecastedRate / scenario.initialSpot);
            const weeklyDrift = totalDrift / 13;
            
            // Run Monte Carlo simulations for accurate rates that include volatility
            const oneMonthResults = this.monteCarloSimulation(
                scenario.initialSpot,
                scenario.forecastedRate,
                scenario.volatility / 100, // Convert percentage to decimal
                weeklyDrift,
                4, // 4 weeks
                1000, // Smaller simulation count for performance in comparison table
                scenario.volumeDiscount / 100 // Convert percentage to decimal
            );
            const oneMonthRate = oneMonthResults.syntheticContractPrices.reduce((a, b) => a + b, 0) / oneMonthResults.syntheticContractPrices.length;
            
            const threeMonthResults = this.monteCarloSimulation(
                scenario.initialSpot,
                scenario.forecastedRate,
                scenario.volatility / 100, // Convert percentage to decimal
                weeklyDrift,
                13, // 13 weeks
                1000, // Smaller simulation count for performance in comparison table
                scenario.volumeDiscount / 100 // Convert percentage to decimal
            );
            const threeMonthRate = threeMonthResults.syntheticContractPrices.reduce((a, b) => a + b, 0) / threeMonthResults.syntheticContractPrices.length;
            
            const rateDifference = threeMonthRate - oneMonthRate;
            const premium = ((threeMonthRate / oneMonthRate - 1) * 100);

            // Populate cells
            row.insertCell().textContent = scenario.name;
            row.insertCell().textContent = `$${scenario.initialSpot.toFixed(0)}`;
            row.insertCell().textContent = `$${scenario.forecastedRate.toFixed(0)}`;
            row.insertCell().textContent = `${scenario.volatility.toFixed(1)}%`;
            row.insertCell().textContent = `${scenario.volumeDiscount.toFixed(1)}%`;
            row.insertCell().textContent = `$${oneMonthRate.toFixed(0)}`;
            row.insertCell().textContent = `$${threeMonthRate.toFixed(0)}`;
            
            const diffCell = row.insertCell();
            diffCell.textContent = `$${rateDifference.toFixed(0)}`;
            diffCell.className = rateDifference > 0 ? 'positive' : 'negative';
            
            const premiumCell = row.insertCell();
            premiumCell.textContent = `${premium.toFixed(1)}%`;
            premiumCell.className = premium > 0 ? 'positive' : 'negative';
        });

        console.log('Comparison table updated successfully');
    }

    updateDebugInfo() {
        const debugCount = document.getElementById('debugScenarioCount');
        if (debugCount) {
            debugCount.textContent = this.savedScenarios.length;
        }
        console.log('Debug info updated:', this.savedScenarios.length, 'scenarios');
    }

    updateCostDistributionChart(results) {
        try {
            console.log('Updating cost distribution chart...');
            
            if (!this.totalCostData) {
                console.error('Total cost data not available for distribution chart');
                return;
            }
            
            const canvas = document.getElementById('costDistributionChart');
            if (!canvas) {
                console.error('Cost distribution chart canvas element not found in DOM');
                return;
            }
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('Could not get 2D context from cost distribution chart canvas');
                return;
            }
            
            console.log('Canvas element found, proceeding with chart creation...');
            
            if (this.costDistributionChart) {
                console.log('Destroying existing cost distribution chart...');
                this.costDistributionChart.destroy();
            }

            const { totalContractCost } = this.totalCostData;
            
            // Calculate cost differences for each simulation (spot - contract)
            // Positive values = contract saves money (contract cheaper than spot)
            // Negative values = contract costs more (spot cheaper than contract)
            const totalSpotCosts = results.pricePaths.map(path => 
                path.reduce((sum, price) => sum + price, 0)
            );
            
            const costDifferences = totalSpotCosts.map(spotCost => spotCost - totalContractCost);
            
            // Create histogram bins
            const minDiff = Math.min(...costDifferences);
            const maxDiff = Math.max(...costDifferences);
            const nBins = 30;
            const binWidth = (maxDiff - minDiff) / nBins;
            const bins = Array(nBins).fill(0);
            const binLabels = [];
            
            // Populate bins
            costDifferences.forEach(diff => {
                let binIndex = Math.floor((diff - minDiff) / binWidth);
                if (binIndex >= nBins) binIndex = nBins - 1;
                if (binIndex < 0) binIndex = 0;
                bins[binIndex]++;
            });
            
            // Create bin labels (center of each bin)
            for (let i = 0; i < nBins; i++) {
                const binCenter = minDiff + (i + 0.5) * binWidth;
                binLabels.push(binCenter.toFixed(0));
            }
            
            // Calculate key statistics - should match Total Cost Comparison
            const savingsCount = costDifferences.filter(diff => diff > 0).length;
            const lossCount = costDifferences.filter(diff => diff < 0).length;
            const probSavings = (savingsCount / costDifferences.length) * 100;
            const avgDiff = costDifferences.reduce((a, b) => a + b, 0) / costDifferences.length;
            
            // Color bins based on savings (green) vs losses (red)
            const binColors = binLabels.map(label => {
                const value = parseFloat(label);
                if (value > 0) {
                    return 'rgba(112, 173, 71, 0.8)'; // Green for savings (contract cheaper)
                } else if (value < 0) {
                    return 'rgba(237, 125, 49, 0.8)'; // Orange for losses (contract more expensive)
                } else {
                    return 'rgba(165, 165, 165, 0.8)'; // Gray for neutral
                }
            });

            this.costDistributionChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: binLabels,
                    datasets: [{
                        label: 'Frequency',
                        data: bins,
                        backgroundColor: binColors,
                        borderColor: binColors.map(color => color.replace('0.8', '1')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 20,
                            bottom: 20,
                            left: 10,
                            right: 10
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Contract Savings vs Spot ($) - Positive = Contract Saves Money',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                display: true,
                                color: 'rgba(0,0,0,0.05)'
                            },
                            ticks: {
                                maxTicksLimit: 10,
                                callback: function(value, index) {
                                    const label = this.getLabelForValue(value);
                                    return '$' + parseFloat(label).toFixed(0);
                                }
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Number of Simulations',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                display: true,
                                color: 'rgba(0,0,0,0.05)'
                            },
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `Contract vs Spot Cost Distribution (${probSavings.toFixed(1)}% scenarios favor contract)`,
                            font: {
                                size: 18,
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    const value = parseFloat(context[0].label);
                                    if (value > 0) {
                                        return `Contract saves $${Math.abs(value).toFixed(0)}`;
                                    } else if (value < 0) {
                                        return `Contract costs $${Math.abs(value).toFixed(0)} more`;
                                    } else {
                                        return 'Break-even';
                                    }
                                },
                                label: function(context) {
                                    const freq = context.parsed.y;
                                    const percent = (freq / costDifferences.length * 100).toFixed(1);
                                    return `${freq} simulations (${percent}%)`;
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
            
            console.log('Cost distribution chart updated successfully', {
                probSavings: probSavings.toFixed(1) + '%',
                avgDiff: '$' + avgDiff.toFixed(0),
                savingsCount,
                lossCount,
                totalSimulations: costDifferences.length
            });
            
            console.log('✅ Cost distribution chart created and rendered successfully');
        } catch (error) {
            console.error('Error updating cost distribution chart:', error);
            // Don't throw to prevent breaking the entire simulation
        }
    }
}
