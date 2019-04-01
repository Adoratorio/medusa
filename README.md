# Medusa
A simple utility to easy handle multiple IntersectionObserver

## Installation
``` sh
# Install package
npm install @adoratorio/medusa
```

## Browser Compatibility
If you want to support the browsers that don't support this technology you need to install the [IntersectionObserver polifill](https://github.com/w3c/IntersectionObserver/tree/master/polyfill).

| Browser | Version |
| :------ | :-----: |
| IE      | –       |
| Edge    | 15+     |
| Chrome  | 51+     |
| Firefox | 55+     |
| Safari  | 12.1 - TP       |
| Android Browser | 51+     |
| Chrome for Android | 51+  |
| Firefox for Android | 64+ |
| iOS Safari | 12.2 |

## Usage
Since this package has a [pkg.module](https://github.com/rollup/rollup/wiki/pkg.module) field, it's highly recommended to import it as an ES6 module with some bundlers like [webpack](https://webpack.js.org/) or [rollup](https://rollupjs.org/):

```js
import Medusa from '@adoratorio/medusa';

const medusa = new Medusa({ targets: {
    // ...opts
  },
});
```

If you are not using any bundlers, you can just load the UMD bundle:

```html
<script src="/medusa/umd/index.js"></script>

<script>
  var medusa = window.Medusa({ targets: {
      // ...opts
    }
  });
</script>
```

## Available options
Medusa accept as `targets` both array of targetObject or a targetObject.

TargetOject definition:

| parameter | type | default | description |
| :-------: | :--: | :-----: | :---------- |
| id | `string` | `'snakes'` | The Observer identifier, usefull in case you add multiple observer.  |
| container | `HTMLElement` | `document.body` | The node that contains all the elements that you want observe.|
| nodes | `string`<br>or<br>`Array<HTMLElement>` | `'.m-snake'` | The node that contains all the elements that you want observe. |
| threshold | `number` | `0.1` | numbers which indicate at what percentage of the target's visibility, a float value between `(0, 1)`.<br>You can use:<br>• Medusa.THRESHOLD.BEARLY `(0.0)`<br>• Medusa.THRESHOLD.HALF `(0.5)`<br>• Medusa.THRESHOLD.FULL `(1.0)` |
| offsets | `string` | `'0px'` | Margin around the root. Can have values similar to the CSS margin property, e.g. `'10px 20px 30px 40px'` |
| emitGlobal | `boolean` | `false` | If it's true, Medusa emit the intersection custom event on the window insted of the container. |
| callback | `function` | `(entry, observer) => {}` | A function that is executed whenever an element intersect the viewport threshold that you set in the options. You have the access to the single entry and the istance of the observer. |
| Mode | `string` | `Meduse.MODE.DEFAULT` | Parameter that permit to change how many time the callback is execute.<br>You can use:<br>• Medusa.MODE.DEFAULT: trigger the callback every time the element intersect the viewport threshold.<br>Medusa.MODE.ONCE: trigger the callback the only once.<br>Medusa.MODE.BYPIXELS: trigger the callback every pixel when the element observed is in viewport.<br> |


## APIs

### addTarget()
To add a new target you have to create a specific object with this structure.
```js
interface Target = {
  id : string,
  container: Document | HTMLElement,
  nodes : Array<HTMLElement> | string,
  threshold : number,
  offsets : string,
  emitGlobal : boolean,
  callback : Function,
  mode : MODE,
};
```

And then you have to pass it to the method
```js
Medusa.addTarget(target : Array<Target> | Target);
```

### removeTarget()
To remove a specific target you have to know what is the id, and then pass it to the method.
```js
Medusa.removeTarget('targetId' : string);
```

### pushToTarget()
To add a single node or an array of nodes, you have to pass the targetId of the observer already created, and the node/nodes that you want to add;
```js
Medusa.pushToTarget('targetId' : string, elToAdd : HTMLElement | Array<HTMLElement>);
```

### pullFromTarget()
To remove a single node or an array of nodes, you have to pass the targetId of the observer and the node/nodes that you want to remove;
```js
Medusa.pullFromTarget('targetId' : string, elToRemove : HTMLElement | Array<HTMLElement>);
```
