"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle } from "lucide-react"
import { Storage, Player, Team, AtBat, AtBatResult, Game } from "@packages/storage"

const storage = new Storage()

export default function GamesPage() {
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [games, setGames] = useState<Game[]>([])

  // 新しいゲーム用の状態
  const [homeTeamId, setHomeTeamId] = useState("")
  const [awayTeamId, setAwayTeamId] = useState("")
  const [homePitcherId, setHomePitcherId] = useState("")
  const [awayPitcherId, setAwayPitcherId] = useState("")
  const [homeLineup, setHomeLineup] = useState<{ playerId: string; position: string }[]>([])
  const [awayLineup, setAwayLineup] = useState<{ playerId: string; position: string }[]>([])

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

  // 打順とポジションの初期化
  const initializeLineup = (teamId: string) => {
    return Array(9).fill({ playerId: "", position: "" })
  }

  useEffect(() => {
    if (homeTeamId) {
      setHomeLineup(initializeLineup(homeTeamId))
    }
  }, [homeTeamId])

  useEffect(() => {
    if (awayTeamId) {
      setAwayLineup(initializeLineup(awayTeamId))
    }
  }, [awayTeamId])

  // 打順の追加
  const addLineupSpot = (isHome: boolean) => {
    if (isHome) {
      setHomeLineup([...homeLineup, { playerId: "", position: "" }])
    } else {
      setAwayLineup([...awayLineup, { playerId: "", position: "" }])
    }
  }

  // 打順とポジションの更新
  const updateLineup = (isHome: boolean, index: number, field: "playerId" | "position", value: string) => {
    if (isHome) {
      const newLineup = [...homeLineup]
      newLineup[index] = { ...newLineup[index], [field]: value }
      setHomeLineup(newLineup)
    } else {
      const newLineup = [...awayLineup]
      newLineup[index] = { ...newLineup[index], [field]: value }
      setAwayLineup(newLineup)
    }
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
        description: "後攻チームと先攻チームは異なるチームを選択してください",
        variant: "destructive",
      })
      return
    }

    // 打順が完全に設定されているか確認
    const isHomeLineupComplete = homeLineup.every((player) => player.playerId && player.position)
    const isAwayLineupComplete = awayLineup.every((player) => player.playerId && player.position)

    if (!isHomeLineupComplete || !isAwayLineupComplete) {
      toast({
        title: "エラー",
        description: "すべての打順とポジションを設定してください",
        variant: "destructive",
      })
      return
    }

    // ホームチームの重複チェック
    const homePlayerIds = homeLineup.map(player => player.playerId)
    const homePositions = homeLineup.map(player => player.position).filter(pos => pos !== "指")
    const hasHomeDuplicatePlayer = new Set(homePlayerIds).size !== homePlayerIds.length
    const hasHomeDuplicatePosition = new Set(homePositions).size !== homePositions.length

    if (hasHomeDuplicatePlayer) {
      toast({
        title: "エラー",
        description: "後攻チームの打順に同じ選手が複数回選択されています",
        variant: "destructive",
      })
      return
    }

    if (hasHomeDuplicatePosition) {
      toast({
        title: "エラー",
        description: "後攻チームの打順に同じポジション（指名打者以外）が複数回選択されています",
        variant: "destructive",
      })
      return
    }

    // アウェイチームの重複チェック
    const awayPlayerIds = awayLineup.map(player => player.playerId)
    const awayPositions = awayLineup.map(player => player.position).filter(pos => pos !== "指")
    const hasAwayDuplicatePlayer = new Set(awayPlayerIds).size !== awayPlayerIds.length
    const hasAwayDuplicatePosition = new Set(awayPositions).size !== awayPositions.length

    if (hasAwayDuplicatePlayer) {
      toast({
        title: "エラー",
        description: "先攻チームの打順に同じ選手が複数回選択されています",
        variant: "destructive",
      })
      return
    }

    if (hasAwayDuplicatePosition) {
      toast({
        title: "エラー",
        description: "先攻チームの打順に同じポジション（指名打者以外）が複数回選択されています",
        variant: "destructive",
      })
      return
    }

    const newGame: Game = {
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
      lineup: {
        home: homeLineup,
        away: awayLineup,
      },
    }

    const updatedGames = [...games, newGame]
    setGames(updatedGames)
    storage.setGames(updatedGames)

    toast({
      title: "試合開始",
      description: `${getTeamName(awayTeamId)} vs ${getTeamName(homeTeamId)}の試合が開始されました`,
    })

    // 新しいゲームの詳細ページに遷移
    window.location.href = `/games/${newGame.id}`
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">試合トラッカー</h1>
        <Link href="/">
          <Button variant="outline">ホームに戻る</Button>
        </Link>
      </div>

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
                  <label className="text-sm font-medium">先攻チーム</label>
                  <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="先攻チームを選択" />
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
                    <label className="text-sm font-medium">先攻先発投手</label>
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

                {awayTeamId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">先攻チーム打順</label>
                    {awayLineup.map((player, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2">
                        <div className="text-sm font-medium">{index + 1}番</div>
                        <Select
                          value={player.playerId}
                          onValueChange={(value) => updateLineup(false, index, "playerId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選手を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {getTeamBatters(awayTeamId).map((batter) => (
                              <SelectItem key={batter.id} value={batter.id}>
                                {batter.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={player.position}
                          onValueChange={(value) => updateLineup(false, index, "position", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="ポジション" />
                          </SelectTrigger>
                          <SelectContent>
                            {["投", "捕", "一", "二", "三", "遊", "左", "中", "右", "指"].map((pos) => (
                              <SelectItem key={pos} value={pos}>
                                {pos}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addLineupSpot(false)}
                      className="w-full mt-2"
                    >
                      打順を追加
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">後攻チーム</label>
                  <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="後攻チームを選択" />
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
                    <label className="text-sm font-medium">後攻先発投手</label>
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

                {homeTeamId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">後攻チーム打順</label>
                    {homeLineup.map((player, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2">
                        <div className="text-sm font-medium">{index + 1}番</div>
                        <Select
                          value={player.playerId}
                          onValueChange={(value) => updateLineup(true, index, "playerId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選手を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {getTeamBatters(homeTeamId).map((batter) => (
                              <SelectItem key={batter.id} value={batter.id}>
                                {batter.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={player.position}
                          onValueChange={(value) => updateLineup(true, index, "position", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="ポジション" />
                          </SelectTrigger>
                          <SelectContent>
                            {["投", "捕", "一", "二", "三", "遊", "左", "中", "右", "指"].map((pos) => (
                              <SelectItem key={pos} value={pos}>
                                {pos}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addLineupSpot(true)}
                      className="w-full mt-2"
                    >
                      打順を追加
                    </Button>
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
                        <Link href={`/games/${game.id}`}>
                          <Button size="sm" variant="outline">
                            続行
                          </Button>
                        </Link>
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
    </div>
  )
}
