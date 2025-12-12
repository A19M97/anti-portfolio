'use client'

import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Fingerprint, Brain, Target, Zap, Layers, Sparkles } from "lucide-react"
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from "@/components/language-switcher"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

function FloatingBadge({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: "easeOut" }}
      className="inline-flex items-center rounded-full border border-gray-200 bg-white/50 px-3 py-1 text-sm font-medium text-gray-800 backdrop-blur-xl dark:border-gray-800 dark:bg-white/10 dark:text-gray-200"
    >
      {children}
    </motion.div>
  )
}

export default function HomePage() {
  const { userId } = useAuth()
  const t = useTranslations('HomePage')
  const tFeatures = useTranslations('Features')

  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Hero Parallax
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-white dark:bg-black selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">

      {/* Background Gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/50 backdrop-blur-md dark:bg-black/50">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black transition-transform group-hover:scale-110">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold tracking-tight">{t('appName')}</span>
            </Link>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              {userId ? (
                <Link href="/dashboard">
                  <Button variant="default" className="rounded-full px-6">
                    {t('dashboard')}
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/sign-in">
                    <Button variant="ghost" className="rounded-full">
                      {t('signIn')}
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button className="rounded-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                      {t('signUp')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="relative z-10 pt-32">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 lg:py-32">
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-8 flex justify-center gap-3">
              <FloatingBadge delay={0.1}>✨ AI-Native Identity</FloatingBadge>
              <FloatingBadge delay={0.2}>🚀 48h Challenge</FloatingBadge>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-6xl font-bold tracking-tighter sm:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-gray-500"
            >
              {t('title')}
              <br />
              <span className="text-black dark:text-white">{t('subtitle')}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-8 text-xl leading-relaxed text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            >
              {t('description')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-12 flex items-center justify-center gap-4"
            >
              <Link href={userId ? "/dashboard" : "/sign-up"}>
                <Button size="lg" className="h-14 rounded-full px-8 text-lg gap-2 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-2xl shadow-purple-500/20 transition-all hover:scale-105">
                  {userId ? t('goToDashboard') : t('startBuilding')}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Philosophy Section */}
        <section className="relative py-32 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-6">
            <div className="mb-16 text-center">
              <h2 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">{tFeatures('philosophy.title')}</h2>
              <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {tFeatures('philosophy.description')}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  icon: Fingerprint,
                  title: tFeatures('philosophy.cards.unique.title'),
                  desc: tFeatures('philosophy.cards.unique.description'),
                  color: "text-blue-500"
                },
                {
                  icon: Brain,
                  title: tFeatures('philosophy.cards.thinking.title'),
                  desc: tFeatures('philosophy.cards.thinking.description'),
                  color: "text-purple-500"
                },
                {
                  icon: Target,
                  title: tFeatures('philosophy.cards.proof.title'),
                  desc: tFeatures('philosophy.cards.proof.description'),
                  color: "text-green-500"
                }
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm transition-all hover:shadow-xl dark:bg-gray-800"
                >
                  <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-700/50 ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{card.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {card.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-32">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-2xl text-center mb-20">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                {tFeatures('howItWorks.title')}
              </h2>
            </div>

            <div className="grid gap-12 lg:grid-cols-3 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden lg:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-gray-200 via-purple-200 to-gray-200 dark:from-gray-800 dark:via-purple-900 dark:to-gray-800" />

              {[
                { step: "01", ...tFeatures.raw('howItWorks.step1'), icon: Layers },
                { step: "02", ...tFeatures.raw('howItWorks.step2'), icon: Zap },
                { step: "03", ...tFeatures.raw('howItWorks.step3'), icon: Sparkles }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white border border-gray-100 shadow-xl dark:bg-gray-800 dark:border-gray-700 z-10">
                    <item.icon className="h-10 w-10 text-gray-900 dark:text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-xs">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900">
          <div className="container mx-auto px-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>{t('footer')}</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
