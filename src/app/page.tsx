"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  Copy,
  Save,
  Send,
  MoonStar,
  Sun,
  CircleStop,
  Play,
  Trash2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface messagePayload {
  chatID?: string;
  content?: string;
  tts?: boolean;
}

interface WebhookHistoryItem {
  timestamp: string;
  payload: messagePayload;
  botToken: string;
}

interface WebhookEditPayload {
  name?: string;
  avatar?: string;
}

export default function WebhookTool() {
  const [botToken, setBotToken] = useState("");
  const [savedBots, setSavedBots] = useState<
    { name: string; token: string }[]
  >([]);
  const [tokenName, setTokenName] = useState("");
  const [chatID, setChatID] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<WebhookHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("message");
  const [isSpamming, setIsSpamming] = useState(false);
  const [useSpam, setUseSpam] = useState(false);
  const spamRef = useRef<{ stop: boolean }>({ stop: false });
  const [displayName, setDisplayName] = useState("");

  const formatContent = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  const isValidToken = (token: string) => {
    const regex = /\d{8,10}:[A-Za-z0-9_-]{35}/;
    return regex.test(token);
  };

  const isValidID = (id: string) => {
    const regex = /\d{5,11}/;
    return regex.test(id);
  };

  const deleteSavedBot = (index: number) => {
    const newBots = [...savedBots];
    newBots.splice(index, 1);
    setSavedBots(newBots);
    localStorage.setItem("savedBots", JSON.stringify(newBots));

    toast.success("Bot deleted", {
      description: "The token has been removed from your saved list",
    });
  }

  useEffect(() => {
    const saved = localStorage.getItem("savedBots");
    if (saved) {
      setSavedBots(JSON.parse(saved));
    }

    const historyData = localStorage.getItem("webhookHistory");
    if (historyData) {
      setHistory(JSON.parse(historyData));
    }
  }, []);

  const { setTheme } = useTheme();
  const saveToken = () => {
    if (!botToken || !tokenName) {
      toast.error("Error", {
        description: "Please provide both a name and URL for the webhook",
      });
      return;
    }

    const newBot = [...savedBots, { name: tokenName, token: botToken }];
    setSavedBots(newBot);
    localStorage.setItem("savedBots", JSON.stringify(newBot));

    toast.success("Webhook saved", {
      description: `Webhook "${tokenName}" has been saved`,
    });

    setTokenName("");
  };

  const selectWebhook = (url: string) => {
    setBotToken(url);
  };

  const editWebhook = async () => {
    if (!isValidToken(botToken)) {
      toast.error("Error", {
        description: "Please enter a valid Discord webhook URL",
      });
      return;
    }

    setLoading(true);

    try {
      const payload: WebhookEditPayload = {};
      if (chatID) payload.name = chatID;
      if (avatarUrl) {
        const res = await fetch(avatarUrl);
        const blob = await res.blob();
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        payload.avatar = base64;
      }

      const response = await fetch(botToken, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success("Webhook edited", {
        description: "The webhook has been updated successfully",
      });
    } catch (error) {
      toast.error("Error editing webhook", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!isValidToken(botToken)) {
      toast.error("Error", {
        description: "Please enter a valid Telegram Bot Token",
      });
      return;
    }

    if (!isValidID(chatID)) {
      toast.error("Error", {
        description: "Please enter a valid Telegram Chat ID",
      });
      return;
    }

    setLoading(true);

    try {
      const payload: messagePayload = {};

      if (chatID) payload.chatID = chatID;
      if (content) payload.content = content;

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatID}&text=${content.replaceAll(
          "\n",
          "%0A"
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const historyItem: WebhookHistoryItem = {
        timestamp: new Date().toISOString(),
        payload,
        botToken,
      };

      const newHistory = [historyItem, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem("webhookHistory", JSON.stringify(newHistory));
      const data = await response.json();
      setDisplayName(data.result.chat.first_name);

      toast.success("Webhook sent", {
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      toast.error("Error sending webhook", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const startSpam = async () => {
    if (!isValidToken(botToken)) {
      toast.error("Error", {
        description: "Please enter a valid Telegram Bot Token",
      });
      return;
    }

    if (!isValidID(chatID)) {
      toast.error("Error", {
        description: "Please enter a valid Telegram Chat ID",
      });
      return;
    }

    setIsSpamming(true);
    spamRef.current.stop = false;
    const payload: messagePayload = {};
    if (chatID) payload.chatID = chatID;
    if (content) payload.content = content;
    const spam = async () => {
      toast.info("Spamming started", {
        description: "Spamming the webhook.",
      });
      while (!spamRef.current.stop) {
        let response: Response | undefined;
        try {
          const response = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatID}&text=${content.replaceAll(
              "\n",
              "%0A"
            )}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }

          const data = await response.json();
          setDisplayName(data.result.chat.first_name);
        } catch (error) {
          if (!response || response.status !== 429) {
            toast.error("Error sending webhook", {
              description:
                error instanceof Error ? error.message : String(error),
            });
            spamRef.current.stop = true;
            setIsSpamming(false);
          }
        }
      }
    };
    spam();
  };

  const stopSpam = () => {
    spamRef.current.stop = true;
    setIsSpamming(false);
    toast.info("Spam stopped", {
      description: "Stopped spamming the webhook.",
    });
  };

  const clearForm = () => {
    setContent("");
  };

  return (
    <div className="container mx-auto py-8 px-4 relative">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Telegram Bot Multi-tool
      </h1>

      <Tabs
        defaultValue="message"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="message">Message</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="message" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bot Configuration</CardTitle>
              <CardDescription>
                Enter your bot token and customize the sender
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bot-token">Bot Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="bot-token"
                    placeholder="1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    disabled={isSpamming}
                  />
                  {savedBots.length > 0 && (
                    <div className="relative">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full">
                            Saved
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-0">
                          <div className="max-h-[300px] overflow-auto">
                            {savedBots.map((bots, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                                onClick={() => selectWebhook(bots.token)}
                              >
                                <span className="truncate">{bots.name}</span>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chatID">Chat ID</Label>
                  <Input
                    id="chatID"
                    placeholder="1234567890"
                    value={chatID}
                    onChange={(e) => setChatID(e.target.value)}
                    disabled={isSpamming}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Message Content</CardTitle>
                  <CardDescription>
                    Compose your webhook message
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">Text Message</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter your message here..."
                      className="min-h-[100px]"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={isSpamming}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="spam"
                      checked={useSpam}
                      onCheckedChange={setUseSpam}
                      disabled={isSpamming}
                    />
                    <Label htmlFor="spam">Spam</Label>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={clearForm}
                    disabled={isSpamming}
                  >
                    Clear
                  </Button>
                  {useSpam ? (
                    isSpamming ? (
                      <Button variant="destructive" onClick={stopSpam}>
                        <CircleStop className="size-4" />
                        Stop Spam
                      </Button>
                    ) : (
                      <Button
                        onClick={startSpam}
                        disabled={loading || !botToken || !content}
                      >
                        <Play className="size-4" />
                        Start Spam
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={sendMessage}
                      disabled={loading || !botToken || !content || !chatID}
                    >
                      <Send className="size-4" />
                      {loading ? "Sending..." : "Send Message"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    How your message will appear in Discord
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-[#36393f] text-white rounded-md p-4 min-h-[300px]">
                    {chatID && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">
                          {displayName || chatID}
                        </span>
                      </div>
                    )}

                    {formatContent(content)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="edit" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Webhook</CardTitle>
              <CardDescription>
                Modify the webhook&apos;s settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bot-token">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="bot-token"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    disabled={isSpamming}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chatID">Edit ChatID</Label>
                  <Input
                    id="chatID"
                    placeholder="Custom Bot Name"
                    value={chatID}
                    onChange={(e) => setChatID(e.target.value)}
                    disabled={isSpamming}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar-url">Avatar URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="avatar-url"
                      placeholder="https://example.com/avatar.png"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      disabled={isSpamming}
                    />
                    <Avatar>
                      <AvatarImage src={avatarUrl} alt="Avatar" />
                      <AvatarFallback>
                        {chatID ? chatID.charAt(0).toUpperCase() : "D"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={editWebhook}
                disabled={loading || !botToken || (!chatID && !avatarUrl)}
                className="md:w-min w-full"
              >
                <Save className="mr-2 size-4" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Tokens</CardTitle>
              <CardDescription>
                Manage your saved Telegram Tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="token-name">Token Name</Label>
                  <Input
                    id="token-name"
                    placeholder="My Telegram Bot"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenSave">Bot Token</Label>
                  <Input
                    id="tokenSave"
                    placeholder="1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={saveToken} className="w-full">
                <Save className="mr-2 size-4" />
                Save Bot
              </Button>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Your Saved Webhooks</h3>
                {savedBots.length === 0 ? (
                  <p className="text-muted-foreground">
                    No webhooks saved yet. Add one above.
                  </p>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="space-y-2">
                      {savedBots.map((bots, index) => (
                        <Card key={index}>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{bots.name}</h4>
                                <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                                  {bots.token}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    navigator.clipboard.writeText(bots.token);
                                    toast.info("Copied", {
                                      description:
                                        "Webhook URL copied to clipboard",
                                    });
                                  }}
                                >
                                  <Copy className="size-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setBotToken(bots.token);
                                    setActiveTab("message");
                                  }}
                                >
                                  <Check className="size-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => deleteSavedBot(index)}
                                >
                                  <Trash2 />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <footer className="mt-8 text-right flex justify-end gap-2">
        <Link
          target="_blank"
          href="https://discord.com/servers/uncover-it-1298592315694387220"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <Image
            src="/discord.svg"
            alt="Discord"
            width="19"
            height="19"
            className="dark:brightness-100 brightness-0"
          />
        </Link>
        <Link
          target="_blank"
          href="https://github.com/WarFiN123/telegram-multitool"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <Image
            src="/github.svg"
            alt="GitHub"
            width="19"
            height="19"
            className="dark:brightness-100 brightness-0"
          />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <MoonStar className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </footer>
    </div>
  );
}
