import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import {
  SupportTicketCategory,
  SupportTicketPriority,
  supportTicketCategories,
  supportTicketPriorities,
} from '../../models'
import { supportTicketsApi } from '../../shared/api'

export function NewSupportTicketPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [category, setCategory] = useState(SupportTicketCategory.TechnicalIssue)
  const [priority, setPriority] = useState(SupportTicketPriority.Normal)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)

  const createMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      formData.append('category', String(category))
      formData.append('priority', String(priority))
      formData.append('subject', subject)
      formData.append('description', description)
      if (attachment) {
        formData.append('attachment', attachment)
      }

      return supportTicketsApi.create(formData)
    },
    onSuccess: async (ticket) => {
      await queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      navigate(`/support/tickets/${ticket.id}`)
    },
  })

  const canSubmit = subject.trim().length >= 5 && description.trim().length >= 10 && !createMutation.isPending

  return (
    <Stack spacing={3}>
      <StudentPageHero
        actions={<Button component={RouterLink} to="/support/my-tickets" variant="outlined">Taleplerime Dön</Button>}
        description="Sorunu kategori ve öncelik bilgisiyle ilet; gerekirse ekran görüntüsü, PDF veya döküman ekleyebilirsin."
        title="Yeni Talep Oluştur"
      />

      {createMutation.isError && (
        <Alert severity="error">
          {createMutation.error instanceof Error ? createMutation.error.message : 'Talep oluşturulamadı.'}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3, p: { md: 3, xs: 2.5 } }} variant="outlined">
        <Stack spacing={2.5}>
          <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
            <TextField
              fullWidth
              label="Kategori"
              onChange={(event) => setCategory(Number(event.target.value) as SupportTicketCategory)}
              select
              value={category}
            >
              {supportTicketCategories.map((item) => (
                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Öncelik"
              onChange={(event) => setPriority(Number(event.target.value) as SupportTicketPriority)}
              select
              value={priority}
            >
              {supportTicketPriorities.map((item) => (
                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            fullWidth
            label="Konu"
            onChange={(event) => setSubject(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 180 } }}
            value={subject}
          />
          <TextField
            fullWidth
            label="Açıklama"
            rows={6}
            multiline
            onChange={(event) => setDescription(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 4000 } }}
            value={description}
          />

          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5} sx={{ alignItems: { sm: 'center', xs: 'stretch' } }}>
            <Button component="label" startIcon={<AttachFileOutlinedIcon />} variant="outlined">
              Dosya Eki
              <input
                hidden
                onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
              />
            </Button>
            <Typography color="text.secondary" variant="body2">
              {attachment ? attachment.name : 'En fazla 8MB; jpg, png, webp, pdf, doc, docx veya txt.'}
            </Typography>
          </Stack>

          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5}>
            <Button
              disabled={!canSubmit}
              onClick={() => createMutation.mutate()}
              startIcon={<SendOutlinedIcon />}
              variant="contained"
            >
              Talebi Gönder
            </Button>
            <Button component={RouterLink} to="/support/my-tickets" variant="text">Vazgeç</Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  )
}
