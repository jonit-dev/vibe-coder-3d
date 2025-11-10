# OpenRouter Integration

This module provides integration with OpenRouter API for analyzing screenshots using custom vision-enabled AI models.

## Setup

1. **Get an OpenRouter API Key**

   - Visit https://openrouter.ai/keys
   - Create a new API key
   - Copy the key

2. **Configure Environment Variables**

   - Copy `.env.example` to `.env` if you haven't already
   - Set your OpenRouter API key:
     ```
     VITE_OPENROUTER_VISION_API_KEY=your_api_key_here
     ```
   - Choose your preferred vision model (optional, defaults to Claude 3.5 Sonnet):
     ```
     VITE_OPENROUTER_VISION_MODEL=google/gemini-2.5-flash-preview-09-2025
     ```
   - Enable OpenRouter for all screenshots (recommended):
     ```
     VITE_USE_OPENROUTER_FOR_SCREENSHOTS=true
     ```
   - Set thinking effort level (optional, for models that support reasoning):
     ```
     VITE_OPENROUTER_THINKING_EFFORT=high
     ```

3. **Restart the dev server** after changing environment variables

## Usage

### From the AI Agent

The screenshot feedback tool automatically uses OpenRouter if `VITE_USE_OPENROUTER_FOR_SCREENSHOTS=true`:

```typescript
// Uses OpenRouter automatically if env var is set to true
screenshot_feedback({
  reason: 'Verify cube position',
});

// Explicitly enable OpenRouter (overrides env setting)
screenshot_feedback({
  reason: 'Verify cube position',
  use_openrouter: true,
});

// Explicitly disable OpenRouter (overrides env setting)
screenshot_feedback({
  reason: 'Verify cube position',
  use_openrouter: false,
});

// With custom analysis prompt
screenshot_feedback({
  reason: 'Check forest scene',
  analysis_prompt: 'Count the number of trees and describe their arrangement',
});
```

**Thinking Mode**: If `VITE_OPENROUTER_THINKING_EFFORT` is set (low/medium/high), the model will use extended reasoning when analyzing screenshots. This works with models that support the reasoning parameter (like Gemini 2.5 Flash).

### Programmatically

```typescript
import { OpenRouterService } from '@editor/services/openrouter';

// Initialize the service
const openRouter = OpenRouterService.getInstance();
openRouter.initialize();

// Analyze a screenshot
const analysis = await openRouter.analyzeScreenshot({
  imageData: base64ImageData, // PNG image as base64 string
  prompt: 'What objects are visible in this scene?',
  systemPrompt: 'You are a 3D scene analyst.', // optional
});

console.log(analysis);

// Send a text-only message
const response = await openRouter.sendMessage([{ role: 'user', content: 'Hello!' }]);

// Test the connection
const isConnected = await openRouter.testConnection();
console.log('Connected:', isConnected);

// Change model at runtime
openRouter.setModel('openai/gpt-4o');
```

## API Reference

### OpenRouterService

**Methods:**

- `initialize()` - Initialize the service with API key from environment
- `isInitialized()` - Check if service is initialized
- `analyzeScreenshot(request)` - Analyze a screenshot with vision model
  - `request.imageData` - Base64 PNG image data
  - `request.prompt` - Analysis prompt
  - `request.systemPrompt` - Optional system prompt
- `sendMessage(messages, options)` - Send text messages
- `testConnection()` - Test API connectivity
- `getModel()` - Get current model identifier
- `setModel(model)` - Change the model
- `cleanup()` - Clean up service

### Types

```typescript
interface IScreenshotAnalysisRequest {
  imageData: string; // base64 encoded PNG
  prompt: string;
  systemPrompt?: string;
}

interface IOpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content:
    | string
    | Array<{
        type: 'text' | 'image_url';
        text?: string;
        image_url?: { url: string };
      }>;
}
```

## Cost Considerations

- Different models have different pricing
- Vision requests are typically more expensive than text-only
- OpenRouter shows per-model pricing at https://openrouter.ai/models
- Set credit limits in your OpenRouter dashboard to control costs

## Troubleshooting

**"API key is required" error:**

- Ensure `VITE_OPENROUTER_VISION_API_KEY` is set in your `.env` file
- Restart the dev server after changing environment variables

**"Failed to analyze screenshot" error:**

- Check your API key is valid
- Verify you have credits in your OpenRouter account
- Check the model identifier is correct
- Review browser console for detailed error messages

**Model not working:**

- Not all models support vision/images
- Check the model capabilities at https://openrouter.ai/models
- Ensure the model name format is correct (e.g., `provider/model-name`)

## Architecture

The integration consists of:

1. **OpenRouterService** - Core service handling API communication
2. **ScreenshotFeedbackTool** - Integration with the AI agent's screenshot tool
3. **Environment Configuration** - Separate config from main agent to allow different models

This separation allows you to:

- Use a specialized vision model for screenshots (e.g., Claude 3.5 Sonnet)
- Use a different model for the main agent (e.g., GLM 4.6 via Z.AI)
- Control costs by choosing appropriate models for each use case
