/* eslint-disable no-unused-vars */
import { useState } from "react";
import "./MonthlySalesChart.css"; // Reuse the same CSS

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function DailySalesChart({ salesData = [], checkInData = [] }) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [profitMargin, setProfitMargin] = useState(0.6); // Default 60% profit margin
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState("All");

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

  // Get number of days in selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  // Initialize daily totals
  const dailyTotals = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    revenue: 0,
    itemsSold: 0,
    entriesCount: 0,
    customers: 0,
  }));

  salesData.forEach((item) => {
    const dateStr = item.createdAt || item.timestamp;
    const dateObj = dateStr ? new Date(dateStr) : null;

    let dIndex = -1;
    let mIndex = -1;
    let year = selectedYear;

    if (dateObj && !isNaN(dateObj.getTime())) {
      dIndex = dateObj.getDate() - 1;
      mIndex = dateObj.getMonth();
      year = dateObj.getFullYear();
    } else if (typeof item.timestamp === "string") {
      const parts = item.timestamp.split("/");
      if (parts.length >= 3) {
        mIndex = parseInt(parts[0], 10) - 1;
        dIndex = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
    }

    if (year === selectedYear && mIndex === selectedMonth && dIndex >= 0 && dIndex < daysInMonth) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.amount) || 0;
      const revenue = qty * price;

      dailyTotals[dIndex].revenue += revenue;
      dailyTotals[dIndex].itemsSold += qty;
      dailyTotals[dIndex].entriesCount += 1;
    }
  });

  checkInData.forEach((chk) => {
    const dateObj = chk.checkInTime ? new Date(chk.checkInTime) : null;
    if (dateObj && !isNaN(dateObj.getTime())) {
      const dIndex = dateObj.getDate() - 1;
      const mIndex = dateObj.getMonth();
      const year = dateObj.getFullYear();
      if (year === selectedYear && mIndex === selectedMonth && dIndex >= 0 && dIndex < daysInMonth) {
        dailyTotals[dIndex].customers += (Number(chk.guestCount) || 1);
      }
    }
  });

  // Calculate maximum daily revenue for dynamic scaling
  const maxRevenue = Math.max(...dailyTotals.map((d) => d.revenue), 100);

  // Compute summary stats
  const totalMonthlyRevenue = dailyTotals.reduce((acc, d) => acc + d.revenue, 0);
  const totalMonthlyCustomers = dailyTotals.reduce((acc, d) => acc + d.customers, 0);
  const totalMonthlyProfit = totalMonthlyRevenue * profitMargin;
  
  // Calculate days with sales to find average daily revenue
  const daysWithSales = dailyTotals.filter(d => d.revenue > 0).length;
  const avgDailyRevenue = daysWithSales > 0 ? totalMonthlyRevenue / daysWithSales : 0;

  let peakDay = dailyTotals[0];
  dailyTotals.forEach((d) => {
    if (d.revenue > peakDay.revenue) {
      peakDay = d;
    }
  });

  // Specific Day data if a day is selected
  const selectedDayData = selectedDay !== "All" ? dailyTotals.find(d => d.day === Number(selectedDay)) : null;

  return (
    <div className="monthly-chart-card animate-fadeIn">
      {/* Chart Header */}
      <div className="chart-header">
        <div>
          <div className="chart-title-row">
            <h3>📈 Daily Sales & Profit Analysis</h3>
            <span className="badge badge-primary">{MONTH_NAMES[selectedMonth]} {selectedYear} Overview</span>
          </div>
          <p className="chart-subtitle">
            Visual breakdown of daily revenue, estimated profit margins, and sales volume.
          </p>
        </div>

        {/* Controls */}
        <div className="chart-controls">
          <div className="control-group">
            <label htmlFor="month-select-daily" className="control-label">Month:</label>
            <select
              id="month-select-daily"
              className="select select-sm chart-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="year-select-daily" className="control-label">Year:</label>
            <select
              id="year-select-daily"
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
            <label htmlFor="day-select-daily" className="control-label">Day:</label>
            <select
              id="day-select-daily"
              className="select select-sm chart-select"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            >
              <option value="All">All Days</option>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="margin-select-daily" className="control-label">Margin:</label>
            <select
              id="margin-select-daily"
              className="select select-sm chart-select"
              value={profitMargin}
              onChange={(e) => setProfitMargin(Number(e.target.value))}
            >
              <option value={0.4}>40%</option>
              <option value={0.5}>50%</option>
              <option value={0.6}>60%</option>
              <option value={0.7}>70%</option>
              <option value={0.8}>80%</option>
            </select>
          </div>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="chart-highlights">
        {selectedDay === "All" ? (
          <>
            <div className="highlight-item">
              <span className="highlight-label">Monthly Revenue</span>
              <span className="highlight-value text-emerald">₹{totalMonthlyRevenue.toFixed(2)}</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-label">Avg Daily Revenue</span>
              <span className="highlight-value text-emerald">₹{avgDailyRevenue.toFixed(2)}</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-label">Total Customers</span>
              <span className="highlight-value text-cyan">{totalMonthlyCustomers}</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-label">Peak Sales Day</span>
              <span className="highlight-value text-amber">
                {peakDay.revenue > 0 ? `Day ${peakDay.day} (₹${peakDay.revenue.toFixed(0)})` : "N/A"}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="highlight-item">
              <span className="highlight-label">Day {selectedDay} Revenue</span>
              <span className="highlight-value text-emerald">₹{(selectedDayData?.revenue || 0).toFixed(2)}</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-label">Day {selectedDay} Profit</span>
              <span className="highlight-value text-emerald">₹{((selectedDayData?.revenue || 0) * profitMargin).toFixed(2)}</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-label">Day {selectedDay} Customers</span>
              <span className="highlight-value text-cyan">{selectedDayData?.customers || 0}</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-label">Items Sold</span>
              <span className="highlight-value text-amber">{selectedDayData?.itemsSold || 0}</span>
            </div>
          </>
        )}
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
      <div className="chart-bars-container" style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
        <div className="y-axis-lines" style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--color-bg)' }}>
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

        <div className="bars-flex" style={{ minWidth: `${daysInMonth * 30}px`, paddingLeft: '40px' }}>
          {dailyTotals.map((d) => {
            const revenueHeightPct = Math.max((d.revenue / maxRevenue) * 100, d.revenue > 0 ? 6 : 2);
            const profitVal = d.revenue * profitMargin;
            const profitHeightPct = Math.max((profitVal / maxRevenue) * 100, profitVal > 0 ? 4 : 1);
            const isHovered = hoveredDay === d.day;

            return (
              <div
                key={d.day}
                className={`bar-group ${isHovered ? "hovered" : ""} ${selectedDay !== "All" && Number(selectedDay) === d.day ? "selected-day" : ""}`}
                onMouseEnter={() => setHoveredDay(d.day)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{ 
                  flex: 1, 
                  minWidth: '24px',
                  opacity: (selectedDay !== "All" && Number(selectedDay) !== d.day) ? 0.3 : 1,
                  transition: 'opacity 0.3s'
                }}
              >
                {/* Tooltip on Hover */}
                {isHovered && (
                  <div className="bar-tooltip animate-scaleIn" style={{
                    position: 'absolute',
                    bottom: '35px',
                    left: d.day > 20 ? 'auto' : '50%',
                    right: d.day > 20 ? '-20px' : 'auto',
                    transform: d.day > 20 ? 'none' : 'translateX(-50%)',
                    zIndex: 1000
                  }}>
                    <div className="tooltip-title">{MONTH_NAMES[selectedMonth]} {d.day}, {selectedYear}</div>
                    <div className="tooltip-row">
                      <span>Daily Revenue:</span>
                      <strong className="text-emerald">₹{d.revenue.toFixed(2)}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Est. Profit:</span>
                      <strong className="text-cyan">₹{profitVal.toFixed(2)}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Daily Customers:</span>
                      <strong className="text-amber">{d.customers}</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Items Sold:</span>
                      <span>{d.itemsSold}</span>
                    </div>
                  </div>
                )}

                {/* Bars Wrapper */}
                <div className="bar-pair">
                  <div
                    className="bar bar-revenue"
                    style={{ height: `${revenueHeightPct}%` }}
                  ></div>
                  <div
                    className="bar bar-profit"
                    style={{ height: `${profitHeightPct}%` }}
                  ></div>
                </div>

                {/* X Axis Label */}
                <span className={`x-label ${d.revenue > 0 ? "active-month" : ""}`} style={{ fontSize: '0.75rem' }}>
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
