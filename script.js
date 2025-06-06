class MarketSimulator {
    constructor() {
        this.chart = null;
        this.initializeEventListeners();
        this.runInitialSimulation();
    }

    initializeEventListeners() {
        const runButton = document.getElementById('runSimulation');
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
        const container = document.querySelector('.container');
        container.classList.add('loading');
        
        // Small delay to show loading state
        setTimeout(() => {
            this.performSimulation();
            container.classList.remove('loading');
        }, 100);
    }

    performSimulation() {
        // Get input values
        const initialSpot = parseFloat(document.getElementById('initialSpot').value);
        const contractRate = parseFloat(document.getElementById('contractRate').value);
        const volatility = parseFloat(document.getElementById('volatility').value) / 100; // Convert percentage to decimal
        const weeks = parseInt(document.getElementById('weeks').value);
        const nSimulations = parseInt(document.getElementById('simulations').value);

        // Validate inputs
        if (isNaN(initialSpot) || isNaN(contractRate) || isNaN(volatility) || isNaN(weeks) || isNaN(nSimulations)) {
            alert('Please ensure all fields contain valid numbers.');
            return;
        }

        // Run Monte Carlo simulation
        const results = this.monteCarloSimulation(initialSpot, contractRate, volatility, weeks, nSimulations);
        
        // Update chart and statistics
        this.updateChart(results);
        this.updateStatistics(results, initialSpot, contractRate);
    }

    monteCarloSimulation(initialSpot, contractRate, volatility, weeks, nSimulations) {
        const pricePaths = [];
        const finalPrices = [];

        for (let sim = 0; sim < nSimulations; sim++) {
            const path = [initialSpot];
            let currentPrice = initialSpot;

            for (let week = 1; week < weeks; week++) {
                // Generate random return using lognormal distribution
                const randomReturn = this.randomNormal(0, volatility);
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
            contractRate,
            initialSpot
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
        const ctx = document.getElementById('priceChart').getContext('2d');
        
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
                        label: 'Contract Rate',
                        data: weeks.map(() => results.contractRate),
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
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Weeks'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Price ($)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Simulated Spot Price Evolution vs Contract Rate',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    updateStatistics(results, initialSpot, contractRate) {
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
        const probAboveContract = (finalPrices.filter(p => p > contractRate).length / finalPrices.length * 100);
        const probBelowContract = (finalPrices.filter(p => p < contractRate).length / finalPrices.length * 100);
        
        const riskMetricsHTML = `
            <div class="stat-item">
                <span class="stat-label">Price > Contract Rate</span>
                <span class="stat-value ${probAboveContract > 50 ? 'positive' : ''}">${probAboveContract.toFixed(1)}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Price < Contract Rate</span>
                <span class="stat-value ${probBelowContract > 50 ? 'negative' : ''}">${probBelowContract.toFixed(1)}%</span>
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

        document.getElementById('priceStats').innerHTML = priceStatsHTML;
        document.getElementById('riskMetrics').innerHTML = riskMetricsHTML;
    }

    runInitialSimulation() {
        // Run simulation with default values on page load
        this.performSimulation();
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', function() {
    new MarketSimulator();
}); 