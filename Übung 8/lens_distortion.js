var vsSource = `
attribute vec2 position;
attribute vec2 uv;

varying vec2 v_UV;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  v_UV = uv; 
}
`;

var fsSource = `
precision mediump float;

varying vec3 v_Position;
varying vec2 v_UV;

uniform sampler2D sampler;

uniform float effect;
uniform float scale;


void main() {
  vec2 uv = v_UV.xy*2.0 - vec2(1.0);
 
  float d = length(uv)*.1; // capture within frame and zoom :)
  float z = sqrt(1.0 + d * d * -effect);
  float r = atan(d, z)/3.14;
  r *= scale;
  float phi = atan(uv.y, uv.x);
  uv = vec2(r*cos(phi)+.5,r*sin(phi)+.5);
  //when out of canvas, clip it
  if (uv.x > 1.0 || uv.x < 0.0 || uv.y > 1.0 || uv.y < 0.0 ) 
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // white to match bkg
  else if (uv.x < 1.0 || uv.x > 0.0 || uv.y < 1.0 || uv.y > 0.0 )
  gl_FragColor = texture2D(sampler,uv); //usual sampler with distorted texture
}
`;

function App() {
  this.canvas = document.getElementById(`canvas`);

  this.gl = wgl.wglContext(this.canvas);

  this.program = this.initProgram();
  this.planeData = wgl.initPlane();
  this.buffers = this.initBuffers(this.planeData);
  this.locations = this.initLocations();
  this.distortion = {};

  this.imageSRC ={
    image1 : `./image/6.png`,
    image2 : `./image/2.png`,
    image3 : `./image/3.png`,
    image4 : `./image/4.png`,
    image5 : `./image/5.png`,
    image6 : `./image/1.png`,
    image7 : `./image/7.png`,
    image8 : `./image/8.png`,
  };

  this.planeTexture = wgl.initTexture(this.gl,this.imageSRC.image1);

  this.distortion.barrel = 1.6;
  this.distortion.pincushion = -1.1;
  this.distortion.effect = this.distortion.pincushion;
  this.distortion.scale = 3.0;

  this.draw();
  this.datGui();
  this.render();
}

App.prototype.initProgram = function () {

  var gl = this.gl;

  //init WebGL Shader program
  var program = wgl.initShaderProgram(gl, vsSource, fsSource);
  gl.useProgram(program);

  return program;
};

App.prototype.initBuffers = function (data) {
  var gl = this.gl;
  //init all buffers
  var positions = wgl.initBuffer(gl, data.positions);
  var textcoords = wgl.initBuffer(gl, data.textcoords);

  return {
    positions,
    textcoords,
  };
};

App.prototype.initLocations = function () {

  var gl = this.gl;

  var locations = {
    //load all the uniforms locations
    sampler: gl.getUniformLocation(this.program,`sampler`),
    effect: gl.getUniformLocation(this.program,`effect`),
    scale: gl.getUniformLocation(this.program,`scale`),

    //load all the attribute locations
    position: gl.getAttribLocation(this.program, `position`),
    textcoords: gl.getAttribLocation(this.program, `uv`),
  }

  return locations;
};


App.prototype.draw = function () {

  var gl = this.gl;
  wgl.setScene(this.gl,this.canvas);
  this.updateAttributesAndUniforms();

  if (this.planeTexture.texture) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.planeTexture.texture);
  }
  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

App.prototype.render = function () {
  this.draw();
  requestAnimationFrame(this.render.bind(this));
};

App.prototype.updateAttributesAndUniforms = function () {

  var gl = this.gl;

  //positions attributes
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positions);
  gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.position);
  //texture attribute
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.textcoords);
  gl.vertexAttribPointer(this.locations.textcoords, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(this.locations.textcoords);

  gl.uniform1i(this.locations.sampler,0);

  gl.uniform1f(this.locations.effect, Number(this.distortion.effect));
  gl.uniform1f(this.locations.scale, Number(this.distortion.scale));
};

App.prototype.changeImage = function(v){
  this.planeTexture = wgl.initTexture(this.gl, v);
};

App.prototype.datGui = function() {
 
  var gui = new dat.GUI({});

  var canvas = gui.addFolder('Canvas');
  canvas.add(this.canvas,'width');
  canvas.add(this.canvas,'height');

  var barrelDistort = gui.addFolder('Barrel Distortion');
  barrelDistort.open();
  barrelDistort.add(this.distortion, "effect",1.0,40.0).name(`Barrel Strength`);
  barrelDistort.add(this.distortion, 'scale',0.01,20.0).name(`Scale`);

  var pinDistort = gui.addFolder('Pincushion Distortion');
  pinDistort.open();
  pinDistort.add(this.distortion, "effect",-40.0,-0.1).name(`Pincushion Strength`);
  pinDistort.add(this.distortion, 'scale',0.01,20.0).name(`Scale`);

  var img = gui.add(this.imageSRC, 'image1',{'Image1': this.imageSRC.image1,'Image2': this.imageSRC.image2, 
  'Image3': this.imageSRC.image3, 'Image4': this.imageSRC.image4, 'Image5': this.imageSRC.image5,
  'Image6': this.imageSRC.image6, 'Image7': this.imageSRC.image7, 'Image8': this.imageSRC.image8,});
  img.name('Image');
  img.listen();
  img.onFinishChange(v=>this.changeImage(v));
};

var app = new App();
app.render();
