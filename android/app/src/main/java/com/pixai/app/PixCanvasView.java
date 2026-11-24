package com.pixai.app;
import android.content.Context;
import android.graphics.*;
import android.view.View;
import org.json.*;
import java.util.Random;

public final class PixCanvasView extends View {
 private final Paint p=new Paint(Paint.ANTI_ALIAS_FLAG); private JSONObject scene=new JSONObject(); private boolean animate=false; private long started=System.currentTimeMillis();
 public PixCanvasView(Context c){super(c);setLayerType(View.LAYER_TYPE_SOFTWARE,null);}
 public void setScene(JSONObject s,boolean motion){scene=s==null?new JSONObject():s;animate=motion;started=System.currentTimeMillis();invalidate();}
 private int col(String s,int d){try{return Color.parseColor(s);}catch(Exception e){return d;}}
 private float num(JSONObject o,String k,float d){return (float)o.optDouble(k,d);}
 private void fill(int c){p.setColor(c);p.setStyle(Paint.Style.FILL);p.setStrokeWidth(2);}
 @Override protected void onDraw(Canvas c){super.onDraw(c);float w=getWidth(),h=getHeight();if(w<=0||h<=0)return;c.drawColor(col(scene.optString("background","#b8ddf5"),0xffb8ddf5));JSONArray a=scene.optJSONArray("objects");if(a==null)a=scene.optJSONArray("elements");if(a!=null)for(int i=0;i<Math.min(60,a.length());i++){JSONObject o=a.optJSONObject(i);if(o!=null)drawObject(c,o,w,h,i);}if(animate)postInvalidateDelayed(40);}
 private void drawObject(Canvas c,JSONObject o,float w,float h,int i){String type=o.optString("type","rect").toLowerCase();float x=num(o,"x",.5f),y=num(o,"y",.5f),ww=num(o,"width",.2f),hh=num(o,"height",.2f);if(x<=1.5f)x*=w;if(y<=1.5f)y*=h;if(ww<=1.5f)ww*=w;if(hh<=1.5f)hh*=h;int color=col(o.optString("color",o.optString("fill","#4779a8")),0xff4779a8);if(animate&&(type.equals("circle")||type.equals("ellipse")))y+=(float)Math.sin((System.currentTimeMillis()-started)/500.0+i)*7;fill(color);
 switch(type){
 case "circle":case "sun":c.drawCircle(x,y,Math.max(ww,hh)/2,p);break;
 case "ellipse":c.drawOval(x-ww/2,y-hh/2,x+ww/2,y+hh/2,p);break;
 case "line":p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(Math.max(2,num(o,"strokeWidth",3)));c.drawLine(x,y,x+ww,y+hh,p);break;
 case "triangle":case "mountain":{Path q=new Path();q.moveTo(x-ww/2,y+hh/2);q.lineTo(x,y-hh/2);q.lineTo(x+ww/2,y+hh/2);q.close();c.drawPath(q,p);break;}
 case "cloud":c.drawOval(x-ww/2,y-hh*.2f,x+ww/2,y+hh*.4f,p);c.drawCircle(x-ww*.2f,y-hh*.1f,hh*.3f,p);c.drawCircle(x+ww*.15f,y-hh*.2f,hh*.38f,p);break;
 case "tree":fill(0xff76502e);c.drawRect(x-ww*.07f,y,x+ww*.07f,y+hh*.48f,p);fill(color);c.drawCircle(x,y-hh*.1f,ww*.32f,p);c.drawCircle(x-ww*.2f,y+hh*.03f,ww*.22f,p);c.drawCircle(x+ww*.2f,y+hh*.03f,ww*.22f,p);break;
 case "house":c.drawRect(x-ww/2,y-hh*.25f,x+ww/2,y+hh/2,p);{Path q=new Path();q.moveTo(x-ww*.58f,y-hh*.2f);q.lineTo(x,y-hh*.65f);q.lineTo(x+ww*.58f,y-hh*.2f);q.close();c.drawPath(q,p);}fill(0xff68472f);c.drawRect(x-ww*.09f,y+hh*.12f,x+ww*.09f,y+hh/2,p);break;
 case "grass":p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(2);Random r=new Random(i*37L+11);for(int j=0;j<18;j++){float gx=x+(r.nextFloat()-.5f)*ww;c.drawLine(gx,y+hh/2,gx+(r.nextFloat()-.5f)*10,y+hh/2-r.nextFloat()*hh,p);}break;
 case "text":p.setStyle(Paint.Style.FILL);p.setTextSize(num(o,"fontSize",22));c.drawText(o.optString("text","PixAI"),x,y,p);break;
 case "star":{Path q=new Path();for(int k=0;k<10;k++){double a=-Math.PI/2+k*Math.PI/5;float rr=(k%2==0?Math.max(ww,hh)/2:Math.max(ww,hh)/4);float sx=x+(float)Math.cos(a)*rr,sy=y+(float)Math.sin(a)*rr;if(k==0)q.moveTo(sx,sy);else q.lineTo(sx,sy);}q.close();c.drawPath(q,p);break;}
 default:c.drawRoundRect(new RectF(x-ww/2,y-hh/2,x+ww/2,y+hh/2),8,8,p);
 }}
}
