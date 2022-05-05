type CustomElement = HTMLElement & SVGElement & HTMLCanvasElement & HTMLSpanElement;

export interface MedusaElement extends CustomElement {
  _medusaObserversList : Map<string, number>,
}

export enum MODE {
  DEFAULT = 'default',
  ONCE = 'once',
  BYPIXELS = 'byPixel',
}

export enum THRESHOLD {
  FULL = 1.0,
  HALF = 0.5,
  BEARLY = 0.0,
}

export interface ObserverConfig {
  id : string,
  viewport: null | Document | HTMLElement,
  nodes : Array<MedusaElement>,
  threshold : number,
  offsets: string,
  emitGlobal : boolean,
  emitByNode : boolean,
  mode : MODE,
  callback : Function,
}

export interface InternalObserver {
  id : string,
  observerInstance : null | IntersectionObserver,
  observedNodes : Map<number, MedusaElement>,
  emitGlobal : boolean,
  emitByNode : boolean,
  mode : MODE,
  callback : Function,
}

export type PartialObserverConfig = Partial<ObserverConfig>

export interface MedusaOptions {
  observers? : Array<ObserverConfig>,
  debug? : boolean,
}
