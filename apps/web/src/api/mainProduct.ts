export type PatientObservation={id:string;date?:string;observedAt?:string;type:string;value?:number|string;unit?:string;source:string;status:string;note?:string};
const json=async<T>(path:string,init?:RequestInit)=>{const r=await fetch(path,{headers:{'content-type':'application/json',...(init?.headers||{})},...init});if(!r.ok)throw new Error((await r.text())||`Request failed: ${r.status}`);return r.json() as Promise<T>};
export const mainProductApi={
  progress:()=>json<{alsfrs:any[];latest:any;checkins:any[]}>('/api/patients/demo-alex-chen/progress'),
  observations:()=>json<{observations:PatientObservation[]}>('/api/patients/demo-alex-chen/observations'),
  saveCheckin:(payload:any)=>json('/api/checkins',{method:'POST',body:JSON.stringify({patientId:'demo-alex-chen',...payload})}),
  consent:()=>json('/api/patients/demo-alex-chen/consent'),
  saveConsent:(payload:any)=>json('/api/patients/demo-alex-chen/consent',{method:'POST',body:JSON.stringify(payload)}),
  askAtlas:(message:string,threadId?:string)=>json('/api/chat',{method:'POST',body:JSON.stringify({patientId:'demo-alex-chen',message,threadId})}),
  speak:(text:string)=>fetch('/api/voice/tts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text})}).then(r=>{if(!r.ok)throw new Error('ElevenLabs unavailable');return r.blob()}),
  uploadMedia:(dataUrl:string,kind='movement')=>json('/api/media',{method:'POST',body:JSON.stringify({patientId:'demo-alex-chen',dataUrl,kind})}),
  uploadAudio:(dataUrl:string)=>json('/api/audio',{method:'POST',body:JSON.stringify({patientId:'demo-alex-chen',dataUrl})}),
  createReferral:(payload:any)=>json<{report:{id:string}}>('/api/referrals',{method:'POST',body:JSON.stringify({patientId:'demo-alex-chen',...payload})}),
  downloadReferral:(id:string)=>fetch(`/api/referrals/${id}/pdf`).then(r=>{if(!r.ok)throw new Error('Report unavailable');return r.blob()}),
  consultations:()=>json('/api/research/consultations'),
  createConsultation:(payload:any)=>json('/api/research/consultations',{method:'POST',body:JSON.stringify(payload)}),
  completeConsultation:(id:string)=>json(`/api/research/consultations/${id}/complete`,{method:'POST'}),
  researcherLogin:(email:string,name?:string)=>json('/api/research/auth/login',{method:'POST',body:JSON.stringify({email,name})}),
  researcherMe:(token:string)=>json('/api/research/auth/me',{headers:{authorization:`Bearer ${token}`}}),
};
