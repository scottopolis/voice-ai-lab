import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { registry } from './registry.js'
import { ApiError } from './types.js'
const json=(res:ServerResponse,status:number,value:unknown)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(value))}
const publicProvider=(source:ReturnType<typeof registry>[number])=>{const provider={...source};delete provider.generate;return provider}

export async function route(req:IncomingMessage,res:ServerResponse){
 try {
  if(req.method==='GET'&&req.url==='/api/providers') return json(res,200,{providers:registry().map(publicProvider)})
  if(req.method==='POST'&&req.url==='/api/generate'){
   const parts:Buffer[]=[];for await(const chunk of req)parts.push(Buffer.from(chunk));let body:unknown
   try{body=JSON.parse(Buffer.concat(parts).toString())}catch{throw new ApiError(400,'INVALID_JSON','Request body must be JSON.')}
   const {providerId,text,voice}=body as Record<string,unknown>
   if(typeof providerId!=='string'||typeof text!=='string'||!text.trim()||text.length>2000|| (voice!==undefined&&typeof voice!=='string'))throw new ApiError(400,'INVALID_REQUEST','Provide a providerId, 1–2,000 characters of text, and an optional voice.')
   const provider=registry().find(p=>p.id===providerId);if(!provider)throw new ApiError(404,'NOT_FOUND','Unknown provider.')
   if(!provider.generate)throw new ApiError(409,'ADAPTER_UNAVAILABLE',provider.note)
   if(!provider.ready)throw new ApiError(409,'NOT_READY','Required server credentials or configuration are missing.')
   const allowedVoice=voice||provider.voices[0]?.id;if(provider.voices.length&&!provider.voices.some(v=>v.id===allowedVoice))throw new ApiError(400,'INVALID_VOICE','Voice must be one exposed by the provider configuration.')
   const audio=await provider.generate(text.trim(),allowedVoice);res.writeHead(200,{'content-type':audio.contentType,'cache-control':'no-store','content-length':audio.bytes.length});return res.end(audio.bytes)
  }
  json(res,404,{error:{code:'NOT_FOUND',message:'Route not found.'}})
 }catch(error){const safe=error instanceof ApiError?error:new ApiError(500,'INTERNAL_ERROR','Unexpected server error.');json(res,safe.status,{error:{code:safe.code,message:safe.message}})}
}
export const createApp=()=>createServer(route)
