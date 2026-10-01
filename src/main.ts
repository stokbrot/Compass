import {
  Engine,
  Scene,
  UniversalCamera,
  HemisphericLight,
  PointLight,
  DirectionalLight,
  MeshBuilder,
  Vector3,
  Color4,
  Color3,
  Sound,
  PBRMaterial,
  CubeTexture,
  DefaultRenderingPipeline,
  SSAO2RenderingPipeline,
  ShadowGenerator,
  SceneLoader,
} from '@babylonjs/core';

import '@babylonjs/loaders/glTF'; // enables .glb/.gltf loading

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

const scene = new Scene(engine);
scene.clearColor = new Color4(0.05, 0.05, 0.07, 1);
scene.gravity = new Vector3(0, -0.5, 0);
scene.collisionsEnabled = true;

scene.fogMode = Scene.FOGMODE_EXP2;
scene.fogDensity = 0.035;
scene.fogColor = new Color3(0.05, 0.05, 0.07);

// --- Environment lighting (for PBR reflections/ambient) ---
const envTexture = CubeTexture.CreateFromPrefilteredData(
  'https://assets.babylonjs.com/environments/environmentSpecular.env',
  scene
);
scene.environmentTexture = envTexture;
scene.environmentIntensity = 0.4;

// --- Camera / player ---
const camera = new UniversalCamera('player', new Vector3(0, 2, -8), scene);
camera.attachControl(canvas, true);
camera.applyGravity = true;
camera.checkCollisions = true;
camera.ellipsoid = new Vector3(0.6, 1, 0.6);
camera.minZ = 0.1;

camera.keysUp.push(87);    // W
camera.keysDown.push(83);  // S
camera.keysLeft.push(65);  // A
camera.keysRight.push(68); // D

camera.speed = 2.0;
camera.inertia = 0.0;
camera.angularSensibility = 800;

canvas.addEventListener('click', () => {
  if (!menuOpen) {
    canvas.requestPointerLock();
    canvas.focus();
  }
});

SceneLoader.ImportMeshAsync('', '/game/models/namaqualand_boulder_02/', 'namaqualand_boulder_02_4k.gltf', scene).then((result) => {
  const mesh = result.meshes[0];
  mesh.position.set(3, 0, 5);
  mesh.checkCollisions = true;
  shadowGen.addShadowCaster(mesh, true);
});
// --- Lights ---
const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
ambient.intensity = 0.15;

const lamp = new PointLight('lamp', new Vector3(0, 4, 0), scene);
lamp.intensity = 0.6;
lamp.diffuse = new Color3(1, 0.85, 0.6);

const corridorLight = new PointLight('corridorLight', new Vector3(0, 4, 27.5), scene);
corridorLight.intensity = 0.3;

const sun = new DirectionalLight('sun', new Vector3(-0.3, -1, 0.2), scene);
sun.intensity = 0.2;

// --- Level geometry (placeholder room) ---
const floor = MeshBuilder.CreateGround('floor', { width: 40, height: 40 }, scene);
floor.checkCollisions = true;
floor.receiveShadows = true;

const wallOptions = { width: 40, height: 6, depth: 0.5 };
const wallPositions: [number, number, number, number][] = [
  [0, 3, 20, 0],
  [0, 3, -20, 0],
  [20, 3, 0, Math.PI / 2],
  [-20, 3, 0, Math.PI / 2],
];
for (const [x, y, z, rotY] of wallPositions) {
  const wall = MeshBuilder.CreateBox('wall', wallOptions, scene);
  wall.position.set(x, y, z);
  wall.rotation.y = rotY;
  wall.checkCollisions = true;
}

const corridor = MeshBuilder.CreateBox('corridor', { width: 4, height: 6, depth: 15 }, scene);
corridor.position.set(0, 3, 27.5);
corridor.checkCollisions = true;

const box = MeshBuilder.CreateBox('box', { size: 2 }, scene);
box.position.y = 1;
box.checkCollisions = true;

const boxMat = new PBRMaterial('boxMat', scene);
boxMat.albedoColor = new Color3(0.6, 0.6, 0.65);
boxMat.metallic = 0.2;
boxMat.roughness = 0.6;
box.material = boxMat;

// --- Shadows ---
const shadowGen = new ShadowGenerator(1024, sun);
shadowGen.addShadowCaster(box);
shadowGen.useBlurExponentialShadowMap = true;

// --- Post-processing ---
const pipeline = new DefaultRenderingPipeline('default', true, scene, [camera]);
pipeline.bloomEnabled = true;
pipeline.bloomThreshold = 0.6;
pipeline.bloomWeight = 0.3;
pipeline.imageProcessing.toneMappingEnabled = true;
pipeline.imageProcessing.toneMappingType = 1; // ACES filmic
pipeline.fxaaEnabled = true;
pipeline.sharpenEnabled = true;

const ssao = new SSAO2RenderingPipeline('ssao', scene, 0.75, [camera]);
ssao.totalStrength = 1.2;
ssao.radius = 2;

// --- Audio ---
new Sound('ambient', '${import.meta.env.BASE_URL}audio/ambient.mp3', scene, null, {
  loop: true,
  autoplay: true,
  volume: 0.9,
});

// --- Settings menu (press P) ---
const settingsMenu = document.getElementById('settingsMenu') as HTMLDivElement;
const sensSlider = document.getElementById('sensSlider') as HTMLInputElement;
let menuOpen = false;

function openSettings() {
  menuOpen = true;
  settingsMenu.style.display = 'flex';
  document.exitPointerLock();
}

function closeSettings() {
  menuOpen = false;
  settingsMenu.style.display = 'none';
  canvas.requestPointerLock();
  canvas.focus();
}

sensSlider.addEventListener('input', () => {
  camera.angularSensibility = 3200 - Number(sensSlider.value);
});
sensSlider.addEventListener('change', () => sensSlider.blur());

document.addEventListener('keydown', (e) => {
  if (e.key === 'p' || e.key === 'P') {
    menuOpen ? closeSettings() : openSettings();
  }
});

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && !menuOpen) {
    openSettings();
  }
});

// --- Render loop ---
engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());