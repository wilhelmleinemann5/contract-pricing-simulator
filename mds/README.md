# Maersk Design System Integration

This folder contains a curated integration of the Maersk Design System (MDS) for the Contract Pricing Simulator application.

## 📁 Structure

```
mds/
├── css/
│   └── mds-integration.css    # Main MDS integration file
├── scss/                      # Source SCSS files from MDS
│   ├── _color.scss
│   ├── _typography.scss
│   └── _normalize.scss
└── README.md                  # This file
```

## 🎨 Design Tokens Available

### **Colors**
- **Primary**: Maersk Blue (#0077BE)
- **Secondary**: Maersk Grey (#6C757D) 
- **Status Colors**: Success, Error, Warning, Info
- **Neutral Scale**: From weakest to strongest
- **Brand Accents**: Extended color palette for data visualization

### **Typography**
- **Font Families**: Maersk Headline, Maersk Text, Monospace fallbacks
- **Font Sizes**: XS (12px) to 4XL (36px)
- **Font Weights**: Normal (400), Medium (500), Bold (700)
- **Line Heights**: Tight, Normal, Relaxed

### **Spacing**
- **Scale**: 2px to 64px following 4px base unit
- **Variables**: `--mds-space-{size}` (50, 100, 150, 200, etc.)

### **Components**
- **Buttons**: Primary and secondary variants with hover states
- **Cards**: Header, body, footer structure with shadows
- **Form Elements**: Inputs, labels with focus states
- **Utilities**: Flexbox, spacing, borders, shadows

## 🚀 Usage

### **1. Include in HTML**
```html
<link rel="stylesheet" href="mds/css/mds-integration.css">
```

### **2. Apply Base Class**
```html
<body class="mds">
  <!-- Your content -->
</body>
```

### **3. Use Components**
```html
<!-- Button -->
<button class="mds-button mds-button--primary">Primary Action</button>

<!-- Card -->
<div class="mds-card">
  <div class="mds-card__header">
    <h3 class="mds-headline-sm">Card Title</h3>
  </div>
  <div class="mds-card__body">
    <p>Card content</p>
  </div>
</div>

<!-- Form -->
<label class="mds-label">Input Label</label>
<input class="mds-input" type="text" placeholder="Enter value">
```

### **4. Use Design Tokens**
```css
.custom-element {
  color: var(--mds-text-color-primary);
  background: var(--mds-background-color-primary-weak);
  padding: var(--mds-space-400);
  border-radius: var(--mds-border-radius-md);
}
```

## 🎯 Integration Strategy

### **Backward Compatibility**
- All existing styles remain functional
- MDS classes use `mds-` prefix to avoid conflicts
- Design tokens available as CSS custom properties

### **Progressive Enhancement**
- Apply `.mds` class to enable MDS foundations
- Use MDS components where beneficial
- Leverage design tokens for consistent styling

### **Responsive Design**
- Mobile-first approach with responsive utilities
- Adaptive typography scaling
- Container max-width and padding adjustments

## 🔧 Customization

### **Extending Colors**
```css
:root {
  --custom-brand-color: #YOUR_COLOR;
  --custom-text-color: var(--mds-text-color-primary);
}
```

### **Custom Components**
```css
.custom-component {
  @extend .mds-card;
  /* Additional styling */
}
```

## 📊 Benefits for Pricing Simulator

1. **Consistent Maersk Branding**: Official colors, typography, spacing
2. **Professional UI Components**: Cards, buttons, forms following MDS standards
3. **Accessibility**: Built-in focus states, color contrast, semantic markup
4. **Responsive Design**: Mobile-friendly utilities and breakpoints
5. **Maintainability**: Design token system for easy theming updates

## 🔗 Related Files

- **Main Application**: Uses existing styles with progressive MDS enhancement
- **Chart.js Styling**: Can leverage MDS color tokens for consistent data visualization
- **Component Integration**: Forms, cards, navigation can adopt MDS classes

## 📈 Future Enhancements

- **Icon System**: Integrate Maersk iconography
- **Animation Tokens**: Add motion design tokens
- **Dark Theme**: Extend with dark mode support
- **Component Library**: Build custom components following MDS patterns

---

*This integration is based on Maersk Design System v2 and provides essential design tokens and components for professional shipping industry applications.* 