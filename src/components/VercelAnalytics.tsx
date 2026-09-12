'use client'

import { useEffect } from 'react'
import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'

export default function VercelAnalytics() {
  useEffect(() => {
    inject()
    injectSpeedInsights()
  }, [])
  return null
}
