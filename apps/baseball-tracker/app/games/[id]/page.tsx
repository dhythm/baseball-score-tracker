"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Storage } from "@packages/storage"

// 型定義
type Player = {
  id: string
  name: string
  number: string
  position: Position[]
  type: "pitcher" | "batter" | "both"
}

type Position = "投手" | "捕手" | "一塁手" | "二塁手" | "三塁手" | "遊撃手" | "外野手"

type Team = {
  id: string
  name: string
  players: Player[]
}

type AtBatResult =
  | "安打"
  | "二塁打"
  | "三塁打"
  | "本塁打"
  | "四球"
  | "死球"
  | "犠打"
  | "犠飛"
  | "失策"
  | "フィールダーチョイス"
  | "三振"
  | "ゴロアウト"
  | "フライアウト"
  | "ライナーアウト"
  | "併殺打"
  | "三重殺"

type BattedBallDirection =
  | "ピッチャー"
  | "キャッチャー"
  | "ファースト"
  | "セカンド"
  | "サード"
  | "ショート"
  | "レフト"
  | "センター"
  | "ライト"

type AtBat = {
  id: string
  batterId: string
  pitcherId: string
  result: AtBatResult
  direction?: BattedBallDirection
  rbi: number
  inning: number
  outs: number
  isTopInning: boolean
  timestamp: number
}

type GameState = {
  id: string
  homeTeamId: string
  awayTeamId: string
  homePitcherId: string
  awayPitcherId: string
  currentInning: number
  isTopInning: boolean
  outs: number
  homeScore: number
  awayScore: number
  atBats: AtBat[]
  startTime: number
  endTime: number | null
  isComplete: boolean
  currentBatterIndex: {
    home: number
    away: number
  }
  lineup: {
    home: {
      playerId: string
      position: string
    }[]
    away: {
      playerId: string
      position: string
    }[]
  }
}

// イニングごとの得点とスタッツを計算するヘルパー関数
const calculateGameStats = (game: GameState) => {
  const defaultInnings = 9
  const maxInning = Math.max(defaultInnings, game.currentInning)
  
  const stats = {
    away: {
      scores: Array(maxInning).fill(0),
      hits: 0,
      errors: 0
    },
    home: {
      scores: Array(maxInning).fill(0),
      hits: 0,
      errors: 0
    }
  }

  game.atBats.forEach(atBat => {
    const team = atBat.isTopInning ? "away" : "home"
    
    // 得点の計算
    if (atBat.result === "本塁打") {
      stats[team].scores[atBat.inning - 1]++
    }

    // ヒット数の計算
    if (["安打", "二塁打", "三塁打", "本塁打"].includes(atBat.result)) {
      stats[team].hits++
    }

    // エラーの計算
    if (atBat.result === "失策") {
      stats[atBat.isTopInning ? "home" : "away"].errors++
    }
  })

  return stats
}

const storage = new Storage()

export default function GameDetailPage() {
  const { id } = useParams()
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [currentGame, setCurrentGame] = useState<GameState | null>(null)
  const [currentResult, setCurrentResult] = useState<AtBatResult | "">("")
  const [currentDirection, setCurrentDirection] = useState<BattedBallDirection | "">("")
  const [currentRbi, setCurrentRbi] = useState<number>(0)

  // ローカルストレージからデータを読み込む
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTeams = storage.getTeams()
      const savedGames = storage.getGames()

      if (savedTeams) {
        setTeams(savedTeams)
      }

      if (savedGames) {
        const game = savedGames.find(g => g.id === id)
        if (game) {
          setCurrentGame(game)
        }
      }
    }
  }, [id])

  // チーム名を取得
  const getTeamName = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    return team ? team.name : "不明なチーム"
  }

  // 選手名を取得
  const getPlayerName = (teamId: string, playerId: string) => {
    const team = teams.find((t) => t.id === teamId)
    if (!team) return "不明な選手"

    const player = team.players.find((p) => p.id === playerId)
    return player ? player.name : "不明な選手"
  }

  // 打席結果を記録
  const recordAtBat = (result: AtBatResult) => {
    if (!currentGame) return

    const isOut = ["三振", "ゴロアウト", "フライアウト", "ライナーアウト", "併殺打", "三重殺"].includes(result)
    const isRun = ["本塁打"].includes(result)

    // 現在の打者を取得
    const currentTeamId = currentGame.isTopInning ? currentGame.awayTeamId : currentGame.homeTeamId
    const currentPitcherId = currentGame.isTopInning ? currentGame.homePitcherId : currentGame.awayPitcherId
    const currentBatter = getCurrentBatter()

    if (!currentBatter) {
      toast({
        title: "エラー",
        description: "打者が登録されていません",
        variant: "destructive",
      })
      return
    }

    // 打席結果を記録
    const newAtBat: AtBat = {
      id: Date.now().toString(),
      batterId: currentBatter.id,
      pitcherId: currentPitcherId,
      result,
      direction: currentDirection || undefined,
      rbi: currentRbi,
      inning: currentGame.currentInning,
      outs: currentGame.outs,
      isTopInning: currentGame.isTopInning,
      timestamp: Date.now(),
    }

    // ゲーム状態を更新
    let newOuts = currentGame.outs
    let newHomeScore = currentGame.homeScore
    let newAwayScore = currentGame.awayScore
    let newIsTopInning = currentGame.isTopInning
    let newInning = currentGame.currentInning
    const newCurrentBatterIndex = { ...currentGame.currentBatterIndex }

    // アウトの処理
    if (isOut) {
      newOuts += 1
    }

    // 得点の処理
    if (isRun) {
      if (currentGame.isTopInning) {
        newAwayScore += 1
      } else {
        newHomeScore += 1
      }
    }

    // 次の打者へ
    if (currentGame.isTopInning) {
      newCurrentBatterIndex.away = (newCurrentBatterIndex.away + 1) % currentGame.lineup.away.length
    } else {
      newCurrentBatterIndex.home = (newCurrentBatterIndex.home + 1) % currentGame.lineup.home.length
    }

    // 3アウトで攻守交代
    if (newOuts >= 3) {
      newOuts = 0
      newIsTopInning = !newIsTopInning

      // 裏の攻撃が終わったら次のイニングへ
      if (!newIsTopInning) {
        newInning += 1
      }
    }

    const updatedGame: GameState = {
      ...currentGame,
      outs: newOuts,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      isTopInning: newIsTopInning,
      currentInning: newInning,
      atBats: [...currentGame.atBats, newAtBat],
      currentBatterIndex: newCurrentBatterIndex,
    }

    // ゲーム一覧を更新
    const savedGames = storage.getGames() || []
    const updatedGames = savedGames.map((game) => (game.id === currentGame.id ? updatedGame : game))

    setCurrentGame(updatedGame)
    storage.setGames(updatedGames)

    // 結果をリセット
    setCurrentResult("")
    setCurrentDirection("")
    setCurrentRbi(0)

    toast({
      title: "記録完了",
      description: `${getPlayerName(currentTeamId, currentBatter.id)}の${result}を記録しました`,
    })
  }

  // 試合を終了
  const endGame = () => {
    if (!currentGame) return

    const updatedGame: GameState = {
      ...currentGame,
      endTime: Date.now(),
      isComplete: true,
    }

    const savedGames = storage.getGames() || []
    const updatedGames = savedGames.map((game) => (game.id === currentGame.id ? updatedGame : game))

    setCurrentGame(updatedGame)
    storage.setGames(updatedGames)

    toast({
      title: "試合終了",
      description: `${getTeamName(currentGame.awayTeamId)} ${currentGame.awayScore} - ${currentGame.homeScore} ${getTeamName(currentGame.homeTeamId)}`,
    })
  }

  // 現在の打者を取得
  const getCurrentBatter = () => {
    if (!currentGame) return null

    const currentTeamId = currentGame.isTopInning ? currentGame.awayTeamId : currentGame.homeTeamId
    const team = teams.find(t => t.id === currentTeamId)
    if (!team) return null

    const lineup = currentGame.isTopInning ? currentGame.lineup.away : currentGame.lineup.home
    const batterIndex = currentGame.isTopInning
      ? currentGame.currentBatterIndex.away
      : currentGame.currentBatterIndex.home

    const currentLineupSpot = lineup[batterIndex]
    if (!currentLineupSpot) return null

    return team.players.find(p => p.id === currentLineupSpot.playerId)
  }

  // 現在の投手を取得
  const getCurrentPitcher = () => {
    if (!currentGame) return null

    const pitcherId = currentGame.isTopInning ? currentGame.homePitcherId : currentGame.awayPitcherId
    const teamId = currentGame.isTopInning ? currentGame.homeTeamId : currentGame.awayTeamId
    const team = teams.find((t) => t.id === teamId)

    if (!team) return null

    return team.players.find((p) => p.id === pitcherId)
  }

  // 打席結果オプション
  const resultOptions: AtBatResult[] = [
    "安打",
    "二塁打",
    "三塁打",
    "本塁打",
    "四球",
    "死球",
    "犠打",
    "犠飛",
    "失策",
    "フィールダーチョイス",
    "三振",
    "ゴロアウト",
    "フライアウト",
    "ライナーアウト",
  ]

  // 打球方向オプション
  const directionOptions: BattedBallDirection[] = [
    "ピッチャー",
    "キャッチャー",
    "ファースト",
    "セカンド",
    "サード",
    "ショート",
    "レフト",
    "センター",
    "ライト",
  ]

  const currentBatter = getCurrentBatter()
  const currentPitcher = getCurrentPitcher()

  if (!currentGame) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">試合が見つかりません</h1>
          <Link href="/games">
            <Button>試合一覧に戻る</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">試合詳細</h1>
        <Link href="/games">
          <Button variant="outline">試合一覧に戻る</Button>
        </Link>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {getTeamName(currentGame.awayTeamId)} vs {getTeamName(currentGame.homeTeamId)}
              </CardTitle>
              {!currentGame.isComplete && (
                <Button variant="destructive" onClick={endGame}>
                  試合終了
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* スコアボードを追加 */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">チーム</th>
                    {Array.from({ length: Math.max(9, currentGame.currentInning) }, (_, i) => (
                      <th key={i + 1} className="p-2 text-center w-10">{i + 1}</th>
                    ))}
                    <th className="p-2 text-center w-10">R</th>
                    <th className="p-2 text-center w-10">H</th>
                    <th className="p-2 text-center w-10">E</th>
                  </tr>
                </thead>
                <tbody>
                  {["away", "home"].map((team) => {
                    const stats = calculateGameStats(currentGame)
                    const teamStats = stats[team as keyof typeof stats]
                    const totalScore = team === "away" ? currentGame.awayScore : currentGame.homeScore
                    
                    return (
                      <tr key={team} className="border-b">
                        <td className="p-2 font-medium">
                          {getTeamName(team === "away" ? currentGame.awayTeamId : currentGame.homeTeamId)}
                        </td>
                        {teamStats.scores.map((score, i) => (
                          <td key={i} className="p-2 text-center">
                            {i < currentGame.currentInning - 1 || 
                             (i === currentGame.currentInning - 1 && 
                              (!currentGame.isTopInning || team === "away")) 
                              ? score 
                              : ""}
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold">{totalScore}</td>
                        <td className="p-2 text-center">{teamStats.hits}</td>
                        <td className="p-2 text-center">{teamStats.errors}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-lg font-bold">{getTeamName(currentGame.awayTeamId)}</div>
                <div className="text-3xl">{currentGame.awayScore}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {currentGame.currentInning}回{currentGame.isTopInning ? "表" : "裏"}
                </div>
                <div className="text-xl">アウト: {currentGame.outs}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{getTeamName(currentGame.homeTeamId)}</div>
                <div className="text-3xl">{currentGame.homeScore}</div>
              </div>
            </div>

            {!currentGame.isComplete && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">現在の打者</div>
                    <div className="font-bold text-lg">
                      {currentBatter ? currentBatter.name : "打者が登録されていません"}
                      {currentBatter?.number && ` #${currentBatter.number}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">現在の投手</div>
                    <div className="font-bold text-lg">
                      {currentPitcher ? currentPitcher.name : "投手が登録されていません"}
                      {currentPitcher?.number && ` #${currentPitcher.number}`}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">打席結果</label>
                    <Select value={currentResult} onValueChange={(value) => setCurrentResult(value as AtBatResult)}>
                      <SelectTrigger>
                        <SelectValue placeholder="結果を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {resultOptions.map((result) => (
                          <SelectItem key={result} value={result}>
                            {result}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {currentResult && !["四球", "死球", "三振"].includes(currentResult) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">打球方向</label>
                      <Select value={currentDirection} onValueChange={(value) => setCurrentDirection(value as BattedBallDirection)}>
                        <SelectTrigger>
                          <SelectValue placeholder="方向を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {directionOptions.map((direction) => (
                            <SelectItem key={direction} value={direction}>
                              {direction}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">打点</label>
                    <Select value={currentRbi.toString()} onValueChange={(value) => setCurrentRbi(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="打点を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4].map((rbi) => (
                          <SelectItem key={rbi} value={rbi.toString()}>
                            {rbi}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => currentResult && recordAtBat(currentResult as AtBatResult)}
                    disabled={!currentResult || !currentBatter}
                  >
                    結果を記録
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>打席記録</CardTitle>
          </CardHeader>
          <CardContent>
            {currentGame.atBats.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">まだ記録がありません</p>
            ) : (
              <div className="space-y-2">
                {[...currentGame.atBats]
                  .reverse()
                  .slice(0, 10)
                  .map((atBat) => {
                    const teamId = atBat.isTopInning ? currentGame.awayTeamId : currentGame.homeTeamId
                    const pitcherTeamId = atBat.isTopInning ? currentGame.homeTeamId : currentGame.awayTeamId

                    return (
                      <div key={atBat.id} className="p-3 border rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{getPlayerName(teamId, atBat.batterId)}</span>
                            <span className="text-muted-foreground ml-2">
                              {atBat.inning}回{atBat.isTopInning ? "表" : "裏"}
                            </span>
                          </div>
                          <div className="font-bold">
                            {atBat.result}
                            {atBat.direction && ` (${atBat.direction})`}
                            {atBat.rbi > 0 && ` ${atBat.rbi}打点`}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          投手: {getPlayerName(pitcherTeamId, atBat.pitcherId)}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 