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

export interface Target {
  id : string,
  viewport: null | Document | HTMLElement,
  nodes : Array<MedusaHTMLElement>,
  threshold : number,
  offsets: string,
  emitGlobal : boolean,
  emitByNode : boolean,
  callback : Function,
  mode : MODE,
  autoremove : boolean,
}

export interface InternalTarget {
  id : string,
  observerInstance : null | IntersectionObserver,
  observedElements : Array<MedusaHTMLElement>,
  observerOptions : object,
  emitGlobal : boolean,
  emitByNode : boolean,
  mode : MODE,
  callback : Function,
  autoremove : boolean,
}

export type PartialTarget = Partial<Target>

export interface MedusaOptions {
  targets : Array<PartialTarget>,
  debug? : boolean,
}

export interface MedusaObserver {
  node : HTMLElement,
  instance : IntersectionObserver,
}

export interface MedusaHTMLElement extends HTMLElement {
  _medusaId : string,
}
