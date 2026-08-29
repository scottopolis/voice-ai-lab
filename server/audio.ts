export function pcm16ToWav(pcm: Buffer, sampleRate = 24000, channels = 1): Buffer {
  const header = Buffer.alloc(44)
  header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8)
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20)
  header.writeUInt16LE(channels, 22); header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * channels * 2, 28); header.writeUInt16LE(channels * 2, 32); header.writeUInt16LE(16, 34)
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

export function safeUpstreamMessage(status:number): string {
  return `Upstream voice service returned HTTP ${status}. Check the configured model, voice, credentials, and account access.`
}
