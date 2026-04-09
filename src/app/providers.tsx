'use client'

import { useRef, useEffect } from 'react'
import { Provider } from 'react-redux'
import { makeStore, AppStore } from '@/lib/store'
import {HeroUIProvider} from "@heroui/system";
import { setupInterceptors } from '@/services/proxy/interceptor.service'

export function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null)
  
  if (!storeRef.current) {
    storeRef.current = makeStore()
    // Setup interceptors NGAY khi tạo store
    setupInterceptors(storeRef.current)
  }

  return (
    <Provider store={storeRef.current}>
      {/* Sử dụng HeroProvider thay vì HeroUIProvider */}
      <HeroUIProvider>
        {children}
      </HeroUIProvider>
    </Provider>
  )
}