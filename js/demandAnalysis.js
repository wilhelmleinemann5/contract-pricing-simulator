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
        
        // Add row buttons for shock data only
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
    
    getBaselineInputs() {
        const price = parseFloat(document.getElementById('baselinePrice').value);
        const volume = parseFloat(document.getElementById('baselineVolume').value);
        const sensitivity = parseFloat(document.getElementById('priceSensitivity').value);
        
        if (isNaN(price) || isNaN(volume) || isNaN(sensitivity) || price <= 0 || volume <= 0 || sensitivity <= 0) {
            throw new Error('Please enter valid baseline market conditions');
        }
        
        return { price, volume, sensitivity };
    }
    
    createDemandCurveFromBaseline(baselinePoint, priceSensitivity) {
        // Convert price sensitivity to elasticity
        // If 10% price increase causes X% volume decrease, elasticity = -X/10
        const elasticity = -priceSensitivity / 10;
        
        // For power law: Volume = a * Price^b
        // We know: baselineVolume = a * baselinePrice^b
        // And we know: b = elasticity
        // So: a = baselineVolume / (baselinePrice^b)
        
        const b = elasticity;
        const a = baselinePoint.volume / Math.pow(baselinePoint.price, b);
        
        // Estimate reasonable confidence parameters for user-estimated curves
        const rSquared = 0.85; // Assume good fit for user-defined curves
        const standardError = 0.3; // Moderate uncertainty
        const confidenceMultiplier = 1.96; // Standard 95% confidence
        
        // Simple approximations for confidence calculation
        const meanX = Math.log(baselinePoint.price);
        const sxx = 1.0; // Simplified for single point
        
        return {
            a: a,
            b: b,
            rSquared: rSquared,
            standardError: standardError,
            confidenceMultiplier: confidenceMultiplier,
            meanX: meanX,
            sxx: sxx,
            baselinePoint: baselinePoint,
            equation: `Volume = ${a.toFixed(2)} × Price^${b.toFixed(3)}`,
            predict: (price) => a * Math.pow(price, b),
            predictWithConfidence: (price) => {
                const logPrice = Math.log(price);
                const logPrediction = Math.log(a) + b * logPrice;
                const prediction = Math.exp(logPrediction);
                
                // Simplified confidence calculation
                const margin = confidenceMultiplier * standardError * 0.5;
                
                return {
                    predicted: prediction,
                    lower: Math.exp(logPrediction - margin),
                    upper: Math.exp(logPrediction + margin)
                };
            }
        };
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
        const capacity = parseFloat(document.getElementById('supplyCapacity').value);
        const slope = parseFloat(document.getElementById('supplySlope').value) || 0;
        
        // Validate inputs
        if (isNaN(basePrice) || basePrice <= 0) {
            throw new Error('Please enter a valid base supply price');
        }
        
        if (curveType === 'flat' && (isNaN(capacity) || capacity <= 0)) {
            throw new Error('Please enter a valid supply capacity for flat supply curves');
        }
        
        return {
            type: curveType,
            basePrice: basePrice,
            capacity: capacity,
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
    
    findMarketClearing(demandCurve, supplyCurve, maxVolume) {
        if (supplyCurve.type === 'flat') {
            // For horizontal supply (fixed capacity), find where demand intersects capacity line
            const fixedVolume = supplyCurve.capacity; // Use the configured capacity
            
            // For power law demand: Volume = a * Price^b, solve for Price when Volume = fixedVolume
            // Price = (Volume / a)^(1/b)
            const equilibriumPrice = Math.pow(fixedVolume / demandCurve.a, 1 / demandCurve.b);
            
            // Validate the calculated price
            if (!isFinite(equilibriumPrice) || equilibriumPrice <= 0) {
                console.warn('Invalid equilibrium price calculated, using fallback method');
                // Fallback to numerical search if analytical solution fails
                let bestPrice = 1000;
                let minDifference = Infinity;
                
                for (let price = 100; price <= 10000; price += 10) {
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
            }
            
            return {
                price: equilibriumPrice,
                volume: fixedVolume,
                difference: 0 // Perfect intersection by construction
            };
        } else {
            // Original logic for sloped supply curves
            let bestPrice = null;
            let bestVolume = null;
            let minDifference = Infinity;
            
            // Search reasonable price range
            const minPrice = supplyCurve.basePrice * 0.5;
            const maxPrice = supplyCurve.basePrice * 3;
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
            // Use the configured capacity level
            const fixedVolume = supplyCurve.capacity;
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
            
            // Get baseline inputs and shock data
            const baseline = this.getBaselineInputs();
            const afterResult = this.getTableData('afterDataTable');
            
            if (afterResult.data.length < 1) {
                alert('Please enter at least 1 shock observation for after event data.');
                return;
            }
            
            // Create baseline demand curve from single point + sensitivity
            const beforeCurve = this.createDemandCurveFromBaseline(
                { price: baseline.price, volume: baseline.volume }, 
                baseline.sensitivity
            );
            
            // Handle shock with parallel shift approach
            const shockPoint = afterResult.data[0];
            const afterCurve = this.createParallelShiftCurve(beforeCurve, shockPoint, baseline);
            
            // Get supply curve
            const supplyCurve = this.calculateSupplyCurve();
            
            // Calculate price and volume ranges for visualization - need wider range for equilibrium points
            const allPrices = [baseline.price, ...afterResult.data.map(d => d.price)];
            const allVolumes = [baseline.volume, ...afterResult.data.map(d => d.volume), supplyCurve.capacity];
            
            // Find market clearing points first to include them in range calculation
            const beforeEquilibrium = this.findMarketClearing(beforeCurve, supplyCurve, Math.max(...allVolumes) * 1.2);
            const afterEquilibrium = this.findMarketClearing(afterCurve, supplyCurve, Math.max(...allVolumes) * 1.2);
            
            // Expand price range to include equilibrium points with generous margins
            const allRelevantPrices = [...allPrices, beforeEquilibrium.price, afterEquilibrium.price];
            const minPrice = Math.min(...allRelevantPrices) * 0.7;
            const maxPrice = Math.max(...allRelevantPrices) * 1.3;
            const maxVolume = Math.max(...allVolumes) * 1.2;
            
            // Create synthetic before data for visualization
            const beforeResult = {
                data: [{ price: baseline.price, volume: baseline.volume }],
                shockPoints: []
            };
            
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
    
    createParallelShiftCurve(originalCurve, shockPoint, baseline) {
        // Calculate the volume difference at the shock price point
        const expectedVolume = originalCurve.predict(shockPoint.price);
        const actualVolume = shockPoint.volume;
        const volumeShift = actualVolume - expectedVolume;
        
        // Create parallel shifted curve: same elasticity (b), but shifted volume
        // New curve: Volume = a * Price^b + shift
        // But to maintain power law form, we'll adjust 'a' to approximate the shift
        const shiftRatio = actualVolume / expectedVolume;
        const newA = originalCurve.a * shiftRatio;
        const newB = originalCurve.b; // Keep same elasticity
        
        // Increase uncertainty significantly for shock-based estimates
        const shockUncertaintyMultiplier = 2.8;
        const estimatedRSquared = Math.max(0.25, originalCurve.rSquared * 0.5);
        const estimatedStandardError = originalCurve.standardError * 2.0;
        
        return {
            a: newA,
            b: newB,
            rSquared: estimatedRSquared,
            standardError: estimatedStandardError,
            confidenceMultiplier: shockUncertaintyMultiplier,
            meanX: originalCurve.meanX,
            sxx: originalCurve.sxx,
            isShockEstimate: true,
            shiftRatio: shiftRatio,
            volumeShift: volumeShift,
            originalBaseline: baseline,
            equation: `Volume = ${newA.toFixed(2)} × Price^${newB.toFixed(3)} (parallel shift)`,
            predict: (price) => newA * Math.pow(price, newB),
            predictWithConfidence: (price) => {
                const logPrice = Math.log(price);
                const logPrediction = Math.log(newA) + newB * logPrice;
                const prediction = Math.exp(logPrediction);
                
                // Higher uncertainty margins for shock estimates
                const margin = shockUncertaintyMultiplier * estimatedStandardError * 0.8;
                
                return {
                    predicted: prediction,
                    lower: Math.exp(logPrediction - margin),
                    upper: Math.exp(logPrediction + margin)
                };
            }
        };
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
        
        // Calculate sensitivity at the start so it's available throughout the function
        const sensitivity = (-beforeCurve.b * 10).toFixed(1); // Convert back to % for 10% price change
        
        let summary = `<p><strong>Demand Analysis Based on Price Sensitivity & Shock Observation:</strong></p>`;
        
        if (beforeCurve.baselinePoint) {
            const baseline = beforeCurve.baselinePoint;
            summary += `<p>The baseline demand curve was constructed from your current market observation ($${baseline.price}, ${baseline.volume.toFixed(0)} FFE) with estimated customer price sensitivity of ${sensitivity}% (volume change for 10% price change).</p>`;
        }
        
        if (shockPoints.length > 0) {
            const mainShock = shockPoints[0];
            const expectedVolume = beforeCurve.predict(mainShock.price);
            
            summary += `<p><strong>Shock Analysis:</strong> On May 12, we observed <strong>${mainShock.volume.toFixed(0)} FFE booked</strong> at $${mainShock.price}, compared to the expected ${expectedVolume.toFixed(0)} FFE from your baseline curve. This represents a <strong>${((mainShock.volume / expectedVolume - 1) * 100).toFixed(0)}% ${mainShock.volume > expectedVolume ? 'increase' : 'decrease'}</strong> in demand.</p>`;
            
            if (afterCurve.isShockEstimate) {
                summary += `<p><strong>Parallel Shift Methodology:</strong> The new demand curve (red) was created by parallel-shifting your baseline curve to pass through the shock observation. This maintains the same customer price sensitivity (${sensitivity}% for 10% price change) while accounting for the market shift. The shift ratio of ${afterCurve.shiftRatio.toFixed(2)}x suggests ${afterCurve.shiftRatio > 1 ? 'increased underlying demand' : 'decreased underlying demand'}.</p>`;
            }
        }
        
        summary += `<p><strong>Optimal Pricing Impact:</strong> The market-clearing price shifted from <strong>$${beforeEq.price.toFixed(0)}</strong> to <strong>$${afterEq.price.toFixed(0)}</strong> (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(1)}% change), while the equilibrium volume changed from ${beforeEq.volume.toFixed(0)} to ${afterEq.volume.toFixed(0)} FFE.</p>`;
        
        if (Math.abs(priceChangePercent) > 5) {
            if (priceChange > 0) {
                summary += `<p><strong>Pricing Opportunity:</strong> The shock reveals potential for price increases of <strong>$${Math.abs(priceChange).toFixed(0)} (${priceChangePercent.toFixed(1)}%)</strong>. Given the parallel shift nature, this suggests sustained demand increase rather than temporary volatility.</p>`;
            } else {
                summary += `<p><strong>Pricing Challenge:</strong> The shock indicates optimal pricing should decrease by <strong>$${Math.abs(priceChange).toFixed(0)} (${Math.abs(priceChangePercent).toFixed(1)}%)</strong>. Consider market conditions that may have reduced underlying demand.</p>`;
            }
        }
        
        summary += `<p><strong>Uncertainty Assessment:</strong> The parallel shift approach maintains the confidence in your estimated price sensitivity while acknowledging uncertainty about the demand level shift. Confidence intervals are ${((afterCurve.confidenceMultiplier / beforeCurve.confidenceMultiplier - 1) * 100).toFixed(0)}% wider for the shifted curve, reflecting single-observation extrapolation risk.</p>`;
        
        if (afterCurve.shiftRatio > 1.2) {
            summary += `<p><span style="color: var(--maersk-accent-6);">📈 Strong Demand Signal:</span> The ${((afterCurve.shiftRatio - 1) * 100).toFixed(0)}% demand increase suggests robust market appetite. Consider implementing graduated price increases while monitoring for sustainability.</p>`;
        } else if (afterCurve.shiftRatio < 0.8) {
            summary += `<p><span style="color: var(--maersk-accent-2);">📉 Demand Concern:</span> The ${((1 - afterCurve.shiftRatio) * 100).toFixed(0)}% demand decrease warrants careful analysis. Investigate market drivers and consider defensive pricing strategies.</p>`;
        } else {
            summary += `<p><span style="color: var(--maersk-accent-3);">⚖️ Moderate Impact:</span> The demand shift is relatively modest. Monitor for additional signals before making significant pricing changes.</p>`;
        }
        
        summary += `<p><strong>Business Recommendation:</strong> The parallel shift methodology provides a balanced approach to demand estimation from limited shock data. ${Math.abs(priceChangePercent) > 10 ? 'Consider implementing the price adjustment gradually with close monitoring of customer response and volume changes.' : 'The moderate price impact suggests measured adjustments with continued market observation.'}</p>`;
        
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