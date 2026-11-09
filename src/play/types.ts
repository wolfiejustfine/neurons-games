import type Phaser from 'phaser';
import type { SceneGameInfo } from '../catalog';
export interface Control { id:string; x:number; y:number; width:number; height:number; }
export interface Hooks {
  instruction(text:string):void;
  feedback(text:string,kind?:'good'|'try'|'info'):void;
  win(message?:string):void;
  listen(text:string):void;
  clockPreview(minutes:number):void;
  numberQuestion(expression:string,accept:(answer:number)=>boolean):void;
  narrate(text:string,id:string):void;
}
export interface PlayContext {
  scene:Phaser.Scene;
  root:Phaser.GameObjects.Container;
  width:number; height:number; level:number; info:SceneGameInfo;
  controls:Control[];
  clear():void;
  hooks:Hooks;
}
export interface Round {
  render():void; hint():void; dispose?():void;
  hasProgress():boolean;
  inspect():Record<string,unknown>;
}
export type RoundFactory = (ctx:PlayContext)=>Round;
