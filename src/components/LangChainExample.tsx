"use client";

import { useState } from "react";
import { useLangChain } from "@/lib/useLangChain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LangChainExample() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const { generateResponse, loading, error } = useLangChain({
    onSuccess: (response) => setResponse(response),
    onError: (error) => console.error("Error:", error),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const prompt = `You are a helpful AI assistant. Please respond to the following user input: {input}`;
    
    try {
      await generateResponse(prompt, { input });
    } catch (error) {
      console.error("Failed to generate response:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold">LangChain AI Chat</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="input" className="block text-sm font-medium mb-2">
            Your Message
          </label>
          <Input
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            disabled={loading}
          />
        </div>
        
        <Button type="submit" disabled={loading || !input.trim()}>
          {loading ? "Generating..." : "Send Message"}
        </Button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {response && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="font-semibold mb-2">AI Response:</h3>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
} 