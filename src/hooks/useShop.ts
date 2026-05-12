import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { fetchShopByUserId } from '../lib/craftlyApi'
import { toErrorMessage } from '../lib/errors'
import type { ShopRow } from '../types/database'

type UseShopResult = {
  shop: ShopRow | null
  isLoading: boolean
  errorMessage: string | null
  refreshShop: () => Promise<void>
  isOnboardingComplete: boolean
}

export function useShop(): UseShopResult {
  const { user } = useAuth()
  const [shop, setShop] = useState<ShopRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshShop = useCallback(async () => {
    if (!user) {
      setShop(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    try {
      const row = await fetchShopByUserId(user.id)
      setShop(row)
    } catch (error) {
      setErrorMessage(toErrorMessage(error, 'Unable to load shop right now.'))
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshShop()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [refreshShop])

  const isOnboardingComplete = useMemo(() => Boolean(shop?.onboarding_completed), [shop])

  return { shop, isLoading, errorMessage, refreshShop, isOnboardingComplete }
}
