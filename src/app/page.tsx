"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Download, Copy, Sparkles, Github, Zap } from "lucide-react";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      setError("Please enter a repository URL");
      return;
    }

    // Validate GitHub URL
    const githubRegex = /^https:\/\/github\.com\/[^\/]+\/[^\/]+$/;
    if (!githubRegex.test(repoUrl)) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      console.log("Sending request to generate README for:", repoUrl);
      
      const response = await fetch("/api/generate-readme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      });

      console.log("Response status:", response.status);
      
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate README");
      }

      setResult(data.readme);
    } catch (err) {
      console.error("Error generating README:", err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {/* Animated background (subtle, minimal) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] bg-purple-400 rounded-full blur-3xl opacity-10" />
        <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] bg-blue-400 rounded-full blur-3xl opacity-10" />
      </div>

      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4">GitReadme AI</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-xl mx-auto font-normal">
            Instantly generate a beautiful, professional README for any GitHub repository.
          </p>
        </div>

        {/* Input Section */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto mb-16">
          <div className="glass p-8 flex flex-col gap-6 items-center shadow-xl rounded-3xl">
            <Input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Paste a GitHub repo URL (e.g. https://github.com/vercel/next.js)"
              className="w-full px-6 py-5 text-lg bg-white/10 backdrop-blur-md border-none rounded-full focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-gray-400 shadow-sm transition-all"
              disabled={loading}
              aria-label="GitHub repository URL"
              autoFocus
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md transition-all duration-200 disabled:opacity-50"
              aria-label="Generate README"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                <span>Generate README</span>
              )}
            </Button>
            {error && (
              <div className="w-full p-3 bg-red-500/10 text-red-300 text-center rounded-full text-base font-medium mt-2">
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Results Section */}
        {result && (
          <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
            <div className="glass p-8 md:p-10 shadow-xl rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">Generated README</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                    aria-label="Copy README to clipboard"
                    type="button"
                    title="Copy"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={downloadMarkdown}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                    aria-label="Download README as markdown"
                    type="button"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="bg-transparent rounded-xl p-0 md:p-2 overflow-auto max-h-[70vh]">
                <MarkdownRenderer content={result} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full mt-20 pb-8 text-center">
        <p className="text-gray-500 text-sm font-normal">
          Built by zeeshier &mdash; {new Date().getFullYear()} GitReadme AI
        </p>
      </footer>
    </div>
  );
}
