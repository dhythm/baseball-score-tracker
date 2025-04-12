import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Team } from "@/components/baseball-score-tracker"

interface PlayerStatsSummaryProps {
  team: Team
}

export function PlayerStatsSummary({ team }: PlayerStatsSummaryProps) {
  // Count at-bat results for each player
  const playerStats = team.players
    .map((player) => {
      const stats = {
        name: player.name || "名前なし",
        number: player.number,
        position: player.position,
        hits: 0,
        homeRuns: 0,
        strikeouts: 0,
        walks: 0,
        totalAtBats: player.atBats.length,
      }

      player.atBats.forEach((atBat) => {
        if (
          atBat.result === "ヒット" ||
          atBat.result === "内野安打" ||
          atBat.result === "二塁打" ||
          atBat.result === "三塁打"
        ) {
          stats.hits++
        }
        if (atBat.result === "ホームラン") {
          stats.hits++
          stats.homeRuns++
        }
        if (atBat.result === "三振") {
          stats.strikeouts++
        }
        if (atBat.result === "四球" || atBat.result === "死球") {
          stats.walks++
        }
      })

      return stats
    })
    .filter((stats) => stats.name !== "名前なし" && stats.totalAtBats > 0)

  // Sort by total at-bats
  playerStats.sort((a, b) => b.totalAtBats - a.totalAtBats)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{team.name}の選手成績</CardTitle>
      </CardHeader>
      <CardContent>
        {playerStats.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">選手成績がありません</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>選手名</TableHead>
                <TableHead className="text-center">打席数</TableHead>
                <TableHead className="text-center">安打</TableHead>
                <TableHead className="text-center">本塁打</TableHead>
                <TableHead className="text-center">三振</TableHead>
                <TableHead className="text-center">四死球</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerStats.map((stats, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {stats.number ? `${stats.number} ` : ""}
                    {stats.name}
                    {stats.position && <span className="ml-1 text-muted-foreground">({stats.position})</span>}
                  </TableCell>
                  <TableCell className="text-center">{stats.totalAtBats}</TableCell>
                  <TableCell className="text-center">{stats.hits}</TableCell>
                  <TableCell className="text-center">{stats.homeRuns}</TableCell>
                  <TableCell className="text-center">{stats.strikeouts}</TableCell>
                  <TableCell className="text-center">{stats.walks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
