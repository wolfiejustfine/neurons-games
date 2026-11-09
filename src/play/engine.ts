import Phaser from 'phaser';
import { PROPS, type SceneGameId, type SceneGameInfo } from '../catalog';
import type { Hooks, PlayContext, Round, RoundFactory } from './types';

const factories:Record<SceneGameId,()=>Promise<{default:RoundFactory}>> = {
  shadows:()=>import('../games/shadows'), anagrams:()=>import('../games/anagrams'),
  ciphers:()=>import('../games/ciphers'), proofreading:()=>import('../games/proofreading'),
  alarms:()=>import('../games/alarms'), rearrangement:()=>import('../games/rearrangement'),
  'color-sort':()=>import('../games/color-sort'), 'maze-codes':()=>import('../games/maze-codes'),
  'maze-sort':()=>import('../games/maze-sort'), tangles:()=>import('../games/tangles'),
  'hidden-objects':()=>import('../games/hidden-objects'),
  'math-coloring':()=>import('../games/math-coloring'),
  'riddle-wheel':()=>import('../games/riddle-wheel'),
};
const ALL_PROPS=[...new Set([...PROPS,'sign','box','compass','cable','house','cheese','cake','moon','cat','beetle','screw','nail'])];
interface RunData { info:SceneGameInfo; level:number; hooks:Hooks; factory:RoundFactory; }
class PlayScene extends Phaser.Scene {
  context!:PlayContext;
  round?:Round;
  runData!:RunData;
  constructor(){super('play');}
  init(data:RunData){this.runData=data;}
  preload(){
    this.load.setPath(import.meta.env.BASE_URL+'props/');
    for(const key of ALL_PROPS) if(!this.textures.exists(key)) this.load.svg(key,key+'.svg',{width:200,height:200});
    if(this.runData.info.id==='hidden-objects'&&!this.textures.exists('newt-lab')){
      this.load.setPath(import.meta.env.BASE_URL+'art/');this.load.image('newt-lab','newt-lab.webp');
    }
    if(this.runData.info.id==='alarms'){
      this.load.setPath(import.meta.env.BASE_URL+'art/');
      for(const hero of ['Aris','Jays','Newt','Ren'])if(!this.textures.exists('hero-'+hero))this.load.image('hero-'+hero,hero+'.webp');
    }
    if(this.runData.info.id==='maze-sort'&&!this.textures.exists('hero-Vinch')){
      this.load.setPath(import.meta.env.BASE_URL+'art/');this.load.image('hero-Vinch','Vinch.webp');
    }
  }
  create(data:RunData){
    this.input.dragDistanceThreshold=12;
    const root=this.add.container(0,0);
    this.context={
      scene:this,root,width:this.scale.width,height:this.scale.height,level:data.level,info:data.info,
      hooks:data.hooks,controls:[],clear:()=>{
        this.tweens.killAll();
        root.removeAll(true);this.context.controls=[];
      },
    };
    this.round=data.factory(this.context);
    this.round.render();
    const resize=()=>{
      this.context.width=this.scale.width;this.context.height=this.scale.height;
      this.round?.render();
    };
    this.scale.on('resize',resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.scale.off('resize',resize);this.round?.dispose?.();this.round=undefined;
    });
  }
}
export interface Engine {
  play(info:SceneGameInfo,level:number,hooks:Hooks):Promise<void>;
  hint():void;
  hasProgress():boolean;
  setInputEnabled(enabled:boolean):void;
  stop():void;
  inspect():unknown;
  destroy():void;
}
export function createEngine(host:HTMLElement):Engine {
  const scene=new PlayScene();
  const size=()=>({width:720,height:Math.max(500,Math.min(1150,720*host.clientHeight/Math.max(1,host.clientWidth)))});
  let request=0;
  const game=new Phaser.Game({
    type:Phaser.AUTO,parent:host,...size(),transparent:true,
    render:{antialias:true},audio:{noAudio:true},
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    scene:[],input:{activePointers:2},banner:false,
    fps:{target:60,limit:60},
  });
  const ready=new Promise<void>((resolve)=>{
    game.events.once(Phaser.Core.Events.READY,()=>{game.scene.add('play',scene,false);resolve();});
  });
  const observer=new ResizeObserver(()=>{if(host.clientWidth&&host.clientHeight){const s=size();game.scale.setGameSize(s.width,s.height);}});
  observer.observe(host);
  return {
    async play(info,level,hooks){
      const token=++request;
      const [module]=await Promise.all([factories[info.id](),ready]);
      if(token!==request)return;
      const s=size();game.scale.setGameSize(s.width,s.height);
      game.scene.start('play',{info,level,hooks,factory:module.default});
    },
    hint(){scene.round?.hint();},
    hasProgress(){return scene.round?.hasProgress()??false;},
    setInputEnabled(enabled){
      if(scene.input){scene.input.enabled=enabled;if(scene.input.keyboard)scene.input.keyboard.enabled=enabled;}
      if(!enabled&&game.scene.isActive('play'))game.scene.pause('play');
      else if(enabled&&game.scene.isPaused('play'))game.scene.resume('play');
    },
    stop(){request++;if(game.isBooted)game.scene.stop('play');},
    inspect(){return {game:scene.context?.info.id,level:scene.context?.level,width:scene.context?.width,height:scene.context?.height,controls:scene.context?.controls,round:scene.round?.inspect()};},
    destroy(){request++;observer.disconnect();game.destroy(true);},
  };
}
