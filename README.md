# Medusa
A lightweight utility for managing multiple IntersectionObserver instances with TypeScript support.

## Installation
```sh
npm install @adoratorio/medusa
```

## Usage
```typescript
import Medusa from '@adoratorio/medusa';

const medusa = new Medusa({ debug: true });
```

## Configuration

### MedusaOptions
| Parameter | Type | Default | Description |
| :-------: | :--: | :-----: | :---------- |
| observers | `MedusaObserverConfig[]` | `[]` | Array of observer configurations |
| debug | `boolean` | `false` | Enable console debugging |

### Observer Configuration
```typescript
interface MedusaObserverConfig {
  id: string;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  nodes?: Element | Element[];
  mode?: MODE;
  emit?: boolean;
  callback?: MedusaCallback;
}

type MedusaCallback = (
  entry: IntersectionObserverEntry,
  observer: IntersectionObserver | null,
) => void;
```

#### Configuration Options
| Parameter | Type | Default | Description |
| :-------: | :--: | :-----: | :---------- |
| id | `string` | required | Unique observer identifier |
| root | `Element` | `null` | Viewport element for intersection checking |
| rootMargin | `string` | `'0px'` | Margin around root (CSS format) |
| threshold | `number\|number[]` | `0` | Intersection threshold(s) |
| mode | `MODE` | `DEFAULT` | Observer behavior mode |
| emit | `boolean` | `false` | Emit custom events on intersection |
| callback | `MedusaCallback` | `undefined` | Intersection callback function |

### Available Modes
```typescript
enum MODE {
  DEFAULT = 'DEFAULT',    // Trigger on every intersection
  ONCE = 'ONCE',          // Trigger only once
  BYPIXELS = 'BYPIXELS',  // Trigger per pixel in viewport
}
```

## Methods

### Adding Observers
```typescript
// Add single observer
medusa.addObserver({
  id: 'myObserver',
  threshold: 0.5,
  callback: (entry, observer) => console.log('Intersecting:', entry.isIntersecting),
});

// Add multiple observers
medusa.addObserver([
  { id: 'observer1', mode: Medusa.MODE.ONCE },
  { id: 'observer2', mode: Medusa.MODE.BYPIXELS },
]);
```

### Observing Elements
```typescript
// Observe single element
const element = document.querySelector('.target');
medusa.observe('myObserver', element);

// Observe with custom callback
medusa.observe('myObserver', element, (entry, observer) => {
  console.log('Custom callback for this element');
});

// Observe multiple elements
const elements = document.querySelectorAll('.targets');
medusa.observe('myObserver', Array.from(elements));
```

### Management Methods
```typescript
// Get observer instance
const observer = medusa.getObserver('myObserver');

// Clear specific observer
medusa.clearObserver('myObserver');

// Clear all observers
medusa.clearAllObservers();

// Remove specific observer
medusa.removeObserver('myObserver');

// Remove all observers
medusa.removeAllObservers();

// Unobserve elements
medusa.unobserve('myObserver', element);

// Destroy instance
medusa.destroy();
```

## Events
When `emit: true` is set, Medusa emits custom events on intersecting elements:

```typescript
// Event name format: medusa-${observerId}
element.addEventListener('medusa-myObserver', (event: CustomEvent) => {
  const entry: IntersectionObserverEntry = event.detail;
  console.log('Intersection ratio:', entry.intersectionRatio);
});
```

### Event Details
The event.detail contains the IntersectionObserverEntry:

```typescript
{
  time: number;
  rootBounds: DOMRectReadOnly;
  boundingClientRect: DOMRectReadOnly;
  intersectionRect: DOMRectReadOnly;
  isIntersecting: boolean;
  intersectionRatio: number;
  target: Element;
}
```

## TypeScript Support
Medusa is written in TypeScript and includes full type definitions:

```typescript
import type {
  MedusaOptions,
  MedusaObserverConfig,
  MedusaCallback,
} from '@adoratorio/medusa';
```
