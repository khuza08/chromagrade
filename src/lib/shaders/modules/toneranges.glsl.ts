export const toneranges = `
  // Tone Ranges — Highlights, Shadows, Whites, Blacks
  float toneLuma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color += u_toneShadows * pow(1.0 - toneLuma, 2.0) * 0.3;
  color += u_toneHighlights * pow(toneLuma, 2.0) * 0.3;
  color += u_blacks * pow(1.0 - toneLuma, 4.0) * 0.3;
  color += u_whites * pow(toneLuma, 4.0) * 0.3;
  color = clamp(color, 0.0, 1.0);
`;
