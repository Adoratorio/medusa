import {
  MODE,
  THRESHOLD,
  InternalObserver,
  PartialObserverConfig,
  MedusaOptions,
  MedusaElement,
} from './declarations';
import { thresholdsByPixels, uid } from './utils';


class Medusa {
  static MODE = MODE;
  static THRESHOLD = THRESHOLD;

  private debugMode : boolean;

  public observers : Map<string, InternalObserver>;

  constructor(options : Partial<MedusaOptions> = {}) {
    const configList = options.observers || [];

    this.debugMode = options.debug || false;
    this.observers = new Map();

    if (configList.length > 0) this.addObserver(configList);
  }

  private emitEventCallback(internalObserver : InternalObserver, entry : IntersectionObserverEntry) {
    const optsEvent : CustomEventInit = {};
    optsEvent.detail = { node: entry.target, isIn: entry.isIntersecting, entry };
    const customEvent = new CustomEvent(`medusa-${internalObserver.id}`, optsEvent);

    if (internalObserver.emitGlobal) window.dispatchEvent(customEvent);
    if (internalObserver.emitByNode) entry.target.dispatchEvent(customEvent);
  }

  private createObserver(internalObserver : InternalObserver, observerOptions : object) {
    const callback = (entries : IntersectionObserverEntry[], observer : IntersectionObserver) => {
      entries.forEach((entry) => {
        const target = entry.target as MedusaElement;

        if (internalObserver.mode === Medusa.MODE.ONCE && entry.isIntersecting) {
          this.unobserve(internalObserver.id, target);

          if (internalObserver.emitGlobal || internalObserver.emitByNode) {
            this.emitEventCallback(internalObserver, entry);
          }

          internalObserver.callback(entry, observer);
        } else if (internalObserver.mode !== Medusa.MODE.ONCE) {
          if (internalObserver.emitGlobal || internalObserver.emitByNode) {
            this.emitEventCallback(internalObserver, entry);
          }

          internalObserver.callback(entry, observer);
        }
      });
    };

    internalObserver.observerInstance = new IntersectionObserver(callback, observerOptions);
  }

  private createInternalObserver(observerConfig : PartialObserverConfig) {
    const internalObserver : InternalObserver = {
      id: observerConfig.id || '',
      observerInstance: null,
      observedNodes: new Map(),
      emitGlobal: observerConfig.emitGlobal || false,
      emitByNode: observerConfig.emitByNode || false,
      mode: observerConfig.mode || MODE.DEFAULT,
      callback: observerConfig.callback || function() {},
    };
    const observerOptions = {
      root: observerConfig.viewport || null,
      rootMargin: observerConfig.offsets || '0px 0px 0px 0px',
      threshold: observerConfig.mode === Medusa.MODE.BYPIXELS
        ? thresholdsByPixels() : observerConfig.threshold || 0,
    };

    this.createObserver(internalObserver, observerOptions);

    if (observerConfig.nodes) this.observe(internalObserver.id, observerConfig.nodes);
    else if (this.debugMode) console.warn(`no node passed to: '${internalObserver.id}' observer`);

    return internalObserver;
  }

  private checkObserver(config : any) {
    if (!this.observers.has(config.id) && config.id && config.id !== '') {
      this.observers.set(config.id, this.createInternalObserver(config));
    } else if (this.debugMode) {
      console.warn(config.id === '' || !config.id? 'No id was found' : `An Observer with '${config.id}' id-key already exist`);
    }
  }

  private observeTarget(internalObserver : InternalObserver, node : MedusaElement) {
    if (!node._medusaObserversList) node._medusaObserversList = new Map();

    if (!node._medusaObserversList.has(internalObserver.id)) {
      const nodeId = uid();

      node._medusaObserversList.set(internalObserver.id, nodeId);

      internalObserver.observerInstance?.observe(node);
      internalObserver.observedNodes.set(nodeId, node);
    } else if (this.debugMode) {
      console.warn(`node: ${node}, already observed in: '${internalObserver.id}' observer`);
    }
  }

  private unobserveTarget(internalObserver : InternalObserver, node : MedusaElement) {
    const { _medusaObserversList } = node;

    if (!_medusaObserversList) {
      if (this.debugMode) console.warn(`The element isn\'t observed by: '${internalObserver.id}' observer`);
      return;
    };

    const nodeId = _medusaObserversList.get(internalObserver.id);

    if (_medusaObserversList.has(internalObserver.id) && nodeId) {
      internalObserver.observerInstance?.unobserve(node);
      internalObserver.observedNodes.delete(nodeId);
      node._medusaObserversList.delete(internalObserver.id);
    } else if (this.debugMode) {
      console.warn(`The element isn\'t observed by: '${internalObserver.id}' observer`);
    }
  }

  public addObserver(configurations : Array<PartialObserverConfig> | PartialObserverConfig) {
    if (Array.isArray(configurations)) configurations.forEach((config) => this.checkObserver(config));
    else if (typeof configurations === 'object') this.checkObserver(configurations);
    else if (this.debugMode) console.warn(`Observer configuration uncorrect`);
  }

  public clearObserver(observerId : string) {
    if (this.observers.has(observerId)) {
      const internalObserver = this.observers.get(observerId)!;
      const { observedNodes } = internalObserver!;

      if (observedNodes.size > 0) observedNodes.forEach((node) => this.unobserveTarget(internalObserver, node));
    } else if (this.debugMode) {
      console.warn(`the target id: ${observerId}, is already clear`);
    }
  }

  public clearAllObservers() {
    if (this.observers.size > 0) this.observers.forEach((observer, key) => this.clearObserver(key));
  }

  public removeObserver(observerId : string) {
    if (this.observers.has(observerId)) {
      const currentObserver = this.observers.get(observerId)!;
      if (currentObserver.observedNodes.size > 0) this.clearObserver(observerId);

      (<IntersectionObserver>currentObserver.observerInstance).disconnect();
      this.observers.delete(observerId);
    } else if (this.debugMode) {
      console.warn('The targets id doesn\'t exist');
    }
  }

  public observe(observerId : string, elsToObserve : MedusaElement | Array<MedusaElement>) {
    if (this.observers.has(observerId)) {
      const internalObserver = this.observers.get(observerId)!;

      if (Array.isArray(elsToObserve)) elsToObserve.forEach((node) => this.observeTarget(internalObserver, node));
      else this.observeTarget(internalObserver, elsToObserve);
    } else if (this.debugMode) {
      console.warn(`The observer id: '${observerId}' doesn\'t exist`);
    }
  }

  public unobserve(observerId : string, elsToUnobserve : MedusaElement | Array<MedusaElement>) {
    if (this.observers.has(observerId)) {
      const internalObserver = this.observers.get(observerId)!;

      if (Array.isArray(elsToUnobserve)) elsToUnobserve.forEach((node) => this.unobserveTarget(internalObserver, node));
      else this.unobserveTarget(internalObserver, elsToUnobserve);
    } else if (this.debugMode) {
      console.warn(`The observer id: '${observerId}' doesn\'t exist`);
    }
  }
}

export default Medusa;
