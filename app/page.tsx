import { BaseballScoreTracker } from "@/components/baseball-score-tracker"

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">野球スコアトラッカー</h1>
      <BaseballScoreTracker />
    </main>
  )
}
