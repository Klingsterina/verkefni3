var canvas;
var gl;

// position of the track
var TRACK_LENGTH = 5; //staðsetning hvar bíll keyrir
var TRACK_PTS = 11; // punktar

var BLUE = vec4(0.0, 0.0, 1.0, 1.0);
var RED = vec4(1.0, 0.0, 1.0, 1.0);
var GRAY = vec4(0.4, 0.4, 0.4, 1.0);
var BROWN = vec4(0.8, 0.3, 0.0, 1,0);

var numCubeVertices  = 36;
var numTrackVertices  = 2*TRACK_PTS;


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

    // Event listener for keyboard
    window.addEventListener("keydown", function(e){

    });
    cars = generateCars(numCars);
    logs = generateLogs(numLogs); // Generate logs    
    render();
}

function generateCars(count) {
    let newCars = [];
    for (let i = 0; i < count; i++) {
        newCars.push({
            x: Math.random() * (trackMax - trackMin) + trackMin, // Random x position within track
            y: Math.random(), // Initialize y at the starting position
            speed: Math.random() * 0.03 * (Math.random() > 0.3 ? 2 : -1) // speed for left/right movement
        });
    }
    return newCars;
}

function generateLogs(count) {
    let newLogs = [];
    for (let i = 0; i < count; i++) {
        newLogs.push({
            x: Math.random() * (waterMax - waterMin) + waterMin, // Random x position within water
            y: TRACK_LENGTH, // Initialize y at the starting position
            speed: Math.random() * 0.04 * (Math.random() > 0.3 ? 1 : -1) // speed for left/right movement
        });
    }
    return newLogs;
}

// draw car as two blue cubes
function drawCar(mv, car) {
    // set color to red (assuming you want to keep RED color)
    gl.uniform4fv(colorLoc, RED);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    var mv1 = mv;

    // lower body of the car
    mv = mult(mv, scalem(3.0, 10.0, 2.0));
    mv = mult(mv, translate(0.0, car.y, 0.5)); // Use car.y for vertical position

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);

    // upper part of the car
    mv1 = mult(mv1, scalem(3.0, 10.0, 2.0));
    mv1 = mult(mv1, translate(-0.2, car.y, 1.5)); // Use car.y for vertical position

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
}

function drawLog(mv, log) {
    // set color to BROWN
    gl.uniform4fv(colorLoc, BROWN);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    // Adjust matrix for each log based on its properties
    mv = mult(mv, scalem(5.0, 20.0, 1.0)); // Adjust log size
    mv = mult(mv, translate(0.0, log.y, 0)); // Apply x and y position
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
}

function drawTrack( mv ) {

    // set color to GRAY
    gl.uniform4fv( colorLoc, GRAY );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    var mv = mv;
    // size of the track
    mv = mult( mv, scalem( 50.0, 200, 0.1 ) );
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
    // size of the track
    mv = mult( mv, scalem( 50.0, 200, 0.1 ) );
    mv = mult( mv, translate( -1.0, 0.0, 0.0 ) );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}
    
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update positions of cars
    cars.forEach(car => {
        car.y += car.speed; // Update car position

        // Wrap around logic for car
        if (car.y > TRACK_LENGTH) {
            car.y = -TRACK_LENGTH; // Wrap around to the bottom
        } else if (car.y < -TRACK_LENGTH) {
            car.y = TRACK_LENGTH; // Wrap around to the top
        }
    });

    // Update positions of logs
    logs.forEach(log => {
        log.y += log.speed; // Update car position

        // Wrap around logic for car
        if (log.y > TRACK_LENGTH) {
            log.y = -TRACK_LENGTH; // Wrap around to the bottom
        } else if (log.y < -TRACK_LENGTH) {
            log.y = TRACK_LENGTH; // Wrap around to the top
        }
    });

    var mv = mat4();
    mv = lookAt(vec3(100.0, 0.0, 100.0 + height), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0));
    drawTrack(mv);
    drawWater(mv);

    // Draw each car
    cars.forEach(car => {
        var carMv = mult(mv, translate(car.x, car.y, 0.0)); // Use car.x for positioning
        drawCar(carMv, car);
    });

    // Draw each log
    logs.forEach(log => {
        var logsMv = mult(mv, translate(log.x, log.y, 0.0)); // Position each log
        drawLog(logsMv, log);
    });

    requestAnimFrame(render);
}
