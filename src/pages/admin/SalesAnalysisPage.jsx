/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Sidebar from "../../components/admin/Sidebar";
import MonthlySalesChart from "./components/MonthlySalesChart";
import "./SalesAnalysisPage.css";

const API_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/orders/orderdata`;


const formatDateYYYYMMDD = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}/${mm}/${dd}`;
  }
  const parts = String(dateVal).split(",")[0].trim().split("/");
  if (parts.length === 3) {
    const mm = parts[0].padStart(2, "0");
    const dd = parts[1].padStart(2, "0");
    const yyyy = parts[2];
    return `${yyyy}/${mm}/${dd}`;
  }
  return String(dateVal).split(",")[0];
};

export default function SalesAnalysisPage() {

  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSalesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem("yoeg_admin_token");
      const res = await fetch(API_URL, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch sales data (${res.status})`);
      }

      const data = await res.json();
      setSalesData(data);
    } catch (err) {
      console.error("Error fetching sales data:", err);
      setError(err.message || "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  // Compute key analytics figures
  const totalItemsSold = salesData.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const totalRevenue = salesData.reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.amount) || 0),
    0
  );
  const totalEntries = salesData.length;
  const avgOrderValue = totalItemsSold > 0 ? (totalRevenue / totalItemsSold).toFixed(2) : "0.00";

  // Aggregate item breakdown for top selling items
  const itemMap = {};
  salesData.forEach((record) => {
    const itemName = record.order || "Unknown Item";
    const qty = Number(record.quantity) || 0;
    const unitPrice = Number(record.amount) || 0;
    const revenue = qty * unitPrice;

    if (!itemMap[itemName]) {
      itemMap[itemName] = { name: itemName, qty: 0, revenue: 0, unitPrice };
    }
    itemMap[itemName].qty += qty;
    itemMap[itemName].revenue += revenue;
  });

  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty);
  const maxQty = topItems.length > 0 ? topItems[0].qty : 1;

  // Filtered sales log
  const filteredData = salesData.filter((item) => {
    const nameMatch = item.order?.toLowerCase().includes(searchQuery.toLowerCase());
    const timeMatch = item.timestamp?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || timeMatch;
  });

  return (
    <div className="admin-page">
      <div className="admin-mobile-nav">
        <Navbar variant="admin" />
      </div>

      <div className="admin-layout">
        <Sidebar />
        <main className="admin-main">
          {/* Header */}
          <div className="admin-header animate-slideDown">
            <div>
              <h1>Sales Analysis</h1>
              <p>Analyze revenue, top items, and order transaction history stored in OrderData.</p>
            </div>
            <button
              className="btn btn-secondary btn-sm refresh-btn"
              onClick={fetchSalesData}
              disabled={loading}
            >
              🔄 {loading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="alert alert-danger animate-fadeIn">
              ⚠️ {error}
            </div>
          )}

          {/* Overview Stat Cards */}
          <div className="sales-kpi-grid animate-slideUp">
            <div className="kpi-card kpi-revenue">
              <div className="kpi-icon">💰</div>
              <div className="kpi-content">
                <span className="kpi-label">Total Revenue</span>
                <span className="kpi-value">₹{totalRevenue.toFixed(2)}</span>
              </div>
            </div>

            <div className="kpi-card kpi-quantity">
              <div className="kpi-icon">📦</div>
              <div className="kpi-content">
                <span className="kpi-label">Items Sold</span>
                <span className="kpi-value">{totalItemsSold}</span>
              </div>
            </div>

            <div className="kpi-card kpi-entries">
              <div className="kpi-icon">📋</div>
              <div className="kpi-content">
                <span className="kpi-label">Order Data Records</span>
                <span className="kpi-value">{totalEntries}</span>
              </div>
            </div>

            <div className="kpi-card kpi-avg">
              <div className="kpi-icon">📈</div>
              <div className="kpi-content">
                <span className="kpi-label">Avg Item Price</span>
                <span className="kpi-value">₹{avgOrderValue}</span>
              </div>
            </div>
          </div>

          {/* Interactive Monthly Sales & Profit Chart */}
          <MonthlySalesChart salesData={salesData} />

          {/* Main Analytics Layout: Top Items + Full Log Table */}
          <div className="analytics-body-grid">

            {/* Top Selling Items Breakdown */}
            <div className="analytics-card top-items-card">
              <div className="card-header">
                <h3>🔥 Top Selling Items</h3>
                <span className="badge badge-neutral" style={{ marginTop:"5px", marginLeft: "5px" }}>{topItems.length} Unique Items</span>
              </div>
              <div className="top-items-list">
                {topItems.length === 0 ? (
                  <div className="empty-state">No sales data recorded yet.</div>
                ) : (
                  topItems.slice(0, 6).map((item, idx) => {
                    const percentage = Math.round((item.qty / maxQty) * 100);
                    return (
                      <div key={item.name} className="top-item-row">
                        <div className="item-rank">{idx + 1}</div>
                        <div className="item-details">
                          <div className="item-meta">
                            <span className="item-names">{item.name}</span>
                            <span className="item-stats">
                              {item.qty} sold &bull; <strong>₹{item.revenue.toFixed(2)}</strong>
                            </span>
                          </div>
                          <div className="progress-bar-container">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sales Transaction Log Table */}
            <div className="analytics-card sales-log-card">
              <div className="card-header flex-between">
                <h3>📜 OrderData Sales Log</h3>
                <div className="search-box">
                  <input
                    type="text"
                    className="input input-sm search-input"
                    placeholder="Search items or timestamps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Order / Item Name</th>
                      <th>Quantity</th>
                      <th>Unit Amount</th>
                      <th>Total Value</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          Loading sales records...
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          {searchQuery ? "No records matching search." : "No OrderData records saved."}
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((row, index) => (
                        <tr key={row._id || index}>
                          <td className="text-muted">{index + 1}</td>
                          <td className="font-weight-bold">{row.order}</td>
                          <td>
                            <span className="badge badge-secondary">{row.quantity}</span>
                          </td>
                          <td>₹{Number(row.amount).toFixed(2)}</td>
                          <td className="text-success font-weight-bold">
                            ₹{(Number(row.quantity) * Number(row.amount)).toFixed(2)}
                          </td>
                          <td className="text-muted text-sm">
                            {formatDateYYYYMMDD(row.createdAt || row.timestamp)}
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
