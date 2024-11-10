import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ThreeMFLoader } from 'three/examples/jsm/Addons.js';
const gameOverScreen = document.getElementById("gameOverScreen");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 1000 );
scene.background = new THREE.Color(0x87ceeb);

const mapWidth= 7.5; // Half the width of the map (adjust as needed)
const mapDepth = 10.5; // Half the depth of the map (adjust as needed)

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

// Ground
const groundGeometry = new THREE.BoxGeometry(15, 1, 21);
const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x66bb6a});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.set(0, -(ground.geometry.parameters.height / 2), 1);
scene.add(ground);

// Gata
const roadGeometry = new THREE.BoxGeometry(15.02, 1, 9);
const roadMaterial = new THREE.MeshPhongMaterial({color: 0xbebebe});
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.position.set(0, -(road.geometry.parameters.height / 2)+0.01, 5);
scene.add(road);

// dot road div
const laneSegmentLength = 0.5;
const gapBetweenSegments = 0.3;
const roadWidth = 15.02;
const laneDividerMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const numLanes = 9;
const laneSpacing = road.geometry.parameters.depth / numLanes;
const xOffset = 0.3;

for (let i = 1; i < numLanes; i++) {
    const laneZPosition = road.position.z - road.geometry.parameters.depth / 2 + i * laneSpacing;
    // dot all laneos
    for (let x = -roadWidth / 2 + xOffset; x <= roadWidth / 2 + xOffset; x += laneSegmentLength + gapBetweenSegments) {
        const laneSegmentGeometry = new THREE.BoxGeometry(laneSegmentLength, 0.02, 0.05);
        const laneSegment = new THREE.Mesh(laneSegmentGeometry, laneDividerMaterial);
        laneSegment.position.set(x, ground.position.y + ground.geometry.parameters.height / 2 + 0.02, laneZPosition);
        scene.add(laneSegment);
    }
}


// water
const waterGeometry = new THREE.BoxGeometry(15.02, 1, 8);
const waterMaterial = new THREE.MeshPhongMaterial({color: 0x0000ff});
const water = new THREE.Mesh(waterGeometry, waterMaterial);
let isOnWater = false;
water.position.set(0, -(water.geometry.parameters.height / 2)+0.01, -4.5);
let waterBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
waterBB.setFromObject(water);
scene.add(water);

// Fluga
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
respawnFly();

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
const carGeometry = new THREE.BoxGeometry(2, 0.6 , 0.8);
const carMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const car = new THREE.Mesh(carGeometry, carMaterial);
car.position.set(0, ground.position.y + ground.geometry.parameters.height / 2 + car.geometry.parameters.height / 2, 3);
let carBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());

//teykna bíla frá 1 til 9
const carPositions = [9, 8, 7, 6, 5, 4, 3, 2, 1]; // Lane positions (z-values)
const middleLanes = [3, 4, 5]; // Middle three lanes for cars coming from the right
const cars = [];
let carSpeeds = [];
const maxSpeed = 6;
const minSpeed = 2;
for (let i = 0; i < carPositions.length; i++) {
    carSpeeds.push(Math.random() * (maxSpeed - minSpeed) + minSpeed);
}

for (let i = 0; i < carPositions.length; i++) {
    const car = new THREE.Mesh(carGeometry, carMaterial);
    // Set direction: -1 for right-to-left, 1 for left-to-right
    const direction = middleLanes.includes(i) ? -1 : 1;
    const xPosition = direction === 1 ? -mapWidth - car.geometry.parameters.width / 2 : mapWidth + car.geometry.parameters.width / 2;
    car.position.set(xPosition, ground.position.y + ground.geometry.parameters.height / 2 + car.geometry.parameters.height / 2, carPositions[i]);
    // Adjust the speed for the direction
    carSpeeds[i] *= direction;
    cars.push(car);
    scene.add(car);
}

// Fall til að færa bílana á x-axis
function moveCars(deltaTime) {
    if (isGameOver) {
        return;
    }

    const maxSpeed = 7;
    const minSpeed = 2;
    const minSpeedCap = 5; // Set the minimum speed cap within the function

    for (let i = 0; i < cars.length; i++) {
        const car = cars[i];
        car.position.x += carSpeeds[i] * deltaTime;

        // Remove and respawn cars when they move out of the map bounds
        if (carSpeeds[i] > 0 && car.position.x > mapWidth + car.geometry.parameters.width / 2 ||
            carSpeeds[i] < 0 && car.position.x < -mapWidth - car.geometry.parameters.width / 2) {
            // Move the car to the opposite side
            car.position.x = carSpeeds[i] > 0 ? -mapWidth - car.geometry.parameters.width / 2 : mapWidth + car.geometry.parameters.width / 2;
            
            // Assign a new random speed for the respawned car and ensure it's above the minimum cap
            let newSpeed = Math.max((Math.random() * (maxSpeed - minSpeed) + minSpeed), minSpeedCap);
            carSpeeds[i] = newSpeed * (carSpeeds[i] > 0 ? 1 : -1); // Keep the direction
        }

        // Update the bounding box for the car
        carBB.setFromObject(car);

        // Check for collision only if the frog is alive
        if (isFrogAlive && frogBB.intersectsBox(carBB)) {
            isFrogAlive = false; // Mark the frog as dead
            console.log("Collision detected! Try again");
            gameOver();
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

// Function to move logs along the x-axis
// Generate logs function
function genlog() {
    const logGeometry = new THREE.BoxGeometry(3, 1, 1);
    const logMaterial = new THREE.MeshPhongMaterial({ color: 0x964B00 });
    const lanes = [-1, -2, -3, -4, -5, -6, -7, -8]; // Z positions for each lane
    let logs = [];
    let logSpeeds = [];

    // Function to create a log at the edge of the map
    function spawnLog(laneIndex) {
        const log = new THREE.Mesh(logGeometry, logMaterial);
        const zPosition = lanes[laneIndex];
        const direction = laneIndex % 2 === 0 ? 1 : -1; // Alternate direction per lane
        const xPosition = direction === 1 ? -mapWidth - log.geometry.parameters.width / 2 : mapWidth + log.geometry.parameters.width / 2;
        log.position.set(xPosition, ground.position.y + ground.geometry.parameters.height / 2 + log.geometry.parameters.height / 2 - 0.7, zPosition);

        logs.push(log);
        logSpeeds.push((Math.random() * (maxSpeed - minSpeed) + minSpeed) * direction);
        scene.add(log);
    }

    // Initialize with one log per lane at the correct positions and directions
    for (let i = 0; i < lanes.length; i++) {
        spawnLog(i);
    }

	function moveLogs(deltaTime) {
		if (isGameOver) {
			return;
		}
		isOnLog = false; // Reset at the start of each frame to check if the frog is on a log
	
		for (let i = logs.length - 1; i >= 0; i--) {
			const log = logs[i];
			log.position.x += logSpeeds[i] * deltaTime;
	
			// Remove logs when they move out of the map bounds and respawn them
			if (logSpeeds[i] > 0 && log.position.x > mapWidth + log.geometry.parameters.width / 2 ||
				logSpeeds[i] < 0 && log.position.x < -mapWidth - log.geometry.parameters.width / 2) {
				// Remove the log from the scene
				scene.remove(log);
	
				// Remove the log and its speed from the arrays
				logs.splice(i, 1);
				logSpeeds.splice(i, 1);
	
				// Respawn a new log in the same lane
				const laneIndex = lanes.indexOf(log.position.z); // Get the lane index
				spawnLog(laneIndex);
			} else {
				logBB.setFromObject(log);
				if (frogBB.intersectsBox(logBB)) {
					isOnLog = true;
					let logMovement = logSpeeds[i] * deltaTime;
	
					// Update frog position with the log's movement
					frog.position.x += logMovement;
					frogTargetPosition.x += logMovement;
	
					// Boundary check after the log movement
					if (frog.position.x < -mapWidth) {
						frog.position.x = -mapWidth;
						frogTargetPosition.x = -mapWidth;
					} else if (frog.position.x > mapWidth) {
						frog.position.x = mapWidth;
						frogTargetPosition.x = mapWidth;
					}
				}
			}
		}
	}
    return moveLogs;
}

const moveLogsFunction = genlog();

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
    const offset = new THREE.Vector3(0, 4, 5);
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
    moveLogsFunction(deltaTime);

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

    // Water collision check: If the frog is not on a log and intersects the water, it dies
    if (!isOnLog && frogBB.intersectsBox(waterBB)) {
        isOnWater = true;
        console.log("The frog fell into the water! Game over.");
        gameOver();
    } else {
        isOnWater = false;
    }

    updateCameraPosition();

    if (!flugaEaten && frogBB.intersectsBox(flugaBB)) {
        flugaCounter++;
        flugaEaten = true;
        scene.remove(fluga); // Remove fly from the scene
        console.log("Fly eaten! Score:", flugaCounter);

        // Respawn fly randomly
        setTimeout(() => {
            flugaEaten = false; // Reset eaten status
            respawnFly(); // Respawn fly at a new position
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
    const keyCode = event.which;
    if (isGameOver && (keyCode === 82)) {
        window.location.reload();
        return; // Prevent further execution if the game is over
    }
    if (isGameOver) {
        return;
    }
    if (!isFrogAlive || isMoving) return; // Prevent movement if the frog is dead or already moving

    let newTargetPosition = frogTargetPosition.clone(); // Copy current target position

    if (keyCode === 38 || keyCode === 87) newTargetPosition.z -= xSpeed; // Up
    else if (keyCode === 40 || keyCode === 83) newTargetPosition.z += xSpeed; // Down
    else if (keyCode === 37 || keyCode === 65) newTargetPosition.x -= xSpeed; // Left
    else if (keyCode === 39 || keyCode === 68) newTargetPosition.x += xSpeed; // Right
    else if (keyCode === 32) {
        frog.position.set(0, ground.position.y + ground.geometry.parameters.height / 2 + frog.geometry.parameters.height / 2, 10); // Reset position
        frogTargetPosition.copy(frog.position);
        return;
    }

    // Boundary checks for user-initiated movement
    if (newTargetPosition.x >= -mapWidth && newTargetPosition.x <= mapWidth &&
        newTargetPosition.z >= -mapDepth && newTargetPosition.z <= mapDepth) {
        frogTargetPosition.copy(newTargetPosition); // Update target position if within bounds
        isMoving = true; // Set moving flag
    }
}

const moveSpeed = 15; // Units per second
let frogTargetPosition = frog.position.clone();
let isMoving = false; // Optional flag if you want to prevent mid-movement direction changes

let isGameOver = false;
function gameOver() {
	isGameOver = true;
  gameOverScreen.style.display = "block"; // Sýna Game Over skjáinn
}