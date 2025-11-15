struct Node {
  x: f32, y: f32,
  w: f32, h: f32,
  r: f32, g: f32, b: f32, a: f32,
  vx: f32, vy: f32,
  visible: f32,       
};

@group(0) @binding(0) var<storage, read> nodes: array<Node>;
@group(0) @binding(1) var<uniform> canvasSize: vec2<f32>;

struct VSOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex
fn vs_main(@builtin(instance_index) i: u32, @builtin(vertex_index) v: u32) -> VSOut {
  let node = nodes[i];

  if (node.visible < 0.5) {
 
    var out: VSOut;
    out.pos = vec4<f32>(-2.0, -2.0, 0.0, 1.0);
    out.color = vec4<f32>(0.0);
    return out;
  }

  var px: vec2<f32>;
  if (v == 0u) {
    px = vec2<f32>(0.0, 0.0);
  } else if (v == 1u) {
    px = vec2<f32>(1.0, 0.0);
  } else if (v == 2u) {
    px = vec2<f32>(0.0, 1.0);
  } else if (v == 3u) {
    px = vec2<f32>(0.0, 1.0);
  } else if (v == 4u) {
    px = vec2<f32>(1.0, 0.0);
  } else {
    px = vec2<f32>(1.0, 1.0);
  }

  let pos = vec2<f32>(node.x, node.y) + px * vec2<f32>(node.w, node.h);
  let ndc = (pos / canvasSize) * 2.0 - vec2<f32>(1.0, 1.0);
  let flipped = vec2<f32>(ndc.x, -ndc.y);

  var out: VSOut;
  out.pos = vec4<f32>(flipped, 0.0, 1.0);
  out.color = vec4<f32>(node.r, node.g, node.b, node.a);
  return out;
}

@fragment
fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
  return in.color;
}
 
