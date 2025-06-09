// Demand Curve Analysis Module

class DemandAnalysis {
    constructor() {
        this.demandChart = null;
        this.initializeEventListeners();
        this.setupSupplyCurveControls();
    }

    initializeEventListeners() {
        // Main analysis button
        document.getElementById('analyzeDemand').addEventListener('click', () => this.runAnalysis());
        
        // Add row buttons
        document.getElementById('addBeforeRow').addEventListener('click', () => this.addDataRow('beforeDataTable'));
        document.getElementById('addAfterRow').addEventListener('click', () => this.addDataRow('afterDataTable'));
        
        // Remove row buttons (delegated event handling)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-row-btn')) {
                this.removeDataRow(e.target);
            }
        });
    }
    
    setupSupplyCurveControls() {
        const supplyCurveType = document.getElementById('supplyCurveType');
        const supplySlope = document.getElementById('supplySlope');
        const supplySlopeLabel = document.getElementById('supplySlopeLabel');
        
        supplyCurveType.addEventListener('change', () => {
            const isSloped = supplyCurveType.value === 'sloped';
            supplySlope.style.display = isSloped ? 'block' : 'none';
            supplySlopeLabel.style.display = isSloped ? 'block' : 'none';
        });
    }
    
    addDataRow(tableId) {
        const table = document.getElementById(tableId);
        const tbody = table.querySelector('tbody');
        const newRow = tbody.insertRow();
        
        if (tableId === 'beforeDataTable') {
            newRow.innerHTML = `
                <td><input type="number" value="" min="0" placeholder="Price"></td>
                <td><input type="number" value="" min="0" placeholder="Volume"></td>
                <td><button type="button" class="remove-row-btn">Remove</button></td>
            `;
        } else {
            newRow.innerHTML = `
                <td><input type="number" value="" min="0" placeholder="Price"></td>
                <td><input type="number" value="" min="0" placeholder="Volume"></td>
                <td><input type="checkbox"></td>
                <td><button type="button" class="remove-row-btn">Remove</button></td>
            `;
        }
    }
    
    removeDataRow(button) {
        const row = button.closest('tr');
        const tbody = row.closest('tbody');
        
        // Don't allow removing if it's the last row
        if (tbody.children.length > 1) {
            row.remove();
        } else {
            alert('At least one data point is required.');
        }
    }
    
    getTableData(tableId) {
        const table = document.getElementById(tableId);
        const rows = table.querySelectorAll('tbody tr');
        const data = [];
        const shockPoints = [];
        
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input[type="number"]');
            const price = parseFloat(inputs[0].value);
            const volume = parseFloat(inputs[1].value);
            
            if (!isNaN(price) && !isNaN(volume) && price > 0 && volume > 0) {
                data.push({ price, volume });
                
                // Check if it's marked as shock point (only for after data)
                if (tableId === 'afterDataTable') {
                    const checkbox = row.querySelector('input[type="checkbox"]');
                    if (checkbox && checkbox.checked) {
                        shockPoints.push({ price, volume });
                    }
                }
            }
        });
        
        return { data, shockPoints };
    }
    
    // Power law regression: Volume = a * Price^b
    // Transformed to linear: ln(Volume) = ln(a) + b * ln(Price)
    fitDemandCurve(data) {
        if (data.length < 2) {
            throw new Error('At least 2 data points required for curve fitting');
        }
        
        // Transform data to log space
        const logData = data.map(d => ({
            x: Math.log(d.price),
            y: Math.log(d.volume)
        }));
        
        // Linear regression in log space
        const n = logData.length;
        const sumX = logData.reduce((sum, d) => sum + d.x, 0);
        const sumY = logData.reduce((sum, d) => sum + d.y, 0);
        const sumXY = logData.reduce((sum, d) => sum + d.x * d.y, 0);
        const sumX2 = logData.reduce((sum, d) => sum + d.x * d.x, 0);
        const sumY2 = logData.reduce((sum, d) => sum + d.y * d.y, 0);
        
        // Calculate slope (b) and intercept (ln(a))
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Transform back: a = e^intercept, b = slope
        const a = Math.exp(intercept);
        const b = slope;
        
        // Calculate R-squared
        const meanY = sumY / n;
        const totalSumSquares = logData.reduce((sum, d) => sum + Math.pow(d.y - meanY, 2), 0);
        const residualSumSquares = logData.reduce((sum, d) => {
            const predicted = intercept + slope * d.x;
            return sum + Math.pow(d.y - predicted, 2);
        }, 0);
        const rSquared = 1 - (residualSumSquares / totalSumSquares);
        
        return {
            a: a,
            b: b,
            rSquared: rSquared,
            equation: `Volume = ${a.toFixed(2)} × Price^${b.toFixed(3)}`,
            predict: (price) => a * Math.pow(price, b)
        };
    }
    
    calculateSupplyCurve() {
        const curveType = document.getElementById('supplyCurveType').value;
        const basePrice = parseFloat(document.getElementById('supplyPrice').value);
        const slope = parseFloat(document.getElementById('supplySlope').value) || 0;
        
        return {
            type: curveType,
            basePrice: basePrice,
            slope: slope,
            predict: (volume) => {
                if (curveType === 'flat') {
                    return basePrice;
                } else {
                    return basePrice + slope * volume;
                }
            }
        };
    }
    
    findMarketClearing(demandCurve, supplyCurve) {
        // Numerical method to find intersection
        let bestPrice = null;
        let bestVolume = null;
        let minDifference = Infinity;
        
        // Search across reasonable price range
        const minPrice = supplyCurve.basePrice;
        const maxPrice = minPrice * 3;
        const steps = 1000;
        const priceStep = (maxPrice - minPrice) / steps;
        
        for (let i = 0; i <= steps; i++) {
            const price = minPrice + i * priceStep;
            const demandVolume = demandCurve.predict(price);
            const supplyPrice = supplyCurve.predict(demandVolume);
            
            const difference = Math.abs(price - supplyPrice);
            
            if (difference < minDifference) {
                minDifference = difference;
                bestPrice = price;
                bestVolume = demandVolume;
            }
        }
        
        return {
            price: bestPrice,
            volume: bestVolume,
            difference: minDifference
        };
    }
    
    generateCurvePoints(curve, minPrice, maxPrice, points = 100) {
        const step = (maxPrice - minPrice) / (points - 1);
        const curvePoints = [];
        
        for (let i = 0; i < points; i++) {
            const price = minPrice + i * step;
            const volume = curve.predict(price);
            if (volume > 0) {
                curvePoints.push({ x: price, y: volume });
            }
        }
        
        return curvePoints;
    }
    
    generateSupplyCurvePoints(supplyCurve, maxVolume, points = 100) {
        const step = maxVolume / (points - 1);
        const curvePoints = [];
        
        for (let i = 0; i < points; i++) {
            const volume = i * step;
            const price = supplyCurve.predict(volume);
            curvePoints.push({ x: price, y: volume });
        }
        
        return curvePoints;
    }
    
    runAnalysis() {
        try {
            console.log('Running demand curve analysis...');
            
            // Get data from tables
            const beforeResult = this.getTableData('beforeDataTable');
            const afterResult = this.getTableData('afterDataTable');
            
            if (beforeResult.data.length < 2) {
                alert('Please enter at least 2 data points for before event data.');
                return;
            }
            
            if (afterResult.data.length < 2) {
                alert('Please enter at least 2 data points for after event data.');
                return;
            }
            
            // Fit demand curves
            const beforeCurve = this.fitDemandCurve(beforeResult.data);
            const afterCurve = this.fitDemandCurve(afterResult.data);
            
            // Get supply curve
            const supplyCurve = this.calculateSupplyCurve();
            
            // Find market clearing points
            const beforeEquilibrium = this.findMarketClearing(beforeCurve, supplyCurve);
            const afterEquilibrium = this.findMarketClearing(afterCurve, supplyCurve);
            
            // Update visualization
            this.updateChart(beforeResult, afterResult, beforeCurve, afterCurve, supplyCurve, beforeEquilibrium, afterEquilibrium);
            
            // Update results display
            this.updateResults(beforeCurve, afterCurve, beforeEquilibrium, afterEquilibrium, afterResult.shockPoints);
            
            console.log('Analysis completed successfully');
            
        } catch (error) {
            console.error('Error in demand analysis:', error);
            alert('Error running analysis: ' + error.message);
        }
    }
    
    updateChart(beforeResult, afterResult, beforeCurve, afterCurve, supplyCurve, beforeEq, afterEq) {
        const ctx = document.getElementById('demandChart').getContext('2d');
        
        if (this.demandChart) {
            this.demandChart.destroy();
        }
        
        // Determine chart ranges
        const allData = [...beforeResult.data, ...afterResult.data];
        const minPrice = Math.min(...allData.map(d => d.price)) * 0.8;
        const maxPrice = Math.max(...allData.map(d => d.price)) * 1.2;
        const maxVolume = Math.max(...allData.map(d => d.volume)) * 1.2;
        
        // Generate curve points
        const beforeCurvePoints = this.generateCurvePoints(beforeCurve, minPrice, maxPrice);
        const afterCurvePoints = this.generateCurvePoints(afterCurve, minPrice, maxPrice);
        const supplyCurvePoints = this.generateSupplyCurvePoints(supplyCurve, maxVolume);
        
        this.demandChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Before Event Data',
                        data: beforeResult.data.map(d => ({ x: d.price, y: d.volume })),
                        backgroundColor: 'rgba(68, 114, 196, 0.8)',
                        borderColor: 'rgba(68, 114, 196, 1)',
                        borderWidth: 2,
                        pointRadius: 6,
                        showLine: false
                    },
                    {
                        label: 'After Event Data',
                        data: afterResult.data.map(d => ({ x: d.price, y: d.volume })),
                        backgroundColor: 'rgba(237, 125, 49, 0.8)',
                        borderColor: 'rgba(237, 125, 49, 1)',
                        borderWidth: 2,
                        pointRadius: 6,
                        showLine: false
                    },
                    {
                        label: 'Shock Points',
                        data: afterResult.shockPoints.map(d => ({ x: d.price, y: d.volume })),
                        backgroundColor: 'rgba(255, 0, 0, 0.9)',
                        borderColor: 'rgba(255, 0, 0, 1)',
                        borderWidth: 3,
                        pointRadius: 10,
                        pointStyle: 'star',
                        showLine: false
                    },
                    {
                        label: 'Before Event Demand Curve',
                        data: beforeCurvePoints,
                        borderColor: 'rgba(68, 114, 196, 1)',
                        backgroundColor: 'rgba(68, 114, 196, 0.1)',
                        borderWidth: 3,
                        pointRadius: 0,
                        showLine: true,
                        fill: false
                    },
                    {
                        label: 'After Event Demand Curve',
                        data: afterCurvePoints,
                        borderColor: 'rgba(237, 125, 49, 1)',
                        backgroundColor: 'rgba(237, 125, 49, 0.1)',
                        borderWidth: 3,
                        pointRadius: 0,
                        showLine: true,
                        fill: false,
                        borderDash: [10, 5]
                    },
                    {
                        label: 'Supply Curve',
                        data: supplyCurvePoints,
                        borderColor: 'rgba(0, 0, 0, 1)',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        showLine: true,
                        fill: false
                    },
                    {
                        label: 'Before Equilibrium',
                        data: [{ x: beforeEq.price, y: beforeEq.volume }],
                        backgroundColor: 'rgba(112, 173, 71, 1)',
                        borderColor: 'rgba(112, 173, 71, 1)',
                        borderWidth: 3,
                        pointRadius: 8,
                        pointStyle: 'triangle',
                        showLine: false
                    },
                    {
                        label: 'After Equilibrium',
                        data: [{ x: afterEq.price, y: afterEq.volume }],
                        backgroundColor: 'rgba(255, 192, 0, 1)',
                        borderColor: 'rgba(255, 192, 0, 1)',
                        borderWidth: 3,
                        pointRadius: 8,
                        pointStyle: 'triangle',
                        showLine: false
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
                            text: 'Price ($)',
                            font: { size: 14, weight: 'bold' }
                        },
                        min: minPrice,
                        max: maxPrice
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Volume (units)',
                            font: { size: 14, weight: 'bold' }
                        },
                        min: 0,
                        max: maxVolume
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Demand Curve Analysis: Market Shock Impact',
                        font: { size: 18, weight: 'bold' }
                    },
                    legend: {
                        position: 'top',
                        labels: { padding: 15 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ($${context.parsed.x.toFixed(0)}, ${context.parsed.y.toFixed(0)} units)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    updateResults(beforeCurve, afterCurve, beforeEq, afterEq, shockPoints) {
        // Update equilibrium values
        document.getElementById('beforePrice').textContent = `$${beforeEq.price.toFixed(0)}`;
        document.getElementById('beforeVolume').textContent = `${beforeEq.volume.toFixed(0)} units`;
        document.getElementById('beforeR2').textContent = beforeCurve.rSquared.toFixed(3);
        
        document.getElementById('afterPrice').textContent = `$${afterEq.price.toFixed(0)}`;
        document.getElementById('afterVolume').textContent = `${afterEq.volume.toFixed(0)} units`;
        document.getElementById('afterR2').textContent = afterCurve.rSquared.toFixed(3);
        
        // Calculate changes
        const priceChange = afterEq.price - beforeEq.price;
        const volumeChange = afterEq.volume - beforeEq.volume;
        const uncertaintyChange = afterCurve.rSquared - beforeCurve.rSquared;
        
        const priceChangeEl = document.getElementById('priceChange');
        priceChangeEl.textContent = `${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(0)}`;
        priceChangeEl.className = `eq-value ${priceChange >= 0 ? 'positive' : 'negative'}`;
        
        const volumeChangeEl = document.getElementById('volumeChange');
        volumeChangeEl.textContent = `${volumeChange >= 0 ? '+' : ''}${volumeChange.toFixed(0)} units`;
        volumeChangeEl.className = `eq-value ${volumeChange >= 0 ? 'positive' : 'negative'}`;
        
        const uncertaintyChangeEl = document.getElementById('uncertaintyChange');
        uncertaintyChangeEl.textContent = `${uncertaintyChange >= 0 ? '+' : ''}${uncertaintyChange.toFixed(3)}`;
        uncertaintyChangeEl.className = `eq-value ${uncertaintyChange >= 0 ? 'positive' : 'negative'}`;
        
        // Generate market summary
        this.generateMarketSummary(beforeEq, afterEq, priceChange, volumeChange, shockPoints, beforeCurve, afterCurve);
    }
    
    generateMarketSummary(beforeEq, afterEq, priceChange, volumeChange, shockPoints, beforeCurve, afterCurve) {
        const summaryContainer = document.getElementById('marketSummaryContent');
        
        const priceChangePercent = (priceChange / beforeEq.price) * 100;
        const volumeChangePercent = (volumeChange / beforeEq.volume) * 100;
        const uncertaintyChange = afterCurve.rSquared - beforeCurve.rSquared;
        
        let summary = `<p><strong>Market Shock Analysis:</strong></p>`;
        
        if (shockPoints.length > 0) {
            summary += `<p>The observed shock point${shockPoints.length > 1 ? 's' : ''} (${shockPoints.map(p => `$${p.price}, ${p.volume} units`).join('; ')}) ${shockPoints.length > 1 ? 'represent' : 'represents'} a significant deviation from the baseline demand curve.</p>`;
        }
        
        summary += `<p>After the market event, the demand curve shifted, changing the optimal market-clearing price from <strong>$${beforeEq.price.toFixed(0)}</strong> to <strong>$${afterEq.price.toFixed(0)}</strong> (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(1)}% change).</p>`;
        
        summary += `<p>The optimal volume changed from <strong>${beforeEq.volume.toFixed(0)}</strong> to <strong>${afterEq.volume.toFixed(0)}</strong> units (${volumeChangePercent >= 0 ? '+' : ''}${volumeChangePercent.toFixed(1)}% change).</p>`;
        
        if (uncertaintyChange < -0.05) {
            summary += `<p><span style="color: var(--maersk-accent-2);">⚠️ Model uncertainty increased significantly</span> (R² decreased from ${beforeCurve.rSquared.toFixed(3)} to ${afterCurve.rSquared.toFixed(3)}), suggesting the market became less predictable after the shock.</p>`;
        } else if (uncertaintyChange > 0.05) {
            summary += `<p><span style="color: var(--maersk-accent-6);">✅ Model fit improved</span> (R² increased from ${beforeCurve.rSquared.toFixed(3)} to ${afterCurve.rSquared.toFixed(3)}), suggesting a more stable demand pattern post-shock.</p>`;
        } else {
            summary += `<p>Model uncertainty remained relatively stable (R² changed from ${beforeCurve.rSquared.toFixed(3)} to ${afterCurve.rSquared.toFixed(3)}).</p>`;
        }
        
        if (priceChange > 0) {
            summary += `<p><strong>Business Implication:</strong> The market shock created an opportunity to increase prices by $${priceChange.toFixed(0)} while maintaining market equilibrium. Consider implementing graduated price increases to capture this value.</p>`;
        } else if (priceChange < 0) {
            summary += `<p><strong>Business Implication:</strong> The market shock reduced optimal pricing by $${Math.abs(priceChange).toFixed(0)}. Consider cost reduction strategies or market differentiation to maintain margins.</p>`;
        } else {
            summary += `<p><strong>Business Implication:</strong> Despite the market shock, optimal pricing remained stable. Monitor for delayed effects and prepare for potential volatility.</p>`;
        }
        
        summaryContainer.innerHTML = summary;
    }
}

// Initialize demand analysis when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Demand Analysis...');
    const demandAnalysis = new DemandAnalysis();
    
    // Expose globally for debugging
    window.demandAnalysis = demandAnalysis;
    
    console.log('Demand Analysis loaded successfully');
}); 