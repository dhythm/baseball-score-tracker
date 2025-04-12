"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Team } from "@/components/baseball-score-tracker"

interface TeamInputProps {
  label: string
  team: Team
  currentInning: number
  onScoreChange: (score: number) => void
  onHitsChange: (hits: number) => void
  onErrorsChange: (errors: number) => void
  isActive: boolean
}

export function TeamInput({
  label,
  team,
  currentInning,
  onScoreChange,
  onHitsChange,
  onErrorsChange,
  isActive,
}: TeamInputProps) {
  return (
    <Card className={isActive ? "border-2 border-primary" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${label}-score`}>{currentInning}回の得点</Label>
          <Input
            id={`${label}-score`}
            type="number"
            min={0}
            value={team.scores[currentInning - 1]}
            onChange={(e) => onScoreChange(Number.parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${label}-hits`}>安打数</Label>
            <Input
              id={`${label}-hits`}
              type="number"
              min={0}
              value={team.hits}
              onChange={(e) => onHitsChange(Number.parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${label}-errors`}>エラー数</Label>
            <Input
              id={`${label}-errors`}
              type="number"
              min={0}
              value={team.errors}
              onChange={(e) => onErrorsChange(Number.parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
