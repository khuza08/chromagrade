export const presence = `
  // Presence — Texture, Clarity, Dehaze
  vec2 texel = 1.0 / u_resolution;

  // Texture: 3x3 USM (fine detail)
  if (abs(u_textureAmt) > 0.001) {
    vec3 blurT = vec3(0.0);
    blurT += texture(u_texture, flippedCoord + vec2(-texel.x, -texel.y)).rgb;
    blurT += texture(u_texture, flippedCoord + vec2( 0.0,     -texel.y)).rgb;
    blurT += texture(u_texture, flippedCoord + vec2( texel.x, -texel.y)).rgb;
    blurT += texture(u_texture, flippedCoord + vec2(-texel.x,  0.0    )).rgb;
    blurT += texture(u_texture, flippedCoord + vec2( texel.x,  0.0    )).rgb;
    blurT += texture(u_texture, flippedCoord + vec2(-texel.x,  texel.y)).rgb;
    blurT += texture(u_texture, flippedCoord + vec2( 0.0,      texel.y)).rgb;
    blurT += texture(u_texture, flippedCoord + vec2( texel.x,  texel.y)).rgb;
    blurT /= 8.0;
    color += (color - blurT) * u_textureAmt;
  }

  // Clarity: 5x5 USM (broad edges)
  if (abs(u_clarity) > 0.001) {
    vec3 blurC = vec3(0.0);
    vec2 o2 = texel * 2.0;
    blurC += texture(u_texture, flippedCoord + vec2(-o2.x, -o2.y)).rgb;
    blurC += texture(u_texture, flippedCoord + vec2( 0.0,  -o2.y)).rgb;
    blurC += texture(u_texture, flippedCoord + vec2( o2.x, -o2.y)).rgb;
    blurC += texture(u_texture, flippedCoord + vec2(-o2.x,  0.0 )).rgb;
    blurC += texture(u_texture, flippedCoord + vec2( o2.x,  0.0 )).rgb;
    blurC += texture(u_texture, flippedCoord + vec2(-o2.x,  o2.y)).rgb;
    blurC += texture(u_texture, flippedCoord + vec2( 0.0,   o2.y)).rgb;
    blurC += texture(u_texture, flippedCoord + vec2( o2.x,  o2.y)).rgb;
    blurC /= 8.0;
    color += (color - blurC) * u_clarity;
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
