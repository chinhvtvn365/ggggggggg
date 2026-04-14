'use client'

import { useRef, useEffect } from 'react'
import {HeroUIProvider} from "@heroui/system";
import { setupInterceptors } from '@/services/proxy/interceptor.service'

export function Providers({ children }: { children: React.ReactNode }) {
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      setupInterceptors()
    }
  }, [])

  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  )
}