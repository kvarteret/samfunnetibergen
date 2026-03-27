import { Button } from "@/components/ui/button"

const quickFacts = [
    { label: "UI base", value: "shadcn" },
    { label: "Theme", value: "neobrutalism" },
    { label: "Stack", value: "Next 16 + React 19" },
]

export default function Home() {
    return (
        <main className="flex flex-1 items-center justify-center px-6 py-16 sm:px-10">
            <section className="w-full max-w-5xl rounded-base border-2 border-border bg-secondary-background shadow-shadow">
                <div className="border-b-2 border-border bg-main px-6 py-4 text-main-foreground sm:px-8">
                    <p className="text-sm uppercase tracking-[0.2em]">Samfunnet i Bergen</p>
                </div>
                <div className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[1.4fr_0.8fr]">
                    <div className="space-y-6">
                        <div className="inline-flex rounded-base border-2 border-border bg-background px-3 py-1 text-xs uppercase tracking-[0.2em] shadow-shadow">
                            Design system smoke test
                        </div>
                        <div className="space-y-4">
                            <h1 className="max-w-2xl text-4xl leading-none sm:text-5xl">
                                shadcn is installed and the neobrutalism button is live.
                            </h1>
                            <p className="max-w-2xl text-base leading-7 sm:text-lg">
                                This page is intentionally small. It proves the component registry,
                                theme tokens, Tailwind v4 setup, and Next 16 app router are all
                                wired together without the default starter UI.
                            </p>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <Button asChild>
                                <a
                                    href="https://www.neobrutalism.dev/docs/installation"
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    Open neobrutalism docs
                                </a>
                            </Button>
                            <Button asChild variant="neutral">
                                <a
                                    href="https://ui.shadcn.com/docs/installation/next"
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    Open shadcn docs
                                </a>
                            </Button>
                            <Button variant="reverse">Ready for more components</Button>
                        </div>
                    </div>

                    <aside className="space-y-4 rounded-base border-2 border-border bg-background p-5 shadow-shadow">
                        <h2 className="text-xl">Starter status</h2>
                        <div className="space-y-3">
                            {quickFacts.map(fact => (
                                <div
                                    className="flex items-center justify-between rounded-base border-2 border-border bg-secondary-background px-4 py-3"
                                    key={fact.label}
                                >
                                    <span className="text-sm uppercase tracking-[0.18em]">
                                        {fact.label}
                                    </span>
                                    <span className="text-sm">{fact.value}</span>
                                </div>
                            ))}
                        </div>
                        <Button className="w-full" variant="noShadow">
                            components/ui/button.tsx
                        </Button>
                    </aside>
                </div>
            </section>
        </main>
    )
}
