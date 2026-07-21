import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Download, Loader2, RefreshCcw } from 'lucide-react'
import QRCode from 'qrcode'

import { AppShell } from '@/components/AppShell'

import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export const Route = createFileRoute('/emergency-qr')({
  head: () => ({ meta: [{ title: 'Emergency QR — HealthVault AI' }] }),
  component: EmergencyQrPage,
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

function buildEmergencyPayload(form: FormState) {
  return {
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
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  type?: string
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

function EmergencyQrPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const [recordId, setRecordId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const [qrLoading, setQrLoading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const qrText = useMemo(() => {
    if (!user) return ''
    // Public page for QR scans
    return `${window.location.origin}/emergency/${encodeURIComponent(user.id)}`
  }, [user])

  useEffect(() => {
    let mounted = true

    ;(async () => {
      setLoading(true)
      setError(null)
      setStatus(null)

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error: fetchErr } = await supabase
        .from('emergency_profiles')
        .select('*')
        .eq('user_id', user.id)
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
  }, [user])

  const save = async () => {
    if (!user) return

    setSaving(true)
    setError(null)
    setStatus(null)

    const payload = {
      user_id: user.id,
      ...buildEmergencyPayload(form),
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
        const { error: insErr } = await supabase
          .from('emergency_profiles')
          .insert(payload)

        if (insErr) throw insErr

        setStatus('Emergency profile saved.')

        // refresh record id for later updates
        const { data: createdData, error: createdErr } = await supabase
          .from('emergency_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle<{ id: string }>()

        if (createdErr) {
          setError(createdErr.message)
        } else if (createdData?.id) {
          setRecordId(createdData.id)
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save emergency profile.')
    } finally {
      setSaving(false)
    }
  }

  const generateQr = async () => {
    if (!user) return
    setQrLoading(true)
    setError(null)

    try {
      const url = await QRCode.toDataURL(qrText, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 512,
      })
      setQrDataUrl(url)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate emergency QR.')
    } finally {
      setQrLoading(false)
    }
  }

  const downloadQr = () => {
    if (!qrDataUrl) return

    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = 'emergency-qr.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  useEffect(() => {
    // Generate an initial QR once we have a user + (attempt) to ensure QR is available even before first save.
    if (!user) return
    if (qrDataUrl) return

    void generateQr()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (loading) {
    return (
      <AppShell>
        <div className='flex items-center justify-center py-16'>
          <Loader2 className='animate-spin text-[var(--muted-ink)]' size={22} />
        </div>
      </AppShell>
    )
  }

  const canEdit = !!user

  return (
    <AppShell>
      <div className='mx-auto w-full max-w-6xl space-y-6 px-2 py-4'>
        <div className='rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm'>
          <div className='flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <h2 className='text-xl font-bold'>Emergency QR</h2>
              <p className='mt-1 text-sm text-[var(--muted-ink)]'>
                Update your emergency profile and generate a QR for responders.
              </p>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <button
                type='button'
                onClick={() => void generateQr()}
                disabled={!canEdit || qrLoading}
                className='inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand)] shadow-sm hover:bg-slate-50 disabled:opacity-60'
              >
                {qrLoading ? (
                  <Loader2 size={16} className='animate-spin' />
                ) : (
                  <RefreshCcw size={16} />
                )}
                Generate
              </button>

              <button
                type='button'
                onClick={downloadQr}
                disabled={!qrDataUrl}
                className='inline-flex items-center gap-2 rounded-xl bg-[var(--emerald)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60'
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        </div>

        <div className='grid gap-6 lg:grid-cols-[1.35fr_0.65fr]'>
          <div className='rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm'>
            <form
              className='space-y-5'
              onSubmit={(e) => {
                e.preventDefault()
                if (canEdit) void save()
              }}
            >
              <div className='grid gap-5 sm:grid-cols-2'>
                <Field
                  label='Blood Group'
                  value={form.blood_group}
                  onChange={(v) => setForm((f) => ({ ...f, blood_group: v }))}
                  disabled={!canEdit || saving}
                />

                <Field
                  label='Emergency Contact Phone'
                  value={form.emergency_contact_phone}
                  onChange={(v) => setForm((f) => ({ ...f, emergency_contact_phone: v }))}
                  disabled={!canEdit || saving}
                />

                <Textarea
                  label='Allergies'
                  value={form.allergies}
                  onChange={(v) => setForm((f) => ({ ...f, allergies: v }))}
                  disabled={!canEdit || saving}
                />

                <Textarea
                  label='Medical Conditions'
                  value={form.medical_conditions}
                  onChange={(v) => setForm((f) => ({ ...f, medical_conditions: v }))}
                  disabled={!canEdit || saving}
                />

                <Textarea
                  label='Current Medications'
                  value={form.current_medications}
                  onChange={(v) => setForm((f) => ({ ...f, current_medications: v }))}
                  disabled={!canEdit || saving}
                />

                <Field
                  label='Emergency Contact Name'
                  value={form.emergency_contact_name}
                  onChange={(v) => setForm((f) => ({ ...f, emergency_contact_name: v }))}
                  disabled={!canEdit || saving}
                />

                <Field
                  label='Doctor Name'
                  value={form.doctor_name}
                  onChange={(v) => setForm((f) => ({ ...f, doctor_name: v }))}
                  disabled={!canEdit || saving}
                />

                <Field
                  label='Doctor Phone'
                  value={form.doctor_phone}
                  onChange={(v) => setForm((f) => ({ ...f, doctor_phone: v }))}
                  disabled={!canEdit || saving}
                />
              </div>

              <Textarea
                label='Emergency Notes'
                value={form.emergency_notes}
                onChange={(v) => setForm((f) => ({ ...f, emergency_notes: v }))}
                disabled={!canEdit || saving}
              />

              {error && <p className='rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600'>{error}</p>}
              {status && <p className='rounded-lg bg-emerald-50 px-3 py-2 text-xs text-[var(--emerald)]'>{status}</p>}

              <div className='flex justify-end pt-2'>
                <button
                  type='submit'
                  disabled={!canEdit || saving}
                  className='inline-flex items-center gap-2 rounded-xl bg-[var(--emerald)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60'
                >
                  {saving && <Loader2 size={16} className='animate-spin' />}
                  Save profile
                </button>
              </div>
            </form>
          </div>

          <div className='rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h3 className='text-sm font-bold'>Your QR</h3>
                <p className='mt-1 text-xs text-[var(--muted-ink)]'>Scan to view emergency profile</p>
              </div>
            </div>

            <div className='mt-4 flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-white p-4'>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt='Emergency QR code' className='h-auto w-full max-w-[260px]' />
              ) : (
                <div className='flex items-center justify-center py-16'>
                  <Loader2 className='animate-spin text-[var(--muted-ink)]' size={22} />
                </div>
              )}
            </div>

            <div className='mt-4 break-all rounded-xl bg-slate-50 px-3 py-2 text-xs text-[var(--muted-ink)]'>
              {qrText}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

