var canvas;
var gl;

// position of the track
var TRACK_LENGTH = 7; //staðsetning hvar bíll keyrir
var TRACK_PTS = 11; // punktar

var BLUE = vec4(0.0, 0.0, 1.0, 1.0);
var RED = vec4(1.0, 0.0, 1.0, 1.0);
var GRAY = vec4(0.4, 0.4, 0.4, 1.0);
var BROWN = vec4(0.8, 0.3, 0.0, 1,0);

var numCubeVertices  = 36;
var numTrackVertices  = 2*TRACK_PTS;

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var zDist = 100.0;
var at = vec3(0.0, 0.0, 0.0);

// variables for moving car
var carDirection = 0.0;
var logYPos = 0.0;
var carYPos = 0.0;
var height = 0.0;

// current viewpoint
var view = 0.0;

var colorLoc;
var mvLoc;
var pLoc;
var proj;

var cubeBuffer;
var trackBuffer;
var vPosition;

var cars = [];
var logs = [];
var numCars = 7;
var numLogs = 10; // Set desired number of logs

var waterMax = -70;
var waterMin= -30;

var trackMax = -20;
var trackMin = 20;

var frogPos = { x: 0, y: 0 }; // Upphafsstaða frosks
var frogAlive = true; // Er froskurinn lifandi?
var fly = { active: true, x: 2, y: 0 }; // Dæmi um fluguhnit

var initialLogPositions = [
    { x: -85, y: TRACK_LENGTH }, // Log 1
    { x: -85, y: TRACK_LENGTH - 3 }, // log 1.5
    { x: -80, y: TRACK_LENGTH }, // Log 2
    { x: -80, y: TRACK_LENGTH -4 }, // Log 2.5
    { x: -75, y: TRACK_LENGTH }, // Log 3
    { x: -75, y: TRACK_LENGTH -3}, // Log 3.5
    { x: -70, y: TRACK_LENGTH }, // Log 4
    { x: -70, y: TRACK_LENGTH - 4}, // Log 4
    { x: -65, y: TRACK_LENGTH }, // Log 5
    { x: -65, y: TRACK_LENGTH -3 }, // Log 5.5
    { x: -60, y: TRACK_LENGTH }, // Log 6
    { x: -60, y: TRACK_LENGTH -4 }, // Log 6.5
    { x: -55, y: TRACK_LENGTH }, // Log 7
    { x: -55, y: TRACK_LENGTH -3}, // Log 7.5
    { x: -50, y: TRACK_LENGTH }, // Log 8
    { x: -50, y: TRACK_LENGTH -4}, // Log 8.5
    { x: -45, y: TRACK_LENGTH }, // Log 9
    { x: -45, y: TRACK_LENGTH -3}, // Log 9.5
    { x: -40, y: TRACK_LENGTH }, // Log 10
    { x: -40, y: TRACK_LENGTH -4}, // Log 10.5
    { x: -35, y: TRACK_LENGTH }, // Log 11
    { x: -35, y: TRACK_LENGTH -3}, // Log 11.5
];

var initialCarPositions = [
    { x: -15, y: TRACK_LENGTH }, // Log 1
    { x: -10, y: TRACK_LENGTH }, // Log 2
    { x: -5, y: TRACK_LENGTH }, // Log 3
    { x: -0, y: TRACK_LENGTH }, // Log 4
    { x: 5, y: TRACK_LENGTH }, // Log 5
    { x: 10, y: TRACK_LENGTH }, // Log 6
    { x: 15, y: TRACK_LENGTH }, // Log 7
    // Add more logs as needed
];


// the 36 vertices of the cube
var cVertices = [
    // front side:
    vec3( -0.5,  0.5,  0.5 ), vec3( -0.5, -0.5,  0.5 ), vec3(  0.5, -0.5,  0.5 ),
    vec3(  0.5, -0.5,  0.5 ), vec3(  0.5,  0.5,  0.5 ), vec3( -0.5,  0.5,  0.5 ),
    // right side:
    vec3(  0.5,  0.5,  0.5 ), vec3(  0.5, -0.5,  0.5 ), vec3(  0.5, -0.5, -0.5 ),
    vec3(  0.5, -0.5, -0.5 ), vec3(  0.5,  0.5, -0.5 ), vec3(  0.5,  0.5,  0.5 ),
    // bottom side:
    vec3(  0.5, -0.5,  0.5 ), vec3( -0.5, -0.5,  0.5 ), vec3( -0.5, -0.5, -0.5 ),
    vec3( -0.5, -0.5, -0.5 ), vec3(  0.5, -0.5, -0.5 ), vec3(  0.5, -0.5,  0.5 ),
    // top side:
    vec3(  0.5,  0.5, -0.5 ), vec3( -0.5,  0.5, -0.5 ), vec3( -0.5,  0.5,  0.5 ),
    vec3( -0.5,  0.5,  0.5 ), vec3(  0.5,  0.5,  0.5 ), vec3(  0.5,  0.5, -0.5 ),
    // back side:
    vec3( -0.5, -0.5, -0.5 ), vec3( -0.5,  0.5, -0.5 ), vec3(  0.5,  0.5, -0.5 ),
    vec3(  0.5,  0.5, -0.5 ), vec3(  0.5, -0.5, -0.5 ), vec3( -0.5, -0.5, -0.5 ),
    // left side:
    vec3( -0.5,  0.5, -0.5 ), vec3( -0.5, -0.5, -0.5 ), vec3( -0.5, -0.5,  0.5 ),
    vec3( -0.5, -0.5,  0.5 ), vec3( -0.5,  0.5,  0.5 ), vec3( -0.5,  0.5, -0.5 )
];

// vertices of the track
var tVertices = [];

window.onload = function init(){
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.7, 1.0, 0.7, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
        
    // VBO for the track
    trackBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, trackBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tVertices), gl.STATIC_DRAW);

    // VBO for the cube
    cubeBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cVertices), gl.STATIC_DRAW );


    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    colorLoc = gl.getUniformLocation( program, "fColor" );
    
    mvLoc = gl.getUniformLocation( program, "modelview" );

    // set projection
    pLoc = gl.getUniformLocation( program, "projection" );
    proj = perspective( 50.0, 1.0, 1.0, 500.0 );
    gl.uniformMatrix4fv(pLoc, false, flatten(proj));

    document.getElementById("Viewpoint").innerHTML = "1: Fjarlægt sjónarhorn";
    document.getElementById("Height").innerHTML = "Viðbótarhæð: "+ height;

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.clientX;
        origY = e.clientY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e) {
        if (movement) {
            const rotationSpeed = 0.1; // Adjust this value to control rotation speed (lower is slower)
            spinX = (spinX + (e.clientX - origX) * rotationSpeed) % 360;
            spinY = (spinY + (origY - e.clientY) * rotationSpeed) % 360;
            origY = e.clientY;
            origX = e.clientX;
        }
    });
    // ÞETTA ER CHATGPT BUT IT WORKS
    cars = initialCarPositions.map(pos => ({ ...pos, speed: Math.random() * 0.5 * (Math.random() > 0.5 ? 1 : -1) })); // Add speed for logs
    logs = initialLogPositions.map((pos, index) => {
        // Set speed based on the index: every even index will have a different speed
        const speedFactor = index % 2 === 0 ? 0.03 : 0.02; // Hraði fyrir odda/ slétta loga
        return { 
            ...pos, 
            speed: Math.random() * speedFactor * (Math.random() > 0.5 ? 1 : -1) 
        }; 
    });
    // cars = generateCars(numCars);
    // logs = initialLogPositions.map(pos => ({ ...pos, speed: Math.random()* 0.01 * (Math.random() > 0.5 ? 1 : -1) })); // Add speed for logs
    // logs = generateLogs(numLogs); // Generate logs    
    render();
}

// Óþarfi eins og er EKKI HENDA!!
// function generateCars(count) {
//     let newCars = [];
//     for (let i = 0; i < count; i++) {
//         newCars.push({
//             x: Math.random() * (trackMax - trackMin) + trackMin, // Random x position within track
//             y: Math.random() // Initialize y at the starting position
//         });
//     }
//     return newCars;
// }

// Óþarfi eins og er EKKI HENDA
// function generateLogs(count) {
//     let newLogs = [];
//     for (let i = 0; i < count; i++) {
//         newLogs.push({
//             x: Math.random() * (waterMax - waterMin) + waterMin, // Random x position within water
//             y: TRACK_LENGTH // Byrjunarstaða
//         });
//     }
//     return newLogs;
// }


// Teikna bílinn
function drawCar(mv, car) {
    gl.uniform4fv(colorLoc, RED);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    var mv1 = mv;

    // lower body of the car
    mv = mult(mv, scalem(3.0, 10.0, 4.0));
    mv = mult(mv, translate(0.0, car.y, 0.5));

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);

    //ÉG fæ ekki þetta til að láta virka!!!!!!!!!!!!
    // // // upper part of the car
    // mv1 = mult(mv1, scalem(3.0, 4.0, 2.0));
    // mv1 = mult(mv1, translate(-0.2, car.y, 1.5)); // Use car.y for vertical positi
    // gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
    // gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
}

function drawFrog(mv, frogPos) {
    gl.uniform4fv(colorLoc, vec4(0.0, 1.0, 0.0, 1.0)); // Frog color

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    mv = mult(mv, scalem(2.0, 2.0, 2.0)); 
    mv = mult(mv, translate(0.0, 0.0, 1.0));
    mv = mult(mv, translate(frogPos.x, frogPos.y, 0.0));

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
}


function drawLog(mv, log) {
    // set color to BROWN
    gl.uniform4fv(colorLoc, BROWN);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    // Teikna log
    mv = mult(mv, scalem(4.0, 25.0, 2.0)); 
    mv = mult(mv, translate(0.0, log.y, 0));
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
}

function drawTrack( mv ) {

    // set color to GRAY
    gl.uniform4fv( colorLoc, GRAY );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    var mv = mv;
    // Stærðin af götunni
    mv = mult( mv, scalem( 40.0, 200, 0.1 ) );
    mv = mult( mv, translate( 0.0, 0.0, 0.0 ) );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}

function drawWater( mv ) {

    // set color to GRAY
    gl.uniform4fv( colorLoc, BLUE );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    var mv = mv;
    // Stærðin af vatninu
    mv = mult( mv, scalem( 60.0, 200, 0.1 ) );
    mv = mult( mv, translate( -1.0, 0.0, 0.0 ) );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}

    function newGame() {
        frogPos = { x: 15, y: 0 };
    }

function checkForCollision() {
    // Athuga árakstur við bíla
    for (let car of cars) {
        if (Math.abs(frogPos.x - car.x) < 2.5 && Math.abs(frogPos.y - car.y) < 0.5) { // Adjusted thresholds
            frogAlive = false; // Set frog as not alive
            console.log("Frog hit by car! Game Over!");
            newGame();
            return; // Fara úr fallinu ef froskurinn er dauður
        }
    }

    // Athuga hvort froskurinn sé á log
    let onLog = false; 
    for (let log of logs) {
        // Adjusted thresholds for logs
        if (Math.abs(frogPos.x - log.x) < 4.0 && Math.abs(frogPos.y - log.y) < 1.0) {
            onLog = true; // Froskurinn er á log
            break;
        }
    }

    // Athuga ef froskurinn er undir vatni
    if (frogPos.y < waterMax && frogPos.y > waterMin) {
        frogAlive = false; //froskurinn deyr
        console.log("Frog drowned! Game Over!");
    } else if (onLog) {
        console.log("Frog is safe on the log!");
    } else {
        // console.log("Frog is alive but not on a log.");
    }
}



    
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update positions of cars
    cars.forEach(car => {
        car.y += car.speed; // Update log position

        // Ef bílarnir fara útfyrir Track þá byrtast hinumeginn
        if (car.y > TRACK_LENGTH) {
            car.y = -TRACK_LENGTH;
        } else if (car.y < -TRACK_LENGTH) {
            car.y = TRACK_LENGTH; 
        }
    });

    // Update positions of logs
    logs.forEach(log => {
        log.y += log.speed; // Update log position

        // Ef logs fara útfyrir Track þá byrtast hinumeginn
        if (log.y > TRACK_LENGTH) {
            log.y = -TRACK_LENGTH; 
        } else if (log.y < -TRACK_LENGTH) {
            log.y = TRACK_LENGTH;
        }
    });

    checkForCollision();

    var up = vec3(0.0, 0.0, 1.0);
    var mv = mat4();
    //mv = lookAt(vec3(80.0, 0.0, 100.0 + height), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0));
    mv = lookAt( vec3(80.0, 0.0, 100 + height), at, up );
    mv = mult( mv, rotateY( spinY ) );
    mv = mult( mv, rotateX( spinX ) );
    drawTrack(mv);
    drawWater(mv);
    drawFrog(mv, frogPos);

    // Teikna hvern bíl
    cars.forEach(car => {
        var carMv = mult(mv, translate(car.x, car.y, 0.0)); // Use car.x for positioning
        drawCar(carMv, car);
    });

    // Teikna hvert log
    logs.forEach(log => {
        var logsMv = mult(mv, translate(log.x, log.y, 0.0)); // Position each log
        drawLog(logsMv, log);
    });

    requestAnimFrame(render);
}


// GEYMA
// Check collision with the fly
// if (fly.active && Math.abs(frogPos.x - fly.x) < 0.5 && Math.abs(frogPos.y - fly.y) < 0.5) {
//     // Frog has eaten the fly
//     fly.active = false; // Set fly to inactive
//     // You can implement score increment or other effects here
//     console.log("Fly eaten!");
// }

//ÉG notaði sumt úr verkefni 1 þannig þetta er smá spagettíkóðað
