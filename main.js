import * as util from "./utilities.js";
import * as shapes from "./shapes.js";


class Renderer {
    widthRange = document.body.clientWidth * 0.05;
    KEY_BINDINGS = { 'q': new util.Vector(0, 1, 0), 'e': new util.Vector(0, -1, 0), 'w': new util.Vector(0, 0, 1),
                     's': new util.Vector(0, 0, -1), 'd': new util.Vector(1, 0, 0), 'a': new util.Vector(-1, 0, 0)
    };
    
    updateRenderTargets() {
        if (!this.context) return;
        const texture = this.context.getCurrentTexture();

        if (!this.depthTexture || this.depthTexture.width != texture.width || this.depthTexture.height != texture.height) {
            if (this.depthTexture) this.depthTexture.destroy();
            this.depthTexture = this.gpu.device.createTexture({
                size: [texture.width, texture.height],
                format: 'depth24plus',
                sampleCount: 4,
                usage: GPUTextureUsage.RENDER_ATTACHMENT
            });
        }

        if (!this.msaaTexture || this.msaaTexture.width != texture.width || this.msaaTexture.height != texture.height) {
            if (this.msaaTexture) this.msaaTexture.destroy();
            this.msaaTexture = this.gpu.device.createTexture({
                size: [texture.width, texture.height],
                format: texture.format,
                sampleCount: 4,
                usage: GPUTextureUsage.RENDER_ATTACHMENT
            });
        }
    }

    static resizeCanvas(ev, obj) {
        obj.canvas.width = document.body.clientWidth;
        obj.canvas.height = document.body.clientHeight;
        obj.dimensions.set(0, document.body.clientWidth);
        obj.dimensions.set(1, document.body.clientHeight);
        obj.updateRenderTargets();
    }

    async controlMouse(ev = new MouseEvent()) {
        this.deviceInfo.mouseX = ev.clientX, this.deviceInfo.mouseY = ev.clientY;
        
        if (ev.clientX > this.widthRange && ev.clientX < this.dimensions.get(0) - this.widthRange) {
            this.deviceInfo.camAngleX -= ev.movementY;
            this.deviceInfo.camAngleY += ev.movementX; 
        }
    }

    controlMovement(ev) {
        if (this.KEY_BINDINGS[ev.key] != undefined) this.deviceInfo.camPosition.addEq(this.KEY_BINDINGS[ev.key]);
    }

    constructor(gpu = new util.GPU(), depth = 1200) {
        this.gpu = gpu;
        this.canvas = document.createElement("canvas");
        this.canvas.style = "width: 100vw; height: 100vh;";
        this.dimensions = new util.Vector(this.canvas.width, this.canvas.height, depth);
        Renderer.resizeCanvas(null, this);

        this.fpsCounter = null;
        this.deviceInfo = { camAngleX: 0, camAngleY: 0, camPosition: new util.Vector(0, 0, 0), timestamp: 0,
                            mouseX: this.dimensions.get(0) * 0.5, mouseY: this.dimensions.get(2) * 0.5 };
        this.camera = util.Camera.auto(1, this.dimensions, 100, new util.Vector(0, 10, 0));
        this.context = this.canvas.getContext("webgpu");
        this.depthTexture = null;
        this.msaaTexture = null;
        this.context.configure({
            device: this.gpu.device,
            format: this.gpu.getCanvasFormat(),
            alphaMode: "premultiplied"
        });

        document.body.appendChild(this.canvas);
        document.body.addEventListener("resize", () => { Renderer.resizeCanvas(null, this); }, { passive: true });
        this.canvas.addEventListener("touchmove", ev => this.controlMouse(ev), { passive: true }); 
        this.canvas.addEventListener("mousemove", ev => this.controlMouse(ev), { passive: true, capture: true }); 
        document.body.addEventListener("keydown", ev => this.controlMovement(ev), { passive: true, capture: true });
    }

    async createPass(name, url, attributes = null, description = null) {
        return await this.gpu.createPass({
            name: name,
            url: url,
            attributes: attributes
        }, description);
    }

    updateCamera(deltaTime) {
        this.camera.move(this.deviceInfo.camPosition, deltaTime);
        if (this.deviceInfo.mouseX <= this.dimensions.get(0) * 0.05)
            this.deviceInfo.camAngleY -= 10;
        else if (this.deviceInfo.mouseX >= this.dimensions.get(0) * 0.95)
            this.deviceInfo.camAngleY += 10;

        this.camera.rotate(this.deviceInfo.camAngleY / this.dimensions.get(0), 
                           this.deviceInfo.camAngleX / this.dimensions.get(1), deltaTime);

        this.deviceInfo.camAngleX = 0, this.deviceInfo.camAngleY = 0, this.deviceInfo.camPosition = new util.Vector(0, 0, 0);
        this.camera.updateUniforms("sceneInfo", this.gpu);
    }

    async renderFrame(timestamp, fpsUpdateCycle = 1, fpsFrequencySum = 0) {
        const texture = this.context.getCurrentTexture(), deltaTime = timestamp - this.deviceInfo.timestamp;
        this.deviceInfo.timestamp = timestamp;
        this.gpu.setRenderView(texture.createView(), this.msaaTexture.createView(), this.depthTexture.createView());
        this.updateCamera(deltaTime);
        
        this.gpu.setUniform("grass", "grassInfo", "time", [timestamp]);
        this.gpu.renderFrame();

        if (fpsUpdateCycle == 10) {
            this.fpsCounter.textContent = (10.0 / fpsFrequencySum).toFixed(0) + " FPS";
            fpsFrequencySum = 0;
            fpsUpdateCycle = 0;
        }

        requestAnimationFrame(time => { 
            if (this.fpsCounter != null)
                this.renderFrame(time * 0.001, ++fpsUpdateCycle, fpsFrequencySum + deltaTime);
            else 
                this.renderFrame(time * 0.001);
         });
    }

    async render() {
        this.updateRenderTargets();
        requestAnimationFrame((time) => {
            this.renderFrame(time * 0.001);
        });
    }

    toggleFPS() {
        if (!this.fpsCounter) {
            this.fpsCounter = document.createElement("div");
            this.fpsCounter.className = "fps-counter";
            this.fpsCounter.textContent = "0 FPS";
            document.body.appendChild(this.fpsCounter);
        } else {
            document.body.removeChild(this.fpsCounter);
            this.fpsCounter = null;
        }
    }
}

class Grass {
    patchWidth = 0;
    patchLength = 0;
    grassWidth = 1;
    grassHeight = 8;
    xCount = 0;
    zCount = 0;
    maxSegments = 0;
    offset = new util.Vector(0, 0, 0);
    renderPass = null;

    constructor(grassDimensions, patchDimensions, patchDensities, offset = new util.Vector(0, 0, 0), maxSegments = 12) {
        this.patchWidth = patchDimensions.get(0);
        this.patchLength = patchDimensions.get(2);
        this.xCount = patchDensities.get(0);
        this.zCount = patchDensities.get(2);
        this.grassWidth = grassDimensions.get(0);
        this.grassHeight = grassDimensions.get(1);
        this.offset = offset;
        this.maxSegments = maxSegments;
    }

    async generate(renderer = new Renderer()) {
        await renderer.createPass("grass", "grass.wgsl", [{
            attributes: [{
                shaderLocation: 0, //Vertex
                offset: 0,
                format: "float32x2",
            }], arrayStride: 8, stepMode: "instance"
        }]);

        const tileWidth = this.patchWidth / this.xCount, tileLength = this.patchLength / this.zCount;
        let offsets = [];

        for (let x = 0; x < this.xCount; ++x) {
            for (let z = 0; z < this.zCount; ++z) {
                offsets.push((x + 0.5 + (Math.random() - 0.5) / Math.pow(2, tileWidth)) * tileWidth + this.offset.get(0), 
                             -(z + 0.5 + (Math.random() - 0.5) / Math.pow(2, tileLength)) * tileLength + this.offset.get(2));
            }
        }

        renderer.gpu.setModelCount("grass", this.maxSegments * 6, this.xCount * this.zCount);
        renderer.gpu.setUniform("grass", "grassInfo", "size", Float32Array.from([ this.grassWidth, this.grassHeight ]));
        renderer.gpu.setUniform("grass", "grassInfo", "segments", Float32Array.from([this.maxSegments]));
        renderer.gpu.setVertexBuffer("grass", Float32Array.from(offsets));
    }
}

let currTime = 0;
function markTime(message) {
    let now = performance.now();
    console.log(message + "\nTime Elapsed: ", (now - currTime).toFixed(0));
    currTime = now;
}

async function generateSky(renderer = new Renderer()) {
    await renderer.createPass("sky", "sky.wgsl", null, {
        label: "sky-shader",
        layout: "auto",
        vertex: {
            entryPoint: "vertexMain",
        },

        fragment: {
            entryPoint: "fragmentMain"
        },

        primitive: {
            topology: "triangle-strip"
        },

        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: "less-equal",
            format: "depth24plus",
        }
    });

    /*await sky.setTexture({ 
        name: "skyCubeMap", 
        url: "skyCubeMap.png", 
        samplerInfo: {
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "nearest",
            minFilter: "nearest"
        } 
    });*/

    renderer.gpu.setModelCount("sky", 4, 1);
    renderer.gpu.setUniform("sky", "skyInfo", "colorOne", new util.Color(0, 191, 255).toArr());
    renderer.gpu.setUniform("sky", "skyInfo", "colorTwo", new util.Color(198, 252, 255).toArr());
}

function downloadArray(name = "data.txt", arr = new Float32Array()) {
    const blobUrl = URL.createObjectURL(new Blob([ arr.join(" ") ]));
    let linkElement = document.createElement("a");

    linkElement.href = blobUrl;
    linkElement.download = name;
    document.body.appendChild(linkElement);

    linkElement.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    document.body.removeChild(linkElement);
}

async function generateTerrain(settings, renderer = new Renderer()) {
    let terrain = new util.ComputeShader("terrainGenerator");
    let terrainPass = renderer.createPass("terrain", "terrain.wgsl", [{
        attributes: [{
            shaderLocation: 0, //Vertex
            offset: 0,
            format: "float32x3", 
        }, {
            shaderLocation: 1, //Normal
            offset: 12,
            format: "float32x3", 
        }], arrayStride: 24, stepMode: "vertex"
    }]);

    await terrain.initialize(renderer.gpu.device, { url: "noise.wgsl" });
    markTime("Initialized Terrain Generator!");

    terrain.setUniform(renderer.gpu.device, "noiseInfo", "amplitude", [settings.amplitude]);
    terrain.setUniform(renderer.gpu.device, "noiseInfo", "frequency", [settings.frequency]);
    terrain.setUniform(renderer.gpu.device, "noiseInfo", "lacunarity", [settings.lacunarity]);
    terrain.setUniform(renderer.gpu.device, "noiseInfo", "persistence", [settings.persistence]);

    let blockCount = [ settings.blockCount.get(0), settings.blockCount.get(1), settings.blockCount.get(2), settings.seed ];
    terrain.setUniform(renderer.gpu.device, "terrainInfo", "worldDimensions", settings.terrainSize.toArr());
    terrain.setUniform(renderer.gpu.device, "terrainInfo", "dimensions", blockCount);
    terrain.setUniform(renderer.gpu.device, "terrainInfo", "color", settings.color.toArr());
    markTime("Initialized Terrain Uniforms!");

    terrain.setDispatchSize(settings.blockCount);
    await terrainPass;

    markTime("Initialized Terrain Pass!");

    renderer.gpu.setUniform("terrain", "terrainInfo", "dimensions", settings.terrainSize.toArr());
    renderer.gpu.setUniform("terrain", "terrainInfo", "color", settings.color.toArr());
    renderer.gpu.setUniform("terrain", "terrainInfo", "offset", settings.offset.toArr());
    markTime("Initialized Terrain Pass Uniforms!");

    await terrain.compute(renderer.gpu.device);
    markTime("Generated Terrain!");

    renderer.gpu.setVertexBuffer("terrain", terrain.getResults("vertices"));
    renderer.gpu.autoVertexCount("terrain");
    renderer.gpu.setModelCount("terrain", null, 9);
    downloadArray("terrain.txt", terrain.getResults("vertices"));
    terrain.clear();
}

async function loadTerrain(settings, renderer = new Renderer()) {
    let terrainSrc = await (await fetch(`Models\\${settings.url}`)).text();
    await renderer.createPass("terrain", "terrain.wgsl", [{
        attributes: [{
            shaderLocation: 0, //Vertex
            offset: 0,
            format: "float32x3", 
        }, {
            shaderLocation: 1, //Normal
            offset: 12,
            format: "float32x3", 
        }], arrayStride: 24, stepMode: "vertex"
    }]);

    let vertices = terrainSrc.split(" ");
    
    renderer.gpu.setUniform("terrain", "terrainInfo", "dimensions", settings.terrainSize.toArr());
    renderer.gpu.setUniform("terrain", "terrainInfo", "color", settings.color.toArr());
    renderer.gpu.setUniform("terrain", "terrainInfo", "offset", settings.offset.toArr());
    renderer.gpu.setVertexBuffer("terrain", Float32Array.from(vertices.map((val, index) => {
        if (index % 6 > 2) 
            return val;
        else 
            return val * settings.terrainSize.get(index % 3) / 100.0;
    })));
    
    renderer.gpu.autoVertexCount("terrain");
    renderer.gpu.setModelCount("terrain", null, 9);
}

document.addEventListener("DOMContentLoaded", async () => {
    const start = performance.now();
    let gpu = await util.GPU.initialize();
    if (!gpu) return;

    gpu.addLibrary("helpers.wgsl");
    gpu.addConstants({
        fogDistanceWeights: "vec4f(1, 1, 1, 1)",
        fogColor: "vec4f(198, 252, 255, 255) / 255",
        fogFactor: "0.000" 
    });

    let display = new Renderer(gpu);
    currTime = performance.now();
    /*let terrainThread = generateTerrain({
        amplitude: 1,
        frequency: 0.005,
        lacunarity: 1.95,
        persistence: 0.52,
        seed: 0,

        terrainSize: new util.Vector(100, 100, 100),
        blockCount: new util.Vector(3, 1, 3),
        offset: new util.Vector(-150, -350, 0),
        color: new util.Color(175, 114, 44)
    }, display);*/

    await display.createPass("light", "light.wgsl");
    await generateSky(display);
    display.toggleFPS();
    /*await display.createPass("ground", "ground.wgsl", [{
        attributes: [{
            shaderLocation: 0, //Vertex
            offset: 0,
            format: "float32x4", 
        }, {
            shaderLocation: 1, //Vertex
            offset: 16,
            format: "float32x4", 
        }], arrayStride: 32, stepMode: "vertex"
    }]);

    await display.gpu.setTexture("ground", { 
        name: "floorGrid", 
        url: "floorGrid.jpg", 
        samplerInfo: {
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "nearest",
            minFilter: "linear"
        } 
    });*/
    
    let grassInstance = new Grass(new util.Vector(0.5, 8, 0), new util.Vector(500, 0, 500), new util.Vector(500, 0, 500), 
                                  new util.Vector(-200, 200, 10), 12);

    await grassInstance.generate(display);


    /*let ground = new shapes.Quadrilateral(new util.Vertex(new util.Vector(1000, 0, -1000), new util.Color(255, 0, 0)),
                                            new util.Vertex(new util.Vector(-1000, 0, -1000), new util.Color(0, 255, 0)),
                                            new util.Vertex(new util.Vector(1000, 0, 1000), new util.Color(0, 0, 255)),
                                            new util.Vertex(new util.Vector(-1000, 0, 1000), new util.Color(255, 255, 255)));

    display.gpu.setVertexBuffer("ground", ground.toArray());*/
    
    let light = new shapes.Box(new util.Vertex(new util.Vector(100, 750, -50), new util.Color(255, 255, 255)),
                                new util.Vertex(new util.Vector(150, 800, -100), new util.Color(255, 255, 255).multNum(1)));
    
    const terrainScale = 1000;

    //await terrainThread;
    await loadTerrain({
        url: "hillTerrain.txt",
        terrainSize: new util.Vector(1, 1, 1).multNum(terrainScale),
        offset: new util.Vector(-1, -0.55, -1).multNum(terrainScale),
        color: new util.Color(175, 114, 44)
    }, display);
    
    //markTime("Terrain Generated!");
    display.gpu.setVertexBuffer("light", light.toArray());
    display.gpu.setGlobalUniform("sceneInfo", "lightPosition", light.origin.toArr());
    display.gpu.setGlobalUniform("sceneInfo", "lightColor", light.emission.toArr());
    display.render();
});
