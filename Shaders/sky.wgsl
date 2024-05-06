struct VertexOut {
    @builtin(position) position : vec4f,
    @location(0) viewDir : vec4f
}

struct SceneInformation {
    perspective : mat4x4f,
    world : mat4x4f,
    cameraPosition : vec4f,
    lightPosition : vec4f,
    lightColor : vec4f
}

struct SkyInformation {
    colorOne : vec4f,
    colorTwo : vec4f
}

@group(0) @binding(0) var<uniform> sceneInfo: SceneInformation;
@group(0) @binding(1) var<uniform> skyInfo: SkyInformation;

const pos = array(vec2f(-1, -1), vec2f(-1, 1), vec2f(1, -1), vec2f(1, 1));
const color = array(vec3f(0, 0, 1), vec3f(1, 0, 0), vec3f(0, 1, 0), vec3f(1, 1, 1));

@vertex
fn vertexMain(@builtin(vertex_index) vertID: u32) -> VertexOut {
    var output : VertexOut;
    output.position = vec4f(pos[vertID], 1, 1);
    output.viewDir = vec4f(pos[vertID] * -0.5 + 0.5, 1, 1);
    return output;
}

@fragment
fn fragmentMain(fragData: VertexOut) -> @location(0) vec4f {
    let viewDir = normalize(sceneInfo.world * fragData.viewDir);
    let color = vec4f(mix(skyInfo.colorTwo.xyz, skyInfo.colorOne.xyz, exp(-pow(saturate(viewDir.y) * 4, 2))), 1);
    return mix(color, mixColorFog(fragData.position, color), 0.4);
}