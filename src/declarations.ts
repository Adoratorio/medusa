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
  container: Document | HTMLElement,
  nodes : Array<HTMLElement> | string,
  threshold : number,
  offsets: string,
  emitGlobal : boolean,
  callback : Function,
  mode : MODE,
}

export interface InternalTarget {
  id : string,
  observerInstance : null | IntersectionObserver,
  observedElements : Array<HTMLElement>,
  observerOptions : object,
  emitGlobal : boolean,
  container : Document | HTMLElement,
  mode : MODE,
  callback : Function,
}

export interface MedusaEventInit extends CustomEventInit {
  id: string,
}

export type PartialTarget = Partial<Target>

export interface MedusaOptions {
  targets : Array<PartialTarget> | PartialTarget,
}

export interface MedusaObserver {
  node : HTMLElement,
  instance : IntersectionObserver,
}
