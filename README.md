# Medusa

Manage intersection observers for lazy loading, animations and viewport interactions.

## Installation

```bash
npm install @adoratorio/medusa
```

## Usage

This package is ESM-only. Import it as a module:

```typescript
import Medusa from '@adoratorio/medusa';

const medusa = new Medusa();
medusa.addObserver({
  id: 'reveal',
  mode: Medusa.MODE.ONCE,
  threshold: 0.5,
  callback: (entry) => entry.target.classList.add('is-visible'),
});
medusa.observe('reveal', document.querySelectorAll('.reveal'));
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

### Observer defaults

Only `id` is required. Options omitted from `addObserver()` or an entry in the constructor's `observers` array use these values:

| Parameter | Type | Default | Description |
| :-------- | :--- | :------ | :---------- |
| `id` | `string` | Required | Non-empty observer identifier. An existing ID is skipped, not replaced. |
| `root` | `Element \| Document \| null` | `null` | Intersection root; `null` uses the viewport. |
| `rootMargin` | `string` | `'0px 0px 0px 0px'` | Margins around the root, in IntersectionObserver syntax. |
| `threshold` | `number \| number[]` | `0` | Intersection ratio or ratios between 0 and 1. An empty array behaves as zero. |
| `nodes` | `Element \| Iterable<Element> \| null` | `undefined` | Optional elements to observe immediately. Otherwise, call `observe()` later. |
| `mode` | `Mode` | `Medusa.MODE.DEFAULT` | Delivery mode described below. |
| `emit` | `boolean` | `false` | Dispatch a `medusa-<id>` event on the target in addition to any callback. |
| `bubbles` | `boolean` | `false` | Allow emitted events to bubble; only applies when `emit` is enabled. |
| `callback` | `MedusaCallback` | `undefined` | Default callback for this observer, unless overridden for an element. |

`DEFAULT` delivers the browser's intersection notifications, including initial notifications and exits; check `entry.isIntersecting` when handling entry only. `ONCE` waits for an intersecting entry at the lowest configured threshold, then unobserves that element before delivering the event and callback. Observing the element again starts a new observation. `BYPIXELS` replaces `threshold` with 101 ratios from 0 to 1 in steps of 0.01; these are ratio steps, not literal pixel distances.

## Methods

### Adding observers

```typescript
// Add single observer
medusa.addObserver({
  id: 'myObserver',
  threshold: 0.5,
  callback: (entry, observer) => console.log('Intersecting:', entry.isIntersecting),
});

// Add several configurations at once
medusa.addObserver([
  { id: 'once', mode: Medusa.MODE.ONCE },
  { id: 'progress', mode: Medusa.MODE.BYPIXELS },
]);
```

`addObserver(config)` accepts one configuration or an array and returns `void`. Invalid or duplicate IDs are skipped, with diagnostics when `debug` is enabled. Use `removeObserver(id)` before registering a replacement configuration.

### Observing elements

`observe(observerId, elements, callback?)` returns `void`. The observer must already exist. Pass one element or an iterable such as a NodeList, HTMLCollection, array or Set. `null` and `undefined` inputs are ignored.

```typescript
const element = document.querySelector('.target');
medusa.observe('myObserver', element);

const elements = document.querySelectorAll('.targets');
medusa.observe('myObserver', elements);

// Override the observer callback for each element in this call
medusa.observe('myObserver', elements, (entry, observer) => {
  console.log(entry.target, entry.intersectionRatio, observer);
});
```

The optional third argument receives `(entry: IntersectionObserverEntry, observer: IntersectionObserver)`. It replaces the observer-level callback for those elements; the two callbacks are not both called. Other elements retain their own callbacks or the observer default. Custom event emission remains independent of callback selection.

Calling `observe()` again for an already observed element updates its callback. Omitting the third argument on that later call clears the element override and restores the observer-level callback. If neither callback exists, no callback runs.

### Managing observers

```typescript
// Get observer instance
const observer = medusa.getObserver('myObserver');

// Clear specific observer
medusa.clearObserver('myObserver');

medusa.clearAllObservers();
medusa.removeObserver('myObserver');
medusa.removeAllObservers();

// Unobserve elements
medusa.unobserve('myObserver', element);

// Destroy instance
medusa.destroy();
```

| Method | Return | Behavior |
| :----- | :----- | :------- |
| `getObserver(id)` | `MedusaObserver \| null` | Registered observer state, or `null` when the ID is absent. |
| `unobserve(id, elements)` | `void` | Stop observing the given element or iterable and remove its callback override. Accepts `null` and `undefined`. |
| `clearObserver(id)` | `void` | Unobserve every target while retaining the observer configuration for reuse. |
| `clearAllObservers()` | `void` | Clear targets from every registered observer, retaining their configurations. |
| `removeObserver(id)` | `void` | Disconnect and delete the observer, its target tracking and callback overrides. |
| `removeAllObservers()` | `void` | Remove every registered observer. |
| `destroy()` | `void` | Calls `removeAllObservers()` to release all observations. |

Missing IDs are ignored by operations that need an existing observer, with diagnostics when `debug` is enabled. The object returned by `getObserver()` exposes `instance`, `observedNodes` (a `Set<Element>`), `mode`, `emit`, `bubbles`, `minThreshold` and the observer-level `callback`. Use the management methods to change observation state rather than modifying the set directly.

## Events

When `emit: true` is set, Medusa dispatches `medusa-<observerId>` on the target for each delivered notification. This includes exits in DEFAULT and BYPIXELS modes. `event.detail` is the original `IntersectionObserverEntry`, exposing `target`, `isIntersecting`, `intersectionRatio`, `time`, `rootBounds`, `boundingClientRect` and `intersectionRect`. Events are dispatched before callbacks.

```typescript
import type { MedusaEvent } from '@adoratorio/medusa';

element.addEventListener('medusa-myObserver', (e) => {
  const event = e as MedusaEvent;
  const entry: IntersectionObserverEntry = event.detail;
  console.log('Intersection ratio:', entry.intersectionRatio);
});
```

## TypeScript Support

Medusa is written in TypeScript and includes type declarations for its public API.

```typescript
import type {
  Mode,
  MedusaOptions,
  MedusaObserverConfig,
  MedusaObserver,
  MedusaCallback,
  MedusaEvent,
} from '@adoratorio/medusa';
```

## Compatibility

Imports and construction are safe during server-side rendering. Observer creation is skipped when `IntersectionObserver` is unavailable; set up observers on the client after mounting. The package targets ES2023 and does not include polyfills.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, checks and pull requests.
Version history is documented in the [changelog](CHANGELOG.md) and [GitHub releases](https://github.com/Adoratorio/medusa/releases).

## Maintainers

Maintained by [Adoratorio](https://github.com/Adoratorio).

- [Andrea Gottardi](https://github.com/AndreaGottardi)
- [Daniele Borra](https://github.com/borradaniele)
- [Andrea Biason](https://github.com/biazo5)

Contributor credits are preserved in [package.json](package.json) and the Git history.

## License

[MIT](LICENSE).
