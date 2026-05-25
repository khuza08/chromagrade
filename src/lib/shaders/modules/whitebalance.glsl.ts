export const whitebalance = `
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
    vec3 linear = toLinear(color); // decode gamma → linear
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
    color = toSRGB(linear);
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
`;
