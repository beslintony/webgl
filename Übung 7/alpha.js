var vsSource = `
attribute vec4 position;
attribute vec4 color;
attribute vec4 normal;

uniform mat4 u_MvpMatrix;
uniform mat4 u_ModelMatrix;    
uniform mat4 u_NormalMatrix;

varying vec3 v_Position;
varying vec4 v_Color;
varying vec3 v_Normal;

void main() {
gl_Position = u_MvpMatrix * position;
v_Position = vec3(u_ModelMatrix * position);
v_Normal = normalize(vec3(u_NormalMatrix * normal));
v_Color = color; 
}
`;

var fsSource = `
precision mediump float;

varying vec3 v_Normal;
varying vec3 v_Position;
varying vec4 v_Color;


void main() {
    vec3 color;
    vec3 normal = normalize(v_Normal);
    vec3 lightDirection = normalize(vec3(0.2, 1.2, 3.0) - v_Position);

    float nDotL = max(dot(normal,lightDirection), 0.0);
    float powNdotH = pow(nDotL, 128.0);

    vec3 diffuse = vec3(0.7) * v_Color.rgb * nDotL;
    vec3 specular = vec3(0.2) * powNdotH;
    vec3 ambient = vec3(0.1) * v_Color.rgb;

    color = ambient + diffuse + specular;
    gl_FragColor = vec4(color, 0.50);
}
`;

function App() {
  this.canvas = document.getElementById(`canvas`);

  this.gl = wgl.wglContext(this.canvas);

  this.program = this.initProgram();
  this.cubeData = wgl.initCube();
  this.buffers = this.initBuffers(this.cubeData);
  this.locations = this.initLocations();
  this.transforms = {};
  this.rotation = 0;
  this.ui = {    
    dragging: false,
    mouse: {
        lastX: -1,
        lastY: -1,
    },
    angle: {
      x: 0,
      y: 0,
    }};
}

App.prototype.initProgram = function () {

  var gl = this.gl;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  //init WebGL Shader program
  var program = wgl.initShaderProgram(gl, vsSource, fsSource);
  gl.useProgram(program);

  return program;
};

App.prototype.initBuffers = function (data) {
  var gl = this.gl;
  //init all buffers
  var positions = wgl.initBuffer(gl, data.positions);
  var colors = wgl.initBuffer(gl, data.colors);
  var normals = wgl.initBuffer(gl, data.normals);
  var indices = wgl.initElBuffer(gl, data.indices);

  return {
    positions,
    colors,
    normals,
    indices
  };
};

App.prototype.initLocations = function () {

  var gl = this.gl;

  var locations = {

    //load all the uniforms locations
    modelMatrix: gl.getUniformLocation(this.program, `u_ModelMatrix`),
    mvpMatrix: gl.getUniformLocation(this.program, `u_MvpMatrix`),
    normalMatrix: gl.getUniformLocation(this.program, `u_NormalMatrix`),

    //load all the attribute locations
    position: gl.getAttribLocation(this.program, `position`),
    color: gl.getAttribLocation(this.program, `color`),
    normal: gl.getAttribLocation(this.program, `normal`),
  }

  return locations;
};

App.prototype.initTransform = function () {

  //init transformation matrices
  var pMatrix = mat4.create();
  var vMatrix = mat4.create();
  this.transforms.modelMatrix = mat4.create();
  this.transforms.mvpMatrix = mat4.create();
  this.transforms.normalMatrix = mat4.create();

  mat4.perspective(pMatrix, glMatrix.toRadian(45), this.canvas.width / this.canvas.height, 0.1, 1000.0);
  mat4.lookAt(vMatrix, [0, 3, 9], [0, 0, 0], [0, 1, 0]);

  mat4.fromRotation(this.transforms.modelMatrix, this.rotation, [1, 0, -1]);

  mat4.rotateX(this.transforms.modelMatrix, this.transforms.modelMatrix, this.ui.angle.x);
  mat4.rotateY(this.transforms.modelMatrix, this.transforms.modelMatrix, this.ui.angle.y);

  mat4.mul(this.transforms.mvpMatrix, pMatrix, vMatrix);
  mat4.mul(this.transforms.mvpMatrix, this.transforms.mvpMatrix, this.transforms.modelMatrix);

  mat4.invert(this.transforms.normalMatrix, this.transforms.modelMatrix);
  mat4.transpose(this.transforms.normalMatrix, this.transforms.normalMatrix);
};

App.prototype.draw = function () {

  var gl = this.gl;

  this.initTransform();
  this.updateAttributesAndUniforms();

  wgl.setScene(this.gl,this.canvas);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.drawElements(gl.TRIANGLES, this.cubeData.indices.length, gl.UNSIGNED_SHORT, 0);
};

var then = 0;
App.prototype.render = function (now) {
  now *= 0.001;
  var deltaTime = now - then;
  then = now;
  wgl.mouseHover(this.canvas,this.ui);
  this.draw();
  this.rotation += deltaTime;
  requestAnimationFrame(this.render.bind(this));
};

App.prototype.updateAttributesAndUniforms = function () {

  var gl = this.gl;

  //positions attributes
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positions);
  gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.position);
  //colors attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.colors);
  gl.vertexAttribPointer(this.locations.color, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.color);
  //normals attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normals);
  gl.vertexAttribPointer(this.locations.normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.normal);
  //indices array
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
  //uniforms
  gl.uniformMatrix4fv(this.locations.modelMatrix, false, this.transforms.modelMatrix);
  gl.uniformMatrix4fv(this.locations.mvpMatrix, false, this.transforms.mvpMatrix);
  gl.uniformMatrix4fv(this.locations.normalMatrix, false, this.transforms.normalMatrix);
};

//main
var app = new App();
app.render(0);
