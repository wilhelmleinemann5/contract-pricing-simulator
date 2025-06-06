## Relevant Files

- `js/MarketSimulator.js` - Main simulation logic; will need to be extended to support option payoff calculations.
- `js/main.js` - Entry point; may need updates to initialize or route to the new option pricing page/tab.
- `index.html` - Main HTML file; may need to add navigation or a new section for the option pricing UI.
- `styles.css` - For styling the new option pricing page/section and ensuring brand consistency.
- `tasks/prd-option-instrument-pricing.md` - The PRD this task list is based on.

### Notes

- Additional files may be created for modularity (e.g., a new JS module for option pricing logic).
- Unit tests and/or manual test instructions should be added if applicable.

## Tasks

- [ ] 1.0 Add Option Pricing UI
  - [ ] 1.1 Add a new page, tab, or section in the app for option pricing.
  - [ ] 1.2 Add input controls for week selection (dropdown or input).
  - [ ] 1.3 Add input for strike (absolute value or percentage toggle).
  - [ ] 1.4 Add toggle or selector for call/put option type.
  - [ ] 1.5 Add a button or auto-update mechanism to trigger calculation/display results.

- [ ] 2.0 Implement Option Payoff Calculation Logic
  - [ ] 2.1 Extend simulation logic to calculate option payoffs for each simulation (call: max(0, Simulated Rate - Strike), put: max(0, Strike - Simulated Rate)).
  - [ ] 2.2 Support both absolute and percentage-based strike input.
  - [ ] 2.3 Aggregate results to compute expected (mean) payoff and other statistics (e.g., percentiles).

- [ ] 3.0 Integrate Option Pricing with Monte Carlo Simulation Results
  - [ ] 3.1 Ensure option payoff calculations use the same simulated rates as the main simulation.
  - [ ] 3.2 Update results in real time as user inputs change.
  - [ ] 3.3 Ensure performance is acceptable for large numbers of simulations.

- [ ] 4.0 Visualize Option Payoff Distribution
  - [ ] 4.1 Add a chart (histogram or boxplot) to display the distribution of option payoffs.
  - [ ] 4.2 Add summary statistics (mean, median, percentiles) to the UI.
  - [ ] 4.3 (Optional) Allow export of payoff data (CSV, image).

- [ ] 5.0 Ensure Brand Consistency and Responsive Design
  - [ ] 5.1 Apply company color palette and match main app styling.
  - [ ] 5.2 Ensure the new UI is responsive and accessible on all devices.

- [ ] 6.0 Handle Input Validation and Edge Cases
  - [ ] 6.1 Validate week selection (must be within simulation range).
  - [ ] 6.2 Validate strike input (must be positive and reasonable).
  - [ ] 6.3 Handle cases where all simulated rates are above/below strike (payoff always zero).
  - [ ] 6.4 Display user-friendly error messages for invalid input.

- [ ] 7.0 Add Educational Tooltips/Info (Optional)
  - [ ] 7.1 Add tooltips or info boxes explaining option value, payoff calculation, and risk concepts.
  - [ ] 7.2 Link to further reading or documentation if available. 