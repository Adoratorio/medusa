# Medusa
A simple utility to easy handle multiple IntersectionObserver

## Installation
``` sh
# Install package
npm install @adoratorio/medusa
```


## Browser Compatibility
If you want to support the browsers that [don't support](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#browser_compatibility) the Itersection Observer API you need to install the [IntersectionObserver polyfill](https://github.com/w3c/IntersectionObserver/tree/master/polyfill).


## Usage
Since this package has a [pkg.module](https://github.com/rollup/rollup/wiki/pkg.module) field, it's highly recommended to import it as an ES6 module with some bundlers like [webpack](https://webpack.js.org/) or [rollup](https://rollupjs.org/):

```js
import Medusa from '@adoratorio/medusa';

const medusa = new Medusa({
  targets: [{ /* ...targetOptions */ }],
  // ...medusaOptions
});
```


## Available options

### MedusaOptions
#### Definition:
| Parameter | Type | Default | Description |
| :-------: | :--: | :-----: | :---------- |
| targets | `Array<MedusaTarget>` | `[]` | Array to fill with MedusaTarget |
| debug | `boolean` | `true` | Set it to false if you don't want messages in console |


### MedusaTarget
#### Target interface:
```js
interface Target = {
  id : string,
  viewport : null | Document | HTMLElement,
  nodes : Array<HTMLElement>,
  threshold : number,
  offsets: string,
  emitGlobal : boolean,
  emitByNode : boolean,
  callback : Function,
  mode : MODE,
  autoremove : boolean,
};
```

#### Definition:
| Parameter | Type | Default | Description |
| :-------: | :--: | :-----: | :---------- |
| id | `string` | required | The Observer identifier, usefull in case you add multiple observer. |
| viewport | `HTMLElement` | `null` | The element that is used as the viewport for checking visibility of the target.|
| nodes | `Array<HTMLElement>` | `[]` | All nodes you want to observe. |
| threshold | `number` | `0` | numbers which indicate at what percentage of the target's visibility, a float value between `(0, 1)`.<br>You can use:<br>• a float number <br>• Medusa.THRESHOLD.BEARLY `(0.0)`<br>• Medusa.THRESHOLD.HALF `(0.5)`<br>• Medusa.THRESHOLD.FULL `(1.0)` |
| offsets | `string` | `'0px 0px 0px 0px'` | Margin around the root. Can have values similar to the CSS margin property |
| emitGlobal | `boolean` | `false` | If it's true, Medusa emit the intersection custom event on the window |
| emitByNode | `boolean` | `false` | If it's true, Medusa emit the intersection custom event on the node that intersect the viewport |
| callback | `function` | `(entry, observer) => {}` | A function that is executed whenever an element intersect the viewport threshold that you set in the options. You have the access to the single entry and the istance of the observer. |
| Mode | `string` | `Meduse.MODE.DEFAULT` | Parameter that permit to change how many time the callback is execute.<br>You can use:<br>• Medusa.MODE.DEFAULT or `'default'`: trigger the callback every time the element intersect the viewport threshold.<br>Medusa.MODE.ONCE or `'once'`: trigger the callback the only once.<br>Medusa.MODE.BYPIXELS or `'byPixel'`: trigger the callback every pixel when the element observed is in viewport.<br> |
| autoremove | `boolean` | `false` | If it's true and the mode is `'once'` , Medusa autoremove the target once all nodes callback are triggered |


## APIs

### getTargetFromId()
Get specific target passing its id to the method.
```js
Medusa.getTargetFromId('targetId' : string);
```

### addTarget()
To add a new target you have to create a specific object with the MedusaTarget structure and then you have to pass it to the method.
```js
Medusa.addTarget(target : Array<Target> | Target);
```

### removeTarget()
To remove a specific target you have to know its id and then pass it to the method.
```js
Medusa.removeTarget('targetId' : string);
```

### clearTarget()
Call it if you want to remove all observed nodes from a specific target providing its id to the method.
```js
Medusa.clearTarget('targetId' : string);
```

### clearAllTargets()
Call it if you want to remove all observed nodes from all targets.
```js
Medusa.clearAllTargets();
```

### pushToTarget()
To add a single node or an array of nodes, you have to pass the targetId of the observer already created and the node/nodes that you want to add.
```js
Medusa.pushToTarget('targetId' : string, elToAdd : HTMLElement | Array<HTMLElement>);
```

### pullFromTarget()
To remove a single node or an array of nodes, you have to pass the targetId of the observer and the node/nodes that you want to remove.
```js
Medusa.pullFromTarget('targetId' : string, elToRemove : HTMLElement | Array<HTMLElement>);
```

## Events
When a new Target is created you can choose if Medusa can emit two different events:

| Event | Arguments | Description |
| :---: | :-------: | :---------- |
| `medusa-intersection-triggered` | `event` | If you set Target `emitGlobal` property will emit a golbal event on the window every time the callback Target is triggered. |
| `medusa-node-intersection` | `event` | If you set Target `emitByNode` property will emit an event on the element observed every time the callback Target is triggered. |

#### Argument details:
```js
event.detail = {
  targetId : string, // Observer TargetId
  node : HTMLElement, // node observed that intersect the viewport previously defined
  isIn : boolean, // if the element observed is in viewport or not
}
```