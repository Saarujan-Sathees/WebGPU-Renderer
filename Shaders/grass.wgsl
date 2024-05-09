struct VertexOut {
    @builtin(position) position : vec4f,
    @location(0) color : vec4f,
    @location(1) normal : vec3f,
    @location(2) surfaceToLight : vec3f,
    @location(3) surfaceToCamera : vec3f,
    @location(4) grassPos : vec4f
}

struct SceneInformation {
    perspective : mat4x4f,
    world : mat4x4f,
    cameraPosition : vec4f,
    lightPosition : vec4f,
    lightColor : vec4f
}

struct GrassInformation {
    size : vec2f,
    segments : f32,
    time : f32
}

@group(0) @binding(0) var<uniform> sceneInfo: SceneInformation;
@group(0) @binding(1) var<uniform> grassInfo: GrassInformation;

const topColor = vec4f(80, 110, 28, 255) / 255.0;
const bottomColor = vec4f(38, 55, 30, 255) / 255.0;

@vertex
fn vertexMain(@builtin(vertex_index) vertID: u32, @builtin(instance_index) instanceID: u32, @location(0) offset: vec2f) -> VertexOut {
    var output : VertexOut;

    let segmentVertID = vertID % 6;
    let triangleID = floor(f32(segmentVertID) / 3.0);
    let signedTriID = triangleID * -2.0 + 1.0;
    let triangleVertID = f32(segmentVertID % 3); 

    let leanFactor = random11(f32(instanceID)) * 0.5;
    let heightFactor = (floor(f32(vertID) / 6.0) + triangleID + signedTriID * floor(triangleVertID * 0.5)) / grassInfo.segments;
    let widthFactor = 1.0 - heightFactor;

    let x = (grassInfo.size.x + leanFactor) * pow(widthFactor, 0.7) * (triangleVertID % 2 - 0.5) * signedTriID;
    let y = (grassInfo.size.y + leanFactor) * heightFactor;   
    let windMatrix = rotateZ(easeOut(heightFactor * pow(sin(grassInfo.time * 0.75 + leanFactor), 2) / 3, leanFactor)) *
                     rotateX(easeOut(heightFactor * pow(cos(grassInfo.time * 0.75), 2) * 0.05, leanFactor));
                     
    let grassMatrix = windMatrix * rotateY(random11(leanFactor) * 0.5) * rotateX(leanFactor * heightFactor); 
    let grassPos = vec4f(grassMatrix * vec3f(x, y, 0) + vec3f(offset.x, 0, offset.y), 1.0);

    output.position = sceneInfo.perspective * grassPos;
    output.color = mix(topColor, bottomColor, widthFactor);
    output.normal = grassMatrix * vec3f(0.5 * ((triangleVertID + triangleID) % 2 - 0.5), 0, -1);
    output.surfaceToLight = (sceneInfo.lightPosition - grassPos).xyz;
    output.surfaceToCamera = abs(output.position - sceneInfo.cameraPosition).xyz;
    output.grassPos = grassPos;
    return output;
}

@fragment
fn fragmentMain(fragData: VertexOut) -> @location(0) vec4f {
    let normal = normalize(fragData.normal);
    let surfaceToCamera = normalize(fragData.surfaceToCamera);
    let surfaceToLight = normalize(fragData.surfaceToLight);

    let light = dot(surfaceToLight, normal) + dot(surfaceToCamera, surfaceToLight);

    return vec4f(mixColorFog(fragData.position, fragData.color).xyz * sceneInfo.lightColor.xyz * light, 1);
}