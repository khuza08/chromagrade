import { header } from './modules/header.glsl';
import { helpers } from './modules/helpers.glsl';
import { exposure } from './modules/exposure.glsl';
import { whitebalance } from './modules/whitebalance.glsl';
import { primary } from './modules/primary.glsl';
import { toneranges } from './modules/toneranges.glsl';
import { presence } from './modules/presence.glsl';
import { saturation } from './modules/saturation.glsl';
import { curves } from './modules/curves.glsl';
import { hsl } from './modules/hsl.glsl';
import { clipping } from './modules/clipping.glsl';

export const fragmentShaderSource = `#version 300 es
precision highp float;

${header}
${helpers}

void main() {
  vec2 flippedCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
  vec4 texColor = texture(u_texture, flippedCoord);
  vec3 color = texColor.rgb;

${exposure}
${whitebalance}
${primary}
${toneranges}
${presence}
${saturation}
${curves}
${hsl}
${clipping}
}
`;
