import DOMPurify from 'dompurify'

const allowedTags = [
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'blockquote',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'img',
  'a',
  'br',
  'hr',
]

const allowedAttributes = ['href', 'src', 'alt', 'title', 'target', 'rel', 'width', 'height', 'colspan', 'rowspan']

export function sanitizeBlogHtml(content: string) {
  return DOMPurify.sanitize(content, {
    ALLOWED_ATTR: allowedAttributes,
    ALLOWED_TAGS: allowedTags,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'svg', 'form', 'input', 'button', 'style', 'link'],
  })
}
