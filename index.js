import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ThreeMFLoader } from 'three/examples/jsm/Addons.js';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 1000 );
scene.background = new THREE.Color(0x87ceeb);

const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls( camera, renderer.domElement );
renderer.setSize( window.innerWidth, window.innerHeight );
requestAnimationFrame(animate);
document.body.appendChild( renderer.domElement );

// Skilgreina ljósgjafa og bæta honum í sviðsnetið
const ambientLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1); // no shadow
const directLight = new THREE.DirectionalLight(0xFFFFFF, 0.3, 50); //shadow
directLight.position.set(-1, 2, 4);
scene.add(ambientLight);
scene.add(directLight)
camera.position.z = 13;
camera.position.y = 6;

//Ground
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

// Fluga (Fly)
const flugaGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const flugaMaterial = new THREE.MeshPhongMaterial({ color: 0xff00f0 });
const fluga = new THREE.Mesh(flugaGeometry, flugaMaterial);
fluga.position.set(
  3,
  ground.position.y +
    ground.geometry.parameters.height / 2 +
    fluga.geometry.parameters.height / 2,
  -9
);
// Compute the bounding box for the fly's geometry
fluga.geometry.computeBoundingBox();

// Initialize the fly's bounding box
let flugaBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
flugaBB.setFromObject(fluga); // Uncomment this line

scene.add(fluga);

// Frog
const frogGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
const frogMaterial = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
const frog = new THREE.Mesh(frogGeometry, frogMaterial);
let isFrogAlive = true;
frog.position.set(0, (ground.position.y + ground.geometry.parameters.height / 2 + frog.geometry.parameters.height / 2), 10);

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

        // Check if the car is out of bounds and reverse direction
        if (car.position.x <= -mapwidth || car.position.x >= mapwidth) {
            carSpeeds[i] *= -1;
            car.position.x = THREE.MathUtils.clamp(car.position.x, -mapwidth, mapwidth);
        }

        // Update the bounding box for the car
        carBB.setFromObject(car);

        // Check for collision only if the frog is alive
        if (isFrogAlive && frogBB.intersectsBox(carBB)) {
			isFrogAlive = false; // Mark the frog as dead
			frog.position.set(0, ground.position.y + ground.geometry.parameters.height / 2 + frog.geometry.parameters.height / 2, 10);
			frogTargetPosition.copy(frog.position); // Reset the target position
			console.log("Collision detected! Try again");
			isFrogAlive = true;
		}
    }
}


// teykna logs
const logGeometry = new THREE.BoxGeometry(3, 1, 1);
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
				// Move frog with the log
				let logMovement = logSpeeds[i] * deltaTime;
				frog.position.x += logMovement;
				// Adjust the target position accordingly
				frogTargetPosition.x += logMovement;
			}
	}

	// Water check only if the frog is not on any log
    if (!isOnLog && frogBB.intersectsBox(waterBB)) {
        isOnWater = true;
        // Reset frog's position and target position
        frog.position.set(0, ground.position.y + ground.geometry.parameters.height / 2 + frog.geometry.parameters.height / 2, 10);
        frogTargetPosition.copy(frog.position);
        console.log("You fell into the water!");
    } else {
        isOnWater = false;
    }
}

// Function to get a random x position within the track bounds
function getRandomXPosition() {
	return Math.random() * 14 - 7;  // Random value between -7 and 7
}

// Function to get a random z position (either 0 or -9)
function getRandomZPosition() {
	return Math.random() > 0.5 ? 0 : -9;  // Randomly chooses 0 or -9
}

// Respawn the fly at a random x and z position
function respawnFly() {
	fluga.position.x = getRandomXPosition();  // Assign a random x position
	fluga.position.z = getRandomZPosition();  // Assign z=0 or z=-9 randomly
	flugaBB.setFromObject(fluga);
	scene.add(fluga);  // Add fly to the scene
}

//myndavel eltir frög
function updateCameraPosition() {
    const offset = new THREE.Vector3(0, 6, 13);
    camera.position.x = frog.position.x + offset.x;
    camera.position.y = frog.position.y + offset.y;
    camera.position.z = frog.position.z + offset.z;
    camera.lookAt(frog.position);
}

// Animate function
let lastFrameTime = 0;
let flugaCounter = 0;
let flugaEaten = false;
function animate(currentTime) {
	const deltaTime = (currentTime - lastFrameTime) / 1000; // seconds
	lastFrameTime = currentTime;
	moveCars(deltaTime);
	moveLogs(deltaTime);

	// Always move frog toward target position
	let distance = frog.position.distanceTo(frogTargetPosition);
	if (distance > 0.01) {
		let direction = new THREE.Vector3().subVectors(frogTargetPosition, frog.position).normalize();
		let step = moveSpeed * deltaTime;
		if (step >= distance) {
			frog.position.copy(frogTargetPosition);
			isMoving = false;
		} else {
			frog.position.addScaledVector(direction, step);
		}
	} else {
		isMoving = false;
	}

	updateCameraPosition();

	if (!flugaEaten && frogBB.intersectsBox(flugaBB)) {
		flugaCounter++;
		flugaEaten = true;
		scene.remove(fluga);  // Remove fly from the scene
		console.log("Fly eaten! Score:", flugaCounter);

		// Respawn fly randomly
		setTimeout(() => {
			flugaEaten = false;  // Reset eaten status
			respawnFly();  // Respawn fly at a new position
	}, 6000); // Set a delay before respawn
	}

	if (isFrogAlive) {
        frogBB.copy(frog.geometry.boundingBox).applyMatrix4(frog.matrixWorld);
    }
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}

// Movement controls
const xSpeed = 1;
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    if (!isFrogAlive || isMoving) return; // Prevent movement if the frog is dead or already moving

    const keyCode = event.which;
    if (keyCode === 38 || keyCode === 87) frogTargetPosition.z -= xSpeed; // Up
    else if (keyCode === 40 || keyCode === 83) frogTargetPosition.z += xSpeed; // Down
    else if (keyCode === 37 || keyCode === 65) frogTargetPosition.x -= xSpeed; // Left
    else if (keyCode === 39 || keyCode === 68) frogTargetPosition.x += xSpeed; // Right
    else if (keyCode === 32) {
        frog.position.set(0, ground.position.y + ground.geometry.parameters.height / 2 + frog.geometry.parameters.height / 2, 10); // Reset position
        frogTargetPosition.copy(frog.position);
    }

    isMoving = true; // Set moving flag
};

const moveSpeed = 15; // Units per second
let frogTargetPosition = frog.position.clone();
let isMoving = false; // Optional flag if you want to prevent mid-movement direction changes