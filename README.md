# tracebloom

[![PyPI version](https://img.shields.io/pypi/v/tracebloom.svg)](https://pypi.org/project/tracebloom/)
[![Python versions](https://img.shields.io/pypi/pyversions/tracebloom.svg)](https://pypi.org/project/tracebloom/)
[![License](https://img.shields.io/github/license/tracebloom/tracebloom.svg)](./LICENSE)
[![CI](https://github.com/tracebloom/tracebloom/actions/workflows/python-ci.yml/badge.svg)](https://github.com/tracebloom/tracebloom/actions)
<!-- TODO: Discord invite URL — replace both the server ID in the badge URL and the link target before launch. Tracked in ROADMAP.md Phase 1 follow-ups. -->
[![Discord](https://img.shields.io/discord/0?label=discord&logo=discord&color=5865F2&style=flat)](https://tracebloom.dev)
[![GitHub stars](https://img.shields.io/github/stars/tracebloom/tracebloom.svg?style=social)](https://github.com/tracebloom/tracebloom/stargazers)

> ⚠️ **This project is under active development and not yet ready for use.** v0.1.0 ships when Phase 2 completes. Watch the repo to be notified.

**See every decision your agent makes. Replay any run with one variable changed. Catch drift before your users do.**

<!-- TODO: hero GIF — demo.gif, 1200x675, under 5MB, shows CLI → viewer flow -->

## What it is

tracebloom is a debugger for AI agents. When your agent misbehaves in production, tracebloom tells you which tool call, which prompt turn, which memory write is the cause — and lets you replay the same run with a single variable changed. It speaks OpenTelemetry's GenAI semantic conventions, so traces from any framework are welcome.

## Install

```bash
pip install tracebloom         # Python SDK + CLI
# Phase 2+: npm i @tracebloom/dashboard   # self-hosted web UI
```

## Five-line integration

```python
import tracebloom
tracebloom.init(project="my-agent")

# your existing agent code — LangChain, LlamaIndex, raw OpenAI, whatever
result = agent.run("refund the last order")

tracebloom.flush()
```

That's it. Open the viewer, see the flame graph, find the bad decision.

## Why another tool

| Feature                           | tracebloom | Langfuse | Raw OpenTelemetry |
| --------------------------------- | :--------: | :------: | :---------------: |
| Flame-graph decision trace        |     ✅      |    ❌     |         ❌         |
| Deterministic replay (same seed)  |     ✅      |    ❌     |         ❌         |
| Memory & skill inspector          |     ✅      |    ⚠️    |         ❌         |
| Drift detection across runs       |     ✅      |    ❌     |         ❌         |
| Single-file HTML share link       |     ✅      |    ❌     |         ❌         |
| OTel GenAI semconv on the wire    |     ✅      |    ⚠️    |         ✅         |

✅ shipped or in-scope for v1.0 · ⚠️ partial/workaround · ❌ not supported

## Community

- **Discussions:** https://github.com/tracebloom/tracebloom/discussions
- **Discord:** <!-- TODO: Discord invite URL -->
- **Issues:** https://github.com/tracebloom/tracebloom/issues

## License

MIT. See `LICENSE`.

## Acknowledgements

Built on top of work by the OpenTelemetry GenAI working group, the Python `click` maintainers, and the broader observability community.
