export const saturation = `
  // 7. Saturation & Vibrance (smart with skin protection)
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
   // Convert to HSV for per-pixel saturation & hue
   vec3 hsvVib = rgb2hsv(color);
   float sat = hsvVib.y;      // pixel saturation [0-1]
   float hue = hsvVib.x;      // pixel hue [0-1]

   // Skin-tone protection (same as before)
   float skinMask = smoothstep(0.05, 0.07, hue) *
                    (1.0 - smoothstep(0.14, 0.16, hue));
   float skinFactor = 1.0 - skinMask * 0.7;

   // Vibrance boost – stronger on low-saturation pixels
   float vibBoost = (1.0 - sat) * u_vibrance * skinFactor;

   // Apply vibrance to pixel saturation (clamped)
   hsvVib.y = clamp(sat + vibBoost, 0.0, 1.0);
   color = hsv2rgb(hsvVib);

  // Global saturation multiplier (unchanged behavior)
  color = mix(vec3(luma), color, u_saturation);
`;
