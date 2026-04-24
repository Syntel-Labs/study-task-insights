import { useState } from "react";
import { AlertTriangle, Copy, Play, Send, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Separator } from "@components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Textarea } from "@components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@components/ui/toggle-group";
import { useLlmApi } from "@hooks/api/llm";

type ApiError = { status?: number; message?: string };

export default function LlmPage() {
  const { t } = useTranslation();
  const { recommendations, chat } = useLlmApi();
  const [tab, setTab] = useState<"recommendations" | "chat">("recommendations");
  const [limitWeeks, setLimitWeeks] = useState(4);
  const [chatInput, setChatInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"md" | "raw">("md");

  function handleError(err: ApiError) {
    if (err?.status === 503) setError(t("llm.error_modelUnavailable"));
    else setError(err?.message || t("llm.error_generic"));
    setOutput("");
  }

  async function handleRecommendations() {
    setBusy(true);
    setError(null);
    try {
      const data = await recommendations({ limitWeeks });
      setOutput((data?.data?.text as string) || JSON.stringify(data, null, 2));
    } catch (err) {
      handleError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  async function handleChat() {
    if (!chatInput.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const data = await chat([{ role: "user", content: chatInput.trim() }]);
      setOutput((data?.data?.text as string) || JSON.stringify(data, null, 2));
    } catch (err) {
      handleError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setChatInput("");
    setOutput("");
    setError(null);
  }

  async function copyOut() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    toast.success(t("llm.copied") || "Copiado");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden p-0">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as typeof tab)}
          className="gap-0"
        >
          <div className="border-b px-4 pt-3">
            <TabsList>
              <TabsTrigger value="recommendations">
                {t("llm.tab_recommendations")}
              </TabsTrigger>
              <TabsTrigger value="chat">{t("llm.tab_chat")}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recommendations" className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="llm-weeks">{t("dashboard.weeksLabel")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="llm-weeks"
                    type="number"
                    min={1}
                    max={16}
                    value={limitWeeks}
                    onChange={(e) => setLimitWeeks(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-muted-foreground text-sm">sem</span>
                </div>
              </div>
              <Button onClick={handleRecommendations} disabled={busy}>
                <Play className="size-4" />
                {t("llm.generate")}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="flex flex-col gap-3 p-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="llm-chat">{t("llm.tab_chat")}</Label>
              <Textarea
                id="llm-chat"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t("llm.placeholder_chat")}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={clearAll}>
                <Trash2 className="size-4" />
                {t("llm.clear")}
              </Button>
              <Button onClick={handleChat} disabled={busy}>
                <Send className="size-4" />
                {t("llm.send")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertTriangle />
            <AlertTitle>{t("common.error")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between gap-2 px-4 pt-4">
          <h2 className="text-foreground text-sm font-semibold">
            {t("llm.response")}
          </h2>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              size="sm"
              value={view}
              onValueChange={(v) => v && setView(v as typeof view)}
              variant="outline"
            >
              <ToggleGroupItem value="md" className="min-w-[7rem]">
                {t("llm.view_md")}
              </ToggleGroupItem>
              <ToggleGroupItem value="raw" className="min-w-[7rem]">
                {t("llm.view_raw")}
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              size="icon"
              variant="ghost"
              onClick={copyOut}
              disabled={!output}
              aria-label="Copy"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-40 p-4">
          {!output && !busy && !error && (
            <p className="text-muted-foreground text-sm">
              {tab === "recommendations"
                ? t("llm.placeholder_empty_rec")
                : t("llm.placeholder_empty_chat")}
            </p>
          )}

          {busy && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {t("llm.thinking")}
              </span>
              <span className="inline-flex items-end gap-1">
                <span className="bg-primary size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
                <span className="bg-primary size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
                <span className="bg-primary size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
              </span>
            </div>
          )}

          {!busy && output && view === "md" && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {output}
              </ReactMarkdown>
            </div>
          )}

          {!busy && output && view === "raw" && (
            <pre className="bg-muted text-muted-foreground overflow-x-auto rounded-md p-3 text-xs">
              {output}
            </pre>
          )}
        </div>
      </Card>
    </div>
  );
}
