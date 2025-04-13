"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

type PlayType = 
  | "盗塁"
  | "盗塁死"
  | "進塁"
  | "進塁死"
  | "ボーク"
  | "暴投"
  | "捕逸"
  | "走塁死"

type Play = {
  id: string
  type: PlayType
  playerId: string
  pitcherId: string
  inning: number
  outs: number
  isTopInning: boolean
  timestamp: number
  fromBase?: 1 | 2 | 3  // 走者の現在のベース
  toBase?: 2 | 3 | 4    // 目標ベース
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

type Runner = {
  playerId: string
  base: 1 | 2 | 3
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
  plays: Play[]
  runners: Runner[]  // 追加：現在の走者情報
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

// 打者成績を計算するヘルパー関数
const calculateBatterStats = (game: GameState, teamId: string, teams: Team[]) => {
  const batterStats = new Map<string, {
    atBats: number,
    hits: number,
    doubles: number,
    triples: number,
    homeRuns: number,
    walks: number,
    rbi: number,
    strikeouts: number
  }>()

  // チームの打者の初期化
  const team = teams.find((t: Team) => t.id === teamId)
  team?.players.forEach((player: Player) => {
    batterStats.set(player.id, {
      atBats: 0,
      hits: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      walks: 0,
      rbi: 0,
      strikeouts: 0
    })
  })

  // 打席結果の集計
  game.atBats.forEach(atBat => {
    const isTeamAtBat = (atBat.isTopInning && teamId === game.awayTeamId) ||
                       (!atBat.isTopInning && teamId === game.homeTeamId)
    
    if (!isTeamAtBat) return

    const playerStats = batterStats.get(atBat.batterId)
    if (!playerStats) return

    // 打点の加算
    playerStats.rbi += atBat.rbi

    switch (atBat.result) {
      case "安打":
        playerStats.hits++
        playerStats.atBats++
        break
      case "二塁打":
        playerStats.hits++
        playerStats.doubles++
        playerStats.atBats++
        break
      case "三塁打":
        playerStats.hits++
        playerStats.triples++
        playerStats.atBats++
        break
      case "本塁打":
        playerStats.hits++
        playerStats.homeRuns++
        playerStats.atBats++
        break
      case "四球":
      case "死球":
        playerStats.walks++
        break
      case "三振":
        playerStats.strikeouts++
        playerStats.atBats++
        break
      case "ゴロアウト":
      case "フライアウト":
      case "ライナーアウト":
        playerStats.atBats++
        break
    }
  })

  return batterStats
}

// 投手成績を計算するヘルパー関数
const calculatePitcherStats = (game: GameState, teamId: string, teams: Team[]) => {
  const pitcherStats = new Map<string, {
    inningsPitched: number,
    hits: number,
    runs: number,
    strikeouts: number,
    walks: number
  }>()

  // チームの投手の初期化
  const team = teams.find((t: Team) => t.id === teamId)
  team?.players.forEach((player: Player) => {
    if (player.type === "pitcher" || player.type === "both") {
      pitcherStats.set(player.id, {
        inningsPitched: 0,
        hits: 0,
        runs: 0,
        strikeouts: 0,
        walks: 0
      })
    }
  })

  // 投手成績の集計
  let currentOuts = 0

  game.atBats.forEach(atBat => {
    const isTeamPitching = (atBat.isTopInning && teamId === game.homeTeamId) ||
                          (!atBat.isTopInning && teamId === game.awayTeamId)
    
    if (!isTeamPitching) return

    const playerStats = pitcherStats.get(atBat.pitcherId)
    if (!playerStats) return

    switch (atBat.result) {
      case "安打":
      case "二塁打":
      case "三塁打":
      case "本塁打":
        playerStats.hits++
        break
      case "四球":
      case "死球":
        playerStats.walks++
        break
      case "三振":
        playerStats.strikeouts++
        break
    }

    // アウトカウントの更新
    if (["三振", "ゴロアウト", "フライアウト", "ライナーアウト"].includes(atBat.result)) {
      currentOuts++
      if (currentOuts === 3) {
        playerStats.inningsPitched++
        currentOuts = 0
      }
    }
  })

  return pitcherStats
}

// 打席結果の色を決定するヘルパー関数
const getAtBatResultColor = (result: string): string => {
  // ヒット系の結果を抽出（括弧付きの打点情報がある場合も考慮）
  const baseResult = result.split('(')[0]
  if (["安打", "二塁打", "三塁打", "本塁打"].includes(baseResult)) {
    return "text-red-500"
  }
  return ""
}

// イニングごとの打席結果を計算するヘルパー関数
const calculateInningResults = (game: GameState, teamId: string, teams: Team[]) => {
  const results = new Map<string, Map<number, string>>()

  // チームの選手の初期化
  const lineup = teamId === game.homeTeamId ? game.lineup.home : game.lineup.away
  lineup.forEach(spot => {
    results.set(spot.playerId, new Map())
  })

  // 打席結果の集計
  game.atBats.forEach(atBat => {
    const isTeamAtBat = (atBat.isTopInning && teamId === game.awayTeamId) ||
                       (!atBat.isTopInning && teamId === game.homeTeamId)
    
    if (!isTeamAtBat) return

    const playerResults = results.get(atBat.batterId)
    if (!playerResults) return

    // 打点がある場合は結果に打点を追加
    const resultWithRbi = atBat.rbi > 0 ? `${atBat.result}(${atBat.rbi})` : atBat.result
    playerResults.set(atBat.inning, resultWithRbi)
  })

  return { results, lineup }
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
  const [currentPlayType, setCurrentPlayType] = useState<PlayType | "">("")
  const [selectedRunner, setSelectedRunner] = useState<string>("")
  const [targetBase, setTargetBase] = useState<2 | 3 | 4 | "">("")

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
          setCurrentGame({
            ...game,
            plays: game.plays || [],
            runners: game.runners || []
          })
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

    // 安打の場合は走者を追加
    if (["安打", "二塁打", "三塁打", "本塁打"].includes(result)) {
      const newRunners = [...currentGame.runners]
      
      // 既存の走者を進塁
      currentGame.runners.forEach(runner => {
        if (result === "本塁打") {
          // ホームランの場合は全員生還
          newRunners = newRunners.filter(r => r.playerId !== runner.playerId)
        } else {
          // 安打の場合は全員進塁
          const advanceBase = (base: number) => Math.min(base + 1, 3) as 1 | 2 | 3
          newRunners = newRunners.map(r =>
            r.playerId === runner.playerId
              ? { ...r, base: advanceBase(r.base) }
              : r
          )
        }
      })

      // 打者を走者として追加（本塁打以外の場合）
      if (result !== "本塁打" && currentBatter) {
        const baseMap = {
          "安打": 1,
          "二塁打": 2,
          "三塁打": 3
        } as const
        newRunners.push({
          playerId: currentBatter.id,
          base: baseMap[result as keyof typeof baseMap] as 1 | 2 | 3
        })
      }

      updatedGame.runners = newRunners
    }
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

  // プレー結果を記録
  const recordPlay = (playType: PlayType) => {
    if (!currentGame || !selectedRunner) return

    const currentTeamId = currentGame.isTopInning ? currentGame.awayTeamId : currentGame.homeTeamId
    const currentPitcherId = currentGame.isTopInning ? currentGame.homePitcherId : currentGame.awayPitcherId
    
    // 選択された走者の情報を取得
    const runner = currentGame.runners.find(r => r.playerId === selectedRunner)
    if (!runner && ["盗塁", "盗塁死", "進塁", "進塁死", "走塁死"].includes(playType)) {
      toast({
        title: "エラー",
        description: "走者が選択されていません",
        variant: "destructive",
      })
      return
    }

    // プレー結果を記録
    const newPlay: Play = {
      id: Date.now().toString(),
      type: playType,
      playerId: selectedRunner,
      pitcherId: currentPitcherId,
      inning: currentGame.currentInning,
      outs: currentGame.outs,
      isTopInning: currentGame.isTopInning,
      timestamp: Date.now(),
      fromBase: runner?.base,
      toBase: targetBase || undefined,
    }

    // ゲーム状態を更新
    let newOuts = currentGame.outs
    let newRunners = [...currentGame.runners]

    if (["盗塁死", "進塁死", "走塁死"].includes(playType)) {
      newOuts += 1
      // 走者をベースから除外
      newRunners = newRunners.filter(r => r.playerId !== selectedRunner)
    } else if (["盗塁", "進塁"].includes(playType) && targetBase) {
      // 走者のベースを更新
      newRunners = newRunners.map(r =>
        r.playerId === selectedRunner
          ? { ...r, base: (targetBase === 4 ? undefined : targetBase - 1) as 1 | 2 | 3 }
          : r
      ).filter(r => r.base !== undefined)
    }

    // 3アウトで攻守交代
    let newIsTopInning = currentGame.isTopInning
    let newInning = currentGame.currentInning
    if (newOuts >= 3) {
      newOuts = 0
      newIsTopInning = !newIsTopInning
      newRunners = [] // イニング終了時に走者をクリア
      if (!newIsTopInning) {
        newInning += 1
      }
    }

    const updatedGame: GameState = {
      ...currentGame,
      outs: newOuts,
      isTopInning: newIsTopInning,
      currentInning: newInning,
      plays: [...currentGame.plays, newPlay],
      runners: newRunners,
    }

    // ゲーム一覧を更新
    const savedGames = storage.getGames() || []
    const updatedGames = savedGames.map((game) => (game.id === currentGame.id ? updatedGame : game))

    setCurrentGame(updatedGame)
    storage.setGames(updatedGames)

    // 結果をリセット
    setCurrentPlayType("")
    setSelectedRunner("")
    setTargetBase("")

    toast({
      title: "記録完了",
      description: `${getPlayerName(currentTeamId, selectedRunner)}の${playType}を記録しました`,
    })
  }

  // プレー結果オプション
  const playTypeOptions: PlayType[] = [
    "盗塁",
    "盗塁死",
    "進塁",
    "進塁死",
    "ボーク",
    "暴投",
    "捕逸",
    "走塁死",
  ]

  // ベースオプション
  const baseOptions = [1, 2, 3, 4]

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

                <Tabs defaultValue="atbat" className="mt-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="atbat">打席結果</TabsTrigger>
                    <TabsTrigger value="play">プレー結果</TabsTrigger>
                  </TabsList>

                  <TabsContent value="atbat">
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
                        打席結果を記録
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="play">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">プレー結果</label>
                        <Select value={currentPlayType} onValueChange={(value) => setCurrentPlayType(value as PlayType)}>
                          <SelectTrigger>
                            <SelectValue placeholder="結果を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {playTypeOptions.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {["盗塁", "盗塁死", "進塁", "進塁死", "走塁死"].includes(currentPlayType) && (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">走者</label>
                            <Select value={selectedRunner} onValueChange={setSelectedRunner}>
                              <SelectTrigger>
                                <SelectValue placeholder="走者を選択" />
                              </SelectTrigger>
                              <SelectContent>
                                {currentGame?.runners.map((runner) => (
                                  <SelectItem key={runner.playerId} value={runner.playerId}>
                                    {getPlayerName(currentGame.isTopInning ? currentGame.awayTeamId : currentGame.homeTeamId, runner.playerId)}
                                    （{runner.base}塁）
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {["盗塁", "盗塁死", "進塁", "進塁死"].includes(currentPlayType) && selectedRunner && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">目標ベース</label>
                              <Select
                                value={targetBase ? targetBase.toString() : ""}
                                onValueChange={(value) => setTargetBase(parseInt(value) as 2 | 3 | 4)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="ベースを選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    const runner = currentGame?.runners.find(r => r.playerId === selectedRunner)
                                    if (!runner) return []
                                    return Array.from({ length: 4 - runner.base }, (_, i) => runner.base + i + 1)
                                  })().map((base) => (
                                    <SelectItem key={base} value={base.toString()}>
                                      {base}塁
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </>
                      )}

                      <Button
                        className="w-full"
                        onClick={() => currentPlayType && recordPlay(currentPlayType as PlayType)}
                        disabled={
                          !currentPlayType ||
                          (["盗塁", "盗塁死", "進塁", "進塁死", "走塁死"].includes(currentPlayType) && !selectedRunner) ||
                          (["盗塁", "盗塁死", "進塁", "進塁死"].includes(currentPlayType) && !targetBase)
                        }
                      >
                        プレー結果を記録
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>打席結果</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={currentGame.awayTeamId} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value={currentGame.awayTeamId}>
                  {getTeamName(currentGame.awayTeamId)}
                </TabsTrigger>
                <TabsTrigger value={currentGame.homeTeamId}>
                  {getTeamName(currentGame.homeTeamId)}
                </TabsTrigger>
              </TabsList>
              {[currentGame.awayTeamId, currentGame.homeTeamId].map(teamId => {
                const { results: inningResults, lineup } = calculateInningResults(currentGame, teamId, teams)
                const maxInning = Math.max(
                  9,
                  ...Array.from(inningResults.values())
                    .flatMap(playerResults => Array.from(playerResults.keys()))
                )

                return (
                  <TabsContent key={teamId} value={teamId}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 w-16">打順</th>
                            <th className="text-left p-2 w-40">選手</th>
                            <th className="text-left p-2 w-24">ポジション</th>
                            {Array.from({ length: maxInning }, (_, i) => (
                              <th key={i + 1} className="text-center p-2 w-16">{i + 1}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {lineup.map((spot, index) => (
                            <tr key={spot.playerId} className="border-b">
                              <td className="p-2 w-16">{index + 1}</td>
                              <td className="p-2 w-40">{getPlayerName(teamId, spot.playerId)}</td>
                              <td className="p-2 w-24">{spot.position}</td>
                              {Array.from({ length: maxInning }, (_, i) => (
                                <td key={i + 1} className={`text-center p-2 w-16 ${getAtBatResultColor(inningResults.get(spot.playerId)?.get(i + 1) || '')}`}>
                                  {inningResults.get(spot.playerId)?.get(i + 1) || ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          </CardContent>
        </Card>

      </div>
    </div>
  )
} 