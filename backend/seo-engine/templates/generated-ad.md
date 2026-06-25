Implement the "Generated Ad" Exa product component in this codebase.

Use the template details and source code below as the source of truth. Adapt framework, routing, styling, and state management to the existing app. Do not invent unrelated product requirements.

Template details:
- Name: Generated Ad
- Description: Produce ads based on other content from the web
- Category: UI Component
- Use case: Sales & Marketing
- Variants: Google Search, Meta, LinkedIn Sponsored

How it works:
1. Each ad set is one request to Exa's /search endpoint with type: "deep". The query asks Exa to find real search intent, forum language, reviews, and recent proof points for the product and audience.
2. Each platform variant has its own outputSchema. Google Search returns headlines and descriptions. Meta returns primaryText, headline, description, and cta. LinkedIn returns introText, headline, description, and cta.
3. The preview renders the ad in the platform frame and shows the grounding concept alongside deduped sources.

Reference source code:
## TypeScript
Install:
```bash
npm install exa-js
```

```typescript
import Exa from "exa-js";
const exa = new Exa("YOUR_API_KEY");

const topic = "Revenue forecasting for B2B SaaS CFOs";

const result = await exa.search(
  `What specific professional pain points and proof points around "${topic}" do decision-makers care about right now?`,
  {
    type: "deep",
    numResults: 12,
    systemPrompt: `Draft a LinkedIn Sponsored Content ad for "${topic}". Use real audience language from the sources. Return intro text, headline, description, CTA, and the audience insight. Respect LinkedIn character limits.`,
    outputSchema: {
      type: "object",
      required: ["audienceInsight", "introText", "headline", "description", "cta"],
      properties: {
        audienceInsight: { type: "string" },
        introText: { type: "string", description: "Max 150 characters" },
        headline: { type: "string", description: "Max 70 characters" },
        description: { type: "string", description: "Max 100 characters" },
        cta: { type: "string", description: "LinkedIn CTA value" },
      },
    },
    contents: { highlights: true },
  }
);

const ad = result.output.content;
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
topic = "Revenue forecasting for B2B SaaS CFOs"

result = exa.search(
    f'What specific professional pain points and proof points around "{topic}" do decision-makers care about right now?',
    type="deep",
    num_results=12,
    system_prompt=f'Draft a LinkedIn Sponsored Content ad for "{topic}". Use real audience language from the sources. Return intro text, headline, description, CTA, and the audience insight.',
    output_schema={
        "type": "object",
        "required": ["audienceInsight", "introText", "headline", "description", "cta"],
        "properties": {
            "audienceInsight": {"type": "string"},
            "introText": {"type": "string"},
            "headline": {"type": "string"},
            "description": {"type": "string"},
            "cta": {"type": "string"},
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
    "query": "What specific professional pain points and proof points around revenue forecasting for B2B SaaS CFOs do decision-makers care about right now?",
    "type": "deep",
    "numResults": 12,
    "systemPrompt": "Draft a LinkedIn Sponsored Content ad...",
    "outputSchema": {
      "type": "object",
      "required": ["audienceInsight", "introText", "headline", "description", "cta"],
      "properties": {
        "audienceInsight": {"type": "string"},
        "introText": {"type": "string"},
        "headline": {"type": "string"},
        "description": {"type": "string"},
        "cta": {"type": "string"}
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