export const lut = `
  if (u_lutEnabled) {
    float n = float(u_lutSize);
    float scale = (n - 1.0) / n;
    float bias  = 0.5 / n;
    vec3 lutCoord = clamp(color, 0.0, 1.0) * scale + bias;
    vec3 lutColor = texture(u_lut, lutCoord).rgb;
    color = mix(color, lutColor, u_lutStrength);
  }
`;
