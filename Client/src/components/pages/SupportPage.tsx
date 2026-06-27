import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import { Box, Container, Paper, Stack, Typography } from '@mui/material'
import { MarketingHero } from '../common/MarketingHero'
import { MarketingSectionHeading } from '../common/MarketingSectionHeading'

const supportItems = [
  {
    icon: <ManageAccountsOutlinedIcon color="primary" />,
    title: 'Hesap ve erişim desteği',
    description: 'Lisans erişimi, rol tanımı, giriş sorunları ve oturum yönetimi için destek akışı.',
  },
  {
    icon: <HelpOutlineOutlinedIcon color="primary" />,
    title: 'Çalışma deneyimi desteği',
    description: 'Deneme devamı, rapor ekranları, içerik görünürlüğü ve öğrenci akışındaki sorular için yardım.',
  },
  {
    icon: <ShieldOutlinedIcon color="primary" />,
    title: 'Güvenlik ve gizlilik',
    description: 'Şifre değişikliği, tüm oturumları kapatma ve veri gizliliği talepleri için yönlendirme.',
  },
]

export function SupportPage() {
  return (
    <Box sx={{ pb: { md: 8, xs: 5 } }}>
      <MarketingHero
        eyebrow="Destek"
        title="Platform desteği ve kullanıcı yardımı"
        description="Öğrenci deneyimi, erişim modeli ve hesap güvenliğiyle ilgili ihtiyaçlar için destek alanları burada."
      />

      <Container maxWidth="lg" sx={{ mt: { md: 8, xs: 5 } }}>
        <MarketingSectionHeading
          eyebrow="Destek Alanları"
          title="Doğru ihtiyacı doğru kanala yönlendirin"
          description="Kullanıcı, içerik ve güvenlik akışlarını ayrı destek alanlarında topluyoruz."
        />
        <Stack spacing={2.5}>
          {supportItems.map((item) => (
            <Paper key={item.title} sx={{ borderRadius: 4, p: 3 }} variant="outlined">
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                {item.icon}
                <Typography sx={{ fontSize: 24, fontWeight: 900 }}>{item.title}</Typography>
              </Stack>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8, mt: 1.25 }}>
                {item.description}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Container>
    </Box>
  )
}
