import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export interface BusinessSettings {
  businessName: string
  abn: string
  logoUrl: string | null
}

interface BusinessSettingsContextValue {
  settings: BusinessSettings
  loading: boolean
  updateSettings: (patch: Partial<Pick<BusinessSettings, 'businessName' | 'abn'>>) => Promise<void>
  uploadLogo: (file: File) => Promise<void>
}

const DEFAULTS: BusinessSettings = { businessName: 'My Business', abn: '', logoUrl: null }

const BusinessSettingsContext = createContext<BusinessSettingsContextValue | null>(null)

export function BusinessSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('business_settings')
      .select('*')
      .eq('id', true)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        if (data) setSettings({ businessName: data.business_name, abn: data.abn, logoUrl: data.logo_url })
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const updateSettings = useCallback(async (patch: Partial<Pick<BusinessSettings, 'businessName' | 'abn'>>) => {
    const { error } = await supabase
      .from('business_settings')
      .update({
        ...(patch.businessName !== undefined ? { business_name: patch.businessName } : {}),
        ...(patch.abn !== undefined ? { abn: patch.abn } : {}),
      })
      .eq('id', true)
    if (error) throw new Error(error.message)
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const uploadLogo = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `logo-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('business-assets').upload(path, file, { upsert: true })
    if (uploadError) throw new Error(uploadError.message)
    const { data } = supabase.storage.from('business-assets').getPublicUrl(path)
    const { error } = await supabase.from('business_settings').update({ logo_url: data.publicUrl }).eq('id', true)
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
