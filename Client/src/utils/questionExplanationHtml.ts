import DOMPurify from 'dompurify'

const richTextPattern = /<(?:b|br|div|em|font|i|li|ol|p|span|strong|ul)\b/i

export function hasQuestionExplanationHtml(value: string) {
  return richTextPattern.test(value)
}

export function sanitizeQuestionExplanationHtml(value: string) {
  return DOMPurify.sanitize(value, {
    ALLOWED_ATTR: ['color'],
    ALLOWED_TAGS: ['b', 'br', 'div', 'em', 'font', 'i', 'li', 'ol', 'p', 'span', 'strong', 'ul'],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['style'],
    FORBID_TAGS: ['button', 'embed', 'form', 'iframe', 'img', 'input', 'link', 'object', 'script', 'style', 'svg'],
  })
}

export function getQuestionExplanationPlainText(value: string) {
  if (!hasQuestionExplanationHtml(value)) return value

  const container = document.createElement('div')
  container.innerHTML = sanitizeQuestionExplanationHtml(value)
  return container.textContent ?? ''
}
