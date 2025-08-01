// Chart.js Dark Theme Configuration - SUPER AGGRESSIVE OVERRIDE
// Automatically applies Maersk dark theme colors to all charts

class ChartTheme {
    constructor() {
        this.colors = {
            background: '#252930',
            text: '#b8c5d1',
            textSecondary: '#8b9aa8',
            grid: 'rgba(184, 197, 209, 0.15)',
            border: 'rgba(184, 197, 209, 0.3)',
            maerskBlue: '#0077BE',
            maerskLightBlue: '#4A9FD9',
            maerskAccentBlue: '#00A8E6',
            maerskDarkBlue: '#003F5C',
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            neutral: '#6b7785'
        };

        // ONLY MAERSK BLUE PALETTE - NO GREEN/ORANGE
        this.defaultDatasetColors = [
            {
                backgroundColor: 'rgba(0, 119, 190, 0.8)',
                borderColor: '#0077BE',
                borderWidth: 3,
                pointBackgroundColor: '#0077BE',
                pointBorderColor: '#0077BE',
            },
            {
                backgroundColor: 'rgba(74, 159, 217, 0.8)',
                borderColor: '#4A9FD9',
                borderWidth: 3,
                pointBackgroundColor: '#4A9FD9',
                pointBorderColor: '#4A9FD9',
            },
            {
                backgroundColor: 'rgba(0, 168, 230, 0.8)',
                borderColor: '#00A8E6',
                borderWidth: 3,
                pointBackgroundColor: '#00A8E6',
                pointBorderColor: '#00A8E6',
            },
            {
                backgroundColor: 'rgba(0, 63, 92, 0.8)',
                borderColor: '#003F5C',
                borderWidth: 3,
                pointBackgroundColor: '#003F5C',
                pointBorderColor: '#003F5C',
            },
            {
                backgroundColor: 'rgba(102, 178, 255, 0.8)',
                borderColor: '#66B2FF',
                borderWidth: 3,
                pointBackgroundColor: '#66B2FF',
                pointBorderColor: '#66B2FF',
            },
            {
                backgroundColor: 'rgba(26, 115, 232, 0.8)',
                borderColor: '#1A73E8',
                borderWidth: 3,
                pointBackgroundColor: '#1A73E8',
                pointBorderColor: '#1A73E8',
            }
        ];
    }

    // Apply dark theme to Chart.js default config - SUPER AGGRESSIVE
    applyGlobalDefaults() {
        if (typeof Chart !== 'undefined') {
            // Force global chart defaults
            Chart.defaults.color = this.colors.text;
            Chart.defaults.backgroundColor = this.colors.background;
            Chart.defaults.borderColor = this.colors.border;
            Chart.defaults.font = {
                family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                size: 12,
                weight: 'normal'
            };
            
            // Force legend defaults
            Chart.defaults.plugins.legend.labels.color = this.colors.text;
            Chart.defaults.plugins.legend.labels.font = {
                size: 13,
                weight: '600'
            };
            
            // Force title defaults
            Chart.defaults.plugins.title.color = this.colors.text;
            Chart.defaults.plugins.title.font = {
                size: 16,
                weight: 'bold'
            };
            
            // Force tooltip defaults
            Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(42, 47, 56, 0.95)';
            Chart.defaults.plugins.tooltip.titleColor = this.colors.text;
            Chart.defaults.plugins.tooltip.bodyColor = this.colors.text;
            Chart.defaults.plugins.tooltip.borderColor = this.colors.border;
            Chart.defaults.plugins.tooltip.borderWidth = 1;
            
            // Force scale defaults for all scale types
            const scaleTypes = ['linear', 'category', 'time', 'logarithmic'];
            scaleTypes.forEach(scaleType => {
                if (Chart.defaults.scales[scaleType]) {
                    Chart.defaults.scales[scaleType].grid = {
                        color: this.colors.grid,
                        borderColor: this.colors.border
                    };
                    Chart.defaults.scales[scaleType].ticks = {
                        color: this.colors.text,
                        font: {
                            size: 11,
                            weight: 'normal'
                        }
                    };
                    Chart.defaults.scales[scaleType].title = {
                        color: this.colors.text,
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    };
                }
            });
        }
    }

    // Force Maersk colors on existing charts - ULTRA AGGRESSIVE
    forceChartUpdate() {
        if (typeof Chart !== 'undefined' && Chart.instances) {
            Chart.instances.forEach((chartInstance) => {
                if (chartInstance && chartInstance.data && chartInstance.data.datasets) {
                    // Apply Maersk colors to datasets
                    chartInstance.data.datasets = this.applyDatasetColors(chartInstance.data.datasets, true);
                    
                    // Force chart options update
                    chartInstance.options = this.getChartOptions(chartInstance.options);
                    
                    // Update the chart
                    chartInstance.update('none');
                }
            });
        }
    }

    // Get dark theme chart options - COMPREHENSIVE
    getChartOptions(customOptions = {}) {
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 20,
                    left: 20,
                    right: 20
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: this.colors.text,
                        font: {
                            size: 13,
                            weight: '600',
                            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        },
                        padding: 20,
                        usePointStyle: true
                    }
                },
                title: {
                    color: this.colors.text,
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    },
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(42, 47, 56, 0.95)',
                    titleColor: this.colors.text,
                    bodyColor: this.colors.text,
                    borderColor: this.colors.border,
                    borderWidth: 1,
                    cornerRadius: 8,
                    titleFont: {
                        size: 13,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: this.colors.grid,
                        borderColor: this.colors.border,
                        borderWidth: 2
                    },
                    ticks: {
                        color: this.colors.text,
                        font: {
                            size: 11,
                            weight: 'normal',
                            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        }
                    },
                    title: {
                        color: this.colors.text,
                        font: {
                            size: 13,
                            weight: 'bold',
                            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        }
                    }
                },
                y: {
                    grid: {
                        color: this.colors.grid,
                        borderColor: this.colors.border,
                        borderWidth: 2
                    },
                    ticks: {
                        color: this.colors.text,
                        font: {
                            size: 11,
                            weight: 'normal',
                            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        }
                    },
                    title: {
                        color: this.colors.text,
                        font: {
                            size: 13,
                            weight: 'bold',
                            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                        }
                    }
                }
            }
        };

        return this.mergeDeep(defaultOptions, customOptions);
    }

    // Apply ONLY MAERSK COLORS - FORCE BRANDING, NO GREEN/ORANGE
    applyDatasetColors(datasets, forceUpdate = false) {
        return datasets.map((dataset, index) => {
            const colorIndex = index % this.defaultDatasetColors.length;
            const colors = this.defaultDatasetColors[colorIndex];
            
            // FORCE Maersk colors regardless of existing colors, especially for histograms
            const updatedDataset = {
                ...dataset,
                backgroundColor: colors.backgroundColor,
                borderColor: colors.borderColor,
                borderWidth: colors.borderWidth,
                pointBackgroundColor: colors.pointBackgroundColor,
                pointBorderColor: colors.pointBorderColor,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.2
            };

            // Special handling for different chart types - ALL MAERSK BLUES
            if (dataset.type === 'bar' || dataset.label?.toLowerCase().includes('distribution') || dataset.label?.toLowerCase().includes('histogram')) {
                // For bar charts/histograms - use Maersk blue variations
                if (dataset.label?.toLowerCase().includes('contract') || dataset.label?.toLowerCase().includes('favor')) {
                    updatedDataset.backgroundColor = '#0077BE';
                    updatedDataset.borderColor = '#003F5C';
                } else {
                    updatedDataset.backgroundColor = '#4A9FD9';
                    updatedDataset.borderColor = '#0077BE';
                }
                updatedDataset.borderWidth = 2;
            }

            if (dataset.label?.toLowerCase().includes('percentile') || dataset.label?.toLowerCase().includes('confidence')) {
                updatedDataset.backgroundColor = 'rgba(0, 119, 190, 0.15)';
                updatedDataset.borderColor = '#0077BE';
                updatedDataset.borderWidth = 1;
                updatedDataset.pointRadius = 0;
                updatedDataset.fill = true;
            }
            
            if (dataset.label?.toLowerCase().includes('mean') || dataset.label?.toLowerCase().includes('average')) {
                updatedDataset.backgroundColor = 'rgba(0, 119, 190, 0.9)';
                updatedDataset.borderColor = '#0077BE';
                updatedDataset.borderWidth = 4;
                updatedDataset.pointRadius = 5;
            }

            if (dataset.label?.toLowerCase().includes('spot') || dataset.label?.toLowerCase().includes('price')) {
                updatedDataset.backgroundColor = 'rgba(74, 159, 217, 0.8)';
                updatedDataset.borderColor = '#4A9FD9';
                updatedDataset.borderWidth = 3;
            }

            if (dataset.label?.toLowerCase().includes('contract')) {
                updatedDataset.backgroundColor = 'rgba(0, 168, 230, 0.8)';
                updatedDataset.borderColor = '#00A8E6';
                updatedDataset.borderWidth = 3;
            }

            // FORCE override any remaining green/orange colors
            if (updatedDataset.backgroundColor?.includes('green') || 
                updatedDataset.backgroundColor?.includes('#22c55e') ||
                updatedDataset.backgroundColor?.includes('#f59e0b') ||
                updatedDataset.backgroundColor?.includes('orange') ||
                updatedDataset.borderColor?.includes('green') ||
                updatedDataset.borderColor?.includes('#22c55e') ||
                updatedDataset.borderColor?.includes('#f59e0b') ||
                updatedDataset.borderColor?.includes('orange')) {
                
                updatedDataset.backgroundColor = colors.backgroundColor;
                updatedDataset.borderColor = colors.borderColor;
            }
            
            return updatedDataset;
        });
    }

    // Create a chart with dark theme applied - SUPER FORCED
    createChart(ctx, config) {
        // Force canvas background
        if (ctx && ctx.canvas) {
            ctx.canvas.style.backgroundColor = this.colors.background;
        }
        
        // Apply dark theme options
        config.options = this.getChartOptions(config.options || {});
        
        // Apply ONLY Maersk colors to datasets
        if (config.data && config.data.datasets) {
            config.data.datasets = this.applyDatasetColors(config.data.datasets, true);
        }

        const chart = new Chart(ctx, config);
        
        // Force update after creation
        setTimeout(() => {
            if (chart && chart.canvas) {
                chart.canvas.style.backgroundColor = this.colors.background;
                
                // Force re-apply colors one more time
                if (chart.data && chart.data.datasets) {
                    chart.data.datasets = this.applyDatasetColors(chart.data.datasets, true);
                }
                
                chart.update('none');
            }
        }, 100);

        return chart;
    }

    // Deep merge utility function
    mergeDeep(target, source) {
        const output = Object.assign({}, target);
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target))
                        Object.assign(output, { [key]: source[key] });
                    else
                        output[key] = this.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }
}

// Create global instance
window.chartTheme = new ChartTheme();

// Apply global defaults when Chart.js is available
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart !== 'undefined') {
        window.chartTheme.applyGlobalDefaults();
        
        // Force update existing charts every second for the first 15 seconds - MORE AGGRESSIVE
        let attempts = 0;
        const forceUpdate = setInterval(() => {
            window.chartTheme.forceChartUpdate();
            attempts++;
            if (attempts >= 15) {
                clearInterval(forceUpdate);
            }
        }, 1000);
    }
});

// Override Chart constructor to force dark theme - SUPER AGGRESSIVE
if (typeof Chart !== 'undefined') {
    const originalChart = Chart;
    window.Chart = function(ctx, config) {
        return window.chartTheme.createChart.call(window.chartTheme, ctx, config);
    };
    
    // Copy static properties
    Object.keys(originalChart).forEach(key => {
        window.Chart[key] = originalChart[key];
    });
}

// Additional force update on window load
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.chartTheme) {
            window.chartTheme.forceChartUpdate();
        }
    }, 2000);
});

export default ChartTheme; 