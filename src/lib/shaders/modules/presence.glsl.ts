export const presence = `
  // Presence — Texture, Clarity, Dehaze
  vec2 texel = 1.0 / u_resolution;

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

    // Scale: power curve for natural slider feel
    float sharpAmt = sign(u_textureAmt) * pow(abs(u_textureAmt), 1.5);

    // Luma-only to avoid color fringing
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
    float presLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(presLuma), color, 1.0 + u_dehaze * 0.2);
    color = color * (1.0 + u_dehaze * 0.3);
    color += u_dehaze * 0.05;
  }

  color = clamp(color, 0.0, 1.0);
`;
