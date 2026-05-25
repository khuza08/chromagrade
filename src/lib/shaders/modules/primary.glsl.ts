export const primary = `
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
`;
