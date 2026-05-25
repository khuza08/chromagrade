export const clipping = `
  // Final Clamping
  color = clamp(color, 0.0, 1.0);

  // Clipping Overlays
  if (u_showShadowClipping && color.r <= 0.001 && color.g <= 0.001 && color.b <= 0.001) {
    color = vec3(0.0, 0.0, 1.0); // Blue
  } else if (u_showHighlightClipping && color.r >= 0.999 && color.g >= 0.999 && color.b >= 0.999) {
    color = vec3(1.0, 0.0, 0.0); // Red
  }

  outColor = vec4(color, texColor.a);
`;
