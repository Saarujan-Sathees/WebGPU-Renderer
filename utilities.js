export const CONSTANTS = { RGB_MULT: 1.0 / 255, DEG_TO_RAD: Math.PI / 180, RAD_TO_DEG: 180 / Math.PI };

//#region Vector
export class Vector {
    constructor(x, y, z) {
        this.values = Float32Array.from([ x, y, z, 1 ]);
    }

    get(index) {
        return this.values[index];
    }

    set(index, value) {
        this.values[index] = value;
    }

    //#region Operators

    negative() {
        return new Vector(-this.values[0], -this.values[1], -this.values[2]);
    }

    add(b) {
        return new Vector(this.values[0] + b.get(0), this.values[1] + b.get(1), this.values[2] + b.get(2));
    }

    addNum(b) {
        return new Vector(this.values[0] + b, this.values[1] + b, this.values[2] + b);
    }

    sub(b) {
        return new Vector(this.values[0] - b.get(0), this.values[1] - b.get(1), this.values[2] - b.get(2));
    }

    subNum(b) {
        return new Vector(this.values[0] - b, this.values[1] - b, this.values[2] - b);
    }

    mult(b) {
        return new Vector(this.values[0] * b.get(0), this.values[1] * b.get(1), this.values[2] * b.get(2));
    }

    multNum(b) {
        return new Vector(this.values[0] * b, this.values[1] * b, this.values[2] * b);
    }

    div(b) {
        return new Vector(this.values[0] / b.get(0), this.values[1] / b.get(1), this.values[2] / b.get(2));
    }

    divNum(b) {
        return new Vector(this.values[0] / b, this.values[1] / b, this.values[2] / b);
    }

    addEq(b) {
        this.values[0] += b.get(0);
        this.values[1] += b.get(1);
        this.values[2] += b.get(2);
    }

    addEqNum(b) {
        this.values[0] += b;
        this.values[1] += b;
        this.values[2] += b;
    }

    subEq(b) {
        this.values[0] -= b.get(0);
        this.values[1] -= b.get(1);
        this.values[2] -= b.get(2);
    }

    subEqNum(b) {
        this.values[0] -= b;
        this.values[1] -= b;
        this.values[2] -= b;
    }

    multEq(b) {
        this.values[0] *= b.get(0);
        this.values[1] *= b.get(1);
        this.values[2] *= b.get(2);
    }

    multEqNum(b) {
        this.values[0] *= b;
        this.values[1] *= b;
        this.values[2] *= b;
    }

    divEq(b) {
        this.values[0] /= b.get(0);
        this.values[1] /= b.get(1);
        this.values[2] /= b.get(2);
    }

    divEqNum(b) {
        this.values[0] /= b;
        this.values[1] /= b;
        this.values[2] /= b;
    }

    //#endregion

    pow(exp) {
        return new Vector(Math.pow(this.values[0], exp), Math.pow(this.values[1], exp), Math.pow(this.values[2], exp));
    }

    sqrt() {
        return new Vector(Math.sqrt(this.values[0]), Math.sqrt(this.values[1]), Math.sqrt(this.values[2]));
    }

    abs() {
        return new Vector(Math.abs(this.values[0]), Math.abs(this.values[1]), Math.abs(this.values[2]));
    }

    squaredLength() {
        return this.values[0] * this.values[0] + this.values[1] * this.values[1] + this.values[2] * this.values[2];
    }

    length() {
        return Math.sqrt(this.squaredLength());
    }

    toArr() {
        return this.values;
    }

    toString() {
        return `${this.values[0]} ${this.values[1]} ${this.values[2]}`;
    }

};

export function dot(a, b) {
    return a.get(0) * b.get(0) + a.get(1) * b.get(1) + a.get(2) * b.get(2);
}

export function dist(a, b) {
    return Math.sqrt(Math.pow(a.get(0) - b.get(0), 2) + Math.pow(a.get(1) - b.get(1), 2) + Math.pow(a.get(2) - b.get(2), 2));
}

export function cross(a, b) {
    return new Vector(a.get(1) * b.get(2) - b.get(1) * a.get(2), 
                      a.get(2) * b.get(0) - b.get(2) * a.get(0),
                      a.get(0) * b.get(1) - b.get(0) * a.get(1));
}

export function normalize(vec = new Vector()) {
    return vec.divNum(vec.length());
}

export function pow(a, b) {
    return new Vector(Math.pow(a.get(0), b.get(0)), Math.pow(a.get(1), b.get(1)), Math.pow(a.get(2), b.get(2)));
}

//#endregion

//#region Matrix
export function degToRad(degrees) {
    return degrees * CONSTANTS.DEG_TO_RAD;
}

export function radToDeg(radians) {
    return radians * CONSTANTS.RAD_TO_DEG;
}

export class Matrix {
    constructor(rows, columns) {
        this.m = new Float32Array(rows * columns);
        this.rows = rows;
        this.columns = columns;
    }

    mult(b = new Matrix(4, 4)) {
        if (this.columns != b.rows) return new Matrix(4, 4);

        let res = new Matrix(this.rows, b.columns), idxOne, idxTwo;
        for (let i = 0; i < res.rows; ++i) {
            idxOne = i * res.columns;
            for (let j = 0; j < res.columns; ++j) {
                idxTwo = idxOne + j;
                res.m[idxTwo] = 0;
                for (let k = 0; k < b.columns; ++k) { 
                    res.m[idxTwo] += b.m[i * b.columns + k] * this.m[k * this.columns + j];
                }
            }
        }

        return res;
    }

    rotateX(radians) {
        let rotation = identityMatrix(4);
        rotation.m[5] = Math.cos(radians);
        rotation.m[6] = Math.sin(radians);
        rotation.m[9] = -rotation.m[6];
        rotation.m[10] = rotation.m[5];
        return this.mult(rotation);
    }

    rotateY(radians) {
        let rotation = identityMatrix(4);
        rotation.m[0] = Math.cos(radians);
        rotation.m[2] = -Math.sin(radians);
        rotation.m[8] = -rotation.m[2];
        rotation.m[10] = rotation.m[0];
        return this.mult(rotation);
    }

    rotateZ(radians) {
        let rotation = identityMatrix(4);
        rotation.m[0] = Math.cos(radians);
        rotation.m[1] = Math.sin(radians);
        rotation.m[4] = -rotation.m[1];
        rotation.m[5] = rotation.m[0];
        return this.mult(rotation);
    }
 
    translate(a = new Vector()) {
        let translation = identityMatrix(4);
        translation.m[12] = a.get(0);
        translation.m[13] = a.get(1);
        translation.m[14] = a.get(2);
        return this.mult(translation);
    }
    
    rotate(xyzRotation = new Vector()) {
        return this.rotateX(xyzRotation.get(0)).rotateY(xyzRotation.get(1)).rotateZ(xyzRotation.get(2));
    }

    scale(xyzScale = new Vector()) {
        let scale = new Matrix(4, 4);
        for (let i = 0; i < 3; ++i) {
            scale.m[i * 5] = xyzScale.get(i);
        }

        scale.m[15] = 1;
        return this.mult(scale);
    }
};

export function vecToMatrix(t = new Vector()) {
    let res = new Matrix(4, 1);
    res.m[0][0] = t.get(0);
    res.m[1][0] = t.get(1);
    res.m[2][0] = t.get(2);
    res.m[3][0] = 1.0;

    return res;
}

export function matrixToVec(mat = new Matrix(4, 4)) {
    return new Vector(mat.m[0][0], mat.m[1][0], mat.m[2][0]);
}

export function identityMatrix(n) {
    let res = new Matrix(n, n);
    res.m = Float32Array.from([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]);
    return res;
}

export function transpose(mat = new Matrix(4, 4)) {
    let temp, idxOne, idxTwo;

    for (let i = 0; i < mat.rows - 1; ++i) {
        idxOne = i * mat.columns;
        for (let j = i + 1; j < mat.rows; ++j) {
            idxTwo = j * mat.columns + i;
            temp = mat.m[idxOne + j];
            mat.m[idxOne + j] = mat.m[idxTwo];
            mat.m[idxTwo] = temp;
        }
    }

    return mat;
}

let A2323, A1323, A1223, A0323, A0223, A0123, A2313, A1313, A1213, A2312, A1312, A1212, A0313, A0213, A0312, A0212, A0113, A0112, det;
export function inverse4x4(mat = new Matrix(4, 4)) {
    A2323 = mat.m[10] * mat.m[15] - mat.m[11] * mat.m[14];
    A1323 = mat.m[9] * mat.m[15] - mat.m[11] * mat.m[13];
    A1223 = mat.m[9] * mat.m[14] - mat.m[10] * mat.m[13];
    A0323 = mat.m[8] * mat.m[15] - mat.m[11] * mat.m[12];
    A0223 = mat.m[8] * mat.m[14] - mat.m[10] * mat.m[12];
    A0123 = mat.m[8] * mat.m[13] - mat.m[9] * mat.m[12];
    A2313 = mat.m[6] * mat.m[15] - mat.m[7] * mat.m[14];
    A1313 = mat.m[5] * mat.m[15] - mat.m[7] * mat.m[13];
    A1213 = mat.m[5] * mat.m[14] - mat.m[6] * mat.m[13];
    A2312 = mat.m[6] * mat.m[11] - mat.m[7] * mat.m[10];
    A1312 = mat.m[5] * mat.m[11] - mat.m[7] * mat.m[9];
    A1212 = mat.m[5] * mat.m[10] - mat.m[6] * mat.m[9];
    A0313 = mat.m[4] * mat.m[15] - mat.m[7] * mat.m[12];
    A0213 = mat.m[4] * mat.m[14] - mat.m[6] * mat.m[12];
    A0312 = mat.m[4] * mat.m[11] - mat.m[7] * mat.m[8];
    A0212 = mat.m[4] * mat.m[10] - mat.m[6] * mat.m[8];
    A0113 = mat.m[4] * mat.m[13] - mat.m[5] * mat.m[12];
    A0112 = mat.m[4] * mat.m[9] - mat.m[5] * mat.m[8];

    det = 1.0 / (mat.m[0] * (mat.m[5] * A2323 - mat.m[6] * A1323 + mat.m[7] * A1223) 
              - mat.m[1] * (mat.m[4] * A2323 - mat.m[6] * A0323 + mat.m[7] * A0223) 
              + mat.m[2] * (mat.m[4] * A1323 - mat.m[5] * A0323 + mat.m[7] * A0123) 
              - mat.m[3] * (mat.m[4] * A1223 - mat.m[5] * A0223 + mat.m[6] * A0123));

    let p = new Matrix(4, 4);
    p.m[0] = det * (mat.m[5] * A2323 - mat.m[6] * A1323 + mat.m[7] * A1223);
    p.m[1] = det * -(mat.m[1] * A2323 - mat.m[2] * A1323 + mat.m[3] * A1223);
    p.m[2] = det * (mat.m[1] * A2313 - mat.m[2] * A1313 + mat.m[3] * A1213);
    p.m[3] = det * -(mat.m[1] * A2312 - mat.m[2] * A1312 + mat.m[3] * A1212);
    p.m[4] = det * -(mat.m[4] * A2323 - mat.m[6] * A0323 + mat.m[7] * A0223);
    p.m[5] = det * (mat.m[0] * A2323 - mat.m[2] * A0323 + mat.m[3] * A0223);
    p.m[6] = det * -(mat.m[0] * A2313 - mat.m[2] * A0313 + mat.m[3] * A0213);
    p.m[7] = det * (mat.m[0] * A2312 - mat.m[2] * A0312 + mat.m[3] * A0212);
    p.m[8] = det * (mat.m[4] * A1323 - mat.m[5] * A0323 + mat.m[7] * A0123);
    p.m[9] = det * -(mat.m[0] * A1323 - mat.m[1] * A0323 + mat.m[3] * A0123);
    p.m[10] = det * (mat.m[0] * A1313 - mat.m[1] * A0313 + mat.m[3] * A0113);
    p.m[11] = det * -(mat.m[0] * A1312 - mat.m[1] * A0312 + mat.m[3] * A0112);
    p.m[12] = det * -(mat.m[4] * A1223 - mat.m[5] * A0223 + mat.m[6] * A0123);
    p.m[13] = det * (mat.m[0] * A1223 - mat.m[1] * A0223 + mat.m[2] * A0123);
    p.m[14] = det * -(mat.m[0] * A1213 - mat.m[1] * A0213 + mat.m[2] * A0113);
    p.m[15] = det * (mat.m[0] * A1212 - mat.m[1] * A0212 + mat.m[2] * A0112);
    mat = null;
    
    return p;
}

export function matrix4x4to3x3(mat = new Matrix(4, 4)) {
    let res = new Matrix(3, 3);
    for (let i = 0; i < 3; ++i) {
        for (let j = 0; j < 3; ++j) {
            res.m[i * res.columns + j] = mat.m[i * res.columns + j];
        }
    }

    return res;
}

//#endregion

//#region Camera
export class Camera {
    origin = new Vector();
    target = new Vector();
    up = new Vector();
    perspective = new Matrix(4, 4);
    yaw = 0;
    pitch = 0;
    translation = new Vector(0, 0, 0);
    movementSpeed = 80;
    sensitivity = 10;
    cameraMatrix = new Matrix(4, 4);

    calcDistFromOrigin(x, y) {
        return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    }

    constructor(zNear, zFar, aspectRatio, FOV, origin, target, up = new Vector(0, 1, 0), movementSpeed = 80, sensitivity = 8) {
        this.origin = origin;
        this.translation = new Vector(0, 0, 0);
        this.target = target;
        this.up = up;
        this.FOV = degToRad(FOV);
        this.movementSpeed = movementSpeed;
        this.sensitivity = this.FOV * 2.0 * Math.PI * sensitivity;
                                   
        this.perspective = new Matrix(4, 4);
        const f = Math.tan(0.5 * this.FOV), depthFactor = zFar / (zNear - zFar);
    
        this.perspective.m[0] = f / aspectRatio;
        this.perspective.m[5] = f;
        this.perspective.m[10] = depthFactor;
        this.perspective.m[11] = -1;
        this.perspective.m[14] = zNear * depthFactor;

        this.cameraMatrix = new Matrix(4, 4);
        const z = normalize(this.origin.sub(this.target)), x = normalize(cross(this.up, z)), y = normalize(cross(z, x));
        this.cameraMatrix.m[0] = x.get(0), this.cameraMatrix.m[1] = x.get(1), this.cameraMatrix.m[2] = x.get(2);
        this.cameraMatrix.m[4] = y.get(0), this.cameraMatrix.m[5] = y.get(1), this.cameraMatrix.m[6] = y.get(2);
        this.cameraMatrix.m[8] = z.get(0), this.cameraMatrix.m[9] = z.get(1), this.cameraMatrix.m[10] = z.get(2);
        this.cameraMatrix.m[12] = this.origin.get(0), this.cameraMatrix.m[13] = this.origin.get(1);
        this.cameraMatrix.m[14] = this.origin.get(2), this.cameraMatrix.m[15] = 1;
    }

    static auto(zNear, dimensions, FOV, origin, up = new Vector(0, 1, 0)) {
        const camOrigin = new Vector(0, 0, 0),
              camTarget = camOrigin.add(new Vector(0, 0, -1));

        let camera = new Camera(zNear, dimensions.get(2), dimensions.get(0) / dimensions.get(1), FOV, camOrigin, camTarget, up);
        camera.translation = origin;
        camera.origin = dimensions.mult(new Vector(0.5, 1, 0));
        return camera;
    }

    move(delta, deltaTime) {
        const x = normalize(new Vector(Math.cos(this.yaw), 0, -Math.sin(this.yaw))), z = normalize(cross(this.up, x));

        this.translation.addEq(z.multNum(delta.get(2)).add(x.multNum(delta.get(0))).add(this.up.multNum(delta.get(1)))
                               .multNum(deltaTime * this.movementSpeed));
    }

    rotate(deltaX, deltaY, deltaTime) {
        this.yaw = this.yaw - deltaX * deltaTime * this.sensitivity;
        this.pitch = Math.max(-Math.PI * 0.5, Math.min(Math.PI * 0.5, this.pitch + deltaY * deltaTime * this.sensitivity));
    }

    getPerspective() {
        return this.perspective;
    }

    getWorld() {
        return (this.cameraMatrix.rotateY(this.yaw).rotateX(this.pitch));
    }

    getView() {
        return inverse4x4(this.cameraMatrix.translate(this.translation).rotateY(this.yaw).rotateX(this.pitch));
    }

    updateUniforms(structName, gpu, ids = { perspective: "perspective", camPos: "cameraPosition", world: "world" }) {
        gpu.setGlobalUniform(structName, ids.perspective, this.perspective.mult(this.getView()).m);
        gpu.setGlobalUniform(structName, ids.world, this.getWorld().m);
        gpu.setGlobalUniform(structName, ids.camPos, this.origin.toArr());
    }
}

export function orthographic(min, max) {
    let o = new Matrix(4, 4);
    o.m[0][0] = 2 / (max.get(0) - min.get(0));
    o.m[1][1] = 2 / (min.get(1) - max.get(1));
    o.m[2][2] = 1 / (max.get(2) - min.get(2));

    o.m[3][0] = (max.get(0) + min.get(0)) / (min.get(0) - max.get(0));
    o.m[3][1] = (max.get(1) + min.get(1)) / (max.get(1) - min.get(1));
    o.m[3][2] = max.get(2) / (max.get(2) - min.get(2));
    o.m[3][3] = 1;

    return o;
}

//#endregion

//#region Utilities
export class Color extends Vector {
    constructor(r, g, b) {
        super(Math.max(0.0, Math.min(1.0, r * CONSTANTS.RGB_MULT)),
              Math.max(0.0, Math.min(1.0, g * CONSTANTS.RGB_MULT)),
              Math.max(0.0, Math.min(1.0, b * CONSTANTS.RGB_MULT)));
    }

    toRGBObject() {
        return { r: this.values[0], g: this.values[1], b: this.values[2], a: 1.0 };
    }
}

export class Vertex {
    constructor(xyz = new Vector(0, 0, 0), color = new Color(255, 255, 255), textureCoords = null, normal = null) {
        this.position = xyz;
        this.color = color;
        this.textureCoords = textureCoords;
        this.normal = normal;
    }

    toArray() {
        if (!this.normal) {
            return Float32Array.from([ this.position.get(0), this.position.get(1), this.position.get(2), 1.0, 
                                       this.color.get(0), this.color.get(1), this.color.get(2), 1.0 ]);
        } else {
            return Float32Array.from([ this.position.get(0), this.position.get(1), this.position.get(2), 1.0, 
                                       this.color.get(0), this.color.get(1), this.color.get(2), 1.0,
                                       this.normal.get(0), this.normal.get(1), this.normal.get(2), 1.0 ]);
        }
    }
}

//#endregion

export class RenderPass {
    name = null;
    renderPipeline = null;
    vertexBuffer = null;
    uniforms = { };
    textureData = null;
    shader = null;
    drawCounts = null;
    bindGroup = null;
    renderDescription = {
        colorAttachments: [{
            loadOp: "load",
            storeOp: "store",
            view: null
        }], depthStencilAttachment: {
            depthClearValue: 1.0,
            depthLoadOp: "load",
            depthStoreOp: "store",
            view: null
        }
    };

    constructor(name, clearColor) {
        this.name = name;
        this.renderPipeline = null;
        this.vertexSize = 0;
        this.renderDescription.colorAttachments[0].clearValue = clearColor.toRGBObject();
        this.drawCounts = { vertex: null, instance: 1 };
    }
    
    async initialize(device, settings, description = null) {
        let shaderSrc = await (await fetch(`Shaders\\${settings.url}`)).text();
        
        let parseVariable = (name, type, bindingIndex) => {
            const startingIndex = shaderSrc.indexOf('{', shaderSrc.indexOf(`struct ${type}`));
            const structStr = shaderSrc.substring(startingIndex, shaderSrc.indexOf('}', startingIndex) + 1);
            let struct = JSON.parse(structStr.replaceAll("\r\n", '"').replaceAll(',', '",')
                                    .replaceAll("    ", '').replaceAll(" ", '"'));

            let offsetSum = 0, variable = { binding: bindingIndex, buffer: null, values: null, offsets: {  } };
            for (let property in struct) {
                variable.offsets[property] = offsetSum;
                switch (struct[property]) {
                    case "mat4x4f": offsetSum += 16; break;
                    case "mat3x3f": offsetSum += 12; break;
                    case "f32": 
                    case "u32": offsetSum += 1; break;
                    case "vec2f": offsetSum += 2; break;
                    case "vec3f": offsetSum += 3; break;
                    case "vec4f": offsetSum += 4; break;
                    default: break; //Add more data types later
                }
            }

            variable.buffer = device.createBuffer({ 
                size: offsetSum * 4, 
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST 
            });
            
            variable.values = new Float32Array(offsetSum);
            this.uniforms[name] = variable;
        }

        let file = shaderSrc, index = file.indexOf("@group"), varName, varType, binding;
        while (index != -1) {
            index = file.indexOf("var");
            let bindIndex = file.indexOf("binding(") + 8;
            binding = Number.parseInt(file.substring(bindIndex, file.indexOf(')', bindIndex)));
            file = file.substring(index + 3).trimStart();
            if (file.indexOf("<uniform>") == 0) file = file.substring(9);

            let colonIndex = file.indexOf(":");

            varName = file.substring(0, colonIndex).trim();
            varType = file.substring(colonIndex + 1, file.indexOf(';', colonIndex)).trim();

            switch (varType) {
                case "texture_2d<f32>": 
                    if (!this.textureData) this.textureData = { texture: {  }, data: null, sampler: { } };
                    this.textureData.texture.binding = binding;
                    break;
                case "sampler":
                    if (!this.textureData) this.textureData = { texture: {  }, data: null, sampler: { } };
                    this.textureData.sampler.binding = binding;
                    break;
                default:
                    parseVariable(varName, varType, binding);
            }

            index = file.indexOf("@group");
        }

        for (let i = 0; i < settings.libraries.length; ++i) {
            shaderSrc = await (await fetch(`Shaders\\${settings.libraries[i]}`)).text() + "\n" + shaderSrc;
        }

        for (let i = 0; i < settings.constants.length; ++i) {
            shaderSrc = `const ${settings.constants[i].name} = ${settings.constants[i].value};\n` + shaderSrc;
        }

        this.shader = device.createShaderModule({ label: this.name + "-shader", code: shaderSrc });
        this.vertexSize = settings.attributes[0].arrayStride;
        if (!description) {
            description = {
                layout: "auto",
                vertex: {
                    module: this.shader,
                    entryPoint: "vertexMain",
                    buffers: settings.attributes
                }, 

                fragment: {
                    module: this.shader,
                    entryPoint: "fragmentMain",
                    targets: [{ format: settings.canvasFormat }]
                },

                primitive: {
                    topology: "triangle-list"
                },

                depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                    format: 'depth24plus'
                },

                multisample: {
                    count: 4
                }
            };
        } else {
            description.vertex.module = this.shader;
            description.fragment.module = this.shader;
            description.fragment.targets = [{ format: settings.canvasFormat }];
            description.multisample = {
                count: 4
            }
        }
        
        this.renderPipeline = device.createRenderPipeline(description);
        
        if (!this.textureData) {
            let bindingEntries = [];
            for (let obj in this.uniforms) {
                bindingEntries.push({ binding: this.uniforms[obj].binding, resource: { buffer: this.uniforms[obj].buffer } });
            }
            
            this.bindGroup = device.createBindGroup({
                label: "bindings",
                layout: this.renderPipeline.getBindGroupLayout(0),
                entries: bindingEntries
            });
        }
    }

    createVertexBuffer(device, vertices, flags = GPUBufferUsage.COPY_DST) {
        this.vertexBuffer = device.createBuffer({ size: vertices.byteLength, usage: GPUBufferUsage.VERTEX | flags });
        device.queue.writeBuffer(this.vertexBuffer, 0, vertices, 0, vertices.length);
    }

    autoVertexCount() {
        this.drawCounts.vertex = this.vertexBuffer.size / this.vertexSize;
    }

    setModelCount(vertexCount, instanceCount) {
        if (vertexCount != null) this.drawCounts.vertex = vertexCount;
        if (instanceCount != null) this.drawCounts.instance = instanceCount;
    }

    async setTexture(device, settings) {
        if (this.textureData != null && this.textureData.data != null) {
            this.textureData.texture.data.destroy();
            this.textureData.sampler.data.destroy();
            this.textureData.data = null;
            this.textureData.texture.data = null;
            this.textureData.sampler.data = null;
        }

        const response = await (await fetch(`Resources\\${settings.url}`)).blob();
        let data = await createImageBitmap(response, { colorSpaceConversion: "none" });

        this.textureData.texture.data = device.createTexture({
            label: `${this.name}-${settings.name}-texture`,
            format: 'rgba8unorm',
            size: [ data.width, data.height ],
            //mipLevelCount: mips.length,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });

        this.textureData.sampler.data = device.createSampler(!settings.samplerInfo ? {
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
            magFilter: "nearest"
        } : settings.samplerInfo);

        device.queue.copyExternalImageToTexture(
            { source: data },
            { texture: this.textureData.texture.data },
            [ data.width, data.height ]
        );

        this.textureData.data = this.textureData.texture.data.createView();
        let bindingEntries = [];

        for (let obj in this.uniforms) {
            bindingEntries.push({ binding: this.uniforms[obj].binding, resource: { buffer: this.uniforms[obj].buffer } });
        }

        if (this.textureData != null) {
            bindingEntries.push({ binding: this.textureData.texture.binding, resource: this.textureData.data });
            bindingEntries.push({ binding: this.textureData.sampler.binding, resource: this.textureData.sampler.data });
        }
        
        this.bindGroup = device.createBindGroup({
            label: "bindings",
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: bindingEntries
        });
    }

    setUniform(device, name, variableName, values) {
        this.uniforms[name].values.set(values, this.uniforms[name].offsets[variableName]);
        device.queue.writeBuffer(this.uniforms[name].buffer, 0, this.uniforms[name].values);
    }

    render(device) {
        let encoder = device.createCommandEncoder(), pass = encoder.beginRenderPass(this.renderDescription);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setPipeline(this.renderPipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.draw(this.drawCounts.vertex, this.drawCounts.instance);
        pass.end();
        
        return encoder.finish();
    }

}

export class ComputeShader {
    name = null;
    shader = null;
    bindGroup = null;
    computePipeline = null;
    mappedBuffers = {};
    mappedTexture = { binding: null, canvas: null, context: null, size: null };
    gpuStorage = {};
    uniforms = {};
    dispatchSize = new Vector(1, 1, 1);

    constructor(name, textureMapSize = null) {
        this.name = name;
        this.mappedTexture.size = textureMapSize;
    }

    initTexture(device) {
        this.mappedTexture.canvas = document.createElement("canvas");
        this.mappedTexture.context = this.mappedTexture.canvas.getContext("webgpu");
        this.mappedTexture.canvas.width = this.mappedTexture.size[0];
        this.mappedTexture.canvas.height = this.mappedTexture.size[1];
        this.mappedTexture.context.configure({
            device,
            format: "r32float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
        });

        this.mappedTexture.canvas.style = "position: absolute; top: 0; left: 0; width: 25vw; height: 25vh;";
        document.body.appendChild(this.mappedTexture.canvas);
    }
    
    parseVariable(device, shaderSrc, name, type, bindingIndex, usage) {
        const startingIndex = shaderSrc.indexOf('{', shaderSrc.indexOf(`struct ${type}`));
        const structStr = shaderSrc.substring(startingIndex, shaderSrc.indexOf('}', startingIndex) + 1);
        let struct = JSON.parse(structStr.replaceAll("\r\n", '"').replaceAll(',', '",')
                                .replaceAll("    ", '').replaceAll(" ", '"'));

        if (usage == "uniform") {
            let offsetSum = 0, variable = { binding: bindingIndex, buffer: null, values: null, offsets: {  } };
            for (let property in struct) {
                variable.offsets[property] = offsetSum / 4;
                switch (struct[property]) {
                    case "mat4x4f": offsetSum += 64; break;
                    case "mat3x3f": offsetSum += 48; break;
                    case "f32": 
                    case "u32": offsetSum += 4; break;
                    case "vec2f": offsetSum += 8; break;
                    case "vec3f": offsetSum += 12; break;
                    case "vec4f": offsetSum += 16; break;
                    default: break; //Add more data types later
                }
            }

            variable.buffer = device.createBuffer({ 
                size: offsetSum, 
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST 
            });
            
            variable.values = new Float32Array(offsetSum / 4);
            this.uniforms[name] = variable;
        } else if (name.indexOf('_') == 0) {
            let variable = { binding: bindingIndex, storageBuffer: null, mappedBuffer: null, values: new Float32Array(0) };
            variable.storageBuffer = device.createBuffer({
                size: Math.pow(4, 12),
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
            });

            variable.mappedBuffer = device.createBuffer({
                size: Math.pow(4, 12),
                usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
            });

            this.mappedBuffers[name.substring(1)] = variable;
        } else {
            let variable = { binding: bindingIndex, buffer: null };
            if (type.indexOf("array") == -1) {
                variable.buffer = device.createBuffer({
                    size: 4,
                    usage: GPUBufferUsage.STORAGE
                });
            } else {
                variable.buffer = device.createBuffer({
                    size: 4 * 35 * 35 * 35,
                    usage: GPUBufferUsage.STORAGE
                });
            }

            this.gpuStorage[name] = variable;
        }
    }

    async initialize(device, settings, description = null) {
        let shaderSrc = await (await fetch(`Shaders\\${settings.url}`)).text();
        this.shader = device.createShaderModule({ label: this.name + "-shader", code: shaderSrc });

        let file = shaderSrc, index = file.indexOf("@group"), varName, varType, binding, usageType, bindIndex, colonIndex;
        while (index != -1) {
            index = file.indexOf("var");
            bindIndex = file.indexOf("binding(") + 8;
            binding = Number.parseInt(file.substring(bindIndex, file.indexOf(')', bindIndex)));
            file = file.substring(index + 3).trimStart();
            if (file.indexOf("<uniform>") == 0) {
                file = file.substring(9);
                usageType = "uniform";
            } else if (file.indexOf("<storage") == 0) {
                usageType = "storage";
                if (file.indexOf("read_write") != -1) usageType = "storageRW";
                file = file.substring(file.indexOf(">") + 1);
            }
            
            colonIndex = file.indexOf(":");
            varName = file.substring(0, colonIndex).trim();
            varType = file.substring(colonIndex + 1, file.indexOf(';', colonIndex)).trim();

            switch (varType) {
                case "atomic<u32>":
                    this.gpuStorage[varName] = { 
                        binding: binding, 
                        buffer: device.createBuffer({ size: 4, usage: GPUBufferUsage.STORAGE }) 
                    };
                    break;
                case "texture_2d<f32>": 
                    if (!this.textureData) this.textureData = { texture: {  }, data: null, sampler: { } };
                    this.textureData.texture.binding = binding;
                    break;
                case "sampler":
                    if (!this.textureData) this.textureData = { texture: {  }, data: null, sampler: { } };
                    this.textureData.sampler.binding = binding;
                    break;
                default:
                    this.parseVariable(device, shaderSrc, varName, varType, binding, usageType, settings.canvasFormat);
            }

            index = file.indexOf("@group");
        }

        if (!description) {
            description = {
                label: `${this.name}-computePipeline`,
                layout: "auto",
                compute: {
                    module: this.shader,
                    entryPoint: "computeMain"
                }, 
            };
        } 
        
        this.computePipeline = device.createComputePipeline(description);
        
        let bindingEntries = [];
        for (let obj in this.uniforms) {
            bindingEntries.push({ binding: this.uniforms[obj].binding, resource: { buffer: this.uniforms[obj].buffer } });
        }

        for (let obj in this.mappedBuffers) {
            bindingEntries.push({ binding: this.mappedBuffers[obj].binding, 
                                  resource: { buffer: this.mappedBuffers[obj].storageBuffer } 
            });
        }

        for (let obj in this.gpuStorage) {
            bindingEntries.push({ binding: this.gpuStorage[obj].binding, 
                                  resource: { buffer: this.gpuStorage[obj].buffer }});
        }
        
        this.bindGroup = device.createBindGroup({
            label: `${this.name}-compute-bindings`,
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: bindingEntries
        });
    }

    setUniform(device, name, variableName, values) {
        this.uniforms[name].values.set(values, this.uniforms[name].offsets[variableName]);
        device.queue.writeBuffer(this.uniforms[name].buffer, 0, this.uniforms[name].values);
    }

    setDispatchSize(v) {
        this.dispatchSize = v;
    }

    async compute(device) {
        let encoder = device.createCommandEncoder(), pass = encoder.beginComputePass();
        pass.setPipeline(this.computePipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.dispatchWorkgroups(this.dispatchSize.get(0), this.dispatchSize.get(1), this.dispatchSize.get(2));
        pass.end();

        for (let obj in this.mappedBuffers) {
            encoder.copyBufferToBuffer(this.mappedBuffers[obj].storageBuffer, 0, 
                                       this.mappedBuffers[obj].mappedBuffer, 0, Math.pow(4, 12));
        }

        await device.queue.submit([encoder.finish()]);
        for (let obj in this.mappedBuffers) {
            await this.mappedBuffers[obj].mappedBuffer.mapAsync(GPUMapMode.READ);
            this.mappedBuffers[obj].values = new Float32Array(this.mappedBuffers[obj].mappedBuffer.getMappedRange());
            this.mappedBuffers[obj].values = this.mappedBuffers[obj].values.subarray(1, this.mappedBuffers[obj].values[0]);
            console.log(this.mappedBuffers[obj].values.length / 6.0 + " Vertices");
        }
    }

    getResults(name, preserve = true) {
        let res = new Float32Array();
        res = this.mappedBuffers[name].values;
        if (!preserve) this.mappedBuffers[name].values = null;
        return res;
    }

    getTexture() {
        return this.mappedTexture;
    }

    clear() {
        this.mappedBuffers = null;
        this.uniforms = null;
        this.name = null;
        this.shader = null;
        this.bindGroup = null;
        this.computePipeline = null;
    }
}

export class GPU {
    gpuLink = null;
    device = null;
    adapter = null;
    clearColor = new Color(0, 0, 0);
    passes = null;
    lastPassKey = null; //The JSON key of the latest pass
    constants = [];
    libraries = [];
    commandBuffers = [];
    renderTextures = { color: null, depth: null };
    
    constructor(clearColor = new Color(0, 0, 0)) {
        this.clearColor = clearColor;
        this.passes = {  };
    }

    addConstants(constants) {
        for (let constantName in constants) {
            this.constants.push({ name: constantName, value: constants[constantName] });
        }
    }

    addLibrary(url) {
        this.libraries.push(url);
    }

    static async initialize() {
        let gpu = new GPU();
        gpu.gpuLink = navigator.gpu;
        if (!gpu.gpuLink) {
            console.log("WebGPU not supported!");
            return null;
        }

        gpu.adapter = await gpu.gpuLink.requestAdapter();
        if (!gpu.adapter) {
            console.log("GPU Adapter cannot be retrieved!");
            return null;
        }

        gpu.device = await gpu.adapter.requestDevice();
        if (!gpu.device) {
            console.error("GPU Device cannot be retrieved!");
            return null;
        }
        
        gpu.device.lost.then((info) => {
            throw new Error(`GPU was lost: ${info.message}`);
        });

        return gpu;
    }

    getCanvasFormat() {
        return this.gpuLink.getPreferredCanvasFormat();
    }

    async createPass(settings, description = null) {
        let pass = new RenderPass(settings.name, this.clearColor);
        if (!settings.attributes) {
            settings.attributes = [{
                attributes: [{
                    shaderLocation: 0, //Position
                    offset: 0,
                    format: "float32x4",
                }, {
                    shaderLocation: 1, //Color
                    offset: 16,
                    format: "float32x4",
                }], arrayStride: 32, stepMode: "vertex"
            }];
        }

        settings.canvasFormat = this.getCanvasFormat();
        settings.constants = this.constants;
        settings.libraries = this.libraries;
        await pass.initialize(this.device, settings, description);
        this.passes[settings.name] = pass;
        this.lastPassKey = settings.name;
        if (Object.keys(this.passes).length == 1) { //First pass always clears canvas
            this.passes[settings.name].renderDescription.colorAttachments[0].loadOp = "clear";
            this.passes[settings.name].renderDescription.depthStencilAttachment.depthLoadOp = "clear";
        }

        return pass;
    }

    setUniform(passName, structName, propertyName, value) {
        this.passes[passName].setUniform(this.device, structName, propertyName, value);
    }
    
    setGlobalUniform(name, variableName, values) {
        for (let passName in this.passes) {
            this.passes[passName].setUniform(this.device, name, variableName, values);
        }
    }

    setVertexBuffer(passName, vertices, flags = GPUBufferUsage.COPY_DST) {
        this.passes[passName].createVertexBuffer(this.device, vertices, flags);
    }

    autoVertexCount(passName) {
        this.passes[passName].autoVertexCount();
    }

    async setTexture(passName, settings) {
        await this.passes[passName].setTexture(this.device, settings);
    }

    setModelCount(passName, vertexCount, instanceCount) {
        this.passes[passName].setModelCount(vertexCount, instanceCount);
    }

    getPass(name) {
        return this.passes[name];
    }

    setRenderView(display, color, depth) {
        this.renderTextures.color = color;
        this.renderTextures.depth = depth;
        this.passes[this.lastPassKey].renderDescription.colorAttachments[0].resolveTarget = display;
    }

    renderFrame() {
        for (let name in this.passes) {
            this.passes[name].renderDescription.colorAttachments[0].view = this.renderTextures.color;
            this.passes[name].renderDescription.depthStencilAttachment.view = this.renderTextures.depth;

            if (this.commandBuffers.push(this.passes[name].render(this.device)) == 20) {
                this.device.queue.submit(this.commandBuffers);
                this.commandBuffers = [];
            }
        }

        this.device.queue.submit(this.commandBuffers);
        this.commandBuffers = [];
    }
}