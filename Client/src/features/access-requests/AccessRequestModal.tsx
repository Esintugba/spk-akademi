import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  const { open, planId, planName, closeModal } = useAccessRequestStore()

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
        <DialogTitle>Erişim talebi gönder</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
            Plan: <strong>{planName}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Mesajınız (opsiyonel)"
            rows={4}
            multiline
            placeholder="SPK Düzey 1 sınavına hazırlanıyorum, beta erişimi talep ediyorum."
            {...register('message')}
            error={Boolean(formState.errors.message)}
            helperText={formState.errors.message?.message}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>İptal</Button>
          <Button disabled={mutation.isPending || !planId} type="submit" variant="contained">
            {mutation.isPending ? 'Gönderiliyor…' : 'Başvuru gönder'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
