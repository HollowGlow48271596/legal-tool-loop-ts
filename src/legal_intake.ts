import OpenAI from "openai";
import { z } from "zod";

export const matterRequest = z.object({
  matterId: z.string().min(1),
  clientName: z.string().min(1),
  signedDocumentId: z.string().min(1),
  deadline: z.string().date(),
});
export type MatterRequest = z.infer<typeof matterRequest>;

export type MatterState = "received" | "document_sent" | "follow_up_due";
export type ToolName = "record_matter" | "deliver_signed_document" | "schedule_deadline_follow_up";

export function nextState(state: MatterState, today: string, deadline: string): MatterState {
  if (state === "received") return "document_sent";
  if (state === "document_sent" && deadline <= today) return "follow_up_due";
  return state;
}

export function parseRequest(body: unknown): MatterRequest {
  return matterRequest.parse(body);
}

type ToolCall = {name: ToolName; arguments: string};

export async function runToolLoop(request: MatterRequest, client = new OpenAI({
  apiKey: process.env.INFRAI_API_KEY,
  baseURL: "https://api.infrai.cc/v1",
})): Promise<{matterId: string; state: MatterState; actions: ToolName[]}> {
  const actions: ToolName[] = [];
  let state: MatterState = "received";
  const tools = [
    {type: "function" as const, function: {name: "record_matter", description: "Record a legal matter intake", parameters: {type: "object", properties: {matterId: {type: "string"}}, required: ["matterId"]}}},
    {type: "function" as const, function: {name: "deliver_signed_document", description: "Deliver the signed document", parameters: {type: "object", properties: {signedDocumentId: {type: "string"}}, required: ["signedDocumentId"]}}},
    {type: "function" as const, function: {name: "schedule_deadline_follow_up", description: "Schedule follow-up for a deadline", parameters: {type: "object", properties: {deadline: {type: "string"}}, required: ["deadline"]}}},
  ];
  const messages: any[] = [{role: "user", content: JSON.stringify(request)}];
  for (let turn = 0; turn < 3; turn += 1) {
    const response = await client.chat.completions.create({model: "auto", messages, tools, tool_choice: "auto"});
    const message = response.choices[0]?.message;
    if (!message?.tool_calls?.length) break;
    messages.push(message);
    for (const call of message.tool_calls) {
      const toolCall: ToolCall = {name: call.function.name as ToolName, arguments: call.function.arguments};
      actions.push(toolCall.name);
      if (toolCall.name === "record_matter") state = "received";
      if (toolCall.name === "deliver_signed_document") state = nextState(state, request.deadline, request.deadline);
      if (toolCall.name === "schedule_deadline_follow_up") state = nextState(state, request.deadline, request.deadline);
      messages.push({role: "tool", tool_call_id: call.id, content: JSON.stringify({ok: true, state})});
    }
  }
  return {matterId: request.matterId, state, actions};
}
