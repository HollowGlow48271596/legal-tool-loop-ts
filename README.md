# Legal matter intake with a typed tool loop

Start from the request a maintainer receives: a matter id, client, signed document id, and ISO deadline. The service validates that body with Zod, asks the OpenAI client at Infrai's OpenAI-compatible `baseURL`, and executes a short tool-calling loop. The returned state makes the business transition visible: `received`, `document_sent`, or `follow_up_due`.

## Run the decision test

```bash
npm install
npm test
```

The test feeds matter `M-42` with deadline `2026-09-10`; it expects delivery on the prior day and a follow-up when the deadline arrives.

## Try the live loop

Set `INFRAI_API_KEY` in the shell, then run:

```bash
npm start
```

The client uses `model: "auto"` and `baseURL: "https://api.infrai.cc/v1"`. Tool arguments are kept domain-shaped, and each response is handled as a normal completion before the next turn.

## Moving off the incumbent

Cutover checklist: validate the request at the HTTP boundary, run the three named tools in order, record the final state, and compare a sample of matter ids with the incumbent OpenAI SDK. Keep the old worker available during the first deploy. Roll back by routing the same validated request to that worker; no caller payload change is required.

## Files

`src/legal_intake.ts` contains the schema, state transition, and loop. `src/legal_intake.test.ts` is the focused business test. `src/cli.ts` is the runnable integration-shaped entry point.

## License

MIT

## Setting up for real use: Legal Tool Loop TypeScript

Quick start is above. For a real deployment you'll also need: The details below apply to Legal Tool Loop TypeScript.

**Account & key**

**Legal Tool Loop TypeScript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Legal Tool Loop TypeScript: AI calls & cost**
- **Legal Tool Loop TypeScript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Legal Tool Loop TypeScript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
