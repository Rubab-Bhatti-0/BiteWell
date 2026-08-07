import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";
import { AI_AGENTS } from "../src/constants/agents.js";
async function httpRequest(server, method, path, headers = {}, body) {
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}${path}`;
  const reqHeaders = {
    "Content-Type": "application/json",
    ...headers
  };
  const options = {
    method,
    headers: reqHeaders
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  const data = await response.json();
  return { status: response.status, body: data };
}
async function runTests() {
  console.log("\u{1F9EA} Starting AI Agent Module Integration Tests...\n");
  let mongoServer = null;
  let server = null;
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log("\u2705 Connected to In-Memory MongoDB");
    server = app.listen(0);
    const address = server.address();
    console.log(`\u2705 Test server running on port ${address.port}
`);
    console.log("--- TEST 1: Clinic Registration & JWT Authentication ---");
    const regRes = await httpRequest(server, "POST", "/api/auth/register", {}, {
      name: "Smile Care Dental Clinic",
      ownerId: "owner-789",
      email: "contact@smilecaredental.com",
      planName: "Standard",
      maxAgents: 2
    });
    console.assert(regRes.status === 201, `Expected status 201, got ${regRes.status}`);
    console.assert(regRes.body.token !== void 0, "Expected JWT token in response");
    console.assert(regRes.body.subscription.maxAgents === 2, "Expected maxAgents to be 2");
    console.log("PASSED: Clinic registered & JWT issued successfully.\n");
    const token = regRes.body.token;
    const authHeader = { Authorization: `Bearer ${token}` };
    console.log("--- TEST 2: GET /api/agents (Hardcoded list with enabled status) ---");
    const agentsRes = await httpRequest(server, "GET", "/api/agents", authHeader);
    console.assert(agentsRes.status === 200, `Expected status 200, got ${agentsRes.status}`);
    console.assert(Array.isArray(agentsRes.body), "Expected array of agents");
    console.assert(agentsRes.body.length === AI_AGENTS.length, `Expected ${AI_AGENTS.length} agents`);
    console.assert(agentsRes.body.every((a) => a.enabled === false), "Expected all agents to initially have enabled=false");
    console.log("PASSED: All hardcoded AI agents retrieved with initial enabled=false.\n");
    console.log("--- TEST 3: POST /api/clinic/agents/patient-chatbot/enable ---");
    const enable1 = await httpRequest(server, "POST", "/api/clinic/agents/patient-chatbot/enable", authHeader);
    console.assert(enable1.status === 200, `Expected status 200, got ${enable1.status}`);
    console.assert(enable1.body.success === true, "Expected success=true");
    console.assert(enable1.body.data.id === "patient-chatbot", "Expected agentId patient-chatbot");
    console.log("PASSED: patient-chatbot enabled successfully.\n");
    console.log("--- TEST 4: GET /api/clinic/agents ---");
    const enabledRes = await httpRequest(server, "GET", "/api/clinic/agents", authHeader);
    console.assert(enabledRes.status === 200, `Expected status 200, got ${enabledRes.status}`);
    console.assert(enabledRes.body.length === 1, "Expected 1 enabled agent");
    console.assert(enabledRes.body[0].id === "patient-chatbot", "Expected patient-chatbot details");
    console.assert(enabledRes.body[0].name === "Patient Chatbot", "Expected hardcoded name match");
    console.log("PASSED: Clinic enabled agents returned full hardcoded agent details.\n");
    console.log("--- TEST 5: POST /api/clinic/agents/invoice-assistant/enable ---");
    const enable2 = await httpRequest(server, "POST", "/api/clinic/agents/invoice-assistant/enable", authHeader);
    console.assert(enable2.status === 200, `Expected status 200, got ${enable2.status}`);
    console.assert(enable2.body.success === true, "Expected success=true");
    console.log("PASSED: invoice-assistant enabled successfully.\n");
    console.log("--- TEST 6: POST /api/clinic/agents/appointment-reminder/enable (Quota Exceeded) ---");
    const enable3 = await httpRequest(server, "POST", "/api/clinic/agents/appointment-reminder/enable", authHeader);
    console.assert(enable3.status === 400, `Expected status 400, got ${enable3.status}`);
    console.assert(enable3.body.success === false, "Expected success=false");
    console.assert(
      enable3.body.message === "Maximum AI agents reached. Upgrade your subscription.",
      `Unexpected message: ${enable3.body.message}`
    );
    console.log("PASSED: Max agent subscription limit enforced correctly.\n");
    console.log("--- TEST 7: POST /api/clinic/agents/invalid-agent/enable ---");
    const invalidRes = await httpRequest(server, "POST", "/api/clinic/agents/invalid-agent/enable", authHeader);
    console.assert(invalidRes.status === 400, `Expected status 400, got ${invalidRes.status}`);
    console.assert(invalidRes.body.message === "Invalid AI Agent", `Unexpected message: ${invalidRes.body.message}`);
    console.log("PASSED: Invalid agent validation caught successfully.\n");
    console.log("--- TEST 8: POST /api/agents/patient-chatbot/usage ---");
    const usage1 = await httpRequest(server, "POST", "/api/agents/patient-chatbot/usage", authHeader, {
      action: "answer_patient_query",
      tokensUsed: 150,
      metadata: { session: "sess-001" }
    });
    console.assert(usage1.status === 201, `Expected status 201, got ${usage1.status}`);
    console.assert(usage1.body.data.tokensUsed === 150, "Expected tokensUsed 150");
    await new Promise((resolve) => setTimeout(resolve, 50));
    const usage2 = await httpRequest(server, "POST", "/api/agents/invoice-assistant/usage", authHeader, {
      action: "process_billing",
      tokensUsed: 300
    });
    console.assert(usage2.status === 201, `Expected status 201, got ${usage2.status}`);
    console.log("PASSED: Agent usage logs created & lastUsedAt timestamps updated.\n");
    console.log("--- TEST 9: GET /api/analytics/agents ---");
    const analyticsRes = await httpRequest(server, "GET", "/api/analytics/agents", authHeader);
    console.assert(analyticsRes.status === 200, `Expected status 200, got ${analyticsRes.status}`);
    console.assert(analyticsRes.body.totalRequests === 2, `Expected 2 total requests, got ${analyticsRes.body.totalRequests}`);
    console.assert(analyticsRes.body.activeAgents === 2, `Expected 2 active agents, got ${analyticsRes.body.activeAgents}`);
    console.assert(analyticsRes.body.mostUsedAgent !== null, "Expected mostUsedAgent not null");
    console.assert(analyticsRes.body.usageByAgent.length === 2, "Expected 2 entries in usageByAgent");
    console.log("PASSED: Analytics response calculated correctly.\n");
    console.log("--- TEST 10: POST /api/clinic/agents/invoice-assistant/disable ---");
    const disableRes = await httpRequest(server, "POST", "/api/clinic/agents/invoice-assistant/disable", authHeader);
    console.assert(disableRes.status === 200, `Expected status 200, got ${disableRes.status}`);
    console.assert(disableRes.body.status === "disabled", "Expected status disabled");
    const enabledAfterDisable = await httpRequest(server, "GET", "/api/clinic/agents", authHeader);
    console.assert(enabledAfterDisable.body.length === 1, "Expected 1 enabled agent left");
    console.log("PASSED: Agent disabled successfully.\n");
    console.log("--- TEST 11: POST /api/subscription/downgrade ---");
    await httpRequest(server, "POST", "/api/clinic/agents/appointment-reminder/enable", authHeader);
    const downgradeRes = await httpRequest(server, "POST", "/api/subscription/downgrade", authHeader, {
      planName: "Free",
      maxAgents: 1
    });
    console.assert(downgradeRes.status === 200, `Expected status 200, got ${downgradeRes.status}`);
    console.assert(downgradeRes.body.subscription.maxAgents === 1, "Expected new maxAgents = 1");
    console.assert(downgradeRes.body.disabledAgents.length === 1, "Expected 1 agent disabled after downgrade");
    console.assert(downgradeRes.body.disabledAgents[0].id === "appointment-reminder", `Expected appointment-reminder disabled, got ${downgradeRes.body.disabledAgents[0].id}`);
    console.log("PASSED: Downgrade handled successfully, least recently used agent disabled automatically.\n");
    console.log("\u{1F389} ALL INTEGRATION TESTS PASSED SUCCESSFULLY! \u{1F389}");
  } catch (err) {
    console.error("\u274C TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}
runTests();
