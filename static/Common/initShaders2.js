function initShaders(gl, vShaderScript, fShaderScript) {
    function createShader(gl, shaderScript, type) {
        const shader = gl.createShader(type);

        gl.shaderSource(shader, shaderScript);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    const vertexShader = createShader(gl, vShaderScript, gl.VERTEX_SHADER),
        fragmentShader = createShader(gl, fShaderScript, gl.FRAGMENT_SHADER),
        program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
        return null;
    }


    return program;
}

