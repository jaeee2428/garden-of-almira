/* =====================================================================
   world/sky.js - procedural sky dome: gradient, sun, moon, stars, drifting clouds
   
   ===================================================================== */
(() => {
const { B, V3, C3, M4, scene } = G;
/* ---------- sky (procedural: gradient, sun, moon, stars, drifting clouds) ---------- */
B.Effect.ShadersStore.skyVertexShader = `precision highp float; attribute vec3 position; uniform mat4 worldViewProjection; varying vec3 vP;
void main(){ vP=position; gl_Position=worldViewProjection*vec4(position,1.); }`;
B.Effect.ShadersStore.skyFragmentShader = `precision highp float; varying vec3 vP;
uniform vec3 zen,hor,grd,sunDir,moonDir,sunCol,cloudCol; uniform float time,nightK,cloudK;
float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*n(p); p=p*2.03+vec2(7.1,3.7); a*=.5; } return s; }
void main(){ vec3 d=normalize(vP); float y=d.y;
  vec3 col=mix(hor,zen,pow(clamp(y,0.,1.),.5)); col=mix(col,grd,smoothstep(0.,-.1,y));
  float sd=max(dot(d,sunDir),0.); col+=sunCol*(pow(sd,6.)*.22+pow(sd,48.)*.5+smoothstep(.99965,.99985,sd)*7.);
  float md=max(dot(d,moonDir),0.); col+=vec3(.95,.97,1.)*smoothstep(.99935,.9996,md)*nightK*2.2+vec3(.45,.55,.85)*pow(md,60.)*.25*nightK;
  if(y>0.){ vec2 sp=d.xz/(y+.25)*55.; vec2 fc=fract(sp)-.5; float s=h(floor(sp)); float tw=.82+.18*sin(time*.8+s*60.); float st=smoothstep(.16+s*.08,0.,length(fc+ (vec2(h(floor(sp)+3.),h(floor(sp)+7.))-.5)*.5)); col+=vec3(1.,.97,.9)*step(.9955,s)*st*nightK*nightK*tw*1.7*smoothstep(0.,.25,y); vec2 sp2=d.xz/(y+.25)*150.; vec2 f2=fract(sp2)-.5; float s2=h(floor(sp2)+11.); float st2=smoothstep(.22,0.,length(f2+(vec2(h(floor(sp2)+5.),h(floor(sp2)+9.))-.5)*.5)); col+=mix(vec3(.75,.85,1.),vec3(1.,.9,.75),h(floor(sp2)+2.))*step(.993,s2)*st2*nightK*nightK*(.3+.25*sin(time*.9+s2*90.))*smoothstep(0.,.3,y); float band=exp(-pow(dot(d,normalize(vec3(.55,.35,-.76))),2.)*22.); col+=vec3(.55,.58,.7)*band*nightK*nightK*(.018+.03*h(floor(d.xz/(y+.25)*400.)))*smoothstep(0.,.3,y); }
  if(y>0.015){ vec2 cp=d.xz/(y+.1)*1.15+vec2(time*.006,time*.002); float c=fbm(cp*1.7); float c2=fbm(cp*3.1+4.);
    float cov=smoothstep(.5,.8,c*.75+c2*.35)*cloudK*smoothstep(.015,.22,y);
    vec3 cc=cloudCol*(.65+.55*pow(sd,2.)+.2*c2); col=mix(col,cc,cov*.9); }
  gl_FragColor=vec4(col,1.); }`;
const skyMat = new B.ShaderMaterial('skyMat', scene, { vertex: 'sky', fragment: 'sky' }, { attributes: ['position'], uniforms: ['worldViewProjection', 'zen', 'hor', 'grd', 'sunDir', 'moonDir', 'sunCol', 'cloudCol', 'time', 'nightK', 'cloudK'] });
skyMat.backFaceCulling = false; skyMat.disableDepthWrite = true;
const skyDome = B.MeshBuilder.CreateSphere('sky', { diameter: 1800, segments: 28 }, scene);
skyDome.material = skyMat; skyDome.infiniteDistance = true; skyDome.isPickable = false; skyDome.applyFog = false; skyDome.renderingGroupId = 0;
G.skyMat = skyMat;
})();
