import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { MarketingHero } from '../common/MarketingHero'
import { MarketingSectionHeading } from '../common/MarketingSectionHeading'

const features = [
  {
    icon: <MenuBookOutlinedIcon />,
    title: 'Ders notları',
    description: 'Lisans, ders ve konu yapısına göre düzenlenmiş özet notlarla çalış.',
  },
  {
    icon: <QuizOutlinedIcon />,
    title: 'Soru bankası',
    description: 'Onaylı sorular, mini quiz ve süreli denemelerle bilgiyi pekiştir.',
  },
  {
    icon: <InsightsOutlinedIcon />,
    title: 'İlerleme takibi',
    description: 'Çalışma ritmini, tekrar ihtiyacını ve başarı oranını görünür hale getir.',
  },
]

const steps = [
  'Hedef lisansı seç',
  'Ders ve konularla çalış',
  'Mini test ve denemeler çöz',
  'Rapor ekranında güçlü ve zayıf alanlarını gör',
]

const highlights = [
  'SPK Akademi ile bütünleşik çalışma deneyimi',
  'Öğrenci ve admin için ayrı arayüz katmanları',
  'PDF, not, soru ve erişim yapısının tek omurgada birleşmesi',
]

export function LandingPage() {
  return (
    <Box sx={{ pb: { md: 8, xs: 5 } }}>
      <MarketingHero
        eyebrow="SPK Lisans Hazırlık Platformu"
        title="SPK hazırlığını tek sistemde planla, çalış ve ölç."
        description="Ders notları, kaynak PDF'ler, onaylı soru bankası, ücretsiz deneme sınavları ve öğrenci odaklı panel deneyimiyle sınav hazırlığını dağınık araçlardan çıkarıp tek akışta topla."
        actions={
          <>
            <Button component={RouterLink} endIcon={<ArrowForwardOutlinedIcon />} size="large" to="/register" variant="contained">
              Ücretsiz başla
            </Button>
            <Button component={RouterLink} size="large" to="/free-trial" variant="outlined">
              Ücretsiz denemeyi aç
            </Button>
          </>
        }
        sideContent={
          <Paper sx={{ borderRadius: 5, p: 3.25 }} variant="outlined">
            <Typography color="primary.main" sx={{ fontWeight: 800 }}>
              Çalışma akışı
            </Typography>
            <Typography sx={{ fontSize: 30, fontWeight: 900, mt: 1.5 }}>
              Dağınık kaynaklardan tek bir çalışma paneline
            </Typography>
            <Stack spacing={1.4} sx={{ mt: 3 }}>
              {steps.map((step) => (
                <Stack direction="row" key={step} spacing={1.25} sx={{ alignItems: 'center' }}>
                  <CheckCircleOutlineOutlinedIcon color="primary" fontSize="small" />
                  <Typography>{step}</Typography>
                </Stack>
              ))}
            </Stack>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(3, 1fr)', mt: 3 }}>
              {[
                { label: 'Aktif modül', value: '3' },
                { label: 'Public sayfa', value: 'Modern' },
                { label: 'Deneme akışı', value: 'Süreli' },
              ].map((stat) => (
                <Paper key={stat.label} sx={{ borderRadius: 3, p: 2, textAlign: 'center' }} variant="outlined">
                  <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{stat.value}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                    {stat.label}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Paper>
        }
      />

      <Container maxWidth="xl" sx={{ mt: { md: 8, xs: 5 } }}>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(3, 1fr)', xs: '1fr' } }}>
          {features.map((feature) => (
            <Paper key={feature.title} sx={{ borderRadius: 4, p: 3 }} variant="outlined">
              <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
              <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{feature.title}</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8, mt: 1.25 }}>
                {feature.description}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { lg: '1.05fr 0.95fr', xs: '1fr' }, mt: { md: 8, xs: 5 } }}>
          <Paper sx={{ borderRadius: 5, p: { md: 4, xs: 3 } }} variant="outlined">
            <MarketingSectionHeading
              eyebrow="Öğrenci deneyimi"
              title="Sadece içerik değil, çalışma momentumunu koruyan bir panel."
              description="Benim Programım, derslerim, konu çalışma ekranı, raporlar, deneme geçmişi ve profil güvenliği ile günlük kullanıma uygun sade ama güçlü bir deneyim sunar."
            />
            <Stack spacing={1.25}>
              {highlights.map((item) => (
                <Stack direction="row" key={item} spacing={1.2} sx={{ alignItems: 'center' }}>
                  <CheckCircleOutlineOutlinedIcon color="primary" fontSize="small" />
                  <Typography>{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ borderRadius: 5, p: { md: 4, xs: 3 } }} variant="outlined">
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
              <Box sx={{ bgcolor: 'rgba(37,99,235,0.08)', borderRadius: 2, color: 'primary.main', p: 1 }}>
                <WorkspacePremiumOutlinedIcon />
              </Box>
              <Typography sx={{ fontWeight: 900 }}>Ürün omurgası</Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
              Lisans, ders, konu, not, PDF, soru ve erişim katmanları aynı veri modeli içinde çalışır. Bu sayede arama, filtreleme, entitlement ve moderasyon akışı sistem genelinde tutarlı kalır.
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { sm: 'repeat(2, 1fr)', xs: '1fr' }, mt: 3 }}>
              {[
                { icon: <SchoolOutlinedIcon fontSize="small" />, label: 'Lisans bazlı kurgu' },
                { icon: <AutoStoriesOutlinedIcon fontSize="small" />, label: 'Ders ve konu hiyerarşisi' },
                { icon: <MenuBookOutlinedIcon fontSize="small" />, label: 'Not ve PDF arşivi' },
                { icon: <QuizOutlinedIcon fontSize="small" />, label: 'Test ve deneme akışı' },
              ].map((item) => (
                <Paper key={item.label} sx={{ borderRadius: 3, p: 2 }} variant="outlined">
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                    <Typography sx={{ fontWeight: 700 }}>{item.label}</Typography>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}
