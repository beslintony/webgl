var wgl = wgl || {};

wgl.wglContext = function (canvas) {
  var gl = canvas.getContext("webgl");
  if (!gl) {
    throw new Error('WebGL not supported');
  }
  return gl;
}

wgl.setScene = function (gl,canvas) {
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.viewport(0.0, 0.0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

wgl.initBuffer = function (gl, positions) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  return buffer;
}

wgl.initElBuffer = function (gl, indices) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  return buffer;
}

wgl.initTexture = function (gl, url) {
  var texture = gl.createTexture();
  if (!texture) {
    return false;
  }
  var image = new Image(); // new image obj
  if (!image) {
    return false;
  }
  image.texture_on = false;
  image.src = url;
  image.texture_on = texture;
  //load the image texture
  image.onload = e => {
    wgl.loadTexture(gl, texture, image);
  };
  return image;
}

wgl.loadTexture = function (gl, texture, image) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  //gl.activeTexture(gl.TEXTURE0);
  //gl.bindTexture(gl.TEXTURE_2D, texture);
  // set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)

  // Set the texture parameters
  if (wgl.isPowerOf2(image.width) && wgl.isPowerOf2(image.height)) {
    // power of 2, Generate mipmap

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

  } else {
    // not a power of 2, clamp to edge
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  image.texture_on = texture;
}

wgl.isPowerOf2 = function (value) {
  return (value & (value - 1)) === 0;
}

wgl.renderTexture = function (gl, width, height) {
  var frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

  var renderBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER, renderBuffer);

  var rttTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, rttTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height,
    0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D, rttTexture, 0);

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return {
    frameBuffer,
    renderBuffer,
    rttTexture,
  };
}

wgl.initShaderProgram = function (gl, vsSource, fsSource) {
  //initialing shader program 
  var vertexShader = wgl.loadShader(gl, gl.VERTEX_SHADER, vsSource);
  var fragmentShader = wgl.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  // Create the shader program
  var shaderProgram = gl.createProgram();
  // attaching the shaders and linking 
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  //checking the link status of the program
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return;
  }
  gl.useProgram(shaderProgram);
  gl.program = shaderProgram;

  return shaderProgram;
}

wgl.loadShader = function (gl, type, source) {
  //creating  and compiling shader
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  //checking the compile status
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader); //deleting the shader
    return;
  }
  return shader;
}

wgl.mouseHover = function(canvas, ui) {
  canvas.addEventListener('mousedown', (event) => {
      let x = event.clientX;
      let y = event.clientY;
      let rect = event.target.getBoundingClientRect();
      if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
          ui.mouse.lastX = x;
          ui.mouse.lastY = y;
          ui.dragging = true;
      }
  }, false);
  canvas.addEventListener('mouseup', (event) => {
      ui.dragging = false;
  }, false);
  canvas.addEventListener('mousemove', (event) => {
      let x = event.clientX;
      let y = event.clientY;
      if (ui.dragging) {
          // rotationfactor
          let factor = 5 / canvas.height;
          let dx = factor * (x - ui.mouse.lastX);
          let dy = factor * (y - ui.mouse.lastY);
          // update the angle
          ui.angle.x = ui.angle.x + dy;
          ui.angle.y = ui.angle.y + dx;
      }
      // update mouse position
      ui.mouse.lastX = x;
      ui.mouse.lastY = y;
  }, false);

}
