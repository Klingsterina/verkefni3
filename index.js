import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ThreeMFLoader } from 'three/examples/jsm/Addons.js';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 1000 );
scene.background = new THREE.Color(0x87ceeb);

const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls( camera, renderer.domElement );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// Skilgreina ljósgjafa og bæta honum í sviðsnetið
const ambientLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1); // no shadow
const directLight = new THREE.DirectionalLight(0xFFFFFF, 0.3, 50); //shadow
directLight.position.set(-1, 2, 4);
scene.add(ambientLight);
scene.add(directLight)
camera.position.z = 13;
camera.position.y = 6;

// Ground
const groundGeometry = new THREE.BoxGeometry(15, 1, 21);
const groundMaterial = new THREE.MeshPhongMaterial({ color: 0xfff8f2 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.set(0, -(ground.geometry.parameters.height / 2), 1);
scene.add(ground);

//Gata
const roadGeometry = new THREE.BoxGeometry(15.02, 1, 9);
const roadMaterial = new THREE.MeshPhongMaterial({color: 0x00ff10});
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.position.set(0, -(road.geometry.parameters.height / 2)+0.01, 5);
scene.add(road);

//water
const waterGeometry = new THREE.BoxGeometry(15.02, 1, 8);
const waterMaterial = new THREE.MeshPhongMaterial({color: 0x0000ff});
const water = new THREE.Mesh(waterGeometry, waterMaterial);
let isOnWater = false;
water.position.set(0, -(water.geometry.parameters.height / 2)+0.01, -4.5);
let waterBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
waterBB.setFromObject(water);
scene.add(water);

//Fluga
const flugaGeometry = new THREE.BoxGeometry(0.5,0.5,0.5);
const flugaMaterial = new THREE.MeshPhongMaterial({color: 0xff00f0});
const fluga = new THREE.Mesh(flugaGeometry, flugaMaterial);
fluga.position.set(3, (ground.position.y + ground.geometry.parameters.height / 2 + fluga.geometry.parameters.height / 2), 0);
let flugaBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
flugaBB.setFromObject(fluga);
scene.add(fluga);

// Frog
const frogGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
const frogMaterial = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
const frog = new THREE.Mesh(frogGeometry, frogMaterial);
let isFrogAlive = true;
frog.position.set(0, (ground.position.y + ground.geometry.parameters.height / 2 + frog.geometry.parameters.height / 2), 0);

// Búa til collision fyrir frosk
let frogBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
frogBB.setFromObject(frog);
scene.add(frog);

//draw car
const carGeometry = new THREE.BoxGeometry(3, 1, 0.9);
const carMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const car = new THREE.Mesh(carGeometry, carMaterial);
car.position.set(0, ground.position.y + ground.geometry.parameters.height / 2 + car.geometry.parameters.height / 2, 3);
let carBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());

//teykna bíla frá 1 til 9
const carPositions = [9,8,7,6,5,4,3,2,1];
const cars = [];
let carSpeeds = []
const maxSpeed = 6
const minSpeed = 2;
for (let i = 0; i < carPositions.length; i++) {
	carSpeeds.push(Math.random()*(maxSpeed-minSpeed)+minSpeed)
}

for (let i = 0; i < carPositions.length; i++) {
	const car = new THREE.Mesh(carGeometry, carMaterial);
	car.position.set(Math.random()*14-7, ground.position.y + ground.geometry.parameters.height / 2 + car.geometry.parameters.height / 2, carPositions[i]); // Start each car at x = 4
	cars.push(car);
	scene.add(car);
}

// Fall til að færa bílana á x-axis
const mapwidth = 6
function moveCars(deltaTime) {
	for (let i = 0; i < cars.length; i++) {
			const car = cars[i];
			car.position.x += carSpeeds[i] * deltaTime;

			if (car.position.x <= -mapwidth || car.position.x >= mapwidth) {
					carSpeeds[i] *= -1;
					car.position.x = THREE.MathUtils.clamp(car.position.x, -mapwidth, mapwidth);
			}

			carBB.setFromObject(car);
			if (isFrogAlive && frogBB.intersectsBox(carBB)) {
					frog.position.set(0, ground.position.y + ground.geometry.parameters.height / 2 + frog.geometry.parameters.height / 2, 0);
					console.log("Collision detected! Try again");
			}
	}
}


// teykna logs
const logGeometry = new THREE.BoxGeometry(3, 1, 0.9);
const logMaterial = new THREE.MeshPhongMaterial({color: 0x964B00});
const log = new THREE.Mesh(logGeometry, logMaterial);
log.position.set(0, (ground.position.y + ground.geometry.parameters.height / 2 + car.geometry.parameters.height / 2)-0.7, -1);
let logBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
let isOnLog = false;

// Log positions and speeds
const logPositions = [-1,-2,-3,-4,-5,-6,-7,-8];
const logs = [];
let logSpeeds = [];

// Initialize log speeds
for (let i = 0; i < logPositions.length; i++) {
	logSpeeds.push(Math.random() * (maxSpeed - minSpeed) + minSpeed);
}

// Create log objects
for (let i = 0; i < logPositions.length; i++) {
	const log = new THREE.Mesh(logGeometry, logMaterial);
	log.position.set(Math.random() * 14 - 7, ground.position.y + ground.geometry.parameters.height / 2 + log.geometry.parameters.height / 2 - 0.7, logPositions[i]);
	logs.push(log);
	scene.add(log);
}

// Function to move logs along the x-axis
function moveLogs(deltaTime) {
	isOnLog = false; // Only reset once per call, not every iteration

	for (let i = 0; i < logs.length; i++) {
			const log = logs[i];

			// Move log along x-axis and clamp within bounds
			log.position.x += logSpeeds[i] * deltaTime;
			if (log.position.x <= -mapwidth || log.position.x >= mapwidth) {
					logSpeeds[i] *= -1;
					log.position.x = THREE.MathUtils.clamp(log.position.x, -mapwidth, mapwidth);
			}

			// Update bounding box for the log only if necessary
			logBB.setFromObject(log);

			// Check if frog is on this log and move frog with log if true
			if (frogBB.intersectsBox(logBB)) {
					isOnLog = true;
					frog.position.x += logSpeeds[i] * deltaTime;
			}
	}

	// Water check only if the frog is not on any log
	if (!isOnLog && frogBB.intersectsBox(waterBB)) {
			isOnWater = true;
			frog.position.set(0, ground.position.y + ground.geometry.parameters.height / 2 + frog.geometry.parameters.height / 2, 0);
			console.log("You fell into the water!");
	} else {
			isOnWater = false;
	}
}

let flugaCounter = 0;
// Gera interaction frog og flugu
if (frogBB.intersectsBox(flugaBB)) {
    flugaCounter++
    scene.remove(fluga);
    console.log(flugaCounter);
}


// const isOnWater = false;
// function isOnWater() {
//     if (isFrogAlive) {
        
//     }
// }

// Animate function
let lastFrameTime = 0;
function animate(currentTime) {
    const deltaTime = (currentTime - lastFrameTime) / 1000; // seconds
    lastFrameTime = currentTime;

    frogBB.copy(frog.geometry.boundingBox).applyMatrix4(frog.matrixWorld);
    moveCars(deltaTime);
    moveLogs(deltaTime);
    
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Movement controls
const xSpeed = 1;
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    const keyCode = event.which;
    if (keyCode === 38 || keyCode === 87) frog.position.z -= xSpeed; // Up
    else if (keyCode === 40 || keyCode === 83) frog.position.z += xSpeed; // Down
    else if (keyCode === 37 || keyCode === 65) frog.position.x -= xSpeed; // Left
    else if (keyCode === 39 || keyCode === 68) frog.position.x += xSpeed; // Right
    else if (keyCode === 32) frog.position.set(0, ground.position.y + ground.geometry.parameters.height / 2 + frog.geometry.parameters.height / 2, 9); // Reset position
};