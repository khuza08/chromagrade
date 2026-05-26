export const presence = `
  // Presence — Texture, Clarity, Dehaze
  vec2 texel = 1.0 / u_resolution;

  // Exposure scale factor so blur matches graded color space
  float expScale = pow(2.0, u_exposure);

  // Texture: 3x3 USM (fine detail)
  if (abs(u_textureAmt) > 0.001) {
    // Gaussian 3x3
    vec3 blurT = vec3(0.0);
    blurT += texture(u_texture, flippedCoord + vec2(-texel.x, -texel.y)).rgb * 1.0;
    blurT += texture(u_texture, flippedCoord + vec2( 0.0,     -texel.y)).rgb * 2.0;
    blurT += texture(u_texture, flippedCoord + vec2( texel.x, -texel.y)).rgb * 1.0;
    blurT += texture(u_texture, flippedCoord + vec2(-texel.x,  0.0    )).rgb * 2.0;
    blurT += texture(u_texture, flippedCoord                            ).rgb * 4.0;
    blurT += texture(u_texture, flippedCoord + vec2( texel.x,  0.0    )).rgb * 2.0;
    blurT += texture(u_texture, flippedCoord + vec2(-texel.x,  texel.y)).rgb * 1.0;
    blurT += texture(u_texture, flippedCoord + vec2( 0.0,      texel.y)).rgb * 2.0;
    blurT += texture(u_texture, flippedCoord + vec2( texel.x,  texel.y)).rgb * 1.0;
    blurT /= 16.0;
    blurT *= expScale;

    float sharpAmt = sign(u_textureAmt) * pow(abs(u_textureAmt), 1.5);
    const vec3 luma = vec3(0.2126, 0.7152, 0.0722);
    float detail = dot(color - blurT, luma);
    color += detail * sharpAmt;
    color = clamp(color, 0.0, 1.0);
  }

  // Clarity: 5x5 USM (broad edges)
  if (abs(u_clarity) > 0.001) {
    // True 5x5 Gaussian kernel:
    // 1  4  6  4  1
    // 4 16 24 16  4
    // 6 24 36 24  6
    // 4 16 24 16  4
    // 1  4  6  4  1
    // sum = 256

    vec3 blurC = vec3(0.0);
    vec2 t = texel;

    blurC += texture(u_texture, flippedCoord + vec2(-2.0*t.x, -2.0*t.y)).rgb *  1.0;
    blurC += texture(u_texture, flippedCoord + vec2(-1.0*t.x, -2.0*t.y)).rgb *  4.0;
    blurC += texture(u_texture, flippedCoord + vec2( 0.0,     -2.0*t.y)).rgb *  6.0;
    blurC += texture(u_texture, flippedCoord + vec2( 1.0*t.x, -2.0*t.y)).rgb *  4.0;
    blurC += texture(u_texture, flippedCoord + vec2( 2.0*t.x, -2.0*t.y)).rgb *  1.0;

    blurC += texture(u_texture, flippedCoord + vec2(-2.0*t.x, -1.0*t.y)).rgb *  4.0;
    blurC += texture(u_texture, flippedCoord + vec2(-1.0*t.x, -1.0*t.y)).rgb * 16.0;
    blurC += texture(u_texture, flippedCoord + vec2( 0.0,     -1.0*t.y)).rgb * 24.0;
    blurC += texture(u_texture, flippedCoord + vec2( 1.0*t.x, -1.0*t.y)).rgb * 16.0;
    blurC += texture(u_texture, flippedCoord + vec2( 2.0*t.x, -1.0*t.y)).rgb *  4.0;

    blurC += texture(u_texture, flippedCoord + vec2(-2.0*t.x,  0.0    )).rgb *  6.0;
    blurC += texture(u_texture, flippedCoord + vec2(-1.0*t.x,  0.0    )).rgb * 24.0;
    blurC += texture(u_texture, flippedCoord                            ).rgb * 36.0;
    blurC += texture(u_texture, flippedCoord + vec2( 1.0*t.x,  0.0    )).rgb * 24.0;
    blurC += texture(u_texture, flippedCoord + vec2( 2.0*t.x,  0.0    )).rgb *  6.0;

    blurC += texture(u_texture, flippedCoord + vec2(-2.0*t.x,  1.0*t.y)).rgb *  4.0;
    blurC += texture(u_texture, flippedCoord + vec2(-1.0*t.x,  1.0*t.y)).rgb * 16.0;
    blurC += texture(u_texture, flippedCoord + vec2( 0.0,      1.0*t.y)).rgb * 24.0;
    blurC += texture(u_texture, flippedCoord + vec2( 1.0*t.x,  1.0*t.y)).rgb * 16.0;
    blurC += texture(u_texture, flippedCoord + vec2( 2.0*t.x,  1.0*t.y)).rgb *  4.0;

    blurC += texture(u_texture, flippedCoord + vec2(-2.0*t.x,  2.0*t.y)).rgb *  1.0;
    blurC += texture(u_texture, flippedCoord + vec2(-1.0*t.x,  2.0*t.y)).rgb *  4.0;
    blurC += texture(u_texture, flippedCoord + vec2( 0.0,      2.0*t.y)).rgb *  6.0;
    blurC += texture(u_texture, flippedCoord + vec2( 1.0*t.x,  2.0*t.y)).rgb *  4.0;
    blurC += texture(u_texture, flippedCoord + vec2( 2.0*t.x,  2.0*t.y)).rgb *  1.0;

    blurC /= 256.0;
    blurC *= expScale;

    // Luma-only, same power curve as sharpness
    const vec3 luma = vec3(0.2126, 0.7152, 0.0722);
    float detail = dot(color - blurC, luma);

    // Midtone mask — clarity should affect midtones more than highlights/shadows
    float luminance = dot(color, luma);
    float midtoneMask = 1.0 - abs(luminance * 2.0 - 1.0); // peaks at 0.5 luma

    float clarityAmt = sign(u_clarity) * pow(abs(u_clarity), 1.5);

    color += detail * clarityAmt * midtoneMask;
    color = clamp(color, 0.0, 1.0);
  }

  // Dehaze: contrast + saturation + black-point lift
  if (abs(u_dehaze) > 0.001) {
    const vec3 luma = vec3(0.2126, 0.7152, 0.0722);
    float luminance = dot(color, luma);

    // Power curve same as sharpness/clarity
    float dehazeAmt = sign(u_dehaze) * pow(abs(u_dehaze), 1.5);

    if (u_dehaze > 0.001) {
      // --- Positive: remove haze ---

      // Dark channel approximation — haze lifts the darkest channel
      float darkChannel = min(min(color.r, color.g), color.b);

      // Haze estimate — assume haze color is near white, scale by dark channel
      float hazeStrength = darkChannel * dehazeAmt * 0.8;

      // Remove the haze veil
      color = (color - hazeStrength) / max(1.0 - hazeStrength, 0.001);

      // Recover saturation lost to haze (haze desaturates)
      float newLuma = dot(color, luma);
      color = mix(vec3(newLuma), color, 1.0 + dehazeAmt * 0.3);

      // Slight contrast push in midtones (haze flattens contrast)
      float midtoneMask = 1.0 - abs(luminance * 2.0 - 1.0);
      color += (color - vec3(0.5)) * dehazeAmt * 0.2 * midtoneMask;

    } else {
      // --- Negative: add haze/mist ---

      // Haze color — typically a warm or cool foggy white
      //    u_hazeColor could be a uniform, default to neutral white mist
      vec3 hazeColor = vec3(0.85, 0.88, 0.92); // cool mist tint

      // Blend toward haze color — stronger in shadows (distant objects)
      float shadowMask = 1.0 - luminance; // affect darks more than highlights
      float mistAmt = abs(dehazeAmt) * 0.6 * shadowMask;

      color = mix(color, hazeColor, mistAmt);

      // Compress contrast toward midgray (haze flattens)
      color = mix(color, vec3(0.5), abs(dehazeAmt) * 0.15);

      // Desaturate (haze kills color)
      float newLuma = dot(color, luma);
      color = mix(color, vec3(newLuma), abs(dehazeAmt) * 0.4);
    }

    color = clamp(color, 0.0, 1.0);
  }

  color = clamp(color, 0.0, 1.0);
`;
