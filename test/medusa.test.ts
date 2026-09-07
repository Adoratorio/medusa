// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Medusa from '../src/index.ts';

type Callback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void;

// Manual IntersectionObserver: notifications fire only through `notify()`
const instances: FakeObserver[] = [];

class FakeObserver {
  readonly callback: Callback;
  readonly options: IntersectionObserverInit;
  readonly observed = new Set<Element>();
  disconnected = false;

  constructor(callback: Callback, options: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    instances.push(this);
  }

  observe(target: Element): void {
    this.observed.add(target);
  }

  unobserve(target: Element): void {
    this.observed.delete(target);
  }

  disconnect(): void {
    this.disconnected = true;
    this.observed.clear();
  }

  notify(target: Element, intersectionRatio: number, isIntersecting = intersectionRatio > 0): void {
    const entry = { target, intersectionRatio, isIntersecting } as IntersectionObserverEntry;
    this.callback([entry], this as unknown as IntersectionObserver);
  }
}

let element: HTMLElement;

beforeEach(() => {
  instances.length = 0;
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  document.body.innerHTML = '';
  element = document.createElement('div');
  document.body.append(element);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Medusa ONCE mode', () => {
  it('waits for the configured threshold instead of any intersection', () => {
    const callback = vi.fn();
    const medusa = new Medusa({
      observers: [{ id: 'lazy', mode: Medusa.MODE.ONCE, threshold: 0.5, nodes: element, callback }],
    });
    const [observer] = instances;
    expect(observer?.observed.has(element)).toBe(true);

    // Initial notification: intersecting, but only 20% visible
    observer?.notify(element, 0.2);
    expect(callback).not.toHaveBeenCalled();
    expect(observer?.observed.has(element)).toBe(true);

    observer?.notify(element, 0.5);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(observer?.observed.has(element)).toBe(false);
    expect(medusa.getObserver('lazy')?.observedNodes.size).toBe(0);
  });

  it('uses the lowest threshold of a list', () => {
    const callback = vi.fn();
    new Medusa({
      observers: [
        { id: 'multi', mode: Medusa.MODE.ONCE, threshold: [0.75, 0.25], nodes: element, callback },
      ],
    });
    const [observer] = instances;
    observer?.notify(element, 0.1);
    expect(callback).not.toHaveBeenCalled();
    observer?.notify(element, 0.25);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('Medusa DEFAULT mode and events', () => {
  it('fires on every notification and prefers the per-node callback', () => {
    const observerCallback = vi.fn();
    const nodeCallback = vi.fn();
    const medusa = new Medusa({
      observers: [{ id: 'all', threshold: 0.5, callback: observerCallback }],
    });
    medusa.observe('all', element, nodeCallback);
    const [observer] = instances;

    observer?.notify(element, 0.2);
    observer?.notify(element, 0, false);

    expect(nodeCallback).toHaveBeenCalledTimes(2);
    expect(observerCallback).not.toHaveBeenCalled();
  });

  it('dispatches medusa-<id> events, bubbling only when asked', () => {
    const parentListener = vi.fn();
    const targetListener = vi.fn();
    document.body.addEventListener('medusa-quiet', parentListener);
    document.body.addEventListener('medusa-loud', parentListener);
    element.addEventListener('medusa-quiet', targetListener);
    element.addEventListener('medusa-loud', targetListener);

    new Medusa({
      observers: [
        { id: 'quiet', emit: true, nodes: element },
        { id: 'loud', emit: true, bubbles: true, nodes: element },
      ],
    });
    instances[0]?.notify(element, 1);
    instances[1]?.notify(element, 1);

    expect(targetListener).toHaveBeenCalledTimes(2);
    expect(parentListener).toHaveBeenCalledTimes(1);
    expect((parentListener.mock.calls[0]?.[0] as CustomEvent).type).toBe('medusa-loud');
  });
});

describe('Medusa management', () => {
  it('skips duplicated ids and validates them', () => {
    const medusa = new Medusa({ observers: [{ id: 'a' }] });
    medusa.addObserver({ id: 'a' });
    expect(instances).toHaveLength(1);
    expect(() => medusa.addObserver({ id: ' ' })).toThrow('Observer id is required');
  });

  it('removes observers and their bookkeeping', () => {
    const other = document.createElement('span');
    const medusa = new Medusa({ observers: [{ id: 'a', nodes: [element, other] }] });
    const [observer] = instances;
    expect(observer?.observed.size).toBe(2);

    medusa.unobserve('a', element);
    expect(observer?.observed.has(element)).toBe(false);
    expect(medusa.getObserver('a')?.observedNodes.size).toBe(1);

    medusa.removeObserver('a');
    expect(observer?.disconnected).toBe(true);
    expect(medusa.getObserver('a')).toBeNull();
  });
});
