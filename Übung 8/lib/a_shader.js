var wgl = wgl || {};

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
    gl_FragColor = vec4(color, 1.0);
}
`;