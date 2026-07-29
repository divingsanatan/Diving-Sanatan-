"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Radar, Play, CheckCircle, XCircle, Clock, AlertTriangle,
  TrendingUp, Eye, Link2, MessageSquare, RefreshCw,
  Search, FileText, Shield, Globe, Zap, Activity,
  ChevronDown, ChevronUp, ExternalLink, Loader2, Check, X
} from "lucide-react";

/* ─── types ─── */
interface PendingChange {
  id: string;
  agent_name: string;
  change_type: string;
  target_entity: string;
  target_id?: string;
  proposed_data: any;
  current_data?: any;
  reason: string;
  status: string;
  created_at: string;
}

interface AgentRun {
  id: string;
  agent_name: string;
  status: string;
  started_at: string;
  completed_at?: string;
  items_processed?: number;
  run_summary?: any;
  error_message?: string;
}

interface DistEntry {
  id: string;
  target: string;
  status: string;
  pushed_at: string;
  response_summary?: any;
}

/* ─── Agent card config ─── */
const AGENTS = [
  {
    key: "scan",
    label: "Scan Website",
    description: "Hash every URL, detect changes, route to Discovery / Technical / On-page agents.",
    icon: <Search size={20} />,
    endpoint: "/api/seo/scan",
    color: "#6366f1",
    prominent: true,
  },
  {
    key: "monitoring",
    label: "Monitoring & Reporting",
    description: "Aggregate keyword rankings, page metrics, and API usage stats.",
    icon: <TrendingUp size={20} />,
    endpoint: "/api/seo/agents/monitoring",
    color: "#0ea5e9",
  },
  {
    key: "ai-visibility",
    label: "AI / GEO Visibility",
    description: "Probe AI search engines for brand citation rate (native model only).",
    icon: <Eye size={20} />,
    endpoint: "/api/seo/agents/ai-visibility",
    color: "#8b5cf6",
  },
  {
    key: "off-page",
    label: "Off-page & Backlinks",
    description: "Discover backlink candidates, evaluate DA, draft outreach emails (never auto-sent).",
    icon: <Link2 size={20} />,
    endpoint: "/api/seo/agents/off-page",
    color: "#f59e0b",
  },
  {
    key: "gmb",
    label: "Local / GMB",
    description: "Draft GBP review replies (posted only after your approval).",
    icon: <MessageSquare size={20} />,
    endpoint: "/api/seo/agents/gmb",
    color: "#10b981",
  },
];

/* ─── Helpers ─── */
const friendlyAgent = (name: string) => {
  const map: Record<string, string> = {
    change_detection_scan: "Site Scan",
    monitoring_reporting: "Monitoring",
    ai_geo_visibility: "AI Visibility",
    off_page_backlink: "Off-page",
    local_gmb_agent: "Local/GMB",
    on_page_content_quality: "On-page",
    technical_seo: "Technical SEO",
    on_demand_blog_rewrite: "Blog Rewrite",
    distribution_engine: "Distribution",
    discovery: "Discovery",
  };
  return map[name] || name;
};

const relTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const statusBadge = (s: string) => {
  switch (s) {
    case "pending": return { bg: "#fef3c7", fg: "#92400e", label: "Pending" };
    case "approved": return { bg: "#d1fae5", fg: "#065f46", label: "Approved" };
    case "applied": return { bg: "#dbeafe", fg: "#1e40af", label: "Applied" };
    case "rejected": return { bg: "#fee2e2", fg: "#991b1b", label: "Rejected" };
    case "running": return { bg: "#e0e7ff", fg: "#3730a3", label: "Running" };
    case "completed": return { bg: "#d1fae5", fg: "#065f46", label: "Completed" };
    case "failed": return { bg: "#fee2e2", fg: "#991b1b", label: "Failed" };
    case "success": return { bg: "#d1fae5", fg: "#065f46", label: "Success" };
    default: return { bg: "#f3f4f6", fg: "#374151", label: s };
  }
};

/* ─── Main Component ─── */
export default function SeoCommandCenter() {
  const [agentStates, setAgentStates] = useState<Record<string, { loading: boolean; result: any; error: string | null; lastRun: string | null }>>({});
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [recentRuns, setRecentRuns] = useState<AgentRun[]>([]);
  const [distLog, setDistLog] = useState<DistEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [approvalActions, setApprovalActions] = useState<Record<string, string>>({});
  const [expandedChange, setExpandedChange] = useState<string | null>(null);

  /* ─ load dashboard data ─ */
  const loadDashboard = useCallback(async () => {
    setLoadingData(true);
    try {
      const [pcRes, runsRes, distRes] = await Promise.all([
        fetch("/api/seo/approval?status=pending"),
        fetch("/api/seo/dashboard/runs"),
        fetch("/api/seo/dashboard/distribution"),
      ]);
      const pcJson = await pcRes.json();
      const runsJson = await runsRes.json();
      const distJson = await distRes.json();
      if (pcJson.success) setPendingChanges(pcJson.data || []);
      if (runsJson.success) setRecentRuns(runsJson.data || []);
      if (distJson.success) setDistLog(distJson.data || []);
    } catch (e) {
      console.warn("Dashboard load partial failure:", e);
    }
    setLoadingData(false);
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  /* ─ trigger an agent ─ */
  const triggerAgent = async (key: string, endpoint: string) => {
    setAgentStates(prev => ({ ...prev, [key]: { loading: true, result: null, error: null, lastRun: null } }));
    const nowIso = new Date().toISOString();
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setAgentStates(prev => ({ ...prev, [key]: { loading: false, result: json.data, error: null, lastRun: nowIso } }));
        
        // Optimistically record run in UI state so it shows instantly in Recent Agent Runs
        const agentNameMap: Record<string, string> = {
          "scan": "change_detection_scan",
          "monitoring": "monitoring_reporting",
          "ai-visibility": "ai_geo_visibility",
          "off-page": "off_page_backlink",
          "gmb": "local_gmb_agent"
        };
        setRecentRuns(prev => [
          {
            id: json.data?.runId || `run-${Date.now()}`,
            agent_name: agentNameMap[key] || key.replace(/-/g, "_"),
            status: "completed",
            started_at: nowIso,
            completed_at: nowIso,
            items_processed: json.data?.itemsProcessed ?? json.data?.totalUrlsChecked ?? json.data?.checksPerformed ?? 1,
            run_summary: json.data
          },
          ...prev.filter(r => r.id !== json.data?.runId)
        ]);
      } else {
        setAgentStates(prev => ({ ...prev, [key]: { loading: false, result: null, error: json.error || "Unknown error", lastRun: null } }));
      }
      // refresh pending changes and runs from server
      loadDashboard();
    } catch (err: any) {
      setAgentStates(prev => ({ ...prev, [key]: { loading: false, result: null, error: err.message, lastRun: null } }));
    }
  };

  /* ─ approve / reject ─ */
  const handleApproval = async (changeId: string, action: "approve" | "reject") => {
    setApprovalActions(prev => ({ ...prev, [changeId]: action === "approve" ? "approving" : "rejecting" }));
    const nowIso = new Date().toISOString();
    try {
      const res = await fetch("/api/seo/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeId, action }),
      });
      const json = await res.json();
      if (json.success) {
        setPendingChanges(prev => prev.filter(c => c.id !== changeId));
        setApprovalActions(prev => ({ ...prev, [changeId]: "done" }));
        
        // Optimistically record distribution in UI state so it shows instantly in Distribution Log
        if (action === "approve") {
          setDistLog(prev => [
            {
              id: `dist-${Date.now()}`,
              target: "IndexNow & Dynamic Sitemap",
              status: "success",
              pushed_at: nowIso,
              response_summary: json.data?.distributionResult || { ok: true }
            },
            ...prev
          ]);
        }
        loadDashboard();
      } else {
        setApprovalActions(prev => ({ ...prev, [changeId]: "error" }));
      }
    } catch {
      setApprovalActions(prev => ({ ...prev, [changeId]: "error" }));
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ════ PAGE HEADER ════ */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
          <Radar size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#1e293b" }}>SEO Command Center</h2>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
            All agents are <strong>manual-only</strong>. Nothing runs until you press the button.
          </p>
        </div>
        <button onClick={loadDashboard} style={{ marginLeft: "auto", background: "none", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#64748b" }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ════ AGENT TRIGGER CARDS ════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
        {AGENTS.map(agent => {
          const st = agentStates[agent.key];
          const isLoading = st?.loading;
          const isProminent = agent.prominent;
          return (
            <div key={agent.key} style={{
              border: isProminent ? `2px solid ${agent.color}` : "1px solid #e2e8f0",
              borderRadius: 14,
              padding: 20,
              background: isProminent
                ? `linear-gradient(135deg, ${agent.color}08, ${agent.color}15)`
                : "#fff",
              boxShadow: isProminent ? `0 4px 20px ${agent.color}18` : "0 1px 3px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              position: "relative" as const,
            }}>
              {/* header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${agent.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: agent.color }}>
                  {agent.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#1e293b" }}>{agent.label}</div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", lineHeight: 1.5 }}>{agent.description}</p>

              {/* result summary */}
              {st?.result && (
                <div style={{ fontSize: "0.75rem", color: "#065f46", background: "#ecfdf5", padding: "6px 10px", borderRadius: 8, lineHeight: 1.5 }}>
                  ✅ {st.result.durationMs ? `Completed in ${(st.result.durationMs / 1000).toFixed(1)}s` : "Done"} ·
                  {st.result.changedUrlsCount !== undefined && ` ${st.result.changedUrlsCount} changed`}
                  {st.result.pendingChangesGenerated !== undefined && ` · ${st.result.pendingChangesGenerated} proposals`}
                  {st.result.itemsProcessed !== undefined && ` ${st.result.itemsProcessed} items`}
                  {st.result.checksPerformed !== undefined && ` ${st.result.checksPerformed} checks`}
                  {st.result.citationRatePercent !== undefined && ` · ${st.result.citationRatePercent}% citation`}
                  {st.result.opportunitiesDiscovered !== undefined && ` ${st.result.opportunitiesDiscovered} opportunities`}
                  {st.result.repliesDrafted !== undefined && ` · ${st.result.repliesDrafted} replies drafted`}
                </div>
              )}
              {st?.error && (
                <div style={{ fontSize: "0.75rem", color: "#991b1b", background: "#fef2f2", padding: "6px 10px", borderRadius: 8 }}>
                  ❌ {st.error}
                </div>
              )}

              {/* trigger button */}
              <button
                disabled={!!isLoading}
                onClick={() => triggerAgent(agent.key, agent.endpoint)}
                style={{
                  marginTop: "auto",
                  background: isLoading ? "#94a3b8" : agent.color,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 0",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all .15s ease",
                }}
              >
                {isLoading
                  ? <><Loader2 size={16} className="spin" /> Running…</>
                  : <><Play size={14} /> Run Now</>
                }
              </button>
              {st?.lastRun && <div style={{ fontSize: "0.7rem", color: "#94a3b8", textAlign: "center" }}>Last run: {relTime(st.lastRun)}</div>}
            </div>
          );
        })}
      </div>

      {/* ════ TWO COLUMN LOWER SECTION ════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

        {/* ─── PENDING APPROVALS ─── */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={18} color="#f59e0b" />
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>
              Pending Approvals
              {pendingChanges.length > 0 && <span style={{ marginLeft: 8, background: "#fef3c7", color: "#92400e", fontSize: "0.7rem", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{pendingChanges.length}</span>}
            </h3>
          </div>

          {loadingData ? (
            <div style={{ textAlign: "center", padding: 30, color: "#94a3b8", fontSize: "0.85rem" }}>Loading…</div>
          ) : pendingChanges.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "#94a3b8", fontSize: "0.85rem" }}>
              <CheckCircle size={28} color="#10b981" style={{ display: "block", margin: "0 auto 10px" }} />
              All clear — nothing waiting for your approval.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto" }}>
              {pendingChanges.map(c => {
                const badge = statusBadge(c.status);
                const isExpanded = expandedChange === c.id;
                const actionState = approvalActions[c.id];
                return (
                  <div key={c.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", background: "#fafbfd" }}>
                    {/* header row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, background: badge.bg, color: badge.fg, padding: "2px 8px", borderRadius: 6 }}>{badge.label}</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6366f1" }}>{friendlyAgent(c.agent_name)}</span>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8", marginLeft: "auto" }}>{relTime(c.created_at)}</span>
                    </div>
                    <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "#475569", lineHeight: 1.45 }}>{c.reason}</p>

                    {/* expand toggle */}
                    <button onClick={() => setExpandedChange(isExpanded ? null : c.id)} style={{ background: "none", border: "none", color: "#6366f1", fontSize: "0.72rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, marginBottom: 8 }}>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {isExpanded ? "Hide Details" : "View Proposed Changes"}
                    </button>
                    {isExpanded && (
                      <pre style={{ background: "#f1f5f9", borderRadius: 8, padding: 10, fontSize: "0.7rem", overflowX: "auto", margin: "0 0 10px", color: "#334155", maxHeight: 160 }}>
                        {JSON.stringify(c.proposed_data, null, 2)}
                      </pre>
                    )}

                    {/* action buttons */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        disabled={!!actionState}
                        onClick={() => handleApproval(c.id, "approve")}
                        style={{ flex: 1, background: actionState === "approving" ? "#86efac" : "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "7px 0", fontSize: "0.78rem", fontWeight: 600, cursor: actionState ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        disabled={!!actionState}
                        onClick={() => handleApproval(c.id, "reject")}
                        style={{ flex: 1, background: actionState === "rejecting" ? "#fca5a5" : "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "7px 0", fontSize: "0.78rem", fontWeight: 600, cursor: actionState ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── RECENT RUNS + DISTRIBUTION ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Recent Agent Runs */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Activity size={18} color="#6366f1" />
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>Recent Agent Runs</h3>
            </div>
            {recentRuns.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: "0.85rem" }}>No runs recorded yet. Trigger an agent above to begin.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                {recentRuns.slice(0, 10).map(r => {
                  const badge = statusBadge(r.status);
                  return (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "#fafbfd", fontSize: "0.78rem" }}>
                      <span style={{ fontWeight: 600, color: "#334155", minWidth: 90 }}>{friendlyAgent(r.agent_name)}</span>
                      <span style={{ background: badge.bg, color: badge.fg, padding: "1px 7px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600 }}>{badge.label}</span>
                      {r.items_processed !== undefined && <span style={{ color: "#64748b" }}>{r.items_processed} items</span>}
                      <span style={{ color: "#94a3b8", marginLeft: "auto" }}>{relTime(r.started_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Distribution Log */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Zap size={18} color="#f59e0b" />
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>Distribution Log</h3>
            </div>
            {distLog.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: "0.85rem" }}>No distributions yet. Approve a change to see pushes here.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                {distLog.slice(0, 10).map(d => {
                  const badge = statusBadge(d.status);
                  return (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "#fafbfd", fontSize: "0.78rem" }}>
                      <span style={{ fontWeight: 600, color: "#334155", minWidth: 120 }}>{d.target.replace(/_/g, " ")}</span>
                      <span style={{ background: badge.bg, color: badge.fg, padding: "1px 7px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600 }}>{badge.label}</span>
                      <span style={{ color: "#94a3b8", marginLeft: "auto" }}>{relTime(d.pushed_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── css for spinner ─── */}
      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
