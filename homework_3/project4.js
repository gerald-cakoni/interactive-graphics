// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
    // Matrice di traslazione
    var translation = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    // Matrice di rotazione attorno all'asse X
    var cosX = Math.cos(rotationX);
    var sinX = Math.sin(rotationX);
    var rotationXMatrix = [
        1, 0, 0, 0,
        0, cosX, sinX, 0,
        0, -sinX, cosX, 0,
        0, 0, 0, 1
    ];

    // Matrice di rotazione attorno all'asse Y
    var cosY = Math.cos(rotationY);
    var sinY = Math.sin(rotationY);
    var rotationYMatrix = [
        cosY, 0, -sinY, 0,
        0, 1, 0, 0,
        sinY, 0, cosY, 0,
        0, 0, 0, 1
    ];

    // Calcolo della matrice MVP: Projection * Translation * RotationY * RotationX
    var modelView = MatrixMult(MatrixMult(translation, rotationYMatrix), rotationXMatrix);
    var mvp = MatrixMult(projectionMatrix, modelView);
    return mvp;
}

// Vertex Shader Source Code
const vertexShaderSrc = `
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    uniform mat4 uMVPMatrix;
    uniform bool uSwapYZ;
    varying vec2 vTexCoord;
    void main() {
        vec4 pos = vec4(aPosition, 1.0);
        if (uSwapYZ) {
            pos.yz = pos.zy;
        }
        gl_Position = uMVPMatrix * pos;
        vTexCoord = aTexCoord;
    }
`;

// Fragment Shader Source Code
const fragmentShaderSrc = `
    precision mediump float;
    varying vec2 vTexCoord;
    uniform bool uUseTexture;
    uniform sampler2D uTexture;
    void main() {
        if (uUseTexture) {
            gl_FragColor = texture2D(uTexture, vTexCoord);
        } else {
            gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
        }
    }
`;

// [TO-DO] Complete the implementation of the following class.

class MeshDrawer {
    constructor() {
		// Compile the shader program
		this.shaderProgram = InitShaderProgram(vertexShaderSrc, fragmentShaderSrc);
		gl.useProgram(this.shaderProgram);
	
		// Get uniform locations
		this.mvpMatrixLocation = gl.getUniformLocation(this.shaderProgram, "uMVPMatrix");
		this.swapYZLocation = gl.getUniformLocation(this.shaderProgram, "uSwapYZ");
		this.useTextureLocation = gl.getUniformLocation(this.shaderProgram, "uUseTexture");
	
		// Get attribute locations
		this.vertexPosition = gl.getAttribLocation(this.shaderProgram, "aPosition");
		this.textureCoord = gl.getAttribLocation(this.shaderProgram, "aTexCoord");
	
		// Create buffers
		this.vertexBuffer = gl.createBuffer();
		this.texCoordBuffer = gl.createBuffer();
	
		// Initialize texture
		this.texture = gl.createTexture();
		this.useTextureValue = false;
		this.swapYZValue = false;
	}

    setMesh(vertPos, texCoords) {
        this.numTriangles = vertPos.length / 3;

        // Caricare i dati nel buffer dei vertici
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        // Caricare i dati nel buffer delle texture coordinate
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    }

    swapYZ(swap) {
        this.swapYZValue = swap;
        gl.useProgram(this.shaderProgram);
        gl.uniform1i(this.swapYZLocation, swap ? 1 : 0);
    }

    draw(trans) {
    gl.useProgram(this.shaderProgram);
    gl.uniformMatrix4fv(this.mvpMatrixLocation, false, trans);
    gl.uniform1i(this.useTextureLocation, this.useTextureValue ? 1 : 0); // Enable/disable texture
    gl.uniform1i(this.swapYZLocation, this.swapYZValue ? 1 : 0);

    // Bind vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(this.vertexPosition);
    gl.vertexAttribPointer(this.vertexPosition, 3, gl.FLOAT, false, 0, 0);

    // Bind texture coordinate buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.enableVertexAttribArray(this.textureCoord);
    gl.vertexAttribPointer(this.textureCoord, 2, gl.FLOAT, false, 0, 0);

    // Bind texture if enabled
    if (this.useTextureValue) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }

    // Draw the mesh
    gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
}

    setTexture(img) {
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // Flip the image's Y axis
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	}
	
	showTexture(show) {
		this.useTextureValue = show;
		gl.useProgram(this.shaderProgram);
		gl.uniform1i(this.useTextureLocation, show ? 1 : 0);
	}
}

