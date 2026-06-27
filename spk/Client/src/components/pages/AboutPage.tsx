import PsychologyAltOutlinedIcon from '@mui/icons-material/PsychologyAltOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import { Box, Container, Paper, Stack, Typography } from '@mui/material'
import { MarketingHero } from '../common/MarketingHero'
import { MarketingSectionHeading } from '../common/MarketingSectionHeading'
import { iconTileSx, marketingCardSx, marketingGridSx, marketingPageSx, marketingSectionSx } from '../common/marketingStyles'

const principles = [
  {
    icon: <PsychologyAltOutlinedIcon color="primary" />,
    title: 'Öğrenme odaklı tasarım',
    description: 'Öğrencinin günlük çalışma ritmine, tekrar ihtiyacına ve motivasyon akışına göre tasarlanmış ekranlar.',
  },
  {
    icon: <TimelineOutlinedIcon color="primary" />,
    title: 'Ölçülebilir ilerleme',
    description: 'Sadece içerik sunmak değil, hangi konunun ne kadar öğrenildiğini görünür hale getirmek.',
  },
  {
    icon: <GroupsOutlinedIcon color="primary" />,
    title: 'Editör ve öğrenci ayrımı',
    description: 'Admin paneli içerik yönetimine, öğrenci paneli ise çalışma deneyimine odaklanır.',
  },
]

const values = [
  'Ders notları ve kaynak belgeler',
  'Onaylı soru bankası',
  'Deneme sınavı ve raporlama',
  'Geleceğe açık AI entegrasyon altyapısı',
]

export function AboutPage() {
  return (
    <Box sx={marketingPageSx}>
      <MarketingHero
        eyebrow="Hakkımızda"
        title="SPK hazırlığını parçalayan değil birleştiren bir çalışma sistemi."
        description="Amacımız, SPK lisans sürecinde öğrencinin not, soru, tekrar ve deneme akışını tek yerde yönetebilmesini sağlayan profesyonel bir öğrenme platformu kurmak."
        sideContent={
          <Paper sx={{ borderRadius: 2, height: '100%', p: 3 }} variant="outlined">
            <Typography color="primary.main" sx={{ fontWeight: 800 }}>
              Kısa bakış
            </Typography>
            <Typography sx={{ fontSize: { md: 28, xs: 24 }, fontWeight: 900, lineHeight: 1.15, mt: 1.5 }}>
              Çalışma düzeni, içerik güveni ve görünür ilerleme
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.85, mt: 1.5 }}>
              Platformun merkezinde öğrenciyi tekrar tekrar sisteme döndüren bir ilerleme hissi var. Her ekranı bu hissi destekleyecek şekilde kuruyoruz.
            </Typography>
          </Paper>
        }
      />

      <Container maxWidth="xl" sx={marketingSectionSx}>
        <MarketingSectionHeading
          eyebrow="İlkelerimiz"
          title="Ürünü şekillendiren üç temel yaklaşım"
          description="Public site, öğrenci paneli ve admin deneyimini aynı ürün mantığında birleştirirken bu ilkelerden ilerliyoruz."
        />
        <Box sx={marketingGridSx}>
          {principles.map((item) => (
            <Paper key={item.title} sx={marketingCardSx} variant="outlined">
              <Box sx={iconTileSx}>{item.icon}</Box>
              <Typography sx={{ fontSize: 21, fontWeight: 900, lineHeight: 1.2, mt: 2 }}>{item.title}</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8, mt: 1.25 }}>
                {item.description}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Paper sx={{ borderRadius: 2, mt: 3, p: { md: 3, xs: 2.5 } }} variant="outlined">
          <MarketingSectionHeading
            eyebrow="Neye yatırım yapıyoruz?"
            title="Düzenli çalışma, güvenilir içerik, ölçülebilir ilerleme."
            description="Platformun çekirdeğinde öğrencinin günlük çalışmasına gerçek katkı sağlayan modüller var."
          />
          <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { md: 'repeat(2, minmax(0, 1fr))', xs: '1fr' } }}>
            {values.map((value) => (
              <Stack direction="row" key={value} spacing={1.25} sx={{ alignItems: 'center' }}>
                <CheckCircleOutlineOutlinedIcon color="primary" fontSize="small" />
                <Typography>{value}</Typography>
              </Stack>
            ))}
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
