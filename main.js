const canvas = document.getElementById("gfx");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
const format = navigator.gpu.getPreferredCanvasFormat();

const context = canvas.getContext("webgpu");
context.configure({ device, format, alphaMode: "opaque" });

// === Config ===
const NODE_FLOATS = 11;
const nodeCount = 120_000_000;
const chunkSize = 500_000;
const numChunks = Math.ceil(nodeCount / chunkSize);
const NODE_SIZE = 4 * NODE_FLOATS;

// === Buffers ===
const buffers = [];
const indirectBuffers = [];
const visibleCountBuffers = [];

for (let chunk = 0; chunk < numChunks; chunk++) {
    const size = Math.min(chunkSize, nodeCount - chunk * chunkSize) * NODE_SIZE;
    const alignedSize = Math.ceil(size / 256) * 256;

    buffers.push(device.createBuffer({
        size: alignedSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    }));

    visibleCountBuffers.push(device.createBuffer({
        size: 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    }));

    indirectBuffers.push(device.createBuffer({
        size: 4 * 4,
        usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    }));
}

// === Shared Uniforms ===
const canvasSizeBuffer = device.createBuffer({ size: 8, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
const timeBuffer = device.createBuffer({ size: 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

device.queue.writeBuffer(canvasSizeBuffer, 0, new Float32Array([canvas.width, canvas.height]));

// === Upload Node Data ===
for (let chunk = 0; chunk < numChunks; chunk++) {
    const thisCount = Math.min(chunkSize, nodeCount - chunk * chunkSize);
    const nodeData = new Float32Array(thisCount * NODE_FLOATS);
    for (let i = 0; i < thisCount; i++) {
        const base = i * NODE_FLOATS;
        nodeData[base + 0] = Math.random() * canvas.width;
        nodeData[base + 1] = Math.random() * canvas.height;
        nodeData[base + 2] = Math.random() * 30;
        nodeData[base + 3] = Math.random() * 30;
        nodeData[base + 4] = Math.random();
        nodeData[base + 5] = Math.random();
        nodeData[base + 6] = Math.random();
        nodeData[base + 7] = 1.0;
        nodeData[base + 8] = (Math.random() - 0.5) * 0.5;
        nodeData[base + 9] = (Math.random() - 0.5) * 0.5;
    }
    device.queue.writeBuffer(buffers[chunk], 0, nodeData.buffer);
}

// === Shaders ===
const shaderModule = device.createShaderModule({ code: await (await fetch("./shader/fragment.wgsl")).text() });
const computeModule = device.createShaderModule({ code: await (await fetch("./shader/update.wgsl")).text() });

// === Layouts ===
const renderBindGroupLayout = device.createBindGroupLayout({
    entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }
    ]
});

const computeBindGroupLayout = device.createBindGroupLayout({
    entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }
    ]
});

const renderPipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [renderBindGroupLayout] }),
    vertex: { module: shaderModule, entryPoint: "vs_main" },
    fragment: { module: shaderModule, entryPoint: "fs_main", targets: [{ format }] },
    primitive: { topology: "triangle-list" }
});

const computePipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [computeBindGroupLayout] }),
    compute: { module: computeModule, entryPoint: "main" }
});

// === Per-chunk BindGroups ===
const renderBindGroups = [];
const computeBindGroups = [];

for (let i = 0; i < numChunks; i++) {
    renderBindGroups.push(device.createBindGroup({
        layout: renderBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: buffers[i] } },
            { binding: 1, resource: { buffer: canvasSizeBuffer } }
        ]
    }));

    computeBindGroups.push(device.createBindGroup({
        layout: computeBindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: buffers[i] } },
            { binding: 1, resource: { buffer: canvasSizeBuffer } },
            { binding: 2, resource: { buffer: timeBuffer } },
            { binding: 3, resource: { buffer: visibleCountBuffers[i] } }
        ]
    }));
}

// === Frame ===
let totalTime = 0;
let lastTime = performance.now();
let frameCount = 0;

function frame() {
    totalTime += 0.016;
    device.queue.writeBuffer(timeBuffer, 0, new Float32Array([totalTime]));

    const now = performance.now();
    frameCount++;
    if (now - lastTime >= 1000) {
        document.getElementById("fps").textContent = frameCount.toString();
        document.getElementById("nodes").textContent = nodeCount.toLocaleString();
        frameCount = 0;
        lastTime = now;
    }

    const encoder = device.createCommandEncoder();

    for (let i = 0; i < numChunks; i++) {
        device.queue.writeBuffer(visibleCountBuffers[i], 0, new Uint32Array([0]));
        device.queue.writeBuffer(indirectBuffers[i], 0, new Uint32Array([6, 0, 0, 0]));

        const computePass = encoder.beginComputePass();
        computePass.setPipeline(computePipeline);
        computePass.setBindGroup(0, computeBindGroups[i]);
        computePass.dispatchWorkgroups(Math.ceil(chunkSize / 64));
        computePass.end();

        encoder.copyBufferToBuffer(
            visibleCountBuffers[i], 0,
            indirectBuffers[i], 4, 4
        );
    }

    const pass = encoder.beginRenderPass({
        colorAttachments: [
            {
                view: context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                storeOp: "store"
            }
        ]
    });

    for (let i = 0; i < numChunks; i++) {
        pass.setPipeline(renderPipeline);
        pass.setBindGroup(0, renderBindGroups[i]);
        pass.drawIndirect(indirectBuffers[i], 0);
    }

    pass.end();
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(frame);
}

if (performance.memory) {
    const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
    document.getElementById("mem").textContent = `${usedMB} MB`;
}

frame();
