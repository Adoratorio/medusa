import crypto from 'crypto';
import {
  MODE,
  THRESHOLD,
  Target,
  InternalTarget,
  MedusaOptions,
  PartialTarget,
  MedusaHTMLElement,
} from './declarations';
import { thresholdsByPixels } from './utils';


class Medusa {
  static MODE = MODE;

  static THRESHOLD = THRESHOLD;

  private options : MedusaOptions;

  private internalTargets : Array<InternalTarget> = [];

  private idList: Array<string> = [];

  constructor(options : Partial<MedusaOptions>) {
    const defaults : MedusaOptions = {
      targets: [],
      debug: true,
    };

    this.options = { ...defaults, ...options };

    this.init();
  }

  private init() {
    Object.defineProperty(HTMLElement.prototype, '_medusaId', {
      value: '',
      configurable: true,
      enumerable: true,
      writable: true,
    });

    if (this.options.targets.length > 0) this.addTarget(this.options.targets);
  }

  private getTargetIndexFromId(targetId : string) {
    return this.internalTargets.findIndex((internalTarget) => internalTarget.id === targetId);
  }

  private emitEventCallback(internalTargetCreated : InternalTarget, entry : IntersectionObserverEntry) {
      const optsEvent : CustomEventInit = {};
      optsEvent.detail = { targetId: internalTargetCreated.id, node: entry.target, isIn: entry.isIntersecting };
      const customEvent = new CustomEvent('medusa-intersection-triggered', optsEvent);

      (internalTargetCreated.emitGlobal ? window : entry.target).dispatchEvent(customEvent);
  }

  private createObserver(internalTargetCreated : InternalTarget) {
    const callback = (entries : IntersectionObserverEntry[], observer : IntersectionObserver) => {
      entries.forEach((entry) => {
        const target = entry.target as MedusaHTMLElement;

        if (internalTargetCreated.mode === Medusa.MODE.ONCE && entry.isIntersecting) {
          this.pullFromTarget(internalTargetCreated.id, target);

          if (internalTargetCreated.autoremove && internalTargetCreated.observedElements.length === 0) {
            this.removeTarget(internalTargetCreated.id);
          }

          if (internalTargetCreated.emitGlobal || internalTargetCreated.emitByNode) {
            this.emitEventCallback(internalTargetCreated, entry);
          }

          internalTargetCreated.callback(entry, observer);
        } else if (internalTargetCreated.mode !== Medusa.MODE.ONCE) {
          if (internalTargetCreated.emitGlobal || internalTargetCreated.emitByNode) {
            this.emitEventCallback(internalTargetCreated, entry);
          }

          internalTargetCreated.callback(entry, observer);
        }
      });
    };

    internalTargetCreated.observerInstance = new IntersectionObserver(callback, internalTargetCreated.observerOptions);

    internalTargetCreated.observedElements.forEach((node : MedusaHTMLElement) => {
      if (internalTargetCreated.observerInstance === null) return;

      this.pushToTarget(internalTargetCreated.id, node);
    });
  }

  private createInternalTarget(optionsTarget : Target) {
    const internalTarget : InternalTarget = {
      id: optionsTarget.id,
      observerInstance: null,
      observedElements: [],
      observerOptions: {
        root: optionsTarget.viewport,
        rootMargin: optionsTarget.offsets,
        threshold: optionsTarget.mode === Medusa.MODE.BYPIXELS
          ? thresholdsByPixels() : optionsTarget.threshold,
      },
      emitGlobal: optionsTarget.emitGlobal,
      emitByNode: optionsTarget.emitByNode,
      mode: optionsTarget.mode,
      callback: optionsTarget.callback,
      autoremove: optionsTarget.autoremove,
    };

    if (Array.isArray(optionsTarget.nodes)) {
      internalTarget.observedElements = optionsTarget.nodes;
    } else {
      internalTarget.observedElements = [];
      if (this.options.debug) console.warn(`the node list for the target id: ${optionsTarget.id} is invalid and converted to empty array`);
    }

    // TODO fallback observer
    this.createObserver(internalTarget);

    return internalTarget;
  }

  private checkAddTarget(newTarget : any) {
    const defaultTarget = {
      viewport: null,
      nodes: [],
      threshold: 0,
      offsets: '0px 0px 0px 0px',
      callback: () => {},
      mode: Medusa.MODE.DEFAULT,
      emitGlobal: false,
      emitByNode: false,
      autoremove: false,
    };
    const partialTarget : Target = { ...defaultTarget, ...newTarget };

    if (this.idList.findIndex(id => id === newTarget.id) < 0) {
      this.internalTargets.push(this.createInternalTarget(partialTarget));
      this.idList.push(partialTarget.id);
    } else if (this.options.debug) {
      console.warn(`The target id-key: '${newTarget.id}', already exist`);
    }
  }

  private pushElementToTarget(node : MedusaHTMLElement, indexTarget : number) {
    const { _medusaId } = node;

    if (_medusaId === '') {
      (<any>node)._medusaId = crypto.randomBytes(6).toString('hex');

      (<IntersectionObserver>this.internalTargets[indexTarget].observerInstance).observe(node);
      this.internalTargets[indexTarget].observedElements.push(node);
    } else if (this.options.debug) {
      console.warn(`node: ${node}, already observed`);
    }
  }

  private pullElementFromTarget(node : MedusaHTMLElement, indexTarget : number, observer : IntersectionObserver) {
    const { _medusaId } = (<MedusaHTMLElement>node);
    const elIndexToRemove = this.internalTargets[indexTarget].observedElements.findIndex((observedElement) => (<any>observedElement)._medusaId === _medusaId);

    if (elIndexToRemove >= 0) {
      observer.unobserve(node);
      this.internalTargets[indexTarget].observedElements.splice(elIndexToRemove, 1);
      node._medusaId = '';
    } else if (this.options.debug) {
      console.warn('The element isn\'t observed');
    }
  }

  public getTargetFromId(targetId : string) {
    const indexTarget = this.getTargetIndexFromId(targetId);
    let target;

    if (indexTarget >= 0) {
      target = this.internalTargets[indexTarget];
    } else {
      target = null;
      if (this.options.debug) console.warn('The target doesn\'t exist');
    }

    return target;
  }

  public addTarget(newTargets : Array<PartialTarget> | PartialTarget) {
    if (Array.isArray(newTargets)) newTargets.forEach((newTarget) => this.checkAddTarget(newTarget));

    else if (typeof newTargets === 'object') this.checkAddTarget(newTargets);

    else if (this.options.debug) console.warn(`Target uncorrect`);
  }

  public removeTarget(targetId : string) {
    const indexTargetToRemove = this.getTargetIndexFromId(targetId);

    if (indexTargetToRemove >= 0) {
      this.clearTarget(targetId);
      const currentTarget = this.internalTargets[indexTargetToRemove];

      (<IntersectionObserver>currentTarget.observerInstance).disconnect();
      currentTarget.observerInstance = null;
      this.internalTargets.splice(indexTargetToRemove, 1);

      this.idList = this.idList.filter(id => id !== targetId);
      this.internalTargets = this.internalTargets.filter(target => target.id !== targetId);
    } else if (this.options.debug) {
      console.warn('The targets id doesn\'t exist');
    }
  }

  public clearTarget(targetId : string) {
    const indexTargetToClear = this.getTargetIndexFromId(targetId);

    if (indexTargetToClear >= 0) {
      const targetObservedElements = this.internalTargets[indexTargetToClear].observedElements;

      if (targetObservedElements.length >= 0) this.pullFromTarget(targetId, targetObservedElements);
    } else if (this.options.debug) {
      console.warn(`the target id: ${targetId}, is already clear`);
    }
  }

  public clearAllTargets() {
    this.idList.forEach((targetId) => this.clearTarget(targetId));
  }

  public pushToTarget(targetId : string, elsToAdd : MedusaHTMLElement | Array<MedusaHTMLElement>) {
    const indexTarget = this.getTargetIndexFromId(targetId);

    if (indexTarget >= 0) {
      if (Array.isArray(elsToAdd)) elsToAdd.forEach((node) => this.pushElementToTarget(node, indexTarget));
      else this.pushElementToTarget(elsToAdd, indexTarget);
    } else if (this.options.debug) {
      console.warn('The targets id doesn\'t exist');
    }
  }

  public pullFromTarget(targetId : string, elsToRemove : MedusaHTMLElement | Array<MedusaHTMLElement>) {
    const indexTarget = this.getTargetIndexFromId(targetId);

    if (indexTarget >= 0) {
      const observer = this.internalTargets[indexTarget].observerInstance as IntersectionObserver;

      if (Array.isArray(elsToRemove)) {
        for (let index = elsToRemove.length -1; index >= 0; index--) {
          const node = elsToRemove[index];
          this.pullElementFromTarget(node, indexTarget, observer);
        }
      } else {
        this.pullElementFromTarget(elsToRemove, indexTarget, observer)
      }
    } else if (this.options.debug) {
      console.warn('The targets id doesn\'t exist');
    }
  }
}

export default Medusa;
