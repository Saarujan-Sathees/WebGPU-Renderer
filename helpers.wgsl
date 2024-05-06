const mantissaBitmask = 0x007FFFFFu; //Mantissa
const mantissaOne = 0x3F800000u; //1.0 in IEEE binary32

//Blending Functions
fn easeOut(x: f32, t: f32) -> f32 {
	return 1.0 - pow(1.0 - x, t);
}

fn easeIn(x: f32, t: f32) -> f32 {
	return pow(x, t);
}

//Transformation Functions
fn rotateX(angle: f32) -> mat3x3f {
    let angleSin = sin(angle);
    let angleCos = cos(angle);
    return mat3x3f(
        vec3f(1, 0, 0),
        vec3f(0, angleCos, angleSin),
        vec3f(0, -angleSin, angleCos)
    );
}

fn rotateY(angle: f32) -> mat3x3f {
    let angleSin = sin(angle);
    let angleCos = cos(angle);
    return mat3x3f(
        vec3f(angleCos, 0, -angleSin),
        vec3f(0, 1, 0),
        vec3f(angleSin, 0, angleCos)
    );
}

fn rotateZ(angle: f32) -> mat3x3f {
    let angleSin = sin(angle);
    let angleCos = cos(angle);
    return mat3x3f(
        vec3f(angleCos, angleSin, 0),
        vec3f(-angleSin, angleCos, 0),
        vec3f(0, 0, 1)
    );
}

//Fog Functions
fn decay(position: vec4f, origin: vec4f) -> f32 {
    var dist = distance(position, origin);
    return exp(-dist * fogFactor);
}

fn calcSkyColor(viewDir: vec3f, normal: vec3f) -> vec4f {
    return vec4f(1, 1, 1, 1);
}

fn mixColorFog(position: vec4f, color: vec4f) -> vec4f {
    let factor = decay(position, sceneInfo.cameraPosition);
    return color * factor + fogColor * (1.0 - factor);
}

//Random Generation Functions
fn uintHash(x: u32) -> u32 {
    var result = x + (x << 10u);
    result ^= (result >> 6u);
    result += (result << 3u);
    result ^= (result >> 11u);
    result += (result << 15u);

    return result;
}

fn uintToFloat(value: u32) -> f32 {
    var result = value & mantissaBitmask;
    return bitcast<f32>(result | mantissaOne) - 1.0;
}

fn random11(v: f32) -> f32 {
    return uintToFloat(uintHash(bitcast<u32>(v)));
}

fn random12(v: vec2f) -> f32 { 
    return uintToFloat(uintHash(bitcast<u32>(v.x) ^ uintHash(bitcast<u32>(v.y))));
}

fn random13(v: vec3f) -> f32 { 
    return uintToFloat(uintHash(bitcast<u32>(v.x) ^ uintHash(bitcast<u32>(v.y)) ^ uintHash(bitcast<u32>(v.z)))); 
}

fn random14(v: vec4f) -> f32 { 
    return uintToFloat(uintHash(bitcast<u32>(v.x) ^ uintHash(bitcast<u32>(v.y)) ^ 
                       uintHash(bitcast<u32>(v.z)) ^ uintHash(bitcast<u32>(v.w)))); 
}

