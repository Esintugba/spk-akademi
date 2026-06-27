import type { ReactNode } from 'react'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Box, Button, Checkbox, CircularProgress, Container, FormControlLabel, Link, Paper, Stack, TextField, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { z } from 'zod'
import { MarketingHero } from '../common/MarketingHero'
import { MarketingSectionHeading } from '../common/MarketingSectionHeading'
import { iconTileSx, marketingCardSx, marketingPageSx, marketingSectionSx } from '../common/marketingStyles'
import { contactApi } from '../../shared/api'

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Ad soyad en az 2 karakter olmalıdır.').max(120),
  email: z.string().trim().email('Geçerli bir e-posta girin.').max(254),
  subject: z.string().trim().min(3, 'Konu en az 3 karakter olmalıdır.').max(180),
  message: z.string().trim().min(20, 'Mesaj en az 20 karakter olmalıdır.').max(4000),
  kvkkAccepted: z.boolean().refine((value) => value, 'KVKK Aydinlatma Metnini onaylamalisiniz.'),
  commercialElectronicMessages: z.boolean(),
  website: z.string().max(200).optional(),
})

type ContactFormValues = z.infer<typeof contactSchema>

export function ContactPage() {
  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
    reset,
  } = useForm<ContactFormValues>({
    defaultValues: {
      email: '',
      message: '',
      name: '',
      subject: '',
      kvkkAccepted: false,
      commercialElectronicMessages: false,
      website: '',
    },
    mode: 'onChange',
    resolver: zodResolver(contactSchema),
  })

  const mutation = useMutation({
    mutationFn: contactApi.create,
    onSuccess: () => {
      toast.success('Mesajınız başarıyla gönderildi.')
      reset()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Mesaj gönderilirken bir hata oluştu.')
    },
  })

  function onSubmit(values: ContactFormValues) {
    mutation.mutate({
      email: values.email.trim(),
      message: values.message.trim(),
      name: values.name.trim(),
      subject: values.subject.trim(),
      kvkkAccepted: values.kvkkAccepted,
      commercialElectronicMessages: values.commercialElectronicMessages,
      website: values.website?.trim(),
    })
  }

  return (
    <Box sx={marketingPageSx}>
      <MarketingHero
        eyebrow="İletişim"
        title="Soruların, iş birlikleri taleplerin veya destek ihtiyacın için buradayız."
        description="Kurumsal görüşmeler, demo talepleri ve kullanıcı desteği için aşağıdaki kanallardan bizimle iletişime geçebilirsin."
      />

      <Container maxWidth="xl" sx={marketingSectionSx}>
        <Box sx={{ alignItems: 'start', display: 'grid', gap: 3, gridTemplateColumns: { lg: 'minmax(0, 1fr) 380px', xs: '1fr' } }}>
          <Paper sx={{ borderRadius: 2, p: { md: 3, xs: 2.5 } }} variant="outlined">
            <MarketingSectionHeading
              eyebrow="Bize yaz"
              title="Mesajını bırak"
              description="Mesajın destek kuyruğuna kaydedilir ve ekibimize bildirim olarak iletilir."
            />
            <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(2, minmax(0, 1fr))', xs: '1fr' } }}>
                <TextField
                  autoComplete="name"
                  error={!!errors.name}
                  fullWidth
                  helperText={errors.name?.message}
                  label="Ad Soyad"
                  {...register('name')}
                />
                <TextField
                  autoComplete="email"
                  error={!!errors.email}
                  fullWidth
                  helperText={errors.email?.message}
                  label="E-posta"
                  type="email"
                  {...register('email')}
                />
                <TextField
                  error={!!errors.subject}
                  fullWidth
                  helperText={errors.subject?.message}
                  label="Konu"
                  sx={{ gridColumn: '1 / -1' }}
                  {...register('subject')}
                />
                <TextField
                  error={!!errors.message}
                  fullWidth
                  helperText={errors.message?.message}
                  label="Mesaj"
                  rows={5}
                  multiline
                  sx={{ gridColumn: '1 / -1' }}
                  {...register('message')}
                />
                <Box
                  aria-hidden="true"
                  sx={{ height: 0, left: -10000, overflow: 'hidden', position: 'absolute', width: 0 }}
                >
                  <TextField label="Website" tabIndex={-1} {...register('website')} />
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <FormControlLabel
                    control={<Checkbox {...register('kvkkAccepted')} />}
                    label={<Typography variant="body2"><Link href="/kvkk">KVKK Aydinlatma Metnini</Link> okudum.</Typography>}
                  />
                  {errors.kvkkAccepted && <Typography color="error" sx={{ display: 'block' }} variant="caption">{errors.kvkkAccepted.message}</Typography>}
                  <FormControlLabel
                    control={<Checkbox {...register('commercialElectronicMessages')} />}
                    label="Ticari elektronik ileti almak istiyorum."
                    sx={{ display: 'block' }}
                  />
                </Box>
                <Button
                  disabled={!isValid || mutation.isPending}
                  startIcon={mutation.isPending ? <CircularProgress color="inherit" size={16} /> : <SendOutlinedIcon />}
                  sx={{ gridColumn: '1 / -1', justifySelf: 'start' }}
                  type="submit"
                  variant="contained"
                >
                  Mesaj gönder
                </Button>
              </Box>
            </Box>
          </Paper>

          <Stack spacing={2.5}>
            <ContactCard
              description="Genel sorular, iş birlikleri ve demo talepleri için."
              icon={<EmailOutlinedIcon color="primary" />}
              title="E-posta"
            >
              <Link href="mailto:iletisim@spkakademi.com" underline="hover">
                iletisim@spkakademi.com
              </Link>
            </ContactCard>
            <ContactCard
              description="Kullanıcı hesabı, erişim ve teknik yardım için."
              icon={<HeadsetMicOutlinedIcon color="primary" />}
              title="Destek"
            >
              <Link href="mailto:destek@spkakademi.com" underline="hover">
                destek@spkakademi.com
              </Link>
            </ContactCard>
            <ContactCard
              description="Ürün güncellemeleri ve genel duyurular."
              icon={<PublicOutlinedIcon color="primary" />}
              title="Sosyal"
            >
              <Typography color="text.secondary">
                LinkedIn, Instagram ve X kanallarımız kurumsal içerik akışı ile birlikte duyurulacak.
              </Typography>
            </ContactCard>
          </Stack>
        </Box>
      </Container>
    </Box>
  )
}

function ContactCard({
  children,
  description,
  icon,
  title,
}: {
  children: ReactNode
  description: string
  icon: ReactNode
  title: string
}) {
  return (
    <Paper sx={marketingCardSx} variant="outlined">
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
        <Box sx={iconTileSx}>{icon}</Box>
        <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{title}</Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ lineHeight: 1.8, mt: 1.25 }}>
        {description}
      </Typography>
      <Box sx={{ mt: 2 }}>{children}</Box>
    </Paper>
  )
}
