import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import {
  hasQuestionExplanationHtml,
  sanitizeQuestionExplanationHtml,
} from '../../utils/questionExplanationHtml'

interface FormattedQuestionExplanationProps {
  text: string
  variant?: 'body1' | 'body2'
}

interface StructuredItem {
  description: string
  label: string
}

export function FormattedQuestionExplanation({
  text,
  variant = 'body1',
}: FormattedQuestionExplanationProps) {
  const normalizedText = text.replace(/\r\n?/g, '\n').trim()

  if (hasQuestionExplanationHtml(normalizedText)) {
    return (
      <Box
        dangerouslySetInnerHTML={{ __html: sanitizeQuestionExplanationHtml(normalizedText) }}
        sx={{
          fontSize: variant === 'body2' ? '0.875rem' : '1rem',
          lineHeight: 1.75,
          overflowWrap: 'anywhere',
          '& div, & p': { mb: 1, mt: 0 },
          '& div:last-child, & p:last-child': { mb: 0 },
          '& ol, & ul': { display: 'grid', gap: 1, mb: 0, mt: 1, pl: 3.5 },
        }}
      />
    )
  }

  const inlineStructure = extractInlineStructure(normalizedText)

  if (inlineStructure) {
    return (
      <Box sx={{ overflowWrap: 'anywhere' }}>
        <Typography component="div" sx={{ lineHeight: 1.75 }} variant={variant}>
          {formatInline(inlineStructure.introduction, true)}
        </Typography>
        <Box
          component="ul"
          sx={{
            display: 'grid',
            gap: 1,
            mb: 0,
            mt: 1.25,
            pl: 3.5,
          }}
        >
          {inlineStructure.items.map((item) => (
            <Box component="li" key={`${item.label}-${item.description}`}>
              <Typography component="div" sx={{ lineHeight: 1.75 }} variant={variant}>
                <strong>{item.label}:</strong> {formatInline(item.description)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    )
  }

  const blocks = buildBlocks(normalizedText)

  return (
    <Box sx={{ display: 'grid', gap: 1, overflowWrap: 'anywhere' }}>
      {blocks.map((block, index) => {
        if (block.type === 'list') {
          return (
            <Box
              component="ul"
              key={`list-${index}`}
              sx={{ display: 'grid', gap: 1, m: 0, pl: 3.5 }}
            >
              {block.lines.map((line) => (
                <Box component="li" key={line}>
                  <Typography component="div" sx={{ lineHeight: 1.75 }} variant={variant}>
                    {formatListItem(line)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )
        }

        return (
          <Typography
            component="div"
            key={`paragraph-${index}`}
            sx={{ lineHeight: 1.75, whiteSpace: 'pre-wrap' }}
            variant={variant}
          >
            {formatInline(block.lines.join('\n'), index === 0)}
          </Typography>
        )
      })}
    </Box>
  )
}

function extractInlineStructure(text: string) {
  if (text.includes('\n')) return null

  const labelPattern = /([A-ZÇĞİÖŞÜ][^.!?:]{1,80}):\s+/g
  const matches = Array.from(text.matchAll(labelPattern)).map((match) => ({
    descriptionStart: (match.index ?? 0) + match[0].length,
    index: match.index ?? 0,
    label: match[1].trim(),
  }))

  const introductionIndex = matches.findIndex(
    (match, index) => index < matches.length - 1 && matches[index + 1].index === match.descriptionStart,
  )
  if (introductionIndex < 0 || matches.length - introductionIndex < 3) return null

  const introductionMatch = matches[introductionIndex]
  const itemMatches = matches.slice(introductionIndex + 1)
  const items: StructuredItem[] = itemMatches.map((match, index) => {
    const nextMatch = itemMatches[index + 1]
    const descriptionEnd = nextMatch?.index ?? text.length

    return {
      description: text.slice(match.descriptionStart, descriptionEnd).trim(),
      label: match.label,
    }
  })

  return {
    introduction: text.slice(0, introductionMatch.descriptionStart).trim(),
    items,
  }
}

type TextBlock = {
  lines: string[]
  type: 'list' | 'paragraph'
}

function buildBlocks(text: string): TextBlock[] {
  const blocks: TextBlock[] = []

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    const listMatch = line.match(/^[•\-*]\s+(.+)$/)
    const type: TextBlock['type'] = listMatch ? 'list' : 'paragraph'
    const value = listMatch?.[1] ?? line
    const previous = blocks[blocks.length - 1]

    if (previous?.type === type) {
      previous.lines.push(value)
    } else {
      blocks.push({ lines: [value], type })
    }
  }

  return blocks
}

function formatListItem(text: string) {
  const separatorIndex = text.indexOf(':')
  if (separatorIndex <= 0 || separatorIndex > 80) return formatInline(text)

  return (
    <>
      <strong>{text.slice(0, separatorIndex)}:</strong>
      {formatInline(text.slice(separatorIndex + 1))}
    </>
  )
}

function formatInline(text: string, emphasizeOpening = false): ReactNode {
  const parts: ReactNode[] = []
  const boldPattern = /\*\*(.+?)\*\*/g
  let cursor = 0

  for (const match of text.matchAll(boldPattern)) {
    const index = match.index ?? 0
    parts.push(text.slice(cursor, index))
    parts.push(<strong key={`${index}-${match[1]}`}>{match[1]}</strong>)
    cursor = index + match[0].length
  }
  parts.push(text.slice(cursor))

  if (!emphasizeOpening || parts.some((part) => typeof part !== 'string')) return parts

  const commaIndex = text.indexOf(',')
  if (commaIndex < 2 || commaIndex > 60 || /[.!?:]/.test(text.slice(0, commaIndex))) return parts

  return (
    <>
      <strong>{text.slice(0, commaIndex)}</strong>
      {text.slice(commaIndex)}
    </>
  )
}
