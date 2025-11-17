import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listShares, deleteSharedPlan } from "@/live/api/share";
import type { ShareListItem } from "@/lib/share/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Share2, Lock, Trash2, ExternalLink, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/layouts/AppLayout";

export default function ShareHistory() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ShareListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const rows = await listShares();
      setItems(rows);
    } catch (e) {
      toast.error("Failed to load share history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    try {
      await deleteSharedPlan(id);
      toast.success("Share link removed");
      load();
    } catch (e) {
      toast.error("Failed to remove share");
    }
  }

  function handleCopy(id: string) {
    const url = `${window.location.origin}/p/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleView(id: string) {
    window.open(`/p/${id}`, "_blank");
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4 animate-fade-in">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Share History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your shared debt payoff plans
          </p>
        </div>

      {items.length === 0 && (
        <Card className="glass-intense border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Share2 className="h-12 w-12 text-primary mb-4" />
            <p className="text-lg font-medium text-foreground">No shared plans yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Share your debt payoff plan to get started
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {items.map((item) => {
          const url = `${window.location.origin}/p/${item.id}`;
          const expired = item.expiresAt && new Date(item.expiresAt).getTime() < Date.now();
          const isCopied = copiedId === item.id;

          return (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      {item.requiresPin && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          PIN Protected
                        </Badge>
                      )}
                      {expired && (
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <span className="font-medium">Shared:</span>{" "}
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                      {item.expiresAt && (
                        <div>
                          <span className="font-medium">Expires:</span>{" "}
                          {new Date(item.expiresAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {url}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(item.id)}
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(item.id)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      </div>
    </AppLayout>
  );
}
