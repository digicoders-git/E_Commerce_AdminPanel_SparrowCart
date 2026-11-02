import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FaSync, FaHeart, FaBox, FaUsers, FaSearch } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import http from "../apis/http";

export default function Wishlists() {
  const { themeColors } = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await http.get("/wishlist/admin");
      setData(res?.data?.data || []);
    } catch {
      toast.error("Failed to load wishlist data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter(item =>
    item.productName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalWishlists = data.reduce((sum, i) => sum + (i.count || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: themeColors.text }}>Wishlists</h2>
          <p className="text-sm opacity-70 mt-1" style={{ color: themeColors.text }}>Most wishlisted products by users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: themeColors.text }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search product..."
              className="pl-9 pr-4 py-2 rounded-xl border w-56"
              style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }} />
          </div>
          <button onClick={fetchData} disabled={loading}
            className="p-2 rounded-xl border"
            style={{ borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text }}>
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Products Wishlisted", value: data.length, icon: <FaBox size={22} />, color: "blue" },
          { label: "Total Wishlist Entries", value: totalWishlists, icon: <FaHeart size={22} />, color: "red" },
          { label: "Most Wishlisted", value: data[0]?.productName || "—", icon: <FaUsers size={22} />, color: "green", small: true },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-5 border shadow-sm" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1" style={{ color: themeColors.text }}>{s.label}</p>
                <p className={`font-black text-${s.color}-500 ${s.small ? "text-lg" : "text-3xl"}`}>{s.value}</p>
              </div>
              <div className={`p-4 rounded-2xl bg-${s.color}-500 text-white shadow-lg`}>{s.icon}</div>
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
          <FaHeart className="text-5xl mx-auto mb-3 opacity-20" style={{ color: themeColors.text }} />
          <p className="font-bold text-lg" style={{ color: themeColors.text }}>No wishlist data found</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: themeColors.background, borderBottom: `1px solid ${themeColors.border}` }}>
                {["#", "Product", "Category", "Price", "Wishlist Count"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase opacity-60" style={{ color: themeColors.text }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.productId || i} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                  <td className="px-4 py-3 text-sm opacity-60" style={{ color: themeColors.text }}>{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={item.image || "https://via.placeholder.com/50"} alt={item.productName}
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={e => { e.target.src = "https://via.placeholder.com/50?text=No+Img"; }} />
                      <span className="font-semibold text-sm" style={{ color: themeColors.text }}>{item.productName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm opacity-70" style={{ color: themeColors.text }}>{item.category || "—"}</td>
                  <td className="px-4 py-3 text-sm font-bold" style={{ color: themeColors.primary }}>₹{item.price || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FaHeart className="text-red-500" />
                      <span className="font-bold text-red-500 text-lg">{item.count}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
