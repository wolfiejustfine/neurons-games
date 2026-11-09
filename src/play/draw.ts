import Phaser from 'phaser';
import type { PlayContext } from './types';
export const INK = '#304363';
export const color = (value:string)=>Phaser.Display.Color.HexStringToColor(value).color;
export function label(c:PlayContext,x:number,y:number,text:string,size=30,opts:Phaser.Types.GameObjects.Text.TextStyle={}) {
  const t=c.scene.add.text(x,y,text,{fontFamily:'Rubik, Arial, sans-serif',fontSize:size,color:INK,align:'center',fontStyle:'normal',...opts}).setOrigin(.5);
  c.root.add(t); return t;
}
export function picture(c:PlayContext,key:string,x:number,y:number,size:number,silhouette=false) {
  const image=c.scene.add.image(x,y,key);
  image.setScale(size/Math.max(image.width,image.height));
  if(silhouette)image.setTint(color('#2b365a')).setTintMode(Phaser.TintModes.FILL);
  c.root.add(image);return image;
}
export function panel(c:PlayContext,x:number,y:number,w:number,h:number,fill='#ffffff',stroke='#dbe7f1',radius=26) {
  const g=c.scene.add.graphics();
  g.fillStyle(0x86a0c4,.10).fillRoundedRect(x-w/2,y-h/2+7,w,h,radius);
  g.fillStyle(color(fill),1).fillRoundedRect(x-w/2,y-h/2,w,h,radius);
  g.lineStyle(3,color(stroke),1).strokeRoundedRect(x-w/2,y-h/2,w,h,radius);
  c.root.add(g);return g;
}
export function target(c:PlayContext,id:string,x:number,y:number,w:number,h:number,act:()=>void) {
  const z=c.scene.add.zone(x,y,w,h).setInteractive({useHandCursor:true});
  let down=false;
  z.on('pointerdown',()=>{down=true;});
  z.on('pointerout',()=>{down=false;});
  z.on('pointerup',()=>{if(down){down=false;act();}});
  c.root.add(z); c.controls.push({id,x,y,width:w,height:h});return z;
}
export function button(c:PlayContext,id:string,x:number,y:number,w:number,h:number,text:string,act:()=>void,selected=false) {
  panel(c,x,y,w,h,selected?'#eaf5ff':'#ffffff',selected?c.info.accent:'#dbe7f1',22);
  label(c,x,y,text,28,{fontStyle:'bold'});
  return target(c,id,x,y,w,h,act);
}
export function movable(c:PlayContext,id:string,key:string,x:number,y:number,size:number,onDrop:(x:number,y:number)=>void,onTap?:()=>void) {
  const img=picture(c,key,x,y,size).setInteractive({useHandCursor:true});
  c.scene.input.setDraggable(img);
  let dragged=false;
  img.on('pointerdown',()=>{dragged=false;});
  img.on('dragstart',()=>{dragged=true;c.root.bringToTop(img);});
  img.on('drag',(_p:unknown,dx:number,dy:number)=>{img.setPosition(dx,dy);});
  img.on('dragend',()=>{onDrop(img.x,img.y);});
  img.on('pointerup',()=>{if(!dragged)onTap?.();});
  c.controls.push({id,x,y,width:size,height:size});
  return img;
}
export function confetti(c:PlayContext,x:number,y:number) {
  const colors=[0x55b7d3,0xe4b344,0x9e88d5,0x85c9a8,0xf09e9b];
  for(let i=0;i<14;i++){
    const dot=c.scene.add.circle(x,y,5+i%4,colors[i%colors.length]);c.root.add(dot);
    c.scene.tweens.add({targets:dot,x:x+Math.cos(i*2.4)*110,y:y+Math.sin(i*2.4)*110,alpha:0,duration:650,onComplete:()=>dot.destroy()});
  }
}
export const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
export function token(c:PlayContext,id:string,text:string,x:number,y:number,w:number,h:number,onDrop:(x:number,y:number)=>void,onTap:()=>void,selected=false) {
  const bg=c.scene.add.graphics();
  bg.fillStyle(color(selected?'#e6f5ff':'#ffffff')).fillRoundedRect(-w/2,-h/2,w,h,18);
  bg.lineStyle(3,color(selected?c.info.accent:'#cfdfea')).strokeRoundedRect(-w/2,-h/2,w,h,18);
  const t=c.scene.add.text(0,0,text,{fontFamily:'Rubik, Arial',fontSize:Math.min(45,h*.48),fontStyle:'bold',color:INK}).setOrigin(.5);
  const group=c.scene.add.container(x,y,[bg,t]).setSize(w,h).setInteractive({useHandCursor:true});
  c.root.add(group);c.scene.input.setDraggable(group);
  let dragged=false;
  group.on('pointerdown',()=>{dragged=false;});
  group.on('dragstart',()=>{dragged=true;c.root.bringToTop(group);});
  group.on('drag',(_p:unknown,dx:number,dy:number)=>group.setPosition(dx,dy));
  group.on('dragend',()=>onDrop(group.x,group.y));
  group.on('pointerup',()=>{if(!dragged)onTap();});
  c.controls.push({id,x,y,width:w,height:h});return group;
}
