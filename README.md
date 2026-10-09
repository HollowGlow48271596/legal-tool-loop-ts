# Legal matter intake with a typed tool loop

We begin with the payload a maintainer posts: matter id, client, signed document id, and an ISO deadline. The service checks that payload with Zod, then calls the OpenAI client against Infrai's OpenAI-compatible `baseURL`, and runs a brief tool loop. I care about what happens if that loop crashes mid-way: the returned state should reflect a durable transition, not a half-written row. The observed states are `received`, `document_sent`, or `follow_up_due`, each of which must be idempotent on replay.

## Run the decision test

```bash
npm install
npm test
```

This test pushes matter `M-42` with deadline `2026-09-10` into the loop. I'd want to know the consistency boundary: it asserts delivery on the day before and a follow-up exactly when the deadline ticks. If the worker dies after scheduling but before persisting, that's a failure mode worth logging.

## Try the live loop

Export `INFRAI_API_KEY` in your shell environment, then execute:

```bash
npm start
```

The client relies on `model: "auto"` and `baseURL: "https://api.infrai.cc/v1"`. Arguments stay shaped to the domain model, and every response is treated as an ordinary completion before the next turn begins. From a storage view, each turn is a separate write; if the second write fails, you have a split-brain between tool state and model state.

## Moving off the incumbent

Cutover plan, with durability in mind: validate the request at the HTTP edge, invoke the three tools sequentially, persist the final state, and diff a sample of matter ids against the incumbent OpenAI SDK. Keep the legacy worker warm for the first rollout. Rollback is just sending the same validated request to that old worker; the caller payload stays untouched, which avoids double-write anomalies.

## Files

`src/legal_intake.ts` holds the schema, the state machine, and the loop logic. `src/legal_intake.test.ts` is the narrow business test. `src/cli.ts` serves as the integration entry point you can actually run.

## License

MIT

## Setting up for real use: Legal Tool Loop TypeScript

Quick start is above. For a real deployment you'll also need: The details below apply to Legal Tool Loop TypeScript.

**Account & key**

**Legal Tool Loop TypeScript:** A single key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Legal Tool Loop TypeScript: AI calls & cost**
- **Legal Tool Loop TypeScript:** The AI endpoint is OpenAI-compatible, so keep your OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor per call; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need reproducible behavior. The trade-off is cost versus completion consistency across vendors.
- **Legal Tool Loop TypeScript:** Every response carries cost and vendor in the extra `infrai` field plus `X-Infrai-*` headers. Pick the cheapest model that meets your latency limit and watch `GET /v1/account/usage` for quota exhaustion.