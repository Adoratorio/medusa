# Medusa

A lightweight, SSR-friendly utility for managing multiple `IntersectionObserver` instances with TypeScript support. Ideal for lazy loading, animations, and viewport-based triggers.

## Installation

```bash
npm install @adoratorio/medusa
```

## Usage

This package is ESM-only. Import it as a module:

```typescript
import Medusa from '@adoratorio/medusa';

const medusa = new Medusa({ debug: true });
```

## Configuration

### MedusaOptions

| Parameter | Type | Default | Description |
| :-------- | :--: | :-----: | :---------- |
| `observers` | `MedusaObserverConfig[]` | `[]` | Array of observer configurations |
| `debug` | `boolean` | `false` | Enable console debugging |

### Observer Configuration

```typescript
interface MedusaObserverConfig {
  id: string;
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
  nodes?: Element | Iterable<Element> | null;
  mode?: Mode;
  emit?: boolean;     // dispatch a `medusa-<id>` CustomEvent on the target
  bubbles?: boolean;  // whether that event bubbles (default false)
  callback?: MedusaCallback;
}

type MedusaCallback = (
  entry: IntersectionObserverEntry,
  observer: IntersectionObserver,
) => void;
```

#### Available Modes

```typescript
const MODE = {
  DEFAULT: 'DEFAULT',    // Trigger on every intersection
  ONCE: 'ONCE',          // Trigger only once, when the (lowest) threshold is reached
  BYPIXELS: 'BYPIXELS',  // Trigger every 1% of intersection (101 thresholds)
} as const;
```

## Methods

### Management Methods

```typescript
// Add single observer
medusa.addObserver({
  id: 'myObserver',
  threshold: 0.5,
  callback: (entry, observer) => console.log('Intersecting:', entry.isIntersecting),
});

// Observe multiple elements (accepts Iterable<Element>)
const elements = document.querySelectorAll('.targets');
medusa.observe('myObserver', elements);

// Get observer instance
const observer = medusa.getObserver('myObserver');

// Clear specific observer
medusa.clearObserver('myObserver');

// Unobserve elements
medusa.unobserve('myObserver', element);

// Destroy instance
medusa.destroy();
```

## Events

When `emit: true` is set, Medusa emits custom events on intersecting elements:

```typescript
import type { MedusaEvent } from '@adoratorio/medusa';

element.addEventListener('medusa-myObserver', (e) => {
  const event = e as MedusaEvent;
  const entry: IntersectionObserverEntry = event.detail;
  console.log('Intersection ratio:', entry.intersectionRatio);
});
```

## TypeScript Support

Medusa is written in TypeScript and includes full type definitions, making it completely type-safe out of the box.