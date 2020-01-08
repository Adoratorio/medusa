import {
  MODE,
  THRESHOLD,
  Target,
  InternalTarget,
  MedusaEventInit,
  MedusaOptions,
  PartialTarget,
  MedusaHTMLElement,
} from './declarations';

import { thresholdsByPixels } from './utils';

const crypto = require('crypto');


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
        viewport: null,
        nodes: '.m-snake',
        threshold: Medusa.THRESHOLD.FULL,
        offsets: '0px 0px 0px 0px',
        emitGlobal: false,
        callback: () => {},
        mode: Medusa.MODE.DEFAULT,
        autoremove: true,
      },
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

    this.addTarget(this.options.targets);
  }

  addTarget(newTargets : Array<PartialTarget> | PartialTarget) {
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

      if (this.idList.findIndex(id => id === target.id) < 0) {
        this.internalTargets.push(this.createInternalTarget(target));
        this.idList.push(target.id);
      } else {
        throw new Error(`The target id-key: '${target.id}', already exist`);
      }
    } else {
      if (this.options.debug) console.warn(`The targets is uncorrect`);
    }
  }

  removeTarget(targetId : string) {
    const indexTargetToRemove = this.internalTargets.findIndex(target => target.id === targetId);

    if (indexTargetToRemove < 0) {
      if (this.options.debug) console.warn('The targets id doesn\'t exist');
    } else {
      const currentTarget = this.internalTargets[indexTargetToRemove];

      currentTarget.observedElements.forEach((node, i) => {
        (<IntersectionObserver>currentTarget.observerInstance).unobserve(node);
        currentTarget.observedElements.splice(i, 1);
      })

      if (currentTarget.observedElements.length === 0) {
        (<IntersectionObserver>currentTarget.observerInstance).disconnect();
        currentTarget.observerInstance = null;
        this.internalTargets.splice(indexTargetToRemove, 1);
      }

      this.idList = this.idList.filter(id => id !== targetId);
      this.internalTargets = this.internalTargets.filter(target => target.id !== targetId);
    }
  }

  pushToTarget(idObserver : string, elToAdd : MedusaHTMLElement | Array<MedusaHTMLElement>) {
    const indexTarget = this.internalTargets.findIndex((internalTarget) => internalTarget.id === idObserver);

    if (indexTarget < 0) {
      if (this.options.debug) console.warn('The targets id doesn\'t exist');
    } else {
      if (Array.isArray(elToAdd)) {
        elToAdd.forEach((node) => {
          (<any>node)._medusaId = crypto.randomBytes(6).toString('hex');

          (<IntersectionObserver>this.internalTargets[indexTarget].observerInstance).observe(node);
          this.internalTargets[indexTarget].observedElements.push(node);
        });
      } else {
        (<any>elToAdd)._medusaId = crypto.randomBytes(6).toString('hex');

        (<IntersectionObserver>this.internalTargets[indexTarget].observerInstance).observe(elToAdd);
        this.internalTargets[indexTarget].observedElements.push(elToAdd);
      }
    }
  }

  pullFromTarget(idObserver : string, elToRemove : MedusaHTMLElement | Array<MedusaHTMLElement>) {
    const indexTarget = this.internalTargets.findIndex((internalTarget) => internalTarget.id === idObserver);

    if (indexTarget < 0) {
      if (this.options.debug) console.warn('The targets id doesn\'t exist');
    } else {
      const observer = this.internalTargets[indexTarget].observerInstance as IntersectionObserver;

      if (Array.isArray(elToRemove)) {
        elToRemove.forEach((node) => {
          const { _medusaId } = (<MedusaHTMLElement>node);
          const elIndexToRemove = this.internalTargets[indexTarget].observedElements.findIndex((observedElement) => (<any>observedElement)._medusaId === _medusaId);

          if (elIndexToRemove < 0) {
            if (this.options.debug) console.warn('The element isn\'t observed');
          } else {
            observer.unobserve(node);
            this.internalTargets[indexTarget].observedElements.splice(elIndexToRemove, 1);
          }
        });
      } else {
        const { _medusaId } = (<MedusaHTMLElement>elToRemove);
        const elIndexToRemove = this.internalTargets[indexTarget].observedElements.findIndex((observedElement) => (<MedusaHTMLElement>observedElement)._medusaId === _medusaId);

        if (elIndexToRemove < 0) {
          if (this.options.debug) console.warn('The element isn\'t observed');
        } else {
          observer.unobserve(elToRemove);
          this.internalTargets[indexTarget].observedElements.splice(elIndexToRemove, 1);
        }
      }
    }
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
      container: optionsTarget.container,
      mode: optionsTarget.mode,
      callback: optionsTarget.callback,
      autoremove: optionsTarget.autoremove,
    };

    if (Array.isArray(optionsTarget.nodes)) {
      internalTarget.observedElements = optionsTarget.nodes;

      // TODO fallback observer
      this.createObserver(internalTarget);
    } else if (typeof optionsTarget.nodes === 'string') {
      internalTarget.observedElements = Array.from(
        optionsTarget.container.querySelectorAll(optionsTarget.nodes),
      );

      // TODO fallback observer
      this.createObserver(internalTarget);
    } else {
      if (this.options.debug) console.warn(`the node list for the target id: ${optionsTarget.id} is invalid, no observer was added`);
    }

    return internalTarget;
  }

  private createObserver(internalTargetCreated : InternalTarget) {
    const callback = (entries : IntersectionObserverEntry[], observer : IntersectionObserver) => {
      entries.forEach((entry) => {
        if (internalTargetCreated.mode === Medusa.MODE.ONCE && entry.isIntersecting) {
          observer.unobserve(entry.target);

          const indexToRemove = internalTargetCreated.observedElements
            .findIndex(observedElement => observedElement._medusaId === (entry.target as MedusaHTMLElement)._medusaId);
          internalTargetCreated.observedElements.splice(indexToRemove, 1);

          if (internalTargetCreated.observedElements.length === 0 && internalTargetCreated.autoremove) {
            observer.disconnect();
            internalTargetCreated.observerInstance = null;
            const internalTargetCreatedIndex = this.internalTargets.findIndex((internalTarget) => internalTarget.id === internalTargetCreated.id);
            this.internalTargets.splice(internalTargetCreatedIndex, 1);

            const idListIndex = this.idList.findIndex(id => id === internalTargetCreated.id);
            this.idList.splice(idListIndex, 1);
          }

          internalTargetCreated.callback(entry, observer);
        } else if (internalTargetCreated.mode !== Medusa.MODE.ONCE) {
          internalTargetCreated.callback(entry, observer);
        }

        const eventTarget = internalTargetCreated.emitGlobal ? window : internalTargetCreated.container;
        const customEvent = new CustomEvent('intesectionTriggered', <MedusaEventInit>{
          id: internalTargetCreated.id,
          detail: entry,
          isIn: entry.isIntersecting,
        });
        eventTarget.dispatchEvent(customEvent);
      });
    };

    internalTargetCreated.observerInstance = new IntersectionObserver(callback, internalTargetCreated.observerOptions);

    internalTargetCreated.observedElements.forEach((node : MedusaHTMLElement) => {
      if (internalTargetCreated.observerInstance === null) return;

      (<any>node)._medusaId = crypto.randomBytes(6).toString('hex');

      internalTargetCreated.observerInstance.observe(node);
    });
  }
}

export default Medusa;
