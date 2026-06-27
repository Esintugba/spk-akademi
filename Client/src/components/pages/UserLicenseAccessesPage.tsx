import { FormEvent, useEffect, useMemo, useState } from 'react'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import type { AccessSource, CreateUserLicenseAccess, License, UserLicenseAccess, UserSummary } from '../../models'
import { api } from '../../shared/api'
import { AdminPageHero } from '../common/AdminPageHero'
import { AdminSurface } from '../common/AdminSurface'
import { EmptyState } from '../common/EmptyState'
import { ErrorBanner } from '../common/ErrorBanner'

interface UserLicenseAccessesPageProps {
  licenses: License[]
}

const sourceLabels: Record<AccessSource, string> = {
  1: 'Admin',
  2: 'Manual',
  3: 'Beta',
  4: 'Payment',
  5: 'Demo',
}

const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === 'true'

const assignableSources: AccessSource[] = paymentsEnabled ? [1, 2, 3, 4] : [1, 2, 3]

const today = new Date().toISOString().slice(0, 10)

const initialForm: CreateUserLicenseAccess = {
  userId: '',
  licenseId: '',
  startDate: today,
  endDate: '',
  isActive: true,
  accessSource: 1,
}

export function UserLicenseAccessesPage({ licenses }: UserLicenseAccessesPageProps) {
  const [accesses, setAccesses] = useState<UserLicenseAccess[]>([])
  const [users, setUsers] = useState<UserSummary[]>([])
  const [form, setForm] = useState<CreateUserLicenseAccess>(initialForm)
  const [editingId, setEditingId] = useState('')
  const [error, setError] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sourceFilter, setSourceFilter] = useState<AccessSource | 'all'>('all')

  const visibleAccesses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('tr-TR')

    return accesses.filter((access) => {
      const matchesSearch = !normalizedSearch ||
        access.userEmail.toLocaleLowerCase('tr-TR').includes(normalizedSearch) ||
        access.licenseName.toLocaleLowerCase('tr-TR').includes(normalizedSearch)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && access.isCurrentlyActive) ||
        (statusFilter === 'inactive' && !access.isCurrentlyActive)
      const matchesSource = sourceFilter === 'all' || access.accessSource === sourceFilter

      return matchesSearch && matchesStatus && matchesSource
    })
  }, [accesses, searchTerm, sourceFilter, statusFilter])

  const summary = useMemo(() => ({
    active: accesses.filter((access) => access.isCurrentlyActive).length,
    demo: accesses.filter((access) => access.accessSource === 5).length,
    manual: accesses.filter((access) => access.accessSource === 1 || access.accessSource === 2 || access.accessSource === 3).length,
  }), [accesses])

  const sourceOptions = useMemo(() => {
    if (assignableSources.includes(form.accessSource)) {
      return assignableSources
    }

    return [...assignableSources, form.accessSource]
  }, [form.accessSource])

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setError('')
    setIsBusy(true)

    try {
      const [accessList, userList] = await Promise.all([api.getUserLicenseAccesses(), api.getUsers()])
      setAccesses(accessList)
      setUsers(userList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erişim kayıtları alınamadı.')
    } finally {
      setIsBusy(false)
    }
  }

  function openCreateDialog() {
    setEditingId('')
    setForm(initialForm)
    setError('')
    setIsDialogOpen(true)
  }

  function openEditDialog(access: UserLicenseAccess) {
    setEditingId(access.id)
    setForm({
      userId: access.userId,
      licenseId: access.licenseId,
      startDate: access.startDate.slice(0, 10),
      endDate: access.endDate?.slice(0, 10) ?? '',
      isActive: access.isActive,
      accessSource: access.accessSource,
    })
    setError('')
    setIsDialogOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.userId || !form.licenseId) {
      setError('Kullanıcı ve lisans seçilmelidir.')
      return
    }

    setIsBusy(true)

    try {
      const payload = { ...form, endDate: form.endDate || null }

      if (editingId) {
        await api.updateUserLicenseAccess(editingId, payload)
      } else {
        await api.createUserLicenseAccess(payload)
      }

      await loadData()
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erişim kaydı kaydedilemedi.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleDelete(id: string) {
    setError('')
    setIsBusy(true)

    try {
      await api.deleteUserLicenseAccess(id)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erişim kaydı silinemedi.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Stack spacing={3}>
      <AdminPageHero
        title="Kullanıcı erişimlerini lisans bazında yönetin."
        description="Ödeme sistemi devreye girene kadar kullanıcıların erişim haklarını manuel, beta veya admin kaynağıyla güvenle atayın. Süreli erişimler burada izlenir."
        actions={<Button startIcon={<AddOutlinedIcon />} variant="contained" onClick={openCreateDialog}>Erişim ver</Button>}
      />

      {error && <ErrorBanner message={error} />}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(3, 1fr)', xs: '1fr' } }}>
        <AdminSurface title="Aktif erişim">{summary.active}</AdminSurface>
        <AdminSurface title="Manuel/Beta/Admin">{summary.manual}</AdminSurface>
        <AdminSurface title="Demo">{summary.demo}</AdminSurface>
      </Box>

      <AdminSurface title="Filtreler">
        <Stack direction={{ md: 'row', xs: 'column' }} spacing={2}>
          <TextField
            fullWidth
            label="Kullanıcı veya lisans ara"
            onChange={(event) => setSearchTerm(event.target.value)}
            value={searchTerm}
          />
          <TextField
            fullWidth
            label="Durum"
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
            select
            value={statusFilter}
          >
            <MenuItem value="all">Tümü</MenuItem>
            <MenuItem value="active">Aktif</MenuItem>
            <MenuItem value="inactive">Pasif</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Kaynak"
            onChange={(event) => setSourceFilter(event.target.value === 'all' ? 'all' : Number(event.target.value) as AccessSource)}
            select
            value={sourceFilter}
          >
            <MenuItem value="all">Tümü</MenuItem>
            {Object.entries(sourceLabels).map(([value, label]) => <MenuItem key={value} value={Number(value)}>{label}</MenuItem>)}
          </TextField>
        </Stack>
      </AdminSurface>

      <AdminSurface title="Erişim listesi">
        {visibleAccesses.length === 0 ? (
          <EmptyState title="Erişim kaydı yok" description="Filtreleri değiştirerek veya yeni bir kullanıcıya lisans erişimi atayarak devam edebilirsin." />
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { md: 'repeat(2, 1fr)', xs: '1fr' } }}>
            {visibleAccesses.map((access) => (
              <Box key={access.id} sx={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 3, p: 2.5 }}>
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 900 }}>{access.licenseName}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>{access.userEmail}</Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton disabled={isBusy} onClick={() => openEditDialog(access)}><EditOutlinedIcon /></IconButton>
                    <IconButton color="error" disabled={isBusy} onClick={() => void handleDelete(access.id)}><DeleteOutlineOutlinedIcon /></IconButton>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  <Chip color={access.isCurrentlyActive ? 'success' : 'default'} label={access.isCurrentlyActive ? 'Aktif' : 'Pasif'} />
                  <Chip label={sourceLabels[access.accessSource]} />
                  <Chip label={`Başlangıç: ${access.startDate.slice(0, 10)}`} variant="outlined" />
                  <Chip label={`Bitiş: ${access.endDate ? access.endDate.slice(0, 10) : 'Süresiz'}`} variant="outlined" />
                </Stack>
              </Box>
            ))}
          </Box>
        )}
      </AdminSurface>

      <Dialog fullWidth maxWidth="sm" open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editingId ? 'Erişim düzenle' : 'Erişim ver'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField disabled={Boolean(editingId)} fullWidth label="Kullanıcı" select value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}>
                {users.map((user) => <MenuItem key={user.id} value={user.id}>{user.email}</MenuItem>)}
              </TextField>
              <TextField disabled={Boolean(editingId)} fullWidth label="Lisans" select value={form.licenseId} onChange={(event) => setForm((current) => ({ ...current, licenseId: event.target.value }))}>
                {licenses.map((license) => <MenuItem key={license.id} value={license.id}>{license.name}</MenuItem>)}
              </TextField>
              <Stack direction={{ sm: 'row', xs: 'column' }} spacing={2}>
                <TextField fullWidth label="Başlangıç" type="date" value={form.startDate} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
                <TextField fullWidth label="Bitiş" type="date" value={form.endDate ?? ''} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
              </Stack>
              <TextField fullWidth label="Kaynak" select value={form.accessSource} onChange={(event) => setForm((current) => ({ ...current, accessSource: Number(event.target.value) as AccessSource }))}>
                {sourceOptions.map((value) => <MenuItem key={value} value={value}>{sourceLabels[value]}</MenuItem>)}
              </TextField>
              <FormControlLabel control={<Checkbox checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />} label="Aktif" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={isBusy} onClick={() => setIsDialogOpen(false)}>Vazgeç</Button>
            <Button disabled={isBusy} type="submit" variant="contained">{isBusy ? 'Kaydediliyor' : 'Kaydet'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  )
}
