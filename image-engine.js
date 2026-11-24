(()=> {
const allowed=["rect","circle","ellipse","triangle","star","text","line","sun","cloud","tree","house","mountain","person"];
function normalize(s={}){return{title:String(s.title||"تصویر PixAI").slice(0,80),background:/^#[0-9a-f]{3,8}$/i.test(s.background||"")?s.background:"#eaf2ff",objects:(Array.isArray(s.objects)?s.objects:[]).slice(0,24).map((o,i)=>({type:allowed.includes(o.type)?o.type:"circle",x:Math.max(0,Math.min(100,Number(o.x)||10+i%5*18)),y:Math.max(0,Math.min(100,Number(o.y)||15+Math.floor(i/5)*20)),width:Math.max(2,Math.min(90,Number(o.width)||16)),height:Math.max(2,Math.min(90,Number(o.height)||16)),color:/^#[0-9a-f]{3,8}$/i.test(o.color||"")?o.color:"#6d4aff",stroke:/^#[0-9a-f]{3,8}$/i.test(o.stroke||"")?o.stroke:"#26324a",text:String(o.text||"").slice(0,100)}))}}}
function poly(c,p,fill,stroke){c.beginPath();p.forEach((v,i)=>i?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=4;c.stroke()}}
function draw(c,o,W,H){let x=W*o.x/100,y=H*o.y/100,w=W*o.width/100,h=H*o.height/100;c.save();c.translate(x,y);c.fillStyle=o.color;c.strokeStyle=o.stroke;c.lineWidth=4;
if(o.type==="rect"){c.fillRect(-w/2,-h/2,w,h);c.strokeRect(-w/2,-h/2,w,h)}
else if(["circle","sun"].includes(o.type)){c.beginPath();c.arc(0,0,Math.min(w,h)/2,0,Math.PI*2);c.fill();if(o.type==="sun")for(let i=0;i<12;i++){let a=i*Math.PI/6;c.beginPath();c.moveTo(Math.cos(a)*w*.58,Math.sin(a)*h*.58);c.lineTo(Math.cos(a)*w*.72,Math.sin(a)*h*.72);c.stroke()}}
else if(o.type==="ellipse"){c.beginPath();c.ellipse(0,0,w/2,h/2,0,0,Math.PI*2);c.fill();c.stroke()}
else if(o.type==="triangle")poly(c,[[0,-h/2],[w/2,h/2],[-w/2,h/2]],o.color,o.stroke)
else if(o.type==="star"){let p=[];for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,r=i%2?w*.22:w*.5;p.push([Math.cos(a)*r,Math.sin(a)*r])}poly(c,p,o.color,o.stroke)}
else if(o.type==="line"){c.beginPath();c.moveTo(-w/2,-h/2);c.lineTo(w/2,h/2);c.stroke()}
else if(o.type==="cloud"){c.beginPath();c.arc(-w*.22,0,h*.28,Math.PI/2,Math.PI*1.5);c.arc(0,-h*.2,h*.38,Math.PI,Math.PI*2);c.arc(w*.25,0,h*.28,-Math.PI/2,Math.PI/2);c.closePath();c.fill();c.stroke()}
else if(o.type==="tree"){c.fillStyle="#80512f";c.fillRect(-w*.08,0,w*.16,h*.48);poly(c,[[0,-h*.55],[w*.45,h*.15],[-w*.45,h*.15]],o.color,o.stroke);poly(c,[[0,-h*.3],[w*.38,h*.38],[-w*.38,h*.38]],o.color,o.stroke)}
else if(o.type==="house"){c.fillRect(-w*.38,-h*.12,w*.76,h*.62);poly(c,[[0,-h*.5],[w*.5,-h*.08],[-w*.5,-h*.08]],o.color,o.stroke);c.fillStyle="#fff0bd";c.fillRect(-w*.1,h*.12,w*.2,h*.38)}
else if(o.type==="mountain")poly(c,[[-w/2,h/2],[-w*.12,-h/2],[w*.08,-h*.08],[w*.28,-h*.34],[w/2,h/2]],o.color,o.stroke)
else if(o.type==="person"){c.beginPath();c.arc(0,-h*.3,Math.min(w,h)*.17,0,Math.PI*2);c.fill();c.fillRect(-w*.1,-h*.1,w*.2,h*.45);c.beginPath();c.moveTo(-w*.08,h*.25);c.lineTo(-w*.3,h*.5);c.moveTo(w*.08,h*.25);c.lineTo(w*.3,h*.5);c.stroke()}
else if(o.type==="text"){c.font="bold "+Math.max(22,h*.65)+"px Tahoma";c.textAlign="center";c.textBaseline="middle";c.fillText(o.text||"PixAI",0,0,w*1.4)}
c.restore()}
function render(host,input){let s=normalize(input);host.innerHTML="";let cv=document.createElement("canvas");cv.width=1280;cv.height=900;cv.className="image-engine-canvas";let c=cv.getContext("2d");c.fillStyle=s.background;c.fillRect(0,0,cv.width,cv.height);s.objects.forEach(o=>draw(c,o,cv.width,cv.height));host.appendChild(cv);return{canvas:cv,scene:s,download(){let a=document.createElement("a");a.download="pixai-image.png";a.href=cv.toDataURL("image/png");a.click()}}}
window.PixAIImageEngine={render,normalize};
})();