import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check, Plus } from 'lucide-react'
import { Seo } from '../components/Seo'
import { seo } from '../seo'

const previewOptions = [
  { title: 'A quiet studio day', votes: 5, width: 'w-[71%]', featured: true },
  { title: 'A short offsite', votes: 2, width: 'w-[29%]', featured: false },
  { title: 'Keep the usual rhythm', votes: 0, width: 'w-0', featured: false },
]

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div data-testid="static-landing" className="min-h-screen bg-background text-foreground">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Link to="/" className="text-xl font-bold tracking-[-0.06em]">proofboard<span className="text-primary">.</span></Link>
          <Link to="/home" className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Open workspace <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </header>

        <main>
          <section className="mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)] lg:items-center lg:gap-20 lg:px-10 lg:pb-32 lg:pt-24">
            <div>
              <p className="mb-7 inline-flex items-center gap-2 border-l-2 border-primary pl-3 text-xs font-bold uppercase tracking-[0.19em] text-primary">
                For the decisions that involve everyone
              </p>
              <h1 className="max-w-3xl text-[clamp(3.3rem,7vw,6.8rem)] font-semibold leading-[0.96] tracking-[-0.075em]">
                Make the call <em className="font-serif font-normal text-primary">together.</em>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Put the options, evidence, and votes in one live space. See what the group thinks—and keep the reason behind the choice.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-5">
                <Link to="/home" className="inline-flex h-12 items-center gap-3 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                  Start a decision <ArrowRight className="size-4" aria-hidden />
                </Link>
                <span className="text-sm text-muted-foreground">Built for small teams and real choices</span>
              </div>
            </div>

            <div aria-label="Preview of a team decision board" className="relative">
              <div className="absolute -left-4 -top-5 h-32 w-32 rounded-full bg-accent blur-3xl" aria-hidden />
              <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_75px_-35px_rgba(24,57,57,0.35)]">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><span className="size-2 rounded-full bg-primary" /> Live decision</div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">7 people</span>
                </div>
                <div className="px-6 py-7 sm:px-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Team rhythm / 03</p>
                  <h2 className="mt-3 max-w-sm text-3xl font-semibold leading-tight tracking-[-0.05em]">How should we spend our next team day?</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">A little room to think before we commit the calendar.</p>
                  <div className="mt-8 space-y-3">
                    {previewOptions.map((option) => (
                      <div key={option.title} className={`rounded-lg border px-4 py-4 ${option.featured ? 'border-primary/50 bg-secondary/50' : 'border-border bg-background/60'}`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className={`flex size-7 items-center justify-center rounded-full border ${option.featured ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}>
                              {option.featured ? <Check className="size-4" aria-hidden /> : <Plus className="size-3" aria-hidden />}
                            </span>
                            <span className="text-sm font-medium">{option.title}</span>
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground">{option.votes} votes</span>
                        </div>
                        <div className="ml-10 mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full bg-primary ${option.width}`} /></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground"><span className="font-semibold text-primary">+ 4 notes</span> explaining the tradeoffs</div>
                </div>
              </div>
              <div className="absolute -bottom-5 -right-3 rotate-[-3deg] rounded-md border border-[#e9d49a] bg-[#fff0bf] px-4 py-3 text-xs font-medium text-[#5d4a27] shadow-sm sm:right-[-20px]">The why matters as much as the vote.</div>
            </div>
          </section>

          <section className="border-t border-border bg-card/70">
            <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 text-sm leading-relaxed text-muted-foreground md:grid-cols-3 lg:px-10">
              <p><span className="mb-2 block text-xs font-bold uppercase tracking-widest text-primary">01 / Frame it</span> Write the question and put real options on the table.</p>
              <p><span className="mb-2 block text-xs font-bold uppercase tracking-widest text-primary">02 / Add the why</span> Collect reasons and sources while everyone weighs in.</p>
              <p><span className="mb-2 block text-xs font-bold uppercase tracking-widest text-primary">03 / Decide</span> Make the result visible, then record the final call.</p>
            </div>
          </section>
        </main>
        <footer className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 text-xs text-muted-foreground lg:px-10">
          <span>Proofboard · A focused DeepSpace build</span>
          <Link to="/home" className="hover:text-primary">Go to boards →</Link>
        </footer>
      </div>
    </>
  )
}
