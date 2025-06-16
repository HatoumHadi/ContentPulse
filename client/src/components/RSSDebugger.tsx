import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface DiagnosticResult {
  originalUrl: string;
  htmlAccessible: boolean;
  discoveredFeeds: string[];
  feedTests: Array<{
    url: string;
    accessible: boolean;
    status: number;
    contentLength: number;
    articlesFound: number;
    error: string | null;
  }>;
  recommendations: string[];
}

interface RSSDebuggerProps {
  onClose?: () => void;
}

async function apiRequest(url: string, method: string, data?: any): Promise<DiagnosticResult> {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json() as Promise<DiagnosticResult>;
}

export default function RSSDebugger({ onClose }: RSSDebuggerProps) {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<DiagnosticResult | null>(null);

  const diagnosticMutation = useMutation<DiagnosticResult, Error, { url: string }>({
    mutationFn: (data) => apiRequest("/api/diagnose-rss", "POST", data),
    onSuccess: (data) => {
      setResults(data);
    },
    onError: (error) => {
      console.error("Diagnostic failed:", error);
    }
  });

  const handleDiagnose = () => {
    if (!url.trim()) return;
    diagnosticMutation.mutate({ url: url.trim() });
  };

  const workingFeeds = results?.feedTests.filter(test => test.accessible && test.articlesFound > 0) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            RSS Feed Diagnostics
          </CardTitle>
          <CardDescription>
            Analyze a website URL to identify why articles aren't being retrieved
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter website URL (e.g., https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleDiagnose()}
            />
            <Button 
              onClick={handleDiagnose}
              disabled={diagnosticMutation.isPending || !url.trim()}
            >
              {diagnosticMutation.isPending ? "Analyzing..." : "Analyze"}
            </Button>
          </div>

          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results for {results.originalUrl}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {results.htmlAccessible ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>
                  Website {results.htmlAccessible ? "accessible" : "not accessible"}
                </span>
              </div>

              <div>
                <h4 className="font-medium mb-2">Discovered RSS Feeds</h4>
                {results.discoveredFeeds.length > 0 ? (
                  <div className="space-y-1">
                    {results.discoveredFeeds.map((feed, index) => (
                      <Badge key={index} variant="secondary" className="mr-2 mb-1">
                        {feed}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No RSS feeds found in HTML</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>RSS Feed Tests</CardTitle>
              <CardDescription>
                Testing {results.feedTests.length} potential RSS feed URLs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.feedTests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {test.accessible && test.articlesFound > 0 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : test.accessible ? (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium truncate max-w-md">{test.url}</p>
                        <p className="text-sm text-muted-foreground">
                          {test.accessible 
                            ? `${test.articlesFound} articles found (${test.contentLength} chars)`
                            : test.error || `HTTP ${test.status}`
                          }
                        </p>
                      </div>
                    </div>
                    <Badge variant={test.accessible && test.articlesFound > 0 ? "default" : "secondary"}>
                      {test.accessible && test.articlesFound > 0 ? "Working" : "Failed"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Summary & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workingFeeds.length > 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Great! Found {workingFeeds.length} working RSS feed(s). Articles should be retrievable from this website.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    No working RSS feeds found. This website may not provide RSS feeds for content monitoring.
                  </AlertDescription>
                </Alert>
              )}

              {results.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {results.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-xs mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}