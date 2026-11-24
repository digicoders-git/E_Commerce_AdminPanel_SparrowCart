// src/pages/Orders.jsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSync,
  FaCalendar,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaStore,
  FaGlobe,
  FaRupeeSign,
  FaBox,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardCheck,
  FaCreditCard,
  FaMoneyBillWave,
  FaReceipt,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCopy,
  FaPrint,
  FaDownload,
  FaBarcode,
  FaExclamationTriangle,
  FaCheck,
  FaClock,
  FaShippingFast,
  FaBan,
  FaListAlt,
  FaShoppingCart,
  FaPercentage,
  FaTag,
  FaUserCircle,
  FaHistory,
  FaList
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { generateCode39Svg, getQrCodeUrl } from "../utils/barcodeGenerator";
import {
  getAllOrdersAPI,
  getOrderByIdAPI,
  updateOrderStatusAPI,
  updatePaymentStatusAPI,
  deleteOrderAPI,
  getOrderStatsAPI,
  getUserOrdersAPI
} from "../apis/orderApi";

const MySwal = withReactContent(Swal);

export default function Orders() {
  const { themeColors } = useTheme();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0,
    avgOrderValue: 0
  });

  // User orders state
  const [userOrders, setUserOrders] = useState([]);
  const [showUserOrders, setShowUserOrders] = useState(false);
  const [userOrdersLoading, setUserOrdersLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getAllOrdersAPI();
      const ordersData = res?.data?.orders || [];
      const counts = res?.data?.counts || {};
      const organized = res?.data?.organized || {};
      
      // Combine global and store orders
      const allOrders = [
        ...(organized.globalOrders || []),
        ...(organized.storeOrders || [])
      ];
      
      setOrders(allOrders);
      setFilteredOrders(allOrders);
      
      // Calculate stats
      calculateStats(allOrders, counts);
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to load orders");
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user orders - FIXED VERSION
  const fetchUserOrders = async (userId) => {
    try {
      setUserOrdersLoading(true);
      console.log("Fetching orders for user:", userId);
      
      const res = await getUserOrdersAPI(userId);
      console.log("User orders API response:", res);
      
      const userOrdersData = res?.data?.orders || [];
      console.log("User orders data:", userOrdersData);
      
      // Set user orders state immediately
      setUserOrders(userOrdersData);
      setCurrentUserId(userId);
      
      // Calculate stats for user orders
      const userStats = {
        total: userOrdersData.length,
        pending: userOrdersData.filter(o => o.status === 'pending').length,
        confirmed: userOrdersData.filter(o => o.status === 'confirmed').length,
        shipped: userOrdersData.filter(o => o.status === 'shipped').length,
        delivered: userOrdersData.filter(o => o.status === 'delivered').length,
        cancelled: userOrdersData.filter(o => o.status === 'cancelled').length,
        revenue: userOrdersData.reduce((sum, order) => sum + (order.grandTotal || 0), 0),
        avgOrderValue: userOrdersData.length > 0 ? 
          userOrdersData.reduce((sum, order) => sum + (order.grandTotal || 0), 0) / userOrdersData.length : 0
      };
      
      console.log("User stats calculated:", userStats);
      
      // Return both data and stats
      return {
        orders: userOrdersData,
        stats: userStats
      };
      
    } catch (err) {
      console.error("Error fetching user orders:", err);
      console.error("Error details:", err.response?.data || err.message);
      
      // Fallback: Filter from existing orders
      const filteredUserOrders = orders.filter(order => {
        const orderUserId = order.user?._id || order.user;
        return orderUserId === userId;
      });
      
      console.log("Fallback filtered orders:", filteredUserOrders.length);
      
      // Set user orders state immediately
      setUserOrders(filteredUserOrders);
      setCurrentUserId(userId);
      
      toast.warning("Using local orders data");
      
      // Calculate fallback stats
      const userStats = {
        total: filteredUserOrders.length,
        pending: filteredUserOrders.filter(o => o.status === 'pending').length,
        confirmed: filteredUserOrders.filter(o => o.status === 'confirmed').length,
        shipped: filteredUserOrders.filter(o => o.status === 'shipped').length,
        delivered: filteredUserOrders.filter(o => o.status === 'delivered').length,
        cancelled: filteredUserOrders.filter(o => o.status === 'cancelled').length,
        revenue: filteredUserOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0),
        avgOrderValue: filteredUserOrders.length > 0 ? 
          filteredUserOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0) / filteredUserOrders.length : 0
      };
      
      return {
        orders: filteredUserOrders,
        stats: userStats
      };
    } finally {
      setUserOrdersLoading(false);
    }
  };

  const calculateStats = (orders, counts) => {
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    
    let totalRevenue = 0;
    
    orders.forEach(order => {
      if (order.status) {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      }
      if (order.grandTotal) {
        totalRevenue += order.grandTotal;
      }
    });
    
    setStats({
      total: orders.length,
      ...statusCounts,
      revenue: totalRevenue,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
    });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...orders];
    
    // Apply search filter
    if (search) {
      const query = search.toLowerCase();
      result = result.filter(order => {
        return (
          (order._id && order._id.toLowerCase().includes(query)) ||
          (order.user?.fullName && order.user.fullName.toLowerCase().includes(query)) ||
          (order.user?.mobile && order.user.mobile.includes(query)) ||
          (order.user?.email && order.user.email.toLowerCase().includes(query)) ||
          (order.shippingAddress?.city && order.shippingAddress.city.toLowerCase().includes(query)) ||
          (order.status && order.status.toLowerCase().includes(query))
        );
      });
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply payment status filter
    if (paymentStatusFilter !== "all") {
      result = result.filter(order => order.paymentStatus === paymentStatusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== "all") {
      if (typeFilter === "global") {
        result = result.filter(order => !order.store);
      } else if (typeFilter === "store") {
        result = result.filter(order => order.store);
      }
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "date_asc":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "total_desc":
          return (b.grandTotal || 0) - (a.grandTotal || 0);
        case "total_asc":
          return (a.grandTotal || 0) - (b.grandTotal || 0);
        default:
          return 0;
      }
    });
    
    setFilteredOrders(result);
  }, [search, statusFilter, paymentStatusFilter, typeFilter, sortBy, orders]);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800", icon: <FaClock className="mr-1" /> };
      case "confirmed":
        return { bg: "bg-blue-100", text: "text-blue-800", icon: <FaCheckCircle className="mr-1" /> };
      case "shipped":
        return { bg: "bg-purple-100", text: "text-purple-800", icon: <FaShippingFast className="mr-1" /> };
      case "delivered":
        return { bg: "bg-green-100", text: "text-green-800", icon: <FaCheck className="mr-1" /> };
      case "cancelled":
        return { bg: "bg-red-100", text: "text-red-800", icon: <FaBan className="mr-1" /> };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", icon: <FaClock className="mr-1" /> };
    }
  };

  // Get payment status badge color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return { bg: "bg-green-100", text: "text-green-800", icon: <FaCheckCircle className="mr-1" /> };
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800", icon: <FaClock className="mr-1" /> };
      case "failed":
        return { bg: "bg-red-100", text: "text-red-800", icon: <FaTimesCircle className="mr-1" /> };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", icon: <FaClock className="mr-1" /> };
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "cod":
        return <FaMoneyBillWave className="mr-1" />;
      case "card":
        return <FaCreditCard className="mr-1" />;
      case "upi":
        return <FaRupeeSign className="mr-1" />;
      default:
        return <FaMoneyBillWave className="mr-1" />;
    }
  };

  // View order details with user's all orders - FIXED VERSION
  const viewOrderDetails = async (order) => {
    try {
      setSelectedOrder(order);
      setActionLoading(true);
      
      // Get order details
      const res = await getOrderByIdAPI(order._id);
      const orderData = res?.data?.order || order;
      setOrderDetails(orderData);
      
      // Fetch user's all orders
      const userId = order.user?._id || order.user;
      console.log("View order details - User ID:", userId);
      
      if (userId) {
        // Reset and show loading
        setShowUserOrders(true);
        
        // Fetch user orders FIRST
        const userData = await fetchUserOrders(userId);
        
        // Create and show modal AFTER fetching user orders
        createAndShowModal(order, userId, true, userData.orders, userData.stats);
      } else {
        console.warn("No user ID found for order");
        setShowUserOrders(false);
        createAndShowModal(order, null, false, [], null);
      }
      
    } catch (err) {
      console.error("Error fetching order details:", err);
      toast.error("Failed to load order details");
      // Show modal even if there's an error
      const userId = order.user?._id || order.user;
      createAndShowModal(order, userId, false, [], null);
    } finally {
      setActionLoading(false);
    }
  };

  // Separate function to create and show modal - UPDATED
  const createAndShowModal = (order, userId, showUserOrdersSection, userOrdersData = [], userStats = null) => {
    const modalContent = (
      <div className="text-left space-y-6" style={{ color: themeColors.text }}>
        {/* Order Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaReceipt className="mr-2" />
              Order Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="opacity-70">Order ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{order._id?.substring(0, 10)}...</span>
                  <button
                    onClick={() => copyToClipboard(order._id)}
                    className="p-1 rounded hover:opacity-80"
                    style={{ backgroundColor: themeColors.primary + '20' }}
                    title="Copy Order ID"
                  >
                    <FaCopy size={12} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Date:</span>
                <span>{order.createdAtIST || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Order Type:</span>
                <div className="flex items-center">
                  {order.store ? (
                    <>
                      <FaStore className="mr-1" />
                      <span>Store Order</span>
                    </>
                  ) : (
                    <>
                      <FaGlobe className="mr-1" />
                      <span>Global Order</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaUser className="mr-2" />
              Customer Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="opacity-70">Name:</span>
                <span className="font-medium">{order.user?.fullName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Mobile:</span>
                <div className="flex items-center gap-2">
                  <FaPhone size={12} />
                  <span>{order.user?.mobile || 'N/A'}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Email:</span>
                <div className="flex items-center gap-2">
                  <FaEnvelope size={12} />
                  <span className="truncate">{order.user?.email || 'N/A'}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">User ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{order.user?._id?.substring(0, 10) || 'N/A'}...</span>
                  {order.user?._id && (
                    <button
                      onClick={() => copyToClipboard(order.user._id)}
                      className="p-1 rounded hover:opacity-80"
                      style={{ backgroundColor: themeColors.primary + '20' }}
                      title="Copy User ID"
                    >
                      <FaCopy size={10} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Order History - FIXED SECTION */}
        {showUserOrdersSection && (
          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaHistory className="mr-2" />
              User's Order History ({userOrdersData.length} orders)
            </h3>
            
            {userOrdersLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: themeColors.primary }}></div>
                <p className="mt-2 text-sm opacity-70">Loading user orders...</p>
              </div>
            ) : userOrdersData.length > 0 ? (
              <div className="space-y-4">
                {/* User Order Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-3 rounded-lg border text-center" style={{ borderColor: themeColors.border }}>
                    <p className="text-xs opacity-70">Total Orders</p>
                    <p className="text-xl font-bold">{userOrdersData.length}</p>
                  </div>
                  <div className="p-3 rounded-lg border text-center" style={{ borderColor: themeColors.border }}>
                    <p className="text-xs opacity-70">Total Spent</p>
                    <p className="text-xl font-bold">₹{userOrdersData.reduce((sum, o) => sum + (o.grandTotal || 0), 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg border text-center" style={{ borderColor: themeColors.border }}>
                    <p className="text-xs opacity-70">Avg. Order</p>
                    <p className="text-xl font-bold">₹{userOrdersData.length > 0 ? (userOrdersData.reduce((sum, o) => sum + (o.grandTotal || 0), 0) / userOrdersData.length).toFixed(0) : 0}</p>
                  </div>
                  <div className="p-3 rounded-lg border text-center" style={{ borderColor: themeColors.border }}>
                    <p className="text-xs opacity-70">Current Order</p>
                    <p className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusColor(order.status).bg} ${getStatusColor(order.status).text}`}>
                      {order.status}
                    </p>
                  </div>
                </div>

                {/* User Orders List */}
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: themeColors.background }}>
                        <th className="text-left p-2 font-medium">Order ID</th>
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="text-left p-2 font-medium">Amount</th>
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-left p-2 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userOrdersData.map((userOrder) => (
                        <tr 
                          key={userOrder._id} 
                          className={`border-t ${userOrder._id === order._id ? 'bg-blue-50' : ''}`} 
                          style={{ borderColor: themeColors.border }}
                        >
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs">{userOrder._id?.substring(0, 8)}...</span>
                              {userOrder._id === order._id && (
                                <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded">Current</span>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            {userOrder.createdAtIST?.split(',')[0]}
                          </td>
                          <td className="p-2 font-medium">
                            ₹{userOrder.grandTotal}
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(userOrder.status).bg} ${getStatusColor(userOrder.status).text}`}>
                              {userOrder.status}
                            </span>
                          </td>
                          <td className="p-2">
                            {userOrder.store ? (
                              <span className="text-xs flex items-center">
                                <FaStore size={10} className="mr-1" />
                                Store
                              </span>
                            ) : (
                              <span className="text-xs flex items-center">
                                <FaGlobe size={10} className="mr-1" />
                                Global
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm opacity-70">No other orders found for this user.</p>
                <p className="text-xs opacity-50 mt-1">This is their first order.</p>
              </div>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <FaShoppingCart className="mr-2" />
            Order Items ({order.items?.length || 0})
          </h3>
          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div key={item._id || index} className="flex items-center gap-4 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
                {item.images?.[0] && (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/100?text=No+Image";
                    }}
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{item.name}</h4>
                    <div className="flex items-center gap-2">
                      {item.percentageOff > 0 && (
                        <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
                          <FaTag className="inline mr-1" />
                          {item.percentageOff}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">Quantity:</span>
                        <span className="font-medium">{item.quantity} {item.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">Price:</span>
                        <div className="flex items-center gap-2">
                          {item.offerPrice !== item.price ? (
                            <>
                              <span className="line-through opacity-70">₹{item.price}</span>
                              <span className="font-bold text-green-600">₹{item.offerPrice}</span>
                            </>
                          ) : (
                            <span className="font-medium">₹{item.price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="opacity-70 text-xs">Line Total</div>
                      <div className="text-lg font-bold">₹{item.lineTotal || item.offerPrice * item.quantity}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaRupeeSign className="mr-2" />
              Price Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="opacity-70">Subtotal:</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Total Discount:</span>
                <span className="text-green-600">-₹{order.totalDiscount}</span>
              </div>
              <div className="flex justify-between pt-2 border-t" style={{ borderColor: themeColors.border }}>
                <span className="font-bold">Grand Total:</span>
                <span className="text-xl font-bold">₹{order.grandTotal}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaClipboardCheck className="mr-2" />
              Order Status
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="opacity-70">Order Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${getStatusColor(order.status).bg} ${getStatusColor(order.status).text}`}>
                    {getStatusColor(order.status).icon}
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                  </span>
                </div>
                <select
                  id="swal-status-select"
                  className="w-full p-2 rounded-lg border text-sm"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.background,
                    color: themeColors.text
                  }}
                  defaultValue={order.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    MySwal.fire({
                      title: 'Update Order Status',
                      text: `Change status to ${newStatus}?`,
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonText: 'Update',
                      cancelButtonText: 'Cancel',
                      confirmButtonColor: themeColors.primary,
                      cancelButtonColor: themeColors.border,
                      background: themeColors.background
                    }).then(async (result) => {
                      if (result.isConfirmed) {
                        try {
                          setActionLoading(true);
                          await updateOrderStatusAPI(order._id, newStatus);
                          toast.success(`Order status updated to ${newStatus}`);
                          fetchOrders();
                          // Refresh user orders if showing
                          if (showUserOrdersSection && userId) {
                            await fetchUserOrders(userId);
                          }
                        } catch (err) {
                          console.error("Error updating status:", err);
                          toast.error("Failed to update status");
                        } finally {
                          setActionLoading(false);
                        }
                      }
                    });
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaCreditCard className="mr-2" />
              Payment Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="opacity-70">Method:</span>
                <div className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center bg-gray-100 text-gray-800`}>
                  {getPaymentMethodIcon(order.paymentMethod)}
                  {order.paymentMethod?.toUpperCase() || 'COD'}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Status:</span>
                <div className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${getPaymentStatusColor(order.paymentStatus).bg} ${getPaymentStatusColor(order.paymentStatus).text}`}>
                  {getPaymentStatusColor(order.paymentStatus).icon}
                  {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                </div>
              </div>
              {order.paymentStatus === 'pending' && (
                <button
                  onClick={() => updatePaymentStatus(order, 'paid')}
                  className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: themeColors.primary, color: 'white' }}
                >
                  Mark as Paid
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaMapMarkerAlt className="mr-2" />
              Shipping Address
            </h3>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="opacity-70 text-sm">Name</p>
                  <p className="font-medium">{order.shippingAddress.fullName}</p>
                </div>
                <div>
                  <p className="opacity-70 text-sm">Mobile</p>
                  <p className="font-medium">{order.shippingAddress.mobile}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="opacity-70 text-sm">Address</p>
                  <p className="font-medium">
                    {order.shippingAddress.addressLine1}, {order.shippingAddress.addressLine2}
                  </p>
                  <p className="font-medium">
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </p>
                </div>
                {order.shippingAddress.landmark && (
                  <div className="md:col-span-2">
                    <p className="opacity-70 text-sm">Landmark</p>
                    <p className="font-medium">{order.shippingAddress.landmark}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="p-4 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <FaExclamationTriangle className="mr-2" />
              Order Notes
            </h3>
            <p className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
              {order.notes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowUserOrders(false);
              MySwal.close();
            }}
            className="px-4 py-2 rounded-lg border text-sm font-medium"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text
            }}
          >
            Close
          </button>
          <button
            onClick={() => printShippingLabel(order)}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-white"
            style={{ backgroundColor: '#6366F1' }}
          >
            <FaBarcode size={14} />
            Shipping Label
          </button>
          <button
            onClick={() => printOrder(order)}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary, color: 'white' }}
          >
            <FaPrint size={14} />
            Print Invoice
          </button>
        </div>
      </div>
    );

    MySwal.fire({
      title: <div className="text-xl font-bold" style={{ color: themeColors.text }}>Order Details</div>,
      html: modalContent,
      showConfirmButton: false,
      showCloseButton: true,
      width: '900px',
      background: themeColors.background,
      didClose: () => {
        setShowUserOrders(false);
        setCurrentUserId(null);
      }
    });
  };

  // Quick status change from table
  const quickChangeStatus = (order) => {
    const STATUS_OPTIONS = [
      { value: 'pending',   label: 'Pending',   color: '#F59E0B', bg: '#fffbeb' },
      { value: 'confirmed', label: 'Confirmed', color: '#3B82F6', bg: '#eff6ff' },
      { value: 'shipped',   label: 'Shipped',   color: '#8B5CF6', bg: '#f5f3ff' },
      { value: 'delivered', label: 'Delivered', color: '#10B981', bg: '#f0fdf4' },
      { value: 'cancelled', label: 'Cancelled', color: '#EF4444', bg: '#fef2f2' },
    ];

    const doUpdate = async (newStatus) => {
      if (newStatus === order.status) { MySwal.close(); return; }
      MySwal.close();
      try {
        setActionLoading(true);
        await updateOrderStatusAPI(order._id, newStatus);
        toast.success(`Status updated to "${newStatus}"`);
        fetchOrders();
      } catch (err) {
        toast.error('Failed to update status');
      } finally {
        setActionLoading(false);
      }
    };

    MySwal.fire({
      title: <div className="text-lg font-bold" style={{ color: themeColors.text }}>Change Order Status</div>,
      html: (
        <div className="text-left space-y-4" style={{ color: themeColors.text }}>
          <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
            <p className="font-bold">{order.user?.fullName || 'N/A'}</p>
            <p className="text-xs opacity-60">₹{order.grandTotal} • {order.items?.length} item(s)</p>
          </div>
          <p className="text-sm">Current: <span className={`font-bold ${getStatusColor(order.status).text}`}>{order.status}</span></p>
          <div className="grid grid-cols-1 gap-2">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.value}
                onClick={() => doUpdate(s.value)}
                className="w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all hover:scale-[1.02] cursor-pointer"
                style={{
                  borderColor: order.status === s.value ? s.color : '#e5e7eb',
                  backgroundColor: order.status === s.value ? s.bg : 'transparent',
                }}
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }}></span>
                <span className="font-medium" style={{ color: s.color }}>{s.label}</span>
                {order.status === s.value && <span className="ml-auto text-xs font-bold" style={{ color: s.color }}>✓ Current</span>}
              </button>
            ))}
          </div>
        </div>
      ),
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      cancelButtonColor: themeColors.border,
      background: themeColors.background,
      width: '380px',
    });
  };

  // Update payment status
  const updatePaymentStatus = async (order, newStatus) => {
    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Update Payment Status</div>,
      html: <div style={{ color: themeColors.text }}>
        Change payment status to <strong>{newStatus.toUpperCase()}</strong>?
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <p className="font-bold">Order #{order._id?.substring(0, 8)}...</p>
          <p className="text-lg font-bold mt-2">Amount: ₹{order.grandTotal}</p>
          <p className="text-sm opacity-70">Customer: {order.user?.fullName}</p>
        </div>
      </div>,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Update Status',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary,
      cancelButtonColor: themeColors.border,
      background: themeColors.background,
    });

    if (result.isConfirmed) {
      try {
        setActionLoading(true);
        await updatePaymentStatusAPI(order._id, newStatus);
        toast.success(`Payment status updated to ${newStatus}`);
        fetchOrders();
      } catch (err) {
        console.error("Error updating payment status:", err);
        toast.error("Failed to update payment status");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Delete order
  const deleteOrder = async (order) => {
    const result = await MySwal.fire({
      title: <div style={{ color: themeColors.text }}>Delete Order</div>,
      html: <div style={{ color: themeColors.text }}>
        <div className="text-red-500 text-xl mb-3 flex items-center">
          <FaExclamationTriangle className="mr-2" />
          Warning: This action cannot be undone!
        </div>
        <p>Are you sure you want to delete this order?</p>
        <div className="my-3 p-3 rounded-lg border" style={{ borderColor: themeColors.border }}>
          <div className="space-y-2">
            <p className="font-bold">Order #{order._id?.substring(0, 10)}...</p>
            <p>Customer: {order.user?.fullName}</p>
            <p>Amount: <span className="font-bold">₹{order.grandTotal}</span></p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status).bg} ${getStatusColor(order.status).text}`}>
                {order.status}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(order.paymentStatus).bg} ${getPaymentStatusColor(order.paymentStatus).text}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>
        <p className="text-sm text-red-500 mt-2">
          ⚠️ Warning: Deleting this order will remove it from the system.
        </p>
      </div>,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: themeColors.border,
      background: themeColors.background,
    });

    if (result.isConfirmed) {
      try {
        setActionLoading(true);
        await deleteOrderAPI(order._id);
        toast.success("Order deleted successfully");
        fetchOrders();
      } catch (err) {
        console.error("Error deleting order:", err);
        toast.error("Failed to delete order");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy text");
    });
  };

  // Export orders
  const exportOrders = () => {
    const data = filteredOrders.map(order => ({
      "Order ID": order._id,
      "Date": order.createdAtIST,
      "Customer": order.user?.fullName,
      "Mobile": order.user?.mobile,
      "Email": order.user?.email,
      "Items": order.items?.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(', '),
      "Subtotal": order.subtotal,
      "Discount": order.totalDiscount,
      "Total": order.grandTotal,
      "Status": order.status,
      "Payment Status": order.paymentStatus,
      "Payment Method": order.paymentMethod,
      "City": order.shippingAddress?.city,
      "Order Type": order.store ? "Store" : "Global"
    }));
    
    // Create CSV
    const csvContent = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Orders exported successfully!");
  };

  // Print order summary with QR Code
  const printOrder = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print invoice");
      return;
    }

    const orderId = order._id || '';
    const orderNum = order.orderNumber || (orderId ? orderId.substring(orderId.length - 8).toUpperCase() : '');
    const qrCodeUrl = getQrCodeUrl(orderId, 120);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Invoice - ${orderNum || orderId}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 24px; color: #1e293b; background: #fff; }
            .invoice { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
            
            .invoice-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .brand-name {
              font-size: 24px;
              font-weight: 900;
              letter-spacing: 1px;
              color: #0f172a;
            }
            .invoice-tag {
              font-size: 13px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            }
            .meta-line {
              font-size: 13px;
              color: #475569;
              margin: 3px 0;
            }
            .order-id-badge {
              font-family: monospace;
              font-weight: 700;
              background: #f1f5f9;
              color: #0f172a;
              padding: 2px 8px;
              border-radius: 4px;
              border: 1px solid #cbd5e1;
              display: inline-block;
            }

            .qr-box {
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              background: #ffffff;
              border: 1.5px solid #cbd5e1;
              border-radius: 10px;
              padding: 8px 10px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .qr-img {
              width: 96px;
              height: 96px;
              display: block;
            }
            .qr-label {
              font-size: 8.5px;
              font-weight: 800;
              color: #475569;
              letter-spacing: 0.8px;
              margin-top: 4px;
            }

            .section { margin-bottom: 24px; }
            .section-title {
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0f172a;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
              margin-bottom: 12px;
            }

            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
            .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
            .info-box p { font-size: 13px; margin: 4px 0; color: #334155; }

            .items-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
              margin-top: 8px;
            }
            .items-table th {
              background: #f1f5f9;
              padding: 10px;
              text-align: left;
              border-bottom: 2px solid #cbd5e1;
              font-weight: 700;
            }
            .items-table td {
              padding: 10px;
              border-bottom: 1px solid #e2e8f0;
            }

            .summary-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 14px;
            }
            .summary-line {
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              margin: 6px 0;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              font-size: 16px;
              font-weight: 900;
              color: #0f172a;
              border-top: 2px solid #cbd5e1;
              padding-top: 8px;
              margin-top: 8px;
            }

            .status-badge {
              display: inline-block;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              padding: 3px 8px;
              border-radius: 4px;
              background: #e2e8f0;
            }

            .no-print {
              margin-top: 24px;
              display: flex;
              gap: 10px;
              justify-content: center;
            }
            .btn {
              padding: 10px 20px;
              border-radius: 6px;
              font-weight: 700;
              cursor: pointer;
              border: none;
              font-size: 13px;
            }
            .btn-print { background: #0f172a; color: #fff; }
            .btn-close { background: #e2e8f0; color: #334155; }

            @media print {
              body { padding: 0; }
              .invoice { border: none; padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <!-- Header with Brand & Order ID QR Code -->
            <div class="invoice-header">
              <div>
                <div class="brand-name">SPARROW CART</div>
                <div class="invoice-tag">Official Order Invoice</div>
                <div class="meta-line"><strong>Invoice Date:</strong> ${order.createdAtIST || new Date().toLocaleString('en-IN')}</div>
                <div class="meta-line">
                  <strong>Order ID:</strong> <span class="order-id-badge">${orderId}</span>
                </div>
                ${order.orderNumber ? `
                  <div class="meta-line">
                    <strong>Order Number:</strong> <span style="font-weight: 800; color: #0f172a;">#${order.orderNumber}</span>
                  </div>
                ` : ''}
              </div>

              <!-- QR Code generated from Order ID -->
              <div class="qr-box">
                <img src="${qrCodeUrl}" alt="Order ID QR Code" class="qr-img" />
                <span class="qr-label">SCAN ORDER ID</span>
              </div>
            </div>

            <!-- Customer & Shipping Information -->
            <div class="section grid">
              <div class="info-box">
                <div class="section-title">Customer Information</div>
                <p><strong>Name:</strong> ${order.user?.fullName || order.shippingAddress?.fullName || 'N/A'}</p>
                <p><strong>Mobile:</strong> ${order.user?.mobile || order.shippingAddress?.mobile || 'N/A'}</p>
                ${order.user?.email ? `<p><strong>Email:</strong> ${order.user.email}</p>` : ''}
              </div>
              <div class="info-box">
                <div class="section-title">Shipping Address</div>
                <p>${order.shippingAddress?.addressLine1 || ''} ${order.shippingAddress?.addressLine2 || ''}</p>
                ${order.shippingAddress?.landmark ? `<p>Near ${order.shippingAddress.landmark}</p>` : ''}
                <p><strong>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}</strong></p>
                ${order.collectionOTP ? `<p><strong>Delivery OTP:</strong> <span style="background: #fef08a; padding: 1px 6px; border-radius: 3px; font-weight: bold;">${order.collectionOTP}</span></p>` : ''}
              </div>
            </div>

            <!-- Order Items Table -->
            <div class="section">
              <div class="section-title">Purchased Items</div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${(order.items || []).map((item, idx) => `
                    <tr>
                      <td style="color: #64748b;">${idx + 1}</td>
                      <td>
                        <strong>${item.name || item.product?.name || 'Product'}</strong>
                        ${item.unit ? `<span style="color: #64748b; font-size: 11px;"> (${item.unit})</span>` : ''}
                      </td>
                      <td style="text-align: center; font-weight: bold;">${item.quantity || 1}</td>
                      <td style="text-align: right;">₹${item.offerPrice?.toLocaleString('en-IN') || item.price?.toLocaleString('en-IN') || 0}</td>
                      <td style="text-align: right; font-weight: bold;">₹${(item.lineTotal || (item.offerPrice || item.price) * (item.quantity || 1)).toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Order Summary & Payment Status -->
            <div class="section grid">
              <div class="info-box">
                <div class="section-title">Payment & Status</div>
                <p><strong>Payment Method:</strong> ${order.paymentMethod?.toUpperCase() || 'COD'}</p>
                <p><strong>Payment Status:</strong> <span class="status-badge">${order.paymentStatus || 'Pending'}</span></p>
                <p><strong>Order Status:</strong> <span class="status-badge">${order.status || 'Confirmed'}</span></p>
                ${order.store?.storeName ? `<p><strong>Fulfilled By:</strong> ${order.store.storeName}</p>` : ''}
              </div>

              <div class="summary-box">
                <div class="section-title">Price Breakdown</div>
                <div class="summary-line">
                  <span>Subtotal:</span>
                  <span>₹${(order.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                ${order.totalDiscount > 0 ? `
                  <div class="summary-line" style="color: #16a34a;">
                    <span>Discount:</span>
                    <span>-₹${order.totalDiscount.toLocaleString('en-IN')}</span>
                  </div>
                ` : ''}
                <div class="total-line">
                  <span>Grand Total:</span>
                  <span>₹${(order.grandTotal || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <!-- Print Actions -->
            <div class="no-print">
              <button onclick="window.print()" class="btn btn-print">Print Invoice</button>
              <button onclick="window.close()" class="btn btn-close">Close</button>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Print Shipping / Parcel Label
  const printShippingLabel = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const orderNum = order.orderNumber || (order._id ? order._id.substring(order._id.length - 8).toUpperCase() : 'ORD000');
    const barcodeSvg = generateCode39Svg(orderNum, { height: 38 });
    const addr = order.shippingAddress || {};
    const isCod = order.paymentMethod?.toLowerCase() === 'cod';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shipping Label - ${orderNum}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; padding: 15px; background: #fff; color: #111; }
          .label-box {
            width: 100mm;
            min-height: 140mm;
            border: 2px solid #000;
            padding: 12px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .brand { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
          .badge {
            font-size: 12px;
            font-weight: 900;
            padding: 3px 8px;
            border: 2px solid #000;
            border-radius: 4px;
            background: ${isCod ? '#000' : '#fff'};
            color: ${isCod ? '#fff' : '#000'};
          }
          .barcode-section {
            text-align: center;
            padding: 6px 0;
            border-bottom: 1px solid #ccc;
            margin-bottom: 8px;
          }
          .section { margin-bottom: 8px; font-size: 12px; }
          .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #555; margin-bottom: 3px; }
          .address-box {
            border: 1px solid #000;
            padding: 8px;
            border-radius: 4px;
            background: #fafafa;
          }
          .cust-name { font-size: 15px; font-weight: 800; margin-bottom: 3px; }
          .cust-phone { font-size: 13px; font-weight: bold; margin-top: 4px; }
          .otp-badge {
            display: inline-block;
            background: #fef08a;
            border: 1px dashed #854d0e;
            padding: 2px 6px;
            font-weight: 800;
            font-size: 12px;
            margin-top: 4px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-top: 4px;
          }
          .items-table th, .items-table td {
            border: 1px solid #ddd;
            padding: 4px 6px;
            text-align: left;
          }
          .footer {
            border-top: 2px solid #000;
            padding-top: 6px;
            font-size: 11px;
            display: flex;
            justify-content: space-between;
          }
          .total-amt { font-size: 16px; font-weight: 900; }
          @media print {
            body { padding: 0; }
            @page { size: 100mm 150mm; margin: 0; }
            .label-box { border: none; width: 100mm; height: 145mm; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="label-box">
          <div class="header">
            <div>
              <div class="brand">SPARROW CART</div>
              <div style="font-size:9px;color:#666;">EXPRESS DELIVERY</div>
            </div>
            <div class="badge">${isCod ? 'CASH ON DELIVERY' : 'PREPAID'}</div>
          </div>

          <div class="barcode-section">
            ${barcodeSvg}
            <div style="font-family:monospace;font-weight:bold;font-size:12px;margin-top:2px;">
              ORD #: ${order.orderNumber || order._id}
            </div>
          </div>

          <div class="section">
            <div class="section-title">DELIVER TO (CUSTOMER):</div>
            <div class="address-box">
              <div class="cust-name">${addr.fullName || order.user?.fullName || 'Customer'}</div>
              <div>${addr.addressLine1 || ''} ${addr.addressLine2 || ''}</div>
              ${addr.landmark ? `<div>Landmark: ${addr.landmark}</div>` : ''}
              <div><strong>${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}</strong></div>
              <div class="cust-phone">📞 Phone: ${addr.mobile || order.user?.mobile || 'N/A'}</div>
              ${order.collectionOTP ? `<div class="otp-badge">🔑 Delivery OTP: ${order.collectionOTP}</div>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">PACKAGE CONTENTS:</div>
            <table class="items-table">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th>Item</th>
                  <th style="width:45px;text-align:center;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${(order.items || []).map(i => `
                  <tr>
                    <td>${i.name || i.product?.name || 'Item'}</td>
                    <td style="text-align:center;font-weight:bold;">${i.quantity || 1}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <div>
              <div>Seller: <strong>${order.store?.storeName || 'SparrowCart Warehouse'}</strong></div>
              <div style="font-size:9px;color:#666;">Date: ${order.createdAtIST || new Date().toLocaleDateString()}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:10px;">${isCod ? 'COLLECT AMOUNT:' : 'TOTAL PAID:'}</div>
              <div class="total-amt">₹${order.grandTotal || 0}</div>
            </div>
          </div>

          <div class="no-print" style="margin-top:12px;text-align:center;">
            <button onclick="window.print()" style="padding:8px 16px;background:#000;color:#fff;font-weight:bold;cursor:pointer;border-radius:4px;border:none;">Print Shipping Label</button>
            <button onclick="window.close()" style="padding:8px 16px;margin-left:8px;cursor:pointer;">Close</button>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>
            Orders Management
          </h2>
          <p className="text-sm opacity-75 mt-1" style={{ color: themeColors.text }}>
            View and manage all customer orders
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" style={{ color: themeColors.text }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2 rounded-xl border w-full md:w-64"
              style={{
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text,
              }}
            />
          </div>

          <button
            onClick={fetchOrders}
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
            onClick={exportOrders}
            className="p-2 rounded-xl border flex items-center gap-2"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
            title="Export Orders"
            disabled={filteredOrders.length === 0}
          >
            <FaDownload />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
        <div className="rounded-xl p-3 border shadow-sm col-span-2 hover:shadow-md transition-all group" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5" style={{ color: themeColors.text }}>Total Orders</p>
              <p className="text-xl font-black" style={{ color: themeColors.text }}>{stats.total}</p>
            </div>
            <div className="p-2 rounded-xl bg-blue-500 shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <FaReceipt size={16} className="text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 border shadow-sm hover:shadow-md transition-all group" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5" style={{ color: themeColors.text }}>Pending</p>
              <p className="text-xl font-black text-yellow-600">{stats.pending}</p>
            </div>
            <div className="p-2 rounded-xl bg-yellow-500 shadow-md shadow-yellow-500/20 group-hover:scale-110 transition-transform">
              <FaClock size={16} className="text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 border shadow-sm hover:shadow-md transition-all group" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5" style={{ color: themeColors.text }}>Confirmed</p>
              <p className="text-xl font-black text-blue-600">{stats.confirmed}</p>
            </div>
            <div className="p-2 rounded-xl bg-blue-600 shadow-md shadow-blue-600/20 group-hover:scale-110 transition-transform">
              <FaCheckCircle size={16} className="text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 border shadow-sm hover:shadow-md transition-all group" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5" style={{ color: themeColors.text }}>Shipped</p>
              <p className="text-xl font-black text-purple-600">{stats.shipped}</p>
            </div>
            <div className="p-2 rounded-xl bg-purple-600 shadow-md shadow-purple-600/20 group-hover:scale-110 transition-transform">
              <FaTruck size={16} className="text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 border shadow-sm hover:shadow-md transition-all group" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5" style={{ color: themeColors.text }}>Delivered</p>
              <p className="text-xl font-black text-green-600">{stats.delivered}</p>
            </div>
            <div className="p-2 rounded-xl bg-green-600 shadow-md shadow-green-600/20 group-hover:scale-110 transition-transform">
              <FaCheck size={16} className="text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 border shadow-sm hover:shadow-md transition-all group" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5" style={{ color: themeColors.text }}>Cancelled</p>
              <p className="text-xl font-black text-red-600">{stats.cancelled}</p>
            </div>
            <div className="p-2 rounded-xl bg-red-600 shadow-md shadow-red-600/20 group-hover:scale-110 transition-transform">
              <FaBan size={16} className="text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 border shadow-sm col-span-2 hover:shadow-md transition-all group" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5" style={{ color: themeColors.text }}>Revenue</p>
              <p className="text-xl font-black" style={{ color: themeColors.text }}>₹{stats.revenue.toLocaleString()}</p>
            </div>
            <div className="p-2 rounded-xl bg-teal-500 shadow-md shadow-teal-500/20 group-hover:scale-110 transition-transform">
              <FaRupeeSign size={16} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text
            }}
          >
            <option value="all">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text
            }}
          >
            <option value="all">All Types</option>
            <option value="global">Global Orders</option>
            <option value="store">Store Orders</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text
            }}
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="total_desc">Highest Amount</option>
            <option value="total_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
          <p className="mt-2 opacity-70" style={{ color: themeColors.text }}>Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <FaReceipt className="text-6xl mx-auto mb-4 opacity-30" style={{ color: themeColors.text }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: themeColors.text }}>No Orders Found</h3>
          <p className="opacity-70" style={{ color: themeColors.text }}>
            {search ? `No orders match "${search}"` : "No orders have been placed yet"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: themeColors.background }}>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Order ID</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Customer</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Items</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Amount</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Status</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Payment</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Date</th>
                  <th className="text-left p-4 font-medium text-sm" style={{ color: themeColors.text }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr 
                    key={order._id || index} 
                    className={`border-t hover:bg-opacity-50 ${index % 2 === 0 ? '' : ''}`} 
                    style={{ borderColor: themeColors.border, backgroundColor: index % 2 === 0 ? themeColors.background + '30' : 'transparent' }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-mono text-xs" style={{ color: themeColors.text }}>
                            {order._id?.substring(0, 10)}...
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {order.store ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 inline-flex items-center">
                                <FaStore size={10} className="mr-1" />
                                Store
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 inline-flex items-center">
                                <FaGlobe size={10} className="mr-1" />
                                Global
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium" style={{ color: themeColors.text }}>{order.user?.fullName}</p>
                        <p className="text-xs opacity-70" style={{ color: themeColors.text }}>{order.user?.mobile}</p>
                        <p className="text-xs truncate max-w-[150px]" style={{ color: themeColors.text }}>
                          {order.shippingAddress?.city || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium" style={{ color: themeColors.text }}>
                          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs opacity-70 truncate max-w-[200px]" style={{ color: themeColors.text }}>
                          {order.items?.map(item => item.name).join(', ')}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-lg" style={{ color: themeColors.text }}>₹{order.grandTotal}</p>
                        {order.totalDiscount > 0 && (
                          <p className="text-xs text-green-600">-₹{order.totalDiscount} discount</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${getStatusColor(order.status).bg} ${getStatusColor(order.status).text}`}>
                        {getStatusColor(order.status).icon}
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${getPaymentStatusColor(order.paymentStatus).bg} ${getPaymentStatusColor(order.paymentStatus).text}`}>
                          {getPaymentStatusColor(order.paymentStatus).icon}
                          {order.paymentStatus}
                        </span>
                        <div className="flex items-center gap-1">
                          {getPaymentMethodIcon(order.paymentMethod)}
                          <span className="text-xs opacity-70">{order.paymentMethod}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm" style={{ color: themeColors.text }}>
                        {order.createdAtIST?.split(',')[0]}
                      </p>
                      <p className="text-xs opacity-70" style={{ color: themeColors.text }}>
                        {order.createdAtIST?.split(',')[1]?.trim()}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="p-2 rounded-lg hover:opacity-80 transition-colors"
                          style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                          title="View Details"
                          disabled={actionLoading}
                        >
                          <FaEye size={14} />
                        </button>
                        <button
                          onClick={() => quickChangeStatus(order)}
                          className="p-2 rounded-lg hover:opacity-80 transition-colors"
                          style={{ backgroundColor: '#10B98120', color: '#10B981' }}
                          title="Change Status"
                          disabled={actionLoading}
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => printOrder(order)}
                          className="p-2 rounded-lg hover:opacity-80 transition-colors"
                          style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}
                          title="Print Invoice"
                        >
                          <FaPrint size={14} />
                        </button>
                        <button
                          onClick={() => printShippingLabel(order)}
                          className="p-2 rounded-lg hover:opacity-80 transition-colors"
                          style={{ backgroundColor: '#6366F120', color: '#6366F1' }}
                          title="Print Shipping Label"
                        >
                          <FaBarcode size={14} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(order._id)}
                          className="p-2 rounded-lg hover:opacity-80 transition-colors"
                          style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}
                          title="Copy Order ID"
                        >
                          <FaCopy size={14} />
                        </button>
                        <button
                          onClick={() => deleteOrder(order)}
                          className="p-2 rounded-lg hover:opacity-80 transition-colors text-red-500"
                          style={{ backgroundColor: '#EF444420' }}
                          title="Delete Order"
                          disabled={actionLoading}
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}