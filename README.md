# Medusa
A simple utility to easy handle multiple IntersectionObserver

## Installation
``` sh
# Install package
npm install @adoratorio/medusa
```


## Browser Compatibility
If you want to support the browsers that [don't support](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#browser_compatibility) the Itersection Observer you have to change your idea or, at least, don't use this utils 🥳.


## Usage
Since this package has a [pkg.module](https://github.com/rollup/rollup/wiki/pkg.module) field, it's highly recommended to import it as an ES6 module with some bundlers like [webpack](https://webpack.js.org/) or [rollup](https://rollupjs.org/):

```js
import Medusa from '@adoratorio/medusa';

const medusa = new Medusa(/* { ...medusaOptions  } */);
```


## Available options

### MedusaOptions
#### Definition:
| Parameter | Type | Default | Description |
| :-------: | :--: | :-----: | :---------- |
| observers | `Array<ObserverConfig>` | `[]` | Array to fill with observers custom configurations |
| debug | `boolean` | `false` | Set it to true if you want messages in console |


### Medusa observer
When you want to add a new observer in Medusa, you have to create a new configuration object with a specific structure where only the property `id` is required.

#### ObserverConfig interface:
```js
interface ObserverConfig = {
  id : string,
  viewport : null | Document | HTMLElement,
  nodes : Array<Element>,
  threshold : number,
  offsets: string,
  emitGlobal : boolean,
  emitByNode : boolean,
  mode : MODE,
  callback : Function,
};
```

#### Definition:
| Parameter | Type | Default | Description |
| :-------: | :--: | :-----: | :---------- |
| id | `string` | required | The Observer identifier. |
| viewport | `HTMLElement` | `null` | The element that is used as the viewport for checking visibility of the target.|
| nodes | `Array<Element>` | `[]` | All nodes you want to observe. |
| threshold | `number` | `0` | numbers which indicate at what percentage of the target's visibility, a float value between `(0, 1)`.<br>You can use:<br>• a float number <br>• Medusa.THRESHOLD.BEARLY `(0.0)`<br>• Medusa.THRESHOLD.HALF `(0.5)`<br>• Medusa.THRESHOLD.FULL `(1.0)` |
| offsets | `string` | `'0px 0px 0px 0px'` | Margin around the root. Can have values similar to the CSS margin property |
| emitGlobal | `boolean` | `false` | If it's true, Medusa emit the intersection custom event on the window |
| emitByNode | `boolean` | `false` | If it's true, Medusa emit the intersection custom event on the node that intersect the viewport |
| Mode | `string` | `Meduse.MODE.DEFAULT` | Parameter that permit to change how many time the callback is execute.<br>You can use:<br>• Medusa.MODE.DEFAULT or `'default'`: trigger the callback every time the element intersect the viewport threshold.<br>Medusa.MODE.ONCE or `'once'`: trigger the callback the only once.<br>Medusa.MODE.BYPIXELS or `'byPixel'`: trigger the callback every pixel when the element observed is in viewport.<br> |
| callback | `function` | `(e, o) => {}` | A function that is executed whenever an element intersect the viewport threshold that you set in the options. You have the access to the single `entry` and the istance of the `observer`. |


## Properties

### observers
You can access to all the observers added by the property `observers`.
```js
Medusa.observers : Map<string, InternalObserver>;
```

If you want a specific InternalObserver you can do like this:
```js
Medusa.observers.get('observerId');
```

#### ObserverConfig interface:
```js
interface InternalObserver = {
  id : string,
  observerInstance : null | IntersectionObserver,
  observedNodes : Map<number, MedusaElement>,
  emitGlobal : boolean,
  emitByNode : boolean,
  mode : MODE,
  callback : Function,
};
```

#### InternalObserver definition:
| Parameter | Type | Description |
| :-------: | :--: | :---------- |
| id | `string` | The InternalObserver identifier. |
| observerInstance | `IntersectionObserver` | The IntersectionObserver instance.|
| observedNodes | `Map<number, MedusaElement>` | A `Map` of element observed by the `IntersectionObserver`. The number is the element unique id. |
| emitGlobal | `boolean` | If it's true, Medusa emit the intersection custom event on the window |
| emitByNode | `boolean` | If it's true, Medusa emit the intersection custom event on the node that intersect the viewport |
| Mode | `string` | Parameter that permit to change how many time the callback is execute. |
| callback | `function` | A function that is executed whenever an element intersect the viewport threshold that you set in the options. You have the access to the single `entry` and the istance of the `observer`. |


## Methods

### addObserver
To add a new observer you have to create a specific object with the ObserverConfig structure and then you have to pass it to the method.
```js
Medusa.addObserver(configurations : Array<PartialObserverConfig> | PartialObserverConfig);
```

### removeObserver
To remove a specific observer you have to know its id and then pass it to the method.
```js
Medusa.removeObserver('observerId' : string);
```

### clearObserver
Call it if you want to remove all observed nodes from a specific observer providing its id to the method.
```js
Medusa.clearObserver('observerId' : string);
```

### clearAllObservers
Call it if you want to remove all observed nodes from all observers.
```js
Medusa.clearAllObservers();
```

### observe
To observe single node or an array of nodes, you have to pass the observerId of the observer already created and the node/nodes that you want to add.
```js
Medusa.observe('observerId' : string, elToAdd : Element | Array<Element>);
```

### unobserve
To unobserve a single node or an array of nodes, you have to pass the observerId of the observer and the node/nodes that you want to remove.
```js
Medusa.unobserve('observerId' : string, elToRemove : Element | Array<Element>);
```


## Events
When a new Observer is created you can choose if Medusa can emit an event on two different targets:

| Event | Arguments | Description |
| :---: | :-------: | :---------- |
| `medusa-${observerId}` | `event` | If you set `emitGlobal` property to `true` will emit a golbal event on the window when the callback is triggered, on the other hand, if you set `emitByNode` property to `true` in the configuration object Medusa will emit an event on the IntersectionObserver `entry.target`. |

#### Argument details:
```js
event.detail = {
  node : Element, // node observed that intersect the viewport previously defined
  isIn : boolean, // if the element observed is in viewport or not
  entry : IntersectionObserverEntry, // the IntersectionObserver entry
}
```
