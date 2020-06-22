gl = null;

function setContext (newGl) {
    gl = newGl;
};

function makeRect4 (gl, v1,v2) {
    var verts = [
	v1.x, v2.y, 0.0, 1.0,
	v1.x, v1.y, 0.0, 1.0,
	v2.x, v2.y, 0.0, 1.0,

	v1.x, v1.y, 0.0, 1.0,
	v2.x, v1.y, 0.0, 1.0,
        v2.x, v2.y, 0.0, 1.0
    ];
    return glBuffer (gl, verts, 4, 6);
};


function makeProgram (gl, vert, frag) {
    var shader = gl.createProgram();

    var vert_shader = getShader (gl, gl.VERTEX_SHADER, vert);
    var frag_shader = getShader (gl, gl.FRAGMENT_SHADER, frag);

    gl.attachShader(shader, vert_shader);
    gl.attachShader(shader, frag_shader);
    gl.linkProgram(shader);

    addVars (gl, shader, vert_shader, frag_shader);
    //addVars (gl, shader, frag, vert_shader, frag_shader);

    return shader;
};

function getShader (gl, type, path) {
    console.log (path);
    var shader = gl.createShader (type);

    $.ajax ({
	    async: false,
		url: path,
		dataType: 'text',
		success: function (data) {
		gl.shaderSource (shader, data);
		gl.compileShader (shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		    throw (gl.getShaderInfoLog(shader));
		}
		shader.source = data;
	    },
		error: function (xhr) {
		console.log ("Could not load " + path);
	    }
	});
    return shader;
};

function addVars (gl, shader, vert, frag) {
    var uniforms = {};
    var attr = {};

    var u = (vert.source + frag.source).match (/((uniform)|(attribute)) (\w+) (\w+)/mg);
    var tex_count = 0;
    if (u) {
	for (var i = 0; i < u.length; i ++) {
	    var v = u[i].split (' ');
	    console.log (v);
	    uniforms[v[2]] = {
		u: v[0],
		type: v[1],
		loc: null //gl.getUniformLocation (shader, v[2])
	    };
	    if (v[0] == 'uniform') {
		uniforms[v[2]].loc = gl.getUniformLocation (shader, v[2]);
	    }
	    else {
		var loc = gl.getAttribLocation (shader, v[2]);
		uniforms[v[2]].loc = loc
		gl.enableVertexAttribArray (loc);
	    }
	    if (v[1] == 'sampler2D') {
		uniforms[v[2]].tex = tex_count;
		tex_count ++;
	    }
	    console.log (uniforms);
	}
	/*var a = (vert.source + frag.source).match (/uniform (\w*) (\w*);/mg);
	if (uniforms) {
	    for (var i = 0; i < a.length; i ++) {
		var v = a[i].split (' ');
		attr[v[2]] = v[1];
	    }
	    }*/
	shader.get = function (name) {
	    return uniforms[name].loc;
	}
	shader.data = function (name, data) {
	    var d = uniforms[name];
	    if (!d)
		throw "Could not find shader variable " + name;
	    if (d.u == 'uniform') {
		if (d.type == 'float')
		    gl.uniform1f (d.loc, data);
		else if (d.type == 'vec2')
		    gl.uniform2fv (d.loc, data);
		else if (d.type == 'vec3')
		    gl.uniform3fv (d.loc, data);
		else if (d.type == 'vec4')
		    gl.uniform4fv (d.loc, data);
		else if (d.type == 'bool')
		    gl.uniform1i (d.loc, data);
		else if (d.type == 'mat4')
		    gl.uniformMatrix4fv (d.loc, false, data);	
		else if (d.type == 'sampler2D') {
		    gl.activeTexture (gl['TEXTURE' + d.tex]); 
		    gl.bindTexture (gl.TEXTURE_2D, data);
		    gl.uniform1i (d.loc, d.tex);
		}
		else if (d.type == 'int')
		    gl.uniform1i (d.loc, data);
		else
		    throw "Unsupported Type for Shader Helper";
	    }
	    if (d.u == 'attribute') {
		gl.bindBuffer (gl.ARRAY_BUFFER, data);
		gl.vertexAttribPointer (d.loc, data.itemSize, gl.FLOAT, false, 0, 0);
	    }
	};
    }
};

function glBuffer (gl, data, itemSize, numItems) {
    var buffer = gl.createBuffer ();
    gl.bindBuffer (gl.ARRAY_BUFFER, buffer);
    buffer.data = new Float32Array (data);
    buffer.itemSize = itemSize;
    buffer.numItems = numItems;
  
    gl.bufferData (gl.ARRAY_BUFFER, buffer.data, gl.STATIC_DRAW);
    gl.bindBuffer (gl.ARRAY_BUFFER, null);
    return buffer;
};

var tex_count = 0;
function getTexture (path) {
    var tex = gl.createTexture ();
    tex.id = tex_count;
    tex_count ++;
    var img = new Image ();
    img.onload = function () {
	gl.bindTexture(gl.TEXTURE_2D, tex);  
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);  
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);  
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);  
	gl.generateMipmap(gl.TEXTURE_2D);  
	gl.bindTexture(gl.TEXTURE_2D, null);
    };
    img.src = path;
    return tex;
};