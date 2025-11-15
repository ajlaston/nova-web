//Node def
struct Node {
  x: f32,
  y: f32,
  w: f32,
  h: f32,
  r: f32,
  g: f32,
  b: f32,
  a: f32,
  vx: f32,
  vy: f32,
  visible: f32, 
};

@group(0) @binding(0)
var<storage, read_write> nodes: array<Node>;

@group(0) @binding(1)
var<uniform> canvasSize: vec2f;

@group(0) @binding(2)
var<uniform> time: f32;

@group(0) @binding(3)
var<storage, read_write> visibleCount: atomic<u32>;


@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= arrayLength(&nodes)) {
    return;
  }

  var node = nodes[i];

  // Move node
  node.x += node.vx;
  node.y += node.vy;

  // Bounce Node
  if (node.x < 0.0 || node.x + node.w > canvasSize.x) {
    node.vx = -node.vx;
    node.x = clamp(node.x, 0.0, canvasSize.x - node.w);
  }
  if (node.y < 0.0 || node.y + node.h > canvasSize.y) {
    node.vy = -node.vy;
    node.y = clamp(node.y, 0.0, canvasSize.y - node.h);
  }

  //culling
  let isVisible = (node.x + node.w > 0.0) &&
                  (node.x < canvasSize.x) &&
                  (node.y + node.h > 0.0) &&
                  (node.y < canvasSize.y);

  if (isVisible) {
  node.visible = 1.0;
  atomicAdd(&visibleCount, 1u);
} else {
  node.visible = 0.0;
}  

  nodes[i] = node;
}
