// ---- Precision geometry + reliable bend (self-contained v4) ----
let v4Ux=1,v4Uy=0,v4Vx=0,v4Vy=1,v4Angle=0,v4IndexLen=90;
let v4Stable=12,v4StableFrames=0,v4BendAnchor=0;
const V4_A0=-58,V4_A1=58,V4_SPAN=116,V4_CLOSE=.24,V4_OPEN=.36;
function v4Point(a,r){return{x:cx+v4Ux*Math.cos(a)*r+v4Vx*Math.sin(a)*r,y:cy+v4Uy*Math.cos(a)*r+v4Vy*Math.sin(a)*r}}

drawRose=function(selMidi){
  const inner=rad*.79,outer=rad*1.02;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(v4Angle);ctx.lineCap='round';
  ctx.strokeStyle='rgba(190,220,255,.20)';ctx.lineWidth=Math.max(7,rad*.055);
  ctx.beginPath();ctx.arc(0,0,rad,V4_A0*D2R,V4_A1*D2R);ctx.stroke();
  const sa=(V4_A0+sel/24*V4_SPAN)*D2R;
  ctx.strokeStyle='rgba(88,166,255,.98)';ctx.lineWidth=Math.max(11,rad*.08);
  ctx.beginPath();ctx.arc(0,0,rad,sa-V4_SPAN/48*D2R,sa+V4_SPAN/48*D2R);ctx.stroke();ctx.restore();
  const low=range().low;
  for(let i=0;i<=24;i++){
    const a=(V4_A0+i/24*V4_SPAN)*D2R,m=low+i,name=mName(m),p=N[m%12],nat=NAT.has(p),s=i===sel;
    const A=v4Point(a,inner),B=v4Point(a,s?outer+9:(nat?outer+4:outer));
    ctx.strokeStyle=s?'rgba(88,166,255,.98)':nat?'rgba(240,247,255,.74)':'rgba(184,201,219,.40)';
    ctx.lineWidth=s?4:(nat?2.2:1.2);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();
    if(s||nat){const L=v4Point(a,rad*(s?1.19:1.14));ctx.save();ctx.translate(L.x,L.y);ctx.scale(-1,1);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=s?'#58a6ff':'rgba(245,249,255,.86)';ctx.font=`${s?900:760} ${s?Math.max(15,rad*.15):Math.max(10,rad*.09)}px system-ui`;ctx.fillText(s?name:p,0,0);ctx.restore()}
  }
  ctx.strokeStyle='rgba(255,255,255,.20)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(px,py);ctx.stroke();
  ctx.fillStyle=pinch?'#ffbf69':'#86d0ff';ctx.beginPath();ctx.arc(px,py,Math.max(8,rad*.07),0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2;ctx.stroke();
};

onResults=function(res){
  if(canvas.width!==video.videoWidth||canvas.height!==video.videoHeight){canvas.width=video.videoWidth||960;canvas.height=video.videoHeight||540}
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!res.multiHandLandmarks?.length){if(pinch||voice){stopVoice(.14);pinch=false;locked=null;bend=0}stateEl.textContent='ATTESA';bendEl.textContent='Bend: 0 cent';statusEl.textContent='Nessuna mano rilevata.';return}
  const lm=res.multiHandLandmarks[0];drawConnectors(ctx,lm,HAND_CONNECTIONS,{color:'#61afff',lineWidth:3});drawLandmarks(ctx,lm,{color:'#fff',lineWidth:1,radius:2.5});
  const p5={x:lm[5].x*canvas.width,y:lm[5].y*canvas.height},p17={x:lm[17].x*canvas.width,y:lm[17].y*canvas.height},p0={x:lm[0].x*canvas.width,y:lm[0].y*canvas.height},p9={x:lm[9].x*canvas.width,y:lm[9].y*canvas.height},t4={x:lm[4].x*canvas.width,y:lm[4].y*canvas.height},t8={x:lm[8].x*canvas.width,y:lm[8].y*canvas.height};
  palm=(dist(p5,p17)+dist(p0,p9))/2;v4IndexLen=dist(p5,t8);
  const ax=p9.x-p0.x,ay=p9.y-p0.y,alen=Math.max(1,Math.hypot(ax,ay));v4Ux=ax/alen;v4Uy=ay/alen;v4Vx=-v4Uy;v4Vy=v4Ux;v4Angle=Math.atan2(v4Uy,v4Ux);
  cx=lerp(cx||p5.x,p5.x,.44);cy=lerp(cy||p5.y,p5.y,.44);rad=lerp(rad,clamp(v4IndexLen*.92,68,Math.min(canvas.width,canvas.height)*.22),.40);
  px=t8.x;py=t8.y;
  const dx=px-cx,dy=py-cy,forward=dx*v4Ux+dy*v4Uy,side=dx*v4Vx+dy*v4Vy;
  const dg=clamp(Math.atan2(side,forward)/D2R,V4_A0,V4_A1);selF=(dg-V4_A0)/V4_SPAN*24;
  const target=Math.round(selF);if(target===v4Stable)v4StableFrames++;else{v4Stable=target;v4StableFrames=1}
  if(v4StableFrames>=3&&Math.abs(selF-sel)>.60)sel=v4Stable;
  const selMidi=range().low+sel;noteEl.textContent=mName(pinch&&locked!=null?locked:selMidi);
  if(!pinch){stateEl.textContent='PRONTA';bendEl.textContent='Bend: 0 cent';statusEl.textContent=`Selezionata ${mName(selMidi)} · chiudi pollice e indice per suonare`}
  const pinchNorm=dist(t4,t8)/Math.max(30,v4IndexLen),now=performance.now(),dt=prevTs?now-prevTs:16;
  let next=pinch;if(!pinch&&pinchNorm<V4_CLOSE)next=true;else if(pinch&&pinchNorm>V4_OPEN)next=false;
  const pm={x:(t4.x+t8.x)/2,y:(t4.y+t8.y)/2};
  const reach=((pm.x-p0.x)*v4Ux+(pm.y-p0.y)*v4Uy)/Math.max(30,palm);
  if(!pinch&&next){const vel=prevNorm==null?.72:clamp(.38+Math.max(0,(prevNorm-pinchNorm)/Math.max(1,dt))*11,.35,1);startNote(selMidi,vel);v4BendAnchor=reach;bend=0;voice&&voice.setPitch(0);stateEl.textContent='SUONA';statusEl.textContent=`Nota ON · ${mName(selMidi)} · volume ${Math.round(vel*100)}%`}
  if(pinch&&!next){stopVoice(.18);locked=null;bend=0;stateEl.textContent='PRONTA';bendEl.textContent='Bend: 0 cent';statusEl.textContent='Nota OFF · rilascio tipo assolo'}
  pinch=next;prevNorm=pinchNorm;prevTs=now;
  if(pinch&&voice){const sens=Number(sensEl.value),delta=reach-v4BendAnchor,dead=.014/sens,used=Math.abs(delta)>dead?(Math.abs(delta)-dead)*Math.sign(delta):0,full=.18/sens,targetB=clamp((used/full)*MAXB,-MAXB,MAXB);bend=lerp(bend,targetB,.52);voice.setPitch(bend);const cents=Math.round(bend*100);bendEl.textContent=`Bend: ${cents>0?'+':''}${cents} cent`;statusEl.textContent=`Nota ON · ${mName(locked)} · bend ${cents>0?'+':''}${cents} cent`}
  drawRose(selMidi)
};
hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:.68,minTrackingConfidence:.72});hands.onResults(onResults);
cam=async function(){stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:960},height:{ideal:540},frameRate:{ideal:30,min:24}}});video.srcObject=stream;await video.play();running=true;loop()};
