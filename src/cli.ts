import {parseRequest, runToolLoop} from "./legal_intake.js";

const body = parseRequest({matterId: "M-demo", clientName: "Example Client", signedDocumentId: "DOC-demo", deadline: "2026-12-01"});
const result = await runToolLoop(body);
console.log(JSON.stringify(result, null, 2));
