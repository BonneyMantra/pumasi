'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Briefcase,
  Shield,
  Users,
  Scale,
  ArrowRight,
  CheckCircle2,
  Handshake,
  Star
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export default function LandingPage() {
  const { t } = useTranslation()

  const features = [
    {
      icon: Briefcase,
      title: t('features.findJobs.title'),
      description: t('features.findJobs.description'),
    },
    {
      icon: Users,
      title: t('features.trustMatching.title'),
      description: t('features.trustMatching.description'),
    },
    {
      icon: Scale,
      title: t('features.fairDisputes.title'),
      description: t('features.fairDisputes.description'),
    },
    {
      icon: Shield,
      title: t('features.escrow.title'),
      description: t('features.escrow.description'),
    },
  ]

  const benefits = [
    t('benefits.trustScore'),
    t('benefits.escrow'),
    t('benefits.arbitration'),
    t('benefits.reputation'),
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky/10 border border-sky/20 mb-6">
            <Handshake className="h-4 w-4 text-sky" />
            <span className="text-sm text-sky">{t('hero.badge')}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            {t('hero.titleHighlight')}{' '}
            <span className="text-sky">{t('hero.title')}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('hero.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/jobs">
              <Button
                size="lg"
                className="bg-sky hover:bg-sky/90 text-sky-foreground px-8"
              >
                {t('hero.findJobs')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/jobs/new">
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:bg-secondary"
              >
                {t('hero.postJob')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('features.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-card border-border p-6 hover:border-sky/50 transition-colors"
            >
              <div className="p-3 rounded-lg bg-sky/10 inline-block mb-4">
                <feature.icon className="h-6 w-6 text-sky" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-card rounded-2xl p-8 md:p-12 border border-border">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                {t('benefits.shinroeIntegration')}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t('benefits.shinroeDescription')}
              </p>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-sky flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-sky/20 blur-3xl rounded-full" />
                <div className="relative bg-background rounded-2xl p-8 border border-border">
                  <div className="text-center">
                    <Star className="h-8 w-8 text-sky mx-auto mb-2" />
                    <div className="text-5xl font-bold text-sky mb-2">847</div>
                    <div className="text-muted-foreground text-sm">{t('benefits.trustScore')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {t('cta.description')}
          </p>
          <Link href="/jobs">
            <Button
              size="lg"
              className="bg-sky hover:bg-sky/90 text-sky-foreground px-8"
            >
              {t('cta.getStarted')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
