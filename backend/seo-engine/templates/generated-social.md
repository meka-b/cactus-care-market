Implement the "Generated Social" Exa product component in this codebase.

Use the template details and source code below as the source of truth. Adapt framework, routing, styling, and state management to the existing app. Do not invent unrelated product requirements.

Template details:
- Name: Generated Social
- Description: Well-researched social media posts relevant to a recent topic
- Category: UI Component
- Use case: Sales & Marketing
- Variants: LinkedIn post, LinkedIn short, Tweet, Twitter thread

How it works:
1. Each post is one request to Exa's /search endpoint with type: "deep". Exa first finds what people in the topic space are discussing right now, then a model writes a post anchored to one specific event, launch, hire, or take from the sources.
2. Each platform variant has its own outputSchema and systemPrompt. A LinkedIn long-form post has hook, paragraphs, and kicker fields. A Tweet has a single post field with a 280 character budget. A thread is an array of tweets.
3. Every variant's systemPrompt carries the shared voice rules: no AI vocabulary, no em dashes, no hashtags, no content-creator clichés. Sources are flattened from output.grounding and rendered as a favicon row, deduped by domain.

Reference source code:
## TypeScript
Install:
```bash
npm install exa-js
```

```typescript
import Exa from "exa-js";
const exa = new Exa("YOUR_API_KEY");

const topic = "AI coding tools";

const result = await exa.search(
  `What are people in ${topic} actually arguing about right now? Find specific recent posts, launches, debates from the last 30 days.`,
  {
    type: "deep",
    numResults: 12,
    systemPrompt: `Draft a LinkedIn post for an operator in the "${topic}" space. 140-220 words. Anchor to one specific recent event from the sources. Voice rules: contractions, numerals, second-person, no em dashes, no clichés.`,
    outputSchema: {
      type: "object",
      required: ["zeitgeistAngle", "hook", "paragraphs", "kicker"],
      properties: {
        zeitgeistAngle: { type: "string", description: "The specific recent event being ridden" },
        hook: { type: "string", description: "First 1-2 lines, under 180 chars" },
        paragraphs: {
          type: "array",
          description: "4-7 short paragraphs, each 1-2 sentences max 30 words",
          items: { type: "string" },
        },
        kicker: { type: "string", description: "Sharp final sentence, not a question" },
      },
    },
    contents: { highlights: true },
  }
);

const { hook, paragraphs, kicker } = result.output.content;
const citations = result.output.grounding.flatMap((g) => g.citations);
```

## Python
Install:
```bash
pip install exa-py
```

```python
from exa_py import Exa

exa = Exa(api_key="YOUR_API_KEY")

topic = "AI coding tools"

result = exa.search(
    f"What are people in {topic} actually arguing about right now?",
    type="deep",
    num_results=12,
    system_prompt=f"Draft a LinkedIn post for an operator in the {topic} space. 140-220 words. Anchor to one recent event. Voice: contractions, numerals, second-person, no em dashes.",
    output_schema={
        "type": "object",
        "required": ["zeitgeistAngle", "hook", "paragraphs", "kicker"],
        "properties": {
            "zeitgeistAngle": {"type": "string"},
            "hook": {"type": "string"},
            "paragraphs": {"type": "array", "items": {"type": "string"}},
            "kicker": {"type": "string"},
        },
    },
    contents={"highlights": True},
)

print(result.output.content)
```

## cURL
```bash
curl -X POST "https://api.exa.ai/search" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "query": "What are people in AI coding tools arguing about right now?",
    "type": "deep",
    "numResults": 12,
    "systemPrompt": "Draft a LinkedIn post...",
    "outputSchema": {
      "type": "object",
      "required": ["zeitgeistAngle", "hook", "paragraphs", "kicker"],
      "properties": {
        "zeitgeistAngle": {"type": "string"},
        "hook": {"type": "string"},
        "paragraphs": {"type": "array", "items": {"type": "string"}},
        "kicker": {"type": "string"}
      }
    },
    "contents": {"highlights": true}
  }'
```

Implementation guidance:
- Preserve the Exa request behavior shown in the source code: search type, query construction, outputSchema, systemPrompt, contents options, and grounding/citation handling.
- Manage secrets safely. If the user does not have an Exa API key, they can get one from https://dashboard.exa.ai/api-keys.
- Match the host app's existing conventions for routing, server/client boundaries, styling, and loading/error states.
- Prefer the TypeScript SDK example for a TypeScript/React app. Use the Python or cURL examples only when they better match the codebase.
- After implementing, run the narrowest relevant tests or type checks and fix issues you find.