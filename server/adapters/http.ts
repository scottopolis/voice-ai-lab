import { ApiError, type AudioResult } from '../types.js'
import { safeUpstreamMessage } from '../audio.js'

export async function audioFetch(url:string, init:RequestInit, timeoutMs=Number(process.env.REQUEST_TIMEOUT_MS||30000)):Promise<AudioResult>{
  let response:Response
  try { response=await fetch(url,{...init,signal:AbortSignal.timeout(timeoutMs)}) }
  catch(error){ throw new ApiError(504,'UPSTREAM_TIMEOUT',error instanceof DOMException?'Voice service timed out.':'Could not reach voice service.') }
  if(!response.ok) throw new ApiError(502,'UPSTREAM_ERROR',safeUpstreamMessage(response.status))
  const bytes=Buffer.from(await response.arrayBuffer())
  if(!bytes.length) throw new ApiError(502,'EMPTY_AUDIO','Voice service returned no audio.')
  return {bytes,contentType:response.headers.get('content-type')?.split(';')[0]||'audio/mpeg'}
}
