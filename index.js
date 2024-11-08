import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls( camera, renderer.domElement );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// Skilgreina ljósgjafa og bæta honum í sviðsnetið
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.2);
const directLight = new THREE.DirectionalLight(0xFFFFFF, 1);
directLight.position.set(-1, 2, 4);
scene.add(ambientLight);
scene.add(directLight)
camera.position.z = 13;
camera.position.y = 9;

// Ground
const groundGeometry = new THREE.BoxGeometry(15, 1, 20);
const groundMaterial = new THREE.MeshPhongMaterial({ color: 0xfff8f2 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.set(0, -ground.geometry.parameters.height / 2, 0); // Center ground around y=0
scene.add(ground);

// Frog
const frogGeometry = new THREE.BoxGeometry(1, 1, 1);
const frogMaterial = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
const frog = new THREE.Mesh(frogGeometry, frogMaterial);
// Position frog on top of ground
frog.position.set(0, ground.position.y + ground.geometry.parameters.height / 2 + frog.geometry.parameters.height / 2, 9);
scene.add(frog);

drawCars();

function drawCars() {
    const carGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.5);
    const carMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const car = new THREE.Mesh(carGeometry, carMaterial);
    // Position car on top of ground
    car.position.set(0.8, ground.position.y + ground.geometry.parameters.height / 2 + car.geometry.parameters.height / 2, 0);
    scene.add(car);
}

// movement - please calibrate these values
var xSpeed = 1;
var ySpeed = 1;


document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var keyCode = event.which;
    // Move forward
    if (keyCode == 38) { // 'W' key
        frog.position.z -= xSpeed;
    } 
    // Move backward
    else if (keyCode == 40) { // 'S' key
        frog.position.z += xSpeed;
    } 
    // Move left
    else if (keyCode == 37) { // 'A' key
        frog.position.x -= xSpeed;
    } 
    // Move right
    else if (keyCode == 39) { // 'D' key
        frog.position.x += xSpeed;
    } 
    // Reset position (spacebar)
    else if (keyCode == 32) { // Space key
        frog.position.set(0, ground.position.y + ground.geometry.parameters.height / 2 + frog.geometry.parameters.height / 2, 9);
    }
};




function animate() {
    requestAnimationFrame( animate );
    controls.update();
    renderer.render( scene, camera );
}