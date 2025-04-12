"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

export default function TeamsPage() {
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>(() => {
    // ローカルストレージから読み込み
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("baseball-teams")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const [newTeamName, setNewTeamName] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [newPlayer, setNewPlayer] = useState<Omit<Player, "id">>({
    name: "",
    number: "",
    position: "",
    type: "both",
  })

  // チームを保存
  const saveTeams = (updatedTeams: Team[]) => {
    setTeams(updatedTeams)
    localStorage.setItem("baseball-teams", JSON.stringify(updatedTeams))
  }

  // チームを追加
  const addTeam = () => {
    if (!newTeamName.trim()) {
      toast({
        title: "エラー",
        description: "チーム名を入力してください",
        variant: "destructive",
      })
      return
    }

    const newTeam: Team = {
      id: Date.now().toString(),
      name: newTeamName,
      players: [],
    }

    const updatedTeams = [...teams, newTeam]
    saveTeams(updatedTeams)
    setNewTeamName("")
    setSelectedTeam(newTeam)

    toast({
      title: "チーム追加",
      description: `${newTeamName}が追加されました`,
    })
  }

  // チームを削除
  const deleteTeam = (teamId: string) => {
    const updatedTeams = teams.filter((team) => team.id !== teamId)
    saveTeams(updatedTeams)

    if (selectedTeam?.id === teamId) {
      setSelectedTeam(null)
    }

    toast({
      title: "チーム削除",
      description: "チームが削除されました",
    })
  }

  // 選手を追加
  const addPlayer = () => {
    if (!selectedTeam) return

    if (!newPlayer.name.trim()) {
      toast({
        title: "エラー",
        description: "選手名を入力してください",
        variant: "destructive",
      })
      return
    }

    const player: Player = {
      ...newPlayer,
      id: Date.now().toString(),
    }

    const updatedTeam = {
      ...selectedTeam,
      players: [...selectedTeam.players, player],
    }

    const updatedTeams = teams.map((team) => (team.id === selectedTeam.id ? updatedTeam : team))

    saveTeams(updatedTeams)
    setSelectedTeam(updatedTeam)
    setNewPlayer({
      name: "",
      number: "",
      position: "",
      type: "both",
    })

    toast({
      title: "選手追加",
      description: `${player.name}が追加されました`,
    })
  }

  // 選手を削除
  const deletePlayer = (playerId: string) => {
    if (!selectedTeam) return

    const updatedPlayers = selectedTeam.players.filter((player) => player.id !== playerId)

    const updatedTeam = {
      ...selectedTeam,
      players: updatedPlayers,
    }

    const updatedTeams = teams.map((team) => (team.id === selectedTeam.id ? updatedTeam : team))

    saveTeams(updatedTeams)
    setSelectedTeam(updatedTeam)

    toast({
      title: "選手削除",
      description: "選手が削除されました",
    })
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">チーム管理</h1>
        <Link href="/">
          <Button variant="outline">ホームに戻る</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>チーム一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="新しいチーム名"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
              <Button onClick={addTeam}>追加</Button>
            </div>

            <div className="space-y-2">
              {teams.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">チームがありません</p>
              ) : (
                teams.map((team) => (
                  <div
                    key={team.id}
                    className={`flex justify-between items-center p-2 rounded cursor-pointer ${
                      selectedTeam?.id === team.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedTeam(team)}
                  >
                    <span>{team.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTeam(team.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{selectedTeam ? `${selectedTeam.name}の選手` : "チームを選択してください"}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTeam ? (
              <Tabs defaultValue="roster">
                <TabsList className="mb-4">
                  <TabsTrigger value="roster">選手名簿</TabsTrigger>
                  <TabsTrigger value="add">選手追加</TabsTrigger>
                </TabsList>

                <TabsContent value="roster">
                  {selectedTeam.players.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">選手がいません</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTeam.players.map((player) => (
                        <div key={player.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <span className="font-medium">{player.name}</span>
                            <div className="text-sm text-muted-foreground">
                              {player.number && `#${player.number} `}
                              {player.position && `${player.position} `}
                              {player.type === "pitcher" && "投手"}
                              {player.type === "batter" && "打者"}
                              {player.type === "both" && "投手/打者"}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => deletePlayer(player.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="add">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="player-name">選手名</Label>
                        <Input
                          id="player-name"
                          value={newPlayer.name}
                          onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="player-number">背番号</Label>
                        <Input
                          id="player-number"
                          value={newPlayer.number}
                          onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="player-position">ポジション</Label>
                        <Input
                          id="player-position"
                          value={newPlayer.position}
                          onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                          placeholder="例: 遊撃手、外野手"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="player-type">タイプ</Label>
                        <select
                          id="player-type"
                          className="w-full p-2 rounded border"
                          value={newPlayer.type}
                          onChange={(e) =>
                            setNewPlayer({
                              ...newPlayer,
                              type: e.target.value as "pitcher" | "batter" | "both",
                            })
                          }
                        >
                          <option value="both">投手/打者</option>
                          <option value="pitcher">投手のみ</option>
                          <option value="batter">打者のみ</option>
                        </select>
                      </div>
                    </div>

                    <Button onClick={addPlayer} className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      選手を追加
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <p className="text-center py-10 text-muted-foreground">
                左側からチームを選択するか、新しいチームを作成してください
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
