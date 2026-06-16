'use client'
import '../../instrumentation-client'
import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useUser } from '@clerk/nextjs'

function PostHogIdentify() {
  const { user, isLoaded } = useUser()
  useEffect(() => {
    if (!isLoaded) return
    if (user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? user.username,
      })
    } else {
      posthog.reset()
    }
  }, [user, isLoaded])
  return null
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <PostHogIdentify />
      {children}
    </PostHogProvider>
  )
}
