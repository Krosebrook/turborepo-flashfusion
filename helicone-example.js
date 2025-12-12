import { HeliconeAsyncLogger } from "@helicone/async";
import OpenAI from "openai";
import { randomUUID } from "crypto";

// Initialize Helicone logger
const logger = new HeliconeAsyncLogger({
  apiKey: process.env.HELICONE_API_KEY,
  // pass in the providers you want logged
  providers: {
    openAI: OpenAI,
    //anthropic: Anthropic,
    //cohere: Cohere
    // ...
  }
});

// Initialize the logger
logger.init();

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function basicExample() {
  console.log("Running basic Helicone example...");
  
  const completion = await openai.chat.completions.create({
    messages: [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Who won the world series in 2020?"},
      {"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
      {"role": "user", "content": "Where was it played?"}
    ],
    model: "gpt-4o-mini",
  });

  console.log("Response:", completion.choices[0]);
  return completion;
}

async function sessionExample() {
  console.log("Running session tracking example...");
  
  const sessionId = randomUUID();
  
  return new Promise((resolve, reject) => {
    logger.withProperties({
      "Helicone-Session-Id": sessionId,
      "Helicone-Session-Path": "/abstract",
      "Helicone-Session-Name": "Course Plan",
    }, async () => {
      try {
        const completion = await openai.chat.completions.create({
          messages: [
            {"role": "system", "content": "You are a course planning assistant."},
            {"role": "user", "content": "Create a brief outline for a JavaScript fundamentals course."}
          ],
          model: "gpt-4o-mini",
        });
        
        console.log("Session ID:", sessionId);
        console.log("Course Plan Response:", completion.choices[0]);
        resolve(completion);
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function main() {
  try {
    // Run basic example
    await basicExample();
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Run session tracking example
    await sessionExample();
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { logger, openai, basicExample, sessionExample };