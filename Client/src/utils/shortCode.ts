const shortCodePattern = /^[\p{L}\p{N}._~!$&'()*+,;=:@-]+$/u

export const shortCodeHelperText = 'Harf, rakam ve güvenli noktalama kullanabilirsin. Boşluk, /, ?, #, %, \\ kabul edilmez.'

export function isValidShortCode(value: string) {
  return shortCodePattern.test(value.trim())
}
