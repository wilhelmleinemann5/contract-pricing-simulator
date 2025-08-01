# Contract Pricing Simulator

A sophisticated web-based platform for shipping and logistics pricing analysis, featuring Monte Carlo simulations, option pricing models, and demand curve analysis with market shock assessment.

## 🚀 Overview

This comprehensive pricing simulator provides three integrated analysis modules designed for shipping, logistics, and supply chain professionals to make data-driven pricing decisions under uncertainty.

### **📊 Main Simulator**
- **Monte Carlo simulation** for spot price evolution vs contract rates
- **Business-focused risk metrics** including total cost comparison and scenario outcomes
- **Cost distribution analysis** with histogram visualization showing contract vs spot savings
- **Scenario management** with save/load functionality and comparison tables
- **Volume discount modeling** and volatility-based pricing
- **Smart contract rate suggestions** for 1-month and 3-month contracts

### **📈 Option Pricing**
- **Time series option analysis** showing value evolution over 13-week periods
- **Payoff calculator** for call/put instruments with strike price optimization
- **At-the-money analysis** with business-focused tooltips and guidance
- **Strategic timing recommendations** for contract execution
- **Import scenarios** from main simulator for integrated analysis

### **🎯 Demand Analysis**
- **Market shock assessment** using supply/demand equilibrium modeling
- **Parallel shift methodology** for demand curve updates from single observations
- **Smart uncertainty calculation** proportional to shock surprise level
- **Price confidence intervals** propagating demand uncertainty to pricing estimates
- **Configurable supply curves** (flat capacity constraints or sloped cost increases)
- **Customer price sensitivity modeling** with business-friendly elasticity inputs

## 🔧 Key Features

### **Sophisticated Uncertainty Modeling**
- **Adaptive confidence intervals** that widen proportionally to shock severity
- **Price confidence propagation** from demand curve uncertainty to equilibrium estimates
- **Smart surprise assessment** categorizing shocks as expected, moderate, or major
- **Business-realistic uncertainty bounds** avoiding unrealistic "all possibilities" ranges

### **Business Intelligence**
- **Actionable recommendations** with implementation strategies based on analysis
- **Risk categorization** with visual indicators and strategic guidance
- **Cost-focused metrics** showing total contract vs spot costs over full periods
- **Probability-based insights** for business decision confidence

### **Professional UX**
- **Responsive design** working across desktop, tablet, and mobile
- **Contextual help system** with business-focused tooltips
- **Clean navigation** between analysis modules
- **Export capabilities** for detailed results and scenario sharing

## 📋 Usage Scenarios

### **Contract Negotiation**
- Analyze whether to accept a 13-week contract at $3,200 vs staying on spot market
- Understand total cost implications with confidence intervals
- Compare different contract durations and pricing structures

### **Market Shock Response**
- Rapidly assess demand curve shifts after booking surges or capacity constraints
- Calculate optimal price adjustments with uncertainty bounds
- Validate pricing strategies against observed market behavior

### **Option Strategy Planning**
- Evaluate timing for contract execution based on option value evolution
- Optimize strike prices for call/put instruments
- Integrate volatility analysis with contract timing decisions

### **Risk Management**
- Quantify pricing uncertainty with confidence intervals
- Assess scenario outcomes across different market conditions
- Plan implementation strategies based on shock surprise levels

## 🛠 Technical Implementation

### **Frontend Architecture**
- **Pure JavaScript ES6** with modular class-based design
- **Chart.js integration** for sophisticated data visualization
- **CSS Grid/Flexbox** responsive layout system
- **Local storage** for scenario persistence

### **Mathematical Models**
- **Geometric Brownian Motion** for price evolution simulation
- **Power law regression** for demand curve fitting with confidence intervals
- **Analytical equilibrium solutions** for market clearing calculations
- **Monte Carlo sampling** with configurable simulation counts (1K-50K)

### **Business Logic**
- **Volume-based discounting** with relationship pricing models
- **Volatility-adjusted forecasting** using historical market patterns
- **Supply curve configuration** supporting both flat and sloped cost structures
- **Price sensitivity modeling** converting business inputs to economic elasticities

## 🚀 Getting Started

### **Local Development**
```bash
# Clone the repository
git clone https://github.com/your-username/contract-pricing-simulator.git

# Open in browser
open index.html
```

No build process required - runs entirely client-side with modern web standards.

### **GitHub Pages Deployment**
1. Fork or clone this repository
2. Enable GitHub Pages in repository settings
3. Select `main` branch as source
4. Access at `https://your-username.github.io/contract-pricing-simulator/`

### **Quick Start Example**
1. **Main Simulator**: Start with "Bull Market Scenario" from quick examples
2. **Run simulation** with default 10,000 iterations
3. **Review cost distribution** and total cost comparison metrics
4. **Save scenario** for later analysis or comparison
5. **Option Pricing**: Import saved scenario to analyze timing strategies
6. **Demand Analysis**: Model market shocks with current vs shocked conditions

## 📊 Sample Analysis Output

### **Main Simulator Results**
- Contract vs spot total cost comparison over 13 weeks
- Probability analysis: "Contract cheaper in 79.6% of scenarios"
- Cost distribution histogram with savings/loss visualization
- Suggested contract rates with volume discount optimization

### **Demand Analysis Results**
- Market shock assessment: "Major surprise - 133% demand increase"
- Price confidence intervals: "$4,200 - $5,800 (±18% uncertainty)"
- Implementation strategy based on shock severity
- Supply/demand equilibrium visualization with confidence bands

### **Option Pricing Results**
- Time series showing option values evolving week by week
- Optimal strike price recommendations based on market conditions
- Call/put analysis with business strategy guidance
- Integration with main simulation parameters

## 🔗 Integration Capabilities

The platform supports **cross-module workflows**:
- **Save scenarios** in Main Simulator → **Import to Option Pricing**
- **Baseline conditions** from Demand Analysis → **Validate with Monte Carlo**
- **Uncertainty estimates** from all modules → **Integrated risk assessment**

## 📈 Business Value

- **Data-driven pricing decisions** with quantified uncertainty
- **Risk assessment** across multiple scenarios and time horizons
- **Strategic timing** for contract negotiations and market entry
- **Market intelligence** from shock analysis and demand modeling
- **Professional presentation** ready for stakeholder communication

## 🤝 Contributing

This is a sophisticated business tool designed for professional shipping and logistics pricing analysis. Contributions welcome for additional features, model improvements, or industry-specific enhancements.

## 📄 License

Open source - available for commercial and personal use in shipping, logistics, and supply chain applications.
