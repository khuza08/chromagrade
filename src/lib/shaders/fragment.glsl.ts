export const fragmentShaderSource = `#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;

// Grading Uniforms
uniform float u_contrast;    // 0.0 to 2.0, pivot 1.0
uniform float u_saturation;  // 0.0 to 2.0, pivot 1.0
uniform float u_temperature; // -0.2 to 0.2
uniform float u_tint;        // -0.2 to 0.2

// Primary Wheels (normalized 0..1 scale logic)
uniform vec3 u_lift;         // -1.0 to 1.0
uniform vec3 u_gamma;        // 0.1 to 5.0, default 1.0
uniform vec3 u_gain;         // 0.0 to 5.0, default 1.0

in vec2 v_texCoord;
out vec4 outColor;

void main() {
  // Flip Y because texture coordinates are 0,0 at bottom-left in WebGL but images are top-left
  vec2 flippedCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
  vec4 texColor = texture(u_texture, flippedCoord);
  vec3 color = texColor.rgb;

  // 1. Temperature & Tint
  color.r += u_temperature;
  color.b -= u_temperature;
  color.g += u_tint;

  // 2. Lift, Gamma, Gain (Industry Standard)
  // color = pow(max(color + u_lift, 0.0), 1.0 / u_gamma) * u_gain;
  color = color + u_lift;
  color = max(color, 0.0);
  
  // Apply Gamma (inverse power)
  color.r = pow(color.r, 1.0 / max(u_gamma.r, 0.01));
  color.g = pow(color.g, 1.0 / max(u_gamma.g, 0.01));
  color.b = pow(color.b, 1.0 / max(u_gamma.b, 0.01));
  
  // Apply Gain
  color = color * u_gain;

  // 3. Contrast (around 0.5 pivot)
  color = (color - 0.5) * u_contrast + 0.5;

  // 4. Saturation
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, u_saturation);

  // Final Clamping
  color = clamp(color, 0.0, 1.0);
  
  outColor = vec4(color, texColor.a);
}
`;
