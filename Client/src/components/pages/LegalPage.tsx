import { Box, Container, Paper, Stack, Typography } from '@mui/material'
import { MarketingHero } from '../common/MarketingHero'

const legalContent: Record<string, { title: string; description: string; sections: Array<{ heading: string; text: string }> }> = {
  kvkk: {
    title: 'KVKK',
    description: 'Kişisel verilerin korunmasına ilişkin bilgilendirme metni.',
    sections: [
      { heading: 'Veri işleme amacı', text: 'Kullanıcı hesapları, lisans erişimleri ve çalışma geçmişi platformun temel hizmetlerini sunmak amacıyla işlenir.' },
      { heading: 'Saklama ve güvenlik', text: 'Veriler rol bazlı erişim, kimlik doğrulama ve güvenlik katmanlarıyla korunur.' },
    ],
  },
  privacy: {
    title: 'Gizlilik Politikası',
    description: 'Kullanıcı verilerinin hangi kapsamda işlendiğini ve korunduğunu açıklar.',
    sections: [
      { heading: 'Toplanan bilgiler', text: 'Hesap bilgileri, çalışma ilerlemesi, deneme sonuçları ve erişim kayıtları işlenebilir.' },
      { heading: 'Kullanım amacı', text: 'Hizmet kalitesini artırmak, raporlama sunmak ve hesabı güvenli biçimde yönetmek için kullanılır.' },
    ],
  },
  terms: {
    title: 'Kullanım Koşulları',
    description: 'Platformun kullanım kurallarını ve kullanıcı sorumluluklarını açıklar.',
    sections: [
      { heading: 'Hizmet kapsamı', text: 'SPK Akademi içerik yönetimi, öğrenci paneli, deneme sınavı ve analiz araçları sunar.' },
      { heading: 'Kullanıcı sorumluluğu', text: 'Kullanıcı hesabının güvenliği ve doğru kullanımından kullanıcı sorumludur.' },
    ],
  },
}

export function LegalPage({ pageKey }: { pageKey: keyof typeof legalContent }) {
  const page = legalContent[pageKey]

  return (
    <Box sx={{ pb: { md: 8, xs: 5 } }}>
      <MarketingHero eyebrow={page.title} title={page.title} description={page.description} />

      <Container maxWidth="lg" sx={{ mt: { md: 8, xs: 5 } }}>
        <Stack spacing={2.5}>
          {page.sections.map((section) => (
            <Paper key={section.heading} sx={{ borderRadius: 4, p: 3 }} variant="outlined">
              <Typography sx={{ fontSize: 24, fontWeight: 900 }}>{section.heading}</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8, mt: 1.25 }}>
                {section.text}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Container>
    </Box>
  )
}
