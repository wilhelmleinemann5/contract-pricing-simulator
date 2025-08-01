// Chart.js Dark Theme Configuration - AGGRESSIVE OVERRIDE
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
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            neutral: '#6b7785'
        };

        this.defaultDatasetColors = [
            {
                backgroundColor: 'rgba(0, 119, 190, 0.8)',
                borderColor: '#0077BE',
                borderWidth: 3
            },
            {
                backgroundColor: 'rgba(74, 159, 217, 0.8)',
                borderColor: '#4A9FD9',
                borderWidth: 3
            },
            {
                backgroundColor: 'rgba(0, 168, 230, 0.8)',
                borderColor: '#00A8E6',
                borderWidth: 3
            },
            {
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: '#22c55e',
                borderWidth: 3
            },
            {
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: '#ef4444',
                borderWidth: 3
            },
            {
                backgroundColor: 'rgba(245, 158, 11, 0.8)',
                borderColor: '#f59e0b',
                borderWidth: 3
            }
        ];
    }

    // Apply dark theme to Chart.js default config - AGGRESSIVE
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

    // Force Maersk colors on existing charts
    forceChartUpdate() {
        if (typeof Chart !== 'undefined') {
            Chart.instances.forEach((chartInstance) => {
                if (chartInstance && chartInstance.data && chartInstance.data.datasets) {
                    // Apply Maersk colors to datasets
                    chartInstance.data.datasets = this.applyDatasetColors(chartInstance.data.datasets);
                    
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

    // Apply Maersk colors to datasets - FORCE BRANDING
    applyDatasetColors(datasets, colorScheme = 'maersk') {
        return datasets.map((dataset, index) => {
            const colorIndex = index % this.defaultDatasetColors.length;
            const colors = this.defaultDatasetColors[colorIndex];
            
            // Force Maersk colors regardless of existing colors
            const updatedDataset = {
                ...dataset,
                backgroundColor: colors.backgroundColor,
                borderColor: colors.borderColor,
                borderWidth: colors.borderWidth,
                pointBackgroundColor: colors.borderColor,
                pointBorderColor: colors.borderColor,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.2
            };

            // Special handling for specific chart types
            if (dataset.label?.toLowerCase().includes('percentile')) {
                updatedDataset.backgroundColor = 'rgba(0, 119, 190, 0.1)';
                updatedDataset.borderColor = '#0077BE';
                updatedDataset.borderWidth = 1;
                updatedDataset.pointRadius = 0;
            }
            
            if (dataset.label?.toLowerCase().includes('mean')) {
                updatedDataset.backgroundColor = 'rgba(0, 119, 190, 0.8)';
                updatedDataset.borderColor = '#0077BE';
                updatedDataset.borderWidth = 4;
                updatedDataset.pointRadius = 5;
            }

            if (dataset.label?.toLowerCase().includes('contract')) {
                updatedDataset.backgroundColor = 'rgba(0, 168, 230, 0.8)';
                updatedDataset.borderColor = '#00A8E6';
                updatedDataset.borderWidth = 3;
            }
            
            return updatedDataset;
        });
    }

    // Create a chart with dark theme applied - FORCED
    createChart(ctx, config) {
        // Force canvas background
        if (ctx && ctx.canvas) {
            ctx.canvas.style.backgroundColor = this.colors.background;
        }
        
        // Apply dark theme options
        config.options = this.getChartOptions(config.options || {});
        
        // Apply Maersk colors to datasets
        if (config.data && config.data.datasets) {
            config.data.datasets = this.applyDatasetColors(config.data.datasets);
        }

        const chart = new Chart(ctx, config);
        
        // Force update after creation
        setTimeout(() => {
            if (chart && chart.canvas) {
                chart.canvas.style.backgroundColor = this.colors.background;
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
        
        // Force update existing charts every 2 seconds for the first 10 seconds
        let attempts = 0;
        const forceUpdate = setInterval(() => {
            window.chartTheme.forceChartUpdate();
            attempts++;
            if (attempts >= 5) {
                clearInterval(forceUpdate);
            }
        }, 2000);
    }
});

// Override Chart constructor to force dark theme
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

export default ChartTheme; 