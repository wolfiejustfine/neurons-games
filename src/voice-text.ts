export const normalizeVoiceText=(text:string)=>text.replace(/\s+/g,' ').trim();
export function recordingForText(text:string,recordings:Readonly<Record<string,string>>):string|undefined {
  return recordings[normalizeVoiceText(text)];
}
