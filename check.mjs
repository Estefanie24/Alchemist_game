
import {HandLandmarker,FilesetResolver} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const $=id=>document.getElementById(id);const video=$("video"),canvas=$("canvas"),ctx=canvas.getContext("2d");
let landmarker=null,stream=null,active=false,mode="",score=0,time=60,streak=0,timer=null,lastT=-1,prevPose="",poseStart=0,lastAction=0,round=0,balls=[],targetX=.5,duelCountdown=0,duelResult=false,playerScores=[0,0],grabbed=false,grabX=.5,grabY=.5,repPose="",repSince=0,repCount=0,foodFactIndex=0;
const poses={open:"🖐️ OPEN PALM",pinch:"🤏 PINCH",fist:"✊ FIST",peace:"✌️ PEACE SIGN",rock:"✊ ROCK",paper:"🖐️ PAPER",scissors:"✌️ SCISSORS",ok:"👌 OK SIGN",thumb:"👍 THUMBS UP",horns:"🤘 HORNS"};
function classify(l){
 if(!l||l.length<21)return"NO HAND";
 // Compare fingertips with their PIP joints; use thumb-to-index distance for pinch.
 const index=l[8].y<l[6].y-.015, middle=l[12].y<l[10].y-.015, ring=l[16].y<l[14].y-.015, pinky=l[20].y<l[18].y-.015;
 const thumbOut=Math.hypot(l[4].x-l[2].x,l[4].y-l[2].y)>.105;
 const extended=[index,middle,ring,pinky].filter(Boolean).length;
 if(!thumbOut&&!index&&!middle&&!ring&&!pinky)return"FIST";
 if(index&&middle&&!ring&&!pinky)return"PEACE";
 if(thumbOut&&!index&&!middle&&!ring&&!pinky)return"THUMBS UP";
 if(index&&middle&&ring&&pinky)return"OPEN PALM";
 return"OTHER";
}
function draw(lms){
  canvas.width=video.videoWidth||640;
  canvas.height=video.videoHeight||480;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!lms||!lms.length)return;
  const edges=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
  for(const hand of lms){
    // Broad, blurred under-stroke creates the neon tube glow.
    ctx.save();
    ctx.lineCap="round";
    ctx.lineJoin="round";
    ctx.shadowColor="#00f5ff";
    ctx.shadowBlur=18;
    ctx.strokeStyle="rgba(0,245,255,.48)";
    ctx.lineWidth=8;
    for(const [a,b] of edges){
      ctx.beginPath();
      ctx.moveTo(hand[a].x*canvas.width,hand[a].y*canvas.height);
      ctx.lineTo(hand[b].x*canvas.width,hand[b].y*canvas.height);
      ctx.stroke();
    }
    // Bright inner line makes the skeleton readable on light and dark backgrounds.
    ctx.shadowBlur=7;
    ctx.strokeStyle="#70fff4";
    ctx.lineWidth=2.8;
    for(const [a,b] of edges){
      ctx.beginPath();
      ctx.moveTo(hand[a].x*canvas.width,hand[a].y*canvas.height);
      ctx.lineTo(hand[b].x*canvas.width,hand[b].y*canvas.height);
      ctx.stroke();
    }
    // Energy orb floats between thumb tip (4) and index tip (8).
    // It expands as the fingertips separate and flashes brightly when they pinch.
    const thumb=hand[4], index=hand[8];
    const tx=thumb.x*canvas.width, ty=thumb.y*canvas.height;
    const ix=index.x*canvas.width, iy=index.y*canvas.height;
    const dx=ix-tx, dy=iy-ty, distance=Math.hypot(dx,dy);
    const ox=(tx+ix)/2, oy=(ty+iy)/2;
    const pinch=distance/Math.min(canvas.width,canvas.height)<0.055;
    const radius=Math.max(7,Math.min(58,distance*0.43));
    ctx.save();
    ctx.globalCompositeOperation="lighter";
    ctx.shadowColor=pinch?"#fff4a8":"#55f6ff";
    ctx.shadowBlur=pinch?38:24;
    const gradient=ctx.createRadialGradient(ox-radius*.18,oy-radius*.2,1,ox,oy,radius);
    if(pinch){
      gradient.addColorStop(0,"#ffffff");
      gradient.addColorStop(.28,"#fff5b8");
      gradient.addColorStop(.65,"#ffbaff");
      gradient.addColorStop(1,"rgba(125,76,255,0)");
    }else{
      gradient.addColorStop(0,"rgba(255,255,255,.98)");
      gradient.addColorStop(.22,"rgba(112,255,248,.95)");
      gradient.addColorStop(.58,"rgba(35,184,255,.56)");
      gradient.addColorStop(1,"rgba(0,245,255,0)");
    }
    ctx.fillStyle=gradient;
    ctx.beginPath();ctx.arc(ox,oy,radius,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=pinch?"rgba(255,248,190,.95)":"rgba(140,255,255,.9)";
    ctx.lineWidth=pinch?3:1.8;
    ctx.beginPath();ctx.arc(ox,oy,Math.max(3,radius*.48),0,Math.PI*2);ctx.stroke();
    if(pinch){
      ctx.strokeStyle="rgba(255,255,255,.95)";ctx.lineWidth=2.2;
      ctx.beginPath();ctx.arc(ox,oy,radius+5,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();

    // Render a neon dot on every one of the 21 hand landmarks.
    hand.forEach((p,i)=>{
      const x=p.x*canvas.width,y=p.y*canvas.height;
      const r=(i===4||i===8)?5.2:4;
      ctx.beginPath();ctx.arc(x,y,r+3,0,Math.PI*2);
      ctx.fillStyle="rgba(0,245,255,.22)";ctx.shadowColor="#00f5ff";ctx.shadowBlur=18;ctx.fill();
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle=(i===4||i===8)?"#fff1a6":"#baffff";ctx.shadowColor="#00f5ff";ctx.shadowBlur=12;ctx.fill();
      ctx.beginPath();ctx.arc(x,y,Math.max(1.3,r*.38),0,Math.PI*2);
      ctx.fillStyle="#ffffff";ctx.shadowBlur=4;ctx.fill();
    });
    ctx.restore();
  }
}
function paintBoard(){
 if(mode==="sort"||mode==="healthy"||mode==="twosort"){
  const two=mode==="twosort",healthy=mode==="healthy";
  const leftLabel=two?"PLAYER 1":healthy?"🥗 NOURISH":"🔴 RED";
  const rightLabel=two?"PLAYER 2":healthy?"🍪 SOMETIMES":"🔵 BLUE";
  $("boardContent").innerHTML=`<div class="arena" id="arena" style="height:290px"><div class="sortbox r" style="left:8px;right:auto;width:100px;height:65px">${leftLabel}</div><div class="sortbox b" style="right:8px;width:100px;height:65px">${rightLabel}</div><div class="ball red" id="redball" style="top:45%;left:35%">${healthy?'🍎':'🔴'}</div><div class="ball blue" id="blueball" style="top:65%;left:55%">${healthy?'🍪':'🔵'}</div>${two?'<div style="position:absolute;top:0;bottom:0;left:50%;border-left:1px dashed #fff7"></div>':''}</div><p class="hint">${two?'Each player uses one hand. Player 1 aims for the left/top target; Player 2 aims for the right/bottom target. Keep both hands visible.':healthy?'Sort fruit, vegetables, and other nourishing foods into the green basket; put treats into the purple basket. Read the fact after each successful sort.':'Move your index fingertip into the matching target zone: red on the left/top, blue on the right/bottom. Hold briefly to score.'}</p>${healthy?'<p id="nutritionFact" class="hint" style="border:1px solid #8be0a4;border-radius:10px;padding:12px;background:#12301f">🥬 Nutrition fact will appear here after your first sort.</p>':''}${two?'<div class="scoreline"><span class="pill">Player 1: <b id="p1score">0</b></span><span class="pill">Player 2: <b id="p2score">0</b></span></div>':''}`;
 }else if(mode==="duel"){$("boardContent").innerHTML=`<div class="biggest" id="duelEmojis">✊　✌️</div><div class="arenaGesture"><div class="choice"><div class="e">✊</div>Rock</div><div class="choice"><div class="e">🖐️</div>Paper</div><div class="choice"><div class="e">✌️</div>Scissors</div></div><p class="hint">Show two valid signs. The game compares the signs after a countdown.</p>`}
 else if(mode==="grab"){$("boardContent").innerHTML=`<div class="arena" id="grabArena" style="height:300px"><div class="sortbox r" style="left:8px;right:auto;width:105px">💎 DROP</div><div class="sortbox b" style="right:8px;width:105px">🌙 DROP</div><div id="grabOrb" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:58px;height:58px;border-radius:50%;display:grid;place-items:center;font-size:34px;background:radial-gradient(circle,#fff,#8efcff 35%,#4a50d9 72%,transparent);box-shadow:0 0 28px #55f6ff">🔮</div><div id="grabCursor" style="position:absolute;left:50%;top:50%;width:20px;height:20px;border:2px solid #fff7a5;border-radius:50%;box-shadow:0 0 15px #fff7a5;pointer-events:none"></div></div><p class="hint">Pinch when the cursor is over the orb to grab it. While pinching, move the cursor into either glowing target; release only inside a target to score.</p><p id="grabStatus" class="hint">Orb waiting to be grabbed.</p>`}
 else if(mode==="rehab"){$("boardContent").innerHTML=`<div class="spellStage"><div class="biggest" id="rehabEmoji">🖐️</div><div id="rehabName" style="font-size:22px;color:#fff0b8">OPEN PALM</div><p class="hint" style="text-align:center;color:#f0f4ff">Gently make the displayed pose and hold it for 2 seconds. Switch hands or stop if uncomfortable.</p><div class="pill">Completed repetitions: <b id="repCount">0</b></div></div><p class="hint">Practice only within a comfortable range. Stop if you feel pain. This activity does not assess injury or replace clinician advice.</p>`}
 else{$("boardContent").innerHTML=`<div class="spellStage"><div class="biggest" id="targetEmoji">🖐️</div><div style="text-align:center;font-size:22px;color:#fff0b8;text-shadow:0 2px 8px #07101f" id="targetName">OPEN PALM</div><p class="hint" style="text-align:center;color:#f0f4ff;text-shadow:0 1px 5px #06101e">Copy the target gesture and hold it for 1 second.</p></div>`}
}
function startMini(m){mode=m;score=0;time=60;streak=0;round=0;duelResult=false;active=false;playerScores=[0,0];grabbed=false;prevPose="";grabX=.5;grabY=.5;repPose="";repSince=0;repCount=0;foodFactIndex=0;$("home").classList.add("hidden");$("play").classList.add("active");const titles={sort:"Ball Sorter",healthy:"Healthy Sorter",twosort:"Two-Player Sorter",grab:"Grab & Drop",rehab:"Hand Rehab Coach",duel:"Two-Hand Duel",copy:"Copy the Gesture"};$("gameTitle").textContent=titles[mode];$("modeTag").textContent={sort:"Fingertip accuracy",healthy:"Nutrition learning",twosort:"Cooperative competition",grab:"Pinch control",rehab:"Gentle pose practice",duel:"Two-hand challenge",copy:"Pose matching"}[mode];$("miniScore").textContent=score;$("miniTime").textContent=time;$("miniStreak").textContent=streak;$("camStart").disabled=false;$("camStart").textContent="Start Camera & Play";$("miniMsg").textContent="Press Start Camera to begin.";paintBoard();const instructions={sort:"BALL SORTER · Move your index fingertip to the red target (left/top) or blue target (right/bottom).",duel:"TWO-HAND DUEL · Show ROCK, PAPER, or SCISSORS with both hands and hold through the countdown.",copy:"COPY THE GESTURE · Match the displayed pose and hold it steadily for 1 second.",healthy:"HEALTHY SORTER · Point to the left basket for nourishing foods or the right basket for treats.",twosort:"TWO-PLAYER SORTER · Player 1 aims left/top; Player 2 aims right/bottom. Keep both hands visible.",grab:"GRAB & DROP · Pinch over the orb, move it into either target, then release."};$("liveInstruction").textContent=instructions[mode]||"Follow the on-screen gesture.";if(["sort","healthy","twosort"].includes(mode))moveBalls();if(mode==="copy")newTarget();}
function openPotion(){location.href="potion-lab.html"}
function goHome(){stop();$("play").classList.remove("active");$("home").classList.remove("hidden")}
function resetMini(){stop();startMini(mode)}
function stop(){active=false;if(timer){clearInterval(timer);timer=null}if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}video.srcObject=null;$("detected").textContent="Camera is off."}
function moveBalls(){
 const r=$("redball"),b=$("blueball");if(!r||!b)return;
 r.style.top=(30+Math.random()*28)+"%";r.style.left=(25+Math.random()*25)+"%";
 b.style.top=(48+Math.random()*25)+"%";b.style.left=(52+Math.random()*23)+"%";
 if(mode==="healthy"){
  r.textContent=["🍎","🥦","🥕","🍊","🥜","🥣"][Math.floor(Math.random()*6)];
  b.textContent=["🍪","🍰","🍬","🍟","🧁"][Math.floor(Math.random()*5)];
 }
}
async function startTracking(){try{$("camStart").disabled=true;$("camStart").textContent="Loading hand tracking…";if(!landmarker){const vision=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");landmarker=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",delegate:"GPU"},runningMode:"VIDEO",numHands:2,minHandDetectionConfidence:.55,minHandPresenceConfidence:.5,minTrackingConfidence:.5})}stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:640},height:{ideal:480}},audio:false});video.srcObject=stream;await video.play();active=true;lastT=-1;poseStart=performance.now();lastAction=0;$("camStart").textContent="Camera Active";$("miniMsg").textContent="Magic is live — follow the challenge.";timer=setInterval(()=>{if(!active)return;time--;$("miniTime").textContent=time;if(time<=0){active=false;clearInterval(timer);timer=null;$("miniMsg").textContent=`Time's up! Final score: ${score}. Restart to try again.`;$("camStart").disabled=false;$("camStart").textContent="Play Again"}},1000);requestAnimationFrame(loop)}catch(e){console.error(e);$("camStart").disabled=false;$("camStart").textContent="Try Camera Again";$("miniMsg").textContent="Camera unavailable. Use HTTPS or localhost, allow camera permission, and check your internet connection."}}
function award(points,msg){score+=points;streak++;$("miniScore").textContent=score;$("miniStreak").textContent=streak;$("miniMsg").textContent=msg;lastAction=performance.now();poseStart=lastAction;if(["sort","healthy","twosort"].includes(mode))moveBalls();if(mode==="copy")newTarget();if(mode==="duel")newDuel()}
function newTarget(){const opts=[["open","🖐️","OPEN PALM"],["fist","✊","FIST"],["peace","✌️","PEACE SIGN"],["thumb","👍","THUMBS UP"]];let next=opts[Math.floor(Math.random()*opts.length)];if($("targetEmoji")){$("targetEmoji").textContent=next[1];$("targetName").textContent=next[2]}round=next[0];if($("liveInstruction"))$("liveInstruction").textContent="COPY THE GESTURE · Make a "+next[2]+" and hold it steadily for 1 second."}
function newDuel(){duelResult=false;duelCountdown=0;if($("duelEmojis"))$("duelEmojis").textContent="Show both signs"}
function loop(){
 if(!active)return;
 if(video.readyState>=2&&video.currentTime!==lastT){
  lastT=video.currentTime;
  const res=landmarker.detectForVideo(video,performance.now());
  const all=res.landmarks||[];draw(all);const gs=all.map(classify);
  const shown=gs.find(g=>["FIST","OPEN PALM","PEACE","THUMBS UP"].includes(g))||"NO HAND";
  $("gestureLabel").textContent=shown;$("gestureLabel").classList.toggle("nohand",shown==="NO HAND");
  $("detected").textContent=all.length?`Detected: ${gs.join(" · ")}`:"No hand detected — bring a hand into view.";
  const now=performance.now();
  // Copy the Gesture: require a stable matching pose, then advance the target.
  if(mode==="copy"){
   const map={"OPEN PALM":"open","FIST":"fist","PEACE":"peace","THUMBS UP":"thumb"};
   const pose=map[gs[0]]||"";
   if(pose&&pose===round){if(!prevPose||prevPose!==pose){prevPose=pose;poseStart=now;}else if(now-poseStart>=1000&&now-lastAction>=900){award(10,"Correct! You held the gesture for 1 second. Copy the next spell.");prevPose="";}}
   else {prevPose="";poseStart=now;}
  }
  // Sorters: aim the index fingertip at a target zone. Cooldown prevents repeat-scoring.
  if(["sort","healthy"].includes(mode)&&all.length&&now-lastAction>1000){
   const tip=all[0][8],x=1-tip.x,y=tip.y;
   if(x<.30&&y<.50){
    if(mode==="healthy"){
     const facts=["Fruit and vegetables provide vitamins, minerals, and fiber.","Whole grains often provide more fiber than refined grains.","Beans and lentils can provide both protein and fiber.","Water is a useful everyday drink for hydration.","A varied diet helps provide a range of nutrients."];
     $("nutritionFact").textContent="🥗 Nutrition fact: "+facts[foodFactIndex++%facts.length];award(10,"Nourishing food sorted into the left basket! +10 points.");
    }else award(10,"Red orb sorted! +10 points.");
   }else if(x>.70&&y>.50){
    if(mode==="healthy"){$("nutritionFact").textContent="🍪 Nutrition note: treats can fit into an overall varied eating pattern; portion and frequency matter.";award(5,"Treat sorted into the right basket. +5 points.");}
    else award(10,"Blue orb sorted! +10 points.");
   }
  }
  if(mode==="twosort"&&all.length>=2&&now-lastAction>1000){
   const hands=all.map((lm,i)=>({tip:lm[8],i})).sort((a,b)=>(1-a.tip.x)-(1-b.tip.x));
   const left=hands[0].tip,right=hands[1].tip;const lx=1-left.x,ly=left.y,rx=1-right.x,ry=right.y;
   if(lx<.30&&ly<.50){playerScores[0]+=10;$("p1score").textContent=playerScores[0];award(10,"Player 1 sorted into the left target! +10.");}
   else if(rx>.70&&ry>.50){playerScores[1]+=10;$("p2score").textContent=playerScores[1];award(10,"Player 2 sorted into the right target! +10.");}
  }
  // Grab & Drop: coordinate math is always in pixels, including after the orb moves.
  if(mode==="grab"&&all[0]){
   const h=all[0],thumb=h[4],index=h[8],d=Math.hypot(thumb.x-index.x,thumb.y-index.y),pinch=d<.055,mx=(thumb.x+index.x)/2,my=(thumb.y+index.y)/2;
   const orb=$("grabOrb"),cursor=$("grabCursor"),arena=$("grabArena");
   if(arena&&orb&&cursor){
    const rect=arena.getBoundingClientRect(),x=(1-mx)*rect.width,y=my*rect.height;
    cursor.style.left=x+"px";cursor.style.top=y+"px";
    const ox=parseFloat(orb.style.left||"50%");
    const oy=parseFloat(orb.style.top||"50%");
    const orbX=String(orb.style.left).includes("%")?ox/100*rect.width:ox;
    const orbY=String(orb.style.top).includes("%")?oy/100*rect.height:oy;
    if(pinch&&!grabbed&&Math.hypot(x-orbX,y-orbY)<75){grabbed=true;$("grabStatus").textContent="Orb grabbed! Move it into a target and release.";}
    if(grabbed&&pinch){orb.style.left=x+"px";orb.style.top=y+"px";orb.style.transform="translate(-50%,-50%)";orb.style.boxShadow="0 0 36px #fff7a5";}
    if(grabbed&&!pinch){
     const inLeft=x<rect.width*.30&&y<rect.height*.42,inRight=x>rect.width*.70&&y>rect.height*.58;
     if(inLeft||inRight){award(10,inLeft?"Orb delivered to the crystal target! +10.":"Orb delivered to the moon target! +10.");$("grabStatus").textContent="Success! Pinch the orb again for another delivery.";}
     else{$("miniMsg").textContent="Release inside the upper-left crystal or lower-right moon target to score. Try again.";$("grabStatus").textContent="Missed the target — pinch the orb to try again.";}
     grabbed=false;orb.style.left="50%";orb.style.top="50%";orb.style.transform="translate(-50%,-50%)";orb.style.boxShadow="0 0 28px #55f6ff";
    }
   }
  }
  if(mode==="rehab"&&all[0]){
   const pose=gs[0],valid=["OPEN PALM","FIST","PEACE","THUMBS UP"].includes(pose);
   const prompts={"OPEN PALM":["🖐️","OPEN PALM"],"FIST":["✊","GENTLE FIST"],"PEACE":["✌️","PEACE SIGN"],"THUMBS UP":["👍","THUMBS UP"]};
   if(valid){if(pose!==repPose){repPose=pose;repSince=now;$("rehabEmoji").textContent=prompts[pose][0];$("rehabName").textContent=prompts[pose][1]+" — HOLD";}else if(now-repSince>2000&&now-lastAction>700){repCount++;$("repCount").textContent=repCount;award(5,"Practice repetition completed. +5 points.");repPose="";repSince=now;}}
   else{repPose="";repSince=now;}
  }
  // Two-Hand Duel: countdown is visible and both signs must be valid before scoring.
  if(mode==="duel"&&all.length>=2&&now-lastAction>1500){
   if(!duelResult){
    if(!duelCountdown){duelCountdown=now;$("duelEmojis").textContent="3";}
    const elapsed=now-duelCountdown;
    if(elapsed<1000)$("duelEmojis").textContent="3";else if(elapsed<2000)$("duelEmojis").textContent="2";else if(elapsed<3000)$("duelEmojis").textContent="1";
    else{
     const conv={"FIST":"rock","OPEN PALM":"paper","PEACE":"scissors"},a=conv[gs[0]],b=conv[gs[1]],valid=["rock","paper","scissors"];
     if(valid.includes(a)&&valid.includes(b)){
      duelResult=true;const icons={rock:"✊",paper:"🖐️",scissors:"✌️"};$("duelEmojis").textContent=icons[a]+"　VS　"+icons[b];
      const winner=a===b?"Draw!":((a==="rock"&&b==="scissors")||(a==="scissors"&&b==="paper")||(a==="paper"&&b==="rock"))?"Hand 1 wins!":"Hand 2 wins!";
      award(a===b?5:10,`${winner} +${a===b?5:10} points. Show both signs again for the next round.`);
     }else{$("miniMsg").textContent="Show ROCK, PAPER, or SCISSORS with both hands; hold until the countdown ends.";duelCountdown=now;}
    }
   }
  }
 }
 requestAnimationFrame(loop);
}
// Expose module-scoped handlers to the inline onclick attributes used by the game buttons.
Object.assign(window, { openPotion, startMini, goHome, resetMini, startTracking });

