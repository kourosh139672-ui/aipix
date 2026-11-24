(()=> {
"use strict";
const allowed=["rect","circle","ellipse","triangle","star","text","line","sun","cloud","tree","house","mountain","person","grass","flower","bush","rock","water","wood"];
const hex=v=>/^#[0-9a-f]{3,8}$/i.test(v||"");
function normalize(s={}){return{title:String(s.title||"تصویر PixAI").slice(0,80),background:hex(s.background)?s.background:"#eaf2ff",objects:(Array.isArray(s.objects)?s.objects:[]).slice(0,40).map((o,i)=>({type:allowed.includes(o.type)?o.type:"circle",x:Math.max(0,Math.min(100,Number(o.x)||10+i%5*18)),y:Math.max(0,Math.min(100,Number(o.y)||15+Math.floor(i/5)*20)),width:Math.max(1,Math.min(100,Number(o.width)||16)),height:Math.max(1,Math.min(100,Number(o.height)||16)),color:hex(o.color)?o.color:"#6d4aff",stroke:hex(o.stroke)?o.stroke:"#26324a",text:String(o.text||"").slice(0,100),detail:Math.max(1,Math.min(100,Number(o.detail)||35)),seed:Math.abs(Math.floor(Number(o.seed)||i*7919+17))}))}}}
function poly(c,p,fill,stroke){c.beginPath();p.forEach((v,i)=>i?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=3;c.stroke()}}
function rng(seed){let n=seed>>>0;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296}}
function blade(c,x,y,len,lean,color,width){c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+lean*.45,y-len*.55,x+lean,y-len);c.strokeStyle=color;c.lineWidth=width;c.lineCap="round";c.stroke()}
function drawGrass(c,o,w,h,x,y,bw,bh){const r=rng(o.seed),count=Math.round(35+o.detail*5),palette=[o.color,"#3f8f43","#65ad4d","#91c65c","#286d3a","#b2d875"];c.save();c.translate(x-bw/2,y+bh/2);for(let i=0;i<count;i++){const px=r()*bw,py=-r()*bh*.28,len=bh*(.12+r()*.55),lean=(r()-.5)*bh*.3;blade(c,px,py,len,lean,palette[Math.floor(r()*palette.length)],.7+r()*2.1)}c.restore()}
function draw(c,o,W,H){let x=W*o.x/100,y=H*o.y/100,w=W*o.width/100,h=H*o.height/100;c.save();c.translate(x,y);c.fillStyle=o.color;c.strokeStyle=o.stroke;c.lineWidth=3;
if(o.type==="rect"){c.fillRect(-w/2,-h/2,w,h);c.strokeRect(-w/2,-h/2,w,h)}
else if(["circle","sun"].includes(o.type)){c.beginPath();c.arc(0,0,Math.min(w,h)/2,0,Math.PI*2);c.fill();if(o.type==="sun"){for(let i=0;i<16;i++){let a=i*Math.PI/8;c.beginPath();c.moveTo(Math.cos(a)*w*.58,Math.sin(a)*h*.58);c.lineTo(Math.cos(a)*w*.76,Math.sin(a)*h*.76);c.stroke()}}}
else if(o.type==="ellipse"){c.beginPath();c.ellipse(0,0,w/2,h/2,0,0,Math.PI*2);c.fill();c.stroke()}
else if(o.type==="triangle")poly(c,[[0,-h/2],[w/2,h/2],[-w/2,h/2]],o.color,o.stroke)
else if(o.type==="star"){let p=[];for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,r=i%2?w*.22:w*.5;p.push([Math.cos(a)*r,Math.sin(a)*r])}poly(c,p,o.color,o.stroke)}
else if(o.type==="line"){c.beginPath();c.moveTo(-w/2,-h/2);c.lineTo(w/2,h/2);c.stroke()}
else if(o.type==="cloud"){c.beginPath();c.arc(-w*.22,0,h*.28,Math.PI/2,Math.PI*1.5);c.arc(0,-h*.2,h*.38,Math.PI,Math.PI*2);c.arc(w*.25,0,h*.28,-Math.PI/2,Math.PI/2);c.closePath();c.fill();c.stroke()}
else if(o.type==="tree"){c.fillStyle="#80512f";c.fillRect(-w*.08,0,w*.16,h*.48);for(let j=0;j<3;j++){c.fillStyle=j===1?o.color:(j===0?"#4b963f":"#367d39");poly(c,[[0,-h*(.55-j*.1)],[w*(.45-j*.04),h*(.15+j*.06)],[-w*(.45-j*.04),h*(.15+j*.06)]],c.fillStyle,null)}}
else if(o.type==="house"){c.fillRect(-w*.38,-h*.12,w*.76,h*.62);poly(c,[[0,-h*.5],[w*.5,-h*.08],[-w*.5,-h*.08]],o.stroke,o.stroke);c.fillStyle="#fff0bd";c.fillRect(-w*.1,h*.12,w*.2,h*.38);c.fillStyle="#9bd6f5";c.fillRect(-w*.29,h*.02,w*.13,h*.15);c.fillRect(w*.16,h*.02,w*.13,h*.15)}
else if(o.type==="mountain"){poly(c,[[-w/2,h/2],[-w*.12,-h/2],[w*.08,-h*.08],[w*.28,-h*.34],[w/2,h/2]],o.color,o.stroke);poly(c,[[-w*.12,-h/2],[0,-h*.18],[-w*.2,h*.02]],"#f4f5f7",null)}
else if(o.type==="person"){c.beginPath();c.arc(0,-h*.3,Math.min(w,h)*.17,0,Math.PI*2);c.fill();c.fillRect(-w*.1,-h*.1,w*.2,h*.45);c.beginPath();c.moveTo(-w*.08,h*.25);c.lineTo(-w*.3,h*.5);c.moveTo(w*.08,h*.25);c.lineTo(w*.3,h*.5);c.stroke()}
else if(o.type==="grass"){drawGrass(c,o,W,H,x,y,w,h)}
else if(o.type==="flower"){const r=rng(o.seed);for(let i=0;i<5;i++){let a=i*Math.PI*2/5;c.beginPath();c.ellipse(Math.cos(a)*w*.13,Math.sin(a)*h*.13,w*.13,h*.19,a,0,Math.PI*2);c.fillStyle=o.color;c.fill()}c.beginPath();c.arc(0,0,Math.min(w,h)*.1,0,Math.PI*2);c.fillStyle="#ffd34e";c.fill();c.beginPath();c.moveTo(0,h*.12);c.lineTo(0,h*.5);c.strokeStyle="#367d39";c.stroke()}
else if(o.type==="bush"){for(let i=0;i<7;i++){let a=i/7*Math.PI*2;c.beginPath();c.arc(Math.cos(a)*w*.22,Math.sin(a)*h*.18,Math.min(w,h)*(.2+(i%3)*.035),0,Math.PI*2);c.fillStyle=i%2?"#398345":o.color;c.fill()}}
else if(o.type==="rock"){c.beginPath();c.moveTo(-w*.5,h*.25);c.lineTo(-w*.32,-h*.25);c.lineTo(w*.12,-h*.5);c.lineTo(w*.48,-h*.12);c.lineTo(w*.38,h*.4);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(-w*.2,-h*.16);c.lineTo(w*.12,-h*.38);c.strokeStyle="#ffffff66";c.stroke()}
else if(o.type==="water"){c.fillRect(-w/2,-h/2,w,h);for(let i=0;i<Math.max(3,o.detail/5);i++){let yy=-h*.35+i*h*.7/Math.max(3,o.detail/5);c.beginPath();c.moveTo(-w*.4,yy);c.quadraticCurveTo(0,yy-h*.035,w*.4,yy);c.strokeStyle="#ffffff88";c.lineWidth=2;c.stroke()}}
else if(o.type==="wood"){c.fillRect(-w/2,-h*.18,w,h*.36);c.beginPath();c.ellipse(-w*.42,0,w*.08,h*.18,0,0,Math.PI*2);c.fillStyle="#d39a5d";c.fill();c.stroke()}
else if(o.type==="text"){c.font="bold "+Math.max(22,h*.65)+"px Tahoma";c.textAlign="center";c.textBaseline="middle";c.fillText(o.text||"PixAI",0,0,w*1.4)}
c.restore()}
function render(host,input){let s=normalize(input);host.innerHTML="";let cv=document.createElement("canvas");cv.width=1280;cv.height=900;cv.className="image-engine-canvas";let c=cv.getContext("2d");c.fillStyle=s.background;c.fillRect(0,0,cv.width,cv.height);const sky=c.createLinearGradient(0,0,0,cv.height);sky.addColorStop(0,"#ffffff16");sky.addColorStop(1,"#15223812");c.fillStyle=sky;c.fillRect(0,0,cv.width,cv.height);s.objects.forEach(o=>draw(c,o,cv.width,cv.height));return{canvas:cv,scene:s,download(){let a=document.createElement("a");a.download="pixai-image.png";a.href=cv.toDataURL("image/png");a.click()}}}
window.PixAIImageEngine={render,normalize,version:"2.0-detailed"};
})();