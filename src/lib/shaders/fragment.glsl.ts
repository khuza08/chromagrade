export const fragmentShaderSource = `#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;

// Grading Uniforms
uniform float u_contrast;    // 0.0 to 2.0, pivot 1.0
uniform float u_saturation;  // 0.0 to 2.0, pivot 1.0
uniform float u_temperature; // -0.2 to 0.2
uniform float u_tint;        // -0.2 to 0.2

// Primary Wheels
uniform vec3 u_shadows;      // Lift
uniform vec3 u_midtones;     // Gamma
uniform vec3 u_highlights;   // Gain
uniform vec3 u_global;       // Offset

in vec2 v_texCoord;
out vec4 outColor;

void main() {
  vec2 flippedCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
  vec4 texColor = texture(u_texture, flippedCoord);
  vec3 color = texColor.rgb;

  // 1. Temperature & Tint
  color.r += u_temperature;
  color.b -= u_temperature;
  color.g += u_tint;

  // 2. Shadows (Lift): color + (u_shadows * (1.0 - color))
  color = color + (u_shadows * (1.0 - color));
  
  // 3. Midtones (Gamma): pow(color, 1.0 / u_midtones)
  color = max(color, 0.0);
  color.r = pow(color.r, 1.0 / max(u_midtones.r, 0.01));
  color.g = pow(color.g, 1.0 / max(u_midtones.g, 0.01));
  color.b = pow(color.b, 1.0 / max(u_midtones.b, 0.01));
  
  // 4. Highlights (Gain): color * u_highlights
  color = color * u_highlights;

  // 5. Global (Offset): color + u_global
  color = color + u_global;

  // 6. Contrast (around 0.5 pivot)
  color = (color - 0.5) * u_contrast + 0.5;

  // 7. Saturation
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, u_saturation);

  // Final Clamping
  color = clamp(color, 0.0, 1.0);
  
  outColor = vec4(color, texColor.a);
}
`;
