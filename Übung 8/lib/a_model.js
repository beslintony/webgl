var wgl = wgl || {};

wgl.initSphere = function(){
  var sphere_div = 18;
  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;
  var vertices = [],
    indices = [];
  for (j = 0; j <= sphere_div; j++) {
    aj = j * Math.PI / sphere_div;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= sphere_div; i++) {
      ai = i * 2 * Math.PI / sphere_div;
      si = Math.sin(ai);
      ci = Math.cos(ai);
      vertices.push(si * sj); // X
      vertices.push(cj); // Y
      vertices.push(ci * sj); // Z
    }
  }

  for (j = 0; j < sphere_div; j++) {
    for (i = 0; i < sphere_div; i++) {
      p1 = j * (sphere_div + 1) + i;
      p2 = p1 + (sphere_div + 1);
      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);
      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }
  return {
    positions : vertices,
    indices : indices, };
}


wgl.initCube = function(){
  var vertices = new Float32Array([
    1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, // front
    1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, // right
    1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, // up
    -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, // left
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, // down
    1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0 // back
  ]);

  var colors = new Float32Array([
      0.80, 1, 0.80, 0.80, 1, 0.80, 0.80, 1, 0.80, 0.80, 1, 0.80, // front
      0.80, 1, 0.80, 0.80, 1, 0.80, 0.80, 1, 0.80, 0.80, 1, 0.80, // right
      0.80, 1, 0.80, 0.80, 1, 0.80, 0.80, 1, 0.80, 0.80, 1, 0.80, // left
      0.80, 1, 0.80, 0.80, 1, 0.80, 0.80, 1, 0.80, 0.80, 1, 0.80, // up
      0.80, 1, 0.80, 0.80, 1, 0.80, 0.80, 1, 0.80, 0.80, 1, 0.80, // down
      0.80, 1, 0.80, 0.80, 1, 0.80, 0.80, 1, 0.80, 0.80, 1, 0.80 // back
  ]);

  var normals = new Float32Array([
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // left
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // back
  ]);

  var indices = new Uint16Array([
    0, 1, 2, 0, 2, 3, // front
    4, 5, 6, 4, 6, 7, // right
    8, 9, 10, 8, 10, 11, // up
    12, 13, 14, 12, 14, 15, // left
    16, 17, 18, 16, 18, 19, // down
    20, 21, 22, 20, 22, 23 // back
  ]);

  var textcoords = new Float32Array([
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
  ]);

  return {
    positions   : vertices, 
    colors      : colors, 
    normals     : normals, 
    indices     : indices,
    textcoords  : textcoords,
  };
}

wgl.initFloor = function(){
  var vertices = new Float32Array([
    4, -2, 4,
    4, -2, -4,
    -4, -2, -4,
    -4, -2, 4, 
  ]);

  var colors = new Float32Array([
    0.20, 0.60, 0.20, 
    0.10, 0.50, 0.40,
    0.30, 0.30, 0.20,
    0.40, 0.50, 0.10,
  ]);

  var normals = new Float32Array([
    0,1,0,
    0,1,0,
    0,1,0,
    0,1,0,
  ]);

  var indices = new Uint16Array([
    0,1,2,
    0,2,3,
  ]);
  
  var textcoords = new Float32Array([
    0,0,
    0,1,
    1,1,
    1,0,
  ]);

  return{
    positions   : vertices, 
    colors      : colors, 
    normals     : normals,
    indices     : indices,
    textcoords  : textcoords,
  };
}

wgl.initPlane = function(){
  var vertices = new Float32Array([
    -1.0, 1.0,
    1.0, 1.0,
    1.0, -1.0,
    -1.0, 1.0,
    1.0, -1.0,
    -1.0, -1.0,
  ]);

  var textcoords = new Float32Array([
    0, 1,
    1, 1,
    1, 0,
    0, 1,
    1, 0,
    0, 0,
  ]);

  return{
    positions   : vertices, 
    textcoords  : textcoords,
  };
}
