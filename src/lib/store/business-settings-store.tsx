import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'

export interface BusinessSettings {
  businessName: string
  abn: string
  logoUrl: string | null
  licenceNumber: string
  isGstRegistered: boolean
  bankAccountName: string
  bankBsb: string
  bankAccountNumber: string
  defaultQuoteTerms: string
  defaultQuoteExclusions: string
}

type EditableFields = Omit<BusinessSettings, 'logoUrl'>

interface BusinessSettingsContextValue {
  settings: BusinessSettings
  loading: boolean
  updateSettings: (patch: Partial<EditableFields>) => Promise<void>
  uploadLogo: (file: File) => Promise<void>
}

const DEFAULTS: BusinessSettings = {
  businessName: 'My Business',
  abn: '',
  logoUrl: null,
  licenceNumber: '',
  isGstRegistered: true,
  bankAccountName: '',
  bankBsb: '',
  bankAccountNumber: '',
  defaultQuoteTerms: '',
  defaultQuoteExclusions: '',
}

const BusinessSettingsContext = createContext<BusinessSettingsContextValue | null>(null)

export function BusinessSettingsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  // business_profile is keyed by business_id (one row per business) rather than the old
  // singleton "id = true" row, so every read/write needs to know which row is "mine".
  const businessIdRef = useRef<string | null>(null)

  useEffect(() => {
    businessIdRef.current = null
    if (!session) {
      setSettings(DEFAULTS)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setSettings(DEFAULTS)
    supabase
      .from('business_profile')
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        if (data) {
          businessIdRef.current = data.business_id
          setSettings({
            businessName: data.business_name,
            abn: data.abn,
            logoUrl: data.logo_url,
            licenceNumber: data.licence_number,
            isGstRegistered: data.is_gst_registered,
            bankAccountName: data.bank_account_name,
            bankBsb: data.bank_bsb,
            bankAccountNumber: data.bank_account_number,
            defaultQuoteTerms: data.default_quote_terms,
            defaultQuoteExclusions: data.default_quote_exclusions,
          })
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session])

  const updateSettings = useCallback(async (patch: Partial<EditableFields>) => {
    if (!businessIdRef.current) throw new Error('Business settings not loaded yet')
    const { error } = await supabase
      .from('business_profile')
      .update({
        ...(patch.businessName !== undefined ? { business_name: patch.businessName } : {}),
        ...(patch.abn !== undefined ? { abn: patch.abn } : {}),
        ...(patch.licenceNumber !== undefined ? { licence_number: patch.licenceNumber } : {}),
        ...(patch.isGstRegistered !== undefined ? { is_gst_registered: patch.isGstRegistered } : {}),
        ...(patch.bankAccountName !== undefined ? { bank_account_name: patch.bankAccountName } : {}),
        ...(patch.bankBsb !== undefined ? { bank_bsb: patch.bankBsb } : {}),
        ...(patch.bankAccountNumber !== undefined ? { bank_account_number: patch.bankAccountNumber } : {}),
        ...(patch.defaultQuoteTerms !== undefined ? { default_quote_terms: patch.defaultQuoteTerms } : {}),
        ...(patch.defaultQuoteExclusions !== undefined ? { default_quote_exclusions: patch.defaultQuoteExclusions } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessIdRef.current)
    if (error) throw new Error(error.message)
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const uploadLogo = useCallback(async (file: File) => {
    if (!businessIdRef.current) throw new Error('Business settings not loaded yet')
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${businessIdRef.current}/logo-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('business-assets').upload(path, file, { upsert: true })
    if (uploadError) throw new Error(uploadError.message)
    const { data } = supabase.storage.from('business-assets').getPublicUrl(path)
    const { error } = await supabase.from('business_profile').update({ logo_url: data.publicUrl }).eq('business_id', businessIdRef.current)
    if (error) throw new Error(error.message)
    setSettings((prev) => ({ ...prev, logoUrl: data.publicUrl }))
  }, [])

  const value = useMemo(() => ({ settings, loading, updateSettings, uploadLogo }), [settings, loading, updateSettings, uploadLogo])

  return <BusinessSettingsContext.Provider value={value}>{children}</BusinessSettingsContext.Provider>
}

export function useBusinessSettings() {
  const ctx = useContext(BusinessSettingsContext)
  if (!ctx) throw new Error('useBusinessSettings must be used within BusinessSettingsProvider')
  return ctx
}
