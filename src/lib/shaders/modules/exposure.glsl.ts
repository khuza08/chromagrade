export const exposure = `
  // Exposure — EV-based, linear light, no tone-mapping (matches Lightroom behavior)
  vec3 linColor = toLinear(color);
  linColor *= pow(2.0, u_exposure);                    // EV multiply: +1EV = 2x, -1EV = 0.5x
  color = toSRGB(linColor);                            // re-encode
`;
