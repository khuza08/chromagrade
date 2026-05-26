export const hdr = `
  if (u_hdr) {
    const vec3 luma = vec3(0.2126, 0.7152, 0.0722);

    float gamma      = 1.0 + u_hdrGamma     / 100.0;
    float intensity  = u_hdrIntensity        / 100.0;
    float lightAdapt = clamp(u_hdrLightAdapt / 100.0, 0.0, 1.0);
    float colorAdapt = clamp(u_hdrColorAdapt / 100.0, 0.0, 1.0);

    if (u_visualizeHdr) {
      vec3 hdrColor = color * u_hdrLimit;
      float maxC = max(hdrColor.r, max(hdrColor.g, hdrColor.b));
      if (maxC > 1.0) {
        float over = clamp((maxC - 1.0) / max(u_hdrLimit - 1.0, 0.001), 0.0, 1.0);
        color = mix(vec3(1.0, 0.2, 0.0), vec3(1.0, 1.0, 0.0), over);
        color = mix(color, vec3(1.0), smoothstep(0.8, 1.0, over));
      } else {
        float lum = dot(color, luma);
        color = mix(color, vec3(lum), 0.4);
      }
    } else {

      float L = dot(color, luma);

      // Scale into HDR headroom — hdrLimit sets how many stops of headroom
      // hdrLimit=1 → no expansion, hdrLimit=4 → 2 stops of headroom
      color *= u_hdrLimit;
      L *= u_hdrLimit;

      // --- Step 1: Shadow lift ---
      // opens up dark areas, like HDR shadow recovery
      float shadowLift = intensity * 0.15;
      vec3 lifted = color + shadowLift * (1.0 - color) * (1.0 - L);

      // --- Step 2: Highlight compression ---
      // soft shoulder rolloff — highlights never hard clip
      float shoulder = 0.65 + intensity * 0.1;
      vec3 compressed;
      for (int i = 0; i < 3; i++) {
        float c = lifted[i];
        if (c <= shoulder) {
          compressed[i] = c;
        } else {
          float x = (c - shoulder) / max(1.0 - shoulder, 0.001);
          compressed[i] = shoulder + (1.0 - shoulder) * (1.0 - exp(-x * 3.0));
        }
      }

      // --- Step 3: Midtone contrast boost ---
      // HDR looks punchy — boost contrast around midtones
      float midMask = 1.0 - abs(L * 2.0 - 1.0);
      float contrastBoost = 0.15 + abs(intensity) * 0.1;
      compressed += (compressed - vec3(0.5)) * contrastBoost * midMask;

      // --- Step 4: Saturation boost in midtones ---
      // HDR looks vivid — recover saturation lost to compression
      float newLuma = dot(compressed, luma);
      float satBoost = 1.0 + (0.1 + colorAdapt * 0.2) * midMask;
      compressed = mix(vec3(newLuma), compressed, satBoost);

      // --- Step 5: Light adaptation ---
      // lightAdapt=0 global (no change), lightAdapt=1 local (per-pixel punch)
      float Lscaled = L / max(0.18 * pow(2.0, intensity * 3.0), 0.0001);
      vec3 Lad = mix(vec3(0.0), vec3(Lscaled - L), lightAdapt);
      compressed += Lad * 0.1;

      // --- Step 6: Gamma ---
      compressed = pow(max(compressed, 0.0), vec3(1.0 / max(gamma, 0.0001)));

      color = clamp(compressed, 0.0, 1.0);

      // --- SDR Preview ---
      if (u_sdrPreview) {
        float lum    = dot(color, luma);
        float hiMask = smoothstep(0.5, 1.0, lum);
        float loMask = 1.0 - smoothstep(0.0, 0.5, lum);
        float midMask2 = 1.0 - hiMask - loMask;

        if (abs(u_sdrBrightness) > 0.5) {
          float evMult = pow(2.0, u_sdrBrightness * 0.02);
          color *= evMult;
        }

        if (abs(u_sdrContrast) > 0.5) {
          float contrastAmt = u_sdrContrast * 0.008;
          color = mix(
            color,
            0.5 + (color - 0.5) * (1.0 + contrastAmt),
            midMask2
          );
        }

        if (abs(u_sdrHighlights) > 0.5) {
          // positive = raise white point (display shows more headroom)
          // negative = lower white point (display clips earlier)
          float whitePoint = 1.0 - u_sdrHighlights * 0.003;
          whitePoint = max(whitePoint, 0.5); // never let it go crazy low
          color = color / whitePoint;        // rescale so whitePoint maps to 1.0
          color = clamp(color, 0.0, 1.0);
        }

        if (abs(u_sdrShadows) > 0.5) {
          float loAmt = u_sdrShadows * 0.01;
          color = mix(color, color * (1.0 + loAmt), loMask);
        }

        if (abs(u_sdrWhites) > 0.5) {
          float whitesAmt = u_sdrWhites * 0.005;
          vec3 whiteCeiling = 1.0 - (1.0 - color) * (1.0 - whitesAmt);
          color = mix(color, whiteCeiling, hiMask);
        }

        lum = dot(color, luma);
        hiMask = smoothstep(0.6, 1.0, lum);
        float satRetain = clamp(u_sdrHighlightSat * 0.01, 0.0, 1.0);
        color = mix(color, vec3(lum), hiMask * (1.0 - satRetain));

        color = clamp(color, 0.0, 1.0);
      }
    }
  }
`;
