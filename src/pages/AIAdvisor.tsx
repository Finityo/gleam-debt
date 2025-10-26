import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Bot, User, AlertTriangle, ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const AIAdvisor = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Please log in to use the AI advisor");
      }
      
      // Optionally fetch user's debt data for context
      let debtContext = null;
      if (session) {
        const { data: debts } = await supabase
          .from("debts")
          .select("name, balance, apr, min_payment")
          .eq("user_id", session.user.id);
        
        if (debts && debts.length > 0) {
          debtContext = {
            totalDebts: debts.length,
            totalBalance: debts.reduce((sum, d) => sum + (d.balance || 0), 0),
            avgAPR: (debts.reduce((sum, d) => sum + (d.apr || 0), 0) / debts.length).toFixed(2),
          };
        }
      }

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-financial-advisor`;
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          messages: newMessages,
          debtContext 
        }),
      });

      if (!resp.ok) {
        const error = await resp.json();
        throw new Error(error.error || "Failed to get response");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    streamChat(userMessage);
  };

  return (
    <>
      <SEOHead
        title="AI Financial Advisor - Finityo"
        description="Get personalized debt management advice from our AI financial advisor"
      />
      <div className="min-h-screen bg-gradient-subtle p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card className="flex flex-col" style={{ height: 'calc(100vh - 6rem)' }}>
            <div className="p-6 border-b space-y-4 flex-shrink-0">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Bot className="h-8 w-8 text-primary" />
                  AI Financial Advisor
                </h1>
                <p className="text-muted-foreground mt-2">
                  Ask me anything about managing your debt and finances
                </p>
              </div>
              
              <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                  <strong>Disclaimer:</strong> This AI chatbot is for informational and educational purposes only. It does not constitute professional financial, legal, or tax advice. The information provided should not be relied upon as a substitute for consultation with qualified financial advisors, accountants, or legal professionals. Always consult with licensed professionals before making financial decisions. Finityo assumes no liability for actions taken based on information provided by this AI tool.
                </AlertDescription>
              </Alert>
            </div>

            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Welcome to your AI Financial Advisor!</p>
                  <p className="text-sm">Ask me questions like:</p>
                  <ul className="text-sm mt-4 space-y-2">
                    <li>"What's the best strategy to pay off my debt?"</li>
                    <li>"Should I use the avalanche or snowball method?"</li>
                    <li>"How can I reduce my interest payments?"</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0">
                          <Bot className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg p-4 max-w-[80%] ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.role === "user" && (
                        <div className="flex-shrink-0">
                          <User className="h-8 w-8 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <form onSubmit={handleSubmit} className="p-6 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me about your debt management strategy..."
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="h-[60px] w-[60px]"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AIAdvisor;
