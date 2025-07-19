import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Initialize the Groq chat model
export const groqModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "qwen/qwen3-32b", // You can change this to other Groq models
});

// Create a prompt template
export const createPromptTemplate = (template: string) => {
  return ChatPromptTemplate.fromTemplate(template);
};

// Create a chain with prompt template and output parser
export const createChain = (promptTemplate: string) => {
  const prompt = createPromptTemplate(promptTemplate);
  const outputParser = new StringOutputParser();
  
  return prompt.pipe(groqModel).pipe(outputParser);
};

// Example usage function
export const generateResponse = async (prompt: string, input: any) => {
  try {
    const chain = createChain(prompt);
    const response = await chain.invoke(input);
    return response;
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}; 