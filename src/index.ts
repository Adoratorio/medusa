import {
  MODE,
  type MedusaObserver,
  type MedusaObserverConfig,
  type MedusaOptions,
  type MedusaElement,
  type MedusaEvent,
} from './declarations';
import { thresholdsByPixels, uID } from './utils';

export default class Medusa {
  static readonly MODE = MODE;

  private readonly debugMode: boolean;
  private readonly observers = new Map<string, MedusaObserver>();

  constructor(options: Partial<MedusaOptions> = {}) {
    this.debugMode = options.debug ?? false;

    if (options.observers?.length) {
      this.addObserver(options.observers);
    }
  }

  private debugWarn(message: string): void {
    if (this.debugMode) {
      console.warn(`[Medusa] ${message}`);
    }
  }

  private observeTarget(
    medusaObserver: MedusaObserver,
    node: MedusaElement,
    callback?: () => void,
  ): void {
    node._medusaObserversList ??= new Map();

    if (node._medusaObserversList.has(medusaObserver.id)) {
      this.debugWarn(`Node already observed by '${medusaObserver.id}' observer`);
      return;
    }

    const nodeId = uID();
    node._medusaObserversList.set(medusaObserver.id, {
      id: nodeId,
      callback,
    });
    medusaObserver.observerInstance?.observe(node);
    medusaObserver.observedNodes.set(nodeId, node);
  }

  private unobserveTarget(
    medusaObserver: MedusaObserver,
    node: MedusaElement,
  ): void {
    const observersList = node._medusaObserversList;

    if (!observersList?.has(medusaObserver.id)) {
      this.debugWarn(`Element not observed by '${medusaObserver.id}' observer`);
      return;
    }

    const { id: nodeId } = observersList.get(medusaObserver.id)!;

    medusaObserver.observerInstance?.unobserve(node);
    medusaObserver.observedNodes.delete(nodeId);
    observersList.delete(medusaObserver.id);

    // Clean up empty observers list
    if (observersList.size === 0) {
      delete node._medusaObserversList;
    }
  }

  private emitEventCallback(
    medusaObserver: MedusaObserver,
    entry: IntersectionObserverEntry,
  ): void {
    const customEvent: MedusaEvent = new CustomEvent(`medusa-${medusaObserver.id}`, {
      detail: entry,
    });

    entry.target.dispatchEvent(customEvent);
  }

  private createObserver(
    medusaObserver: MedusaObserver,
    observerOptions: IntersectionObserverInit,
  ): void {
    const callback = (entries: IntersectionObserverEntry[]): void => {
      for (const entry of entries) {
        const target = entry.target as MedusaElement;
        const isOnceMode = medusaObserver.mode === Medusa.MODE.ONCE;
        const targetCallback = target._medusaObserversList?.get(medusaObserver.id)?.callback;

        if (isOnceMode && entry.isIntersecting) {
          this.unobserveTarget(medusaObserver, target);
        }

        if (!isOnceMode || entry.isIntersecting) {
          if (medusaObserver.emit) this.emitEventCallback(medusaObserver, entry);

          if (targetCallback) {
            targetCallback(entry, medusaObserver.observerInstance);
          } else if (medusaObserver.callback) {
            medusaObserver.callback(entry, medusaObserver.observerInstance);
          }
        }
      }
    };

    medusaObserver.observerInstance = new IntersectionObserver(callback, observerOptions);
  }

  private createMedusaObserver(config: MedusaObserverConfig): MedusaObserver {
    const medusaObserver: MedusaObserver = {
      id: config.id,
      observerInstance: null,
      observedNodes: new Map(),
      mode: config.mode ?? MODE.DEFAULT,
      emit: config.emit ?? false,
      callback: config.callback,
    };
    const observerOptions: IntersectionObserverInit = {
      root: config.root ?? null,
      rootMargin: config.rootMargin ?? '0px 0px 0px 0px',
      threshold: config.mode === Medusa.MODE.BYPIXELS
        ? thresholdsByPixels()
        : config.threshold ?? 0,
    };

    this.createObserver(medusaObserver, observerOptions);

    if (config.nodes) {
      this.observe(medusaObserver.id, config.nodes);
    } else {
      this.debugWarn(`No nodes provided for observer '${medusaObserver.id}'`);
    }

    return medusaObserver;
  }

  private checkObserver(config: MedusaObserverConfig): void {
    if (!(typeof config.id === 'string' && config.id.trim() !== '')) {
      this.debugWarn('Observer ID is required and must be a non-empty string');
      return;
    }

    if (this.observers.has(config.id)) {
      this.debugWarn(`Observer with ID '${config.id}' already exists`);
      return;
    }

    this.observers.set(config.id, this.createMedusaObserver(config));
  }

  private processElements<T extends MedusaElement>(
    elements: T | T[],
    processor: (element: T) => void
  ): void {
    if (Array.isArray(elements)) {
      elements.forEach(processor);
    } else {
      processor(elements);
    }
  }

  public getObserver(observerId: string): MedusaObserver | null {
    const observer = this.observers.get(observerId);
    if (!observer) {
      this.debugWarn(`Observer '${observerId}' does not exist`);
      return null;
    }
    return observer;
  }

  public addObserver(config: MedusaObserverConfig[] | MedusaObserverConfig): void {
    if (Array.isArray(config)) {
      config.forEach(c => this.checkObserver(c));
    } else if (config && typeof config === 'object') {
      this.checkObserver(config);
    } else {
      this.debugWarn('Invalid observer configuration provided');
    }
  }

  public clearObserver(observerId: string): void {
    const observer = this.getObserver(observerId);
    if (!observer) return;

    const nodes = Array.from(observer.observedNodes.values());
    nodes.forEach(node => this.unobserveTarget(observer, node));
  }

  public clearAllObservers(): void {
    const observerIds = Array.from(this.observers.keys());
    observerIds.forEach(id => this.clearObserver(id));
  }

  public removeObserver(observerId: string): void {
    const observer = this.getObserver(observerId);
    if (!observer) return;

    this.clearObserver(observerId);
    observer.observerInstance?.disconnect();

    this.observers.delete(observerId);
  }

  public removeAllObservers(): void {
    const observerIds = Array.from(this.observers.keys());
    observerIds.forEach(id => this.removeObserver(id));
  }

  public observe(
    observerId: string,
    elements: MedusaElement | MedusaElement[],
    callback?: () => void,
  ): void {
    const observer = this.getObserver(observerId);
    if (!observer) return;

    this.processElements(elements, node => this.observeTarget(observer, node, callback));
  }

  public unobserve(
    observerId: string,
    elements: MedusaElement | MedusaElement[],
  ): void {
    const observer = this.getObserver(observerId);
    if (!observer) return;

    this.processElements(elements, node => this.unobserveTarget(observer, node));
  }

  public destroy(): void {
    this.removeAllObservers();
    this.observers.clear();
    Object.keys(this).forEach(key => ((this as any)[key] = null));
  }
}
