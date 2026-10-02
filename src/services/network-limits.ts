export const MAX_HYMN_RESPONSE_BYTES = 4 * 1024 * 1024;

interface BodyResponse {
  ok: boolean;
  headers: { get: (name: string) => string | null };
  body: ReadableStream<Uint8Array> | null;
}

/** Enforce the limit on received bytes, even when Content-Length is absent or false. */
export async function readLimitedBytes(response: BodyResponse, maximum: number, signal?: AbortSignal, progress?: (received: number, expected: number) => void): Promise<Uint8Array<ArrayBuffer>> {
  const expected = Number(response.headers.get('content-length')) || 0;
  if (!response.ok || expected > maximum || !response.body) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error('This response is unavailable or too large.');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let abort: (() => void) | undefined;
  const interrupted = new Promise<never>((_, reject) => {
    abort = () => reject(new Error('The request was interrupted.'));
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
  });
  try {
    while (true) {
      const part = await Promise.race([reader.read(), interrupted]);
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maximum) throw new Error('This response is too large.');
      chunks.push(part.value);
      progress?.(bytes, expected);
    }
    if (!bytes) throw new Error('This response was empty.');
    const data = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
    return data;
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    if (abort) signal?.removeEventListener('abort', abort);
    reader.releaseLock();
  }
}

export async function readLimitedJson(response: BodyResponse, signal?: AbortSignal): Promise<unknown> {
  if (!/^application\/(?:json|[a-z0-9.+-]+\+json)(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error('The hymn response is invalid.');
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readLimitedBytes(response, MAX_HYMN_RESPONSE_BYTES, signal)));
}
