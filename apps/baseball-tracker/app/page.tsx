import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-8">野球試合トラッカー</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>チーム管理</CardTitle>
            <CardDescription>チームと選手の登録・編集</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">チームと選手を登録して、試合で使用できるようにします。</p>
            <Link href="/teams">
              <Button className="w-full">チーム管理へ</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>試合トラッカー</CardTitle>
            <CardDescription>リアルタイムで試合データを記録</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">新しい試合を開始するか、進行中の試合を続行します。</p>
            <Link href="/games">
              <Button className="w-full">試合トラッカーへ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
