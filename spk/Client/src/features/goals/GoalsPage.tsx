import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { type FormEvent, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { EmptyState } from '../../components/common/EmptyState'
import { StudentPageHero } from '../../components/common/StudentPageHero'
import { UserGoalStatus, UserGoalType, type CreateUserGoalRequest, type UserGoal } from '../../models'
import { useTodayReviews } from '../reviews/hooks/useReviewQueries'
import { useCreateGoal, useDeleteGoal, useGoals, useUpdateGoal } from './hooks/useGoals'

const goalTypeLabels: Record<UserGoalType, string> = {
  [UserGoalType.QuestionCount]: 'Soru sayısı',
  [UserGoalType.StudyMinutes]: 'Çalışma dakikası',
  [UserGoalType.CompletedTopics]: 'Tamamlanan konu',
  [UserGoalType.CompletedCourses]: 'Tamamlanan ders',
  [UserGoalType.TrialExamCount]: 'Deneme sayısı',
  [UserGoalType.ReviewCount]: 'Tekrar sorusu',
}

const statusLabels = {
  [UserGoalStatus.Active]: 'Aktif',
  [UserGoalStatus.Completed]: 'Tamamlandı',
  [UserGoalStatus.Archived]: 'Arşiv',
}

type GoalFormState = {
  description: string
  goalType: UserGoalType
  startDate: string
  status: UserGoalStatus
  targetDate: string
  targetValue: number
  title: string
}

const today = toDateInputValue(new Date())

function initialForm(goal?: UserGoal | null): GoalFormState {
  return {
    description: goal?.description ?? '',
    goalType: goal?.goalType ?? UserGoalType.QuestionCount,
    startDate: goal ? toDateInputValue(goal.startDate) : today,
    status: goal?.status ?? UserGoalStatus.Active,
    targetDate: goal ? toDateInputValue(goal.targetDate) : toDateInputValue(addDays(new Date(), 30)),
    targetValue: goal?.targetValue ?? 100,
    title: goal?.title ?? '',
  }
}

export function GoalsPage() {
  const goalsQuery = useGoals()
  const todayReviewsQuery = useTodayReviews()
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState<GoalFormState>(() => initialForm())

  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data])
  const activeGoals = useMemo(() => goals.filter((goal) => goal.status === UserGoalStatus.Active), [goals])
  const completedGoals = useMemo(() => goals.filter((goal) => goal.status === UserGoalStatus.Completed), [goals])
  const archivedGoals = useMemo(() => goals.filter((goal) => goal.status === UserGoalStatus.Archived), [goals])
  const activeReviewGoal = useMemo(
    () => activeGoals.find((goal) => goal.goalType === UserGoalType.ReviewCount),
    [activeGoals],
  )
  const dueReviewCount = todayReviewsQuery.data?.summary.dueTodayCount ?? 0

  function openCreateDialog(preset?: Partial<GoalFormState>) {
    setEditingGoal(null)
    setForm({ ...initialForm(), ...preset })
    setIsDialogOpen(true)
  }

  function openReviewGoalDialog() {
    const targetValue = Math.max(10, dueReviewCount || 20)

    openCreateDialog({
      description: 'Bugünkü ve yaklaşan tekrar sorularını düzenli bitirmek için otomatik takip edilir.',
      goalType: UserGoalType.ReviewCount,
      targetDate: toDateInputValue(addDays(new Date(), 7)),
      targetValue,
      title: `${targetValue} tekrar sorusu tamamla`,
    })
  }

  function openEditDialog(goal: UserGoal) {
    setEditingGoal(goal)
    setForm(initialForm(goal))
    setIsDialogOpen(true)
  }

  function closeDialog() {
    setIsDialogOpen(false)
    setEditingGoal(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload: CreateUserGoalRequest = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      goalType: form.goalType,
      targetValue: Number(form.targetValue),
      startDate: new Date(form.startDate).toISOString(),
      targetDate: new Date(form.targetDate).toISOString(),
    }

    if (editingGoal) {
      await updateGoal.mutateAsync({
        goalId: editingGoal.id,
        payload: {
          ...payload,
          status: form.status,
        },
      })
    } else {
      await createGoal.mutateAsync(payload)
    }

    closeDialog()
  }

  if (goalsQuery.isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton height={180} variant="rounded" />
        <Skeleton height={240} variant="rounded" />
        <Skeleton height={260} variant="rounded" />
      </Stack>
    )
  }

  if (goalsQuery.isError) {
    return <Alert severity="error">{goalsQuery.error instanceof Error ? goalsQuery.error.message : 'Hedefler yüklenemedi.'}</Alert>
  }

  return (
    <Stack spacing={3}>
      <StudentPageHero
        eyebrow="Kişisel plan"
        title="Hedeflerim"
        description="Sınava hazırlık planını hedeflere böl, ilerlemeyi otomatik takip et ve çalışma ritmini görünür hale getir."
        actions={
          <Button onClick={() => openCreateDialog()} startIcon={<AddOutlinedIcon />} variant="contained">
            Hedef oluştur
          </Button>
        }
        sideContent={
          <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
            <Stack spacing={1}>
              <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 800 }}>
                AKTİF HEDEF
              </Typography>
              <Typography sx={{ fontSize: 42, fontWeight: 900 }}>{activeGoals.length}</Typography>
              <Typography color="text.secondary" variant="body2">
                {completedGoals.length} hedef tamamlandı.
              </Typography>
            </Stack>
          </Paper>
        }
      />

      <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
        <Stack direction={{ md: 'row', xs: 'column' }} spacing={2.5} sx={{ alignItems: { md: 'center', xs: 'stretch' }, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Box
              sx={{
                alignItems: 'center',
                bgcolor: 'rgba(15,118,110,0.08)',
                borderRadius: 2,
                color: 'primary.main',
                display: 'flex',
                flexShrink: 0,
                height: 44,
                justifyContent: 'center',
                width: 44,
              }}
            >
              <ReplayOutlinedIcon />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 20, fontWeight: 900 }}>Tekrar hedefi</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                Bugun vadesi gelen {dueReviewCount} tekrar sorusu var.
              </Typography>
              {activeReviewGoal && (
                <Box sx={{ mt: 1.5, maxWidth: 420 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography sx={{ fontWeight: 800 }} variant="body2">
                      {activeReviewGoal.currentValue} / {activeReviewGoal.targetValue}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      %{Math.round(Number(activeReviewGoal.progressPercentage))}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    sx={{ borderRadius: 999, height: 8 }}
                    value={Math.min(100, Number(activeReviewGoal.progressPercentage))}
                    variant="determinate"
                  />
                </Box>
              )}
            </Box>
          </Stack>
          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.25}>
            <Button component={RouterLink} to="/reviews/today" variant="outlined">
              Tekrarlara git
            </Button>
            {!activeReviewGoal && (
              <Button onClick={openReviewGoalDialog} startIcon={<AddOutlinedIcon />} variant="contained">
                Tekrar hedefi kur
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {goals.length === 0 ? (
        <EmptyState
          title="Henüz hedef yok"
          description="İlk hedefini oluştur: soru sayısı, deneme, konu tamamlama veya tekrar hedefi belirleyebilirsin."
        />
      ) : (
        <Stack spacing={3}>
          <GoalSection
            emptyText="Aktif hedef yok."
            goals={activeGoals}
            onDelete={(goal) => void deleteGoal.mutateAsync(goal.id)}
            onEdit={openEditDialog}
            title="Aktif Hedefler"
          />
          <GoalSection
            emptyText="Tamamlanan hedef yok."
            goals={completedGoals}
            onDelete={(goal) => void deleteGoal.mutateAsync(goal.id)}
            onEdit={openEditDialog}
            title="Tamamlanan Hedefler"
          />
          {archivedGoals.length > 0 && (
            <GoalSection
              emptyText="Arşiv hedef yok."
              goals={archivedGoals}
              onDelete={(goal) => void deleteGoal.mutateAsync(goal.id)}
              onEdit={openEditDialog}
              title="Arşiv"
            />
          )}
        </Stack>
      )}

      <Dialog fullWidth maxWidth="sm" onClose={closeDialog} open={isDialogOpen}>
        <Box component="form" onSubmit={(event) => void handleSubmit(event)}>
          <DialogTitle>{editingGoal ? 'Hedefi düzenle' : 'Yeni hedef oluştur'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Başlık"
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
                value={form.title}
              />
              <TextField
                label="Açıklama"
                rows={3}
                multiline
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                value={form.description}
              />
              <TextField
                disabled={Boolean(editingGoal)}
                label="Hedef türü"
                onChange={(event) => setForm((current) => ({ ...current, goalType: Number(event.target.value) as UserGoalType }))}
                select
                value={form.goalType}
              >
                {Object.entries(goalTypeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={Number(value)}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Hedef değer"
                onChange={(event) => setForm((current) => ({ ...current, targetValue: Number(event.target.value) }))}
                required
                slotProps={{ htmlInput: { min: 1 } }}
                type="number"
                value={form.targetValue}
              />
              <Stack direction={{ sm: 'row', xs: 'column' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Başlangıç"
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  required
                  type="date"
                  value={form.startDate}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  fullWidth
                  label="Hedef tarihi"
                  onChange={(event) => setForm((current) => ({ ...current, targetDate: event.target.value }))}
                  required
                  type="date"
                  value={form.targetDate}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              {editingGoal && (
                <TextField
                  label="Durum"
                  onChange={(event) => setForm((current) => ({ ...current, status: Number(event.target.value) as UserGoalStatus }))}
                  select
                  value={form.status}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <MenuItem key={value} value={Number(value)}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Vazgec</Button>
            <Button disabled={createGoal.isPending || updateGoal.isPending} type="submit" variant="contained">
              Kaydet
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  )
}

function GoalSection({
  emptyText,
  goals,
  onDelete,
  onEdit,
  title,
}: {
  emptyText: string
  goals: UserGoal[]
  onDelete: (goal: UserGoal) => void
  onEdit: (goal: UserGoal) => void
  title: string
}) {
  return (
    <Box>
      <Typography sx={{ fontSize: 24, fontWeight: 900, mb: 2 }}>{title}</Typography>
      {goals.length === 0 ? (
        <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
          <Typography color="text.secondary">{emptyText}</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { lg: 'repeat(2, 1fr)', xs: '1fr' } }}>
          {goals.map((goal) => (
            <GoalCard goal={goal} key={goal.id} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </Box>
      )}
    </Box>
  )
}

function GoalCard({
  goal,
  onDelete,
  onEdit,
}: {
  goal: UserGoal
  onDelete: (goal: UserGoal) => void
  onEdit: (goal: UserGoal) => void
}) {
  const progress = Math.min(100, Number(goal.progressPercentage))

  return (
    <Paper sx={{ borderRadius: 3, p: 2.5 }} variant="outlined">
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                alignItems: 'center',
                bgcolor: 'rgba(15,118,110,0.08)',
                borderRadius: 2,
                color: 'primary.main',
                display: 'flex',
                flexShrink: 0,
                height: 42,
                justifyContent: 'center',
                width: 42,
              }}
            >
              <FlagOutlinedIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900 }}>{goal.title}</Typography>
              <Typography color="text.secondary" variant="body2">
                {goalTypeLabels[goal.goalType]}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <IconButton aria-label="Hedefi duzenle" onClick={() => onEdit(goal)} size="small">
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="Hedefi sil" color="error" onClick={() => onDelete(goal)} size="small">
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {goal.description && (
          <Typography color="text.secondary" sx={{ lineHeight: 1.7 }} variant="body2">
            {goal.description}
          </Typography>
        )}

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip label={statusLabels[goal.status]} size="small" />
          {goal.isOverdue && <Chip color="warning" label="Gecikti" size="small" />}
          <Chip label={`${goal.daysRemaining} gun kaldi`} size="small" variant="outlined" />
        </Stack>

        <Box>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
            <Typography sx={{ fontWeight: 800 }} variant="body2">
              {goal.currentValue} / {goal.targetValue}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              %{Math.round(progress)}
            </Typography>
          </Stack>
          <LinearProgress sx={{ borderRadius: 999, height: 9 }} value={progress} variant="determinate" />
        </Box>

        <Typography color="text.secondary" variant="body2">
          {formatDate(goal.startDate)} - {formatDate(goal.targetDate)}
        </Typography>
      </Stack>
    </Paper>
  )
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toDateInputValue(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
