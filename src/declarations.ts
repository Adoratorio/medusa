export enum MODE {
  DEFAULT = 'DEFAULT',
  ONCE = 'ONCE',
  BYPIXELS = 'BYPIXELS',
}

export type MedusaEvent = CustomEvent<IntersectionObserverEntry>;

export type MedusaCallback = (
  entry: IntersectionObserverEntry,
  observer: IntersectionObserver | null,
) => void;

export interface MedusaElement extends Element {
  _medusaObserversList?: Map<string, {
    id: string;
    callback?: MedusaCallback | undefined;
  }>;
}

export interface MedusaObserverConfig {
  id: string;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  nodes?: MedusaElement | MedusaElement[];
  mode?: MODE;
  emit?: boolean;
  callback?: MedusaCallback;
}

export interface MedusaObserver {
  instance: IntersectionObserver | null;
  observedNodes: Map<string, MedusaElement>;
  mode: MODE;
  emit: boolean;
  callback?: MedusaCallback | undefined;
}

export interface MedusaOptions {
  observers?: MedusaObserverConfig[];
  debug?: boolean;
}
