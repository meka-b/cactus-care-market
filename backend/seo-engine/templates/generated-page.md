Implement the "Generated Page" Exa product component in this codebase.

Use the template details and source code below as the source of truth. Adapt framework, routing, styling, and state management to the existing app. Do not invent unrelated product requirements.

Template details:
- Name: Generated Page
- Description: Programmatic SEO pages grounded in fresh source material
- Category: UI Component
- Use case: Sales & Marketing
- Variants: Listicle, Comparison, Alternatives, FAQ

How it works:
1. Each page is one request to Exa's /search endpoint with type: "deep". The query asks Exa to research the keyword, then the systemPrompt and outputSchema shape the result into a page.
2. The variants differ by schema. A listicle returns items and faqs. A comparison returns exactly two contenders and a verdict. Alternatives returns ranked replacements. FAQ returns only question and answer pairs.
3. Sources come from output.grounding. The preview keeps inline markdown links in prose and renders a compact favicon source row deduped by domain.

Reference source code:
## TypeScript
Install:
```bash
npm install exa-js
```

```typescript
import Exa from "exa-js";
const exa = new Exa("YOUR_API_KEY");

const keyword = "Top 10 AI sales tools for B2B SaaS";

const result = await exa.search(
  `Research the best options for: ${keyword}. Find recent rankings, reviews, and comparisons.`,
  {
    type: "deep",
    numResults: 12,
    systemPrompt: `Generate a programmatic SEO listicle targeting "${keyword}". Rank real products by fit for the named audience. Plain prose, grounded claims, natural inline links, no hype.`,
    outputSchema: {
      type: "object",
      required: ["metaTitle", "metaDescription", "intro", "items", "faqs"],
      properties: {
        metaTitle: { type: "string" },
        metaDescription: { type: "string" },
        intro: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "url", "summary"],
            properties: {
              name: { type: "string" },
              url: { type: "string" },
              summary: { type: "string" },
            },
          },
        },
        faqs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
            },
          },
        },
      },
    },
    contents: { highlights: true },
  }
);

const page = result.output.content;
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
keyword = "Top 10 AI sales tools for B2B SaaS"

result = exa.search(
    f"Research the best options for: {keyword}. Find recent rankings, reviews, and comparisons.",
    type="deep",
    num_results=12,
    system_prompt=f"Generate a programmatic SEO listicle targeting {keyword}. Rank real products by fit. Plain prose, grounded claims, natural inline links, no hype.",
    output_schema={
        "type": "object",
        "required": ["metaTitle", "metaDescription", "intro", "items", "faqs"],
        "properties": {
            "metaTitle": {"type": "string"},
            "metaDescription": {"type": "string"},
            "intro": {"type": "string"},
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["name", "url", "summary"],
                    "properties": {
                        "name": {"type": "string"},
                        "url": {"type": "string"},
                        "summary": {"type": "string"},
                    },
                },
            },
            "faqs": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "answer": {"type": "string"},
                    },
                },
            },
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
    "query": "Research the best options for: Top 10 AI sales tools for B2B SaaS",
    "type": "deep",
    "numResults": 12,
    "systemPrompt": "Generate a programmatic SEO listicle...",
    "outputSchema": {
      "type": "object",
      "required": ["metaTitle", "metaDescription", "intro", "items", "faqs"],
      "properties": {
        "metaTitle": {"type": "string"},
        "metaDescription": {"type": "string"},
        "intro": {"type": "string"},
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {"type": "string"},
              "url": {"type": "string"},
              "summary": {"type": "string"}
            }
          }
        },
        "faqs": {"type": "array"}
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