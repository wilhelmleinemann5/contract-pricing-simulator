// Chart.js Dark Theme Configuration
// Automatically applies Maersk dark theme colors to all charts

class ChartTheme {
    constructor() {
        this.colors = {
            background: '#252930',
            text: '#b8c5d1',
            textSecondary: '#8b9aa8',
            grid: 'rgba(184, 197, 209, 0.1)',
            border: 'rgba(184, 197, 209, 0.2)',
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
                backgroundColor: 'rgba(0, 119, 190, 0.7)',
                borderColor: '#0077BE'
            },
            {
                backgroundColor: 'rgba(74, 159, 217, 0.7)',
                borderColor: '#4A9FD9'
            },
            {
                backgroundColor: 'rgba(0, 168, 230, 0.7)',
                borderColor: '#00A8E6'
            },
            {
                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                borderColor: '#22c55e'
            },
            {
                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                borderColor: '#ef4444'
            },
            {
                backgroundColor: 'rgba(245, 158, 11, 0.7)',
                borderColor: '#f59e0b'
            }
        ];
    }

    // Apply dark theme to Chart.js default config
    applyGlobalDefaults() {
        if (typeof Chart !== 'undefined') {
            Chart.defaults.color = this.colors.text;
            Chart.defaults.backgroundColor = this.colors.background;
            Chart.defaults.borderColor = this.colors.border;
            
            Chart.defaults.plugins.legend.labels.color = this.colors.text;
            Chart.defaults.plugins.title.color = this.colors.text;
            
            Chart.defaults.scales.linear.grid.color = this.colors.grid;
            Chart.defaults.scales.linear.ticks.color = this.colors.text;
            Chart.defaults.scales.linear.title.color = this.colors.text;
            
            Chart.defaults.scales.category.grid.color = this.colors.grid;
            Chart.defaults.scales.category.ticks.color = this.colors.text;
            Chart.defaults.scales.category.title.color = this.colors.text;
        }
    }

    // Get dark theme chart options
    getChartOptions(customOptions = {}) {
        const defaultOptions = {
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
            plugins: {
                legend: {
                    labels: {
                        color: this.colors.text,
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    color: this.colors.text,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(42, 47, 56, 0.95)',
                    titleColor: this.colors.text,
                    bodyColor: this.colors.text,
                    borderColor: this.colors.border,
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        color: this.colors.grid,
                        borderColor: this.colors.border
                    },
                    ticks: {
                        color: this.colors.text,
                        font: {
                            size: 11
                        }
                    },
                    title: {
                        color: this.colors.text,
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    grid: {
                        color: this.colors.grid,
                        borderColor: this.colors.border
                    },
                    ticks: {
                        color: this.colors.text,
                        font: {
                            size: 11
                        }
                    },
                    title: {
                        color: this.colors.text,
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    }
                }
            }
        };

        return this.mergeDeep(defaultOptions, customOptions);
    }

    // Apply dark theme colors to dataset
    applyDatasetColors(datasets, colorScheme = 'maersk') {
        return datasets.map((dataset, index) => {
            if (colorScheme === 'maersk') {
                const colorIndex = index % this.defaultDatasetColors.length;
                const colors = this.defaultDatasetColors[colorIndex];
                
                return {
                    ...dataset,
                    backgroundColor: dataset.backgroundColor || colors.backgroundColor,
                    borderColor: dataset.borderColor || colors.borderColor,
                    borderWidth: dataset.borderWidth || 2
                };
            }
            
            // For status-based colors (success/error/warning)
            if (colorScheme === 'status') {
                if (dataset.label?.toLowerCase().includes('success') || dataset.label?.toLowerCase().includes('positive')) {
                    return {
                        ...dataset,
                        backgroundColor: `${this.colors.success}80`,
                        borderColor: this.colors.success
                    };
                } else if (dataset.label?.toLowerCase().includes('error') || dataset.label?.toLowerCase().includes('negative')) {
                    return {
                        ...dataset,
                        backgroundColor: `${this.colors.error}80`,
                        borderColor: this.colors.error
                    };
                } else if (dataset.label?.toLowerCase().includes('warning')) {
                    return {
                        ...dataset,
                        backgroundColor: `${this.colors.warning}80`,
                        borderColor: this.colors.warning
                    };
                }
            }
            
            return dataset;
        });
    }

    // Create a chart with dark theme applied
    createChart(ctx, config) {
        // Apply dark theme options
        config.options = this.getChartOptions(config.options || {});
        
        // Apply dark theme colors to datasets
        if (config.data && config.data.datasets) {
            config.data.datasets = this.applyDatasetColors(config.data.datasets);
        }

        return new Chart(ctx, config);
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
    }
});

export default ChartTheme; 