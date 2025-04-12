"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Player, Team } from "@/components/baseball-score-tracker"

interface PlayerStatsProps {
  team: Team
  onPlayerUpdate: (playerId: string, updates: Partial<Player>) => void
  onAddPlayer: () => void
  onRemovePlayer: (playerId: string) => void
}

export function PlayerStats({ team, onPlayerUpdate, onAddPlayer, onRemovePlayer }: PlayerStatsProps) {
  const [expandedPlayers, setExpandedPlayers] = useState<Record<string, boolean>>({})

  const togglePlayerExpanded = (playerId: string) => {
    setExpandedPlayers((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }))
  }

  const calculateBattingAverage = (player: Player) => {
    if (player.atBats === 0) return ".000"
    const avg = player.hits / player.atBats
    return avg.toFixed(3).replace(/^0+/, "")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{team.name}の選手成績</h3>
        <Button onClick={onAddPlayer} size="sm">
          <Plus className="w-4 h-4 mr-1" /> 選手を追加
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>背番号</TableHead>
              <TableHead>名前</TableHead>
              <TableHead>ポジション</TableHead>
              <TableHead className="text-center">打数</TableHead>
              <TableHead className="text-center">安打</TableHead>
              <TableHead className="text-center">打率</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.players.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  選手が登録されていません
                </TableCell>
              </TableRow>
            ) : (
              team.players.map((player) => (
                <Collapsible
                  key={player.id}
                  open={expandedPlayers[player.id]}
                  onOpenChange={() => togglePlayerExpanded(player.id)}
                  className="w-full"
                >
                  <TableRow>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          {expandedPlayers[player.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={player.number}
                        onChange={(e) => onPlayerUpdate(player.id, { number: e.target.value })}
                        className="w-16 h-8"
                        placeholder="#"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={player.name}
                        onChange={(e) => onPlayerUpdate(player.id, { name: e.target.value })}
                        className="h-8"
                        placeholder="選手名"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={player.position}
                        onChange={(e) => onPlayerUpdate(player.id, { position: e.target.value })}
                        className="w-20 h-8"
                        placeholder="位置"
                      />
                    </TableCell>
                    <TableCell className="text-center">{player.atBats}</TableCell>
                    <TableCell className="text-center">{player.hits}</TableCell>
                    <TableCell className="text-center">{calculateBattingAverage(player)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemovePlayer(player.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <TableRow>
                      <TableCell colSpan={8} className="p-0 border-t-0">
                        <Card className="border-0 shadow-none">
                          <CardContent className="p-4 pt-0">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`${player.id}-at-bats`}>打数</Label>
                                <Input
                                  id={`${player.id}-at-bats`}
                                  type="number"
                                  min={0}
                                  value={player.atBats}
                                  onChange={(e) =>
                                    onPlayerUpdate(player.id, { atBats: Number.parseInt(e.target.value) || 0 })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`${player.id}-hits`}>安打</Label>
                                <Input
                                  id={`${player.id}-hits`}
                                  type="number"
                                  min={0}
                                  value={player.hits}
                                  onChange={(e) =>
                                    onPlayerUpdate(player.id, { hits: Number.parseInt(e.target.value) || 0 })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`${player.id}-runs`}>得点</Label>
                                <Input
                                  id={`${player.id}-runs`}
                                  type="number"
                                  min={0}
                                  value={player.runs}
                                  onChange={(e) =>
                                    onPlayerUpdate(player.id, { runs: Number.parseInt(e.target.value) || 0 })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`${player.id}-rbis`}>打点</Label>
                                <Input
                                  id={`${player.id}-rbis`}
                                  type="number"
                                  min={0}
                                  value={player.rbis}
                                  onChange={(e) =>
                                    onPlayerUpdate(player.id, { rbis: Number.parseInt(e.target.value) || 0 })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`${player.id}-strikeouts`}>三振</Label>
                                <Input
                                  id={`${player.id}-strikeouts`}
                                  type="number"
                                  min={0}
                                  value={player.strikeouts}
                                  onChange={(e) =>
                                    onPlayerUpdate(player.id, { strikeouts: Number.parseInt(e.target.value) || 0 })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`${player.id}-walks`}>四球</Label>
                                <Input
                                  id={`${player.id}-walks`}
                                  type="number"
                                  min={0}
                                  value={player.walks}
                                  onChange={(e) =>
                                    onPlayerUpdate(player.id, { walks: Number.parseInt(e.target.value) || 0 })
                                  }
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
