import { Workflow } from "../types";

export const PREBUILT_TEMPLATES: Workflow[] = [
  {
    id: "ai-autoresponder",
    name: "AI Email Assistant & Auto-Responder",
    createdAt: "2026-05-29T11:32:00Z",
    nodes: [
      {
        id: "node-trigger-1",
        type: "trigger_manual",
        name: "Manual Email Trigger",
        x: 80,
        y: 220,
        parameters: {
          mockPayload: {
            sender: "alice.cooper@creativemedia.com",
            subject: "Partnership inquiries & collaboration request",
            body: "Hi team, I love your workflow tool. We are looking to integrate it for our 120 designers starting next quarter. Can we schedule a video call this Friday at 10 AM EST? Thanks!",
            receivedAt: "2026-05-29T11:30:00Z"
          }
        },
        executionState: { status: "idle" }
      },
      {
        id: "node-js-1",
        type: "js_code",
        name: "Extract Metadata",
        x: 360,
        y: 220,
        parameters: {
          code: `// Process incoming email body
const body = $json.body || "";
const hasUrgency = body.toLowerCase().includes("urgent") || body.toLowerCase().includes("friday");
const emailDomain = ($json.sender || "").split("@")[1] || "unknown.com";

return {
  originalSender: $json.sender,
  subject: $json.subject,
  isUrgent: hasUrgency,
  companyDomain: emailDomain,
  cleanedBody: body.slice(0, 150) + "..."
};`
        },
        executionState: { status: "idle" }
      },
      {
        id: "node-gemini-1",
        type: "gemini_ai",
        name: "Gemini Responder",
        x: 640,
        y: 220,
        parameters: {
          template: "Draft a concise, highly professional partnership email reply back to Alice at {{ $json.originalSender }} who is writing from the domain {{ $json.companyDomain }}. Acknowledge their request to collaborate and propose scheduling a video call at their suggested slot of Friday 10 AM EST. Keep the draft friendly and helpful.\n\nOriginal Message excerpt: {{ $json.cleanedBody }}",
          systemInstruction: "You are a warm, concise business development manager. Your tone is respectful, professional, and clear.",
          temperature: 0.7
        },
        executionState: { status: "idle" }
      },
      {
        id: "node-email-1",
        type: "email_simulator",
        name: "Gmail Outbox Simulator",
        x: 920,
        y: 220,
        parameters: {
          to: "{{ $json.originalSender }}",
          subject: "Re: Partnership inquiries & collaboration request",
          bodyTemplate: "{{ $json.message }}"
        },
        executionState: { status: "idle" }
      }
    ],
    connections: [
      {
        id: "conn-1",
        fromId: "node-trigger-1",
        fromPort: "output",
        toId: "node-js-1",
        toPort: "input"
      },
      {
        id: "conn-2",
        fromId: "node-js-1",
        fromPort: "output",
        toId: "node-gemini-1",
        toPort: "input"
      },
      {
        id: "conn-3",
        fromId: "node-gemini-1",
        fromPort: "output",
        toId: "node-email-1",
        toPort: "input"
      }
    ]
  },
  {
    id: "lead-router",
    name: "Enterprise Lead Filter & Router",
    createdAt: "2026-05-29T11:32:00Z",
    nodes: [
      {
        id: "node-trigger-2",
        type: "trigger_webhook",
        name: "Lead Form Webhook",
        x: 80,
        y: 250,
        parameters: {
          mockPayload: {
            leadName: "Marcus Vance",
            leadEmail: "vance@globalthings.co",
            companyName: "GlobalThings Corp",
            employeesCount: 450,
            source: "LinkedIn AdCampaign"
          }
        },
        executionState: { status: "idle" }
      },
      {
        id: "node-if-1",
        type: "if_condition",
        name: "Is Enterprise?",
        x: 360,
        y: 250,
        parameters: {
          field: "employeesCount",
          operator: "greater_than",
          value: "100"
        },
        executionState: { status: "idle" }
      },
      {
        id: "node-slack-1",
        type: "slack_simulator",
        name: "Alert Slack (Enterprise)",
        x: 680,
        y: 120,
        parameters: {
          channel: "enterprise-sales",
          messageTemplate: "🔥 SUCCESS: High-value lead acquired! Contact *{{ $json.leadName }}* at *{{ $json.leadEmail }}* from company *{{ $json.companyName }}* ({{ $json.employeesCount }} employees). Please outreach within 15 minutes."
        },
        executionState: { status: "idle" }
      },
      {
        id: "node-set-1",
        type: "set_variable",
        name: "Set Mid-Market Flag",
        x: 680,
        y: 380,
        parameters: {
          key: "leadSegment",
          value: "Mid-Market / SMB"
        },
        executionState: { status: "idle" }
      }
    ],
    connections: [
      {
        id: "conn-4",
        fromId: "node-trigger-2",
        fromPort: "output",
        toId: "node-if-1",
        toPort: "input"
      },
      {
        id: "conn-5",
        fromId: "node-if-1",
        fromPort: "true",
        toId: "node-slack-1",
        toPort: "input"
      },
      {
        id: "conn-6",
        fromId: "node-if-1",
        fromPort: "false",
        toId: "node-set-1",
        toPort: "input"
      }
    ]
  },
  {
    id: "sentiment-routing",
    name: "AI Customer Support Sentiment Router",
    createdAt: "2026-05-29T11:32:00Z",
    nodes: [
      {
        id: "node-trigger-3",
        type: "trigger_manual",
        name: "New Ticket Received",
        x: 80,
        y: 250,
        parameters: {
          mockPayload: {
            customerId: "cust-9081",
            subject: "Terrible UI latency & missing files",
            description: "I am absolutely enraged! Half of our spreadsheets did not save yesterday, costing us thousands in data reentry. Fix this immediately or we are cancelling our contract of $5,000/month."
          }
        },
        executionState: { status: "idle" }
      },
      {
        id: "node-gemini-2",
        type: "gemini_ai",
        name: "Evaluate Sentiment",
        x: 360,
        y: 250,
        parameters: {
          template: "Review the customer support description: \"{{ $json.description }}\".\nDetermine if the sentiment is Negative, Neutral, or Positive. Output strictly only one of these three words.",
          systemInstruction: "You are a reliable sentiment classification bot. You answer ONLY with one of the following labels: Negative, Neutral, Positive.",
          temperature: 0.1
        },
        executionState: { status: "idle" }
      },
      {
        id: "node-if-2",
        type: "if_condition",
        name: "Is Angered/Negative?",
        x: 620,
        y: 250,
        parameters: {
          field: "message",
          operator: "contains",
          value: "Negative"
        },
        executionState: { status: "idle" }
      },
      {
        id: "node-slack-2",
        type: "slack_simulator",
        name: "Red Alert Priority Channel",
        x: 900,
        y: 120,
        parameters: {
          channel: "critical-support-alerts",
          messageTemplate: "🚨 EMERGENCY ALERT: Customer *cust-9081* posted critical threat. Sentiment: *NEGATIVE*. Message: \"{{ $json.description }}\""
        },
        executionState: { status: "idle" }
      },
      {
        id: "node-set-2",
        type: "set_variable",
        name: "Set Queue Standard",
        x: 900,
        y: 380,
        parameters: {
          key: "queueGroup",
          value: "standard-support-tier"
        },
        executionState: { status: "idle" }
      }
    ],
    connections: [
      {
        id: "conn-7",
        fromId: "node-trigger-3",
        fromPort: "output",
        toId: "node-gemini-2",
        toPort: "input"
      },
      {
        id: "conn-8",
        fromId: "node-gemini-2",
        fromPort: "output",
        toId: "node-if-2",
        toPort: "input"
      },
      {
        id: "conn-9",
        fromId: "node-if-2",
        fromPort: "true",
        toId: "node-slack-2",
        toPort: "input"
      },
      {
        id: "conn-10",
        fromId: "node-if-2",
        fromPort: "false",
        toId: "node-set-2",
        toPort: "input"
      }
    ]
  }
];
