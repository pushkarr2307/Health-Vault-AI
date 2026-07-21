import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { AppShell } from '@/components/AppShell'

import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/emergency/$userId')({
  head: () => ({ meta: [{ title: 'Emergency Profile — HealthVault AI' }] }),
  component: EmergencyProfile,
})

type EmergencyProfileRow = {
  id: string
  user_id: string
  blood_group: string | null
  allergies: string | null
  medical_conditions: string | null
  current_medications: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  doctor_name: string | null
  doctor_phone: string | null
  emergency_notes: string | null
}

type FormState = {
  blood_group: string
  allergies: string
  medical_conditions: string
  current_medications: string
  emergency_contact_name: string
  emergency_contact_phone: string
  doctor_name: string
  doctor_phone: string
  emergency_notes: string
}

const emptyForm: FormState = {
  blood_group: '',
  allergies: '',
  medical_conditions: '',
  current_medications: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  doctor_name: '',
  doctor_phone: '',
  emergency_notes: '',
}

function normalizeNullable(v: string) {
  const trimmed = v.trim()
  return trimmed.length ? trimmed : null
}

function EmergencyProfile() {
  const { user } = useAuth()
  const params = Route.useParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const [recordId, setRecordId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      setLoading(true)
      setError(null)
      setStatus(null)

      const { data, error: fetchErr } = await supabase
        .from('emergency_profiles')
        .select('*')
        .eq('user_id', params.userId)
        .maybeSingle<EmergencyProfileRow>()

      if (!mounted) return

      if (fetchErr) {
        setError(fetchErr.message)
        setForm(emptyForm)
        setRecordId(null)
        setLoading(false)
        return
      }

      if (!data) {
        setForm(emptyForm)
        setRecordId(null)
        setLoading(false)
        return
      }

      setRecordId(data.id)
      setForm({
        blood_group: data.blood_group ?? '',
        allergies: data.allergies ?? '',
        medical_conditions: data.medical_conditions ?? '',
        current_medications: data.current_medications ?? '',
        emergency_contact_name: data.emergency_contact_name ?? '',
        emergency_contact_phone: data.emergency_contact_phone ?? '',
        doctor_name: data.doctor_name ?? '',
        doctor_phone: data.doctor_phone ?? '',
        emergency_notes: data.emergency_notes ?? '',
      })
      setLoading(false)
    })()

    return () => {
      mounted = false
    }
  }, [params.userId])

  const save = async () => {
    // Keep behavior consistent with existing QR/profile flow: only allow saving for signed-in user.
    if (!user) return
    if (user.id !== params.userId) return

    setSaving(true)
    setError(null)
    setStatus(null)

    const payload = {
      user_id: user.id,
      blood_group: normalizeNullable(form.blood_group),
      allergies: normalizeNullable(form.allergies),
      medical_conditions: normalizeNullable(form.medical_conditions),
      current_medications: normalizeNullable(form.current_medications),
      emergency_contact_name: normalizeNullable(form.emergency_contact_name),
      emergency_contact_phone: normalizeNullable(form.emergency_contact_phone),
      doctor_name: normalizeNullable(form.doctor_name),
      doctor_phone: normalizeNullable(form.doctor_phone),
      emergency_notes: normalizeNullable(form.emergency_notes),
    }

    try {
      if (recordId) {
        const { error: updErr } = await supabase
          .from('emergency_profiles')
          .update(payload)
          .eq('id', recordId)

        if (updErr) throw updErr
        setStatus('Emergency profile saved.')
      } else {
        const { error: insErr } = await supabase.from('emergency_profiles').insert(payload)
        if (insErr) throw insErr
        setStatus('Emergency profile saved.')

        const { data: createdData, error: createdErr } = await supabase
          .from('emergency_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle<{ id: string }>()

        if (!createdErr && createdData?.id) setRecordId(createdData.id)
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save emergency profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className='flex items-center justify-center py-16'>
          <Loader2 className='animate-spin text-[var(--muted-ink)]' size={22} />
        </div>
      </AppShell>
    )
  }

  const canSave = !!user && user.id === params.userId

  return (
    <AppShell>
      <div className='mx-auto w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm'>
        <div>
          <h2 className='text-xl font-bold'>Emergency Profile</h2>
          <p className='mt-1 text-sm text-[var(--muted-ink)]'>
            Keep your critical medical details up to date for emergency responders.
          </p>
        </div>

        <form
          className='mt-8 space-y-5'
          onSubmit={(e) => {
            e.preventDefault()
            if (canSave) save()
          }}
        >
          <div className='grid gap-5 sm:grid-cols-2'>
            <Field
              label='Blood Group'
              value={form.blood_group}
              onChange={(v) => setForm((f) => ({ ...f, blood_group: v }))}
              disabled={!canSave}
            />

            <Field
              label='Emergency Contact Phone'
              value={form.emergency_contact_phone}
              onChange={(v) => setForm((f) => ({ ...f, emergency_contact_phone: v }))}
              disabled={!canSave}
            />

            <Textarea
              label='Allergies'
              value={form.allergies}
              onChange={(v) => setForm((f) => ({ ...f, allergies: v }))}
              disabled={!canSave}
            />

            <Textarea
              label='Medical Conditions'
              value={form.medical_conditions}
              onChange={(v) => setForm((f) => ({ ...f, medical_conditions: v }))}
              disabled={!canSave}
            />

            <Textarea
              label='Current Medications'
              value={form.current_medications}
              onChange={(v) => setForm((f) => ({ ...f, current_medications: v }))}
              disabled={!canSave}
            />

            <Field
              label='Emergency Contact Name'
              value={form.emergency_contact_name}
              onChange={(v) => setForm((f) => ({ ...f, emergency_contact_name: v }))}
              disabled={!canSave}
            />

            <Field
              label='Doctor Name'
              value={form.doctor_name}
              onChange={(v) => setForm((f) => ({ ...f, doctor_name: v }))}
              disabled={!canSave}
            />

            <Field
              label='Doctor Phone'
              value={form.doctor_phone}
              onChange={(v) => setForm((f) => ({ ...f, doctor_phone: v }))}
              disabled={!canSave}
            />
          </div>

          <Textarea
            label='Emergency Notes'
            value={form.emergency_notes}
            onChange={(v) => setForm((f) => ({ ...f, emergency_notes: v }))}
            disabled={!canSave}
          />

          {error && <p className='rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600'>{error}</p>}
          {status && <p className='rounded-lg bg-emerald-50 px-3 py-2 text-xs text-[var(--emerald)]'>{status}</p>}

          <div className='flex justify-end pt-2'>
            <button
              type='submit'
              disabled={!canSave || saving}
              className='inline-flex items-center gap-2 rounded-xl bg-[var(--emerald)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60'
            >
              {saving && <Loader2 size={16} className='animate-spin' />}
              Save
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  disabled?: boolean
}) {
  return (
    <label className='block'>
      <span className='mb-1.5 block text-xs font-semibold'>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        disabled={disabled}
        className='w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:opacity-70'
      />
    </label>
  )
}

function Textarea({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <label className='block'>
      <span className='mb-1.5 block text-xs font-semibold'>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        disabled={disabled}
        className='w-full resize-none rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:opacity-70'
      />
    </label>
  )
}


