export const fragmentShaderSource = `#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;

// Grading Uniforms
uniform float u_exposure;    // EV stops, -5.0 to +5.0
uniform float u_contrast;    // 0.0 to 2.0, pivot 1.0
uniform float u_saturation;  // 0.0 to 2.0, pivot 1.0
uniform float u_temperature; // -0.2 to 0.2
uniform float u_tint; // Tint adjustment
uniform float u_vibrance;  // Vibrance (smart saturation)

// Primary Wheels
uniform vec3 u_shadows;      // Lift
uniform vec3 u_midtones;     // Gamma
uniform vec3 u_highlights;   // Gain
uniform vec3 u_global;       // Offset

// Curves LUTs (1D textures)
uniform sampler2D u_curveMaster;
uniform sampler2D u_curveRed;
uniform sampler2D u_curveGreen;
uniform sampler2D u_curveBlue;

// HSL LUTs (1D textures)
uniform sampler2D u_hslHue;
uniform sampler2D u_hslSat;
uniform sampler2D u_hslLum;

// Clipping Toggles
uniform bool u_showShadowClipping;
uniform bool u_showHighlightClipping;

in vec2 v_texCoord;
out vec4 outColor;

// Color Space Helpers
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 flippedCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
  vec4 texColor = texture(u_texture, flippedCoord);
  vec3 color = texColor.rgb;

  // Exposure — EV-based, linear light, no tone-mapping (matches Lightroom behavior)
  vec3 linColor = pow(max(color, 0.0001), vec3(2.2)); // linearize, avoid pow(0)
  linColor *= pow(2.0, u_exposure);                    // EV multiply: +1EV = 2x, -1EV = 0.5x
  color = pow(clamp(linColor, 0.0, 1.0), vec3(1.0 / 2.2)); // re-encode

  // Temperature & Tint — RGB multiplicative scaling in linear light

    // NOTE: This implementation cannot fully replicate Adobe Lightroom Classic
    // white balance behavior. Lightroom uses a full ML pipeline (neural networks,
    // OpenCV computer vision, per-camera color matrices, and 14-bit RAW sensor data)
    // to achieve its results. ChromaGrade works on already-processed JPEG data in
    // gamma-encoded 8-bit space, which fundamentally limits shadow recovery and
    // per-object color shifts. The approach here (linearize → multiply → re-encode)
    // is the best achievable on JPEG without ML. ML-powered WB is a planned future feature,
    // while i know my limits.
    //
    // WB in linear light (simulates RAW pipeline)
    vec3 linear = pow(color, vec3(2.2)); // decode gamma → linear
    vec3 tempScale = vec3(
      1.0 + u_temperature * 0.9,
      1.0 + u_temperature * 0.3,
      1.0 - u_temperature * 0.2
    );
    vec3 tintScale = vec3(
      1.0 + u_tint * 0.3,
      1.0 - u_tint * 0.5,
      1.0 + u_tint * 0.1
    );
    linear = clamp(linear * tempScale * tintScale, 0.0, 1.0);
    // Re-encode to gamma for hue assist
    color = pow(linear, vec3(1.0 / 2.2));
    // Warm hue assist
    vec3 warmHsv = rgb2hsv(color);
    float isGreen = smoothstep(0.22, 0.24, warmHsv.x)
                  * (1.0 - smoothstep(0.36, 0.48, warmHsv.x))
                  * smoothstep(0.1, 0.3, warmHsv.y);
    float darkBoost = 1.0 - warmHsv.z;
    warmHsv.x -= u_temperature * 0.1 * isGreen;
    warmHsv.y = clamp(warmHsv.y + u_temperature * 0.15 * isGreen, 0.0, 1.0);
    warmHsv.z += u_temperature * 0.15 * isGreen * darkBoost;
    warmHsv.z = clamp(warmHsv.z, 0.15, 1.0);
    warmHsv.x = fract(warmHsv.x);
    color = hsv2rgb(warmHsv);

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

  // 7. Saturation & Vibrance (smart with skin protection)
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
   // Convert to HSV for per-pixel saturation & hue
   vec3 hsvVib = rgb2hsv(color);
   float sat = hsvVib.y;      // pixel saturation [0-1]
   float hue = hsvVib.x;      // pixel hue [0-1]

   // Skin-tone protection (same as before)
   float skinMask = smoothstep(0.05, 0.07, hue) *
                    (1.0 - smoothstep(0.14, 0.16, hue));
   float skinFactor = 1.0 - skinMask * 0.7;

   // Vibrance boost – stronger on low-saturation pixels
   float vibBoost = (1.0 - sat) * u_vibrance * skinFactor;

   // Apply vibrance to pixel saturation (clamped)
   hsvVib.y = clamp(sat + vibBoost, 0.0, 1.0);
   color = hsv2rgb(hsvVib);

  // Global saturation multiplier (unchanged behavior)
  color = mix(vec3(luma), color, u_saturation);


  // 8. Curves
  // Apply RGB individual channels
  color.r = texture(u_curveRed, vec2(color.r, 0.5)).r;
  color.g = texture(u_curveGreen, vec2(color.g, 0.5)).r;
  color.b = texture(u_curveBlue, vec2(color.b, 0.5)).r;

  // Apply Master curve
  color.r = texture(u_curveMaster, vec2(color.r, 0.5)).r;
  color.g = texture(u_curveMaster, vec2(color.g, 0.5)).r;
  color.b = texture(u_curveMaster, vec2(color.b, 0.5)).r;

  // 9. HSL Adjustments
  vec3 hsv = rgb2hsv(color);
  float h = hsv.x;

  float hShift = texture(u_hslHue, vec2(h, 0.5)).r * 2.0 - 1.0;
  float sShift = texture(u_hslSat, vec2(h, 0.5)).r * 2.0 - 1.0;
  float lShift = texture(u_hslLum, vec2(h, 0.5)).r * 2.0 - 1.0;

  hsv.x = fract(hsv.x + hShift * 0.15); // Scale hue shift to +/- 54 degrees
  hsv.y = clamp(hsv.y + sShift, 0.0, 1.0);
  hsv.z = clamp(hsv.z + lShift, 0.0, 1.0);

  color = hsv2rgb(hsv);

  // Final Clamping
  color = clamp(color, 0.0, 1.0);

  // Clipping Overlays
  if (u_showShadowClipping && color.r <= 0.001 && color.g <= 0.001 && color.b <= 0.001) {
    color = vec3(0.0, 0.0, 1.0); // Blue
  } else if (u_showHighlightClipping && color.r >= 0.999 && color.g >= 0.999 && color.b >= 0.999) {
    color = vec3(1.0, 0.0, 0.0); // Red
  }

  outColor = vec4(color, texColor.a);
}
`;
