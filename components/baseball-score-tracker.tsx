"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScoreBoard } from "@/components/score-board"
import { TeamInput } from "@/components/team-input"
import { BulkEditDialog } from "@/components/bulk-edit-dialog"
import { PlayerAtBats } from "@/components/player-at-bats"

export type AtBatResult = {
  id: string
  inning: number
  isBottomInning: boolean
  result: string
  notes?: string
  timestamp: number
}

export type Player = {
  id: string
  name: string
  number: string
  position: string
  atBats: AtBatResult[]
}

export type Team = {
  name: string
  scores: number[]
  hits: number
  errors: number
  players: Player[]
}

export type GameState = {
  homeTeam: Team
  awayTeam: Team
  currentInning: number
  isBottomInning: boolean
  maxInnings: number
}

const createEmptyPlayer = (id: string): Player => ({
  id,
  name: "",
  number: "",
  position: "",
  atBats: [],
})

const initialGameState: GameState = {
  homeTeam: {
    name: "ホームチーム",
    scores: Array(9).fill(0),
    hits: 0,
    errors: 0,
    players: Array(9)
      .fill(0)
      .map((_, i) => createEmptyPlayer(`home-${i}`)),
  },
  awayTeam: {
    name: "アウェイチーム",
    scores: Array(9).fill(0),
    hits: 0,
    errors: 0,
    players: Array(9)
      .fill(0)
      .map((_, i) => createEmptyPlayer(`away-${i}`)),
  },
  currentInning: 1,
  isBottomInning: false,
  maxInnings: 9,
}

export function BaseballScoreTracker() {
  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("input")

  const updateTeamName = (team: "homeTeam" | "awayTeam", name: string) => {
    setGameState((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        name,
      },
    }))
  }

  const updateScore = (team: "homeTeam" | "awayTeam", inning: number, score: number) => {
    setGameState((prev) => {
      const newScores = [...prev[team].scores]
      newScores[inning - 1] = score
      return {
        ...prev,
        [team]: {
          ...prev[team],
          scores: newScores,
        },
      }
    })
  }

  const updateHits = (team: "homeTeam" | "awayTeam", hits: number) => {
    setGameState((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        hits,
      },
    }))
  }

  const updateErrors = (team: "homeTeam" | "awayTeam", errors: number) => {
    setGameState((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        errors,
      },
    }))
  }

  const updatePlayerInfo = (
    team: "homeTeam" | "awayTeam",
    playerId: string,
    updates: Partial<Omit<Player, "atBats">>,
  ) => {
    setGameState((prev) => {
      const players = [...prev[team].players]
      const playerIndex = players.findIndex((p) => p.id === playerId)

      if (playerIndex !== -1) {
        players[playerIndex] = { ...players[playerIndex], ...updates }
      }

      return {
        ...prev,
        [team]: {
          ...prev[team],
          players,
        },
      }
    })
  }

  const addAtBatResult = (team: "homeTeam" | "awayTeam", playerId: string, result: string, notes?: string) => {
    setGameState((prev) => {
      const players = [...prev[team].players]
      const playerIndex = players.findIndex((p) => p.id === playerId)

      if (playerIndex !== -1) {
        const newAtBat: AtBatResult = {
          id: `${playerId}-${Date.now()}`,
          inning: prev.currentInning,
          isBottomInning: prev.isBottomInning,
          result,
          notes,
          timestamp: Date.now(),
        }

        const updatedPlayer = {
          ...players[playerIndex],
          atBats: [...players[playerIndex].atBats, newAtBat],
        }

        players[playerIndex] = updatedPlayer

        // Automatically update team hits if the result is a hit type
        let newHits = prev[team].hits
        if (result === "ヒット" || result === "二塁打" || result === "三塁打" || result === "ホームラン") {
          newHits += 1
        }

        return {
          ...prev,
          [team]: {
            ...prev[team],
            players,
            hits: newHits,
          },
        }
      }

      return prev
    })
  }

  const removeAtBatResult = (team: "homeTeam" | "awayTeam", playerId: string, atBatId: string) => {
    setGameState((prev) => {
      const players = [...prev[team].players]
      const playerIndex = players.findIndex((p) => p.id === playerId)

      if (playerIndex !== -1) {
        const player = players[playerIndex]
        const atBatIndex = player.atBats.findIndex((ab) => ab.id === atBatId)

        if (atBatIndex !== -1) {
          const atBat = player.atBats[atBatIndex]
          const newAtBats = [...player.atBats]
          newAtBats.splice(atBatIndex, 1)

          // Adjust team hits if removing a hit type
          let newHits = prev[team].hits
          if (
            atBat.result === "ヒット" ||
            atBat.result === "二塁打" ||
            atBat.result === "三塁打" ||
            atBat.result === "ホームラン"
          ) {
            newHits = Math.max(0, newHits - 1)
          }

          players[playerIndex] = {
            ...player,
            atBats: newAtBats,
          }

          return {
            ...prev,
            [team]: {
              ...prev[team],
              players,
              hits: newHits,
            },
          }
        }
      }

      return prev
    })
  }

  const addPlayer = (team: "homeTeam" | "awayTeam") => {
    setGameState((prev) => {
      const newPlayerId = `${team}-${Date.now()}`
      return {
        ...prev,
        [team]: {
          ...prev[team],
          players: [...prev[team].players, createEmptyPlayer(newPlayerId)],
        },
      }
    })
  }

  const removePlayer = (team: "homeTeam" | "awayTeam", playerId: string) => {
    setGameState((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        players: prev[team].players.filter((p) => p.id !== playerId),
      },
    }))
  }

  const advanceInning = () => {
    setGameState((prev) => {
      if (prev.isBottomInning) {
        return {
          ...prev,
          currentInning: prev.currentInning + 1,
          isBottomInning: false,
        }
      } else {
        return {
          ...prev,
          isBottomInning: true,
        }
      }
    })
  }

  const resetGame = () => {
    setGameState(initialGameState)
  }

  const updateGameState = (newState: Partial<GameState>) => {
    setGameState((prev) => ({
      ...prev,
      ...newState,
    }))
  }

  const getCurrentTeam = () => {
    return gameState.isBottomInning ? "homeTeam" : "awayTeam"
  }

  return (
    <div className="space-y-6">
      <ScoreBoard gameState={gameState} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="input">スコア入力</TabsTrigger>
          <TabsTrigger value="players">選手成績</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>
                  {gameState.currentInning}回{gameState.isBottomInning ? "裏" : "表"}
                </span>
                <div className="flex gap-2">
                  <Button onClick={advanceInning} size="sm">
                    次の回へ
                  </Button>
                  <Button onClick={() => setIsBulkEditOpen(true)} variant="outline" size="sm">
                    一括編集
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <TeamInput
                  label="アウェイチーム"
                  team={gameState.awayTeam}
                  currentInning={gameState.currentInning}
                  onScoreChange={(score) => updateScore("awayTeam", gameState.currentInning, score)}
                  onHitsChange={(hits) => updateHits("awayTeam", hits)}
                  onErrorsChange={(errors) => updateErrors("awayTeam", errors)}
                  isActive={!gameState.isBottomInning}
                />

                <TeamInput
                  label="ホームチーム"
                  team={gameState.homeTeam}
                  currentInning={gameState.currentInning}
                  onScoreChange={(score) => updateScore("homeTeam", gameState.currentInning, score)}
                  onHitsChange={(hits) => updateHits("homeTeam", hits)}
                  onErrorsChange={(errors) => updateErrors("homeTeam", errors)}
                  isActive={gameState.isBottomInning}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <Tabs defaultValue="away" className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="away">{gameState.awayTeam.name}</TabsTrigger>
              <TabsTrigger value="home">{gameState.homeTeam.name}</TabsTrigger>
            </TabsList>

            <TabsContent value="away" className="pt-4">
              <PlayerAtBats
                team={gameState.awayTeam}
                currentInning={gameState.currentInning}
                isBottomInning={gameState.isBottomInning}
                onPlayerInfoUpdate={(playerId, updates) => updatePlayerInfo("awayTeam", playerId, updates)}
                onAddAtBat={(playerId, result, notes) => addAtBatResult("awayTeam", playerId, result, notes)}
                onRemoveAtBat={(playerId, atBatId) => removeAtBatResult("awayTeam", playerId, atBatId)}
                onAddPlayer={() => addPlayer("awayTeam")}
                onRemovePlayer={(playerId) => removePlayer("awayTeam", playerId)}
                isActive={!gameState.isBottomInning}
              />
            </TabsContent>

            <TabsContent value="home" className="pt-4">
              <PlayerAtBats
                team={gameState.homeTeam}
                currentInning={gameState.currentInning}
                isBottomInning={gameState.isBottomInning}
                onPlayerInfoUpdate={(playerId, updates) => updatePlayerInfo("homeTeam", playerId, updates)}
                onAddAtBat={(playerId, result, notes) => addAtBatResult("homeTeam", playerId, result, notes)}
                onRemoveAtBat={(playerId, atBatId) => removeAtBatResult("homeTeam", playerId, atBatId)}
                onAddPlayer={() => addPlayer("homeTeam")}
                onRemovePlayer={(playerId) => removePlayer("homeTeam", playerId)}
                isActive={gameState.isBottomInning}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>試合設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="home-team">ホームチーム名</Label>
                  <Input
                    id="home-team"
                    value={gameState.homeTeam.name}
                    onChange={(e) => updateTeamName("homeTeam", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="away-team">アウェイチーム名</Label>
                  <Input
                    id="away-team"
                    value={gameState.awayTeam.name}
                    onChange={(e) => updateTeamName("awayTeam", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="innings">イニング数</Label>
                <Input
                  id="innings"
                  type="number"
                  min={1}
                  max={15}
                  value={gameState.maxInnings}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value)
                    if (value >= 1 && value <= 15) {
                      setGameState((prev) => {
                        const homeScores = [...prev.homeTeam.scores]
                        const awayScores = [...prev.awayTeam.scores]

                        // Resize arrays if needed
                        while (homeScores.length < value) homeScores.push(0)
                        while (awayScores.length < value) awayScores.push(0)

                        return {
                          ...prev,
                          maxInnings: value,
                          homeTeam: {
                            ...prev.homeTeam,
                            scores: homeScores.slice(0, value),
                          },
                          awayTeam: {
                            ...prev.awayTeam,
                            scores: awayScores.slice(0, value),
                          },
                        }
                      })
                    }
                  }}
                />
              </div>

              <Button onClick={resetGame} variant="destructive" className="w-full">
                ゲームをリセット
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BulkEditDialog
        open={isBulkEditOpen}
        onOpenChange={setIsBulkEditOpen}
        gameState={gameState}
        onUpdate={updateGameState}
      />
    </div>
  )
}
