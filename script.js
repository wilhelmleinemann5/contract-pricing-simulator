class MarketSimulator {
    constructor() {
        this.chart = null;
        this.initializeEventListeners();
        // Only run initial simulation after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.runInitialSimulation();
        }, 100);
    }

    initializeEventListeners() {
        const runButton = document.getElementById('runSimulation');
        if (!runButton) {
            console.error('Run simulation button not found!');
            return;
        }
        runButton.addEventListener('click', () => this.runSimulation());

        // Add enter key support for inputs
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.runSimulation();
                }
            });
        });
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

        // Check if elements exist
        if (!initialSpotEl || !forecastedRateEl || !volatilityEl || !weeksEl || !nSimulationsEl) {
            throw new Error('Required input elements not found in DOM');
        }

        const initialSpot = parseFloat(initialSpotEl.value);
        const forecastedRate = parseFloat(forecastedRateEl.value);
        const volatility = parseFloat(volatilityEl.value) / 100; // Convert percentage to decimal
        const weeks = parseInt(weeksEl.value);
        const nSimulations = parseInt(nSimulationsEl.value);

        console.log('Input values:', { initialSpot, forecastedRate, volatility, weeks, nSimulations });

        // Validate inputs
        if (isNaN(initialSpot) || isNaN(forecastedRate) || isNaN(volatility) || isNaN(weeks) || isNaN(nSimulations)) {
            throw new Error('Please ensure all fields contain valid numbers.');
        }

        if (initialSpot <= 0 || forecastedRate <= 0 || volatility < 0 || weeks <= 0 || nSimulations <= 0) {
            throw new Error('All values must be positive numbers.');
        }

        // Calculate drift parameter: ln(forecasted_rate/starting_rate) / weeks
        const totalDrift = Math.log(forecastedRate / initialSpot);
        const weeklyDrift = totalDrift / weeks;

        console.log('Drift calculation:', { totalDrift, weeklyDrift });

        // Run Monte Carlo simulation
        const results = this.monteCarloSimulation(initialSpot, forecastedRate, volatility, weeklyDrift, weeks, nSimulations);
        
        console.log('Simulation results:', results);

        // Update chart and statistics
        this.updateChart(results);
        this.updateStatistics(results, initialSpot, forecastedRate);
        
        console.log('Simulation completed successfully');
    }

    monteCarloSimulation(initialSpot, forecastedRate, volatility, weeklyDrift, weeks, nSimulations) {
        const pricePaths = [];
        const finalPrices = [];

        for (let sim = 0; sim < nSimulations; sim++) {
            const path = [initialSpot];
            let currentPrice = initialSpot;

            for (let week = 1; week < weeks; week++) {
                // Generate random return with drift using geometric Brownian motion
                // dS = S * (μ*dt + σ*dW) where μ is drift, σ is volatility, dW is random normal
                const randomReturn = this.randomNormal(weeklyDrift, volatility);
                currentPrice = currentPrice * Math.exp(randomReturn);
                path.push(currentPrice);
            }
            
            pricePaths.push(path);
            finalPrices.push(currentPrice);
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
            percentiles,
            weeks,
            forecastedRate,
            initialSpot,
            weeklyDrift
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
                            borderColor: 'rgba(200, 200, 200, 0.5)',
                            backgroundColor: 'rgba(200, 200, 200, 0.2)',
                            fill: '+1',
                            pointRadius: 0,
                            borderWidth: 1
                        },
                        {
                            label: '5th Percentile',
                            data: weeks.map(i => results.percentiles.p5[i]),
                            borderColor: 'rgba(200, 200, 200, 0.5)',
                            backgroundColor: 'rgba(200, 200, 200, 0.2)',
                            fill: false,
                            pointRadius: 0,
                            borderWidth: 1
                        },
                        {
                            label: '25th-75th Percentile',
                            data: weeks.map(i => results.percentiles.p75[i]),
                            borderColor: 'rgba(100, 150, 200, 0.7)',
                            backgroundColor: 'rgba(100, 150, 200, 0.3)',
                            fill: '+1',
                            pointRadius: 0,
                            borderWidth: 2
                        },
                        {
                            label: '25th Percentile',
                            data: weeks.map(i => results.percentiles.p25[i]),
                            borderColor: 'rgba(100, 150, 200, 0.7)',
                            backgroundColor: 'rgba(100, 150, 200, 0.3)',
                            fill: false,
                            pointRadius: 0,
                            borderWidth: 2
                        },
                        {
                            label: 'Median Price',
                            data: weeks.map(i => results.percentiles.p50[i]),
                            borderColor: '#2c3e50',
                            backgroundColor: '#2c3e50',
                            fill: false,
                            pointRadius: 2,
                            borderWidth: 3,
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Mean Price',
                            data: weeks.map(i => results.percentiles.mean[i]),
                            borderColor: '#3498db',
                            backgroundColor: '#3498db',
                            fill: false,
                            pointRadius: 2,
                            borderWidth: 3
                        },
                        {
                            label: 'Forecasted Rate',
                            data: weeks.map(() => results.forecastedRate),
                            borderColor: '#27ae60',
                            backgroundColor: '#27ae60',
                            fill: false,
                            pointRadius: 0,
                            borderWidth: 3,
                            borderDash: [10, 5]
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
                                color: 'rgba(0,0,0,0.1)'
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
                                color: 'rgba(0,0,0,0.1)'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Simulated Spot Price Evolution vs Forecasted Rate',
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
                    <span class="stat-label">5th Percentile</span>
                    <span class="stat-value">$${p5.toFixed(0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">95th Percentile</span>
                    <span class="stat-value">$${p95.toFixed(0)}</span>
                </div>
            `;

            // Risk metrics
            const probAbove50pct = (finalPrices.filter(p => p > initialSpot * 1.5).length / finalPrices.length * 100);
            const probBelow50pct = (finalPrices.filter(p => p < initialSpot * 0.5).length / finalPrices.length * 100);
            const probAboveForecast = (finalPrices.filter(p => p > forecastedRate).length / finalPrices.length * 100);
            const probBelowForecast = (finalPrices.filter(p => p < forecastedRate).length / finalPrices.length * 100);
            
            const riskMetricsHTML = `
                <div class="stat-item">
                    <span class="stat-label">Price > Forecast Rate</span>
                    <span class="stat-value ${probAboveForecast > 50 ? 'positive' : ''}">${probAboveForecast.toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Price < Forecast Rate</span>
                    <span class="stat-value ${probBelowForecast > 50 ? 'negative' : ''}">${probBelowForecast.toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Price +50% Higher</span>
                    <span class="stat-value ${probAbove50pct > 10 ? 'positive' : ''}">${probAbove50pct.toFixed(1)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Price -50% Lower</span>
                    <span class="stat-value ${probBelow50pct > 10 ? 'negative' : ''}">${probBelow50pct.toFixed(1)}%</span>
                </div>
            `;

            const priceStatsEl = document.getElementById('priceStats');
            const riskMetricsEl = document.getElementById('riskMetrics');
            
            if (!priceStatsEl || !riskMetricsEl) {
                throw new Error('Statistics containers not found in DOM');
            }

            priceStatsEl.innerHTML = priceStatsHTML;
            riskMetricsEl.innerHTML = riskMetricsHTML;
            
            console.log('Statistics updated successfully');
        } catch (error) {
            console.error('Error updating statistics:', error);
            throw error;
        }
    }

    runInitialSimulation() {
        try {
            console.log('Running initial simulation...');
            // Check if all required elements exist before running
            const requiredElements = ['initialSpot', 'forecastedRate', 'volatility', 'weeks', 'simulations'];
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
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', function() {
    new MarketSimulator();
}); 