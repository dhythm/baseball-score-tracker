"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { GameState } from "@/components/baseball-score-tracker"

interface BulkEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameState: GameState
  onUpdate: (newState: Partial<GameState>) => void
}

export function BulkEditDialog({ open, onOpenChange, gameState, onUpdate }: BulkEditDialogProps) {
  const [editState, setEditState] = useState<GameState>({ ...gameState })

  const handleSave = () => {
    onUpdate(editState)
    onOpenChange(false)
  }

  const updateScore = (team: "homeTeam" | "awayTeam", inning: number, score: string) => {
    const scoreValue = Number.parseInt(score) || 0
    setEditState((prev) => {
      const newScores = [...prev[team].scores]
      newScores[inning - 1] = scoreValue
      return {
        ...prev,
        [team]: {
          ...prev[team],
          scores: newScores,
        },
      }
    })
  }

  const updateTeamStat = (team: "homeTeam" | "awayTeam", stat: "hits" | "errors", value: string) => {
    const numValue = Number.parseInt(value) || 0
    setEditState((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        [stat]: numValue,
      },
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>スコア一括編集</DialogTitle>
          <DialogDescription>各イニングのスコアを一括で編集できます。</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="away" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="away">{editState.awayTeam.name}</TabsTrigger>
            <TabsTrigger value="home">{editState.homeTeam.name}</TabsTrigger>
          </TabsList>

          <TabsContent value="away" className="space-y-4 pt-4">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
              {Array.from({ length: editState.maxInnings }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Label htmlFor={`away-inning-${i + 1}`}>{i + 1}回</Label>
                  <Input
                    id={`away-inning-${i + 1}`}
                    type="number"
                    min={0}
                    value={editState.awayTeam.scores[i]}
                    onChange={(e) => updateScore("awayTeam", i + 1, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="away-hits">安打数</Label>
                <Input
                  id="away-hits"
                  type="number"
                  min={0}
                  value={editState.awayTeam.hits}
                  onChange={(e) => updateTeamStat("awayTeam", "hits", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="away-errors">エラー数</Label>
                <Input
                  id="away-errors"
                  type="number"
                  min={0}
                  value={editState.awayTeam.errors}
                  onChange={(e) => updateTeamStat("awayTeam", "errors", e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="home" className="space-y-4 pt-4">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
              {Array.from({ length: editState.maxInnings }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Label htmlFor={`home-inning-${i + 1}`}>{i + 1}回</Label>
                  <Input
                    id={`home-inning-${i + 1}`}
                    type="number"
                    min={0}
                    value={editState.homeTeam.scores[i]}
                    onChange={(e) => updateScore("homeTeam", i + 1, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="home-hits">安打数</Label>
                <Input
                  id="home-hits"
                  type="number"
                  min={0}
                  value={editState.homeTeam.hits}
                  onChange={(e) => updateTeamStat("homeTeam", "hits", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="home-errors">エラー数</Label>
                <Input
                  id="home-errors"
                  type="number"
                  min={0}
                  value={editState.homeTeam.errors}
                  onChange={(e) => updateTeamStat("homeTeam", "errors", e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
