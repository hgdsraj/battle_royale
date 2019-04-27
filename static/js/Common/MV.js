//////////////////////////////////////////////////////////////////////////////
//
//  Angel.js
//
//////////////////////////////////////////////////////////////////////////////

//----------------------------------------------------------------------------
//
//  Helper functions
//

function _argumentsToArray( args )
{
    return [].concat.apply( [], Array.prototype.slice.apply(args) );
}

//----------------------------------------------------------------------------

function radians( d ) {
    return d * Math.PI / 180.0;
}


function degrees( r ) {
    return r * 180.0 / Math.PI ;
}

//----------------------------------------------------------------------------
//
//  Vector Constructors
//

function vec2()
{
    let result = _argumentsToArray( arguments );

    switch ( result.length ) {
        case 0: result.push( 0.0 );
        case 1: result.push( 0.0 );
    }

    return result.splice( 0, 2 );
}

function vec3()
{
    let result = _argumentsToArray( arguments );

    switch ( result.length ) {
        case 0: result.push( 0.0 );
        case 1: result.push( 0.0 );
        case 2: result.push( 0.0 );
    }

    return result.splice( 0, 3 );
}

function vec4()
{
    let result = _argumentsToArray( arguments );

    switch ( result.length ) {
        case 0: result.push( 0.0 );
        case 1: result.push( 0.0 );
        case 2: result.push( 0.0 );
        case 3: result.push( 1.0 );
    }

    return result.splice( 0, 4 );
}

//----------------------------------------------------------------------------
//
//  Matrix Constructors
//

function mat2()
{
    let v = _argumentsToArray( arguments );

    let m = [];
    switch ( v.length ) {
        case 0:
            v[0] = 1;
        case 1:
            m = [
                vec2( v[0],  0.0 ),
                vec2(  0.0, v[0] )
            ];
            break;

        default:
            m.push( vec2(v) );  v.splice( 0, 2 );
            m.push( vec2(v) );
            break;
    }

    m.matrix = true;

    return m;
}

//----------------------------------------------------------------------------

function mat3()
{
    let v = _argumentsToArray( arguments );

    let m = [];
    switch ( v.length ) {
        case 0:
            v[0] = 1;
        case 1:
            m = [
                vec3( v[0],  0.0,  0.0 ),
                vec3(  0.0, v[0],  0.0 ),
                vec3(  0.0,  0.0, v[0] )
            ];
            break;

        default:
            m.push( vec3(v) );  v.splice( 0, 3 );
            m.push( vec3(v) );  v.splice( 0, 3 );
            m.push( vec3(v) );
            break;
    }

    m.matrix = true;

    return m;
}

//----------------------------------------------------------------------------

function mat4()
{
    let v = _argumentsToArray( arguments );

    let m = [];
    switch ( v.length ) {
        case 0:
            v[0] = 1;
        case 1:
            m = [
                vec4( v[0], 0.0,  0.0,   0.0 ),
                vec4( 0.0,  v[0], 0.0,   0.0 ),
                vec4( 0.0,  0.0,  v[0],  0.0 ),
                vec4( 0.0,  0.0,  0.0,  v[0] )
            ];
            break;

        default:
            m.push( vec4(v) );  v.splice( 0, 4 );
            m.push( vec4(v) );  v.splice( 0, 4 );
            m.push( vec4(v) );  v.splice( 0, 4 );
            m.push( vec4(v) );
            break;
    }

    m.matrix = true;

    return m;
}

//----------------------------------------------------------------------------
//
//  Generic Mathematical Operations for Vectors and Matrices
//

function equal( u, v )
{
    if ( u.length !== v.length ) { return false; }

    if ( u.matrix && v.matrix ) {
        for ( let i = 0; i < u.length; ++i ) {
            if ( u[i].length !== v[i].length ) { return false; }
            for ( let j = 0; j < u[i].length; ++j ) {
                if ( u[i][j]  !==  v[i][j] ) { return false; }
            }
        }
    }
    else if ( u.matrix && !v.matrix || !u.matrix && v.matrix ) {
        return false;
    }
    else {
        for ( let i = 0; i < u.length; ++i ) {
            if ( u[i]  !==  v[i] ) { return false; }
        }
    }

    return true;
}

//----------------------------------------------------------------------------

function add( u, v )
{
    let result = [];

    if ( u.matrix && v.matrix ) {
        if ( u.length !== v.length ) {
            throw new Error("add(): trying to add matrices of different dimensions");
        }

        for ( let i = 0; i < u.length; ++i ) {
            if ( u[i].length !== v[i].length ) {
                throw new Error("add(): trying to add matrices of different dimensions");
            }
            result.push( [] );
            for ( let j = 0; j < u[i].length; ++j ) {
                result[i].push( u[i][j] + v[i][j] );
            }
        }

        result.matrix = true;

        return result;
    }
    else if ( u.matrix && !v.matrix || !u.matrix && v.matrix ) {
        throw new Error("add(): trying to add matrix and non-matrix variables");
    }
    else {
        if ( u.length !== v.length ) {
            throw new Error("add(): vectors are not the same dimension");
        }

        for ( let i = 0; i < u.length; ++i ) {
            result.push( u[i] + v[i] );
        }

        return result;
    }
}

//----------------------------------------------------------------------------

function subtract( u, v )
{
    let result = [];

    if ( u.matrix && v.matrix ) {
        if ( u.length !== v.length ) {
            throw new Error("subtract(): trying to subtract matrices" +
            " of different dimensions");
        }

        for ( let i = 0; i < u.length; ++i ) {
            if ( u[i].length !== v[i].length ) {
                throw new Error("subtract(): trying to subtact matrices" +
                " of different dimensions");
            }
            result.push( [] );
            for ( let j = 0; j < u[i].length; ++j ) {
                result[i].push( u[i][j] - v[i][j] );
            }
        }

        result.matrix = true;

        return result;
    }
    else if ( u.matrix && !v.matrix || !u.matrix && v.matrix ) {
        throw new Error("subtact(): trying to subtact  matrix and non-matrix variables");
    }
    else {
        if ( u.length !== v.length ) {
            throw new Error("subtract(): vectors are not the same length");
        }

        for ( let i = 0; i < u.length; ++i ) {
            result.push( u[i] - v[i] );
        }

        return result;
    }
}

//----------------------------------------------------------------------------

function mult( u, v )
{
    let result = [];

    if ( u.matrix && v.matrix ) {
        if ( u.length !== v.length ) {
            throw new Error("mult(): trying to add matrices of different dimensions");
        }

        for ( let i = 0; i < u.length; ++i ) {
            if ( u[i].length !== v[i].length ) {
                throw new Error("mult(): trying to add matrices of different dimensions");
            }
        }

        for ( let i = 0; i < u.length; ++i ) {
            result.push( [] );

            for ( let j = 0; j < v.length; ++j ) {
                let sum = 0.0;
                for ( let k = 0; k < u.length; ++k ) {
                    sum += u[i][k] * v[k][j];
                }
                result[i].push( sum );
            }
        }

        result.matrix = true;

        return result;
    }
    else {
        if ( u.length !== v.length ) {
            throw new Error("mult(): vectors are not the same dimension");
        }

        for ( let i = 0; i < u.length; ++i ) {
            result.push( u[i] * v[i] );
        }

        return result;
    }
}

//----------------------------------------------------------------------------
//
//  Basic Transformation Matrix Generators
//

function translate( x, y, z )
{
    if ( Array.isArray(x) && x.length === 3 ) {
        z = x[2];
        y = x[1];
        x = x[0];
    }

    let result = mat4();
    result[0][3] = x;
    result[1][3] = y;
    result[2][3] = z;

    return result;
}

//----------------------------------------------------------------------------

function rotate( angle, axis )
{
    if ( !Array.isArray(axis) ) {
        axis = [ arguments[1], arguments[2], arguments[3] ];
    }

    let v = normalize( axis );

    let x = v[0];
    let y = v[1];
    let z = v[2];
    let c = Math.cos( radians(angle) );
    let omc = 1.0 - c;
    let s = Math.sin( radians(angle) );
    // console.log("x,y,z,c,omc,s", x,y,z,c,omc,s)
    let result = mat4(
        vec4( x*x*omc + c,   x*y*omc - z*s, x*z*omc + y*s, 0.0 ),
        vec4( x*y*omc + z*s, y*y*omc + c,   y*z*omc - x*s, 0.0 ),
        vec4( x*z*omc - y*s, y*z*omc + x*s, z*z*omc + c,   0.0 ),
        vec4()
    );

    return result;
}

//----------------------------------------------------------------------------

function scalem( x, y, z )
{
    if ( Array.isArray(x) && x.length === 3 ) {
        z = x[2];
        y = x[1];
        x = x[0];
    }

    let result = mat4();
    result[0][0] = x;
    result[1][1] = y;
    result[2][2] = z;

    return result;
}

//----------------------------------------------------------------------------
//
//  ModelView Matrix Generators
//

function lookAt( eye, at, up )
{
    if ( !Array.isArray(eye) || eye.length !== 3) {
        throw new Error("lookAt(): first parameter [eye] must be an a vec3");
    }

    if ( !Array.isArray(at) || at.length !== 3) {
        throw new Error("lookAt(): first parameter [at] must be an a vec3");
    }

    if ( !Array.isArray(up) || up.length !== 3) {
        throw new Error("lookAt(): first parameter [up] must be an a vec3");
    }

    if ( equal(eye, at) ) {
        return mat4();
    }

    let v = normalize( subtract(at, eye) );  // view direction vector
    let n = normalize( cross(v, up) );       // perpendicular vector
    let u = normalize( cross(n, v) );        // "new" up vector

    v = negate( v );

    return mat4(
        vec4(n, -dot(n, eye)),
        vec4(u, -dot(u, eye)),
        vec4(v, -dot(v, eye)),
        vec4()
    );
}


//----------------------------------------------------------------------------
//
//  Projection Matrix Generators
//

function ortho( left, right, bottom, top, near, far )
{
    if ( left === right ) { throw new Error("ortho(): left and right are equal"); }
    if ( bottom === top ) { throw new Error("ortho(): bottom and top are equal"); }
    if ( near === far )   { throw new Error("ortho(): near and far are equal"); }

    let w = right - left;
    let h = top - bottom;
    let d = far - near;

    let result = mat4();
    result[0][0] = 2.0 / w;
    result[1][1] = 2.0 / h;
    result[2][2] = -2.0 / d;
    result[0][3] = -(left + right) / w;
    result[1][3] = -(top + bottom) / h;
    result[2][3] = -(near + far) / d;

    return result;
}

//----------------------------------------------------------------------------

function perspective( fovy, aspect, near, far )
{
    let f = 1.0 / Math.tan( radians(fovy) / 2 );
    let d = far - near;

    let result = mat4();
    result[0][0] = f / aspect;
    result[1][1] = f;
    result[2][2] = -(near + far) / d;
    result[2][3] = -2 * near * far / d;
    result[3][2] = -1;
    result[3][3] = 0.0;

    return result;
}

function pzerspective(out, fovy, aspect, near, far) {
    let f = 1.0 / Math.tan(fovy / 2), nf;
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[15] = 0;
    if (far != null && far !== Infinity) {
        nf = 1 / (near - far);
        out[10] = (far + near) * nf;
        out[14] = (2 * far * near) * nf;
    } else {
        out[10] = -1;
        out[14] = -2 * near;
    }
    return out;
}

//----------------------------------------------------------------------------
//
//  Matrix Functions
//

function transpose( m )
{
    if ( !m.matrix ) {
        return "transpose(): trying to transpose a non-matrix";
    }

    let result = [];
    for ( let i = 0; i < m.length; ++i ) {
        result.push( [] );
        for ( let j = 0; j < m[i].length; ++j ) {
            result[i].push( m[j][i] );
        }
    }

    result.matrix = true;

    return result;
}

//----------------------------------------------------------------------------
//
//  Vector Functions
//

function dot( u, v )
{
    if ( u.length !== v.length ) {
        throw new Error("dot(): vectors are not the same dimension");
    }

    let sum = 0.0;
    for ( let i = 0; i < u.length; ++i ) {
        sum += u[i] * v[i];
    }

    return sum;
}

//----------------------------------------------------------------------------

function negate( u )
{
    let result = [];
    for ( let i = 0; i < u.length; ++i ) {
        result.push( -u[i] );
    }

    return result;
}

//----------------------------------------------------------------------------

function cross( u, v )
{
    if ( !Array.isArray(u) || u.length < 3 ) {
        throw new Error("cross(): first argument is not a vector of at least 3");
    }

    if ( !Array.isArray(v) || v.length < 3 ) {
        throw new Error("cross(): second argument is not a vector of at least 3");
    }

    let result = [
        u[1]*v[2] - u[2]*v[1],
        u[2]*v[0] - u[0]*v[2],
        u[0]*v[1] - u[1]*v[0]
    ];

    return result;
}

//----------------------------------------------------------------------------

function length( u )
{
    return Math.sqrt( dot(u, u) );
}

//----------------------------------------------------------------------------

function normalize( u, excludeLastComponent )
{
    if ( excludeLastComponent ) {
        let last = u.pop();
    }

    let len = length( u );

    if ( !isFinite(len) ) {
        throw new Error("normalize: vector " + u + " has zero length");
    }

    for ( let i = 0; i < u.length; ++i ) {
        u[i] /= len;
    }

    if ( excludeLastComponent ) {
        u.push( last );
    }

    return u;
}

//----------------------------------------------------------------------------

function mix( u, v, s )
{
    if ( typeof s  !==  "number" ) {
        throw new Error("mix: the last paramter " + s + " must be a number");
    }

    if ( u.length !== v.length ) {
        throw new Error("vector dimension mismatch");
    }

    let result = [];
    for ( let i = 0; i < u.length; ++i ) {
        result.push( (1.0 - s) * u[i] + s * v[i] );
    }

    return result;
}

//----------------------------------------------------------------------------
//
// Vector and Matrix functions
//

function scale( s, u )
{
    if ( !Array.isArray(u) ) {
        throw new Error("scale: second parameter " + u + " is not a vector");
    }

    let result = [];
    for ( let i = 0; i < u.length; ++i ) {
        result.push( s * u[i] );
    }

    return result;
}

//----------------------------------------------------------------------------
//
//
//

function flatten( v )
{
    if ( v.matrix === true ) {
        v = transpose( v );
    }

    let n = v.length;
    let elemsAreArrays = false;

    if ( Array.isArray(v[0]) ) {
        elemsAreArrays = true;
        n *= v[0].length;
    }

    let floats = new Float32Array( n );

    if ( elemsAreArrays ) {
        let idx = 0;
        for ( let i = 0; i < v.length; ++i ) {
            for ( let j = 0; j < v[i].length; ++j ) {
                floats[idx++] = v[i][j];
            }
        }
    }
    else {
        for ( let i = 0; i < v.length; ++i ) {
            floats[i] = v[i];
        }
    }

    return floats;
}

//----------------------------------------------------------------------------

let sizeof = {
    'vec2' : new Float32Array( flatten(vec2()) ).byteLength,
    'vec3' : new Float32Array( flatten(vec3()) ).byteLength,
    'vec4' : new Float32Array( flatten(vec4()) ).byteLength,
    'mat2' : new Float32Array( flatten(mat2()) ).byteLength,
    'mat3' : new Float32Array( flatten(mat3()) ).byteLength,
    'mat4' : new Float32Array( flatten(mat4()) ).byteLength
};

// new functions 5/2/2015

// printing

function printm(m)
{
    if(m.length === 2)
        for(let i=0; i<m.length; i++)
            console.log(m[i][0], m[i][1]);
    else if(m.length === 3)
        for(let i=0; i<m.length; i++)
            console.log(m[i][0], m[i][1], m[i][2]);
    else if(m.length === 4)
        for(let i=0; i<m.length; i++)
            console.log(m[i][0], m[i][1], m[i][2], m[i][3]);
}
// determinants

function det2(m)
{

    return m[0][0]*m[1][1]-m[0][1]*m[1][0];

}

function det3(m)
{

    return m[0][0] * m[1][1] * m[2][2]
        + m[0][1] * m[1][2] * m[2][0]
        + m[0][2] * m[2][1] * m[1][0]
        - m[2][0] * m[1][1] * m[0][2]
        - m[1][0] * m[0][1] * m[2][2]
        - m[0][0] * m[1][2] * m[2][1];
}

function det4(m)
{
    let m0 = [
        vec3(m[1][1], m[1][2], m[1][3]),
        vec3(m[2][1], m[2][2], m[2][3]),
        vec3(m[3][1], m[3][2], m[3][3])
    ];
    let m1 = [
        vec3(m[1][0], m[1][2], m[1][3]),
        vec3(m[2][0], m[2][2], m[2][3]),
        vec3(m[3][0], m[3][2], m[3][3])
    ];
    let m2 = [
        vec3(m[1][0], m[1][1], m[1][3]),
        vec3(m[2][0], m[2][1], m[2][3]),
        vec3(m[3][0], m[3][1], m[3][3])
    ];
    let m3 = [
        vec3(m[1][0], m[1][1], m[1][2]),
        vec3(m[2][0], m[2][1], m[2][2]),
        vec3(m[3][0], m[3][1], m[3][2])
    ];
    return m[0][0]*det3(m0) - m[0][1]*det3(m1)
        + m[0][2]*det3(m2) - m[0][3]*det3(m3);

}

function det(m)
{
    if(m.matrix !== true) console.log("not a matrix");
    if(m.length === 2) return det2(m);
    if(m.length === 3) return det3(m);
    if(m.length === 4) return det4(m);
}

//---------------------------------------------------------

// inverses

function inverse2(m)
{
    let a = mat2();
    let d = det2(m);
    a[0][0] = m[1][1]/d;
    a[0][1] = -m[0][1]/d;
    a[1][0] = -m[1][0]/d;
    a[1][1] = m[0][0]/d;
    a.matrix = true;
    return a;
}

function inverse3(m)
{
    let a = mat3();
    let d = det3(m);

    let a00 = [
        vec2(m[1][1], m[1][2]),
        vec2(m[2][1], m[2][2])
    ];
    let a01 = [
        vec2(m[1][0], m[1][2]),
        vec2(m[2][0], m[2][2])
    ];
    let a02 = [
        vec2(m[1][0], m[1][1]),
        vec2(m[2][0], m[2][1])
    ];
    let a10 = [
        vec2(m[0][1], m[0][2]),
        vec2(m[2][1], m[2][2])
    ];
    let a11 = [
        vec2(m[0][0], m[0][2]),
        vec2(m[2][0], m[2][2])
    ];
    let a12 = [
        vec2(m[0][0], m[0][1]),
        vec2(m[2][0], m[2][1])
    ];
    let a20 = [
        vec2(m[0][1], m[0][2]),
        vec2(m[1][1], m[1][2])
    ];
    let a21 = [
        vec2(m[0][0], m[0][2]),
        vec2(m[1][0], m[1][2])
    ];
    let a22 = [
        vec2(m[0][0], m[0][1]),
        vec2(m[1][0], m[1][1])
    ];

    a[0][0] = det2(a00)/d;
    a[0][1] = -det2(a10)/d;
    a[0][2] = det2(a20)/d;
    a[1][0] = -det2(a01)/d;
    a[1][1] = det2(a11)/d;
    a[1][2] = -det2(a21)/d;
    a[2][0] = det2(a02)/d;
    a[2][1] = -det2(a12)/d;
    a[2][2] = det2(a22)/d;

    return a;

}

function inverse4(m)
{
    let a = mat4();
    let d = det4(m);

    let a00 = [
        vec3(m[1][1], m[1][2], m[1][3]),
        vec3(m[2][1], m[2][2], m[2][3]),
        vec3(m[3][1], m[3][2], m[3][3])
    ];
    let a01 = [
        vec3(m[1][0], m[1][2], m[1][3]),
        vec3(m[2][0], m[2][2], m[2][3]),
        vec3(m[3][0], m[3][2], m[3][3])
    ];
    let a02 = [
        vec3(m[1][0], m[1][1], m[1][3]),
        vec3(m[2][0], m[2][1], m[2][3]),
        vec3(m[3][0], m[3][1], m[3][3])
    ];
    let a03 = [
        vec3(m[1][0], m[1][1], m[1][2]),
        vec3(m[2][0], m[2][1], m[2][2]),
        vec3(m[3][0], m[3][1], m[3][2])
    ];
    let a10 = [
        vec3(m[0][1], m[0][2], m[0][3]),
        vec3(m[2][1], m[2][2], m[2][3]),
        vec3(m[3][1], m[3][2], m[3][3])
    ];
    let a11 = [
        vec3(m[0][0], m[0][2], m[0][3]),
        vec3(m[2][0], m[2][2], m[2][3]),
        vec3(m[3][0], m[3][2], m[3][3])
    ];
    let a12 = [
        vec3(m[0][0], m[0][1], m[0][3]),
        vec3(m[2][0], m[2][1], m[2][3]),
        vec3(m[3][0], m[3][1], m[3][3])
    ];
    let a13 = [
        vec3(m[0][0], m[0][1], m[0][2]),
        vec3(m[2][0], m[2][1], m[2][2]),
        vec3(m[3][0], m[3][1], m[3][2])
    ];
    let a20 = [
        vec3(m[0][1], m[0][2], m[0][3]),
        vec3(m[1][1], m[1][2], m[1][3]),
        vec3(m[3][1], m[3][2], m[3][3])
    ];
    let a21 = [
        vec3(m[0][0], m[0][2], m[0][3]),
        vec3(m[1][0], m[1][2], m[1][3]),
        vec3(m[3][0], m[3][2], m[3][3])
    ];
    let a22 = [
        vec3(m[0][0], m[0][1], m[0][3]),
        vec3(m[1][0], m[1][1], m[1][3]),
        vec3(m[3][0], m[3][1], m[3][3])
    ];
    let a23 = [
        vec3(m[0][0], m[0][1], m[0][2]),
        vec3(m[1][0], m[1][1], m[1][2]),
        vec3(m[3][0], m[3][1], m[3][2])
    ];

    let a30 = [
        vec3(m[0][1], m[0][2], m[0][3]),
        vec3(m[1][1], m[1][2], m[1][3]),
        vec3(m[2][1], m[2][2], m[2][3])
    ];
    let a31 = [
        vec3(m[0][0], m[0][2], m[0][3]),
        vec3(m[1][0], m[1][2], m[1][3]),
        vec3(m[2][0], m[2][2], m[2][3])
    ];
    let a32 = [
        vec3(m[0][0], m[0][1], m[0][3]),
        vec3(m[1][0], m[1][1], m[1][3]),
        vec3(m[2][0], m[2][1], m[2][3])
    ];
    let a33 = [
        vec3(m[0][0], m[0][1], m[0][2]),
        vec3(m[1][0], m[1][1], m[1][2]),
        vec3(m[2][0], m[2][1], m[2][2])
    ];



    a[0][0] = det3(a00)/d;
    a[0][1] = -det3(a10)/d;
    a[0][2] = det3(a20)/d;
    a[0][3] = -det3(a30)/d;
    a[1][0] = -det3(a01)/d;
    a[1][1] = det3(a11)/d;
    a[1][2] = -det3(a21)/d;
    a[1][3] = det3(a31)/d;
    a[2][0] = det3(a02)/d;
    a[2][1] = -det3(a12)/d;
    a[2][2] = det3(a22)/d;
    a[2][3] = -det3(a32)/d;
    a[3][0] = -det3(a03)/d;
    a[3][1] = det3(a13)/d;
    a[3][2] = -det3(a23)/d;
    a[3][3] = det3(a33)/d;

    return a;
}
function inverse(m)
{
    if(m.matrix  !==  true) console.log("not a matrix");
    if(m.length === 2) return inverse2(m);
    if(m.length === 3) return inverse3(m);
    if(m.length === 4) return inverse4(m);
}

function normalMatrix(m, flag)
{
    let a = mat4();
    a = inverse(transpose(m));
    if(flag  !==  true) return a;
    else {
        let b = mat3();
        for(let i=0;i<3;i++) for(let j=0; j<3; j++) b[i][j] = a[i][j];
        return b;
    }

}