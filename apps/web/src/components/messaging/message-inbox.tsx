"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, CheckCircle2 } from "lucide-react";
import { ThreadView } from "./thread-view";
import { TroskyPageHeader } from "@/components/trosky/trosky-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import type { MessageThreadSummary } from "@hotel-pricing/shared";

interface MessageInboxProps {
  threads: MessageThreadSummary[];
  hotels: { id: string; name: string }[];
  currentUserId: string;
  isAnalyst: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function MessageInbox({
  threads: initialThreads,
  hotels,
  currentUserId,
  isAnalyst,
}: MessageInboxProps) {
  const [threads, setThreads] = useState(initialThreads);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadHotelId, setNewThreadHotelId] = useState<string>(
    hotels[0]?.id ?? ""
  );

  const updateThread = (updatedThread: MessageThreadSummary) => {
    setThreads((prev) => {
      const existingIndex = prev.findIndex((thread) => thread.id === updatedThread.id);
      const next =
        existingIndex === -1
          ? [updatedThread, ...prev]
          : prev.map((thread) =>
              thread.id === updatedThread.id ? updatedThread : thread
            );

      return next.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  };

  if (selectedThread) {
    return (
      <ThreadView
        threadId={selectedThread}
        currentUserId={currentUserId}
        isAnalyst={isAnalyst}
        onBack={() => {
          setSelectedThread(null);
        }}
        onThreadChange={updateThread}
      />
    );
  }

  if (showNewThread && newThreadHotelId) {
    return (
      <div className="space-y-3">
        {hotels.length > 1 && (
          <Select value={newThreadHotelId} onValueChange={setNewThreadHotelId}>
            <SelectTrigger
              aria-label="Select hotel for new thread"
              className="w-full max-w-xs"
            >
              <SelectValue placeholder="Select hotel" />
            </SelectTrigger>
            <SelectContent>
              {hotels.map((hotel) => (
                <SelectItem key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <ThreadView
          threadId={null}
          hotelId={newThreadHotelId}
          currentUserId={currentUserId}
          isAnalyst={isAnalyst}
          onBack={() => {
            setShowNewThread(false);
          }}
          onThreadChange={updateThread}
        />
      </div>
    );
  }

  const openThreads = threads.filter((t) => !t.resolvedAt);
  const resolvedThreads = threads.filter((t) => t.resolvedAt);

  return (
    <div className="space-y-6">
      <TroskyPageHeader
        eyebrow="Client comms"
        title="Messages"
        description={
          isAnalyst
            ? "Manage client communication across hotels"
            : "Message your revenue management team"
        }
        actions={
          hotels.length > 0 ? (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setShowNewThread(true)}
            >
              <Plus className="h-4 w-4" />
              New Thread
            </Button>
          ) : undefined
        }
      />

      {openThreads.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Open Threads</h2>
          <div className="space-y-2">
            {openThreads.map((thread) => (
              <Card
                key={thread.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedThread(thread.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {thread.hotelName}
                        </Badge>
                        {thread.unreadCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1.5"
                          >
                            {thread.unreadCount} new
                          </Badge>
                        )}
                      </div>
                      {thread.lastMessage && (
                        <p className="text-sm mt-1 truncate">
                          <span className="font-medium">
                            {thread.lastMessage.senderName}:
                          </span>{" "}
                          {thread.lastMessage.body}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {timeAgo(thread.updatedAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {resolvedThreads.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Resolved
          </h2>
          <div className="space-y-2">
            {resolvedThreads.map((thread) => (
              <Card
                key={thread.id}
                className="cursor-pointer hover:shadow-sm transition-shadow opacity-60"
                onClick={() => setSelectedThread(thread.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                        <Badge variant="secondary" className="text-[10px]">
                          {thread.hotelName}
                        </Badge>
                      </div>
                      {thread.lastMessage && (
                        <p className="text-xs mt-1 text-muted-foreground truncate">
                          {thread.lastMessage.body}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {timeAgo(thread.updatedAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {threads.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Conversations will appear here once started."
          action={
            hotels.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewThread(true)}
              >
                Start a conversation
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
