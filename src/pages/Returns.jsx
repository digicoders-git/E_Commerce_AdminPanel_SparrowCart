import { useEffect, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaSync, FaSearch, FaCheck, FaTimes, FaUndo, FaClock, FaUser, FaPhone, FaMoneyBillWave, FaUniversity, FaRupeeSign } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import http from "../apis/http";

const MySwal = withReactContent(Swal);

export default function Returns() {
  const { themeColors } = useTheme();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await http.get("/returns");
      setReturns(res?.data?.returns || []);
    } catch {
      toast.error("Failed to load return requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReturns(); }, []);

  const filtered = returns.filter(r => {
    const q = search.toLowerCase();
    const matchSearch =
      r.user?.fullName?.toLowerCase().includes(q) ||
      r.user?.mobile?.includes(q) ||
      r.order?.orderNumber?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === "pending").length,
    approved: returns.filter(r => r.status === "approved").length,
    rejected: returns.filter(r => r.status === "rejected").length,
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":  return { bg: "bg-yellow-100", text: "text-yellow-800", icon: <FaClock /> };
      case "approved": return { bg: "bg-green-100",  text: "text-green-800",  icon: <FaCheck /> };
      case "rejected": return { bg: "bg-red-100",    text: "text-red-800",    icon: <FaTimes /> };
      default:         return { bg: "bg-gray-100",   text: "text-gray-800",   icon: <FaClock /> };
    }
  };

  const handleAction = async (returnItem, action) => {
    const doUpdate = async (adminNote = "") => {
      try {
        setActionLoading(true);
        await http.patch(`/returns/${returnItem._id}/status`, { status: action, adminNote });
        toast.success(`Return ${action} successfully`);
        fetchReturns();
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed");
      } finally {
        setActionLoading(false);
      }
    };

    const { value: note } = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>{action === "approved" ? "✅ Approve Return" : "❌ Reject Return"}</div>,
      html: (
        <div className="text-left space-y-3" style={{ color: themeColors.text }}>
          <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <p className="font-bold">{returnItem.user?.fullName}</p>
            <p className="text-sm opacity-70">Order: {returnItem.order?.orderNumber}</p>
            <p className="text-sm font-bold">Refund: ₹{returnItem.refundAmount}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Admin Note (optional)</label>
            <textarea id="admin-note" rows="2"
              className="w-full mt-1 p-2 rounded-lg border text-sm"
              placeholder="Add a note for the user..."
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
            />
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: action === "approved" ? "Yes, Approve" : "Yes, Reject",
      cancelButtonText: "Cancel",
      confirmButtonColor: action === "approved" ? "#10B981" : "#EF4444",
      cancelButtonColor: themeColors.border,
      background: themeColors.background,
      preConfirm: () => document.getElementById("admin-note")?.value || "",
    });

    if (note !== undefined) await doUpdate(note);
  };

  const handleMarkPaymentDone = async (returnItem) => {
    const { isConfirmed } = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>💰 Mark Payment Done?</div>,
      html: (
        <div className="text-left" style={{ color: themeColors.text }}>
          <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <p className="font-bold">{returnItem.user?.fullName}</p>
            <p className="text-sm opacity-70">Order: {returnItem.order?.orderNumber}</p>
            <p className="text-sm font-bold text-green-600">Amount: ₹{returnItem.refundAmount}</p>
            <p className="text-sm mt-2">
              {returnItem.refundMethod === "upi"
                ? <span>UPI: <strong>{returnItem.upiId}</strong></span>
                : <span>Bank: <strong>{returnItem.accountNumber}</strong> | IFSC: <strong>{returnItem.ifscCode}</strong></span>}
            </p>
          </div>
          <p className="text-sm mt-3 opacity-70">Confirm that you have manually transferred the refund amount.</p>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: "Yes, Payment Done",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10B981",
      background: themeColors.background,
    });

    if (!isConfirmed) return;
    try {
      setActionLoading(true);
      await http.patch(`/returns/${returnItem._id}/payment-done`);
      toast.success("Payment marked as completed!");
      fetchReturns();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const viewDetails = (r) => {
    MySwal.fire({
      title: <div className="text-lg font-bold" style={{ color: themeColors.text }}>Return Request Details</div>,
      html: (
        <div className="text-left space-y-4" style={{ color: themeColors.text }}>
          {/* Customer */}
          <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <p className="font-bold flex items-center gap-2"><FaUser size={12} /> {r.user?.fullName}</p>
            <p className="text-sm opacity-70 flex items-center gap-2 mt-1"><FaPhone size={12} /> {r.phone}</p>
            <p className="text-sm opacity-70">{r.user?.email}</p>
          </div>

          {/* Order */}
          <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <p className="text-xs opacity-60">Order</p>
            <p className="font-bold">{r.order?.orderNumber}</p>
            <p className="text-sm font-bold text-green-600">Refund Amount: ₹{r.refundAmount}</p>
          </div>

          {/* Reason */}
          <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <p className="text-xs opacity-60 mb-1">Return Reason</p>
            <p className="text-sm">{r.reason}</p>
          </div>

          {/* Refund Details */}
          <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <p className="text-xs opacity-60 mb-2">Refund Details</p>
            {r.refundMethod === "upi" ? (
              <div className="flex items-center gap-2">
                <FaMoneyBillWave className="text-green-500" />
                <div>
                  <p className="text-xs opacity-60">UPI ID</p>
                  <p className="font-bold">{r.upiId}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FaUniversity className="text-blue-500" />
                  <p className="font-bold">{r.accountHolderName}</p>
                </div>
                <p className="text-sm">Account: <span className="font-bold">{r.accountNumber}</span></p>
                <p className="text-sm">IFSC: <span className="font-bold">{r.ifscCode}</span></p>
                {r.bankName && <p className="text-sm">Bank: <span className="font-bold">{r.bankName}</span></p>}
              </div>
            )}
          </div>

          {r.adminNote && (
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
              <p className="text-xs text-blue-600 font-bold mb-1">Admin Note</p>
              <p className="text-sm text-blue-800">{r.adminNote}</p>
            </div>
          )}
        </div>
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: "500px",
      background: themeColors.background,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>Return Requests</h2>
          <p className="text-sm opacity-70 mt-1" style={{ color: themeColors.text }}>Manage customer return & refund requests</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: themeColors.text }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, order..."
              className="pl-9 pr-4 py-2 rounded-xl border w-56"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border text-sm"
            style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button onClick={fetchReturns} disabled={loading}
            className="p-2 rounded-xl border"
            style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}>
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "blue", icon: <FaUndo size={20} /> },
          { label: "Pending", value: stats.pending, color: "yellow", icon: <FaClock size={20} /> },
          { label: "Approved", value: stats.approved, color: "green", icon: <FaCheck size={20} /> },
          { label: "Rejected", value: stats.rejected, color: "red", icon: <FaTimes size={20} /> },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4 border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-60 uppercase font-bold" style={{ color: themeColors.text }}>{s.label}</p>
                <p className={`text-3xl font-black text-${s.color}-500`}>{s.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-${s.color}-500 text-white`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border p-16 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <FaUndo className="text-5xl mx-auto mb-3 opacity-20" style={{ color: themeColors.text }} />
          <p className="font-bold text-lg" style={{ color: themeColors.text }}>No return requests found</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: themeColors.background }}>
                  {["Customer", "Order", "Refund Amount", "Method", "Reason", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase opacity-60" style={{ color: themeColors.text }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const s = getStatusStyle(r.status);
                  return (
                    <tr key={r._id || i} className="border-t" style={{ borderColor: themeColors.border }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm" style={{ color: themeColors.text }}>{r.user?.fullName}</p>
                        <p className="text-xs opacity-60" style={{ color: themeColors.text }}>{r.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-mono" style={{ color: themeColors.text }}>{r.order?.orderNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-green-600">₹{r.refundAmount}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${r.refundMethod === "upi" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                          {r.refundMethod === "upi" ? <FaMoneyBillWave size={10} /> : <FaUniversity size={10} />}
                          {r.refundMethod?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm truncate max-w-[150px]" style={{ color: themeColors.text }}>{r.reason}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${s.bg} ${s.text}`}>
                          {s.icon} {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => viewDetails(r)}
                            className="p-2 rounded-lg text-blue-600 hover:opacity-80"
                            style={{ backgroundColor: "#3B82F620" }} title="View Details">
                            <FaUser size={13} />
                          </button>
                          {r.status === "pending" && (
                            <>
                              <button onClick={() => handleAction(r, "approved")} disabled={actionLoading}
                                className="p-2 rounded-lg text-green-600 hover:opacity-80"
                                style={{ backgroundColor: "#10B98120" }} title="Approve">
                                <FaCheck size={13} />
                              </button>
                              <button onClick={() => handleAction(r, "rejected")} disabled={actionLoading}
                                className="p-2 rounded-lg text-red-600 hover:opacity-80"
                                style={{ backgroundColor: "#EF444420" }} title="Reject">
                                <FaTimes size={13} />
                              </button>
                            </>
                          )}
                          {r.status === "approved" && r.paymentStatus !== "completed" && (
                            <button onClick={() => handleMarkPaymentDone(r)} disabled={actionLoading}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-white hover:opacity-80"
                              style={{ backgroundColor: "#10B981" }} title="Mark Payment Done">
                              <FaRupeeSign size={11} /> Payment Done
                            </button>
                          )}
                          {r.status === "approved" && r.paymentStatus === "completed" && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">
                              <FaCheck size={11} /> Paid
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
