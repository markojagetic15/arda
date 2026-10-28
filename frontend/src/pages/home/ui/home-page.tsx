import { Navigate } from 'react-router-dom'

import { useAuth } from '@/entities/session'

import { CtaSection } from './cta-section'
import { FaqSection } from './faq-section'
import { FeaturesSection } from './features-section'
import { HeroSection } from './hero-section'
import { HowItWorksSection } from './how-it-works-section'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

export function HomePage() {
  const { user, isInitializing } = useAuth()

  if (!isInitializing && user) {
    return <Navigate to="/workspace" replace />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FaqSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  )
}
