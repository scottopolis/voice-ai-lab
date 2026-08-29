export type Fidelity = 'exact' | 'companion' | 'unavailable'
export interface PublicProvider { id:string; provider:string; model:string; type:'TTS'|'Native S2S'; fidelity:Fidelity; status:string; ready:boolean; requirements:Record<string,boolean>; voices:{id:string;label:string}[]; note:string }
export interface Provider extends PublicProvider { generate?: (text:string, voice?:string)=>Promise<AudioResult> }
export interface AudioResult { bytes:Buffer; contentType:string }
export class ApiError extends Error { constructor(public status:number, public code:string, message:string){super(message)} }
