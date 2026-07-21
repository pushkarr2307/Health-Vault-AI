import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Loader2, Phone, AlertTriangle, User, Heart } from 'lucide-react'

import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/emergency/$userId')({
  head: () => ({
    meta: [
      { title: 'Emergency Profile — HealthVault AI' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
    ],
  }),
  component: EmergencyProfile,
})

type EmergencyData = {
  full_name: string | null
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

function EmergencyProfile() {
  const params = Route.useParams()
  const userId = params.userId

  const [loading, setLoading] = useState(true)
  const [found, setFound] = useState(false)
  const [data, setData] = useState<EmergencyData | null>(null)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      setLoading(true)
      setFound(false)

      try {
        // Fetch patient name from profiles
        const profilePromise = supabase
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .maybeSingle<{ full_name: string | null }>()

        // Fetch emergency profile data
        const emergencyPromise = supabase
          .from('emergency_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle<{
            blood_group: string | null
            allergies: string | null
            medical_conditions: string | null
            current_medications: string | null
            emergency_contact_name: string | null
            emergency_contact_phone: string | null
            doctor_name: string | null
            doctor_phone: string | null
            emergency_notes: string | null
          }>()

        const [profileResult, emergencyResult] = await Promise.all([
          profilePromise,
          emergencyPromise,
        ])

        if (!mounted) return

        const fullName = profileResult.data?.full_name ?? null
        const emergencyData = emergencyResult.data

        if (!emergencyData) {
          setFound(false)
          setData(null)
          setLoading(false)
          return
        }

        setFound(true)
        setData({
          full_name: fullName,
          blood_group: emergencyData.blood_group ?? null,
          allergies: emergencyData.allergies ?? null,
          medical_conditions: emergencyData.medical_conditions ?? null,
          current_medications: emergencyData.current_medications ?? null,
          emergency_contact_name: emergencyData.emergency_contact_name ?? null,
          emergency_contact_phone: emergencyData.emergency_contact_phone ?? null,
          doctor_name: emergencyData.doctor_name ?? null,
          doctor_phone: emergencyData.doctor_phone ?? null,
          emergency_notes: emergencyData.emergency_notes ?? null,
        })
        setLoading(false)
      } catch {
        if (!mounted) return
        setFound(false)
        setData(null)
        setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [userId])

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-slate-500">Loading emergency profile…</p>
        </div>
      </div>
    )
  }

  // --- Not Found State ---
  if (!found || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Emergency Profile Not Found</h1>
          <p className="mt-3 text-base text-slate-500">
            This patient has not set up an emergency profile yet. Please check the QR code or ask
            them to update their emergency information.
          </p>
        </div>
      </div>
    )
  }

  // --- Data Available: Emergency Profile Card ---
  const hasAllergies = data.allergies && data.allergies.trim().length > 0
  const hasConditions = data.medical_conditions && data.medical_conditions.trim().length > 0
  const hasMedications = data.current_medications && data.current_medications.trim().length > 0
  const hasNotes = data.emergency_notes && data.emergency_notes.trim().length > 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Emergency header bar */}
      <div className="sticky top-0 z-10 bg-emerald-600 px-4 py-3 text-center text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-2">
          <Heart className="h-5 w-5 fill-white" />
          <p className="text-sm font-semibold uppercase tracking-wide">Emergency Medical Profile</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-10 pt-6">
        {/* Patient Name */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <User className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {data.full_name || 'Patient'}
          </h1>
          {data.blood_group && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-5 py-1.5">
              <span className="text-sm font-medium text-slate-500">Blood Group:</span>
              <span className="text-xl font-bold text-emerald-700">{data.blood_group}</span>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="space-y-4">
          {/* Allergies */}
          {hasAllergies && (
            <InfoSection
              title="Allergies"
              content={data.allergies!}
              accent="border-l-amber-400 bg-amber-50"
            />
          )}

          {/* Medical Conditions */}
          {hasConditions && (
            <InfoSection
              title="Medical Conditions"
              content={data.medical_conditions!}
              accent="border-l-red-400 bg-red-50"
            />
          )}

          {/* Current Medications */}
          {hasMedications && (
            <InfoSection
              title="Current Medications"
              content={data.current_medications!}
              accent="border-l-blue-400 bg-blue-50"
            />
          )}
        </div>

        {/* Emergency Contact */}
        {(data.emergency_contact_name || data.emergency_contact_phone) && (
          <ContactCard
            title="Emergency Contact"
            name={data.emergency_contact_name ?? undefined}
            phone={data.emergency_contact_phone ?? undefined}
          />
        )}

        {/* Doctor */}
        {(data.doctor_name || data.doctor_phone) && (
          <ContactCard
            title="Doctor"
            name={data.doctor_name ?? undefined}
            phone={data.doctor_phone ?? undefined}
          />
        )}

        {/* Emergency Notes */}
        {hasNotes && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
              Emergency Notes
            </h3>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">
              {data.emergency_notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>This profile was shared via a secure QR code.</p>
          <p className="mt-0.5">Generated by HealthVault AI</p>
        </div>
      </div>
    </div>
  )
}

// --- Sub-components ---

function InfoSection({
  title,
  content,
  accent,
}: {
  title: string
  content: string
  accent: string
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${accent}`}
    >
      <h3 className="mb-1.5 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">{content}</p>
    </div>
  )
}

function ContactCard({
  title,
  name,
  phone,
}: {
  title: string
  name?: string
  phone?: string
}) {
  const hasPhone = phone && phone.trim().length > 0
  const hasName = name && name.trim().length > 0

  if (!hasName && !hasPhone) return null

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {hasName && (
            <p className="text-lg font-semibold text-slate-900">{name}</p>
          )}
          {hasPhone && (
            <p className="mt-0.5 text-base text-slate-600">{phone}</p>
          )}
        </div>
        {hasPhone && (
          <a
            href={`tel:${phone!.replace(/[\s\-\(\)]/g, '')}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-base font-bold text-white shadow-sm transition active:bg-emerald-700 sm:text-lg"
          >
            <Phone className="h-5 w-5 fill-white" />
            Call
          </a>
        )}
      </div>
    </div>
  )
}

