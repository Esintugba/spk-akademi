const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export function resolveApiAssetUrl(url: string | null | undefined) {
  if (!url) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) {
    return url
  }

  if (!apiBaseUrl || !url.startsWith('/')) {
    return url
  }

  return `${apiBaseUrl.replace(/\/$/, '')}${url}`
}
