"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ICON_BY_CATEGORY = {
  Communication: "Bot",
  Finance: "Receipt",
  Clinical: "Sparkles",
  Default: "CalendarCheck"
};
async function getAuthToken() {
  let token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    token = typeof window !== "undefined" ? localStorage.getItem("saas_token") : null;
  }
  if (!token) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Demo Dental Clinic Admin",
          email: "demo@dentalsaas.com",
          password: "demo12345",
          clinicName: "Demo Dental Clinic",
          phone: ""
        })
      });
      const data = await res.json();
      if (data.token) {
        token = data.token;
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
        }
      }
    } catch {
      // Silent catch — fall back to mock data
    }
  }
  return token || "";
}
function useAgents() {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch agents");
      const data = await res.json();
      const mapped = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        iconName: ICON_BY_CATEGORY[item.category] || ICON_BY_CATEGORY.Default,
        isEnabled: Boolean(item.enabled)
      }));
      setAgents(mapped);
    } catch {
      setAgents([
        {
          id: "appointment-reminder",
          name: "Appointment Reminder",
          description: "Automatically reminds patients about appointments",
          category: "Communication",
          iconName: "CalendarCheck",
          isEnabled: false
        },
        {
          id: "invoice-assistant",
          name: "Invoice Assistant",
          description: "Helps manage billing queries",
          category: "Finance",
          iconName: "Receipt",
          isEnabled: false
        },
        {
          id: "patient-chatbot",
          name: "Patient Chatbot",
          description: "Answers patient questions",
          category: "Communication",
          iconName: "Bot",
          isEnabled: true
        },
        {
          id: "treatment-recommendation",
          name: "Treatment Recommendation",
          description: "Suggests treatment options",
          category: "Clinical",
          iconName: "Sparkles",
          isEnabled: false
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);
  const enableAgent = async (agent) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/clinic/agents/${agent.id}/enable`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(data.message || "Maximum AI agents reached. Upgrade your subscription.");
        return false;
      }
      setAgents(
        (prev) => prev.map((a) => a.id === agent.id ? { ...a, isEnabled: true } : a)
      );
      toast.success(`${agent.name} enabled successfully.`);
      return true;
    } catch {
      toast.error("Network error enabling agent.");
      return false;
    }
  };
  const disableAgent = async (agent) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/clinic/agents/${agent.id}/disable`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(data.message || "Failed to disable agent.");
        return false;
      }
      setAgents(
        (prev) => prev.map((a) => a.id === agent.id ? { ...a, isEnabled: false } : a)
      );
      toast.info(`${agent.name} has been disabled.`);
      return true;
    } catch {
      toast.error("Network error disabling agent.");
      return false;
    }
  };
  return { agents, isLoading, enableAgent, disableAgent, refetch: fetchAgents };
}
function useAgentAnalytics() {
  const [data, setData] = useState(void 0);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_BASE_URL}/analytics/agents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const apiData = await res.json();
        setData({
          totalRequestsToday: apiData.totalRequests || 0,
          mostUsedAgent: apiData.mostUsedAgent?.name || "N/A",
          activeAgentsCount: apiData.activeAgents || 0,
          dailyRequests: (apiData.dailyUsage || []).map((d) => ({
            date: d.date,
            requests: d.count
          })),
          usageByAgent: (apiData.usageByAgent || []).map((u) => ({
            name: u.name,
            requests: u.totalRequests
          }))
        });
      } catch {
        setData({
          totalRequestsToday: 1284,
          mostUsedAgent: "Patient Chatbot",
          activeAgentsCount: 2,
          dailyRequests: [
            { date: "Mon", requests: 120 },
            { date: "Tue", requests: 180 },
            { date: "Wed", requests: 150 },
            { date: "Thu", requests: 210 },
            { date: "Fri", requests: 190 },
            { date: "Sat", requests: 90 },
            { date: "Sun", requests: 344 }
          ],
          usageByAgent: [
            { name: "Patient Chatbot", requests: 520 },
            { name: "Invoice Assistant", requests: 300 },
            { name: "Appointment Reminder", requests: 464 }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);
  return { data, isLoading };
}
export {
  useAgentAnalytics,
  useAgents
};