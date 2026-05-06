"use client"

import { useState } from "react"

export default function ExpandableText({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="flex flex-col">
            <div
                className={`relative overflow-hidden transition-[max-height] duration-500 ${
                    expanded ? "max-h-96" : "max-h-48"
                }`}
            >
                <p className="whitespace-pre-wrap text-xs md:text-sm lg:text-base">
                    {text}
                </p>
                {!expanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
                )}
            </div>
            <button
                onClick={() => setExpanded((prev) => !prev)}
                className={`self-start border border-black px-2 mx-auto w-16 py-0.5 text-xs font-mono uppercase hover:bg-black hover:text-white cursor-pointer ${
                    expanded ? "mt-2" : "relative z-10 -mt-6"
                }`}
            >
                {expanded ? "—" : "+"}
            </button>
        </div>
    )
}
