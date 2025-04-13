"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle } from "lucide-react"
import { Storage, Team as StorageTeam } from "@packages/storage"

// 型定義
type Player = {
  id: string
  name: string
  number: string
  position: string
  type: "pitcher" | "batter" | "both"
}

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

type AtBat = {
  id: string
  batterId: string
  pitcherId: string
  result: AtBatResult
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
}

const storage = new Storage()

export default function GamesPage() {
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [games, setGames] = useState<GameState[]>([])
  const [currentGame, setCurrentGame] = useState<GameState | null>(null)

  // 新しいゲーム用の状態
  const [homeTeamId, setHomeTeamId] = useState("")
  const [awayTeamId, setAwayTeamId] = useState("")
  const [homePitcherId, setHomePitcherId] = useState("")
  const [awayPitcherId, setAwayPitcherId] = useState("")

  // 現在の打者と結果
  const [currentResult, setCurrentResult] = useState<AtBatResult | "">("")

  // ローカルストレージからデータを読み込む
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTeams = storage.getTeams()
      const savedGames = storage.getGames()

      if (savedTeams) {
        setTeams(savedTeams)
      }

      if (savedGames) {
        setGames(savedGames)
      }
    }
  }, [])

  // 選択されたチームの投手を取得
  const getTeamPitchers = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    if (!team) return []

    return team.players.filter((p) => p.type === "pitcher" || p.type === "both")
  }

  // 選択されたチームの打者を取得
  const getTeamBatters = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    if (!team) return []

    return team.players.filter((p) => p.type === "batter" || p.type === "both")
  }

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

  // 新しいゲームを作成
  const createNewGame = () => {
    if (!homeTeamId || !awayTeamId || !homePitcherId || !awayPitcherId) {
      toast({
        title: "エラー",
        description: "すべての項目を選択してください",
        variant: "destructive",
      })
      return
    }

    if (homeTeamId === awayTeamId) {
      toast({
        title: "エラー",
        description: "ホームチームとアウェイチームは異なるチームを選択してください",
        variant: "destructive",
      })
      return
    }

    const newGame: GameState = {
      id: Date.now().toString(),
      homeTeamId,
      awayTeamId,
      homePitcherId,
      awayPitcherId,
      currentInning: 1,
      isTopInning: true,
      outs: 0,
      homeScore: 0,
      awayScore: 0,
      atBats: [],
      startTime: Date.now(),
      endTime: null,
      isComplete: false,
      currentBatterIndex: {
        home: 0,
        away: 0,
      },
    }

    const updatedGames = [...games, newGame]
    setGames(updatedGames)
    storage.setGames(updatedGames)

    setCurrentGame(newGame)

    toast({
      title: "試合開始",
      description: `${getTeamName(awayTeamId)} vs ${getTeamName(homeTeamId)}の試合が開始されました`,
    })
  }

  // 打席結果を記録
  const recordAtBat = (result: AtBatResult) => {
    if (!currentGame) return

    const isOut = ["三振", "ゴロアウト", "フライアウト", "ライナーアウト"].includes(result)

    const isRun = ["本塁打"].includes(result)

    // 現在の打者を取得
    const currentTeamId = currentGame.isTopInning ? currentGame.awayTeamId : currentGame.homeTeamId
    const currentPitcherId = currentGame.isTopInning ? currentGame.homePitcherId : currentGame.awayPitcherId
    const batters = getTeamBatters(currentTeamId)

    if (batters.length === 0) {
      toast({
        title: "エラー",
        description: "打者が登録されていません",
        variant: "destructive",
      })
      return
    }

    const batterIndex = currentGame.isTopInning
      ? currentGame.currentBatterIndex.away
      : currentGame.currentBatterIndex.home

    const currentBatter = batters[batterIndex % batters.length]

    // 打席結果を記録
    const newAtBat: AtBat = {
      id: Date.now().toString(),
      batterId: currentBatter.id,
      pitcherId: currentPitcherId,
      result,
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
      newCurrentBatterIndex.away = (batterIndex + 1) % batters.length
    } else {
      newCurrentBatterIndex.home = (batterIndex + 1) % batters.length
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
    const updatedGames = games.map((game) => (game.id === currentGame.id ? updatedGame : game))

    setGames(updatedGames)
    setCurrentGame(updatedGame)
    storage.setGames(updatedGames)

    // 結果をリセット
    setCurrentResult("")

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

    const updatedGames = games.map((game) => (game.id === currentGame.id ? updatedGame : game))

    setGames(updatedGames)
    setCurrentGame(null)
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
    const batters = getTeamBatters(currentTeamId)

    if (batters.length === 0) return null

    const batterIndex = currentGame.isTopInning
      ? currentGame.currentBatterIndex.away
      : currentGame.currentBatterIndex.home

    return batters[batterIndex % batters.length]
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

  const currentBatter = getCurrentBatter()
  const currentPitcher = getCurrentPitcher()

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">試合トラッカー</h1>
        <Link href="/">
          <Button variant="outline">ホームに戻る</Button>
        </Link>
      </div>

      {!currentGame ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>新しい試合を開始</CardTitle>
            </CardHeader>
            <CardContent>
              {teams.length < 2 ? (
                <div className="text-center py-4">
                  <p className="mb-4 text-muted-foreground">試合を開始するには、少なくとも2つのチームが必要です</p>
                  <Link href="/teams">
                    <Button>チーム管理へ</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ホームチーム</label>
                    <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                      <SelectTrigger>
                        <SelectValue placeholder="ホームチームを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {homeTeamId && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">ホーム先発投手</label>
                      <Select value={homePitcherId} onValueChange={setHomePitcherId}>
                        <SelectTrigger>
                          <SelectValue placeholder="投手を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {getTeamPitchers(homeTeamId).map((pitcher) => (
                            <SelectItem key={pitcher.id} value={pitcher.id}>
                              {pitcher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">アウェイチーム</label>
                    <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                      <SelectTrigger>
                        <SelectValue placeholder="アウェイチームを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {awayTeamId && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">アウェイ先発投手</label>
                      <Select value={awayPitcherId} onValueChange={setAwayPitcherId}>
                        <SelectTrigger>
                          <SelectValue placeholder="投手を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {getTeamPitchers(awayTeamId).map((pitcher) => (
                            <SelectItem key={pitcher.id} value={pitcher.id}>
                              {pitcher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={createNewGame}
                    disabled={!homeTeamId || !awayTeamId || !homePitcherId || !awayPitcherId}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    試合を開始
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近の試合</CardTitle>
            </CardHeader>
            <CardContent>
              {games.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">試合の記録がありません</p>
              ) : (
                <div className="space-y-2">
                  {games.map((game) => (
                    <div key={game.id} className="p-3 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">
                          {getTeamName(game.awayTeamId)} vs {getTeamName(game.homeTeamId)}
                        </div>
                        {game.isComplete ? (
                          <span className="text-xs bg-muted px-2 py-1 rounded">終了</span>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setCurrentGame(game)}>
                            続行
                          </Button>
                        )}
                      </div>
                      <div className="text-sm">
                        {game.awayScore} - {game.homeScore}
                        {game.isComplete ? (
                          <span className="text-muted-foreground ml-2">
                            {new Date(game.endTime || 0).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground ml-2">
                            {game.currentInning}回{game.isTopInning ? "表" : "裏"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {getTeamName(currentGame.awayTeamId)} vs {getTeamName(currentGame.homeTeamId)}
                </CardTitle>
                <Button variant="destructive" onClick={endGame}>
                  試合終了
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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

                  <Button
                    className="w-full"
                    onClick={() => currentResult && recordAtBat(currentResult as AtBatResult)}
                    disabled={!currentResult || !currentBatter}
                  >
                    結果を記録
                  </Button>
                </div>
              </div>
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
                            <div className="font-bold">{atBat.result}</div>
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
      )}
    </div>
  )
}
