Implement the "Fetch URL Content" Exa agent tool in this codebase.

Use the template details and source code below as the source of truth. Adapt framework, routing, styling, and state management to the existing app. Do not invent unrelated product requirements.

Template details:
- Name: Fetch URL Content
- Description: Extract clean full text or highlights from known URLs
- Category: Agent Tool
- Use case: AI Coding
- Variants: Highlights, Full text

How it works:
1. One request to Exa's /contents endpoint with urls and highlights returns clean extracted content for a known link.
2. Pass highlights.query to steer the excerpts toward what the next model call cares about. Use text instead when the model needs the full page body.
3. Check statuses per URL before passing content to your model. A successful response can still include per-URL extraction failures.

Reference source code:
## TypeScript
Install:
```bash
npm install exa-js
```

```typescript
import Exa from "exa-js";

const exa = new Exa("YOUR_API_KEY");

const result = await exa.getContents(
  ["https://react.dev/blog/2024/12/05/react-19"],
  {
    highlights: {
      query: "migration details and breaking changes",
    },
  },
);

const page = result.results[0];

console.log({
  title: page.title,
  url: page.url,
  highlights: page.highlights,
});
```

## Python
Install:
```bash
pip install exa-py
```

```python
from exa_py import Exa

exa = Exa(api_key="YOUR_API_KEY")

result = exa.get_contents(
    urls=["https://react.dev/blog/2024/12/05/react-19"],
    highlights={"query": "migration details and breaking changes"},
)

page = result.results[0]

print({
    "title": page.title,
    "url": page.url,
    "highlights": page.highlights,
})
```

## cURL
```bash
curl https://api.exa.ai/contents \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://react.dev/blog/2024/12/05/react-19"],
    "highlights": {
      "query": "migration details and breaking changes"
    }
  }'
```

Implementation guidance:
- Preserve the Exa request behavior shown in the source code: search type, query construction, outputSchema, systemPrompt, contents options, and grounding/citation handling.
- Manage secrets safely. If the user does not have an Exa API key, they can get one from https://dashboard.exa.ai/api-keys.
- Match the host app's existing conventions for routing, server/client boundaries, styling, and loading/error states.
- Prefer the TypeScript SDK example for a TypeScript/React app. Use the Python or cURL examples only when they better match the codebase.
- After implementing, run the narrowest relevant tests or type checks and fix issues you find.