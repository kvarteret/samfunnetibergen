"use client"

import { HelpCircle, X } from "lucide-react"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import posthog from "posthog-js"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import type { StudentGroupSummary } from "@/lib/sanity/fetch"
import { cn } from "@/lib/utils"

// `three` and the pose tracker are heavy, so only load them once the visitor
// opens the quiz.
const SortingHatDemo = dynamic(
  () => import("./SortingHatDemo").then(module => module.SortingHatDemo),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center rounded-lg bg-black">
        <div
          aria-label="Laster sorteringshatten"
          className="size-10 animate-spin rounded-full border-4 border-white/30 border-t-white"
          role="status"
        />
      </div>
    ),
  },
)

const RARITIES = {
  Common: {
    name: "Allmenn",
    bg: "bg-blue-600",
    border: "border-blue-800",
    weight: 50,
  },
  Uncommon: {
    name: "Alminnelig",
    bg: "bg-purple-600",
    border: "border-purple-800",
    weight: 20,
  },
  Rare: {
    name: "Sjelden",
    bg: "bg-pink-500",
    border: "border-pink-700",
    weight: 15,
  },
  Legendary: {
    name: "Legendarisk",
    bg: "bg-primary",
    border: "border-red-700",
    weight: 10,
  },
  Mythic: {
    name: "Mytisk",
    bg: "bg-yellow-500",
    border: "border-yellow-600",
    weight: 5,
  },
} as const

type Rarity = keyof typeof RARITIES

type Item = {
  id: number
  name: string
  rarity: Rarity
  slug: string
}

const ITEM_POOL: Item[] = [
  { id: 1, name: "Skjenkegruppen", slug: "skjenkegruppen", rarity: "Common" },
  { id: 2, name: "Kraftetaten", slug: "kraftetaten", rarity: "Uncommon" },
  { id: 3, name: "E-tjenesten", slug: "e-tjenesten", rarity: "Legendary" },
  {
    id: 4,
    name: "Kommunikasjonavdelingen",
    slug: "kommunikasjonavdelingen",
    rarity: "Rare",
  },
  {
    id: 5,
    name: "Sosialdepartementet",
    slug: "sosialdepartementet",
    rarity: "Mythic",
  },
  { id: 6, name: "Quiz", slug: "quiz", rarity: "Rare" },
  { id: 7, name: "Rettsvesenet", slug: "rettsvesenet", rarity: "Legendary" },
  { id: 8, name: "Aktuelt", slug: "aktuelt", rarity: "Common" },
  { id: 9, name: "Romvesenet", slug: "romvesenet", rarity: "Mythic" },
  { id: 10, name: "Debatt", slug: "debatt", rarity: "Common" },
  { id: 11, name: "Vaktetaten", slug: "vaktetaten", rarity: "Common" },
  { id: 12, name: "Fest", slug: "fest", rarity: "Common" },
  {
    id: 13,
    name: "Finansdepartementet",
    slug: "finansdepartementet",
    rarity: "Rare",
  },
  { id: 14, name: "HELLO", slug: "hello", rarity: "Rare" },
  { id: 15, name: "Upop", slug: "upop", rarity: "Common" },
  {
    id: 16,
    name: "Diskodepartementet",
    slug: "diskodepartementet",
    rarity: "Uncommon",
  },
]

const WINNING_INDEX = 40
const TOTAL_ITEMS = 50
const SPIN_DURATION_MS = 7000

function GroupUnboxing({ groups }: { groups: StudentGroupSummary[] }) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [generatedItems, setGeneratedItems] = useState<Item[]>([])
  const [winner, setWinner] = useState<Item | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSpinRef = useRef(false)

  // Prefer the names from Sanity when the slug matches so the reveal links to
  // a group that actually exists.
  const pool = useMemo(
    () =>
      ITEM_POOL.map(item => {
        const group = groups.find(candidate => candidate.slug === item.slug)
        return group ? { ...item, name: group.name } : item
      }),
    [groups],
  )

  const getRandomItem = (): Item => {
    const rand = Math.random() * 100
    let cumulativeWeight = 0
    let chosenRarity: Rarity = "Common"

    for (const [key, value] of Object.entries(RARITIES)) {
      cumulativeWeight += value.weight
      if (rand <= cumulativeWeight) {
        chosenRarity = key as Rarity
        break
      }
    }
    const filteredPool = pool.filter(item => item.rarity === chosenRarity)
    const finalPool = filteredPool.length ? filteredPool : pool
    return finalPool[Math.floor(Math.random() * finalPool.length)]
  }

  const handleSpin = () => {
    if (isSpinning) return

    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current)

    setIsSpinning(true)
    setWinner(null)

    // Snap back to the start before the new items render. The reel transform is
    // driven imperatively below so it never races React's commit.
    const container = containerRef.current
    if (container) {
      container.style.transition = "none"
      container.style.transform = "translateX(0px)"
    }

    // The reel content changes here, so centering is measured after React has
    // committed the new items (see the effect below).
    pendingSpinRef.current = true
    const list = Array.from({ length: TOTAL_ITEMS }, () => getRandomItem())
    setGeneratedItems(list)

    finishTimeoutRef.current = setTimeout(() => {
      setIsSpinning(false)
      setWinner(list[WINNING_INDEX])
    }, SPIN_DURATION_MS)
  }

  // Runs after the freshly spun items are in the DOM (and after the reset frame
  // has painted) so we can measure the real position of the winning item
  // instead of assuming a fixed stride.
  useEffect(() => {
    if (!pendingSpinRef.current) return
    pendingSpinRef.current = false

    const container = containerRef.current
    const parent = container?.parentElement
    const winningItem = itemRefs.current[WINNING_INDEX]
    if (!container || !parent || !winningItem) return

    const parentRect = parent.getBoundingClientRect()
    const itemRect = winningItem.getBoundingClientRect()
    const itemCenter = itemRect.left + itemRect.width / 2 - parentRect.left
    // Land a little off-center inside the item so it does not stop pixel-perfect
    // every time, while keeping the marker well within the winning item.
    const jitter = (Math.random() - 0.5) * itemRect.width * 0.2
    const finalTranslateX = itemCenter - parentRect.width / 2 + jitter

    container.style.transition = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.1, 0.6, 0.1, 1)`
    container.style.transform = `translateX(-${finalTranslateX}px)`
  }, [generatedItems])

  return (
    <div className="flex w-full flex-col items-center gap-2 rounded-lg bg-black/80 p-3 text-white backdrop-blur-sm">
      <div className="relative flex h-20 w-full max-w-2xl items-center overflow-hidden rounded-md bg-black/40">
        <div className="absolute top-0 bottom-0 left-1/2 z-10 w-0.5 -translate-x-1/2 bg-secondary" />

        <div ref={containerRef} className="flex gap-2 px-[50%]">
          {generatedItems.map((item, idx) => (
            <div
              key={idx}
              ref={element => {
                itemRefs.current[idx] = element
              }}
              className={`flex h-14 w-28 shrink-0 items-center justify-center rounded border-b-4 px-2 text-center text-[10px] leading-tight shadow-md ${RARITIES[item.rarity].bg} ${RARITIES[item.rarity].border}`}
            >
              <p className="w-full truncate">{item.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-2xl flex-col items-stretch gap-2">
        {winner && !isSpinning ? (
          <>
            <div
              className={`flex min-w-0 animate-bounce-3 items-center justify-between gap-3 rounded-md px-3 py-2 ${RARITIES[winner.rarity].bg}`}
            >
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-widest text-yellow-400 uppercase">
                  Du fikk
                </p>
                <p className="truncate text-sm font-bold leading-tight">
                  {winner.name}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold">
                {RARITIES[winner.rarity].name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="flex-1"
                render={<Link href={`/grupper/${winner.slug}`} />}
                size="sm"
              >
                MELD DEG INN HER
              </Button>
              <button
                aria-label="Spinn igjen"
                className="rounded-base border border-white/30 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                onClick={handleSpin}
                type="button"
              >
                ↻
              </button>
            </div>
          </>
        ) : (
          <button
            className={cn(
              "cursor-pointer rounded-md px-6 py-1.5 text-sm font-bold tracking-wider uppercase transition-all duration-200",
              isSpinning
                ? "cursor-not-allowed bg-primary/50 text-slate-300"
                : "bg-primary text-slate-950 hover:bg-primary/80 active:scale-95",
            )}
            disabled={isSpinning}
            onClick={handleSpin}
            type="button"
          >
            {isSpinning
              ? "Åpner..."
              : generatedItems.length === 0
                ? "RULL"
                : "RULL PÅ NYTT"}
          </button>
        )}
      </div>
    </div>
  )
}

type Mode = "hat" | "wheel"

export function ValgomatenInfobox({
  groups,
}: {
  groups: StudentGroupSummary[]
}) {
  const t = useTranslations("GroupsPage")
  const [mode, setMode] = useState<Mode | null>(null)
  const [cameraActive, setCameraActive] = useState(false)

  const handleOpen = (nextMode: Mode) => {
    if (mode) return
    posthog.capture("valgomaten_clicked", { mode: nextMode })
    setMode(nextMode)
  }

  const handleCameraActiveChange = useCallback((active: boolean) => {
    setCameraActive(active)
  }, [])

  const handleClose = () => {
    setMode(null)
    setCameraActive(false)
  }

  return (
    <aside
      className={cn(
        "space-y-4 border-2 border-primary/40 bg-primary/5 p-5",
        mode === "hat" && cameraActive ? "lg:w-[min(46rem,92vw)]" : "lg:w-80",
      )}
    >
      {!mode ? (
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-start gap-3">
            <HelpCircle
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-primary"
            />
            <p className="font-heading text-lg leading-tight text-foreground">
              {t("quizPrompt")}
            </p>
          </div>
          <Button
            onClick={() => handleOpen("hat")}
            type="button"
            variant="default"
          >
            {t("quizButton")}
          </Button>
          <Button
            onClick={() => handleOpen("wheel")}
            type="button"
            variant="neutral"
          >
            {t("quizButtonWheel")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="font-heading text-lg leading-tight text-foreground">
              {mode === "hat" ? t("quizTitle") : t("quizTitleWheel")}
            </p>
            <button
              aria-label={t("quizClose")}
              className="focus-brutal rounded-full p-1 text-foreground hover:bg-primary/10"
              onClick={handleClose}
              type="button"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          {mode === "hat" ? (
            <div className="h-[min(70vh,38rem)] min-h-96 w-full overflow-hidden rounded-lg">
              <SortingHatDemo onActiveChange={handleCameraActiveChange}>
                <GroupUnboxing groups={groups} />
              </SortingHatDemo>
            </div>
          ) : (
            <GroupUnboxing groups={groups} />
          )}
        </div>
      )}
    </aside>
  )
}
