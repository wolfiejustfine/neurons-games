import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('public/props',{recursive:true});
const defs='<defs><linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe9aa"/><stop offset="1" stop-color="#e8ae4a"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b9f2f4"/><stop offset="1" stop-color="#56b9c5"/></linearGradient><linearGradient id="purple" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d6c1f5"/><stop offset="1" stop-color="#9b83d2"/></linearGradient></defs>';
const shape=(d,fill='body')=>'<path d="'+d+'" fill="url(#'+fill+')" stroke="#9b865d" stroke-width="5" stroke-linejoin="round"/>';
const assets={};
for(let i=0;i<4;i++){
  const head=i===1?shape('M60 12L107 82H17Z'):i===2?'<rect x="26" y="22" width="68" height="69" rx="11" fill="url(#body)" stroke="#ba8f4c" stroke-width="5"/>':i===3?'<ellipse cx="60" cy="60" rx="25" ry="43" fill="url(#body)" stroke="#ba8f4c" stroke-width="5"/>':'<circle cx="60" cy="60" r="36" fill="url(#body)" stroke="#ba8f4c" stroke-width="5"/>';
  const teeth=i===1?'M68 87L148 169L172 145L151 124L139 136L124 120L136 108L118 90L106 102L91 87Z':'M68 87L148 169L172 145L154 127L141 140L116 114L128 102L108 82L95 96Z';
  assets['shadow-key-'+i]=head+shape(teeth);
  const left=i===1,body=i===2?'M53 54H133L125 162H61Z':i===3?'M44 83H139L129 160H54Z':'M44 67H139L129 160H54Z';
  const handle=left?'M49 81H30Q7 82 14 117Q22 143 51 133':'M134 81H153Q185 84 177 115Q172 139 133 133';
  assets['shadow-cup-'+i]='<path d="'+handle+'" fill="none" stroke="#9b83d2" stroke-width="17"/>'+shape(body,'purple')+(i===3?'<path d="M49 88L25 57L63 81Z" fill="url(#purple)" stroke="#9b865d" stroke-width="5"/>':'');
  const flask=[
    'M78 24H122V42H114V81L163 151Q174 177 145 178H55Q26 177 37 151L86 81V42H78Z',
    'M78 24H122V42H113V70C184 99 164 179 100 179C36 179 16 99 87 70V42H78Z',
    'M73 24H127V42H116V78L157 115V177H43V115L84 78V42H73Z',
    'M79 24H121V42H113V81L142 103L174 77L184 88L152 126L165 153Q175 177 144 178H56Q25 177 35 153L87 81V42H79Z',
  ][i];
  assets['shadow-flask-'+i]=shape(flask,'glass');
  const nose=i===1?'M65 57V38Q65 27 76 27H124Q135 27 135 38V57':'M65 57Q77 35 100 18Q125 35 135 57';
  const rocketBody=nose+'V144L120 165H80L65 144Z';
  const fins=i===2?'M65 105L32 126L27 165L70 145M135 105L168 126L173 165L130 145':i===3?'M65 105Q24 124 41 171L80 149M135 105Q176 124 159 171L120 149':'M65 105L35 160L70 145M135 105L165 160L130 145';
  assets['shadow-rocket-'+i]=shape(fins,'purple')+shape(rocketBody,'glass')+'<circle cx="100" cy="87" r="19" fill="#fff4c5" stroke="#9b865d" stroke-width="5"/>';
}
for(const [name,body] of Object.entries(assets))writeFileSync('public/props/'+name+'.svg','<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">'+defs+body+'</svg>');
console.log('Built '+Object.keys(assets).length+' silhouette comparison objects.');
