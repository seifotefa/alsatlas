import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type DemoState={checkins:any[];media:any[];referrals:any[];consent:any;members:any[];observations:any[];consultations:any[]};
const file=resolve(process.cwd(),'data/demo/runtime-state.json');
const seed:DemoState={checkins:[],media:[],referrals:[],consent:{patientId:'demo-alex-chen',enabled:false,categories:{questions:false,movement:false,voice:false},updatedAt:new Date().toISOString()},members:[{id:'m1',name:'Jordan Chen',role:'Primary caregiver',access:'Full care access',initials:'JC'},{id:'m2',name:'Maya Chen',role:'Family member',access:'Updates & appointments',initials:'MC'},{id:'m3',name:'Dr. Priya Raman',role:'Physician',access:'Clinical summary',initials:'PR'}],observations:[],consultations:[]};
export function loadDemoState():DemoState{try{if(existsSync(file))return {...seed,...JSON.parse(readFileSync(file,'utf8'))}}catch{}return structuredClone(seed)}
export function saveDemoState(state:DemoState){try{mkdirSync(dirname(file),{recursive:true});writeFileSync(file,JSON.stringify(state,null,2),'utf8')}catch{} }
export async function persistToTiger(sql:string,params:any[]=[]){if(!process.env.TIGERDATA_DATABASE_URL)return false;const {Pool}=await import('pg');const pool=new Pool({connectionString:process.env.TIGERDATA_DATABASE_URL,ssl:{rejectUnauthorized:false},max:2});try{await pool.query(sql,params);return true}finally{await pool.end()}}
