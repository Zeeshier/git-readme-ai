import { useState } from "react";

interface UseLangChainProps {
  onSuccess?: (response: string) => void;
  onError?: (error: string) => void;
}

export const useLangChain = ({ onSuccess, onError }: UseLangChainProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = async (prompt: string, input: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/langchain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate response");
      }

      onSuccess?.(data.response);
      return data.response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateResponse,
    loading,
    error,
  };
}; 