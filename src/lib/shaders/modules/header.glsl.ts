export const header = `
uniform sampler2D u_texture;
uniform vec2 u_resolution;

// Grading Uniforms
uniform float u_exposure;    // EV stops, -5.0 to +5.0
uniform float u_contrast;    // 0.0 to 2.0, pivot 1.0
uniform float u_saturation;  // 0.0 to 2.0, pivot 1.0
uniform float u_temperature; // -0.2 to 0.2
uniform float u_tint; // Tint adjustment
uniform float u_vibrance;  // Vibrance (smart saturation)

// Tone Ranges (slider -100 to 100, mapped to float)
uniform float u_toneHighlights;
uniform float u_toneShadows;
uniform float u_whites;
uniform float u_blacks;

// Primary Wheels
uniform vec3 u_shadows;      // Lift
uniform vec3 u_midtones;     // Gamma
uniform vec3 u_highlights;   // Gain
uniform vec3 u_global;       // Offset

// Curves LUTs (1D textures)
uniform sampler2D u_curveMaster;
uniform sampler2D u_curveRed;
uniform sampler2D u_curveGreen;
uniform sampler2D u_curveBlue;

// HSL LUTs (1D textures)
uniform sampler2D u_hslHue;
uniform sampler2D u_hslSat;
uniform sampler2D u_hslLum;

// Clipping Toggles
uniform bool u_showShadowClipping;
uniform bool u_showHighlightClipping;

in vec2 v_texCoord;
out vec4 outColor;
`;
