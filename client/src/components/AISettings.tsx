import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Trash2, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface AIProvider {
  id: number;
  provider: "groq" | "openrouter" | "cerebras";
  apiKey: string;
  endpoint?: string;
  isActive: number;
}

interface AISettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AISettings({ open, onOpenChange }: AISettingsProps) {
  const [selectedProvider, setSelectedProvider] = useState<"groq" | "openrouter" | "cerebras" | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const listQuery = trpc.aiProvider.list.useQuery();
  const createMutation = trpc.aiProvider.create.useMutation();
  const deleteMutation = trpc.aiProvider.delete.useMutation();
  const testMutation = trpc.aiProvider.testConnection.useMutation();

  const providers = [
    {
      id: "groq",
      name: "Groq",
      description: "Fast and efficient LLM inference",
      docs: "https://console.groq.com",
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      description: "Access multiple LLM providers",
      docs: "https://openrouter.ai",
    },
    {
      id: "cerebras",
      name: "Cerebras",
      description: "Ultra-fast AI inference",
      docs: "https://cerebras.ai",
    },
  ];

  const handleAddProvider = async () => {
    if (!selectedProvider || !apiKey) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createMutation.mutateAsync({
        provider: selectedProvider,
        apiKey,
        endpoint: endpoint || undefined,
      });
      toast.success("Provider added successfully");
      setApiKey("");
      setEndpoint("");
      setSelectedProvider(null);
      listQuery.refetch();
    } catch (error) {
      toast.error("Failed to add provider");
    }
  };

  const handleTestConnection = async () => {
    if (!selectedProvider || !apiKey) {
      toast.error("Please fill in all required fields");
      return;
    }

    setTesting(true);
    try {
      const result = await testMutation.mutateAsync({
        provider: selectedProvider,
        apiKey,
        endpoint: endpoint || undefined,
      });
      setTestResult(result);
      if (result.success) {
        toast.success("Connection successful!");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleDeleteProvider = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Provider removed");
      listQuery.refetch();
    } catch (error) {
      toast.error("Failed to remove provider");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Provider Settings (BYOK)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Active Providers */}
          {listQuery.data && listQuery.data.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Active Providers</h3>
              {listQuery.data.map((provider) => (
                <Card key={provider.id} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground capitalize">{provider.provider}</p>
                    <p className="text-sm text-muted-foreground">
                      API Key: {provider.apiKey.substring(0, 10)}...
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProvider(provider.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {/* Add New Provider */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-foreground">Add New Provider</h3>

            {/* Provider Selection */}
            <div className="grid grid-cols-3 gap-3">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedProvider(provider.id as any);
                    setTestResult(null);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    selectedProvider === provider.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm text-foreground">{provider.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{provider.description}</p>
                </button>
              ))}
            </div>

            {/* API Key Input */}
            {selectedProvider && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <Input
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="glass-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Endpoint (Optional)</label>
                  <Input
                    placeholder="https://api.example.com/v1/chat/completions"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="glass-input"
                  />
                </div>

                {/* Test Result */}
                {testResult && (
                  <div
                    className={`p-3 rounded-lg flex items-center gap-2 ${
                      testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertCircle size={18} />
                    )}
                    <p className="text-sm">{testResult.message}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleTestConnection}
                    disabled={testing}
                    variant="outline"
                    className="flex-1"
                  >
                    {testing && <Loader2 size={16} className="mr-2 animate-spin" />}
                    Test Connection
                  </Button>
                  <Button
                    onClick={handleAddProvider}
                    disabled={createMutation.isPending}
                    className="glass-button flex-1"
                  >
                    {createMutation.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
                    Add Provider
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-medium mb-2">About BYOK</p>
            <p>
              Bring Your Own Key (BYOK) allows you to use your own API keys from Groq, OpenRouter, or Cerebras.
              When configured, these providers will be used for AI-powered suggestions. If no BYOK provider is
              configured, the built-in LLM will be used automatically.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
