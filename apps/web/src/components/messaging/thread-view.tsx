"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Send, CheckCircle2, RotateCcw } from "lucide-react";
import {
  getThread,
  sendMessage,
  resolveThread,
  reopenThread,
} from "@/actions/messages";
import { toast } from "@/hooks/use-toast";
import type { MessageItem, MessageThreadSummary } from "@hotel-pricing/shared";
import { cn } from "@/lib/utils";

interface ThreadViewProps {
  threadId: string | null;
  hotelId?: string;
  currentUserId: string;
  isAnalyst: boolean;
  onBack: () => void;
}

export function ThreadView({
  threadId,
  hotelId,
  currentUserId,
  isAnalyst,
  onBack,
}: ThreadViewProps) {
  const [thread, setThread] = useState<MessageThreadSummary | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(!!threadId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadId) {
      setLoading(true);
      getThread(threadId)
        .then((data) => {
          setThread(data.thread);
          setMessages(data.messages);
        })
        .catch(() => {
          toast({ title: "Error loading thread", variant: "destructive" });
        })
        .finally(() => setLoading(false));
    }
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!body.trim()) return;
    setSending(true);
    try {
      const targetHotelId = thread?.hotelId || hotelId;
      if (!targetHotelId) return;
      const result = await sendMessage({
        threadId: threadId || undefined,
        hotelId: targetHotelId,
        body: body.trim(),
      });
      setBody("");
      // Reload the thread to get the new message
      if (result.threadId) {
        const data = await getThread(result.threadId);
        setThread(data.thread);
        setMessages(data.messages);
      }
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  async function handleResolve() {
    if (!threadId) return;
    try {
      await resolveThread(threadId);
      toast({ title: "Thread resolved" });
      onBack();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  async function handleReopen() {
    if (!threadId) return;
    try {
      await reopenThread(threadId);
      toast({ title: "Thread reopened" });
      const data = await getThread(threadId);
      setThread(data.thread);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">
              {thread?.hotelName || "New Conversation"}
            </h2>
            {thread?.resolvedAt && (
              <Badge variant="success" className="text-[10px]">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Resolved
              </Badge>
            )}
          </div>
        </div>
        {isAnalyst && threadId && (
          <div>
            {thread?.resolvedAt ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleReopen}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reopen
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleResolve}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Resolve
              </Button>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Loading messages...
          </div>
        ) : messages.length === 0 && !threadId ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Start the conversation by sending a message below.
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderUserId === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  isOwn ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2.5",
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold opacity-80">
                      {msg.senderName}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[8px] px-1 py-0",
                        isOwn && "border-primary-foreground/30 text-primary-foreground/80"
                      )}
                    >
                      {msg.senderRole}
                    </Badge>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1 opacity-60",
                      isOwn ? "text-right" : "text-left"
                    )}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !body.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
