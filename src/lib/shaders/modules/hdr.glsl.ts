export const hdr = `
  // HDR — Reinhard tonemapping with configurable white point
  if (u_hdr) {
    // Scale up into HDR headroom
    vec3 hdrColor = color * u_hdrLimit;
    // Reinhard extended: maps [0, inf) -> [0, 1)
    color = hdrColor / (1.0 + hdrColor);
    // Rescale so mid-gray stays perceptually consistent
    float midIn = 0.5 * u_hdrLimit / (1.0 + 0.5 * u_hdrLimit);
    color /= midIn;
    color = clamp(color, 0.0, 1.0);
  }
`;
