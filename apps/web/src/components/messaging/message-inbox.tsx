"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, CheckCircle2 } from "lucide-react";
import { ThreadView } from "./thread-view";
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

  const selectedHotelId = hotels[0]?.id;

  if (selectedThread) {
    return (
      <ThreadView
        threadId={selectedThread}
        currentUserId={currentUserId}
        isAnalyst={isAnalyst}
        onBack={() => {
          setSelectedThread(null);
          window.location.reload();
        }}
      />
    );
  }

  if (showNewThread && selectedHotelId) {
    return (
      <ThreadView
        threadId={null}
        hotelId={selectedHotelId}
        currentUserId={currentUserId}
        isAnalyst={isAnalyst}
        onBack={() => {
          setShowNewThread(false);
          window.location.reload();
        }}
      />
    );
  }

  const openThreads = threads.filter((t) => !t.resolvedAt);
  const resolvedThreads = threads.filter((t) => t.resolvedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground text-sm">
            {isAnalyst
              ? "Manage client communication across hotels"
              : "Message your revenue management team"}
          </p>
        </div>
        {selectedHotelId && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowNewThread(true)}
          >
            <Plus className="h-4 w-4" />
            New Thread
          </Button>
        )}
      </div>

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
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
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
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No messages yet.</p>
          {selectedHotelId && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowNewThread(true)}
            >
              Start a conversation
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
