export const exposure = `
  float evMult = pow(2.0, u_exposure);
  color = clamp(color * evMult, 0.0, 1.0);
`;
