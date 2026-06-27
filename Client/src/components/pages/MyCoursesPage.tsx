import { useMemo, useState } from 'react'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { TopicType, type Course, type License, type Topic } from '../../models'
import { EmptyState } from '../common/EmptyState'
import { StudentPageHero } from '../common/StudentPageHero'

interface MyCoursesPageProps {
  courses: Course[]
  licenses: License[]
  topics: Topic[]
}

export function MyCoursesPage({ courses, licenses, topics }: MyCoursesPageProps) {
  const [search, setSearch] = useState('')
  const [licenseFilter, setLicenseFilter] = useState('')
  const [expandedTopicCourses, setExpandedTopicCourses] = useState<string[]>([])

  const topicsByCourse = useMemo(() => {
    const map = new Map<string, Topic[]>()

    for (const course of courses) {
      const courseTopics = topics.filter((topic) => topic.courseId === course.id)

      map.set(course.id, courseTopics)
    }

    return map
  }, [courses, topics])

  const filteredCoursesByLicense = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('tr')

    return licenses
      .map((license) => ({
        license,
        courses: courses
          .filter((course) => {
            const matchesLicense = !licenseFilter || course.licenseId === licenseFilter
            const courseTopics = topicsByCourse.get(course.id) || []
            const matchesSearch =
              !keyword ||
              course.name.toLocaleLowerCase('tr').includes(keyword) ||
              (course.description || '').toLocaleLowerCase('tr').includes(keyword) ||
              courseTopics.some((topic) => `${topic.title} ${topic.parentTopicTitle ?? ''}`.toLocaleLowerCase('tr').includes(keyword))

            return course.licenseId === license.id && matchesLicense && matchesSearch
          })
          .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name, 'tr')),
      }))
      .filter((group) => group.courses.length > 0)
  }, [courses, licenseFilter, licenses, search, topicsByCourse])

  function toggleTopicCourse(courseId: string) {
    setExpandedTopicCourses((current) =>
      current.includes(courseId) ? current.filter((id) => id !== courseId) : [...current, courseId],
    )
  }

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Derslerim"
        title="Erişimin olan dersler"
        description="Lisans bazlı ders akışını gör, ana konu ve alt konuları incele, doğrudan çalışmaya başla."
        sideContent={
          <Paper sx={{ borderRadius: 3, p: 3 }} variant="outlined">
            <Typography color="text.secondary" variant="body2">
              Toplam ders
            </Typography>
            <Typography sx={{ fontSize: 34, fontWeight: 900 }}>{courses.length}</Typography>
            <Typography color="text.secondary" variant="body2">
              Toplam konu: {topics.length}
            </Typography>
          </Paper>
        }
      />

      <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
        <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
          <TextField
            fullWidth
            placeholder="Ders veya konu ara"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon />
                  </InputAdornment>
                ),
              },
            }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <TextField fullWidth label="Lisans Filtresi" select value={licenseFilter} onChange={(event) => setLicenseFilter(event.target.value)}>
            <MenuItem value="">Tümü</MenuItem>
            {licenses.map((license) => (
              <MenuItem key={license.id} value={license.id}>
                {license.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {filteredCoursesByLicense.length === 0 ? (
        <EmptyState
          title="Eşleşen ders bulunamadı"
          description="Arama veya filtre ölçütlerini değiştirerek farklı dersleri görüntüleyebilirsin."
        />
      ) : (
        <Stack spacing={3}>
          {filteredCoursesByLicense.map(({ license, courses: licenseCourses }) => (
            <Accordion
              disableGutters
              key={license.id}
              sx={{
                border: '1px solid rgba(148,163,184,0.18)',
                borderRadius: '18px !important',
                overflow: 'hidden',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />} sx={{ px: 3, py: 1.5 }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <SchoolOutlinedIcon color="primary" />
                <Box>
                  <Typography sx={{ fontSize: 24, fontWeight: 900 }}>{license.name}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {licenseCourses.length} ders · {licenseCourses.reduce((total, course) => total + (topicsByCourse.get(course.id)?.length ?? 0), 0)} konu
                  </Typography>
                </Box>
              </Stack>
              </AccordionSummary>

              <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: 'repeat(2, 1fr)', xs: '1fr' } }}>
                {licenseCourses.map((course) => {
                  const courseTopics = topicsByCourse.get(course.id) || []
                  const mainTopics = courseTopics.filter((topic) => topic.type === TopicType.MainTopic || !topic.parentTopicId)
                  const subTopicsByMain = new Map<string, Topic[]>()
                  const orphanSubTopics: Topic[] = []

                  for (const topic of courseTopics) {
                    if (topic.type !== TopicType.SubTopic && !topic.parentTopicId) {
                      continue
                    }

                    if (topic.parentTopicId) {
                      const items = subTopicsByMain.get(topic.parentTopicId) ?? []
                      items.push(topic)
                      subTopicsByMain.set(topic.parentTopicId, items)
                    } else {
                      orphanSubTopics.push(topic)
                    }
                  }

                  const visibleMainTopics = expandedTopicCourses.includes(course.id) ? mainTopics : mainTopics.slice(0, 6)
                  const firstStudyTopic = mainTopics
                    .map((topic) => subTopicsByMain.get(topic.id)?.[0] ?? topic)
                    .concat(orphanSubTopics)[0]
                  const firstQuizTopic = mainTopics[0] ?? orphanSubTopics[0]

                  return (
                    <Paper key={course.id} sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                            <Box
                              sx={{
                                alignItems: 'center',
                                bgcolor: 'rgba(15,118,110,0.08)',
                                borderRadius: 2.5,
                                color: 'primary.main',
                                display: 'flex',
                                height: 42,
                                justifyContent: 'center',
                                width: 42,
                              }}
                            >
                              <MenuBookOutlinedIcon fontSize="small" />
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 800 }}>{course.name}</Typography>
                              <Typography color="text.secondary" variant="body2">
                                {course.topicCount} konu
                              </Typography>
                            </Box>
                          </Stack>
                          <Chip label={`Sıra ${course.order}`} size="small" variant="outlined" />
                        </Stack>

                        <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
                          {course.description || 'Bu ders için açıklama henüz eklenmedi.'}
                        </Typography>

                        <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25}>
                          <Button component={RouterLink} disabled={!firstStudyTopic} to={firstStudyTopic ? `/study/${firstStudyTopic.id}` : '/dashboard'} variant="contained">
                            {firstStudyTopic ? 'Derse Başla' : 'Konu Bekleniyor'}
                          </Button>
                          <Button component={RouterLink} disabled={!firstQuizTopic} to={firstQuizTopic ? `/quiz?topicId=${firstQuizTopic.id}` : '/quiz'} variant="outlined">
                            Mini Test
                          </Button>
                        </Stack>

                        <Accordion disableGutters elevation={0} sx={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: '14px !important', mt: 1, '&:before': { display: 'none' } }}>
                          <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                            <Typography sx={{ fontWeight: 700 }}>Müfredat</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {courseTopics.length === 0 ? (
                              <Typography color="text.secondary" variant="body2">
                                Bu ders için henüz konu eklenmemiş.
                              </Typography>
                            ) : (
                              <Stack spacing={1.25}>
                                {visibleMainTopics.map((mainTopic) => {
                                  const subTopics = subTopicsByMain.get(mainTopic.id) ?? []
                                  const totalQuestionCount = mainTopic.questionCount + subTopics.reduce((total, topic) => total + topic.questionCount, 0)

                                  return (
                                    <Accordion disableGutters elevation={0} key={mainTopic.id} sx={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: '12px !important', '&:before': { display: 'none' } }}>
                                      <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                                        <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25} sx={{ alignItems: { sm: 'center', xs: 'flex-start' }, justifyContent: 'space-between', width: '100%' }}>
                                          <Box>
                                            <Typography sx={{ fontWeight: 800 }}>{mainTopic.title}</Typography>
                                            <Typography color="text.secondary" variant="body2">
                                              {subTopics.length} alt konu · {totalQuestionCount} soru
                                            </Typography>
                                          </Box>
                                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                            <Chip label="Ana konu" size="small" variant="outlined" />
                                            <Button component={RouterLink} size="small" to={`/quiz?topicId=${mainTopic.id}`} variant="text">
                                              Ana konu testi
                                            </Button>
                                          </Stack>
                                        </Stack>
                                      </AccordionSummary>
                                      <AccordionDetails>
                                        {subTopics.length === 0 ? (
                                          <Typography color="text.secondary" variant="body2">
                                            Bu ana konuya bağlı alt konu henüz eklenmemiş.
                                          </Typography>
                                        ) : (
                                          <Stack spacing={1}>
                                            {subTopics.map((subTopic) => (
                                              <Box key={subTopic.id} sx={{ border: '1px solid rgba(148,163,184,0.12)', borderRadius: 2, p: 1.5 }}>
                                                <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25} sx={{ alignItems: { sm: 'center', xs: 'flex-start' }, justifyContent: 'space-between' }}>
                                                  <Box>
                                                    <Typography sx={{ fontWeight: 700 }}>{subTopic.title}</Typography>
                                                    <Typography color="text.secondary" variant="body2">
                                                      {subTopic.questionCount} soru
                                                    </Typography>
                                                  </Box>
                                                  <Stack direction="row" spacing={1}>
                                                    <Chip label="Alt konu" size="small" variant="outlined" />
                                                    <Button component={RouterLink} size="small" to={`/study/${subTopic.id}`} variant="outlined">
                                                      Çalış
                                                    </Button>
                                                    <Button component={RouterLink} size="small" to={`/quiz?topicId=${subTopic.id}`} variant="text">
                                                      Test
                                                    </Button>
                                                  </Stack>
                                                </Stack>
                                              </Box>
                                            ))}
                                          </Stack>
                                        )}
                                      </AccordionDetails>
                                    </Accordion>
                                  )
                                })}
                                {orphanSubTopics.map((topic) => (
                                  <Box key={topic.id} sx={{ border: '1px solid rgba(148,163,184,0.12)', borderRadius: 2, p: 1.5 }}>
                                    <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25} sx={{ alignItems: { sm: 'center', xs: 'flex-start' }, justifyContent: 'space-between' }}>
                                      <Box>
                                        <Typography sx={{ fontWeight: 700 }}>{topic.title}</Typography>
                                        <Typography color="text.secondary" variant="body2">
                                          Ana konu bağlantısı yok · {topic.questionCount} soru
                                        </Typography>
                                      </Box>
                                      <Stack direction="row" spacing={1}>
                                        <Chip label="Alt konu" size="small" variant="outlined" />
                                        <Button component={RouterLink} size="small" to={`/study/${topic.id}`} variant="outlined">
                                          Çalış
                                        </Button>
                                        <Button component={RouterLink} size="small" to={`/quiz?topicId=${topic.id}`} variant="text">
                                          Test
                                        </Button>
                                      </Stack>
                                    </Stack>
                                  </Box>
                                ))}
                                {mainTopics.length > 6 && (
                                  <Button size="small" variant="text" onClick={() => toggleTopicCourse(course.id)}>
                                    {expandedTopicCourses.includes(course.id)
                                      ? 'Daha az göster'
                                      : `${mainTopics.length - 6} ana konu daha göster`}
                                  </Button>
                                )}
                              </Stack>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      </Stack>
                    </Paper>
                  )
                })}
              </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
