import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { accessRequestApi } from '../../shared/api'
import { useAccessRequestStore } from '../../stores/accessRequestStore'

const schema = z.object({
  message: z.string().max(2000, 'En fazla 2000 karakter').optional(),
})

type FormValues = z.infer<typeof schema>

const MY_REQUESTS_KEY = ['access-requests', 'my'] as const

export function AccessRequestModal() {
  const queryClient = useQueryClient()
  const {
    closeModal,
    licenses,
    open,
    planDescription,
    planId,
    planName,
    requestedLicenseName,
    scope,
  } = useAccessRequestStore()

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { message: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      accessRequestApi.create({
        planId: planId!,
        message: values.message?.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_REQUESTS_KEY })
      toast.success('Erişim talebiniz gönderildi.')
      reset()
      closeModal()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Başvuru gönderilemedi.')
    },
  })

  function onClose() {
    reset()
    closeModal()
  }

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <form
        onSubmit={handleSubmit((values) => {
          if (!planId) {
            return
          }
          mutation.mutate(values)
        })}
      >
        <DialogTitle>Erişim talebini onayla</DialogTitle>
        <DialogContent>
          <Stack spacing={2.25}>
            <Box>
              <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>
                Talep edilen paket
              </Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 900 }}>{planName}</Typography>
              {planDescription && (
                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  {planDescription}
                </Typography>
              )}
              {requestedLicenseName && (
                <Chip
                  color="primary"
                  label={`Seçilen lisans: ${requestedLicenseName}`}
                  size="small"
                  sx={{ fontWeight: 700, mt: 1.25 }}
                />
              )}
            </Box>

            {scope && (
              <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { sm: 'repeat(3, minmax(0, 1fr))', xs: '1fr' } }}>
                <ScopeMetric label="Ders" value={scope.courseCount} />
                <ScopeMetric label="Konu" value={scope.topicCount} />
                <ScopeMetric label="Soru" value={scope.questionCount} />
              </Box>
            )}

            {licenses.length > 0 && (
              <Box>
                <Typography sx={{ fontWeight: 850, mb: 1 }}>Bu talep şu lisansları kapsar</Typography>
                <Stack spacing={1}>
                  {licenses.slice(0, 8).map((license) => (
                    <Box
                      key={license.id}
                      sx={{
                        border: '1px solid rgba(148,163,184,0.22)',
                        borderRadius: 2,
                        p: 1.25,
                      }}
                    >
                      <Typography sx={{ fontWeight: 800 }}>{license.name}</Typography>
                      {(license.courseCount || license.topicCount || license.questionCount) && (
                        <Typography color="text.secondary" variant="body2">
                          {license.courseCount ?? 0} ders · {license.topicCount ?? 0} konu · {formatNumber(license.questionCount ?? 0)} soru
                        </Typography>
                      )}
                    </Box>
                  ))}
                  {licenses.length > 8 && (
                    <Typography color="text.secondary" variant="body2">
                      +{licenses.length - 8} lisans daha
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}

            <Divider />

            <TextField
              error={Boolean(formState.errors.message)}
              fullWidth
              helperText={formState.errors.message?.message}
              label="Mesajınız (opsiyonel)"
              multiline
              placeholder="Hangi sınava hazırlandığınızı veya talep nedeninizi kısaca yazabilirsiniz."
              rows={4}
              {...register('message')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>İptal</Button>
          <Button disabled={mutation.isPending || !planId} type="submit" variant="contained">
            {mutation.isPending ? 'Gönderiliyor...' : 'Bu paket için başvuru gönder'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

function ScopeMetric({ label, value }: { label: string; value?: number }) {
  return (
    <Box sx={{ bgcolor: 'rgba(15,23,42,0.035)', borderRadius: 2, p: 1.25 }}>
      <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{formatNumber(value ?? 0)}</Typography>
      <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 700 }}>
        {label}
      </Typography>
    </Box>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('tr-TR').format(value)
}
