"use client"

import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

type Game = "chess" | "catan"
type BoardGame = {
    id: number
    game: Game
    room: string
    maxPlayers: number
    searchingFor: number
    created_at: string
}

export default async function BoardGame() {
    //const supabase = createClient()
    const extractedInfo = { game: "chess", instance: 1 }

    const supabase = createClient()

    const { data, error } = await supabase
        .from("open_board_games")
        .select("*")
        .single()

    if (error || data) {
    }

    const gamesCreated = false

    return (
        <div>
            <Input value={"Stjernesalen"}></Input>
            {gamesCreated && <p>Invite expires in {}</p>}
        </div>
    )
}
