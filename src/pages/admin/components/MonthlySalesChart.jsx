import { useState } from "react";
import "./MonthlySalesChart.css";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function MonthlySalesChart({ salesData = [] }) {
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [profitMargin, setProfitMargin] = useState(0.6); // Default 60% profit margin
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Extract available years from data
  const availableYears = Array.from(
    new Set(
      salesData.map((d) => {
        const dateStr = d.createdAt || d.timestamp;
        const parsedDate = dateStr ? new Date(dateStr) : new Date();
        return isNaN(parsedDate.getFullYear()) ? new Date().getFullYear() : parsedDate.getFullYear();
      })
    )
  );
  if (!availableYears.includes(new Date().getFullYear())) {
    availableYears.push(new Date().getFullYear());
  }
  availableYears.sort((a, b) => b - a);

  // Group sales data by month for the selected year
  const monthlyTotals = MONTH_NAMES.map((monthName, index) => {
    return {
      month: monthName,
      monthIndex: index,
      revenue: 0,
      itemsSold: 0,
      entriesCount: 0,
    };
  });

  salesData.forEach((item) => {
    const dateStr = item.createdAt || item.timestamp;
    const dateObj = dateStr ? new Date(dateStr) : null;

    let mIndex = -1;
    let year = selectedYear;

    if (dateObj && !isNaN(dateObj.getTime())) {
      mIndex = dateObj.getMonth();
      year = dateObj.getFullYear();
    } else if (typeof item.timestamp === "string") {
      // Fallback: match month string in timestamp (e.g. "9/8/2026")
      const parts = item.timestamp.split("/");
      if (parts.length >= 3) {
        mIndex = parseInt(parts[0], 10) - 1;
        year = parseInt(parts[2], 10);
      }
    }

    // Default to current month if unparseable
    if (mIndex < 0 || mIndex > 11) {
      mIndex = new Date().getMonth();
    }

    if (year === selectedYear) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.amount) || 0;
      const revenue = qty * price;

      monthlyTotals[mIndex].revenue += revenue;
      monthlyTotals[mIndex].itemsSold += qty;
      monthlyTotals[mIndex].entriesCount += 1;
    }
  });

  // Calculate maximum monthly revenue for dynamic scaling
  const maxRevenue = Math.max(...monthlyTotals.map((m) => m.revenue), 100);

  // Compute summary stats
  const totalAnnualRevenue = monthlyTotals.reduce((acc, m) => acc + m.revenue, 0);
  const totalAnnualProfit = totalAnnualRevenue * profitMargin;

  let peakMonth = monthlyTotals[0];
  monthlyTotals.forEach((m) => {
    if (m.revenue > peakMonth.revenue) {
      peakMonth = m;
    }
  });

  return (
    <div className="monthly-chart-card animate-fadeIn">
      {/* Chart Header */}
      <div className="chart-header">
        <div>
          <div className="chart-title-row">
            <h3>📊 Monthly Sales & Profit Analysis</h3>
            <span className="badge badge-primary">{selectedYear} Overview</span>
          </div>
          <p className="chart-subtitle">
            Visual breakdown of monthly revenue, estimated profit margins, and sales volume.
          </p>
        </div>

        {/* Controls: Year Selector & Profit Margin Switch */}
        <div className="chart-controls">
          <div className="control-group">
            <label htmlFor="year-select" className="control-label">Year:</label>
            <select
              id="year-select"
              className="select select-sm chart-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="margin-select" className="control-label">Profit Margin:</label>
            <select
              id="margin-select"
              className="select select-sm chart-select"
              value={profitMargin}
              onChange={(e) => setProfitMargin(Number(e.target.value))}
            >
              <option value={0.4}>40%</option>
              <option value={0.5}>50%</option>
              <option value={0.6}>60% (Default)</option>
              <option value={0.7}>70%</option>
              <option value={0.8}>80%</option>
            </select>
          </div>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="chart-highlights">
        <div className="highlight-item">
          <span className="highlight-label">Annual Revenue</span>
          <span className="highlight-value text-emerald">₹{totalAnnualRevenue.toFixed(2)}</span>
        </div>
        <div className="highlight-item">
          <span className="highlight-label">Est. Annual Profit ({Math.round(profitMargin * 100)}%)</span>
          <span className="highlight-value text-cyan">₹{totalAnnualProfit.toFixed(2)}</span>
        </div>
        <div className="highlight-item">
          <span className="highlight-label">Peak Sales Month</span>
          <span className="highlight-value text-amber">
            {peakMonth.revenue > 0 ? `${peakMonth.month} (₹${peakMonth.revenue.toFixed(0)})` : "N/A"}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-dot dot-revenue"></span>
          <span>Gross Revenue</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-profit"></span>
          <span>Estimated Profit ({Math.round(profitMargin * 100)}%)</span>
        </div>
      </div>

      {/* Bar Chart Grid */}
      <div className="chart-bars-container">
        <div className="y-axis-lines">
          <div className="y-line">
            <span>₹{maxRevenue.toFixed(0)}</span>
          </div>
          <div className="y-line">
            <span>₹{(maxRevenue * 0.5).toFixed(0)}</span>
          </div>
          <div className="y-line">
            <span>₹0</span>
          </div>
        </div>

        <div className="bars-flex">
          {monthlyTotals.map((m) => {
            const revenueHeightPct = Math.max((m.revenue / maxRevenue) * 100, m.revenue > 0 ? 6 : 2);
            const profitVal = m.revenue * profitMargin;
            const profitHeightPct = Math.max((profitVal / maxRevenue) * 100, profitVal > 0 ? 4 : 1);
            const isHovered = hoveredMonth === m.month;

            return (
              <div
                key={m.month}
                className={`bar-group ${isHovered ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredMonth(m.month)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                {/* Tooltip on Hover */}
                {isHovered && (
                  <div className="bar-tooltip animate-scaleIn">
                    <div className="tooltip-title">{m.month} {selectedYear}</div>
                    <div className="tooltip-row">
                      <span>Revenue:</span>
                      <strong className="text-emerald">₹{m.revenue.toFixed(2)}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Est. Profit:</span>
                      <strong className="text-cyan">₹{profitVal.toFixed(2)}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Items Sold:</span>
                      <span>{m.itemsSold}</span>
                    </div>
                  </div>
                )}

                {/* Bars Wrapper */}
                <div className="bar-pair">
                  {/* Revenue Bar */}
                  <div
                    className="bar bar-revenue"
                    style={{ height: `${revenueHeightPct}%` }}
                  ></div>
                  {/* Profit Bar */}
                  <div
                    className="bar bar-profit"
                    style={{ height: `${profitHeightPct}%` }}
                  ></div>
                </div>

                {/* X Axis Label */}
                <span className={`x-label ${m.revenue > 0 ? "active-month" : ""}`}>
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
