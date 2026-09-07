import {
  MODE,
  type MedusaCallback,
  type MedusaEvent,
  type MedusaObserver,
  type MedusaObserverConfig,
  type MedusaOptions,
} from './types.ts';
import { THRESHOLDS_BY_PIXELS } from './utils.ts';

const RATIO_TOLERANCE = 1e-6;

class Medusa {
  static readonly MODE: typeof MODE = MODE;

  readonly #debugMode: boolean;
  readonly #observers = new Map<string, MedusaObserver>();
  readonly #elementObservers = new WeakMap<Element, Map<string, MedusaCallback | undefined>>();

  constructor(options: Partial<MedusaOptions> = {}) {
    this.#debugMode = options.debug ?? false;

    if (options.observers?.length) {
      this.addObserver(options.observers);
    }
  }

  #debugWarn(message: string): void {
    if (this.#debugMode) {
      console.warn(`[Medusa] ${message}`);
    }
  }

  #forEachElement(
    elements: Element | Iterable<Element> | null | undefined,
    processor: (el: Element) => void,
  ): void {
    if (!elements) {
      return;
    }
    // Duck-type via nodeType instead of `instanceof Element`: the latter
    // throws ReferenceError on pure Node (no DOM globals), and breaks across
    // realms (iframes) where each window has its own Element constructor.
    if ('nodeType' in elements) {
      if (elements.nodeType === 1) {
        processor(elements);
      }
      return;
    }
    for (const el of elements) {
      if (el) {
        processor(el);
      }
    }
  }

  #forEachConfig(
    config: MedusaObserverConfig | MedusaObserverConfig[],
    processor: (c: MedusaObserverConfig) => void,
  ): void {
    if (Array.isArray(config)) {
      for (const c of config) {
        if (c) {
          processor(c);
        }
      }
    } else if (config) {
      processor(config);
    }
  }

  #cleanupNodeFromObserver(observerId: string, node: Element, observedNodes: Set<Element>): void {
    observedNodes.delete(node);
    const list = this.#elementObservers.get(node);
    if (list) {
      list.delete(observerId);
      if (list.size === 0) {
        this.#elementObservers.delete(node);
      }
    }
  }

  // Observing a node already observed by the same id updates its callback.
  // IntersectionObserver.observe and Set.add are both idempotent.
  #observeTarget(
    id: string,
    medusaObserver: MedusaObserver,
    node: Element,
    callback?: MedusaCallback,
  ): void {
    let list = this.#elementObservers.get(node);
    if (!list) {
      list = new Map();
      this.#elementObservers.set(node, list);
    }
    list.set(id, callback);
    medusaObserver.instance.observe(node);
    medusaObserver.observedNodes.add(node);
  }

  #unobserveTarget(id: string, medusaObserver: MedusaObserver, node: Element): void {
    const list = this.#elementObservers.get(node);
    if (!list?.has(id)) {
      this.#debugWarn(`Element not observed by '${id}' observer`);
      return;
    }

    medusaObserver.instance.unobserve(node);
    this.#cleanupNodeFromObserver(id, node, medusaObserver.observedNodes);
  }

  #emitEventCallback(id: string, entry: IntersectionObserverEntry, bubbles: boolean): void {
    const customEvent: MedusaEvent = new CustomEvent(`medusa-${id}`, {
      detail: entry,
      bubbles,
    });
    entry.target.dispatchEvent(customEvent);
  }

  #createMedusaObserver(config: MedusaObserverConfig): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.#debugWarn(`IntersectionObserver not available; skipping '${config.id}'`);
      return;
    }

    const threshold =
      config.mode === MODE.BYPIXELS ? THRESHOLDS_BY_PIXELS : (config.threshold ?? 0);
    const observerOptions: IntersectionObserverInit = {
      root: config.root ?? null,
      rootMargin: config.rootMargin ?? '0px 0px 0px 0px',
      threshold,
    };

    const observedNodes = new Set<Element>();
    const mode = config.mode ?? MODE.DEFAULT;
    const emit = config.emit ?? false;
    const bubbles = config.bubbles ?? false;
    let minThreshold = 0;
    if (typeof threshold === 'number') {
      minThreshold = threshold;
    } else if (threshold.length > 0) {
      minThreshold = Math.min(...threshold);
    }
    const userCallback = config.callback;

    const instance = new IntersectionObserver((entries, observer) => {
      const isOnceMode = mode === MODE.ONCE;
      const completed = isOnceMode ? new Set<Element>() : null;
      for (const entry of entries) {
        const { target } = entry;
        // Ignore queued notifications from removed or replaced observers/targets.
        if (
          this.#observers.get(config.id)?.instance !== observer ||
          !observedNodes.has(target) ||
          completed?.has(target)
        ) {
          // oxlint-disable-next-line no-continue -- discard stale entries without nesting callback delivery
          continue;
        }
        const targetCallback = this.#elementObservers.get(target)?.get(config.id) ?? userCallback;

        // The initial notification reports any intersection, even below the
        // configured threshold: ONCE must wait for the threshold to be reached
        const reached = isOnceMode ? this.#hasReached(entry, minThreshold) : true;

        if (isOnceMode && reached) {
          completed?.add(target);
          observer.unobserve(target);
          this.#cleanupNodeFromObserver(config.id, target, observedNodes);
        }

        if (reached) {
          if (emit) {
            this.#emitEventCallback(config.id, entry, bubbles);
          }
          if (targetCallback) {
            targetCallback(entry, observer);
          }
        }
      }
    }, observerOptions);

    const medusaObserver: MedusaObserver = {
      instance,
      observedNodes,
      mode,
      emit,
      bubbles,
      minThreshold,
      callback: userCallback,
    };
    this.#observers.set(config.id, medusaObserver);

    if (config.nodes) {
      this.observe(config.id, config.nodes);
    }
  }

  // Ratios reported at a crossing can sit a hair below the threshold
  #hasReached(entry: IntersectionObserverEntry, minThreshold: number): boolean {
    return entry.isIntersecting && entry.intersectionRatio + RATIO_TOLERANCE >= minThreshold;
  }

  #validateObserverConfig(config: MedusaObserverConfig): boolean {
    if (!(typeof config.id === 'string' && config.id.trim() !== '')) {
      throw new Error('[Medusa] Observer id is required and must be a non-empty string');
    }
    if (this.#observers.has(config.id)) {
      this.#debugWarn(`Observer with ID '${config.id}' already exists. Configuration skipped.`);
      return false;
    }
    return true;
  }

  public getObserver(observerId: string): MedusaObserver | null {
    const observer = this.#observers.get(observerId);
    if (!observer) {
      this.#debugWarn(`Observer '${observerId}' does not exist`);
      return null;
    }
    return observer;
  }

  public addObserver(config: MedusaObserverConfig[] | MedusaObserverConfig): void {
    this.#forEachConfig(config, (c) => {
      if (this.#validateObserverConfig(c)) {
        this.#createMedusaObserver(c);
      }
    });
  }

  public clearObserver(observerId: string): void {
    const observer = this.getObserver(observerId);
    if (!observer) {
      return;
    }

    for (const node of observer.observedNodes) {
      this.#unobserveTarget(observerId, observer, node);
    }
  }

  public clearAllObservers(): void {
    for (const id of this.#observers.keys()) {
      this.clearObserver(id);
    }
  }

  public removeObserver(observerId: string): void {
    const observer = this.getObserver(observerId);
    if (!observer) {
      return;
    }

    // `disconnect` unobserves everything at once; only the bookkeeping is per node
    for (const node of observer.observedNodes) {
      this.#cleanupNodeFromObserver(observerId, node, observer.observedNodes);
    }
    observer.instance.disconnect();
    this.#observers.delete(observerId);
  }

  public removeAllObservers(): void {
    for (const id of this.#observers.keys()) {
      this.removeObserver(id);
    }
  }

  public observe(
    observerId: string,
    elements: Element | Iterable<Element> | null | undefined,
    callback?: MedusaCallback,
  ): void {
    const observer = this.getObserver(observerId);
    if (!observer) {
      return;
    }

    this.#forEachElement(elements, (node) =>
      this.#observeTarget(observerId, observer, node, callback),
    );
  }

  public unobserve(
    observerId: string,
    elements: Element | Iterable<Element> | null | undefined,
  ): void {
    const observer = this.getObserver(observerId);
    if (!observer) {
      return;
    }

    this.#forEachElement(elements, (node) => this.#unobserveTarget(observerId, observer, node));
  }

  public destroy(): void {
    this.removeAllObservers();
  }
}

export type {
  Mode,
  MedusaCallback,
  MedusaEvent,
  MedusaObserver,
  MedusaObserverConfig,
  MedusaOptions,
} from './types.ts';
export { MODE } from './types.ts';
export default Medusa;
