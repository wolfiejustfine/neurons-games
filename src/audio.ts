import { save } from './save';
let audio: AudioContext | undefined;
let narration:HTMLAudioElement|undefined;
let narrationToken=0;
export function tone(kind:'tap'|'good'|'try'|'win'='tap') {
  if (!save.sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const notes = kind==='win' ? [523,659,784,1046] : kind==='good' ? [659,880] : kind==='try' ? [330,294] : [540];
    notes.forEach((f,i)=>{
      const osc=audio!.createOscillator(), gain=audio!.createGain(), at=audio!.currentTime+i*.09;
      osc.type='sine'; osc.frequency.value=f; gain.gain.setValueAtTime(0,at); gain.gain.linearRampToValueAtTime(.055,at+.012); gain.gain.exponentialRampToValueAtTime(.001,at+.16);
      osc.connect(gain).connect(audio!.destination); osc.start(at); osc.stop(at+.18);
    });
  } catch { /* Sound is optional. */ }
}
export function say(text:string) {
  if (!save.sound || !('speechSynthesis' in window)) return false;
  silence();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang='ru-RU'; utterance.rate=.88;
  const voice=speechSynthesis.getVoices().find((v)=>v.lang.startsWith('ru'));
  if (voice) utterance.voice=voice;
  speechSynthesis.speak(utterance);
  return true;
}
export async function narrate(text:string,id:string){
  silence();if(!save.sound)return;
  const token=narrationToken;
  narration=new Audio(import.meta.env.BASE_URL+'audio/riddle-'+id+'.mp3');
  narration.preload='auto';narration.volume=.85;
  try{await narration.play();}catch{if(token===narrationToken&&save.sound)say(text);}
}
export function silence() {
  narrationToken++;if(narration){narration.pause();narration.removeAttribute('src');narration.load();narration=undefined;}
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
