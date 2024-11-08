import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
water.position.set(0, -(water.geometry.parameters.height / 2)+0.01, -4.5);
scene.add(water);

// Frog
const frogGeometry = new THREE.BoxGeometry(1, 1, 1);
const frogMaterial = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
const frog = new THREE.Mesh(frogGeometry, frogMaterial);
let isFrogAlive = true;
frog.position.set(0, ground.position.y + ground.geometry.parameters.height / 2 + frog.geometry.parameters.height / 2, 10);

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
function moveCars(deltaTime) {
    const mapwidth = 6
    for (let i = 0; i < cars.length; i++) {
        const car = cars[i];
        car.position.x += carSpeeds[i] * deltaTime;

        // láta bílana snúa við ef þeir fara út í enda
        if (car.position.x <= -mapwidth) {
            car.position.x = -mapwidth;
            carSpeeds[i] *= -1;
        }

        if (car.position.x >= mapwidth) {
            car.position.x = mapwidth;
            carSpeeds[i] *= -1;
        }

        // Láta froskinn fara aftur á byrjunarreit ef hann klessir á
        for (let i = 0; i < cars.length; i++) {
            const car = cars[i];
            carBB.setFromObject(car);
            if (isFrogAlive && frogBB.intersectsBox(carBB)) {
                frog.position.set(0, ground.position.y + ground.geometry.parameters.height / 2 + frog.geometry.parameters.height / 2, 10);
                console.log("Collision detected! Try again");
            }
        }

    }
}

// Animate function
let lastFrameTime = 0;
function animate(currentTime) {
    const deltaTime = (currentTime - lastFrameTime) / 1000; // seconds
    lastFrameTime = currentTime;

    frogBB.copy(frog.geometry.boundingBox).applyMatrix4(frog.matrixWorld);
    moveCars(deltaTime);
    
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