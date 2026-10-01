import { Engine, Scene, FreeCamera, HemisphericLight, MeshBuilder, Vector3, Color4 } from '@babylonjs/core';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

const scene = new Scene(engine);
scene.clearColor = new Color4(0.05, 0.05, 0.07, 1);

const camera = new FreeCamera('camera', new Vector3(0, 2, -8), scene);
camera.setTarget(Vector3.Zero());
camera.attachControl(canvas, true);

const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
light.intensity = 0.8;

MeshBuilder.CreateGround('floor', { width: 20, height: 20 }, scene);
const box = MeshBuilder.CreateBox('box', { size: 2 }, scene);
box.position.y = 1;

engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());