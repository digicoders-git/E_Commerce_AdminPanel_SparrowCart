// src/pages/Reviews.jsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaSync,
  FaStar,
  FaComments,
  FaUser,
  FaClock,
  FaFilter,
  FaEye,
  FaExclamationTriangle
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  getAdminReviewsAPI,
  updateReviewStatusAPI,
  deleteReviewAPI
} from "../apis/reviewApi";

const MySwal = withReactContent(Swal);

export default function Reviews() {
  const { themeColors } = useTheme();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await getAdminReviewsAPI();
      setReviews(res?.data?.reviews || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      setActionLoading(true);
      await updateReviewStatusAPI(id, status);
      toast.success(`Review ${status} successfully`);
      fetchReviews();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update review status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "This review will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: themeColors.border,
      confirmButtonText: "Yes, delete it!",
      background: themeColors.background,
      color: themeColors.text
    });

    if (result.isConfirmed) {
      try {
        setActionLoading(true);
        await deleteReviewAPI(id);
        toast.success("Review deleted successfully");
        fetchReviews();
      } catch (err) {
        console.error("Error deleting review:", err);
        toast.error("Failed to delete review");
      } finally {
        setActionLoading(false);
      }
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = 
      r.userName.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase()) ||
      (r.product?.name || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === "pending").length,
    approved: reviews.filter(r => r.status === "approved").length,
    rejected: reviews.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>
            Product Reviews
          </h2>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            Moderate customer feedback and ratings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviews..."
              className="pl-10 pr-4 py-2 rounded-xl border w-full md:w-64 outline-none transition-all focus:ring-2"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text,
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border outline-none cursor-pointer"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={fetchReviews}
            className="p-2 rounded-xl border hover:opacity-80 transition-all"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
            disabled={loading}
          >
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", val: stats.total, color: themeColors.primary, bg: themeColors.primary + "10", icon: <FaComments /> },
          { label: "Pending", val: stats.pending, color: "#F59E0B", bg: "#F59E0B10", icon: <FaClock /> },
          { label: "Approved", val: stats.approved, color: "#10B981", bg: "#10B98110", icon: <FaCheckCircle /> },
          { label: "Rejected", val: stats.rejected, color: "#EF4444", bg: "#EF444410", icon: <FaTimesCircle /> },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-2xl border flex items-center justify-between" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <div>
              <p className="text-xs font-bold opacity-60 uppercase">{s.label}</p>
              <p className="text-2xl font-extrabold mt-1" style={{ color: s.color }}>{s.val}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: s.bg, color: s.color }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-t-transparent" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-4 opacity-70">Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed" style={{ borderColor: themeColors.border }}>
          <FaComments className="text-6xl mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold">No reviews found</h3>
          <p className="opacity-60">Wait for customers to share their feedback!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReviews.map((review) => (
            <div
              key={review._id}
              className="p-5 rounded-2xl border transition-all hover:shadow-lg relative overflow-hidden"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              }}
            >
              {/* Status Badge */}
              <div 
                className="absolute top-0 right-0 px-4 py-1.5 text-[10px] font-bold uppercase rounded-bl-xl flex items-center gap-1"
                style={{
                  backgroundColor: review.status === "approved" ? "#10B98120" : review.status === "rejected" ? "#EF444420" : "#F59E0B20",
                  color: review.status === "approved" ? "#10B981" : review.status === "rejected" ? "#EF4444" : "#F59E0B"
                }}
              >
                {review.status === "approved" ? <FaCheckCircle /> : review.status === "rejected" ? <FaTimesCircle /> : <FaClock />}
                {review.status}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-400">
                    <FaUser />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate" style={{ color: themeColors.text }}>{review.userName}</h4>
                    <p className="text-xs opacity-60 flex items-center gap-1">
                      <FaFilter className="text-[10px]" /> On product: <strong>{review.product?.name || "Unknown Product"}</strong>
                    </p>
                    <div className="flex gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} size={12} className={i < review.rating ? "text-yellow-400" : "text-gray-200"} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100" style={{ color: themeColors.text }}>
                  <p className="text-sm leading-relaxed italic opacity-80">"{review.comment}"</p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-50">
                  <div className="text-[10px] opacity-40">
                    ID: {review._id} • {new Date(review.createdAt).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    {review.status !== "approved" && (
                      <button
                        onClick={() => handleStatusUpdate(review._id, "approved")}
                        className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-all flex items-center gap-1"
                        disabled={actionLoading}
                      >
                        <FaCheckCircle /> Approve
                      </button>
                    )}
                    {review.status !== "rejected" && (
                      <button
                        onClick={() => handleStatusUpdate(review._id, "rejected")}
                        className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-all flex items-center gap-1"
                        disabled={actionLoading}
                      >
                        <FaTimesCircle /> Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                      title="Delete Permanently"
                      disabled={actionLoading}
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
