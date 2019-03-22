import {
  MODE,
  THRESHOLD,
  Target,
  InternalTarget,
  MedusaEventInit,
  MedusaOptions,
  PartialTarget,
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
      targets: {
        id: 'snakes',
        container: document.body,
        nodes: Array.from(document.querySelectorAll('.m-snakes')),
        threshold: Medusa.THRESHOLD.TOP,
        offsets: '',
        emitGlobal: false,
        callback: () => {},
        mode: Medusa.MODE.DEFAULT,
      },
    };

    this.options = { ...defaults, ...options };

    this.addTargets(this.options.targets);
  }

  addTargets(newTargets : Array<PartialTarget> | PartialTarget) {
    if (Array.isArray(newTargets)) {
      newTargets.forEach((newTarget) => {
        const partialTarget = newTarget as Target;

        if (this.idList.findIndex(id => id === newTarget.id) < 0) {
          this.internalTargets.push(this.createInternalTarget(partialTarget));
          this.idList.push(partialTarget.id);
        } else {
          throw new Error(`The target id-key: '${newTarget.id}', already exist`);
        }
      });
    } else if (typeof newTargets === 'object') {
      const target = newTargets as Target;

      if (this.idList.findIndex((id) => {
        return id === target.id;
      }) < 0) {
        this.internalTargets.push(this.createInternalTarget(target));
        this.idList.push(target.id);
      } else {
        throw new Error(`The target id-key: '${target}', already exist`);
      }
    } else {
      console.warn(`The targets is uncorrect`);
    }
  }

  private createInternalTarget(optionsTarget : Target) {
    const internalTarget : InternalTarget = {
      id: optionsTarget.id,
      observerInstance: null,
      observedElements: [],
    };

    if (Array.isArray(optionsTarget.nodes)) {
      internalTarget.observedElements = optionsTarget.nodes;

      // TODO fallback observer
      this.createObserver(internalTarget, optionsTarget);
    } else if (typeof optionsTarget.nodes === 'string') {
      internalTarget.observedElements = Array.from(
        optionsTarget.container.querySelectorAll(optionsTarget.nodes),
      );

      // TODO fallback observer
      this.createObserver(internalTarget, optionsTarget);
    } else {
      console.warn(`the node list for the target id: ${optionsTarget.id} is invalid, no observer was added`);
    }

    return internalTarget;
  }

  private createObserver(internalTargetCreated : InternalTarget, optionsTarget : Target) {
    const observerOptions : any = {
      root: null,
      rootMargin: optionsTarget.offsets,
      threshold: optionsTarget.mode === Medusa.MODE.BYPIXELS
        ? thresholdsByPixels() : optionsTarget.threshold,
    };

    const callback = (entries : IntersectionObserverEntry[], observer : IntersectionObserver) => {
      entries.forEach((entry) => {
        if (optionsTarget.mode === Medusa.MODE.ONCE && entry.isIntersecting) {
          observer.unobserve(entry.target);

          const indexToRemove = internalTargetCreated.observedElements
            .findIndex(observedElement => observedElement === entry.target);
          internalTargetCreated.observedElements.splice(indexToRemove, 1);

          if (internalTargetCreated.observedElements.length === 0) {
            observer.disconnect();
            internalTargetCreated.observerInstance = null;
          }
        }

        const eventTarget = optionsTarget.emitGlobal ? window : optionsTarget.container;
        const customEvent = new CustomEvent('intesectionTriggered', <MedusaEventInit>{
          id: optionsTarget.id,
          detail: entry,
          isIn: entry.isIntersecting,
        });
        eventTarget.dispatchEvent(customEvent);

        if (entry.isIntersecting) optionsTarget.callback(entry, observer);
      });
    };

    internalTargetCreated.observerInstance = new IntersectionObserver(callback, observerOptions);

    internalTargetCreated.observedElements.forEach((node : HTMLElement) => {
      if (internalTargetCreated.observerInstance === null) return;

      internalTargetCreated.observerInstance.observe(node);
    });
  }
}

export default Medusa;
