export const exposure = `
  if (abs(u_exposure) > 0.001) {
    const vec3 luma = vec3(0.2126, 0.7152, 0.0722);

    float evMult = pow(2.0, u_exposure);
    vec3 exposed = color * evMult;

    // Soft highlight shoulder
    float shoulder = 0.75;
    vec3 compressed;
    for (int i = 0; i < 3; i++) {
      float c = exposed[i];
      if (c <= shoulder) {
        compressed[i] = c;
      } else {
        float x = (c - shoulder) / (1.0 - shoulder);
        compressed[i] = shoulder + (1.0 - shoulder) * (1.0 - exp(-x * 2.0));
      }
    }

    // Shadow desaturation fix —
    // as exposure pulls down, bleed color toward luma (gray)
    // mimics how dark scenes lose color, fixes the "glowing saturation" bug
    float exposedLuma = dot(compressed, luma);
    float darknessFactor = 1.0 - clamp(exposedLuma * 4.0, 0.0, 1.0);
    // darknessFactor = 0 at luma >= 0.25, ramps to 1.0 at pure black
    // so saturation only bleeds out in the shadows

    float desatStrength = darknessFactor * 0.85;
    compressed = mix(compressed, vec3(exposedLuma), desatStrength);

    // Shadow lift on negative exposure
    if (u_exposure < 0.0) {
      float shadowLift = max(0.0, -u_exposure * 0.03);
      compressed = max(compressed, vec3(shadowLift));
    }

    color = clamp(compressed, 0.0, 1.0);
  }
`;
