var canvas;
var gl;

// position of the track
var TRACK_LENGTH = 100; //staðsetning hvar bíll keyrir
// var TRACK_INNER = 20.0; //Þykktin
// var TRACK_OUTER = 55.0; //stærðin
var TRACK_PTS = 11; // punktar

var BLUE = vec4(0.0, 0.0, 1.0, 1.0);
var RED = vec4(1.0, 0.0, 0.0, 1.0);
var GRAY = vec4(0.4, 0.4, 0.4, 1.0);
var BROWN = vec4(0.5, 0.5, 0.5);

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
var numCars = 5;

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


window.onload = function init()
{
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
    
    // createTrack();
    
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
    // cars = generateCars(numCars);
    render();
}


// // create the vertices that form the car track
// function createTrack() {
//     for (var i = 0; i <= TRACK_PTS; i++) {
//         var x = i * (TRACK_LENGTH / TRACK_PTS) - (TRACK_LENGTH / 2); // Centered around the origin
//         var p = vec3(x, 0.0, 0.0); // y and z are 0 for a line along x-axis
//         tVertices.push(p);
//     }
// }

function generateCars(count) {
    let newCars = [];
    for (let i = 0; i < count; i++) {
        newCars.push({
            x: Math.random() * 2 - 1,  // x-staðsetning á bilinu -1 til 1
            y: Math.random() * 0.8 + 0.1, // y-staðsetning á bilinu 0.1 til 0.9 (ofar á skjánum)
            speed: (Math.random() * 0.01 + 0.009) * (Math.random() > 0.3 ? 1 : -1) // hraði, þar sem sumir fara til vinstri
        });
    }
    return newCars;
}


// draw car as two blue cubes
function drawCar( mv ) {

    // set color to blue
    gl.uniform4fv( colorLoc, RED );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    var mv1 = mv;
    // lower body of the car
    mv = mult( mv, scalem( 3.0, 10.0, 2.0 ) );
    mv = mult( mv, translate( 0.0, 0.0, 0.5 ) );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );

    // upper part of the car
    mv1 = mult( mv1, scalem( 3.0, 4.0, 2.0 ) );
    mv1 = mult( mv1, translate( -0.2, 0.0, 1.5 ) );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv1));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
}

function drawLogs( mv ) {

    // set color to blue
    gl.uniform4fv( colorLoc, BROWN );
    
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    // Draw a log
    mv = mult(mv, scalem(5.0, 20.0, 1.0)); // Make logs long and thin
    mv = mult(mv, translate(0.0, 0.0, 1.0)); // Position logs above the water surface

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLES, 0, numCubeVertices );
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
    

function render(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    carYPos += 0.5; // Adjust speed as needed
    if (carYPos > TRACK_LENGTH ) {
        carYPos = -TRACK_LENGTH ; // Wrap around
    }

    logYPos += 0.2; // Adjust speed as needed
    if (logYPos > TRACK_LENGTH ) {
        logYPos = -TRACK_LENGTH ; // Wrap around
    }
    
    
    // drawCar()
    var mv = mat4();
    // Distant and stationary viewpoint
    mv = lookAt(vec3(100.0, 0.0, 100.0 + height), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0));

    // Draw the track at its original position
    drawTrack(mv);

    var waterPos = mv;
    drawWater(waterPos);
    
    // Create a new matrix for the car that includes its position
    var carMv = mult(mv, translate(0.0, carYPos, 0.0));
    
    // Draw the car
    drawCar(carMv);

    // Position logs above the water surface
    var logsMv = mult(mv, translate(-50.0, logYPos, 0.0)); // Adjust z-position to be above the water
    drawLogs(logsMv);
    requestAnimFrame( render );
}
