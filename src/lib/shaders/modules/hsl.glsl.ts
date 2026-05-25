export const hsl = `
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
`;
