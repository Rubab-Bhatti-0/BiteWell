export interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: string;
}

export const AI_AGENTS: AIAgent[] = [
  {
    id: "appointment-reminder",
    name: "Appointment Reminder",
    description: "Automatically reminds patients about appointments",
    category: "Communication"
  },
  {
    id: "invoice-assistant",
    name: "Invoice Assistant",
    description: "Helps manage billing queries",
    category: "Finance"
  },
  {
    id: "patient-chatbot",
    name: "Patient Chatbot",
    description: "Answers patient questions",
    category: "Communication"
  },
  {
    id: "treatment-recommendation",
    name: "Treatment Recommendation",
    description: "Suggests treatment options",
    category: "Clinical"
  }
];
