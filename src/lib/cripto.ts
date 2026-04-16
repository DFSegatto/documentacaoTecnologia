/**
 * Criptografia AES-256-GCM no lado do cliente
 *
 * A chave deriva do UID do usuário + uma senha mestra da aplicação.
 * O banco recebe apenas dados cifrados — nunca senhas em texto claro.
 *
 * Fluxo:
 *  Salvar:   texto → encrypt(chave) → base64 cifrado → banco
 *  Ler:      banco → base64 cifrado → decrypt(chave) → texto
 */

const SALT = 'suporte-docs-credentials-v1'

/** Deriva uma CryptoKey AES-256-GCM a partir do userId */
async function derivarChave(userId: string): Promise<CryptoKey> {
  const enc    = new TextEncoder()
  const keyMat = await crypto.subtle.importKey(
    'raw',
    enc.encode(userId + SALT).buffer as ArrayBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name:       'PBKDF2',
      salt:       enc.encode(SALT).buffer as ArrayBuffer,
      iterations: 100_000,
      hash:       'SHA-256',
    },
    keyMat,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/** Converte ArrayBuffer para string base64 */
function bufParaBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

/** Converte string base64 para ArrayBuffer */
function base64ParaBuf(b64: string): ArrayBuffer {
  const bytes = new Uint8Array([...atob(b64)].map(c => c.charCodeAt(0)))
  return bytes.buffer as ArrayBuffer
}

/**
 * Criptografa um texto usando AES-256-GCM.
 * Retorna uma string no formato "iv_base64:ciphertext_base64"
 */
export async function criptografar(texto: string, userId: string): Promise<string> {
  if (!texto) return ''
  const chave = await derivarChave(userId)
  const iv    = crypto.getRandomValues(new Uint8Array(12))
  const enc   = new TextEncoder()

  const cifrado = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    chave,
    enc.encode(texto).buffer as ArrayBuffer
  )

  return `${bufParaBase64(iv.buffer as ArrayBuffer)}:${bufParaBase64(cifrado)}`
}

/**
 * Descriptografa uma string no formato "iv_base64:ciphertext_base64".
 * Retorna null se a chave estiver errada ou os dados corrompidos.
 */
export async function descriptografar(cifrado: string, userId: string): Promise<string | null> {
  if (!cifrado) return ''
  try {
    const [ivB64, dadosB64] = cifrado.split(':')
    if (!ivB64 || !dadosB64) return null

    const chave = await derivarChave(userId)
    const iv    = base64ParaBuf(ivB64)
    const dados = base64ParaBuf(dadosB64)

    const dec   = new TextDecoder()
    const texto = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      chave,
      dados
    )
    return dec.decode(texto)
  } catch {
    return null
  }
}

/** Verifica se uma string é um valor criptografado (formato iv:dados) */
export function estaCifrado(valor: string): boolean {
  if (!valor) return false
  const partes = valor.split(':')
  return partes.length === 2 && partes[0].length > 0 && partes[1].length > 0
}
