import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Typography } from '@mui/material'
import { MarketingHero } from '../common/MarketingHero'

const faqs = [
  {
    question: 'Platform kimler için uygun?',
    answer:
      'SPK lisans sınavlarına düzenli hazırlanmak isteyen bireysel öğrenciler ve içerik yönetimini kurumsal biçimde yürütmek isteyen ekipler için uygundur.',
  },
  {
    question: 'Ücretsiz deneme nasıl çalışıyor?',
    answer:
      'Yayındaki ücretsiz deneme sınavları public tarafta görüntülenir. Kayıtlı kullanıcılar denemeyi başlatıp daha sonra panel içinden devam edebilir.',
  },
  {
    question: 'Ders notları ve sorular nasıl onaylanıyor?',
    answer:
      'İçerikler admin panelinde oluşturulur, review status ile moderasyon sürecinden geçer ve sadece onaylı içerikler öğrenci tarafında görünür.',
  },
  {
    question: 'Ödeme sistemi zorunlu mu?',
    answer:
      'Hayır. Şu an sistem manuel erişim ve entitlement mantığıyla çalışabilir. Ödeme entegrasyonu ileride genişletilebilir.',
  },
]

export function FaqPage() {
  return (
    <Box sx={{ pb: { md: 8, xs: 5 } }}>
      <MarketingHero
        eyebrow="Sık Sorulan Sorular"
        title="Ürün yapısı ve çalışma deneyimi hakkında kısa cevaplar."
        description="Platform, öğrenci akışı, içerik moderasyonu ve erişim modeli hakkında en sık gelen soruları burada topladık."
      />

      <Container maxWidth="lg" sx={{ mt: { md: 8, xs: 5 } }}>
        {faqs.map((item) => (
          <Accordion key={item.question} disableGutters sx={{ borderRadius: '14px !important', mb: 1.5, overflow: 'hidden' }}>
            <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
              <Typography sx={{ fontWeight: 800 }}>{item.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {item.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  )
}
