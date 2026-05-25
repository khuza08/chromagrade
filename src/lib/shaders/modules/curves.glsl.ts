export const curves = `
  // 8. Curves
  // Apply RGB individual channels
  color.r = texture(u_curveRed, vec2(color.r, 0.5)).r;
  color.g = texture(u_curveGreen, vec2(color.g, 0.5)).r;
  color.b = texture(u_curveBlue, vec2(color.b, 0.5)).r;

  // Apply Master curve
  color.r = texture(u_curveMaster, vec2(color.r, 0.5)).r;
  color.g = texture(u_curveMaster, vec2(color.g, 0.5)).r;
  color.b = texture(u_curveMaster, vec2(color.b, 0.5)).r;
`;
