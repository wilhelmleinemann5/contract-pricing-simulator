# Option Instrument Pricing PRD

## 1. Introduction/Overview
This feature will add an "Option Pricing" page to the Contract Pricing Simulator. The goal is to help users understand and properly price the value of optionality and risk/uncertainty in shipping contracts, especially in cases where performance is judged against reference prices and customers may want call or put-like instruments. This will demystify the pricing of such instruments and provide transparency for pricing managers and their leadership.

## 2. Goals
- Allow users to price call and put-like instruments (options) on simulated contract rates.
- Enable users to select a week, enter a strike (absolute or as a percentage of the initial market rate), and choose call or put.
- Display the expected value and distribution of the option payoff, based on Monte Carlo simulations.
- Educate users on the impact of volatility and uncertainty on option value.

## 3. User Stories
- As a pricing manager, I want to select a week and strike, and see the value of a call or put option on the simulated rate for that week, so I can make informed pricing decisions.
- As a manager, I want to visualize the distribution of option payoffs, so I can understand the risk and potential upside/downside.
- As a user, I want to enter a strike as a percentage of the initial market rate, so I can easily model scenarios like "25% above market."

## 4. Functional Requirements
1. The system must allow users to select a week (e.g., 1–13) for option payoff evaluation.
2. The system must allow users to enter a strike rate, either as an absolute value or as a percentage of the initial market rate.
3. The system must allow users to choose between call and put option types.
4. The system must calculate, for each simulation, the payoff:
    - Call: `max(0, Simulated Rate - Strike Rate)`
    - Put: `max(0, Strike Rate - Simulated Rate)`
5. The system must display the expected (mean) payoff of the option.
6. The system must display a chart (histogram or boxplot) of the payoff distribution.
7. The system must update results in real time as inputs change.
8. The system must use the company color palette and match the main app's styling.
9. The system must handle invalid input gracefully (e.g., week out of range, negative strike).

## 5. Non-Goals (Out of Scope)
- The feature will not allow editing of the underlying simulation parameters from the option pricing page (users must return to the main simulation page for that).
- The feature will not provide financial advice or regulatory compliance guidance.
- The feature will not support exotic options (e.g., Asian, barrier, etc.)—only vanilla call and put payoffs.

## 6. Design Considerations
- The UI should be consistent with the main app, using the company color palette.
- Inputs should be clear and easy to use (dropdown for week, input for strike, toggle for call/put).
- The payoff distribution chart should be visually clear and support tooltips for summary statistics.
- Consider adding a brief educational tooltip or info box explaining what the option value means and how it is calculated.

## 7. Technical Considerations
- Should reuse the existing Monte Carlo simulation engine and simulated rate data.
- Should be implemented as a new page or tab in the existing app.
- Should be responsive and accessible.
- Should not require additional backend infrastructure.

## 8. Success Metrics
- Users (pricing managers and their bosses) can successfully price call/put-like instruments for any week and strike.
- Users report increased understanding of option value and risk.
- Feature is adopted in at least 80% of pricing scenarios where optionality is relevant.
- No major support issues or confusion reported after rollout.

## 9. Open Questions
- Should the strike input default to a percentage of the initial market rate, or should users choose between absolute and percentage modes?
- Should the payoff chart show additional percentiles (e.g., 5th, 95th) or just mean/median?
- Should users be able to export the payoff data (CSV, image)?
- Any specific accessibility requirements?

---

*This PRD was generated following the process and structure in `.cursor/rules/create-prd.mdc`.* 