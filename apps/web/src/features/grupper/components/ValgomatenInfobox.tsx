"use client"

import { HelpCircle, X } from "lucide-react"
import dynamic from "next/dynamic"
import posthog from "posthog-js"
import { useCallback, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
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
  const [transformStyle, setTransformStyle] = useState("translateX(0px)")
  const [enableTransition, setEnableTransition] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const ITEM_WIDTH = 112 // w-28
  const GAP = 8 // gap-2
  const STEP = ITEM_WIDTH + GAP // distance from one item's left edge to the next

  const handleSpin = () => {
    if (isSpinning) return

    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current)
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current)

    setIsSpinning(true)
    setWinner(null)
    setEnableTransition(false)
    setTransformStyle("translateX(0px)")

    const list = Array.from({ length: TOTAL_ITEMS }, () => getRandomItem())
    setGeneratedItems(list)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!containerRef.current || !containerRef.current.parentElement) return

        const parentWidth = containerRef.current.parentElement.offsetWidth
        const itemOffset = WINNING_INDEX * STEP
        const margin = 12
        const innerItemRandomPadding =
          margin + Math.random() * (ITEM_WIDTH - margin * 2)

        const centerPadding = parentWidth / 2
        const finalTranslateX =
          itemOffset - centerPadding + innerItemRandomPadding

        setEnableTransition(true)
        setTransformStyle(`translateX(-${finalTranslateX}px)`)
      })
    })

    finishTimeoutRef.current = setTimeout(() => {
      setIsSpinning(false)
      setWinner(list[WINNING_INDEX - 1])
    }, SPIN_DURATION_MS)
  }

  return (
    <div className="flex w-full flex-col items-center gap-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 pt-16 text-white">
      <div className="relative flex h-32 w-full max-w-4xl items-center overflow-hidden border-2 border-primary bg-primary/30 shadow-inner sm:h-40">
        <div className="absolute top-0 bottom-0 left-1/2 z-10 w-1 bg-secondary shadow-secondary" />

        <div
          ref={containerRef}
          className="flex gap-2 px-[50%]"
          style={{
            transform: transformStyle,
            transition: enableTransition
              ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.1, 0.6, 0.1, 1)`
              : "none",
          }}
        >
          {generatedItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex h-24 w-24 shrink-0 flex-col items-center justify-between rounded border-b-4 p-2 sm:h-28 sm:w-28 ${RARITIES[item.rarity].bg} ${RARITIES[item.rarity].border} shadow-md backdrop-blur-sm`}
            >
              <span className="self-start font-mono text-[10px] text-slate-400">
                #{idx + 1}
              </span>
              <p className="w-full truncate pb-8 text-center text-[10px]">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      <button
        className={`cursor-pointer rounded-lg border px-8 py-3 text-lg font-bold tracking-wider text-white uppercase transition-all duration-200 ${
          isSpinning
            ? "cursor-not-allowed border-primary bg-primary text-slate-500"
            : "border-primary bg-primary text-slate-950 shadow-lg shadow-primary-500/20 hover:bg-primary/50 active:scale-95"
        }`}
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
      {winner && !isSpinning && (
        <div
          className={`mt-2 flex max-w-sm animate-bounce flex-col items-center rounded-lg p-4 text-center ${RARITIES[winner.rarity].bg}`}
        >
          <p className="text-sm font-semibold tracking-widest text-yellow-400 uppercase">
            Du Fikk
          </p>
          <h2 className="mt-1 text-xl font-bold">{winner.name}</h2>
          <span
            className={`mt-2 rounded-full px-3 py-1 text-xs font-bold ${RARITIES[winner.rarity].bg}`}
          >
            {RARITIES[winner.rarity].name}
          </span>
          <Button
            className="mt-3"
            render={<Link href={`/grupper/${winner.slug}`} />}
          >
            MELD DEG INN HER
          </Button>
        </div>
      )}
    </div>
  )
}

export function ValgomatenInfobox({
  groups,
}: {
  groups: StudentGroupSummary[]
}) {
  const t = useTranslations("GroupsPage")
  const [clicked, setClicked] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)

  const handleClick = () => {
    if (clicked) return
    posthog.capture("valgomaten_clicked")
    setClicked(true)
  }

  const handleCameraActiveChange = useCallback((active: boolean) => {
    setCameraActive(active)
  }, [])

  const handleClose = () => {
    setClicked(false)
    setCameraActive(false)
  }

  return (
    <aside
      className={cn(
        "space-y-4 border-2 border-primary/40 bg-primary/5 p-5",
        clicked && cameraActive ? "lg:w-[min(46rem,92vw)]" : "lg:w-80",
      )}
    >
      {!clicked ? (
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
          <Button onClick={handleClick} type="button" variant="default">
            {t("quizButton")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="font-heading text-lg leading-tight text-foreground">
              {t("quizTitle")}
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
          <div className="h-[min(70vh,38rem)] min-h-96 w-full overflow-hidden rounded-lg">
            <SortingHatDemo onActiveChange={handleCameraActiveChange}>
              <GroupUnboxing groups={groups} />
            </SortingHatDemo>
          </div>
        </div>
      )}
    </aside>
  )
}
