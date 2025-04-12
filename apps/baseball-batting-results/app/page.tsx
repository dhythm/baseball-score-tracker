"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Save } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

const formSchema = z.object({
  playerName: z.string().min(1, {
    message: "選手名を入力してください。",
  }),
  date: z.date({
    required_error: "日付を選択してください。",
  }),
  opponent: z.string().min(1, {
    message: "対戦相手を入力してください。",
  }),
  battingResults: z
    .array(
      z.object({
        inning: z.string().min(1, { message: "回を入力してください。" }),
        result: z.string().min(1, { message: "結果を入力してください。" }),
      }),
    )
    .min(1, {
      message: "少なくとも1つの打席結果を入力してください。",
    }),
})

export default function BattingResultForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerName: "",
      opponent: "",
      battingResults: [{ inning: "1", result: "" }],
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    // ここでデータを保存する処理を実装
    alert("打席結果が保存されました！")
  }

  function addBattingResult() {
    const currentResults = form.getValues().battingResults || []
    form.setValue("battingResults", [...currentResults, { inning: String(currentResults.length + 1), result: "" }])
  }

  function removeBattingResult(index: number) {
    const currentResults = form.getValues().battingResults
    if (currentResults.length > 1) {
      form.setValue(
        "battingResults",
        currentResults.filter((_, i) => i !== index),
      )
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">打席結果入力</CardTitle>
          <CardDescription>野球の試合での打席結果を記録します。</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="playerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>選手名</FormLabel>
                      <FormControl>
                        <Input placeholder="山田 太郎" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>試合日</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? (
                                format(field.value, "yyyy年MM月dd日", { locale: ja })
                              ) : (
                                <span>日付を選択</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={ja} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="opponent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>対戦相手</FormLabel>
                      <FormControl>
                        <Input placeholder="巨人" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">打席結果</h3>
                  <Button type="button" variant="outline" onClick={addBattingResult}>
                    打席を追加
                  </Button>
                </div>

                {form.watch("battingResults")?.map((_, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-end border p-4 rounded-md">
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`battingResults.${index}.inning`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>回</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="回" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }).map((_, i) => (
                                    <SelectItem key={i} value={String(i + 1)}>
                                      {i + 1}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-8">
                      <FormField
                        control={form.control}
                        name={`battingResults.${index}.result`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>結果</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="結果を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="安打">安打</SelectItem>
                                  <SelectItem value="二塁打">二塁打</SelectItem>
                                  <SelectItem value="三塁打">三塁打</SelectItem>
                                  <SelectItem value="本塁打">本塁打</SelectItem>
                                  <SelectItem value="四球">四球</SelectItem>
                                  <SelectItem value="死球">死球</SelectItem>
                                  <SelectItem value="犠打">犠打</SelectItem>
                                  <SelectItem value="犠飛">犠飛</SelectItem>
                                  <SelectItem value="三振">三振</SelectItem>
                                  <SelectItem value="ゴロ">ゴロ</SelectItem>
                                  <SelectItem value="フライ">フライ</SelectItem>
                                  <SelectItem value="併殺打">併殺打</SelectItem>
                                  <SelectItem value="失策">失策</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeBattingResult(index)}
                        disabled={form.watch("battingResults").length <= 1}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                保存する
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <p>※ 入力した内容は自動的に保存されます</p>
        </CardFooter>
      </Card>
    </div>
  )
}
