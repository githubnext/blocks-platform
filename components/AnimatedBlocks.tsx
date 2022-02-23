import { range } from "d3"
import Matter from "matter-js"
import { useEffect, useRef } from "react";
import debounce from "lodash/debounce";

const shapeTypes = ["circle", "rectangle", "polygon"];
const colors = [
  "#fff",
  // "#E0E7FF", "#FBE7F3", "#DCEAFE", "#E5E7EB"
]
const numberOfBlocks = 16
export const AnimatedBlocks = () => {
  const canvas = useRef(null)

  const startSimulation = () => {
    if (!canvas.current) return

    let width = window.innerWidth
    let height = window.innerHeight

    var Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite;

    var engine = Engine.create({
      gravityScale: 0.0001,
      enableSleeping: true,
    });

    var render = Render.create({
      canvas: canvas.current,
      engine: engine,
      options: {
        width: width,
        height: height,
        background: "transparent",
        wireframes: false,
      }
    });

    scaleCanvas(canvas.current, render.context, window.innerWidth, window.innerHeight)

    width = canvas.current.width
    height = canvas.current.height

    const ratio = window.devicePixelRatio || 1

    const shapes = range(0, numberOfBlocks).map(i => {
      const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)]
      const mass = Math.random() * 200 * ratio
      const args = {
        circle: [width / (2 * ratio), 0, mass],
        rectangle: [width / (2 * ratio), 0, mass, mass],
        polygon: [width / (2 * ratio), 0, 6, mass]
      }[type]
      return {
        x: width / 2,
        y: 0,
        type,
        args,
        mass,
        color: colors[Math.floor(Math.random() * colors.length)],
        r: 100 * ratio,
      }
    })

    shapes.forEach(shape => {
      var body = Bodies[shape.type](...shape.args, {
        render: {
          fillStyle: shape.color,
          strokeStyle: "transparent",
          lineWidth: 10
        },
        torque: Math.random() * 10,
        friction: 0.1,
        frictionAir: 0.1,
        frictionStatic: 1,
        mass: shape.mass / 160,
      });
      Composite.add(engine.world, body);
    })
    const ground = Bodies.rectangle(0, height, width, height, { isStatic: true });
    const wallLeft = Bodies.rectangle(-1, 0, 2, height, { isStatic: true });
    const wallRight = Bodies.rectangle(width / ratio + 2, 0, 2, height, { isStatic: true });

    Composite.add(engine.world, [ground, wallLeft, wallRight]);

    Render.run(render);

    var runner = Runner.create();

    Runner.run(runner, engine);
  }
  useEffect(() => {
    startSimulation()
    const onResize = debounce(() => {
      startSimulation()
    }, 300)
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return (
    <div className="relative w-screen h-screen">
      <canvas className="absolute w-screen h-screen" ref={canvas} />
    </div >
  )
}


// grabbed from https://gist.github.com/callumlocke/cc258a193839691f60dd
export const scaleCanvas = (canvas, context, width, height) => {
  // assume the device pixel ratio is 1 if the browser doesn't specify it
  const devicePixelRatio = window.devicePixelRatio || 1;

  // determine the 'backing store ratio' of the canvas context
  const backingStoreRatio =
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1;

  // determine the actual ratio we want to draw at
  const ratio = devicePixelRatio / backingStoreRatio;

  if (devicePixelRatio !== backingStoreRatio) {
    // set the 'real' canvas size to the higher width/height
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    // ...then scale it back down with CSS
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
  } else {
    // this is a normal 1:1 device; just scale it simply
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "";
    canvas.style.height = "";
  }

  // scale the drawing context so everything will work at the higher ratio
  context.scale(ratio, ratio);
};