import type { MotionPreset } from './brand'

/**
 * The built-in motion backgrounds: small fragment shaders that mix the
 * brand's two lead colours over a near-black base. They share uniforms —
 * `u_a`/`u_b` (brand colours), `u_bg` (base), `u_time`, `u_res` — which is
 * the contract SkidLab presets will plug into later.
 */

export const VERTEX = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`

const HEADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_a;
uniform vec3 u_b;
uniform vec3 u_bg;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0., a = .5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.02 + vec2(17.3, 9.1); a *= .5; }
  return v;
}
// Shared finish: a soft vignette and a little film grain, so flat
// gradients don't band and every preset feels like the same family.
vec3 finish(vec3 col, vec2 uv){
  float v = smoothstep(1.3, .2, length(uv - .5) * 1.3);
  col *= mix(.7, 1., v);
  col += (hash(gl_FragCoord.xy + fract(u_time) * 61.) - .5) * .04;
  return clamp(col, 0., 1.);
}
`

const BODIES: Record<MotionPreset, string> = {
    // Domain-warped noise — slow liquid colour.
    flow: `
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - .5 * u_res) / u_res.y;
  float t = u_time * .1;
  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p * 1.1 + 2.5 * q + vec2(1.7, 9.2) + t * .7), fbm(p * 1.1 + 2.5 * q + vec2(8.3, 2.8) - t * .5));
  float f = fbm(p * 1.2 + 2.2 * r);
  vec3 col = mix(u_bg, u_a, smoothstep(.2, .8, f));
  col = mix(col, u_b, smoothstep(.45, 1.05, length(r)) * .9);
  col = mix(col, u_bg, smoothstep(.3, .75, q.x * q.y * 2.4) * .65);
  gl_FragColor = vec4(finish(col, uv), 1.);
}`,
    // Soft horizontal ribbons of light.
    aurora: `
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time * .16;
  vec3 col = u_bg;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float y = .5 + .2 * sin(uv.x * (1.6 + fi * .7) + t * (1. + fi * .35) + fi * 1.9)
                 + .22 * (fbm(vec2(uv.x * 2. + fi * 3., t + fi)) - .5);
    float d = uv.y - y;
    float glow = exp(-d * d * (34. - fi * 6.));
    vec3 c = mix(u_a, u_b, .5 + .5 * sin(fi * 1.7 + t));
    col += c * glow * (.5 - fi * .06);
  }
  gl_FragColor = vec4(finish(col, uv), 1.);
}`,
    // Two drifting lights.
    orb: `
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - .5 * u_res) / u_res.y;
  float t = u_time * .22;
  vec2 c1 = vec2(.5 * sin(t * .9), .26 * cos(t * .7));
  vec2 c2 = vec2(.55 * cos(t * .6 + 1.), .3 * sin(t * .8 + 2.));
  float w = (fbm(p * 2. + t) - .5) * .3;
  vec3 col = u_bg;
  col = mix(col, u_a, smoothstep(.8, 0., length(p - c1) + w));
  col = mix(col, u_b, smoothstep(.62, 0., length(p - c2) - w) * .92);
  gl_FragColor = vec4(finish(col, uv), 1.);
}`,
    // Contour lines over moving terrain.
    waves: `
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - .5 * u_res) / u_res.y;
  float t = u_time * .12;
  float n = fbm(p * 1.4 + vec2(t, -t * .6));
  float h = p.y * 1.2 + n * 1.5 + sin(p.x * 1.5 + t * 2.) * .22;
  float band = abs(fract(h * 8.) - .5);
  float px = 30. / u_res.y;
  float line = 1. - smoothstep(.035, .035 + px, band);
  vec3 c = mix(u_a, u_b, clamp(uv.x + (n - .5) * .8, 0., 1.));
  vec3 col = mix(u_bg, c, line) + c * .1 * n;
  gl_FragColor = vec4(finish(col, uv), 1.);
}`,
    // A halftone field breathing in waves.
    grid: `
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - .5 * u_res) / u_res.y;
  float t = u_time * .18;
  float N = 20.;
  vec2 g = p * N;
  vec2 id = floor(g);
  vec2 f = fract(g) - .5;
  float n = fbm(id / N * 2.4 + vec2(t, -t * .7));
  float wave = .5 + .5 * sin((id.x + id.y) * .35 - u_time * .8 + n * 6.);
  float r = mix(.05, .44, n * wave);
  float px = N / u_res.y * 1.5;
  float d = 1. - smoothstep(r - px, r + px, length(f));
  vec3 col = mix(u_bg, mix(u_a, u_b, n), d);
  gl_FragColor = vec4(finish(col, uv), 1.);
}`,
}

export const fragmentFor = (preset: MotionPreset) => HEADER + (BODIES[preset] ?? BODIES.flow)

export const MOTION_LABELS: Record<MotionPreset, string> = {
    flow: 'Flow',
    aurora: 'Aurora',
    orb: 'Orb',
    waves: 'Waves',
    grid: 'Halftone',
}
