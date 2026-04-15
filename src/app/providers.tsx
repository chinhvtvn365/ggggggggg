'use client'

import {HeroUIProvider} from "@heroui/system";
import { setupInterceptors } from '@/services/proxy/interceptor.service'
import GlobalLoading from '@/components/common/GlobalLoading'

// Register interceptors as early as possible on the client to avoid first-request race conditions.
setupInterceptors()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      {children}
      <GlobalLoading />
    </HeroUIProvider>
  )
}