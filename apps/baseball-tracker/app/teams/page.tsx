"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Trash2, Pencil, X, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Storage, Team as StorageTeam } from "@packages/storage"

// 型定義
type Position = "投手" | "捕手" | "一塁手" | "二塁手" | "三塁手" | "遊撃手" | "外野手"

type Player = {
  id: string
  name: string
  number: string
  position: Position[]
  type: "pitcher" | "batter" | "both"
}

type Team = {
  id: string
  name: string
  players: Player[]
}

const storage = new Storage()

const positions: Position[] = ["投手", "捕手", "一塁手", "二塁手", "三塁手", "遊撃手", "外野手"]

export default function TeamsPage() {
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>(() => {
    // ローカルストレージから読み込み
    if (typeof window !== "undefined") {
      const storedTeams = storage.getTeams()
      // positionを文字列から配列に変換
      return storedTeams.map(team => ({
        ...team,
        players: team.players.map(player => ({
          ...player,
          position: player.position.split(", ").filter(Boolean) as Position[]
        }))
      }))
    }
    return []
  })

  const [newTeamName, setNewTeamName] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [newPlayer, setNewPlayer] = useState<Omit<Player, "id">>({
    name: "",
    number: "",
    position: [],
    type: "both",
  })
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [editedPlayer, setEditedPlayer] = useState<Player | null>(null)

  // チームを保存
  const saveTeams = (updatedTeams: Team[]) => {
    setTeams(updatedTeams)
    // positionを配列から文字列に変換
    const teamsToStore = updatedTeams.map(team => ({
      ...team,
      players: team.players.map(player => ({
        ...player,
        position: player.position.join(", ")
      }))
    }))
    storage.setTeams(teamsToStore)
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
      position: [],
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

  // 選手情報を更新
  const updatePlayer = () => {
    if (!selectedTeam || !editedPlayer) return

    const updatedPlayers = selectedTeam.players.map((player) =>
      player.id === editedPlayer.id ? editedPlayer : player
    )

    const updatedTeam = {
      ...selectedTeam,
      players: updatedPlayers,
    }

    const updatedTeams = teams.map((team) => (team.id === selectedTeam.id ? updatedTeam : team))

    saveTeams(updatedTeams)
    setSelectedTeam(updatedTeam)
    setEditingPlayer(null)
    setEditedPlayer(null)

    toast({
      title: "選手情報更新",
      description: `${editedPlayer.name}の情報が更新されました`,
    })
  }

  // 編集をキャンセル
  const cancelEdit = () => {
    setEditingPlayer(null)
    setEditedPlayer(null)
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
                          {editingPlayer?.id === player.id ? (
                            <div className="flex-1 space-y-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-name">選手名</Label>
                                  <Input
                                    id="edit-name"
                                    value={editedPlayer?.name || ""}
                                    onChange={(e) =>
                                      setEditedPlayer(prev => ({ ...prev!, name: e.target.value }))
                                    }
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-number">背番号</Label>
                                  <Input
                                    id="edit-number"
                                    value={editedPlayer?.number || ""}
                                    onChange={(e) =>
                                      setEditedPlayer(prev => ({ ...prev!, number: e.target.value }))
                                    }
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>ポジション</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {positions.map((pos) => (
                                      <div key={pos} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id={`edit-position-${pos}`}
                                          checked={editedPlayer?.position.includes(pos)}
                                          onChange={(e) => {
                                            const updatedPositions = e.target.checked
                                              ? [...(editedPlayer?.position || []), pos]
                                              : editedPlayer?.position.filter((p) => p !== pos) || []
                                            setEditedPlayer(prev => ({
                                              ...prev!,
                                              position: updatedPositions,
                                            }))
                                          }}
                                          className="h-4 w-4"
                                        />
                                        <Label htmlFor={`edit-position-${pos}`}>{pos}</Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="edit-type">タイプ</Label>
                                  <select
                                    id="edit-type"
                                    className="w-full p-2 rounded border"
                                    value={editedPlayer?.type}
                                    onChange={(e) =>
                                      setEditedPlayer(prev => ({
                                        ...prev!,
                                        type: e.target.value as "pitcher" | "batter" | "both",
                                      }))
                                    }
                                  >
                                    <option value="both">投手/打者</option>
                                    <option value="pitcher">投手のみ</option>
                                    <option value="batter">打者のみ</option>
                                  </select>
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEdit}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  キャンセル
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={updatePlayer}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  保存
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>
                                <span className="font-medium">{player.name}</span>
                                <div className="text-sm text-muted-foreground">
                                  {player.number && `#${player.number} `}
                                  {Array.isArray(player.position) ? player.position.join(", ") : player.position}
                                  {player.type === "pitcher" && " 投手"}
                                  {player.type === "batter" && " 打者"}
                                  {player.type === "both" && " 投手/打者"}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingPlayer(player)
                                    setEditedPlayer({ ...player })
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deletePlayer(player.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
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
                        <div className="grid grid-cols-2 gap-2">
                          {positions.map((pos) => (
                            <div key={pos} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`position-${pos}`}
                                checked={newPlayer.position.includes(pos)}
                                onChange={(e) => {
                                  const updatedPositions = e.target.checked
                                    ? [...newPlayer.position, pos]
                                    : newPlayer.position.filter((p) => p !== pos)
                                  setNewPlayer({ ...newPlayer, position: updatedPositions })
                                }}
                                className="h-4 w-4"
                              />
                              <Label htmlFor={`position-${pos}`}>{pos}</Label>
                            </div>
                          ))}
                        </div>
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
