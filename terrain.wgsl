struct VertexOut {
    @builtin(position) position : vec4f,
    @location(0) normal : vec3f,
    @location(1) surfaceToLight : vec3f,
    @location(2) surfaceToCamera : vec3f
}

struct SceneInformation {
    perspective : mat4x4f,
    world : mat4x4f,
    cameraPosition : vec4f,
    lightPosition : vec4f,
    lightColor : vec4f
}

struct TerrainInformation {
    dimensions : vec4f,
    offset : vec4f,
    color : vec4f
}

@group(0) @binding(0) var<uniform> sceneInfo: SceneInformation;
@group(0) @binding(1) var<uniform> terrainInfo: TerrainInformation;

@vertex
fn vertexMain(@builtin(instance_index) blockID: u32, @location(0) pos: vec3f, @location(1) normal: vec3f) -> VertexOut {
    var output : VertexOut;

    let blockX = f32(blockID % 3) - 1;
    let blockZ = floor(f32(blockID) / 3) - 1;
    let ws = vec4f(terrainInfo.dimensions.x + terrainInfo.offset.x + select(pos.x + blockX * terrainInfo.dimensions.x, 
                                                          (blockX + 1) * terrainInfo.dimensions.x - pos.x, blockX == 0), 
                   pos.y + terrainInfo.offset.y,
                   terrainInfo.dimensions.z + terrainInfo.offset.z + select(pos.z + blockZ * terrainInfo.dimensions.z, 
                                                          (blockZ + 1) * terrainInfo.dimensions.z - pos.z, blockZ == 0), 1
    );

    output.position = sceneInfo.perspective * ws;
    output.normal = normal;
    output.surfaceToLight = sceneInfo.lightPosition.xyz - ws.xyz;
    output.surfaceToCamera = sceneInfo.cameraPosition.xyz - ws.xyz;
    return output;
}

@fragment
fn fragmentMain(fragData: VertexOut) -> @location(0) vec4f {
    let normal = normalize(fragData.normal);
    let surfaceToCamera = normalize(fragData.surfaceToCamera);
    let surfaceToLight = normalize(fragData.surfaceToLight);

    var lightAccumulation = dot(surfaceToLight, normal) + 0.5 * dot(surfaceToCamera, surfaceToLight);

    return vec4f(mixColorFog(fragData.position, terrainInfo.color * sceneInfo.lightColor * lightAccumulation).xyz, 1);
}