"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus, ChevronDown, ChevronUp, PlusCircle } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Player, Team } from "@/components/baseball-score-tracker"

interface PlayerAtBatsProps {
  team: Team
  currentInning: number
  isBottomInning: boolean
  onPlayerInfoUpdate: (playerId: string, updates: Partial<Omit<Player, "atBats">>) => void
  onAddAtBat: (playerId: string, result: string, notes?: string) => void
  onRemoveAtBat: (playerId: string, atBatId: string) => void
  onAddPlayer: () => void
  onRemovePlayer: (playerId: string) => void
  isActive: boolean
}

const AT_BAT_RESULTS = [
  "ヒット",
  "二塁打",
  "三塁打",
  "ホームラン",
  "三振",
  "四球",
  "死球",
  "犠打",
  "犠飛",
  "ゴロ",
  "フライ",
  "ライナー",
  "併殺打",
  "内野安打",
  "エラー",
  "野選",
  "振り逃げ",
]

export function PlayerAtBats({
  team,
  currentInning,
  isBottomInning,
  onPlayerInfoUpdate,
  onAddAtBat,
  onRemoveAtBat,
  onAddPlayer,
  onRemovePlayer,
  isActive,
}: PlayerAtBatsProps) {
  const [expandedPlayers, setExpandedPlayers] = useState<Record<string, boolean>>({})
  const [newAtBatData, setNewAtBatData] = useState<Record<string, { result: string; notes: string }>>({})

  const togglePlayerExpanded = (playerId: string) => {
    setExpandedPlayers((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }))
  }

  const initNewAtBat = (playerId: string) => {
    if (!newAtBatData[playerId]) {
      setNewAtBatData((prev) => ({
        ...prev,
        [playerId]: { result: "ヒット", notes: "" },
      }))
    }
  }

  const updateNewAtBatResult = (playerId: string, result: string) => {
    setNewAtBatData((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], result },
    }))
  }

  const updateNewAtBatNotes = (playerId: string, notes: string) => {
    setNewAtBatData((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], notes },
    }))
  }

  const handleAddAtBat = (playerId: string) => {
    const data = newAtBatData[playerId]
    if (data) {
      onAddAtBat(playerId, data.result, data.notes || undefined)
      // Reset the form
      setNewAtBatData((prev) => ({
        ...prev,
        [playerId]: { result: "ヒット", notes: "" },
      }))
    }
  }

  const getResultBadgeColor = (result: string) => {
    if (result === "ヒット" || result === "内野安打") return "bg-green-500"
    if (result === "二塁打") return "bg-blue-500"
    if (result === "三塁打") return "bg-purple-500"
    if (result === "ホームラン") return "bg-red-500"
    if (result === "三振") return "bg-gray-500"
    if (result === "四球" || result === "死球") return "bg-yellow-500"
    if (result === "エラー" || result === "野選") return "bg-orange-500"
    return "bg-gray-400"
  }

  const formatInning = (inning: number, isBottom: boolean) => {
    return `${inning}回${isBottom ? "裏" : "表"}`
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{team.name}の選手成績</h3>
        <Button onClick={onAddPlayer} size="sm">
          <Plus className="w-4 h-4 mr-1" /> 選手を追加
        </Button>
      </div>

      <div className="space-y-6">
        {team.players.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">選手が登録されていません</div>
        ) : (
          team.players.map((player) => (
            <Card key={player.id} className={isActive ? "border-2 border-primary" : ""}>
              <Collapsible
                open={expandedPlayers[player.id]}
                onOpenChange={() => togglePlayerExpanded(player.id)}
                className="w-full"
              >
                <div className="flex items-center p-4 gap-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                      {expandedPlayers[player.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <Input
                      value={player.number}
                      onChange={(e) => onPlayerInfoUpdate(player.id, { number: e.target.value })}
                      className="w-16 h-8"
                      placeholder="#"
                    />
                    <Input
                      value={player.name}
                      onChange={(e) => onPlayerInfoUpdate(player.id, { name: e.target.value })}
                      className="h-8"
                      placeholder="選手名"
                    />
                    <Input
                      value={player.position}
                      onChange={(e) => onPlayerInfoUpdate(player.id, { position: e.target.value })}
                      className="w-full h-8"
                      placeholder="ポジション"
                    />
                  </div>

                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemovePlayer(player.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <CollapsibleContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Select
                          value={newAtBatData[player.id]?.result || "ヒット"}
                          onValueChange={(value) => updateNewAtBatResult(player.id, value)}
                          onOpenChange={() => initNewAtBat(player.id)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="打席結果を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {AT_BAT_RESULTS.map((result) => (
                              <SelectItem key={result} value={result}>
                                {result}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-1">
                        <Button
                          className="w-full"
                          onClick={() => handleAddAtBat(player.id)}
                          disabled={!newAtBatData[player.id]?.result}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" /> 打席追加
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`${player.id}-notes`}>メモ</Label>
                      <Textarea
                        id={`${player.id}-notes`}
                        value={newAtBatData[player.id]?.notes || ""}
                        onChange={(e) => updateNewAtBatNotes(player.id, e.target.value)}
                        placeholder="詳細情報（任意）"
                        className="h-20"
                        onClick={() => initNewAtBat(player.id)}
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">打席履歴</h4>
                      {player.atBats.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">打席記録がありません</div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {[...player.atBats].reverse().map((atBat) => (
                            <div key={atBat.id} className="flex items-start gap-2 p-2 border rounded-md">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatInning(atBat.inning, atBat.isBottomInning)}
                                  </span>
                                  <Badge className={`${getResultBadgeColor(atBat.result)}`}>{atBat.result}</Badge>
                                </div>
                                {atBat.notes && <p className="text-sm mt-1 text-muted-foreground">{atBat.notes}</p>}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onRemoveAtBat(player.id, atBat.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
