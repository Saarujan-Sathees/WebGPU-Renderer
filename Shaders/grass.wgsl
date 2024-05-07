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

fn calcSegmentCount(position: vec3f) -> f32 {
    let distance = length(sceneInfo.perspective * vec4f(position, 1.0));

    if (distance == 0) {
        return grassInfo.segments;
    } else {
        return max(1, min(grassInfo.segments, ceil(grassInfo.segments * exp(5 - sqrt(distance)) * 100)));
    }
}

const topColor = vec4f(80, 110, 28, 255) / 255.0;
const bottomColor = vec4f(38, 55, 30, 255) / 255.0;

@vertex
fn vertexMain(@builtin(vertex_index) vertID: u32, @builtin(instance_index) instanceID: u32, @location(0) offset: vec2f) -> VertexOut {
    var output : VertexOut;
    let segmentCount = calcSegmentCount(vec3f(offset.x, 0, offset.y));
    let segmentID = floor(f32(vertID) / 6.0);
    if (segmentID > segmentCount) {
        output.color.x = -1;
        return output;
    }

    let segmentVertID = vertID % 6;
    let triangleID = floor(f32(segmentVertID) / 3.0);
    let triangleVertID = segmentVertID % 3; 

    let leanFactor = random11(f32(instanceID)) * 0.5;
    let rotationFactor = random11(leanFactor);
    let grassDimensions = grassInfo.size + leanFactor;
    let heightFactor = (f32(segmentID) + triangleID + (triangleID * -2.0 + 1.0) * floor(f32(triangleVertID) / 2.0)) / segmentCount;
    let widthFactor = 1.0 - heightFactor;
    let xSide = (f32(triangleVertID) + triangleID) % 2;

    let x = grassDimensions.x * pow(widthFactor, 0.7) * (f32(triangleVertID) % 2 - 0.5) * (f32(triangleID) * -2.0 + 1.0);
    let y = grassDimensions.y * heightFactor;   
                     
    let leanMatrix = rotateY(rotationFactor * 0.5) * rotateX(leanFactor * heightFactor); 
    let grassPos = vec4f(leanMatrix * vec3f(x, y, 0) + vec3f(offset.x, 0, offset.y), 1.0);

    output.position = sceneInfo.perspective * grassPos;
    output.color = mix(topColor, bottomColor, widthFactor);
    output.normal = (leanMatrix * vec3f(0.5 * (xSide - 0.5), 0, -1));
    output.surfaceToLight = (sceneInfo.lightPosition - grassPos).xyz;
    output.surfaceToCamera = abs(output.position - sceneInfo.cameraPosition).xyz;
    output.grassPos = grassPos;
    return output;
}

@fragment
fn fragmentMain(fragData: VertexOut) -> @location(0) vec4f {
    if (fragData.color.x < 0) {
        discard;
    } 
    
    let normal = normalize(fragData.normal);
    let surfaceToCamera = normalize(fragData.surfaceToCamera);
    let surfaceToLight = normalize(fragData.surfaceToLight);

    let lightAccumulation = dot(normal, surfaceToLight) + dot(normal, normalize(surfaceToCamera + surfaceToLight));
    let light = dot(surfaceToLight, normal) + dot(surfaceToCamera, surfaceToLight);

    return vec4f(mixColorFog(fragData.position, fragData.color).xyz * sceneInfo.lightColor.xyz * light, 1);
}