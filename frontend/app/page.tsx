"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Users, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { motion } from "framer-motion";
import { BackgroundBlobs } from "@/app/components/ui/background-blobs";
import { MouseAura } from "@/app/components/ui/mouse-aura";
import { TiltCard } from "@/app/components/ui/tilt-card";
import { cn } from "@/app/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans">
      <BackgroundBlobs />
      <MouseAura />
      
      <header className="fixed top-0 z-50 w-full px-4 py-4 sm:px-6 md:px-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 shadow-2xl shadow-black/5 backdrop-blur-xl sm:px-6 sm:py-3 dark:bg-black/10">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/20">
              <span className="text-xl font-black italic">A</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground sm:block hidden font-heading">
              Premium <span className="text-brand">LMS</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login">
              <Button size="sm" className="shadow-xl shadow-brand/10 font-bold transition-all">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="shadow-xl shadow-brand/10 font-bold transition-all">
                Join Now
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-6 md:px-10 md:pt-40">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center"
        >
          <div className="space-y-8 text-left">
            <motion.div 
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 text-sm font-bold text-brand"
            >
              <Sparkles className="h-4 w-4" />
              <span>Version 1.0 is Live</span>
            </motion.div>
            
            <motion.h1
              variants={item}
              className="font-heading text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-8xl"
            >
              Master Any Skill with <span className="text-gradient bg-linear-to-r from-brand via-brand-vibrant to-brand-accent bg-clip-text text-transparent pb-2">Elegance</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="max-w-xl text-base font-medium leading-relaxed text-zinc-500 sm:text-xl md:text-2xl dark:text-zinc-400"
            >
              The most sophisticated learning platform ever built. Experience education as a premium digital journey.
            </motion.p>

            <motion.div
              variants={item}
              className="flex flex-col items-stretch gap-5 sm:flex-row sm:items-center sm:gap-8"
            >
              <Link href="/signup">
                <Button size="lg" className="h-14 w-full px-8 text-base font-black shadow-2xl shadow-brand/40 transition-all hover:bg-brand/90 sm:h-16 sm:w-auto sm:px-10 sm:text-lg">
                  Get Started Free
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              <div className="flex w-full items-center justify-start gap-4 sm:w-auto sm:gap-6 sm:px-2">
                <div className="flex -space-x-4 shrink-0">
                  {[
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
                    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop"
                  ].map((url, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                      className="h-12 w-12 overflow-hidden rounded-full border-4 border-white bg-zinc-200 shadow-xl sm:h-14 sm:w-14 dark:border-zinc-900"
                    >
                      <img src={url} alt={`Student ${i + 1}`} className="h-full w-full object-cover" />
                    </motion.div>
                  ))}
                </div>
                <div className="shrink-0">
                  <div className="text-base font-black text-foreground">1k+ Students</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Joined this week</div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={item}
            className="relative lg:block hidden"
          >
            <TiltCard>
              <div className="relative aspect-square rounded-[4rem] bg-linear-to-br from-brand/10 to-brand-accent/10 p-8 shadow-2xl backdrop-blur-3xl ring-1 ring-white/20">
                <div className="h-full w-full rounded-[3rem] bg-white/5 dark:bg-black/20 flex items-center justify-center p-8">
                  <TiltCard className="w-full">
                    <div className="w-full space-y-6 rounded-3xl bg-white p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:bg-zinc-800 ring-1 ring-zinc-100 dark:ring-zinc-700">
                      <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div className="space-y-4">
                        <div className="h-4 w-[40%] rounded-full bg-brand/20" />
                        <div className="h-8 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-700" />
                        <div className="h-8 w-[80%] rounded-2xl bg-zinc-100 dark:bg-zinc-700" />
                      </div>
                      <div className="flex items-center justify-between pt-4">
                        <div className="h-10 w-[60%] rounded-xl bg-brand shadow-lg" />
                        <div className="h-10 w-10 rounded-full border border-border" />
                      </div>
                    </div>
                  </TiltCard>
                </div>
                
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-8 top-20 rounded-2xl bg-white p-4 shadow-2xl dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-400">Course Verified</span>
                      <span className="text-sm font-black text-foreground">Expert Certified</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </TiltCard>
          </motion.div>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-24 grid grid-cols-1 gap-6 sm:mt-32 md:grid-cols-3 md:gap-8"
        >
          {[
            { title: "Smart Learning", desc: "Adaptive curriculum that grows with you.", icon: Sparkles, color: "text-brand" },
            { title: "Expert Instruction", desc: "Learn from industry-leading professionals.", icon: Users, color: "text-brand-vibrant" },
            { title: "Secured Path", desc: "Certifications recognized globally.", icon: ShieldCheck, color: "text-brand-accent" },
          ].map((feature, i) => (
            <TiltCard key={i}>
              <motion.div 
                variants={item}
                className="group relative h-full overflow-hidden rounded-[2.5rem] border border-border bg-white/50 p-6 shadow-xl shadow-black/5 backdrop-blur-sm transition-all hover:bg-white sm:p-10 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
              >
                <div className={cn("mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 font-bold ring-1 ring-zinc-100 group-hover:bg-brand group-hover:text-white transition-all dark:bg-zinc-800 dark:ring-zinc-700", feature.color)}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="font-heading mb-4 text-2xl font-black sm:text-3xl">{feature.title}</h3>
                <p className="text-base font-medium text-zinc-500 transition-colors sm:text-lg dark:text-zinc-400">{feature.desc}</p>
              </motion.div>
            </TiltCard>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
