---
description: Comprehensive Dropins, Containers, and Slots Rules
globs:
alwaysApply: true
---

# Dropins, Containers, and Slots - Comprehensive Rules

## Dropins Overview

### What Are Dropins

- **Dropins** are domain-specific microfrontends for Adobe Commerce storefronts.
- They are **NOT blocks** - dropins have "containers" which are functions that render into DOM elements.
- Dropins provide pre-built e-commerce functionality (cart, checkout, product display, search, etc.).
- Dropins are imported from `@dropins/` namespace
- A single block can contain multiple dropin containers, each rendered into a different DOM element
- If a block imports from "@dropins/.." namespace, it is using Dropins in some form, such as a container, or api function.

## Essential Requirements for Working with Dropins

- **MANDATORY: ALWAYS use the search_storefront_docs MCP** to search documentation before implementing any dropin customization
- **MANDATORY: Verify all slots and props** using the MCP before using them in code
- **MANDATORY: Never assume slot names** - always check documentation first
- **MANDATORY: Use container props and interface if possible before using CSS** by using the documented interface, like Slots or container arguments, before using CSS
- A dropin must be first initialized before use. This is done in the `scripts/initializers` folder, usually once per dropin.

## Documentation Access

### Available Documentation
- Block README.md
- Dropin Documentation (published at https://experienceleague.adobe.com/developer/commerce/storefront/ – search with `site:www.experienceleague.adobe.com` to restrict web search results)
- Dropin TypeScript Definitions in `node_modules/@dropins/`
- `search_storefront_docs`MCP

### Using Block README.md

- Each block should have a README.md file that describes the block, how it is configured, and other side effects.

### Documentation Structure

- Each dropin has its own documentation area at https://experienceleague.adobe.com/developer/commerce/storefront/dropins/{dropin-name}/ where {dropin-name} is the name of the dropin such as `cart`, `checkout`, `product-details`, `product-discovery`, etc.
- Each section of the experienceleague documentation contains information about the dropin such as installation, styling, "api functions", containers, slots, and a "dictionary" for internationalization.

### Storefront MCP

- Always use `search_storefront_docs` MCP for dropin documentation if more context is needed
- Search for specific containers, props, or slots
- Look for examples and usage patterns

## Containers

### What Are Containers

- **Containers** are component functions exported from dropins that render into DOM elements.
- Containers manage and display data for specific use cases, and often provide interactive elements.
- Containers are rendered into DOM elements using `render` provider functions.

### Container Usage Pattern
```javascript
import ContainerName from '@dropins/dropin-name/containers/ContainerName.js';
import { render as provider } from '@dropins/dropin-name/render.js';

// Render container into DOM element
provider(ContainerName, {
  // Container props
  prop1: value1,
  prop2: value2,
  slots: {
    SlotName: (ctx) => {
      // Custom slot content
    }
  }
})(domElement);
```

### Container Props
- Each container has specific options defined in its type definitions.
- Arguments are passed to the render function with the container being passed as the first argument and the container options being passed in an object as the second argument.
- Common options include callback functions, slot callbacks, and other configuration options.
- **NEVER hallucinate arguments** - always check types and documentation

### Container Rendering
- Containers are rendered using dropin provider functions
- Multiple containers can be rendered in the same block
- Each container needs its own DOM element

## Slots

### What Are Slots
- Slots are interfaces to customize content within containers
- They allow injection of custom content into specific areas.
- **NEVER hallucinate slots** - always check types and documentation.
- If an appropriate slot does not exist, then using the block layout (ie `createContextualFragment`) is the next best option.

### Slot Usage Pattern
```javascript
provider(ContainerName, {
  // Container props
  slots: {
    SlotName: (ctx) => {
      // Create custom content
      const customElement = document.createElement('div');
      customElement.textContent = 'Custom content';
      ctx.replaceWith(customElement);
    }
  }
})(domElement);
```

## Dropin Integration Rules

### Import Patterns
```javascript
// Dropin Tools
import { debounce } from '@dropins/tools/lib.js';
import { events } from '@dropins/tools/event-bus.js';
import { Button, Icon } from '@dropins/tools/components.js';

// Dropin APIs
import * as cartApi from '@dropins/storefront-cart/api.js';
import * as pdpApi from '@dropins/storefront-pdp/api.js';

// Dropin Containers
import CartSummaryList from '@dropins/storefront-cart/containers/CartSummaryList.js';
import ProductHeader from '@dropins/storefront-pdp/containers/ProductHeader.js';

// Dropin Providers
import { render as cartProvider } from '@dropins/storefront-cart/render.js';
import { render as pdpProvider } from '@dropins/storefront-pdp/render.js';
```

### Provider Setup
- Each dropin has a "render" function (usually aliased as "provider") that must be used to render into a given DOM element.
- Providers handle rendering the container into a given DOM element.
- Multiple containers can use the same provider.
- A global provider can be used to render Dropin SDK components into the DOM.

```javascript
import { Button, Icon, provider as UI } from '@dropins/tools/components.js';

UI.render(Button, {
  children: "Click Me",
  icon: Icon({ source: 'Burger' }),
  variant: 'secondary',
  onClick: () => {
    // do something
  },
})($domElement),
```

### Event Handling
- Use dropin APIs for data operations such as adding items to a cart.
- Use event bus for inter-dropin communication such as when a cart item is added to the cart.

## Customization Guidelines

### Before Customizing
1. **Check Documentation**: Use `search_storefront_docs` MCP to find dropin documentation
2. **Use Slots First**: Try to customize using slots before CSS
3. **Check Container Props**: Look for configuration options
4. **Avoid Hallucination**: Never guess at props or slots

### CSS Customization
- Target dropin classes specifically
- Use CSS custom properties when available
- Test across different screen sizes

### Container Customization
- Use documented props and slots
- Check for configuration options
- Maintain dropin functionality

**MANDATORY: Before implementing any dropin container customization:**

1. **Identify Target Location**: Find the specific DOM element in the block fragment where you want to add the feature
2. **Find the Container**: Determine which dropin container renders into that location
3. **Check TypeScript Definitions**: Always examine the container's `.d.ts` file to see available slots and props
4. **Verify with MCP**: Use `search_storefront_docs` MCP to confirm slot availability and get usage examples
5. **Choose Implementation Method**:
   - **If slots exist**: Use the documented slot interface
   - **If no slots exist**: Create an element and append it to the container element after render
   - **NEVER assume slots exist** without verification

**Example Workflow:**
```javascript
// 1. Target: .product-details__header div
// 2. Container: ProductHeader
// 3. Check: ProductHeader.d.ts shows no slots
// 4. MCP: Confirms no ProductRating slot
// 5. Implementation: DOM manipulation after render

pdpRendered.render(ProductHeader, {})($header).then(() => {
  // Add custom content after container renders
  const customElement = createCustomElement();
  $header.appendChild(customElement);
});
```

**Common Mistakes to Avoid:**
- ❌ Assuming slot names without checking TypeScript definitions
- ❌ Using non-existent slots (like ProductRating)
- ❌ Not checking container interface before implementation

## Error Handling

### Common Issues
- **Missing Provider**: Ensure dropin provider is set up
- **Invalid Props**: Check container documentation for valid props
- **Missing Slots**: Verify slot names in documentation

### Debugging
- Verify container props match type definitions and documentation
- Use dropin documentation for troubleshooting
