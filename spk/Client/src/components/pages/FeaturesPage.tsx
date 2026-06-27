import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import { Box, Container, Paper, Stack, Typography } from '@mui/material'
import { MarketingHero } from '../common/MarketingHero'
import { MarketingSectionHeading } from '../common/MarketingSectionHeading'
import { iconTileSx, marketingCardSx, marketingGridSx, marketingPageSx, marketingSectionSx } from '../common/marketingStyles'

const featureGroups = [
  {
    icon: <LibraryBooksOutlinedIcon />,
    title: 'Ders notları ve kaynak yönetimi',
    description: 'SPK kaynak PDF’lerini ders ve konu başlıklarına bağlayarak aranabilir bir çalışma arşivi oluşturur.',
    items: ['PDF yükleme', 'Metin çıkarma', 'Konu bazlı notlar', 'Kaynak referansı'],
  },
  {
    icon: <QuizOutlinedIcon />,
    title: 'Soru bankası ve testler',
    description: 'Konu, ders ve lisans bazlı soru havuzuyla mini testler ve süreli denemeler yönetilebilir.',
    items: ['Çoktan seçmeli sorular', 'Açıklamalı çözümler', 'Zorluk seviyesi', 'Onay süreci'],
  },
  {
    icon: <AnalyticsOutlinedIcon />,
    title: 'İlerleme ve başarı analizi',
    description: 'Öğrencinin doğru, yanlış ve tekrar ihtiyacını görünür hale getiren rapor ekranları sunar.',
    items: ['Konu ilerlemesi', 'Başarı oranı', 'Tekrar zamanı', 'Zayıf konu takibi'],
  },
  {
    icon: <AutoAwesomeOutlinedIcon />,
    title: 'AI hazırlık altyapısı',
    description: 'Sistem, ileride AI servisleri entegre edilebilecek şekilde modellenmiştir; ancak yerleşik üretim akışı henüz aktif değildir.',
    items: ['İçerik işaretleme alanı', 'Review sürecine uyum', 'Genişletilebilir veri modeli', 'Planlanan entegrasyon noktaları'],
  },
  {
    icon: <ManageSearchOutlinedIcon />,
    title: 'Arama ve filtreleme',
    description: 'Lisans, ders, konu ve durum bazlı arama deneyimi hem public hem dashboard tarafında kullanılabilir.',
    items: ['Konu filtresi', 'Ders filtresi', 'Metin arama', 'Durum ayrımı'],
  },
  {
    icon: <SchoolOutlinedIcon />,
    title: 'Lisans bazlı yapı',
    description: 'Düzey 1, Düzey 2, Düzey 3 ve Türev Araçlar gibi farklı lisanslar için ayrı çalışma akışları kurar.',
    items: ['Lisans katalogları', 'Ders eşleştirme', 'Konu sıralaması', 'İçerik kapsamı'],
  },
]

const upcomingFeatures = [
  {
    icon: <AutoAwesomeOutlinedIcon color="primary" />,
    title: 'AI soru üretimi',
    description: 'PDF ve konu bağlamından taslak çoktan seçmeli soru üretimi planlanıyor.',
  },
  {
    icon: <LibraryBooksOutlinedIcon color="primary" />,
    title: 'AI konu özeti',
    description: 'Kaynak belgelerden editör incelemesine girecek özet taslakları oluşturulacak.',
  },
  {
    icon: <TimerOutlinedIcon color="primary" />,
    title: 'Akıllı quiz önerileri',
    description: 'İlerleme ve yanlış soru geçmişine göre kişiselleştirilmiş quiz önerileri eklenecek.',
  },
]

export function FeaturesPage() {
  return (
    <Box sx={marketingPageSx}>
      <MarketingHero
        eyebrow="Platform Özellikleri"
        title="İçerik, test, yetkilendirme ve öğrenci deneyimini tek ürün mimarisinde topla."
        description="Public pazarlama sitesi, öğrenci dashboard’u ve admin paneli birbirinden ayrılır; veri katmanı ise ortak ve sürdürülebilir kalır."
      />

      <Container maxWidth="xl" sx={marketingSectionSx}>
        <MarketingSectionHeading
          eyebrow="Yetkinlikler"
          title="Platformun omurgasını oluşturan modüller"
          description="Her modül tek başına değil, diğerleriyle birlikte anlamlı bir çalışma akışı kuracak şekilde tasarlandı."
        />
        <Box sx={marketingGridSx}>
          {featureGroups.map((feature) => (
            <Paper key={feature.title} sx={{ ...marketingCardSx, display: 'flex', flexDirection: 'column' }} variant="outlined">
              <Box sx={iconTileSx}>{feature.icon}</Box>
              <Typography sx={{ fontSize: 21, fontWeight: 900, lineHeight: 1.2, mt: 2 }}>{feature.title}</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7, mt: 1.25 }}>
                {feature.description}
              </Typography>
              <Stack spacing={1} sx={{ mt: 'auto', pt: 2.5 }}>
                {feature.items.map((item) => (
                  <Stack direction="row" key={item} spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                    <CheckCircleOutlineOutlinedIcon color="primary" fontSize="small" sx={{ flexShrink: 0 }} />
                    <Typography noWrap variant="body2">{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          ))}
        </Box>

        <Box sx={marketingSectionSx}>
          <MarketingSectionHeading
            eyebrow="Yakında"
            title="Planlanan AI özellikleri"
            description="Bu başlıklar ürün yol haritasında yer alır; şu an sistem içinde aktif üretim servisi olarak çalışmaz."
          />
          <Box sx={marketingGridSx}>
            {upcomingFeatures.map((feature) => (
              <Paper key={feature.title} sx={marketingCardSx} variant="outlined">
                <Box sx={iconTileSx}>{feature.icon}</Box>
                <Typography sx={{ fontSize: 21, fontWeight: 900, lineHeight: 1.2, mt: 2 }}>{feature.title}</Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.8, mt: 1.25 }}>
                  {feature.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
