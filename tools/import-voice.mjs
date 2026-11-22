import {readFileSync,existsSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
import {resolve,basename} from 'node:path';
import {spawnSync} from 'node:child_process';
const folder=process.argv.find((arg,i)=>i>1&&!arg.startsWith('--'));
if(!folder){console.error('Usage: node tools/import-voice.mjs <folder-with-mp3> [--check]');process.exit(1);}
const plan=JSON.parse(readFileSync('assets/voice/script.json','utf8'));
const index=JSON.parse(readFileSync('src/voice-recordings.json','utf8'));
const found=[],missing=[],invalid=[];
for(const line of plan.lines){
  const source=resolve(folder,line.filename);
  if(!existsSync(source)){missing.push(line.filename);continue;}
  if(basename(line.filename)!==line.filename||!line.filename.endsWith('.mp3'))throw new Error('Invalid planned filename');
  const probe=spawnSync('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=codec_name:format=duration','-of','json',source],{encoding:'utf8'});
  if(probe.error)throw new Error('ffprobe is required to validate imported recordings.');
  let data;try{data=JSON.parse(probe.stdout);}catch{}
  if(probe.status!==0||data?.streams?.[0]?.codec_name!=='mp3'||!(Number(data?.format?.duration)>0&&Number(data?.format?.duration)<=180)){invalid.push(line.filename);continue;}
  found.push({line,source});
}
if(invalid.length){console.error(JSON.stringify({invalid}));process.exit(1);}
if(!process.argv.includes('--check')){
  mkdirSync('public/audio/voice',{recursive:true});
  for(const {line,source} of found){copyFileSync(source,'public/audio/voice/'+line.filename);index[line.text]=line.filename;}
  writeFileSync('src/voice-recordings.json',JSON.stringify(index,null,2)+'\n');
}
console.log(JSON.stringify({mode:process.argv.includes('--check')?'check':'import',found:found.length,total:plan.lines.length,missing:missing.length,imported:found.map(f=>f.line.filename)},null,2));
