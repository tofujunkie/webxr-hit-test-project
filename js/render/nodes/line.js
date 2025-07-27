import {Node} from '../core/node.js';
import {mat4} from '../math/gl-matrix.js';

export class LineNode extends Node {
  constructor(start, end, color = [1.0, 0.0, 0.0, 1.0]) {
    super();
    this.start = start;
    this.end = end;
    this.color = color;
    this._initGLResources();
  }

  _initGLResources() {
    const gl = this.gl = this.renderer.gl;

    this.vertexBuffer = gl.createBuffer();
    this.updateVertices();

    this.shaderProgram = this._createShaderProgram(gl);
    this.positionLocation = gl.getAttribLocation(this.shaderProgram, 'a_position');
    this.colorLocation = gl.getUniformLocation(this.shaderProgram, 'u_color');
    this.mvpLocation = gl.getUniformLocation(this.shaderProgram, 'u_mvp');
  }

  updateVertices() {
    const gl = this.gl;
    if (!gl) return;

    const vertices = new Float32Array([
      this.start[0], this.start[1], this.start[2],
      this.end[0], this.end[1], this.end[2]
    ]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  setPoints(start, end) {
    this.start = start;
    this.end = end;
    this.updateVertices();
  }

  _createShaderProgram(gl) {
    const vsSource = `
      attribute vec3 a_position;
      uniform mat4 u_mvp;
      void main() {
        gl_Position = u_mvp * vec4(a_position, 1.0);
      }
    `;
    const fsSource = `
      precision mediump float;
      uniform vec4 u_color;
      void main() {
        gl_FragColor = u_color;
      }
    `;

    const vs = this._compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fs = this._compileShader(gl, fsSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Could not link shaders:', gl.getProgramInfoLog(program));
    }
    return program;
  }

  _compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  onRender(gl, viewProjectionMatrix) {
    if (!this.vertexBuffer) return;

    gl.useProgram(this.shaderProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);

    const mvp = mat4.create();
    mat4.copy(mvp, viewProjectionMatrix);

    gl.uniformMatrix4fv(this.mvpLocation, false, mvp);
    gl.uniform4fv(this.colorLocation, this.color);

    gl.drawArrays(gl.LINES, 0, 2);
  }
}
