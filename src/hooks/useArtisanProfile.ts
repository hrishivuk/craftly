import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { fetchProfileByUserId } from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import type { ArtisanProfileRow } from '../types/database'

type UseArtisanProfileResult = {
  profile: ArtisanProfileRow | null
  isLoading: boolean
  errorMessage: string | null
  refreshProfile: () => Promise<void>
}

export function useArtisanProfile(): UseArtisanProfileResult {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ArtisanProfileRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    try {
      const row = await fetchProfileByUserId(user.id)
      setProfile(row)
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Unable to load profile right now.'))
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshProfile()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [refreshProfile])

  return { profile, isLoading, errorMessage, refreshProfile }
}
