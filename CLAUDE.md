# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an n8n workflow project for a **YouTube Thumbnail Factory** - an automated system that generates AI-powered YouTube thumbnails using:
- Webhook trigger for keywords and background images
- Airtable for persistent head images and storing generated thumbnails
- Kie.ai API for AI image generation (nano-banana-pro model)
- OpenRouter/Gemini for generating thumbnail prompts

**Workflow ID**: `bMn3cp0ene5sfdY3`

## Commands

```bash
# Test the webhook locally (requires n8n in test mode)
bash test.sh

# Production webhook URL
POST https://n8n.srv824812.hstgr.cloud/webhook/9be9d624-772f-4f20-8946-45ff51296d1f
```

## Architecture

The workflow follows this pipeline:
```
Webhook → Fetch Head Image (Airtable) → Prepare & Upload Images (Kie.ai)
→ AI Prompt Generation (3-5 prompts) → Create Generation Tasks → Poll Until Complete
→ Download Images → Store Results (Airtable)
```

Key design patterns:
- **Split batch processing**: Tasks are processed one at a time through `Split In Batches` node
- **Polling loop**: 10-second interval checks with 42-poll (7-minute) timeout per task
- **Error continuation**: `continueOnFail: true` on HTTP requests to prevent workflow stops
- **Execution timeout**: 420 seconds (7 minutes) for long-running requests

## n8n Expression Syntax Warning

**CRITICAL**: n8n expressions (`={{ }}`) do NOT support optional chaining (`?.`). Always use ternary operators instead:
```
❌ {{ $json.data?.taskId }}
✅ {{ $json.data ? $json.data.taskId : $json.taskId }}
```

This applies to If node conditions and Set node values. Code nodes (JavaScript) DO support `?.`.

## MCP Integration

The project uses n8n-mcp for workflow management. Connection configured in `.mcp.json` pointing to the n8n instance at `https://n8n.srv824812.hstgr.cloud`.

## Webhook Payload Structure

```json
{
  "Keywords": "keywords separated by semicolons",
  "Background Images": [
    {"filename": "image.png", "data": "<base64>", "mimeType": "image/png"}
  ]
}
```

## Required n8n Credentials

- `airtable-cred`: Airtable Token API for reading/writing images
- `kie-api-cred`: HTTP Bearer Auth with Kie.ai token
- `openrouter-cred`: OpenRouter API for AI model access

## Required Airtable Tables

1. **persistent_images**: Head image storage with `Attachments` field
2. **generated_thumbnails**: Output storage with fields: `task_id`, `prompt`, `prompt_index`, `background_index`, `status`, `image_url`, `keywords`, `generated_at`

## External APIs

- **Kie.ai Upload**: `POST https://kieai.redpandaai.co/api/file-base64-upload`
- **Kie.ai Create Task**: `POST https://api.kie.ai/api/v1/jobs/createTask` (model: `nano-banana-pro`)
- **Kie.ai Poll Status**: `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}`

## Environment Variables

- `AIRTABLE_BASE_ID`: Airtable base identifier used in workflow expressions
