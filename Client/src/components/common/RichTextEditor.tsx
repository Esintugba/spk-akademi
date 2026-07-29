import FormatBoldOutlinedIcon from '@mui/icons-material/FormatBoldOutlined'
import FormatClearOutlinedIcon from '@mui/icons-material/FormatClearOutlined'
import FormatColorTextOutlinedIcon from '@mui/icons-material/FormatColorTextOutlined'
import FormatItalicOutlinedIcon from '@mui/icons-material/FormatItalicOutlined'
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined'
import FormatListNumberedOutlinedIcon from '@mui/icons-material/FormatListNumberedOutlined'
import { Box, FormHelperText, FormLabel, IconButton, Stack, Tooltip } from '@mui/material'
import { useEffect, useRef } from 'react'
import {
  hasQuestionExplanationHtml,
  sanitizeQuestionExplanationHtml,
} from '../../utils/questionExplanationHtml'

interface RichTextEditorProps {
  label: string
  onChange: (value: string) => void
  required?: boolean
  value: string
}

export function RichTextEditor({
  label,
  onChange,
  required = false,
  value,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const nextHtml = hasQuestionExplanationHtml(value)
      ? sanitizeQuestionExplanationHtml(value)
      : escapePlainText(value)

    if (editor.innerHTML !== nextHtml) editor.innerHTML = nextHtml
  }, [value])

  function rememberSelection() {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange()
    }
  }

  function restoreSelection() {
    const selection = window.getSelection()
    if (!selection || !savedRangeRef.current) return

    selection.removeAllRanges()
    selection.addRange(savedRangeRef.current)
  }

  function emitValue() {
    const editor = editorRef.current
    if (!editor) return
    onChange(sanitizeQuestionExplanationHtml(editor.innerHTML))
    rememberSelection()
  }

  function applyCommand(command: string, commandValue?: string) {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()
    restoreSelection()
    document.execCommand(command, false, commandValue)
    emitValue()
  }

  return (
    <Box>
      <FormLabel required={required}>{label}</FormLabel>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          bgcolor: 'action.hover',
          border: 1,
          borderBottom: 0,
          borderColor: 'divider',
          borderRadius: '8px 8px 0 0',
          flexWrap: 'wrap',
          gap: 0.25,
          mt: 0.75,
          p: 0.5,
        }}
      >
        <ToolbarButton label="Kalın" onClick={() => applyCommand('bold')}>
          <FormatBoldOutlinedIcon fontSize="small" />
        </ToolbarButton>
        <ToolbarButton label="İtalik" onClick={() => applyCommand('italic')}>
          <FormatItalicOutlinedIcon fontSize="small" />
        </ToolbarButton>
        <ToolbarButton label="Madde işaretli liste" onClick={() => applyCommand('insertUnorderedList')}>
          <FormatListBulletedOutlinedIcon fontSize="small" />
        </ToolbarButton>
        <ToolbarButton label="Numaralı liste" onClick={() => applyCommand('insertOrderedList')}>
          <FormatListNumberedOutlinedIcon fontSize="small" />
        </ToolbarButton>
        <Tooltip title="Metin rengi">
          <Box
            component="label"
            sx={{
              alignItems: 'center',
              borderRadius: 1,
              cursor: 'pointer',
              display: 'inline-flex',
              height: 34,
              justifyContent: 'center',
              position: 'relative',
              width: 34,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <FormatColorTextOutlinedIcon fontSize="small" />
            <Box
              component="input"
              type="color"
              defaultValue="#1f2937"
              aria-label="Metin rengi seç"
              onChange={(event) => applyCommand('foreColor', event.target.value)}
              sx={{ inset: 0, opacity: 0, position: 'absolute', cursor: 'pointer' }}
            />
          </Box>
        </Tooltip>
        <ToolbarButton label="Biçimlendirmeyi temizle" onClick={() => applyCommand('removeFormat')}>
          <FormatClearOutlinedIcon fontSize="small" />
        </ToolbarButton>
      </Stack>
      <Box
        ref={editorRef}
        aria-label={label}
        contentEditable
        role="textbox"
        suppressContentEditableWarning
        tabIndex={0}
        onBlur={rememberSelection}
        onInput={emitValue}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: '0 0 8px 8px',
          lineHeight: 1.7,
          minHeight: 150,
          outline: 0,
          overflowWrap: 'anywhere',
          p: 1.5,
          '&:focus': {
            borderColor: 'primary.main',
            boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
          },
          '&:empty::before': {
            color: 'text.disabled',
            content: '"Açıklamayı buraya yazın…"',
            pointerEvents: 'none',
          },
          '& ol, & ul': { my: 1, pl: 3.5 },
          '& p': { my: 0.75 },
        }}
      />
      <FormHelperText>
        Metni seçip kalın, italik, renk veya liste araçlarını kullanabilirsiniz.
      </FormHelperText>
    </Box>
  )
}

interface ToolbarButtonProps {
  children: React.ReactNode
  label: string
  onClick: () => void
}

function ToolbarButton({ children, label, onClick }: ToolbarButtonProps) {
  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        onClick={onClick}
        onMouseDown={(event) => event.preventDefault()}
        size="small"
      >
        {children}
      </IconButton>
    </Tooltip>
  )
}

function escapePlainText(value: string) {
  const container = document.createElement('div')
  container.textContent = value
  return container.innerHTML.replace(/\n/g, '<br>')
}
