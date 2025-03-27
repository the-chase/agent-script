# Agents

`npm install`, then create a `.env` file in this folder with, at a minimum. You may also need `npx playwright install` if you haven't downloaded browsers for playwright yet.

```
OPENAI_API_KEY=<your-key>
```

Other environment variables are needed with different models and service providers. See the comments inside each script file.

## CodeAgent

A general agent that solves problems by writing javascript code.

```sh
npx tsx --env-file=.env src/codeAgent/simpleMath.ts
```

## DeepResearchAgent

DeepResearchAgent is a generate agent to do research on the internet and produce answers and reports.

```sh
npx tsx --env-file=.env src/deepResearchAgent/mobileLlmStartup.ts
```

## WebDataAgent

WebDataAgent is an agent that collects structured data from the internet through search and web page browsing.

```sh
npx tsx --env-file=.env src/webDataAgent/hackernews.ts
```
