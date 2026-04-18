# tracebloom span attributes

**Status:** v0.1.0 spec — covers everything emitted and consumed by tracebloom v0.1.0.
**Authoritative source.** All SDK, collector, dashboard, and replay implementations read from this doc.
**Changes:** land as PRs to this file, reviewed per the version policy in §5.

---

## 1. Philosophy and scope

tracebloom emits OpenTelemetry GenAI spans with a deliberate posture: **use what OpenTelemetry defines, extend only where it doesn't**. We call this Philosophy B refined. Wherever the OTel GenAI semantic conventions have an attribute for a concept — `gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.tool.name` — we emit that attribute verbatim. We do not shadow OTel attributes with `tracebloom.*` equivalents. Duplicate naming is a smell we avoid.

Wherever OTel has no opinion on a concept central to agent debugging — memory operations, skill abstractions above the tool layer, replay markers, agent-decision grouping — we introduce the `tracebloom.*` namespace. These extensions are additive to OTel, never replacements.

**The practical consequence:** a trace captured by tracebloom is substantially valid OTel GenAI out of the box — the majority of attributes on any tracebloom span follow OTel conventions verbatim. Any existing OTel-compatible tool — Langfuse, Phoenix, Jaeger, Honeycomb — can ingest tracebloom traces and render the parts it understands. It won't understand `tracebloom.memory.*` or `tracebloom.skill.*`, but it won't break on them either. OpenTelemetry attribute consumers are required to ignore attributes they don't recognize.

**v1 scope:** the attribute contract covers everything needed to render the four hero views — flame-graph decision traces, memory timeline, skill registry, replay diff — and to support the drift detector. Attributes outside this scope are not in v1, regardless of how reasonable they might seem.

**Session vs conversation.** A `gen_ai.conversation.id` groups LLM turns within one continuous exchange. A `tracebloom.session.id` groups conversations that share agent lifecycle — shared memory, shared skill registry, one user task. A session typically contains one conversation; it may contain multiple when the agent resets context mid-task or orchestrates sub-agents. `tracebloom.session.id` is the only `tracebloom.*` attribute that appears in section 2 (the foundational layer) because it is the sole grouping key that sits *above* any OTel-defined scope and every span must carry it for memory-timeline continuity.

**Out of scope for v1:**

- Multi-tenant attributes (tenant IDs, org IDs, workspace scoping). tracebloom is a developer's debugging companion first, not a platform dashboard. When teams need multi-tenant trace isolation, we revisit.
- Cost attribution beyond token counts. No dollar amounts on spans. Teams that need cost dashboards can derive them from `gen_ai.usage.*` upstream.
- Custom user-defined attribute namespaces. `tracebloom.*` is reserved. OTel conventions govern anything else. If users need custom attributes, they use OTel's resource and attribute extension mechanisms, not a tracebloom extension point.

---

## 2. Foundational attributes

tracebloom emits these attributes on every relevant span. The majority are drawn unmodified from the [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/). One attribute — `tracebloom.session.id` (§2.6) — is a tracebloom extension required on every span; see §1 for rationale. One group of attributes (§2.7, streaming) is a tracebloom extension pending OTel ratification; see provenance note in that subsection.

### 2.1 Span kinds (required on all spans)

tracebloom uses OTel span kinds verbatim. Every span has exactly one of these names:

| Span name | When emitted | Parent relationship |
|---|---|---|
| `gen_ai.chat` | Every LLM request (OpenAI chat, Anthropic messages, etc.) | Usually child of `tracebloom.decision` |
| `gen_ai.tool.call` | Every tool/function invocation | Child of `gen_ai.chat` that requested it, OR child of a `tracebloom.skill.invocation` |
| `gen_ai.embedding` | Every embedding call (used for vector store writes/queries) | Usually child of `tracebloom.memory.operation` |

**Note on chat vs text_completion.** OTel GenAI currently has `gen_ai.chat` and `gen_ai.text_completion` as separate span kinds, with `gen_ai.text_completion` marked deprecated in the latest spec. tracebloom uses only `gen_ai.chat`. If any future adapter needs to emit against a pure completion API, `gen_ai.text_completion` will be added at that time. For v1 against OpenAI, Anthropic, and Hermes adapter targets, chat covers everything.

### 2.1.1 Operation name

Every span additionally carries a `gen_ai.operation.name` attribute identifying the operation type as a machine-queryable value. Span name and operation name are complementary: span name is the human-readable label used in flame-graph rendering; operation name is the key query layers and drift detection group on.

| Attribute | Type | Required | Example |
|---|---|---|---|
| `gen_ai.operation.name` | string | yes | `"chat"`, `"tool_call"`, `"embeddings"` (values per OTel GenAI semconv) |

Why both exist: span names follow OTel's broader tracing conventions (stable human names, sometimes decorated with route or model); `gen_ai.operation.name` is an enum specifically for GenAI operation classification. Drift detection and skill-usage queries key on the latter.

**Query-layer rule.** Drift detection, skill usage aggregations, and any analytic keying on operation type MUST key on `gen_ai.operation.name`, never on span name. Span names are human-readable labels that may be decorated (e.g., `"chat: gpt-4o"`) and can vary across renderers and tracebloom versions. `gen_ai.operation.name` is the stable, machine-queryable key. This rule is enforced in the drift detector and API query spec (`docs/api.md`).

### 2.2 Request attributes (on `gen_ai.chat` spans)

| Attribute | Type | Required | Example |
|---|---|---|---|
| `gen_ai.system` | string | yes | `"openai"`, `"anthropic"`, `"hermes"` |
| `gen_ai.request.model` | string | yes | `"gpt-4o"`, `"claude-opus-4-7"`, `"hermes-3-70b"` |
| `gen_ai.request.temperature` | double | when set | `0.7` |
| `gen_ai.request.top_p` | double | when set | `0.95` |
| `gen_ai.request.max_tokens` | int | when set | `4096` |
| `gen_ai.request.stop_sequences` | string[] | when set | `["\n\nHuman:"]` |
| `gen_ai.request.seed` | int | when set | `42` |

**Note on seed.** tracebloom treats `gen_ai.request.seed` as the primary determinism signal for replay. Adapters that don't forward seed cannot support deterministic replay in v1. This is flagged in the adapter spec, not here.

### 2.3 Response attributes (on `gen_ai.chat` spans)

| Attribute | Type | Required | Example |
|---|---|---|---|
| `gen_ai.response.model` | string | yes | `"gpt-4o-2024-08-06"` (may differ from request.model when provider substitutes) |
| `gen_ai.response.finish_reasons` | string[] | yes | `["stop"]`, `["length"]`, `["tool_calls"]` |
| `gen_ai.response.id` | string | when available | provider-specific response ID for correlation |
| `gen_ai.usage.input_tokens` | int | yes | `1247` |
| `gen_ai.usage.output_tokens` | int | yes | `348` |
| `gen_ai.usage.cache_read_input_tokens` | int | when provider reports | `890` |
| `gen_ai.usage.reasoning_tokens` | int | required when provider reports | `2480` |
| `gen_ai.response.role` | string | optional | `"assistant"`, `"tool"`, `"system"` |

**Token accounting.** Cache hits and reasoning tokens are emitted if the provider reports them. Specifically, reasoning tokens are REQUIRED when the provider's API surfaces them (OpenAI o1/o3 `reasoning_tokens`, Anthropic extended thinking `thinking_tokens`). Adapters that silently drop reasoning tokens when available are non-conformant. Rationale: reasoning-token cost can exceed prompt-token cost by 5–20× on thinking models; silent regressions here are invisible in latency dashboards and devastating on the bill.

**Role attribute.** `gen_ai.response.role` lets the flame-graph view visually distinguish assistant turns from tool-result injections without re-parsing message payloads. Optional because not all providers return it explicitly; when absent, the renderer infers from span kind.

### 2.4 Tool call attributes (on `gen_ai.tool.call` spans)

| Attribute | Type | Required | Example |
|---|---|---|---|
| `gen_ai.tool.name` | string | yes | `"bash"`, `"read_file"`, `"search_web"` |
| `gen_ai.tool.call.id` | string | yes | provider-specific tool call ID, `"call_abc123"` |
| `gen_ai.tool.type` | string | when known | `"function"` (default), `"retrieval"`, `"code_interpreter"` |

Tool call *arguments* and *return values* are captured as span events, not attributes, following OTel's content recording pattern. See `docs/content-recording.md` (Phase 1b follow-up) for the privacy/redaction policy — not in scope for this document.

**Content recording hooks.** Tool call arguments and return values are captured as span events with names `gen_ai.tool.call.arguments` and `gen_ai.tool.call.result`. The event payload schema (including redaction policy) is specified in `docs/content-recording.md` (separate document, Phase 1b follow-up). SDK implementers should emit these event names even if the payload spec isn't finalized — the names are stable.

### 2.5 Error attributes (on any span that errored)

tracebloom uses standard OTel error attributes, not GenAI-specific ones.

| Attribute | Type | Required | Example |
|---|---|---|---|
| `error.type` | string | on error | `"tool_timeout"`, `"llm_rate_limited"` (see §2.5.1) |
| `error.message` | string | on error | provider or tool error message |
| Span status | `STATUS_CODE_ERROR` | on error | standard OTel span status |

**Error namespace.** tracebloom deliberately does not add `tracebloom.error.*` extensions. Agent errors have the same shape as any OTel error — type, message, status. Agent-specific error taxonomy lives in `error.type` as a convention, not a new namespace. This keeps error handling interoperable.

#### 2.5.1 Error type vocabulary

`error.type` is a closed enum. Adapters MUST emit one of the following values; the `unspecified` fallback is permitted but `error.message` must carry the detail. Extending the vocabulary requires a spec-PR to this document; adapters cannot introduce new values ad hoc (closed enum keeps drift detection and error dashboards stable across adapters).

| Value | Meaning |
|---|---|
| `llm_rate_limited` | Provider rate limit, 429 or equivalent |
| `llm_auth_failed` | Credential or permission failure |
| `llm_context_length_exceeded` | Input exceeded model context window |
| `tool_timeout` | Tool execution exceeded time budget |
| `tool_invalid_args` | Tool received args that failed schema validation |
| `tool_execution_failed` | Tool ran but returned an execution error |
| `memory_backend_error` | Memory store unavailable or failed |
| `memory_retrieval_failed` | Query ran but returned nothing usable |
| `skill_invocation_failed` | Skill-level orchestration error |
| `replay_variant_invalid` | Replay requested an unsupported variant |
| `unspecified` | Fallback; use `error.message` for detail |

### 2.6 Conversation/session correlation

| Attribute | Type | Required | Example |
|---|---|---|---|
| `gen_ai.conversation.id` | string | when applicable | `"conv_abc123"` — stable across turns in the same conversation |
| `tracebloom.session.id` | string | required on all spans | `"sess_abc123"` — stable across conversations within one debugging session; parent grouping key for the memory timeline view |

**Hierarchy.** `tracebloom.session.id` is the outermost grouping key and appears on every span. `gen_ai.conversation.id` is a sub-grouping within a session, appearing on LLM-adjacent spans. One session contains one or more conversations; one conversation belongs to exactly one session. This is not a Philosophy B violation — `tracebloom.session.id` and `gen_ai.conversation.id` encode genuinely different concepts (agent lifecycle vs. LLM turn continuity), not parallel naming of the same concept.

**Enforcement.** The invariant "one conversation belongs to exactly one session" is enforced in the FastAPI ingest layer. See `docs/api.md` (Phase 1b follow-up) for the validation rules and rejection behavior.

### 2.6.1 Session ID propagation

`tracebloom.session.id` is propagated via OpenTelemetry context — the same mechanism that threads `trace_id` and `span_id` across function boundaries and async contexts. Adapter authors do not emit `tracebloom.session.id` directly; the tracebloom SDK sets it once at session start (typically when `tracebloom.start_session()` is called) and OTel context propagation carries it to every child span.

Conformance: a tracebloom adapter test suite verifies that every emitted span carries a `tracebloom.session.id`. Adapters that produce spans outside a session context are non-conformant and will fail validation in the FastAPI ingest layer (see `docs/api.md`).

### 2.7 Streaming attributes (on `gen_ai.chat` spans)

tracebloom supports streamed responses in v1. TTFT and stream duration are first-class debugging signals — extended-thinking latency attribution and o1/o3 reasoning-token pacing both depend on distinguishing "model is thinking" from "model is stalled."

| Attribute | Type | Required | Example |
|---|---|---|---|
| `tracebloom.response.streaming` | boolean | yes on chat spans | `true` |
| `tracebloom.response.time_to_first_token_ms` | int | required when streaming | `340` |
| `tracebloom.response.stream_duration_ms` | int | required when streaming | `2800` |

**Provenance.** As of this writing, OTel GenAI semconv does not define streaming attributes. Emitting under `tracebloom.response.*` per Philosophy B refined (extend only where OTel is silent). When OTel ratifies streaming attributes: tracebloom will dual-emit both the tracebloom names and the OTel names for one minor version (e.g., v0.4.x), then deprecate the tracebloom names and emit only OTel names in the next minor version (v0.5.x). The deprecation window gives downstream consumers time to migrate.

---

## 3. tracebloom extensions

Four namespaces, one per concept OTel GenAI is silent on. Every `tracebloom.*` span carries `tracebloom.session.id` via context propagation (§2.6.1).

### 3.1 `tracebloom.memory.*`

**Concept.** Memory is agent-accessible state intentionally used to influence future decisions: vector-store retrievals, conversation summaries, scratchpads, explicit facts, persisted reasoning artifacts later reused. The presence of `tracebloom.memory.*` attributes on a span is the behavioral signal that this operation is a deliberate memory op — not a repurposed file read.

**Span kind.** New span named `tracebloom.memory.operation`. Wraps the underlying provider call; when a vector retrieval uses an embedding, the `gen_ai.embedding` span is a child of the memory.operation span.

**Attributes.**

| Attribute | Type | Required | Example | Appears on |
|---|---|---|---|---|
| `tracebloom.memory.operation` | enum | yes | `"retrieve"` | `tracebloom.memory.operation` |
| `tracebloom.memory.kind` | enum | yes | `"vector"` | `tracebloom.memory.operation` |
| `tracebloom.memory.store_name` | string | yes | `"past-debug-sessions"` | `tracebloom.memory.operation` |
| `tracebloom.memory.key` | string | keyed stores | `"user.preferences.lang"` | `tracebloom.memory.operation` |
| `tracebloom.memory.query` | string | retrievals | `"python import error traceback"` | `tracebloom.memory.operation` |
| `tracebloom.memory.result_count` | int | retrievals | `4` | `tracebloom.memory.operation` |
| `tracebloom.memory.result_ids` | string[] | retrievals, ≤20 items | `["doc_a1","doc_b7"]` | `tracebloom.memory.operation` |
| `tracebloom.memory.result_scores` | double[] | retrievals when available | `[0.89, 0.84]` | `tracebloom.memory.operation` |
| `tracebloom.memory.ttl_hint_seconds` | int | optional | `86400` | `tracebloom.memory.operation` |

**Enum definitions.**

- `tracebloom.memory.operation`: `store`, `retrieve`, `update`, `forget`, `promote`
- `tracebloom.memory.kind`: `vector`, `summary`, `scratchpad`, `fact`, `artifact`

**Design notes.**

- **Memory operation span kind.** `tracebloom.memory.operation` is a new span kind, not a reuse of `gen_ai.embedding`. When a vector retrieve happens, the memory.operation span parents the embedding span. Rationale: the memory concept is broader than embeddings (summaries and scratchpads don't involve embeddings at all), and a unified parent span is what the memory timeline view keys on.
- **Result ID capacity.** `result_ids` is an attribute when the result list has 20 or fewer items. Adapters MUST truncate the attribute to the first 20 entries when the list exceeds 20 AND emit the complete list as a span event named `tracebloom.memory.result_ids_full`. Ingest validation rejects spans that emit more than 20 items in the attribute. OTel attribute size limits make this cap necessary; the event escape hatch preserves the full list for the memory timeline view.
- **Forget and promote semantics.** `forget` means the agent explicitly marks an item as no-longer-relevant in its own memory model. Distinct from `memory_backend_error` (backend failure) and adapter-side eviction (not emitted). `promote` means moving up a persistence tier: scratchpad → summary, summary → fact. Both are intentional agent operations.
- **No intentional flag.** No `tracebloom.memory.intentional` attribute exists. The product rule "memory is agent-accessible state intentionally used to influence future decisions" is enforced at two layers, not via a data-layer flag: (1) the SDK exposes `tracebloom.memory.record(operation, kind, store_name, ...)` as the only path to emit memory spans — no lower-level escape hatch; (2) the FastAPI ingest layer rejects spans named `tracebloom.memory.operation` that lack the required attributes (`operation`, `kind`, `store_name`). A memory span's existence with valid required attributes is itself the signal that the operation was intentional. An always-true `intentional` boolean would be noise on every span.
- **TTL hint semantics.** `ttl_hint_seconds` is a *hint*, not enforcement. It signals how long the retrieved data was expected to remain fresh (per the store's semantics or the agent's own intent). The memory timeline view uses it to visually decay older retrievals. Enforcement lives in the memory store, not in tracebloom.

**Views consumed.** Memory timeline view (primary — the full set, plus ttl-based visual decay). Flame graph (secondary — memory.operation spans appear as first-class nodes). Drift detector (monitors `store_name` × `operation` × `result_count` distributions).

### 3.2 `tracebloom.skill.*`

**Concept.** A skill is a named, reusable procedure that orchestrates lower primitives (LLM calls, tool calls, memory ops) toward a repeatable outcome. Skills are versionable, reusable, measurable as a unit. A bare `bash("ls -la")` is not a skill; a `debug_python_package` workflow that runs bash, reads logs, edits files, and retries is.

**Span kind.** New span named `tracebloom.skill.invocation`. Wraps all child spans produced during the skill's execution. Skill attributes propagate to *every* descendant span, including embedding spans nested under memory operations — enabling accurate skill cost attribution (see §4 annotation).

**Attributes.**

| Attribute | Type | Required | Example | Appears on |
|---|---|---|---|---|
| `tracebloom.skill.name` | string | yes | `"debug_python_package"` | invocation + all descendants |
| `tracebloom.skill.version` | string (semver) | yes | `"1.2.0"` | invocation + all descendants |
| `tracebloom.skill.entry_point` | string | yes | `"main"` | invocation + all descendants |
| `tracebloom.skill.registry` | string | yes | `"local"`, `"github:tracebloom/skills"` | invocation only |
| `tracebloom.skill.definition_uri` | string | when resolvable | `"github:tracebloom/skills@v1.2.0/debug.yaml"` | invocation only |
| `tracebloom.skill.invocation_id` | string | yes | `"skinv_abc123"` | invocation + all descendants |
| `tracebloom.skill.parent_invocation_id` | string | nested skills | `"skinv_xyz789"` | invocation only |
| `tracebloom.skill.outcome` | enum | yes, on span close | `"success"` | invocation only |
| `tracebloom.skill.retry_count` | int | when ≥1 | `2` | invocation only |

**Enum definitions.**

- `tracebloom.skill.outcome`: `success`, `partial`, `failed`, `aborted`

**Design notes.**

- **When to emit skill invocation.** Adapters emit this span when the operation corresponds to a declared skill in the framework's skill registry. What qualifies as a skill is a framework-level decision, not a span-level one — frameworks with explicit skill registries (Hermes, LangGraph's subgraph-as-skill, custom `skills.yaml` files) have already made the declaration; the adapter simply honors it. Frameworks without a skill registry concept do not emit this namespace; their operations appear as unwrapped `gen_ai.chat` / `gen_ai.tool.call` spans. The skill registry view aggregates what frameworks declare, not what we think qualifies.
- **Outcome enum rationale.** `outcome` is a closed enum so the skill registry can aggregate. `partial` exists because real skills often succeed at the primary task but fail at cleanup; conflating that with `success` hides real debt. `aborted` is user/timeout cancellation, distinct from `failed`.
- **Retry count scope.** `retry_count` lives on the skill invocation, not on underlying tool calls. Tool-level retries already get individual spans via normal OTel semantics. Skill-level `retry_count` counts times the *entire skill* re-ran from its entry point.
- **Content recording hooks.** Skill inputs and outputs are captured as span events (`tracebloom.skill.input`, `tracebloom.skill.output`), same pattern as tool call content recording. Schema deferred to `docs/content-recording.md`.
- **Entry point.** `entry_point` identifies which defined invocation point of the skill was used. Skills can expose multiple entry points (e.g., `main`, `dry_run`, `diagnose_only`). The skill registry view groups by `name × version × entry_point` so a skill with three entry points appears as three rows with distinct outcome/latency stats. Adapters MUST emit `"main"` as the default when a skill has a single entry point.

**Views consumed.** Skill registry view (primary — aggregates name × version × entry_point × outcome). Flame graph (skill invocation spans are collapsible parent nodes). Drift detector (watches outcome distribution per skill version and entry point).

### 3.3 `tracebloom.replay.*` and `tracebloom.branch.*`

**Concept.** Two related but distinct debugging workflows live in adjacent namespaces. A **replay** re-runs an original trace with exactly one variable changed, answering "what would have happened if X were different?" A **branch experiment** re-runs with multiple variables changed, answering "what does this alternative agent configuration produce?" These are different investigations. The dashboard presents them differently.

**Span kind.** Replayed and branched spans carry the same span kinds as their originals (`gen_ai.chat`, `gen_ai.tool.call`, `tracebloom.memory.operation`, etc.) plus the replay or branch attributes below. The root `tracebloom.decision` span of a replay or branch carries the full metadata; child spans carry only the `session_id`, `original_session_id`, and `original_span_id` attributes for lookup.

**`tracebloom.replay.*` — single-variable replays**

| Attribute | Type | Required | Example | Appears on |
|---|---|---|---|---|
| `tracebloom.replay.session_id` | string | yes on every replayed span | `"rep_9f2c"` | all spans in replay |
| `tracebloom.replay.original_session_id` | string | yes on every replayed span | `"sess_abc123"` | all spans in replay |
| `tracebloom.replay.original_span_id` | string | yes on every replayed span | `"7a3f91c2"` | all spans in replay |
| `tracebloom.replay.variant` | enum | yes | `"model"` | root decision span only |
| `tracebloom.replay.variant_from` | string | yes | `"gpt-4o"` | root decision span only |
| `tracebloom.replay.variant_to` | string | yes | `"claude-opus-4-7"` | root decision span only |

**Enum:** `tracebloom.replay.variant`: `model`, `system_prompt`, `temperature`, `memory_snapshot`, `tool_impl`.

Five values only. No `branch_experiment`. No `invalid` / `invalid_reason` attributes.

**`tracebloom.branch.*` — multi-variable experiments**

| Attribute | Type | Required | Example | Appears on |
|---|---|---|---|---|
| `tracebloom.branch.session_id` | string | yes on every span | `"br_4e2d"` | all spans in branch |
| `tracebloom.branch.original_session_id` | string | yes on every span | `"sess_abc123"` | all spans in branch |
| `tracebloom.branch.original_span_id` | string | yes on every span | `"7a3f91c2"` | all spans in branch |
| `tracebloom.branch.variants_changed` | string[] | yes | `["model", "temperature"]` | root decision span only |
| `tracebloom.branch.label` | string | optional | `"aggressive-config-v2"` | root decision span only |

**Design notes.**

- **Structured variant fields.** `variant_from` / `variant_to` on replay are structured, not a combined string. Dashboard composes human-readable arrows at render time; drift queries key on structured fields.
- **Separate namespaces, not a unified flag.** Replay and branch are separate namespaces, not a unified namespace with an `invalid` flag. Rationale: encoding a valid branch experiment as an "invalid replay" signals "your investigation is broken" when it isn't. They are genuinely different debugging workflows — replay isolates a variable, branch varies the configuration — and the dashboard presents them differently. In v1 tracebloom ships the replay diff view only; `tracebloom.branch.*` attributes are reserved and emitted but not yet rendered (the branch comparison view lands in v1.1).
- **Original span ID on every span.** `replay.original_span_id` and `branch.original_span_id` are required on every replayed / branched span (not just the root) so the diff renderer aligns child spans in O(1) without walking the tree.

**Views consumed.** Replay diff view (primary for replay). Branch comparison view (primary for branch, v1.1+). Flame graph (both render replayed / branched spans side-by-side with original).

### 3.4 `tracebloom.decision.*`

**Concept.** A decision wraps one agent turn — the atomic unit binding user input, LLM calls, tool calls, memory ops, and output into one coherent span. It is the parent span type for every turn. OpenTelemetry has no equivalent.

**Span kind.** New span named `tracebloom.decision`. Every other span in a turn is a descendant (directly or via a skill invocation in between).

**Attributes.**

| Attribute | Type | Required | Example | Appears on |
|---|---|---|---|---|
| `tracebloom.decision.id` | string | yes | `"dec_9f2c1a"` | `tracebloom.decision` |
| `tracebloom.decision.turn_index` | int | yes | `3` (monotonic within a conversation) | `tracebloom.decision` |
| `tracebloom.decision.status` | enum | yes, on span close | `"completed"` | `tracebloom.decision` |
| `tracebloom.decision.caller` | enum | yes | `"user"` | `tracebloom.decision` |
| `tracebloom.decision.caller_id` | string | when caller requires it (see design notes) | `"skinv_abc123"` | `tracebloom.decision` |
| `tracebloom.decision.input_summary` | string | yes | `"debug mypackage import error"` | `tracebloom.decision` |
| `tracebloom.decision.output_summary` | string | yes, on span close | `"diagnosed as missing __init__.py"` | `tracebloom.decision` |
| `tracebloom.decision.notable` | boolean | optional | `true` | `tracebloom.decision` |
| `tracebloom.decision.notable_reason` | string | when `notable=true` | `"latency 5.2× baseline"` | `tracebloom.decision` |

**Enum definitions.**

- `tracebloom.decision.status`: `completed`, `aborted`, `errored`
- `tracebloom.decision.caller`: `user`, `scheduler`, `agent`, `skill`, `retry`, `system`

**Design notes.**

- **Adapter-emitted summaries.** Summaries are adapter-emitted, not post-computed. SDK's `tracebloom.start_turn(input_summary=...)` / `tracebloom.end_turn(output_summary=...)` accept them explicitly. Post-hoc LLM summarization is out of scope for v1 — expensive, probabilistic, and changes the contract from "what the developer said" to "what a summarizer thinks."
- **Decision boundary.** A decision spans from input arrival to final agent output for that turn. Multi-step tool-calling loops with three `gen_ai.chat` calls are *one decision*, not three.
- **Who sets notable.** `notable` is set by the drift detector (post-ingest) or by the developer via `tracebloom.mark_notable(reason=...)`. Adapters do not speculatively mark notable. Rationale: ambient sidebar should surface signal, not noise.
- **Turn index scoping.** `turn_index` is scoped to `gen_ai.conversation.id`, not `tracebloom.session.id`. A session with three conversations has three independent turn-index sequences.
- **Caller semantics.** `caller` disambiguates turn initiation: `user` (human input), `scheduler` (timer, cron, queue), `agent` (another agent in a multi-agent system), `skill` (a parent skill invoked this sub-decision), `retry` (parent decision is retrying itself), `system` (internal/bootstrap). `caller_id` resolves the category when meaningful: for `agent`, the agent name (`"agent:planner"`); for `skill`, the parent `tracebloom.skill.invocation_id`; for `retry`, the parent `tracebloom.decision.id`; for `scheduler`, an opaque schedule identifier. `user` and `system` do not require `caller_id`. The enum is closed; new caller kinds require a spec-PR. Replay context is captured in `tracebloom.replay.*`, not here — `caller` describes *how the turn was initiated*, not *what mode the session is running in*.

**Views consumed.** Flame graph (primary — decision is the top-level span for each turn; `caller` drives an icon/badge). Ambient sidebar (drift notables point at decision spans). Replay diff (replays anchored to original decisions).

---

## 4. Worked example — canonical agent turn

Scenario: user asks agent to debug a Python package import error. Agent invokes `debug_python_package` skill v1.2.0 (entry point `main`), which retrieves similar past sessions from a vector store, runs `pip show mypackage`, reads `setup.py`, and calls `gpt-4o` to analyze. Produces a summary.

### Span tree

```
tracebloom.decision (dec_9f2c1a, turn_index=3, caller=user)
└── tracebloom.skill.invocation (debug_python_package v1.2.0, entry_point=main)
    ├── tracebloom.memory.operation (retrieve, past-debug-sessions, ttl=86400s)
    │   └── gen_ai.embedding (query embedding, 1536-dim)
    ├── gen_ai.tool.call (bash: "pip show mypackage")
    ├── gen_ai.tool.call (read_file: "setup.py")
    └── gen_ai.chat (gpt-4o, analyze results, streaming, w/ reasoning tokens)
```

### Full attributes per span

Every span additionally carries `tracebloom.session.id = "sess_7a3f"`; omitted below for brevity.

**`tracebloom.decision` (root)**

```json
{
  "name": "tracebloom.decision",
  "span_id": "9f2c1a",
  "parent_span_id": null,
  "attributes": {
    "gen_ai.conversation.id": "conv_1001",
    "gen_ai.operation.name": "chat",
    "tracebloom.decision.id": "dec_9f2c1a",
    "tracebloom.decision.turn_index": 3,
    "tracebloom.decision.status": "completed",
    "tracebloom.decision.caller": "user",
    "tracebloom.decision.input_summary": "debug mypackage import error",
    "tracebloom.decision.output_summary": "diagnosed as missing __init__.py in mypackage/utils/"
  }
}
```

**`tracebloom.skill.invocation`**

```json
{
  "name": "tracebloom.skill.invocation",
  "span_id": "b2d4",
  "parent_span_id": "9f2c1a",
  "attributes": {
    "gen_ai.conversation.id": "conv_1001",
    "gen_ai.operation.name": "skill_invocation",
    "tracebloom.skill.name": "debug_python_package",
    "tracebloom.skill.version": "1.2.0",
    "tracebloom.skill.entry_point": "main",
    "tracebloom.skill.registry": "github:tracebloom/skills",
    "tracebloom.skill.definition_uri": "github:tracebloom/skills@v1.2.0/debug_python_package.yaml",
    "tracebloom.skill.invocation_id": "skinv_abc123",
    "tracebloom.skill.outcome": "success",
    "tracebloom.skill.retry_count": 0
  }
}
```

**`tracebloom.memory.operation` (retrieve)**

```json
{
  "name": "tracebloom.memory.operation",
  "span_id": "e5f6",
  "parent_span_id": "b2d4",
  "attributes": {
    "gen_ai.operation.name": "memory_operation",
    "tracebloom.skill.name": "debug_python_package",
    "tracebloom.skill.version": "1.2.0",
    "tracebloom.skill.entry_point": "main",
    "tracebloom.skill.invocation_id": "skinv_abc123",
    "tracebloom.memory.operation": "retrieve",
    "tracebloom.memory.kind": "vector",
    "tracebloom.memory.store_name": "past-debug-sessions",
    "tracebloom.memory.query": "python import error traceback __init__",
    "tracebloom.memory.result_count": 4,
    "tracebloom.memory.result_ids": ["doc_a1", "doc_b7", "doc_c3", "doc_d9"],
    "tracebloom.memory.result_scores": [0.89, 0.84, 0.81, 0.77],
    "tracebloom.memory.ttl_hint_seconds": 86400
  }
}
```

**`gen_ai.embedding` (child of memory.operation)**

```json
{
  "name": "gen_ai.embedding",
  "span_id": "0a1b",
  "parent_span_id": "e5f6",
  "attributes": {
    "gen_ai.system": "openai",
    "gen_ai.operation.name": "embeddings",
    "gen_ai.request.model": "text-embedding-3-small",
    "gen_ai.usage.input_tokens": 14,
    "tracebloom.skill.name": "debug_python_package",
    "tracebloom.skill.version": "1.2.0",
    "tracebloom.skill.entry_point": "main",
    "tracebloom.skill.invocation_id": "skinv_abc123"
  }
}
```

**`gen_ai.tool.call` (bash)**

```json
{
  "name": "gen_ai.tool.call",
  "span_id": "2c3d",
  "parent_span_id": "b2d4",
  "attributes": {
    "gen_ai.operation.name": "tool_call",
    "gen_ai.tool.name": "bash",
    "gen_ai.tool.call.id": "call_bash_01",
    "gen_ai.tool.type": "function",
    "tracebloom.skill.name": "debug_python_package",
    "tracebloom.skill.version": "1.2.0",
    "tracebloom.skill.entry_point": "main",
    "tracebloom.skill.invocation_id": "skinv_abc123"
  },
  "events": [
    {"name": "gen_ai.tool.call.arguments", "payload_schema_ref": "docs/content-recording.md"},
    {"name": "gen_ai.tool.call.result", "payload_schema_ref": "docs/content-recording.md"}
  ]
}
```

**`gen_ai.tool.call` (read_file)** — structure identical to bash; `gen_ai.tool.name = "read_file"`, same skill attrs.

**`gen_ai.chat` (analysis, streaming w/ reasoning tokens)**

```json
{
  "name": "gen_ai.chat",
  "span_id": "6e7f",
  "parent_span_id": "b2d4",
  "attributes": {
    "gen_ai.system": "openai",
    "gen_ai.operation.name": "chat",
    "gen_ai.request.model": "gpt-4o",
    "gen_ai.request.temperature": 0.2,
    "gen_ai.request.seed": 42,
    "gen_ai.response.model": "gpt-4o-2024-08-06",
    "gen_ai.response.finish_reasons": ["stop"],
    "gen_ai.response.role": "assistant",
    "gen_ai.response.id": "chatcmpl_xyz789",
    "gen_ai.usage.input_tokens": 2480,
    "gen_ai.usage.output_tokens": 340,
    "gen_ai.usage.reasoning_tokens": 1200,
    "gen_ai.conversation.id": "conv_1001",
    "tracebloom.response.streaming": true,
    "tracebloom.response.time_to_first_token_ms": 340,
    "tracebloom.response.stream_duration_ms": 2800,
    "tracebloom.skill.name": "debug_python_package",
    "tracebloom.skill.version": "1.2.0",
    "tracebloom.skill.entry_point": "main",
    "tracebloom.skill.invocation_id": "skinv_abc123"
  }
}
```

### Annotations

- **Skill attributes propagate through every descendant span, including `gen_ai.embedding` spans under memory operations.** The cost to the memory timeline view is one unused attribute per embedding; the benefit is accurate skill cost attribution (the skill registry's "tokens consumed" aggregation captures embedding tokens triggered by skill-invoked memory retrievals).
- **Conversation ID is on the chat span and the decision span**, but not on every intermediate span. Adapters are not required to propagate `gen_ai.conversation.id` to tool calls and memory ops — only to LLM-adjacent spans where it carries semantic meaning.
- **No streaming attributes on non-chat spans.** Only `gen_ai.chat` carries `tracebloom.response.streaming`. Embeddings and tool calls aren't streamed in the same sense.
- **User-initiated turn omits `caller_id`.** The root decision has `caller = "user"` and no `caller_id`, per §3.4. A skill-initiated sub-decision would have `caller = "skill"` and `caller_id = "skinv_abc123"`.

---

## 5. Non-goals and version policy

### 5.1 Non-goals (v1)

- **Multi-tenant attributes.** No `tenant.id`, `org.id`, `workspace.id`. tracebloom is a developer debugging companion first. When team surfaces arrive, revisit.
- **Cost attribution beyond token counts.** No dollar amounts. Downstream consumers compute cost from `gen_ai.usage.*` and their own pricing tables.
- **User-defined tracebloom extensions.** `tracebloom.*` is reserved; users extend via OTel resource attributes or their own vendor namespaces. We will not ship an extension point that lets third parties inject into `tracebloom.*`.
- **Custom span kinds.** The six span kinds defined here (`gen_ai.chat`, `gen_ai.tool.call`, `gen_ai.embedding`, `tracebloom.decision`, `tracebloom.skill.invocation`, `tracebloom.memory.operation`) are the entire set. No per-adapter invention.
- **PII detection and redaction.** Content recording (`docs/content-recording.md`) is where redaction policy lives. Not here.
- **Sampling configuration.** OTel resource-level concern, out of scope for the attribute contract.
- **Derived trace-level aggregates.** Total cost, total duration, span count, etc. are computed by consumers from span data. Not emitted as trace-level attributes.

### 5.2 Version policy

- **This document is the spec.** Changes land as PRs against this file, reviewed like code.
- **Adding attributes is minor-version-compatible.** A v0.2.0 → v0.3.0 bump may add new optional attributes; consumers MUST ignore unknown attributes per OTel convention.
- **Removing attributes requires a major version bump** plus one full minor-version deprecation window where the attribute is marked deprecated in this doc and emitted alongside its replacement (if any).
- **Renaming is two operations**: add the new name (minor bump), deprecate the old name (next minor bump), remove the old name (next major bump). No atomic renames.
- **Enum values are closed.** Adding a new enum value is a minor-compatible change. Removing one requires the rename-style deprecation path.
- **OTel GenAI semconv adoption is incremental.** When OTel ratifies an attribute that supersedes a `tracebloom.*` extension (e.g., streaming attributes in §2.7), tracebloom dual-emits for one minor version, deprecates the `tracebloom.*` name, removes in the next minor. Consumers MUST migrate during the dual-emit window.
- **Stability commitment.** Once a minor version ships emitting an attribute with a given name, type, and semantics, those three properties do not change under that name. Fixing a mistake requires the rename path.
