struct VertexOut {
    @builtin(position) position : vec4f,
    @location(0) color : vec4f
}

struct SceneInformation {
    perspective : mat4x4f,
    world : mat4x4f,
    cameraPosition : vec4f,
    lightPosition : vec4f,
    lightColor : vec4f
}

@group(0) @binding(0) var<uniform> sceneInfo: SceneInformation;

@vertex
fn vertexMain(@location(0) position: vec4f, @location(1) color: vec4f) -> VertexOut {
    var output : VertexOut;
    output.position = sceneInfo.perspective * position;
    output.color = color;

    return output;
}

@fragment
fn fragmentMain(fragData: VertexOut) -> @location(0) vec4f {
    return mix(fragData.color, mixColorFog(fragData.position, fragData.color), 0.4);
}