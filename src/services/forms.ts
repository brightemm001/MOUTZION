export type MessageKind = 'prayer' | 'testimony';
export const messageLimits = { prayer: 2000, testimony: 5000 } as const;

type Validation = { valid: true; name: string; message: string; kind: MessageKind }
  | { valid: false; error: string };

// Preserve Yoruba, punctuation, and line breaks. Reject control characters that hide/spoof text.
const UNSAFE_TEXT = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/;

export function validateMessageForm(input: { name: unknown; message: unknown; kind: unknown }): Validation {
  if (input.kind !== 'prayer' && input.kind !== 'testimony') return { valid: false, error: 'Choose a prayer request or testimony.' };
  if (typeof input.name !== 'string' || !input.name.trim()) return { valid: false, error: 'Please enter your name.' };
  if (input.name.length > 100) return { valid: false, error: 'Keep your name within 100 characters.' };
  if (typeof input.message !== 'string' || input.message.trim().length < 10) return { valid: false, error: 'Please write a message with at least 10 characters.' };
  if (input.message.length > messageLimits[input.kind]) return { valid: false, error: `Keep your ${input.kind === 'prayer' ? 'prayer request' : 'testimony'} within ${messageLimits[input.kind].toLocaleString('en-NG')} characters.` };
  if (UNSAFE_TEXT.test(input.name) || /[\r\n\t]/.test(input.name) || UNSAFE_TEXT.test(input.message)) return { valid: false, error: 'Please remove unsupported control characters from your message.' };
  if (new TextEncoder().encode(input.name + input.message).byteLength > 32768) return { valid: false, error: 'This message is too large. Please shorten it.' };
  return { valid: true, name: input.name.trim(), message: input.message.trim(), kind: input.kind };
}
