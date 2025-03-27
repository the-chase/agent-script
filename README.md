# AgentScript

AgentScript is a simple, observable code agent builder in TypeScript. Inspired by Hugging Face’s [smolagents](https://github.com/huggingface/smolagents) 🤗, we’re bringing agentic capabilities to TypeScript, making it easier to build production-ready AI agents.

## Demo

Run inside `examples/agents` (requires `.env` - see [full instructions](./examples/agents/README.md#webdataagent)):

```sh
cd examples/agents && npm install
npx tsx --env-file=.env src/webDataAgent/hackernews.ts
```

**Task: give me the top 40 posts on hacker news.**

https://github.com/user-attachments/assets/de161faa-84a5-4e23-951e-1a7e221ba371

## What You Get with AgentScript

🔁 A simple, customizable agent loop that enables scalable agentic workflow execution.\
📊 No-code OpenTelemetry instrumentation. Full task / step tracing & token usage statistics. (See demo video)\
🌐 Web browser actions (visual) with sample web automation agent.

🚀 Ready to dive in and build something awesome?

AgentScript is currently in **alpha**, help us by reporting issues and suggesting features!

## How It Works

AgentScript provides an agent loop scaffold that breaks down a task into multiple steps. In each step, the agent uses its memory on previous steps, and then does the following:

1. Generates descriptive / reasoning comments, followed by a javascript / typescript script block.
2. Executes the generated script in a Node vm, using built-ins and a list of User-Defined Functions (UDFs).
3. Adds all UDF call output (or any errors in script execution) into the agent memory context as observations.

The Agent will keep taking steps towards the goal of the task and terminate when any of the conditions are met:

1. A UDF provides the final answer for the task.
2. The agent reaches the maximum steps allowed.
3. The agent is stuck in an error loop.

## Quick Start

Install [Arize-ai/phoenix](https://github.com/Arize-ai/phoenix) for detailed tracing. For fastest setup, use docker.

### As NPM Packages

Use your preferred package manager (example below uses npm):

```sh
npm install \
  @runparse/agent-script \
  @runparse/agent-script-instrumentation \
  @runparse/agent-script-web
```

### Local Development

Pre-requisites:

- `pnpm` (`npm install -g pnpm`)

Steps:

1. Install dependencies with `pnpm install` in repo root.
2. Inspect and experiment with the ready-to-run samples in the `examples` folder.

Generate npm package build artifacts with `pnpm nx run-many --target=build --all`. See `project.json` in each package for details.

Run tests with `pnpm nx run-many --target=test --all`

#### Using pnpm workspaces

If you are using `pnpm` in your main repo, a quick way to reference a fork of this repo is to add the packages as workspace references (e.g. `"@runparse/agent-script": "workspace:*",`) in your main repo's `package.json` dependencies section, and then add the path to `packages` folder in this repo to your main repo's `pnpm-workspace.yaml`, e.g.

```
packages:
  - <main_repo>
  - <path_to_packages_folder_in_this_repo> // to add
```

## Why Code Agents?

Take it from huggingface: [Writing actions as code snippets is demonstrated to work better than the current industry practice of letting the LLM output a dictionary of the tools it wants to call: uses 30% fewer steps (thus 30% fewer LLM calls) and reaches higher performance on difficult benchmarks.](https://github.com/huggingface/smolagents?tab=readme-ov-file#how-do-code-agents-work)

At a fundamental level, LLMs are remarkable at writing code. And this makes sense, because code is a highly structured way of turning fuzzy ideas into precise actions using natural language.

In addition, there have been decades of work creating compilers, interpreters, and sandboxes for programming languages that provide highly optimized access to the core components of a computer (working memory, variables, long term storage, object oriented design, object passing, and so much more). These same components are likely to be the building blocks of AGI.

That’s why we believe that code-writing agents are the best agents in terms of quality and performance. But to move beyond smolagents and into production, we needed a simple yet powerful TypeScript agent builder, which is where AgentScript comes in.

## Contributing

Contributions are welcome. Please fork and submit a pull request to main.

## Who are We 
We're a small team of builders based out of Toronto, San Francisco, and Mumbai -- find more about us at [here](https://heyarctic.io/). If you're interested in our work, reach out at hello@heyarctic.io.
