import { useEffect, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaPlus, FaEdit, FaTrash, FaSync, FaQuestionCircle, FaTicketAlt, FaCheckCircle, FaTimesCircle, FaClock, FaTools } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  getAllFAQsAPI, createFAQAPI, updateFAQAPI, deleteFAQAPI,
  getAllTicketsAPI, updateTicketAPI, deleteTicketAPI,
} from "../apis/helpSupportApi";

const MySwal = withReactContent(Swal);

const STATUS_COLORS = {
  open: { bg: "bg-blue-100", text: "text-blue-800", icon: <FaClock /> },
  in_progress: { bg: "bg-yellow-100", text: "text-yellow-800", icon: <FaTools /> },
  resolved: { bg: "bg-green-100", text: "text-green-800", icon: <FaCheckCircle /> },
  closed: { bg: "bg-gray-100", text: "text-gray-800", icon: <FaTimesCircle /> },
};

export default function HelpSupport() {
  const { themeColors } = useTheme();
  const [tab, setTab] = useState("faqs");
  const [faqs, setFaqs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ticketFilter, setTicketFilter] = useState("");

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const res = await getAllFAQsAPI();
      setFaqs(res?.data?.faqs || []);
    } catch {
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await getAllTicketsAPI(ticketFilter);
      setTickets(res?.data?.tickets || []);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (tab === "faqs") fetchFAQs(); else fetchTickets(); }, [tab]);
  useEffect(() => { if (tab === "tickets") fetchTickets(); }, [ticketFilter]);

  // ── FAQ Create Modal ──────────────────────────────────────
  const showCreateFAQ = () => {
    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Add New FAQ</div>,
      html: (
        <div className="space-y-3 text-left">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Question *</label>
            <input id="faq-q" type="text" className="w-full p-2 rounded-lg border"
              placeholder="Enter question..."
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Answer *</label>
            <textarea id="faq-a" rows={4} className="w-full p-2 rounded-lg border"
              placeholder="Enter answer..."
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Order (optional)</label>
            <input id="faq-order" type="number" defaultValue={0} className="w-full p-2 rounded-lg border"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }} />
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: "Create FAQ",
      confirmButtonColor: themeColors.primary || "#3B82F6",
      background: themeColors.background,
      width: "550px",
      preConfirm: async () => {
        const question = document.getElementById("faq-q").value.trim();
        const answer = document.getElementById("faq-a").value.trim();
        const order = parseInt(document.getElementById("faq-order").value) || 0;
        if (!question) { Swal.showValidationMessage("Question is required"); return false; }
        if (!answer) { Swal.showValidationMessage("Answer is required"); return false; }
        try {
          await createFAQAPI({ question, answer, order });
        } catch (e) {
          Swal.showValidationMessage(e?.response?.data?.message || "Failed to create FAQ");
          return false;
        }
      },
    }).then((r) => { if (r.isConfirmed) { fetchFAQs(); toast.success("FAQ created!"); } });
  };

  // ── FAQ Edit Modal ────────────────────────────────────────
  const showEditFAQ = (faq) => {
    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Edit FAQ</div>,
      html: (
        <div className="space-y-3 text-left">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Question *</label>
            <input id="edit-faq-q" type="text" defaultValue={faq.question} className="w-full p-2 rounded-lg border"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Answer *</label>
            <textarea id="edit-faq-a" rows={4} defaultValue={faq.answer} className="w-full p-2 rounded-lg border"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Order</label>
              <input id="edit-faq-order" type="number" defaultValue={faq.order} className="w-full p-2 rounded-lg border"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Status</label>
              <select id="edit-faq-active" defaultValue={faq.isActive ? "true" : "false"} className="w-full p-2 rounded-lg border"
                style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: "Update FAQ",
      confirmButtonColor: themeColors.primary || "#3B82F6",
      background: themeColors.background,
      width: "550px",
      preConfirm: async () => {
        const question = document.getElementById("edit-faq-q").value.trim();
        const answer = document.getElementById("edit-faq-a").value.trim();
        const order = parseInt(document.getElementById("edit-faq-order").value) || 0;
        const isActive = document.getElementById("edit-faq-active").value === "true";
        if (!question) { Swal.showValidationMessage("Question is required"); return false; }
        if (!answer) { Swal.showValidationMessage("Answer is required"); return false; }
        try {
          await updateFAQAPI(faq._id, { question, answer, order, isActive });
        } catch (e) {
          Swal.showValidationMessage(e?.response?.data?.message || "Failed to update FAQ");
          return false;
        }
      },
    }).then((r) => { if (r.isConfirmed) { fetchFAQs(); toast.success("FAQ updated!"); } });
  };

  const handleDeleteFAQ = async (faq) => {
    const r = await MySwal.fire({
      title: "Delete FAQ?", text: `"${faq.question}"`, icon: "warning",
      showCancelButton: true, confirmButtonColor: "#EF4444",
      confirmButtonText: "Yes, Delete", background: themeColors.background,
    });
    if (r.isConfirmed) {
      try { await deleteFAQAPI(faq._id); fetchFAQs(); toast.success("FAQ deleted!"); }
      catch { toast.error("Failed to delete FAQ"); }
    }
  };

  // ── Ticket Reply Modal ────────────────────────────────────
  const showTicketModal = (ticket) => {
    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Ticket Details</div>,
      html: (
        <div className="space-y-3 text-left" style={{ color: themeColors.text }}>
          <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
            <p className="text-xs opacity-60 mb-1">From</p>
            <p className="font-bold">{ticket.name} — {ticket.mobile}</p>
            {ticket.email && <p className="text-sm opacity-70">{ticket.email}</p>}
          </div>
          <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
            <p className="text-xs opacity-60 mb-1">Subject</p>
            <p className="font-semibold">{ticket.subject}</p>
          </div>
          <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
            <p className="text-xs opacity-60 mb-1">Message</p>
            <p className="text-sm">{ticket.message}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select id="ticket-status" defaultValue={ticket.status} className="w-full p-2 rounded-lg border"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Admin Reply</label>
            <textarea id="ticket-reply" rows={3} defaultValue={ticket.adminReply || ""} className="w-full p-2 rounded-lg border"
              placeholder="Write a reply..."
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }} />
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: "Save",
      confirmButtonColor: themeColors.primary || "#3B82F6",
      background: themeColors.background,
      width: "550px",
      preConfirm: async () => {
        const status = document.getElementById("ticket-status").value;
        const adminReply = document.getElementById("ticket-reply").value.trim();
        try { await updateTicketAPI(ticket._id, { status, adminReply }); }
        catch (e) { Swal.showValidationMessage(e?.response?.data?.message || "Failed to update"); return false; }
      },
    }).then((r) => { if (r.isConfirmed) { fetchTickets(); toast.success("Ticket updated!"); } });
  };

  const handleDeleteTicket = async (ticket) => {
    const r = await MySwal.fire({
      title: "Delete Ticket?", icon: "warning", showCancelButton: true,
      confirmButtonColor: "#EF4444", confirmButtonText: "Yes, Delete",
      background: themeColors.background,
    });
    if (r.isConfirmed) {
      try { await deleteTicketAPI(ticket._id); fetchTickets(); toast.success("Ticket deleted!"); }
      catch { toast.error("Failed to delete ticket"); }
    }
  };

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>Help & Support</h2>
          <p className="text-sm opacity-70 mt-1" style={{ color: themeColors.text }}>Manage FAQs and support tickets</p>
        </div>
        <button onClick={() => tab === "faqs" ? fetchFAQs() : fetchTickets()}
          className="p-2 rounded-xl border" disabled={loading}
          style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}>
          <FaSync className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ key: "faqs", label: "FAQs", icon: <FaQuestionCircle /> }, { key: "tickets", label: "Support Tickets", icon: <FaTicketAlt /> }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold transition-all"
            style={{
              backgroundColor: tab === t.key ? themeColors.primary : themeColors.surface,
              color: tab === t.key ? "white" : themeColors.text,
              border: `1px solid ${themeColors.border}`,
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── FAQs Tab ── */}
      {tab === "faqs" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={showCreateFAQ}
              className="px-4 py-2 rounded-xl flex items-center gap-2 text-white"
              style={{ backgroundColor: themeColors.primary }}>
              <FaPlus /> Add FAQ
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
            </div>
          ) : faqs.length === 0 ? (
            <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <FaQuestionCircle className="text-5xl mx-auto mb-3 opacity-30" style={{ color: themeColors.text }} />
              <p className="font-bold text-lg" style={{ color: themeColors.text }}>No FAQs yet</p>
              <button onClick={showCreateFAQ} className="mt-4 px-5 py-2 rounded-xl text-white" style={{ backgroundColor: themeColors.primary }}>
                <FaPlus className="inline mr-2" />Add First FAQ
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              {faqs.map((faq, i) => (
                <div key={faq._id} className="p-4 flex gap-4 items-start"
                  style={{ borderBottom: i < faqs.length - 1 ? `1px solid ${themeColors.border}` : "none" }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${faq.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {faq.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="text-xs opacity-50" style={{ color: themeColors.text }}>Order: {faq.order}</span>
                    </div>
                    <p className="font-semibold text-sm" style={{ color: themeColors.text }}>Q: {faq.question}</p>
                    <p className="text-sm opacity-70 mt-1" style={{ color: themeColors.text }}>A: {faq.answer}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => showEditFAQ(faq)} className="p-2 rounded-lg" style={{ backgroundColor: "#F59E0B20", color: "#F59E0B" }}><FaEdit /></button>
                    <button onClick={() => handleDeleteFAQ(faq)} className="p-2 rounded-lg" style={{ backgroundColor: "#EF444420", color: "#EF4444" }}><FaTrash /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tickets Tab ── */}
      {tab === "tickets" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: ticketStats.total, color: "blue" },
              { label: "Open", value: ticketStats.open, color: "red" },
              { label: "In Progress", value: ticketStats.in_progress, color: "yellow" },
              { label: "Resolved", value: ticketStats.resolved, color: "green" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
                <p className="text-xs opacity-60 uppercase font-bold" style={{ color: themeColors.text }}>{s.label}</p>
                <p className={`text-3xl font-black text-${s.color}-500`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {["", "open", "in_progress", "resolved", "closed"].map(f => (
              <button key={f} onClick={() => setTicketFilter(f)}
                className="px-4 py-1.5 rounded-xl text-sm font-medium border transition-all"
                style={{
                  backgroundColor: ticketFilter === f ? themeColors.primary : themeColors.surface,
                  color: ticketFilter === f ? "white" : themeColors.text,
                  borderColor: themeColors.border,
                }}>
                {f === "" ? "All" : f.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
              <FaTicketAlt className="text-5xl mx-auto mb-3 opacity-30" style={{ color: themeColors.text }} />
              <p className="font-bold text-lg" style={{ color: themeColors.text }}>No tickets found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => {
                const s = STATUS_COLORS[ticket.status] || STATUS_COLORS.open;
                return (
                  <div key={ticket._id} className="rounded-2xl border p-4 flex gap-4 items-start"
                    style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>
                          {s.icon} {ticket.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <span className="text-xs opacity-50" style={{ color: themeColors.text }}>
                          {new Date(ticket.createdAt).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      <p className="font-bold text-sm" style={{ color: themeColors.text }}>{ticket.subject}</p>
                      <p className="text-sm opacity-70 mt-0.5" style={{ color: themeColors.text }}>{ticket.name} · {ticket.mobile}</p>
                      <p className="text-sm opacity-60 mt-1 line-clamp-2" style={{ color: themeColors.text }}>{ticket.message}</p>
                      {ticket.adminReply && (
                        <div className="mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: themeColors.primary + "15", color: themeColors.primary }}>
                          <span className="font-bold">Admin Reply: </span>{ticket.adminReply}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => showTicketModal(ticket)} className="p-2 rounded-lg" style={{ backgroundColor: "#3B82F620", color: "#3B82F6" }}><FaEdit /></button>
                      <button onClick={() => handleDeleteTicket(ticket)} className="p-2 rounded-lg" style={{ backgroundColor: "#EF444420", color: "#EF4444" }}><FaTrash /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
