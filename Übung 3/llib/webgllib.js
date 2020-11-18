function Webgllib(){
    Webgllib.prototype = {};
    Webgllib.prototype.constructor = Webgllib;
    }

    Webgllib.getCanvas = function(){
        if(!canvas){
            throw new Error ('Canvas element not found!')
        }   
        return document.querySelector(canvas);
    }

    Webgllib.setCanvas = function(){
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clearDepth(1.0);
    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    Webgllib.getContext = function(){
        if(!Webgllib.gl){
            throw new Error ('WebGL not supported');
        }
        const canvas = document.querySelector('canvas');
        const gl = canvas.getContext('webgl');
        Object.gl = gl;
        return Object.gl;
    }

    Webgllib.initBuffer= function(vertices){
        const vertex_buffer = gl.createBuffer ();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        return {
            vertex: vertex_buffer,
            length: vertices.length,
        };
    }

    Webgllib.initShaderProgram = function(vsSource, fsSource) {
        if(!(vsSource && fsSource)){
            throw new Error('Vs Source or fsSource Missing!');
        }
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
        const shaderProgram = gl.createProgram();

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
       
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return;
        }
    
        gl.useProgram(shaderProgram);
        gl.program = shaderProgram;
    
        return shaderProgram;
    }
    Webgllib.loadShader = function(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return;
        }
        return shader;
      }

      Webgllib.enableAttrib = function(vsSource,fsSource){
        const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
        const positionLocation = gl.getAttribLocation(shaderProgram, `position`);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        //checking and getting user color from and to fragment shader
        const fragColor = gl.getUniformLocation(shaderProgram, `fragColor`);
            if (!fragColor) {
                console.log('Failed to get the storage location of fragColor');
                return;
            }
        gl.uniform4fv(fragColor, color);
      }
export default Webgllib;