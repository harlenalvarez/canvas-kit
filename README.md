<a name="readme-top"></a>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
    </li>
    <li>
      <a href="#getting-started">API</a>
    </li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

Library with helper methods to use with the canvas api 2d context.
This library is not intender to wrap around the canvas api, but to use along side.
All of the methods return points 


<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- GETTING STARTED -->
## Getting Started

### Installation

```npm
npm i @practicaljs/canvas-kit
```

### API

#### translateAngle
In the Canvas API, angle 0 for an arc starts on the right hand side,
normally you would think of this angle as 90 degree where 0/360 is at the top.  The translate angle allows you to use angles as you normally think of them.
```ts
  ctx.arc(0,0, 10, translateAngle(0)* (Math.PI/180), Math.PI * 2)
```

#### getCanvasPoint
Gets a point within a canvas relative to the mouse click or move position.
example
```ts
   const canvas = document.getById('canvas');
   const ctx = canvas.getContext('2d');
   const rec = new Path2d();
   // on click draw a rec
   document.addEventListener('click', (ev) => {
    const [x, y] = getCanvasPoint(ev, ctx);
    rec.roundRect(x, y, 200, 150, 4);
    ctx.fill(rec);
   })

   // check if mouse over shape
   document.addEventListener('mousemove', (ev) => {
    // pass the boolean flag for offset by scaling if scaling is used
    const [x, y] = getCanvasPoint(ev, ctx, true);
    ctx.isPointInPath(rec, x, y)
   })
```
#### clearCanvas
Clears the contents of a canvas
```ts
clearCanvas(ctx);
```

#### getMidPoint
Gets the mid point between two points, good for creating curved lines, determining the center of the canvas, or calculating proximity by comparing the midpoint of a node rather then the connection points.

```ts
const midpoint: {x:number, y:number} = getMidPoint({x: 0, y: 0}, {x: 100, y: 100});
```

#### getSlope
Gets the slope of two points, usefull for determining if a curve line is possible or instead a quadratic line or straight line should be used.

```ts
const slope:number = getSlope({x:0,y:0}, {x:100,y:100});
```

>Another check has to be done for curved lines and that is is there enough space between two points to fit a line with said curved.
Example:
```ts
let radius = 30;
const slope = getSlope(nodeA.point, nodeB.point);
const diameter = radius * 2;
const hasSpace = Math.abs(nodeA.point.x - nodeB.point.x) > diameter && Math.abs(nodeA.point.y - nodeB.point.y) > diameter;
if(slope > .3 && hasSpace) {
  ctx.arcTo(nodeA.point.x, midPoint.y, midPoint.x, midPoint.y, radius);
}
else {
  // straight or quadratic line
}
```

#### getDistance
Gets the distance between two points, can be use in combination with midpoint to determine the closest connection points

```ts
 const dist: number = getDistance({x,y}, {x,y});
```

#### getNodeAttachentPoints
Returns an array of attachment points around a node.
The first two params
```ts
const gap = 0; // gap between the circumference line and the point if any
const pointToConnect = 4; // use 4 or 8 points, (4 is default)
const points = getNodeAttachentPoints(sphere.point, sphere.radius, gap, pointToConnect);
// visualize the points
for (let p of points) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
  ctx.stroke();
}
```

#### getNodeConnectionPoints

Gets the connection points of two nodes and returns the closest two points and the position around the node. Used to figure out where to attach a line when using quadratic curves or arcTo curves. For straight lines you can use this method or just have them originate from the center.

example:

```ts
const gap = 0;
const points = 8;
const { nodeA, nodeB } = getConnectionPoints(parent, child, gap, points);
// make a line from point a to point b
ctx.moveTo(nodeA.point.x, nodeA.point.y);
ctx.lineTo(nodeB.point.x, nodeB.point.y);

// you can use the position to determine the direction of your curved line
// for example if the position starts on top you want the line to go up on the y axis of the midpoint then arc to the midpoint
// if starts on the left or right then you want the line to move along the x axis of the midpoint then arc to the midpoint
if(nodeA.position & CanvasNodeConnPosition.top) { 
  console.log('Point start on the top of the node')
}
```

>This method returns an object with this signature
 ```{ point: Point, position: CanvasNodeConnPosition }```

 #### nodeRadialPosition
 This method takes in a center point and radius, the number of nodes that need placement and returns a method that when called with an the index of the nodes will return a point to assign to each node.
 
 Example Code:
 Lets say we have 3 parent nodes we want to render in the middle of a 1600 by 1600 canvas.
 ```ts
const radiusOfNodes = 30;
const middlePoint = getMidPoint({x:0, y:0}, {x: 1600, y: 1600});

// we want to position 3 nodes starting on the top and taking full space of a circle
const [positionNode, positionLineRadius, totalNodeRadius] = nodeRadialPosition({ center: middlePoint, centerRadius: 1, nodesCount: 3, nodesRadius: radiusOfNodes, startAngle: 0, section: NodeSection.full });

// visualize where the nodes will be placed
ctx.arc(middlePoint.x, middlePoint.y, positionLineRadius, 0, Math.PI * 2);
ctx.stroke();
// the nodes will be placed on the circumference of this line

for (let index = 0; index < nodeCount; index++) {
  // we now get the x, y to place our node
  const { x, y } = positionNode(index);
  // create the node
  ctx.beginPath();
  ctx.arc(x, y, radiusOfNodes, 0, Math.PI * 2);
  ctx.fill();
}

// if you need to add nodes to nodes you can use the totalNodeRadius as the next radius to start
// placing level 2 elements
const [positionNode2, positionLineRadius2, totalNodeRadius2] = nodeRadialPosition({ center: middlePoint, centerRadius: totalNodeRadius, nodesCount: 3, nodesRadius: radiusOfNodes, startAngle: 0, section: NodeSection.full });
 ```

#### fromAlpaToHex

Method to translate an alpha to hex for css purposes.
Imagine you have this color #d3d3d3 and you want to add a transparency of 0.7 as you would with rbga(,,,.7);

```ts

const alphaHex = fromAlphaToHex(0.7);
const hexColor = `#d3d3d3${alphaHex}`;
```