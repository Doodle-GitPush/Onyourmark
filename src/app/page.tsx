import { DeckMarquee } from "@/components/site/DeckMarquee"
import { Features } from "@/components/site/Features"
import { FinalCta } from "@/components/site/FinalCta"
import { Hero } from "@/components/site/Hero"
import { Manifesto } from "@/components/site/Manifesto"
import { ScrollProgress } from "@/components/site/motion"
import { Mark, Nav } from "@/components/site/Nav"
import { Playground } from "@/components/site/Playground"
import { Audiences, Ecosystem, Faq, Footer, HowItWorks } from "@/components/site/Sections"

/** The product site. The tool itself lives at /studio. */
export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#0A0A0A] text-zinc-200 font-sans">
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <DeckMarquee />
        <Manifesto />
        <Features />
        <Playground />
        <HowItWorks />
        <Audiences />
        <Ecosystem />
        <Faq />
        <FinalCta />
      </main>
      <Footer mark={<Mark className="size-5 text-zinc-100" />} />
    </div>
  )
}
