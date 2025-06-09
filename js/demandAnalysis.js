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
    fitDemandCurve(data, isPostShock = false) {
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
        
        // Calculate R-squared and standard error
        const meanY = sumY / n;
        const totalSumSquares = logData.reduce((sum, d) => sum + Math.pow(d.y - meanY, 2), 0);
        const residualSumSquares = logData.reduce((sum, d) => {
            const predicted = intercept + slope * d.x;
            return sum + Math.pow(d.y - predicted, 2);
        }, 0);
        const rSquared = 1 - (residualSumSquares / totalSumSquares);
        
        // Standard error of the estimate
        const standardError = Math.sqrt(residualSumSquares / (n - 2));
        
        // Calculate standard error of prediction for confidence bands
        const meanX = sumX / n;
        const sxx = sumX2 - (sumX * sumX) / n;
        
        // Confidence multiplier (approximate 95% confidence)
        let confidenceMultiplier = 1.96; // Standard normal for large samples
        if (n <= 10) {
            // Use t-distribution for small samples
            const tValues = { 2: 12.7, 3: 4.3, 4: 3.2, 5: 2.8, 6: 2.4, 7: 2.4, 8: 2.3, 9: 2.3, 10: 2.2 };
            confidenceMultiplier = tValues[n] || 2.2;
        }
        
        // Increase uncertainty for post-shock curves to reflect market instability
        if (isPostShock) {
            confidenceMultiplier *= 1.8; // Widen confidence bands by 80%
        }
        
        return {
            a: a,
            b: b,
            rSquared: rSquared,
            standardError: standardError,
            confidenceMultiplier: confidenceMultiplier,
            meanX: meanX,
            sxx: sxx,
            equation: `Volume = ${a.toFixed(2)} × Price^${b.toFixed(3)}`,
            predict: (price) => a * Math.pow(price, b),
            predictWithConfidence: (price) => {
                const logPrice = Math.log(price);
                const logPrediction = Math.log(a) + b * logPrice;
                const prediction = Math.exp(logPrediction);
                
                // Calculate prediction interval
                const h = (1/data.length) + Math.pow(logPrice - meanX, 2) / sxx;
                const margin = confidenceMultiplier * standardError * Math.sqrt(h);
                
                return {
                    predicted: prediction,
                    lower: Math.exp(logPrediction - margin),
                    upper: Math.exp(logPrediction + margin)
                };
            }
        };
    }
    
    // Estimate new demand curve from single shock observation
    estimateCurveFromShock(originalCurve, shockPoint, originalData) {
        // Calculate the shift needed based on the shock observation
        const expectedVolume = originalCurve.predict(shockPoint.price);
        const actualVolume = shockPoint.volume;
        const volumeRatio = actualVolume / expectedVolume;
        
        // Shift the curve by adjusting the 'a' parameter while keeping the shape 'b'
        const newA = originalCurve.a * volumeRatio;
        const newB = originalCurve.b; // Keep same price elasticity
        
        // Significantly increase uncertainty due to single observation extrapolation
        const baseConfidenceMultiplier = 1.96;
        const shockUncertaintyMultiplier = 2.5; // Much higher uncertainty
        
        // Estimate R-squared as lower due to increased uncertainty
        const estimatedRSquared = Math.max(0.3, originalCurve.rSquared * 0.6);
        
        // Estimate standard error as higher
        const estimatedStandardError = originalCurve.standardError * 1.8;
        
        // Use original data statistics as baseline
        const meanX = originalData.reduce((sum, d) => sum + Math.log(d.price), 0) / originalData.length;
        const sumX2 = originalData.reduce((sum, d) => sum + Math.pow(Math.log(d.price), 2), 0);
        const sumX = originalData.reduce((sum, d) => sum + Math.log(d.price), 0);
        const sxx = sumX2 - (sumX * sumX) / originalData.length;
        
        return {
            a: newA,
            b: newB,
            rSquared: estimatedRSquared,
            standardError: estimatedStandardError,
            confidenceMultiplier: shockUncertaintyMultiplier,
            meanX: meanX,
            sxx: sxx,
            isShockEstimate: true,
            shockRatio: volumeRatio,
            equation: `Volume = ${newA.toFixed(2)} × Price^${newB.toFixed(3)} (shock-adjusted)`,
            predict: (price) => newA * Math.pow(price, newB),
            predictWithConfidence: (price) => {
                const logPrice = Math.log(price);
                const logPrediction = Math.log(newA) + newB * logPrice;
                const prediction = Math.exp(logPrediction);
                
                // Calculate prediction interval with higher uncertainty
                const h = (1/originalData.length) + Math.pow(logPrice - meanX, 2) / sxx;
                const margin = shockUncertaintyMultiplier * estimatedStandardError * Math.sqrt(h);
                
                return {
                    predicted: prediction,
                    lower: Math.exp(logPrediction - margin),
                    upper: Math.exp(logPrediction + margin)
                };
            }
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
    
    findMarketClearing(demandCurve, supplyCurve, maxVolume, minPrice, maxPrice) {
        if (supplyCurve.type === 'flat') {
            // For horizontal supply (fixed capacity), find where demand intersects capacity line
            const fixedVolume = maxVolume * 0.4; // Same fraction used in curve generation
            
            // Find price where demand equals the fixed capacity
            let bestPrice = null;
            let minDifference = Infinity;
            
            const steps = 1000;
            const priceStep = (maxPrice - minPrice) / steps;
            
            for (let i = 0; i <= steps; i++) {
                const price = minPrice + i * priceStep;
                const demandVolume = demandCurve.predict(price);
                const difference = Math.abs(demandVolume - fixedVolume);
                
                if (difference < minDifference) {
                    minDifference = difference;
                    bestPrice = price;
                }
            }
            
            return {
                price: bestPrice,
                volume: fixedVolume,
                difference: minDifference
            };
        } else {
            // Original logic for sloped supply curves
            let bestPrice = null;
            let bestVolume = null;
            let minDifference = Infinity;
            
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
    }
    
    generateCurvePoints(curve, minPrice, maxPrice, points = 100) {
        const step = (maxPrice - minPrice) / (points - 1);
        const curvePoints = [];
        const upperBand = [];
        const lowerBand = [];
        
        for (let i = 0; i < points; i++) {
            const price = minPrice + i * step;
            const volume = curve.predict(price);
            const confidence = curve.predictWithConfidence(price);
            
            if (volume > 0) {
                curvePoints.push({ x: price, y: volume });
                upperBand.push({ x: price, y: confidence.upper });
                lowerBand.push({ x: price, y: confidence.lower });
            }
        }
        
        return { curvePoints, upperBand, lowerBand };
    }
    
    generateSupplyCurvePoints(supplyCurve, maxVolume, minPrice, maxPrice, points = 100) {
        const curvePoints = [];
        
        if (supplyCurve.type === 'flat') {
            // Flat supply: horizontal line representing fixed capacity
            const step = (maxPrice - minPrice) / (points - 1);
            const fixedVolume = maxVolume * 0.4; // Use a reasonable fraction of max volume
            for (let i = 0; i < points; i++) {
                const price = minPrice + i * step;
                curvePoints.push({ x: price, y: fixedVolume });
            }
        } else {
            // Sloped supply: price increases with volume
            const step = maxVolume / (points - 1);
            for (let i = 0; i < points; i++) {
                const volume = i * step;
                const price = supplyCurve.predict(volume);
                curvePoints.push({ x: price, y: volume });
            }
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
            
            if (afterResult.data.length < 1) {
                alert('Please enter at least 1 shock observation for after event data.');
                return;
            }
            
            // Calculate price and volume ranges
            const allData = [...beforeResult.data, ...afterResult.data];
            const minPrice = Math.min(...allData.map(d => d.price)) * 0.8;
            const maxPrice = Math.max(...allData.map(d => d.price)) * 1.2;
            const maxVolume = Math.max(...allData.map(d => d.volume)) * 1.2;
            
            // Fit demand curves
            const beforeCurve = this.fitDemandCurve(beforeResult.data);
            
            // Handle single shock observation case
            let afterCurve;
            if (afterResult.data.length === 1) {
                // Special case: single shock observation
                afterCurve = this.estimateCurveFromShock(beforeCurve, afterResult.data[0], beforeResult.data);
            } else {
                // Multiple observations: fit normally
                afterCurve = this.fitDemandCurve(afterResult.data, true);
            }
            
            // Get supply curve
            const supplyCurve = this.calculateSupplyCurve();
            
            // Find market clearing points
            const beforeEquilibrium = this.findMarketClearing(beforeCurve, supplyCurve, maxVolume, minPrice, maxPrice);
            const afterEquilibrium = this.findMarketClearing(afterCurve, supplyCurve, maxVolume, minPrice, maxPrice);
            
            // Update visualization
            this.updateChart(beforeResult, afterResult, beforeCurve, afterCurve, supplyCurve, beforeEquilibrium, afterEquilibrium, minPrice, maxPrice, maxVolume);
            
            // Update results display
            this.updateResults(beforeCurve, afterCurve, beforeEquilibrium, afterEquilibrium, afterResult.shockPoints);
            
            console.log('Analysis completed successfully');
            
        } catch (error) {
            console.error('Error in demand analysis:', error);
            alert('Error running analysis: ' + error.message);
        }
    }
    
    updateChart(beforeResult, afterResult, beforeCurve, afterCurve, supplyCurve, beforeEq, afterEq, minPrice, maxPrice, maxVolume) {
        const ctx = document.getElementById('demandChart').getContext('2d');
        
        if (this.demandChart) {
            this.demandChart.destroy();
        }
        
        // Generate curve points
        const beforeCurveData = this.generateCurvePoints(beforeCurve, minPrice, maxPrice);
        const afterCurveData = this.generateCurvePoints(afterCurve, minPrice, maxPrice);
        const supplyCurvePoints = this.generateSupplyCurvePoints(supplyCurve, maxVolume, minPrice, maxPrice);
        
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
                    // Before curve confidence bands
                    {
                        label: 'Before Lower Confidence',
                        data: beforeCurveData.lowerBand,
                        borderColor: 'rgba(68, 114, 196, 0.3)',
                        backgroundColor: 'rgba(68, 114, 196, 0.1)',
                        borderWidth: 1,
                        pointRadius: 0,
                        showLine: true,
                        fill: false,
                        borderDash: [3, 3]
                    },
                    {
                        label: 'Before Upper Confidence',
                        data: beforeCurveData.upperBand,
                        borderColor: 'rgba(68, 114, 196, 0.3)',
                        backgroundColor: 'rgba(68, 114, 196, 0.1)',
                        borderWidth: 1,
                        pointRadius: 0,
                        showLine: true,
                        fill: '-1', // Fill to previous dataset (lower band)
                        borderDash: [3, 3]
                    },
                    {
                        label: 'Demand Curve',
                        data: beforeCurveData.curvePoints,
                        borderColor: 'rgba(68, 114, 196, 1)',
                        backgroundColor: 'rgba(68, 114, 196, 0.1)',
                        borderWidth: 3,
                        pointRadius: 0,
                        showLine: true,
                        fill: false
                    },
                    // After curve confidence bands
                    {
                        label: 'New Lower Confidence',
                        data: afterCurveData.lowerBand,
                        borderColor: 'rgba(237, 125, 49, 0.3)',
                        backgroundColor: 'rgba(237, 125, 49, 0.1)',
                        borderWidth: 1,
                        pointRadius: 0,
                        showLine: true,
                        fill: false,
                        borderDash: [3, 3]
                    },
                    {
                        label: 'New Upper Confidence',
                        data: afterCurveData.upperBand,
                        borderColor: 'rgba(237, 125, 49, 0.3)',
                        backgroundColor: 'rgba(237, 125, 49, 0.1)',
                        borderWidth: 1,
                        pointRadius: 0,
                        showLine: true,
                        fill: '-1', // Fill to previous dataset (lower band)
                        borderDash: [3, 3]
                    },
                    {
                        label: 'New Demand Curve',
                        data: afterCurveData.curvePoints,
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
                        label: 'Current Price',
                        data: [{ x: beforeEq.price, y: 0 }, { x: beforeEq.price, y: maxVolume }],
                        borderColor: 'rgba(128, 128, 128, 0.7)',
                        backgroundColor: 'rgba(128, 128, 128, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        showLine: true,
                        fill: false,
                        borderDash: [5, 5]
                    },
                    {
                        label: 'New Price',
                        data: [{ x: afterEq.price, y: 0 }, { x: afterEq.price, y: maxVolume }],
                        borderColor: 'rgba(64, 64, 64, 0.9)',
                        backgroundColor: 'rgba(64, 64, 64, 0.1)',
                        borderWidth: 3,
                        pointRadius: 0,
                        showLine: true,
                        fill: false,
                        borderDash: [8, 4]
                    },
                    {
                        label: 'May 12',
                        data: afterResult.shockPoints,
                        backgroundColor: 'rgba(255, 0, 0, 1)',
                        borderColor: 'rgba(255, 0, 0, 1)',
                        borderWidth: 3,
                        pointRadius: 8,
                        pointStyle: 'circle',
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
                        text: 'Updated Estimation of Customer Willingness to Pay',
                        font: { size: 18, weight: 'bold' }
                    },
                    legend: {
                        position: 'top',
                        labels: { 
                            padding: 15,
                            filter: function(legendItem, chartData) {
                                // Hide confidence band entries from legend for cleaner view
                                return !legendItem.text.includes('Confidence');
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label === 'May 12') {
                                    return `Shock Observation: ($${context.parsed.x.toFixed(0)}, ${context.parsed.y.toFixed(0)} FFE)`;
                                }
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
        
        let summary = `<p><strong>Market Shock Analysis Based on ${afterCurve.isShockEstimate ? 'Single' : 'Multiple'} Observation${afterCurve.isShockEstimate ? '' : 's'}:</strong></p>`;
        
        if (shockPoints.length > 0) {
            const mainShock = shockPoints[0];
            summary += `<p>The initial demand curve estimated expected FFE booked at the market price of <strong>$${beforeEq.price.toFixed(0)}</strong> to be around <strong>${beforeEq.volume.toFixed(0)} units</strong>, with a confidence interval reflecting normal market conditions.</p>`;
            
            if (afterCurve.isShockEstimate) {
                summary += `<p>On May 12, we observed <strong>${mainShock.volume.toFixed(0)} FFE booked</strong> at the same price point ($${mainShock.price}), which was <strong>${((mainShock.volume / beforeEq.volume - 1) * 100).toFixed(0)}% ${mainShock.volume > beforeEq.volume ? 'higher' : 'lower'}</strong> than expected.</p>`;
                
                summary += `<p><strong>Single Observation Methodology:</strong> With only one shock observation, we shifted the original demand curve by the observed volume ratio (${afterCurve.shockRatio.toFixed(2)}x) while maintaining the same price elasticity. This approach reflects the reality that during market shocks, you often only get one clear signal before needing to make pricing decisions.</p>`;
            } else {
                summary += `<p>Based on multiple post-shock observations, we observed volume changes ranging from the initial shock of <strong>${mainShock.volume.toFixed(0)} FFE booked</strong> to subsequent market behavior.</p>`;
            }
        }
        
        if (afterCurve.isShockEstimate) {
            summary += `<p><strong>Demand Curve Estimate:</strong> The new demand curve (red) was estimated by shifting the original curve to pass through the shock observation. The <strong>significantly wider confidence bands</strong> (${((afterCurve.confidenceMultiplier / beforeCurve.confidenceMultiplier - 1) * 100).toFixed(0)}% wider) reflect the increased uncertainty when extrapolating from a single data point.</p>`;
        } else {
            summary += `<p><strong>Updated Demand Curve:</strong> Based on multiple observations, we fitted a new demand curve (shown in red) with <strong>wider confidence bands</strong> to reflect the increased market uncertainty. The optimal market-clearing price shifted from <strong>$${beforeEq.price.toFixed(0)}</strong> to <strong>$${afterEq.price.toFixed(0)}</strong>.</p>`;
        }
        
        summary += `<p><strong>Price Impact:</strong> The optimal market-clearing price shifted from <strong>$${beforeEq.price.toFixed(0)}</strong> to <strong>$${afterEq.price.toFixed(0)}</strong> (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(1)}% change).</p>`;
        
        if (Math.abs(priceChangePercent) > 5) {
            if (priceChange > 0) {
                summary += `<p><strong>Pricing Opportunity:</strong> The market shock reveals customer willingness to pay significantly higher prices. The new optimal price is <strong>$${Math.abs(priceChange).toFixed(0)} higher</strong> (${priceChangePercent.toFixed(1)}% increase), suggesting an opportunity for graduated price increases.</p>`;
            } else {
                summary += `<p><strong>Pricing Challenge:</strong> The market shock indicates reduced optimal pricing by <strong>$${Math.abs(priceChange).toFixed(0)}</strong> (${Math.abs(priceChangePercent).toFixed(1)}% decrease). Consider market differentiation strategies to maintain margins.</p>`;
            }
        }
        
        summary += `<p><strong>Uncertainty Impact:</strong> Model fit changed from R² = ${beforeCurve.rSquared.toFixed(3)} to R² = ${afterCurve.rSquared.toFixed(3)}. ${afterCurve.isShockEstimate ? 'The lower R² reflects the inherent uncertainty in single-observation extrapolation.' : 'The change in R² indicates how the shock affected demand predictability.'}</p>`;
        
        if (afterCurve.isShockEstimate) {
            summary += `<p><span style="color: var(--maersk-accent-2);">⚠️ Single Observation Uncertainty:</span> Confidence intervals are now ${((afterCurve.confidenceMultiplier / beforeCurve.confidenceMultiplier - 1) * 100).toFixed(0)}% wider, reflecting the high uncertainty when extrapolating from one shock event. Consider collecting additional data points to validate the demand shift.</p>`;
        } else {
            summary += `<p><span style="color: var(--maersk-accent-2);">⚠️ Increased Market Uncertainty:</span> Confidence intervals are now ${((afterCurve.confidenceMultiplier / beforeCurve.confidenceMultiplier - 1) * 100).toFixed(0)}% wider, indicating higher volatility. Consider more frequent price reviews and flexible contract terms.</p>`;
        }
        
        summary += `<p><strong>Business Recommendation:</strong> ${afterCurve.isShockEstimate ? 'The single shock observation provides valuable but limited market intelligence. Consider implementing cautious price adjustments while monitoring for additional signals to validate the demand shift.' : 'Multiple observations provide stronger evidence for demand changes. ' + (priceChange > 50 ? 'Implement gradual price increases to capture revealed willingness to pay while monitoring customer response.' : 'Monitor for additional shock events and consider dynamic pricing strategies to respond quickly to market changes.')}</p>`;
        
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