# Nova WEB - WebGPU Test
<img width="2440" height="1079" alt="image" src="https://github.com/user-attachments/assets/c2473ac1-66c0-40bc-9c72-13b18638cdb5" />

Benchmark WebGPU performance with 50K to 15 million nodes in real-time, with live FPS monitoring.(starting at 50k by default)

### instructions:
Press enter the number of nodes you want to display and press the reset button or press enter.

Link: https://ajlaston.github.io/Nova-Web/

## Performance Benchmarks

### AMD Radeon™ 890M (Discrete Mobile GPU)
| Node Count | FPS | Updates/Second | Status |
|------------|-----|----------------|---------|
| 2 Million | 60 FPS | 120 Million | **Butterfly Smooth** |
| 8 Million | 20 FPS | 160 Million | **Optimal Throughput** |
| 50 Million | 3 FPS | 150 Million | **GPU OS Territory** |
| 120 Million | 1 FPS | 120 Million | **Boundary Push** |

### Intel UHD 620 (Integrated Graphics - 2017)
| Node Count | FPS | Updates/Second | Status |
|------------|-----|----------------|---------|
| 200k | 60 FPS | 12 Million | **Practical Usage** |
| 500k | 33 FPS | 16.5 Million | **Smooth Experience** |
| 1 Million | 17 FPS | 17 Million | **Linear Scaling** |
| 8 Million | 5 FPS | 40 Million | **Peak Efficiency** |
| 15 Million | 2 FPS | 30 Million | **Memory Limited** |

### Key Insight
High-end discrete mobile GPUs deliver **butterfly-smooth 60 FPS** with 2 million simultaneously simulated nodes, while 7-year old integrated graphics (UHD 620) still handle millions of nodes at usable framerates.

---

## Development Approach

### AI-Assisted Engineering
This project demonstrates modern development workflows using AI assistance:

**My Implementation:**
- System Architecture (chunked rendering, buffer management)
- Performance Scaling Strategy
- Cross-Hardware Testing
- Research Design & Analysis

**AI Help:**
- WebGPU API boilerplate generation
- WGSL shader code scaffolding
- Initial compute/render pipeline setup

## Technical Implementation

### GPU-Driven Rendering Pipeline
**Zero CPU Visibility Management • GPU-Side Diffing & Culling**

### Core Architecture
- Massively parallel compute shaders
- Chunked buffer management  
- Indirect drawing for optimal GPU utilization
- Memory-aligned data structures

### Key Features
- **120 million node capacity** (largest instanced draw in browser history)
- **Real-time physics simulation** (not just rendering)
- **Hardware-automatic scaling** (no code changes needed)
- **Zero-allocation updates** (GC-free operation)

### Test Your Hardware:
- 50K nodes (Butterfly smooth on all hardware)
- 1M nodes (60 FPS on discrete GPUs)
- 5M nodes (Peak efficiency demonstration)
- 15M+ nodes (Memory bandwidth limit)

---
.
