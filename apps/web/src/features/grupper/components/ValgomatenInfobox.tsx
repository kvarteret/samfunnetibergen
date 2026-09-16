"use client"

import { HelpCircle, X } from "lucide-react"
import posthog from "posthog-js"
import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { SortingHatDemo } from "./SortingHatDemo"

const RARITIES = {
  Common: {
    name: "Ordinær",
    bg: "bg-blue-600",
    border: "border-blue-800",
    weight: 50,
  },
  Uncommon: {
    name: "Uvanlig",
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
}

const ITEM_POOL: Item[] = [
  { id: 1, name: "Stjernesalen", rarity: "Common" },
  { id: 2, name: "Kraft etaten", rarity: "Common" },
  { id: 3, name: "Kjøkkenet", rarity: "Uncommon" },
  { id: 4, name: "PR-gruppen", rarity: "Uncommon" },
  { id: 5, name: "Skjenkegruppen", rarity: "Uncommon" },
  { id: 6, name: "Quizgruppen", rarity: "Rare" },
  { id: 7, name: "Sosial departamanget", rarity: "Legendary" },
  { id: 8, name: "E-tjenesten", rarity: "Mythic" },
]

const WINNING_INDEX = 40
const TOTAL_ITEMS = 50
const SPIN_DURATION_MS = 7000

function GroupUnboxing() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [generatedItems, setGeneratedItems] = useState<Item[]>([])
  const [winner, setWinner] = useState<Item | null>(null)
  const [transformStyle, setTransformStyle] = useState("translateX(0px)")
  const [enableTransition, setEnableTransition] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    const filteredPool = ITEM_POOL.filter(item => item.rarity === chosenRarity)
    const finalPool = filteredPool.length ? filteredPool : ITEM_POOL
    return finalPool[Math.floor(Math.random() * finalPool.length)]
  }

  const handleSpin = () => {
    if (isSpinning) return

    // Clear any pending timeouts from a previous spin.
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current)
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current)

    setIsSpinning(true)
    setWinner(null)

    // Step 1: snap the strip back to the start with no transition.
    setEnableTransition(false)
    setTransformStyle("translateX(0px)")

    const list = Array.from({ length: TOTAL_ITEMS }, () => getRandomItem())
    setGeneratedItems(list)

    // Step 2: on the next frame(s), turn the transition back on and set
    // the target transform so the browser animates from 0 -> target,
    // exactly like the first spin.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!containerRef.current || !containerRef.current.parentElement) return

        const parentWidth = containerRef.current.parentElement.offsetWidth
        const itemOffset = WINNING_INDEX * 128

        const innerItemRandomPadding = Math.floor(Math.random() * 60) + 30
        const centerPadding = parentWidth / 2

        const finalTranslateX =
          itemOffset - centerPadding + innerItemRandomPadding

        setEnableTransition(true)
        setTransformStyle(`translateX(-${finalTranslateX}px)`)
      })
    })

    finishTimeoutRef.current = setTimeout(() => {
      setIsSpinning(false)
      setWinner(list[WINNING_INDEX])
    }, SPIN_DURATION_MS)
  }

  return (
    <div className="flex flex-col items-center justify-center text-white p-4">
      <div className="relative w-full max-w-4xl h-40 bg-primary/30 border-2 border-primary overflow-hidden flex items-center shadow-inner">
        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-secondary z-10 shadow-secondary" />

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
              className={`w-28 h-28 shrink-0 flex flex-col justify-between items-center p-2 rounded border-b-4 ${RARITIES[item.rarity].bg} ${RARITIES[item.rarity].border} bg-opacity-20 shadow-md backdrop-blur-sm`}
            >
              <span className="text-[10px] text-slate-400 self-start font-mono">
                #{idx + 1}
              </span>
              <p className="text-[10px] text-center font truncate w-full pb-8">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSpin}
        disabled={isSpinning}
        className={`mt-8 px-8 py-3 text-lg font-bold rounded-lg border uppercase text-white tracking-wider transition-all duration-200 cursor-pointer ${
          isSpinning
            ? "bg-primary border-primary text-slate-500 cursor-not-allowed"
            : "bg-primary border-primary text-slate-950 hover:bg-primary/50 active:scale-95 shadow-lg shadow-primary-500/20"
        }`}
      >
        {isSpinning
          ? "Åpner..."
          : generatedItems.length === 0
            ? "RULL"
            : "RULL PÅ NYTT"}
      </button>
      {winner && !isSpinning && (
        <div
          className={`mt-8 animate-bounce p-4 ${RARITIES[winner.rarity].bg} rounded-lg flex flex-col items-center max-w-sm text-center`}
        >
          <p className="text-sm font-semibold tracking-widest text-yellow-400 uppercase">
            Du Fikk
          </p>
          <h2 className="text-xl font-bold mt-1">{winner.name}</h2>
          <span
            className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${RARITIES[winner.rarity].bg}`}
          >
            {RARITIES[winner.rarity].name}
          </span>
        </div>
      )}
    </div>
  )
}

export function ValgomatenInfobox() {
  const t = useTranslations("GroupsPage")
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    if (clicked) return
    posthog.capture("valgomaten_clicked")
    setClicked(true)
  }

  return (
    <aside className="space-y-4 border-2 border-primary/40 bg-primary/5 p-5">
      {!clicked ? (
        <div className="p-4 flex flex-col gap-4">
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
              className="rounded-full p-1 text-foreground hover:bg-primary/10 focus-brutal"
              onClick={() => setClicked(false)}
              type="button"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="h-[min(70vh,38rem)] min-h-96 w-full">
            <SortingHatDemo />
          </div>
          <GroupUnboxing />
        </div>
      )}
    </aside>
  )
}
