export const MODE = {
  DEFAULT: 'DEFAULT',
  ONCE: 'ONCE',
  BYPIXELS: 'BYPIXELS',
} as const;

export type Mode = (typeof MODE)[keyof typeof MODE];

export type MedusaEvent = CustomEvent<IntersectionObserverEntry>;

export type MedusaCallback = (
  entry: IntersectionObserverEntry,
  observer: IntersectionObserver,
) => void;

export interface MedusaObserverConfig {
  id: string;
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
  nodes?: Element | Iterable<Element> | null;
  mode?: Mode;
  emit?: boolean;
  // Whether the emitted `medusa-<id>` events bubble up from the target
  bubbles?: boolean;
  callback?: MedusaCallback;
}

export interface MedusaObserver {
  instance: IntersectionObserver;
  observedNodes: Set<Element>;
  mode: Mode;
  emit: boolean;
  bubbles: boolean;
  // Lowest configured threshold: ONCE fires only when it is actually reached
  minThreshold: number;
  callback?: MedusaCallback | undefined;
}

export interface MedusaOptions {
  observers?: MedusaObserverConfig[];
  debug?: boolean;
}
