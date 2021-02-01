var vsShadowMap =`
  attribute vec4 position;
  uniform mat4 u_MvpMatrix;

  void main(void) {
    gl_Position = u_MvpMatrix * position;;
  }
`;

var fsShadowMap =`
  precision mediump float;

  void main(void) {
    gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);
  }
`;

var vsSource = `
attribute vec4 position;
attribute vec4 color;
attribute vec4 normal;

uniform mat4 u_MvpMatrix;
uniform mat4 u_ModelMatrix;    
uniform mat4 u_NormalMatrix;
uniform mat4 u_MvpMatrixFromLight;

varying vec4 v_PositionFromLight;
varying vec4 v_Color;
varying vec3 v_Normal;

void main() {
  gl_Position = u_MvpMatrix * position;
  v_PositionFromLight = u_MvpMatrixFromLight * position;
  v_Normal = normalize(vec3(u_NormalMatrix * normal));
  v_Color = color; 
}
`;

var fsSource = `
precision mediump float;

uniform sampler2D u_ShadowMap;

varying vec3 v_Normal;
varying vec4 v_PositionFromLight;
varying vec4 v_Color;


void main() {

  vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;
  vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);
  float depth = rgbaDepth.r; // Retrieve the z-value from R
  float visibility = (shadowCoord.z > depth + 0.005) ? 0.7 : 1.0;
  gl_FragColor = vec4(v_Color.rgb * visibility, v_Color.a);
}
`;

function App() {


  this.canvas = document.getElementById(`canvas`);

  this.gl = wgl.wglContext(this.canvas);

  this.shadowProgram = this.initProgram(vsShadowMap, fsShadowMap);
  this.program = this.initProgram(vsSource, fsSource);
  
  this.cubeData = wgl.initCube();
  this.floorData = wgl.initFloor();
  
  this.cubeBuffers = this.initBuffers(this.cubeData);
  this.floorBuffers = this.initBuffers(this.floorData);
  
  this.locations = this.initLocations();
  this.transforms = {};
  
  this.fbo = this.initfbo();
  
  this.lightdir = [0.0, 7.8, -1.9]; //[0.58,0.58,-0.58];
  
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
    this.rotation = 0;

}

App.prototype.initProgram = function (vs, fs) {

  var gl = this.gl;
  //init WebGL Shader program
  var program = wgl.initShaderProgram(gl, vs, fs);
  gl.useProgram(program);

  return program;
};

App.prototype.initBuffers = function (data) {
  var gl = this.gl;
  //init all buffers
  var positions = wgl.initBuffer(gl, data.positions);
  var colors = wgl.initBuffer(gl, data.colors);
  var normals = wgl.initBuffer(gl, data.normals);
  var indices = wgl.initElBuffer(gl, data.indices)

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
    
    positionShadow: gl.getAttribLocation(this.shadowProgram, `position`),
    mvpShadowMatrix: gl.getUniformLocation(this.shadowProgram, `u_MvpMatrix`),

    modelMatrix: gl.getUniformLocation(this.program, `u_ModelMatrix`),
    mvpMatrix: gl.getUniformLocation(this.program, `u_MvpMatrix`),
    normalMatrix: gl.getUniformLocation(this.program, `u_NormalMatrix`),
    mvpMatrix: gl.getUniformLocation(this.program, `u_MvpMatrix`),
    lightMatrix: gl.getUniformLocation(this.program, `u_MvpMatrixFromLight`),
    shadowMap: gl.getUniformLocation(this.program, `u_ShadowMap`),

    position: gl.getAttribLocation(this.program, `position`),
    color: gl.getAttribLocation(this.program, `color`),
    normal: gl.getAttribLocation(this.program, `normal`),

  }

  return locations;
};


App.prototype.initfbo = function () {

  var gl = this.gl;
  this.width = 512;
  this.height = 512;

  renderTex = wgl.renderTexture(gl, this.width, this.height);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, renderTex.rttTexture);
  
  // Set the clear color and enable the depth test
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  return renderTex;
};

App.prototype.initTransform = function () {

  //init transformation matrices
  var pMatrix = mat4.create();
  var vMatrix = mat4.create();
  this.transforms.pLightMatrix = mat4.create();
  this.transforms.vLightMatrix = mat4.create();
  this.transforms.mvpLightMatrix = mat4.create();
  this.transforms.modelMatrix = mat4.create();
  this.transforms.mvpMatrix = mat4.create();
  this.transforms.normalMatrix = mat4.create();

  mat4.perspective(this.transforms.pLightMatrix, glMatrix.toRadian(60), this.width / this.height, 0.1, 1000.0);
  mat4.lookAt(this.transforms.vLightMatrix, this.lightdir, [0, 0, 0], [0, 1, 0]);

  mat4.mul(this.transforms.mvpLightMatrix, this.transforms.pLightMatrix, this.transforms.vLightMatrix); //NOTE neeed to check

  mat4.perspective(pMatrix, glMatrix.toRadian(45), this.canvas.width / this.canvas.height, 0.1, 1000.0);
  mat4.lookAt(vMatrix, [0, 10, 12], [0, 0, 0], [0, 1, 0]);


  mat4.fromRotation(this.transforms.modelMatrix, this.rotation, [0, 1, 0]);

  mat4.rotateX(this.transforms.modelMatrix, this.transforms.modelMatrix, this.ui.angle.x);
  mat4.rotateY(this.transforms.modelMatrix, this.transforms.modelMatrix, this.ui.angle.y);

  mat4.mul(this.transforms.mvpMatrix, pMatrix, vMatrix);
  mat4.mul(this.transforms.mvpMatrix, this.transforms.mvpMatrix, this.transforms.modelMatrix);

  mat4.invert(this.transforms.normalMatrix, this.transforms.modelMatrix);
  mat4.transpose(this.transforms.normalMatrix, this.transforms.normalMatrix);
};

App.prototype.fboRender = function(){

  var gl = this.gl;
  
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo.frameBuffer);

  gl.viewport(0.0, 0.0, this.width,this.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(this.shadowProgram); // Set shaders for generating a shadow map

  //this.drawCube();
  //this.drawFloor();  
  
  //positions attributes
  gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeBuffers.positions);
  gl.vertexAttribPointer(this.locations.positionShadow, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.positionShadow);
  
  //textcoords attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeBuffers.colors);
  gl.vertexAttribPointer(this.locations.color, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.color);

  //normals attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeBuffers.normals);
  gl.vertexAttribPointer(this.locations.normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.normal);
  
  //indices array
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.cubeBuffers.indices);

  gl.uniformMatrix4fv(this.locations.mvpShadowMatrix, false, this.transforms.mvpLightMatrix);
  
  gl.drawElements(gl.TRIANGLES, this.cubeData.indices.length, gl.UNSIGNED_SHORT, 0);
  

  //positions attributes
  gl.bindBuffer(gl.ARRAY_BUFFER, this.floorBuffers.positions);
  gl.vertexAttribPointer(this.locations.positionShadow, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.positionShadow);
  
  //textcoords attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, this.floorBuffers.colors);
  gl.vertexAttribPointer(this.locations.color, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.color);

  //normals attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, this.floorBuffers.normals);
  gl.vertexAttribPointer(this.locations.normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.normal);

  gl.uniformMatrix4fv(this.locations.mvpShadowMatrix, false, this.transforms.mvpLightMatrix);

  gl.drawElements(gl.TRIANGLES, this.floorData.indices.length, gl.UNSIGNED_SHORT, 0);
  gl.disableVertexAttribArray(this.locations.positionShadow);
  
  /*
  //DRAW THE cube
  gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeBuffers.positions);
  gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0) ;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.cubeBuffers.indices);
  gl.drawElements(gl.TRIANGLES, this.cubeData.indices.length, gl.UNSIGNED_SHORT, 0);

  //DRAW THE FLOOR
  gl.bindBuffer(gl.ARRAY_BUFFER, this.floorBuffers.positions);
  gl.vertexAttribPointer(this.locations.positionShadow, 3, gl.FLOAT, false, 0, 0) ;

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.floorBuffers.indices);
  gl.drawElements(gl.TRIANGLES, this.floorData.indices.length, gl.UNSIGNED_SHORT, 0);
  gl.disableVertexAttribArray(this.locations.positionShadow);
*/

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);               // Change the drawing destination to color buffer
  gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    // Clear color and depth buffer

  gl.useProgram(this.program);
  this.updateUniforms();
  this.drawCube();
  this.updateUniforms();
  this.drawFloor();
};


App.prototype.drawCube = function () {

  var gl = this.gl;  
  this.updateCubeAttributes();
  gl.drawElements(gl.TRIANGLES, this.cubeData.indices.length, gl.UNSIGNED_SHORT, 0);

};

App.prototype.drawFloor = function () {

  var gl = this.gl;
  this.updateFloorAttributes();
  gl.drawElements(gl.TRIANGLES, this.floorData.indices.length, gl.UNSIGNED_SHORT, 0);
};

App.prototype.draw = function () {

  var gl = this.gl;

  this.initTransform();

  wgl.setScene(this.gl);
  gl.drawElements(gl.TRIANGLES, this.cubeData.indices.length, gl.UNSIGNED_SHORT, 0);
};

var then = 0;
App.prototype.render = function (now) {
  var gl = this.gl;

  now *= 0.001;
  var deltaTime = now - then;
  then = now;
  this.initTransform();
  this.fboRender();
  this.disableAttribArrays();
  wgl.mouseHover(this.canvas,this.ui);
  this.rotation += deltaTime;
  requestAnimationFrame(this.render.bind(this));
};

App.prototype.updateUniforms = function () {
  
  var gl = this.gl;
  
  //uniforms
  gl.uniformMatrix4fv(this.locations.modelMatrix, false, this.transforms.modelMatrix);
  gl.uniformMatrix4fv(this.locations.mvpMatrix, false, this.transforms.mvpMatrix);
  gl.uniformMatrix4fv(this.locations.normalMatrix, false, this.transforms.normalMatrix);
  gl.uniformMatrix4fv(this.locations.lightMatrix, false, this.transforms.mvpLightMatrix);
  //sampler for texture
  gl.uniform1i(this.locations.shadowMap, 0);//NOTE with the new source
  //gl.uniform1i(this.locations.shadowSampler, 1);//NOTE with the new source
  //lightdirection update
  //gl.uniform3fv(this.locations.lightDirection, this.lightdir);
};

App.prototype.updateCubeAttributes = function () {

  var gl = this.gl;

  //positions attributes
  gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeBuffers.positions);
  gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.position);
  
  //textcoords attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeBuffers.colors);
  gl.vertexAttribPointer(this.locations.color, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.color);

  //normals attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeBuffers.normals);
  gl.vertexAttribPointer(this.locations.normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.normal);
  
  //indices array
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.cubeBuffers.indices);

};

App.prototype.updateFloorAttributes = function () {

  var gl = this.gl;

  //positions attributes
  gl.bindBuffer(gl.ARRAY_BUFFER, this.floorBuffers.positions);
  gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.position);
  
  //textcoords attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, this.floorBuffers.colors);
  gl.vertexAttribPointer(this.locations.color, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.color);

  //normals attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, this.floorBuffers.normals);
  gl.vertexAttribPointer(this.locations.normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.normal);
  
  //indices array
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.floorBuffers.indices);
  
  //sampler for texture
  //gl.uniform1i(this.locations.sampler, 0);//NOTE with the new source
  
};
App.prototype.disableAttribArrays = function(){

  var gl = this.gl;
    
  gl.disableVertexAttribArray(this.locations.position);
  gl.disableVertexAttribArray(this.locations.color);
  gl.disableVertexAttribArray(this.locations.normal);
};


//main
var app = new App();
app.render(0);