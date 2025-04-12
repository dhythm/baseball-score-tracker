import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayerStatsSummary } from "@/components/player-stats-summary"
import type { GameState } from "@/components/baseball-score-tracker"

interface ScoreBoardProps {
  gameState: GameState
}

export function ScoreBoard({ gameState }: ScoreBoardProps) {
  const { homeTeam, awayTeam, maxInnings } = gameState

  const getTotalScore = (scores: number[]) => {
    return scores.reduce((sum, score) => sum + score, 0)
  }

  return (
    <Tabs defaultValue="scoreboard" className="w-full">
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="scoreboard">スコアボード</TabsTrigger>
        <TabsTrigger value="away-stats">アウェイ成績</TabsTrigger>
        <TabsTrigger value="home-stats">ホーム成績</TabsTrigger>
      </TabsList>

      <TabsContent value="scoreboard">
        <Card className="overflow-x-auto">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">チーム</TableHead>
                  {Array.from({ length: maxInnings }).map((_, i) => (
                    <TableHead key={i} className="text-center w-10">
                      {i + 1}
                    </TableHead>
                  ))}
                  <TableHead className="text-center w-10">R</TableHead>
                  <TableHead className="text-center w-10">H</TableHead>
                  <TableHead className="text-center w-10">E</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{awayTeam.name}</TableCell>
                  {awayTeam.scores.map((score, i) => (
                    <TableCell key={i} className="text-center">
                      {score}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold">{getTotalScore(awayTeam.scores)}</TableCell>
                  <TableCell className="text-center">{awayTeam.hits}</TableCell>
                  <TableCell className="text-center">{awayTeam.errors}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{homeTeam.name}</TableCell>
                  {homeTeam.scores.map((score, i) => (
                    <TableCell key={i} className="text-center">
                      {score}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold">{getTotalScore(homeTeam.scores)}</TableCell>
                  <TableCell className="text-center">{homeTeam.hits}</TableCell>
                  <TableCell className="text-center">{homeTeam.errors}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="away-stats">
        <PlayerStatsSummary team={awayTeam} />
      </TabsContent>

      <TabsContent value="home-stats">
        <PlayerStatsSummary team={homeTeam} />
      </TabsContent>
    </Tabs>
  )
}
