// src/pages/OfferTexts.jsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaSearch,
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaCopy,
  FaClipboard,
  FaTextHeight,
  FaDice,
  FaTicketAlt,
  FaPercent,
  FaRupeeSign,
  FaBolt,
  FaSortAmountDown,
  FaSortAmountUp,
  FaFont,
  FaTag,
  FaCalendar,
  FaHistory
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import {
  createOfferTextAPI,
  getAllOfferTextsAPI,
  updateOfferTextAPI,
  updateOfferTextStatusAPI,
  deleteOfferTextAPI,
} from "../apis/offerTextApi";

const MySwal = withReactContent(Swal);

export default function OfferTexts() {
  const { themeColors } = useTheme();

  const [offerTexts, setOfferTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortByDate, setSortByDate] = useState("desc");
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch all offer texts
  const fetchOfferTexts = async () => {
    try {
      setLoading(true);
      const res = await getAllOfferTextsAPI();
      setOfferTexts(res?.data?.offerTexts || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching offer texts:", err);
      toast.error("Failed to load offer texts");
      setOfferTexts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferTexts();
  }, []);

  // Filter and sort offer texts
  const filteredOfferTexts = (offerTexts || [])
    .filter(offerText => {
      if (!offerText) return false;
      const query = search.toLowerCase();
      return (
        (offerText._id && offerText._id.toLowerCase().includes(query)) ||
        (offerText.text && offerText.text.toLowerCase().includes(query)) ||
        (offerText.isActive ? "active" : "inactive").includes(query)
      );
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      if (sortByDate === "desc") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy text");
    });
  };

  // Show create offer text modal
  const showCreateModal = () => {
    MySwal.fire({
      background: themeColors.background,
      width: '650px',
      html: (
        <div className="space-y-4 text-left max-h-[70vh] overflow-y-auto px-1">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Offer Text *
            </label>
            <textarea
              id="swal-text"
              className="w-full p-3 rounded-lg border min-h-[80px]"
              placeholder="e.g. Flash Sale: Get up to 40% off! Use code TECH40."
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
              maxLength={500}
            />
            <div className="text-xs opacity-70 mt-1 text-right">
              <span id="char-count">0</span>/500 characters
            </div>
          </div>

          <div className="p-4 border rounded-xl bg-gray-50 bg-opacity-30 space-y-4">
            <p className="text-sm font-bold border-b pb-1" style={{ color: themeColors.text }}>Coupon Configuration (Optional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code</label>
                <div className="flex gap-2">
                  <input id="swal-couponCode" className="flex-1 p-2 rounded border font-mono uppercase text-sm" placeholder="6-DIGIT CODE" maxLength={6} />
                  <button type="button" id="swal-gen-btn" className="px-2 py-1 bg-blue-500 text-white rounded text-xs flex items-center gap-1"><FaDice /> Gen</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Type</label>
                <select id="swal-discountType" className="w-full p-2 rounded border text-sm">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Discount Value</label>
                <input id="swal-discountValue" type="number" defaultValue="0" className="w-full p-2 rounded border text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Usage Limit (Orders)</label>
                <input id="swal-usageLimit" type="number" defaultValue="0" className="w-full p-2 rounded border text-sm" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Status</label>
            <select
              id="swal-isActive"
              className="w-full p-2 rounded-lg border"
              defaultValue="true"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
            >
              <option value="true">Active (Visible)</option>
              <option value="false">Inactive (Hidden)</option>
            </select>
          </div>
        </div>
      ),
      didOpen: () => {
        // Char count logic
        const textarea = document.getElementById('swal-text');
        const charCount = document.getElementById('char-count');
        if (textarea && charCount) {
          charCount.textContent = textarea.value.length;
          textarea.addEventListener('input', () => {
            charCount.textContent = textarea.value.length;
          });
        }

        // Generate Code Logic
        const genBtn = document.getElementById('swal-gen-btn');
        const codeInput = document.getElementById('swal-couponCode');
        if (genBtn && codeInput) {
          genBtn.addEventListener('click', () => {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
            codeInput.value = code;
          });
        }
      },
      preConfirm: async () => {
        const text = document.getElementById('swal-text').value.trim();
        const isActive = document.getElementById('swal-isActive').value === 'true';
        const couponCode = document.getElementById('swal-couponCode').value.trim();
        const hasCoupon = !!couponCode;
        const discountType = document.getElementById('swal-discountType').value;
        const discountValue = parseFloat(document.getElementById('swal-discountValue').value || 0);
        const usageLimit = parseInt(document.getElementById('swal-usageLimit').value || 0);

        // Validation
        if (!text) {
          Swal.showValidationMessage('Please enter offer text');
          return false;
        }

        if (hasCoupon && !couponCode) {
          Swal.showValidationMessage('Please enter a coupon code if coupon is enabled');
          return false;
        }

        try {
          setActionLoading(true);
          const payload = { 
            text, 
            isActive, 
            hasCoupon, 
            couponCode, 
            discountType, 
            discountValue, 
            usageLimit 
          };
          const res = await createOfferTextAPI(payload);
          return res.data;
        } catch (error) {
          Swal.showValidationMessage(`Creation failed: ${error.response?.data?.message || error.message}`);
          return false;
        } finally {
          setActionLoading(false);
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        await fetchOfferTexts();
        toast.success('Offer text created successfully!');
      }
    });
  };

  // Show edit offer text modal
  const showEditModal = (offerText) => {
    if (!offerText) return;

    MySwal.fire({
      background: themeColors.background,
      width: '650px',
      html: (
        <div className="space-y-4 text-left max-h-[70vh] overflow-y-auto px-1">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
              Offer Text *
            </label>
            <textarea
              id="swal-edit-text"
              className="w-full p-3 rounded-lg border min-h-[80px]"
              defaultValue={offerText?.text || ''}
              placeholder="e.g. Flash Sale: Get up to 40% off! Use code TECH40."
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}
              maxLength={500}
            />
            <div className="text-xs opacity-70 mt-1 text-right">
              <span id="edit-char-count">{offerText?.text?.length || 0}</span>/500 characters
            </div>
          </div>

          <div className="p-4 border rounded-xl bg-gray-50 bg-opacity-30 space-y-4">
            <p className="text-sm font-bold border-b pb-1" style={{ color: themeColors.text }}>Coupon Configuration</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code</label>
                <div className="flex gap-2">
                  <input id="swal-edit-couponCode" defaultValue={offerText?.couponCode || ''} className="flex-1 p-2 rounded border font-mono uppercase text-sm" placeholder="6-DIGIT CODE" maxLength={6} />
                  <button type="button" id="swal-edit-gen-btn" className="px-2 py-1 bg-blue-500 text-white rounded text-xs flex items-center gap-1"><FaDice /> Gen</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Type</label>
                <select id="swal-edit-discountType" defaultValue={offerText?.discountType || 'percentage'} className="w-full p-2 rounded border text-sm">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Discount Value</label>
                <input id="swal-edit-discountValue" type="number" defaultValue={offerText?.discountValue || 0} className="w-full p-2 rounded border text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Usage Limit (Orders)</label>
                <input id="swal-edit-usageLimit" type="number" defaultValue={offerText?.usageLimit || 0} className="w-full p-2 rounded border text-sm" />
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border flex items-center justify-between" style={{ borderColor: themeColors.border }}>
               <div className="text-sm">
                 <span className="opacity-70">Total Usage:</span> <strong className="text-blue-700">{offerText?.usageCount || 0}</strong>
                 {offerText?.usageLimit > 0 && <span className="opacity-70 ml-1">/ {offerText.usageLimit}</span>}
               </div>
               <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all" 
                    style={{ 
                      width: offerText?.usageLimit > 0 
                        ? `${Math.min(100, (offerText.usageCount / offerText.usageLimit) * 100)}%` 
                        : '0%' 
                    }}
                  />
               </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>Status</label>
            <select
              id="swal-edit-isActive"
              className="w-full p-2 rounded-lg border"
              defaultValue={offerText?.isActive ? "true" : "false"}
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}
            >
              <option value="true">Active (Visible)</option>
              <option value="false">Inactive (Hidden)</option>
            </select>
          </div>
        </div>
      ),
      didOpen: () => {
        // Char count logic
        const textarea = document.getElementById('swal-edit-text');
        const charCount = document.getElementById('edit-char-count');
        if (textarea && charCount) {
          charCount.textContent = textarea.value.length;
          textarea.addEventListener('input', () => {
            charCount.textContent = textarea.value.length;
          });
        }

        // Generate Code Logic
        const genBtn = document.getElementById('swal-edit-gen-btn');
        const codeInput = document.getElementById('swal-edit-couponCode');
        if (genBtn && codeInput) {
          genBtn.addEventListener('click', () => {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
            codeInput.value = code;
          });
        }
      },
      preConfirm: async () => {
        const text = document.getElementById('swal-edit-text').value.trim();
        const isActive = document.getElementById('swal-edit-isActive').value === 'true';
        const couponCode = document.getElementById('swal-edit-couponCode').value.trim();
        const hasCoupon = !!couponCode;
        const discountType = document.getElementById('swal-edit-discountType').value;
        const discountValue = parseFloat(document.getElementById('swal-edit-discountValue').value || 0);
        const usageLimit = parseInt(document.getElementById('swal-edit-usageLimit').value || 0);

        // Validation
        if (!text) {
          Swal.showValidationMessage('Please enter offer text');
          return false;
        }

        if (hasCoupon && !couponCode) {
          Swal.showValidationMessage('Please enter a coupon code if coupon is enabled');
          return false;
        }

        try {
          setActionLoading(true);
          const payload = { 
            text, 
            isActive, 
            hasCoupon, 
            couponCode, 
            discountType, 
            discountValue, 
            usageLimit 
          };
          const res = await updateOfferTextAPI(offerText?._id, payload);
          return res.data;
        } catch (error) {
          Swal.showValidationMessage(`Update failed: ${error.response?.data?.message || error.message}`);
          return false;
        } finally {
          setActionLoading(false);
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        await fetchOfferTexts();
        toast.success('Offer text updated successfully!');
      }
    });
  };

  // Toggle offer text status
  const toggleOfferTextStatus = async (offerText) => {
    if (!offerText) return;

    const newStatus = !offerText.isActive;

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>
        {newStatus ? 'Activate Offer Text' : 'Deactivate Offer Text'}
      </div>,
      html: <div style={{ color: themeColors.text }}>
        Are you sure you want to {newStatus ? 'activate' : 'deactivate'} this offer text?
        <div className="my-3 p-3 rounded-lg border bg-yellow-50" style={{ borderColor: themeColors.border }}>
          <p className="font-medium">"{offerText?.text}"</p>
        </div>
        <p className="text-sm opacity-70">
          {newStatus ? 'This text will become visible to users.' : 'This text will be hidden from users.'}
        </p>
      </div>,
      icon: newStatus ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${newStatus ? 'Activate' : 'Deactivate'}`,
      cancelButtonText: 'Cancel',
      confirmButtonColor: newStatus ? '#10B981' : '#F59E0B',
      cancelButtonColor: themeColors.border,
      background: themeColors.background,
    });

    if (result.isConfirmed) {
      try {
        setActionLoading(true);
        await updateOfferTextStatusAPI(offerText?._id, newStatus);
        await fetchOfferTexts();
        toast.success(`Offer text ${newStatus ? 'activated' : 'deactivated'} successfully`);
      } catch (err) {
        console.error("Error updating offer text status:", err);
        toast.error("Failed to update offer text status");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Delete offer text
  const handleDelete = async (offerText) => {
    if (!offerText) return;

    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Delete Offer Text</div>,
      html: <div style={{ color: themeColors.text }}>
        <div className="text-red-500 text-xl mb-3">
          <FaTrash className="inline mr-2" />
          Warning: This action cannot be undone!
        </div>
        <p>Are you sure you want to delete this offer text?</p>
        <div className="my-3 p-3 rounded-lg border bg-red-50" style={{ borderColor: themeColors.border }}>
          <p className="font-medium text-lg">"{offerText?.text}"</p>
          <div className="mt-2 text-center">
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${offerText?.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
              }`}>
              {offerText?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
              {offerText?.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
        <p className="text-sm opacity-70">This will permanently remove this promotional text.</p>
      </div>,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete Permanently',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: themeColors.border,
      background: themeColors.background,
    });

    if (result.isConfirmed) {
      try {
        setActionLoading(true);
        await deleteOfferTextAPI(offerText?._id);
        await fetchOfferTexts();
        toast.success("Offer text deleted successfully");
      } catch (err) {
        console.error("Error deleting offer text:", err);
        toast.error("Failed to delete offer text");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // View offer text details
  const viewOfferTextDetails = (offerText) => {
    if (!offerText) return;

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Offer Text Details</div>,
      html: (
        <div className="text-left space-y-4" style={{ color: themeColors.text }}>
          <div className="mb-4">
            <div className="p-4 rounded-lg border bg-blue-50" style={{ borderColor: themeColors.border }}>
              <div className="flex items-start justify-between gap-2">
                <FaTextHeight className="mt-1 text-blue-500" />
                <p className="text-lg font-semibold flex-1 text-center">"{offerText?.text}"</p>
                <button
                  onClick={() => copyToClipboard(offerText?.text)}
                  className="p-2 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Copy to clipboard"
                >
                  <FaClipboard className="text-blue-500" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Status</p>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${offerText?.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
                }`}>
                {offerText?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                {offerText?.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <p className="text-sm opacity-70">Created</p>
              <p className="font-medium">
                {offerText?.createdAt ? new Date(offerText.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Last Updated</p>
              <p className="font-medium">
                {offerText?.updatedAt ? new Date(offerText.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Length</p>
              <p className="font-medium">
                {offerText?.text?.length || 0} characters
              </p>
            </div>
          </div>

          {offerText?.hasCoupon && (
            <div className="p-4 rounded-xl border bg-gray-50 space-y-3" style={{ borderColor: themeColors.border }}>
              <p className="font-bold border-b pb-1">Coupon Configuration</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs opacity-70">Coupon Code</p>
                  <p className="font-mono font-bold text-blue-600">{offerText.couponCode}</p>
                </div>
                <div>
                  <p className="text-xs opacity-70">Discount</p>
                  <p className="font-bold">
                    {offerText.discountType === 'percentage' ? `${offerText.discountValue}%` : `₹${offerText.discountValue}`}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs opacity-70">Min Order</p>
                  <p className="font-medium">₹{offerText.minOrderAmount || 0}</p>
                </div>
                <div>
                  <p className="text-xs opacity-70">Max Cap</p>
                  <p className="font-medium">₹{offerText.maxDiscount || 'No cap'}</p>
                </div>
              </div>
              <div className="p-2 rounded bg-blue-100 flex items-center justify-between">
                <div>
                   <p className="text-xs opacity-70">Usage</p>
                   <p className="font-bold">{offerText.usageCount} / {offerText.usageLimit || '∞'}</p>
                </div>
                <FaBolt className="text-blue-500" />
              </div>
            </div>
          )}

          {offerText?._id && (
            <div className="text-xs opacity-70 border-t pt-2" style={{ borderColor: themeColors.border }}>
              <div className="flex items-center justify-between">
                <p>ID: {offerText._id.substring(0, 20)}...</p>
                <button
                  onClick={() => copyToClipboard(offerText._id)}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  title="Copy ID"
                >
                  <FaCopy className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: '600px',
      background: themeColors.background,
    });
  };

  // Advanced Stats Calculation
  const stats = {
    total: offerTexts?.length || 0,
    active: (offerTexts || []).filter(o => o?.isActive).length,
    coupons: (offerTexts || []).filter(o => o?.isActive && (o?.hasCoupon || o?.couponCode)).length,
    totalUsed: (offerTexts || []).reduce((acc, o) => acc + (Number(o?.usageCount) || 0), 0),
    totalLimit: (offerTexts || []).reduce((acc, o) => acc + (Number(o?.usageLimit) || 0), 0),
    remaining: (offerTexts || []).reduce((acc, o) => {
      const limit = Number(o?.usageLimit) || 0;
      const count = Number(o?.usageCount) || 0;
      if ((o?.hasCoupon || o?.couponCode) && limit > 0) {
        return acc + Math.max(0, limit - count);
      }
      return acc;
    }, 0),
    exhausted: (offerTexts || []).filter(o => {
      const limit = Number(o?.usageLimit) || 0;
      const count = Number(o?.usageCount) || 0;
      return (o?.hasCoupon || o?.couponCode) && limit > 0 && count >= limit;
    }).length,
    unlimited: (offerTexts || []).some(o => (o?.hasCoupon || o?.couponCode) && !o?.usageLimit)
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>
            Offer Texts
          </h2>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            Manage promotional text content for offers and banners
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" style={{ color: themeColors.text }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search offer texts..."
              className="pl-10 pr-4 py-2 rounded-xl border w-full md:w-64"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text,
              }}
            />
          </div>

          <button
            onClick={() => setSortByDate(sortByDate === "desc" ? "asc" : "desc")}
            className="p-2 rounded-xl border flex items-center gap-2"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
            title={`Sort ${sortByDate === "desc" ? "Oldest First" : "Newest First"}`}
          >
            {sortByDate === "desc" ? <FaSortAmountDown /> : <FaSortAmountUp />}
          </button>

          <button
            onClick={fetchOfferTexts}
            className="p-2 rounded-xl border flex items-center gap-2"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
            title="Refresh"
            disabled={loading}
          >
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={showCreateModal}
            className="px-4 py-2 rounded-xl flex items-center gap-2 transition-all hover:scale-105"
            style={{
              backgroundColor: themeColors.primary,
              color: 'white'
            }}
            disabled={actionLoading}
          >
            <FaPlus />
            <span className="hidden md:inline">New Offer Text</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Coupons */}
        <div className="rounded-2xl p-5 border transition-all hover:shadow-md" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold opacity-60" style={{ color: themeColors.text }}>Active Coupons</p>
              <p className="text-3xl font-extrabold mt-1" style={{ color: '#10B981' }}>{stats.coupons}</p>
            </div>
            <div className="p-4 rounded-2xl bg-green-50 text-green-500">
              <FaTicketAlt size={28} />
            </div>
          </div>
          <div className="mt-4 text-xs opacity-60">Out of {stats.total} total offers</div>
        </div>

        {/* Total Usage */}
        <div className="rounded-2xl p-5 border transition-all hover:shadow-md" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold opacity-60" style={{ color: themeColors.text }}>Total Used</p>
              <p className="text-3xl font-extrabold mt-1" style={{ color: themeColors.primary }}>{stats.totalUsed}</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 text-blue-500">
              <FaHistory size={28} />
            </div>
          </div>
          <div className="mt-4 text-xs opacity-60 font-medium">Across all time</div>
        </div>

        {/* Total Capacity */}
        <div className="rounded-2xl p-5 border transition-all hover:shadow-md" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold opacity-60" style={{ color: themeColors.text }}>Total Capacity</p>
              <p className="text-3xl font-extrabold mt-1" style={{ color: '#F59E0B' }}>
                {stats.totalLimit}{stats.unlimited ? '+' : ''}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-yellow-50 text-yellow-500">
              <FaTag size={28} />
            </div>
          </div>
          <div className="mt-4 text-xs opacity-60 font-medium">Total allowed uses</div>
        </div>

        {/* Remaining Capacity */}
        <div className="rounded-2xl p-5 border transition-all hover:shadow-md" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold opacity-60" style={{ color: themeColors.text }}>Slots Left</p>
              <p className="text-3xl font-extrabold mt-1" style={{ color: '#8B5CF6' }}>
                {stats.remaining}{stats.unlimited ? '+' : ''}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 text-purple-500">
              <FaBolt size={28} />
            </div>
          </div>
          <div className="mt-4 text-xs uppercase font-bold text-red-500">
             {stats.exhausted} Expired
          </div>
        </div>
      </div>

      {/* Offer Texts List */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-2 opacity-70" style={{ color: themeColors.text }}>Loading offer texts...</p>
        </div>
      ) : filteredOfferTexts.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <FaFont className="text-6xl mx-auto mb-4 opacity-30" style={{ color: themeColors.text }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.text }}>No Offer Texts Found</h3>
          <p className="opacity-70 mb-6" style={{ color: themeColors.text }}>
            {search ? `No offer texts match "${search}"` : "Create your first promotional text"}
          </p>
          <button
            onClick={showCreateModal}
            className="px-6 py-3 rounded-xl inline-flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: 'white' }}
            disabled={actionLoading}
          >
            <FaPlus />
            Create First Offer Text
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOfferTexts.map((offerText, index) => (
            <div
              key={offerText?._id || `offer-text-${index}`}
              className="rounded-2xl border p-4 group hover:shadow-lg transition-all"
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                opacity: offerText?.isActive ? 1 : 0.8
              }}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Text Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="text-lg font-semibold mb-2" style={{ color: themeColors.text }}>
                        "{offerText?.text}"
                      </p>
                      <div className="flex items-center gap-4 text-sm opacity-70">
                        <div className="flex items-center gap-1">
                          <FaCalendar className="text-xs" />
                          <span>{offerText?.createdAt ? new Date(offerText.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${offerText?.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                          }`}>
                          {offerText?.isActive ? <FaCheckCircle /> : <FaTimesCircle />}
                          {offerText?.isActive ? 'Active' : 'Inactive'}
                        </div>
                        <div className="text-xs">
                          {offerText?.text?.length || 0} chars
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(offerText?.text)}
                      className="p-2 rounded-lg hover:bg-opacity-20 transition-colors flex-shrink-0"
                      style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                      title="Copy text"
                    >
                      <FaCopy />
                    </button>
                  </div>
                  
                  {/* Coupon Info Badge in List */}
                  {offerText?.hasCoupon && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                       <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-[10px] uppercase font-bold rounded">
                         <FaTicketAlt /> {offerText.couponCode}
                       </span>
                       <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                         {offerText.discountType === 'percentage' ? `${offerText.discountValue}%` : `₹${offerText.discountValue}`} OFF
                       </span>
                       <span className="px-2 py-1 border border-gray-300 text-gray-600 text-[10px] font-medium rounded flex items-center gap-1">
                         <FaBolt /> {offerText.usageCount}/{offerText.usageLimit || '∞'}
                       </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewOfferTextDetails(offerText)}
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                    style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => showEditModal(offerText)}
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                    style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
                    title="Edit Offer Text"
                    disabled={actionLoading}
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => toggleOfferTextStatus(offerText)}
                    disabled={actionLoading}
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                    style={{
                      backgroundColor: offerText?.isActive ? '#10B98120' : '#F59E0B20',
                      color: offerText?.isActive ? '#10B981' : '#F59E0B'
                    }}
                    title={offerText?.isActive ? "Deactivate" : "Activate"}
                  >
                    {offerText?.isActive ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                  <button
                    onClick={() => handleDelete(offerText)}
                    disabled={actionLoading}
                    className="p-2 rounded-lg hover:bg-opacity-20 transition-colors text-red-500"
                    style={{ backgroundColor: '#EF444420' }}
                    title="Delete Offer Text"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {/* ID */}
              {offerText?._id && (
                <div className="text-xs opacity-70 mt-3 pt-3 border-t" style={{ borderColor: themeColors.border }}>
                  <div className="flex items-center justify-between">
                    <p className="font-mono truncate">ID: {offerText._id}</p>
                    <button
                      onClick={() => copyToClipboard(offerText._id)}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      title="Copy ID"
                    >
                      <FaClipboard className="text-xs" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}