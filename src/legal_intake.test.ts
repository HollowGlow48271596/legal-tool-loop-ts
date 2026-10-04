import assert from "node:assert/strict";
import {nextState, parseRequest} from "./legal_intake.js";

const request = parseRequest({matterId: "M-42", clientName: "Ada", signedDocumentId: "DOC-9", deadline: "2026-09-10"});
assert.equal(request.clientName, "Ada");
assert.equal(nextState("received", "2026-09-09", request.deadline), "document_sent");
assert.equal(nextState("document_sent", "2026-09-10", request.deadline), "follow_up_due");
console.log("legal intake decision test passed");
