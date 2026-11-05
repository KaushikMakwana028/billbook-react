import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dashboardService from '../services/dashboardService';
import { SkeletonKPI, SkeletonChart, SkeletonList } from '../components/Skeleton';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('day'); // 'day', 'week', 'month', 'year', 'custom'
  const [chartView, setChartView] = useState('weeks'); // 'weeks' or 'months'
  const [dashboardData, setDashboardData] = useState(null);

  // Custom Date Range Filters
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchDashboard = useCallback(async (activeFilter, customFrom = '', customTo = '') => {
    setLoading(true);
    try {
      const params = {};
      if (activeFilter === 'custom' || customFrom || customTo) {
        params.filter = 'custom';
        if (customFrom) params.from_date = customFrom;
        if (customTo) params.to_date = customTo;
      } else {
        params.filter = activeFilter;
      }

      const res = await dashboardService.getDashboardData(params);
      if (res.status && res.data) {
        setDashboardData(res.data);
      } else {
        toast.error(res.message || 'Failed to fetch dashboard data.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error loading dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(filter);
  }, [filter, fetchDashboard]);

  const handleFilterPreset = (preset) => {
    setFilter(preset);
    setShowCustomDate(false);
    setFromDate('');
    setToDate('');
    fetchDashboard(preset);
  };

  const handleApplyCustomRange = (e) => {
    if (e) e.preventDefault();
    if (!fromDate && !toDate) {
      toast.error('Please select From or To date.');
      return;
    }
    setFilter('custom');
    fetchDashboard('custom', fromDate, toDate);
  };

  const handleResetDateFilter = () => {
    setFilter('day');
    setShowCustomDate(false);
    setFromDate('');
    setToDate('');
    fetchDashboard('day');
  };

  const fmtCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return (
      'Rs. ' +
      num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  // Sparkline path generator
  const renderSparkline = (dataPoints, color = 'var(--blue)') => {
    const points = dataPoints && dataPoints.length > 1 ? dataPoints : [12, 18, 14, 24, 20, 28, 32, 26];
    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const range = max - min || 1;
    const width = 200;
    const height = 40;

    const pathData = points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 8) - 4;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path
          d={pathData}
          className="spk"
          style={{ stroke: color }}
        />
      </svg>
    );
  };

  const chart = dashboardData?.chart_data || {};
  const chartLabels = chart.labels || [];
  const chartSales = chart.sales_values || [];
  const chartProfit = chart.profit_values || [];
  const maxChartVal = Math.max(...chartSales, ...chartProfit, 100);

  const todayDateStr = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-4">
      {/* ── Welcome Greeting & Filter Bar ── */}
      <div className="hello">
        <div>
          <div className="text-xs text-[var(--mut)] flex items-center gap-1.5 mb-1 font-medium">
            <i className="bi bi-sun text-amber-500"></i>
            <span>{todayDateStr}</span>
          </div>
          <h1>Good morning, {user?.name ? user.name.split(' ')[0] : 'Partner'}</h1>
          <p>
            {dashboardData?.filter_label
              ? `Showing metrics for: ${dashboardData.filter_label}. Total sales and inventory are in sync.`
              : 'Here is what is happening with your sales, profit margins, and inventory health today.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Filter segment */}
          <div className="seg">
            <button
              className={filter === 'day' ? 'on' : ''}
              onClick={() => handleFilterPreset('day')}
            >
              Today
            </button>
            <button
              className={filter === 'week' ? 'on' : ''}
              onClick={() => handleFilterPreset('week')}
            >
              This Week
            </button>
            <button
              className={filter === 'month' ? 'on' : ''}
              onClick={() => handleFilterPreset('month')}
            >
              This Month
            </button>
            <button
              className={filter === 'year' ? 'on' : ''}
              onClick={() => handleFilterPreset('year')}
            >
              This Year
            </button>
            <button
              className={filter === 'custom' || showCustomDate ? 'on' : ''}
              onClick={() => setShowCustomDate(!showCustomDate)}
              title="Filter by custom date range"
            >
              <i className="bi bi-calendar-range me-1"></i>
              <span>Custom Date</span>
            </button>
          </div>

          <Link to="/sales" className="btn-b text-xs font-semibold !h-9 px-3.5">
            <i className="bi bi-plus-lg"></i>
            <span>Create Sale</span>
          </Link>
        </div>
      </div>

      {/* ── Custom Date Range Filter Box (From - To) ── */}
      {(showCustomDate || filter === 'custom') && (
        <form
          onSubmit={handleApplyCustomRange}
          className="card2 !p-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150 border border-[var(--blue)]/30"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
            <div className="w-7 h-7 rounded-lg bg-[var(--blue)]/10 text-[var(--blue)] flex items-center justify-center">
              <i className="bi bi-calendar3"></i>
            </div>
            <span>Filter Dashboard by Custom Date Range:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--mut)] font-medium">From:</span>
              <input
                type="date"
                className="auth-input !h-8 !w-auto text-xs py-1 px-2.5 cursor-pointer"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--mut)] font-medium">To:</span>
              <input
                type="date"
                className="auth-input !h-8 !w-auto text-xs py-1 px-2.5 cursor-pointer"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-b text-xs font-semibold !h-8 px-3.5"
            >
              <i className="bi bi-funnel"></i>
              <span>Apply Filter</span>
            </button>

            <button
              type="button"
              onClick={handleResetDateFilter}
              className="chip text-xs !h-8 px-2.5 hover:bg-[var(--soft)]"
              title="Reset to default filter"
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i>
              <span>Reset</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Row of 4 KPI Cards (Right below greeting, no clutter) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {loading ? (
          <>
            <SkeletonKPI />
            <SkeletonKPI />
            <SkeletonKPI />
            <SkeletonKPI />
          </>
        ) : (
          <>
            {/* KPI 1: Sales */}
            <div className="kpi on">
              <div className="flex items-center">
                <span className="ic">
                  <i className="bi bi-currency-rupee"></i>
                </span>
                <span className="sm font-medium">
                  {filter === 'day' ? "Today's Sales" : `${dashboardData?.filter_label || 'Period'} Sales`}
                </span>
              </div>
              <div className="v">
                {fmtCurrency(dashboardData?.filtered_total_sales ?? dashboardData?.today_total_sales)}
              </div>
              <div className="xs">
                <span className="up">
                  <i className="bi bi-arrow-up-right"></i> {filter === 'day' ? 'Live' : 'Period'}
                </span>
                <span className="mut ms-1.5">
                  {filter === 'day' ? 'Today revenue' : 'Filtered total revenue'}
                </span>
              </div>
              {renderSparkline(chartSales, '#ffffff')}
            </div>

            {/* KPI 2: Profit */}
            <div className="kpi">
              <div className="flex items-center">
                <span className="ic">
                  <i className="bi bi-graph-up-arrow"></i>
                </span>
                <span className="sm mut font-medium">
                  {filter === 'day' ? "Today's Net Profit" : `${dashboardData?.filter_label || 'Period'} Net Profit`}
                </span>
              </div>
              <div className="v" style={{ color: 'var(--green)' }}>
                {fmtCurrency(dashboardData?.filtered_total_profit ?? dashboardData?.today_total_profit)}
              </div>
              <div className="xs">
                <span className="up">
                  <i className="bi bi-check-circle"></i> Margin
                </span>
                <span className="mut ms-1.5">
                  {filter === 'day' ? 'Revenue minus product cost' : 'Filtered net margin'}
                </span>
              </div>
              {renderSparkline(chartProfit, 'var(--green)')}
            </div>

            {/* KPI 3: Products */}
            <div className="kpi">
              <div className="flex items-center">
                <span className="ic">
                  <i className="bi bi-box-seam"></i>
                </span>
                <span className="sm mut font-medium">Catalog Products</span>
              </div>
              <div className="v">{dashboardData?.product_count || 0}</div>
              <div className="xs">
                <span className="text-[var(--blue)] font-semibold">Active</span>
                <span className="mut ms-1.5">Total sellable inventory</span>
              </div>
              <div className="mt-2.5 pt-2 text-xs text-[var(--mut)] flex items-center justify-between border-t border-[var(--line)]">
                <span>Low stock:</span>
                <b className="text-[var(--red)]">{dashboardData?.low_stock_count || 0} items</b>
              </div>
            </div>

            {/* KPI 4: Customers */}
            <div className="kpi">
              <div className="flex items-center">
                <span className="ic">
                  <i className="bi bi-people"></i>
                </span>
                <span className="sm mut font-medium">Total Customers</span>
              </div>
              <div className="v">{dashboardData?.customer_count || 0}</div>
              <div className="xs">
                <span className="text-[var(--amber)] font-semibold">Parties</span>
                <span className="mut ms-1.5">Registered clients</span>
              </div>
              <div className="mt-2.5 pt-2 text-xs text-[var(--mut)] flex items-center justify-between border-t border-[var(--line)]">
                <span>Purchases cost:</span>
                <b className="text-[var(--ink)]">{fmtCurrency(dashboardData?.filtered_total_purchase)}</b>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Analytics Row: Sales & Profit Trend (8 cols) & Recent Invoices (4 cols) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5">
        {/* Sales & Profit Chart (8 cols) */}
        <div className="xl:col-span-8">
          {loading ? (
            <SkeletonChart />
          ) : (
            <div className="card2 flex flex-col justify-between">
              <div>
                <div className="h !mb-2">
                  <div>
                    <b>Sales & Profit Trend</b>
                    <small>
                      Total Sales: {fmtCurrency(chart.total_sales)} • Total Profit: {fmtCurrency(chart.total_profit)}
                    </small>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="seg">
                      <button
                        className={chartView === 'weeks' ? 'on' : ''}
                        onClick={() => setChartView('weeks')}
                      >
                        Weeks
                      </button>
                      <button
                        className={chartView === 'months' ? 'on' : ''}
                        onClick={() => setChartView('months')}
                      >
                        Months
                      </button>
                    </div>
                    <div className="dl hidden sm:flex">
                      <span>
                        <i style={{ background: 'var(--blue)' }}></i> Sales
                      </span>
                      <span>
                        <i style={{ background: 'var(--green)' }}></i> Profit
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bar Plot (Compact, tight height) */}
                <div className="plot">
                  {/* Horizontal guide lines */}
                  <div className="plot-grid" style={{ bottom: '0%' }}>
                    <span>Rs. 0</span>
                  </div>
                  <div className="plot-grid" style={{ bottom: '50%' }}>
                    <span>Rs. {Math.round(maxChartVal / 2).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="plot-grid" style={{ bottom: '100%' }}>
                    <span>Rs. {Math.round(maxChartVal).toLocaleString('en-IN')}</span>
                  </div>

                  {/* Bars */}
                  <div className="bars">
                    {chartLabels.length > 0 ? (
                      chartLabels.map((lbl, idx) => {
                        const sVal = chartSales[idx] || 0;
                        const pVal = chartProfit[idx] || 0;
                        const sHeight = Math.min(100, Math.max(6, (sVal / maxChartVal) * 100));
                        const pHeight = Math.min(100, Math.max(3, (pVal / maxChartVal) * 100));

                        return (
                          <div key={idx} className="cl">
                            <span className="tip">
                              Sales: {fmtCurrency(sVal)}
                              <br />
                              Profit: {fmtCurrency(pVal)}
                            </span>
                            <div
                              className="s"
                              style={{ height: `${sHeight}%` }}
                              title={`Sales: ${fmtCurrency(sVal)}`}
                            ></div>
                            <div
                              className="b"
                              style={{ height: `${pHeight}%`, marginTop: '2px' }}
                              title={`Profit: ${fmtCurrency(pVal)}`}
                            ></div>
                            <em>{lbl}</em>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex items-center justify-center w-full text-xs text-[var(--mut)]">
                        No sales recorded for this period. Create a sale to populate chart columns.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--mut)]">
                <span>Real-time data synced from database</span>
                <span className="font-medium text-[var(--ink)]">Auto-calculated</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Invoices Feed (4 cols) */}
        <div className="xl:col-span-4">
          {loading ? (
            <SkeletonList count={5} />
          ) : (
            <div className="card2 flex flex-col justify-between">
              <div>
                <div className="h !mb-2">
                  <div>
                    <b>Recent Invoices</b>
                    <small>Latest 5 store transactions</small>
                  </div>
                  <Link to="/sales" className="go" title="View all sales">
                    <i className="bi bi-arrow-up-right"></i>
                  </Link>
                </div>

                <div className="space-y-1">
                  {dashboardData?.recent_sales && dashboardData.recent_sales.length > 0 ? (
                    dashboardData.recent_sales.slice(0, 5).map((sale, i) => (
                      <div key={i} className="dd">
                        <div className="min-w-0 pr-2">
                          <b className="truncate text-[var(--ink)]">{sale.customer_name || 'Walk-in Customer'}</b>
                          <span className="mut xs block">{sale.invoice_number}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="fl success font-semibold">
                            {fmtCurrency(sale.grand_total)}
                          </span>
                          <span className="mut xs block mt-0.5">
                            {sale.sale_date ? sale.sale_date.split(' ')[0] : 'Today'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-[var(--mut)]">
                      <i className="bi bi-receipt text-3xl block mb-2 opacity-40"></i>
                      No invoices generated yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-[var(--line)]">
                <Link
                  to="/sales"
                  className="w-full btn-d justify-center text-xs font-semibold !h-8 text-[var(--blue)] hover:text-white"
                >
                  View All Invoices & Records
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Operations Row: Quick Shortcuts, Low Stock, Store Summary (3 cols) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {/* Card 1: Fast Shortcuts */}
        <div className="card2">
          <div className="h !mb-2">
            <div>
              <b>Quick Shortcuts</b>
              <small>Common operations</small>
            </div>
            <i className="bi bi-lightning-charge text-[var(--amber)] text-lg"></i>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Link
              to="/sales"
              className="p-2.5 rounded-xl border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--card)] hover:border-[var(--blue)] transition-all flex flex-col items-center justify-center gap-1 text-center text-xs font-medium text-[var(--ink)]"
            >
              <i className="bi bi-receipt text-lg text-[var(--blue)]"></i>
              <span>New Sale</span>
            </Link>

            <Link
              to="/products"
              className="p-2.5 rounded-xl border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--card)] hover:border-[var(--blue)] transition-all flex flex-col items-center justify-center gap-1 text-center text-xs font-medium text-[var(--ink)]"
            >
              <i className="bi bi-plus-circle text-lg text-[var(--green)]"></i>
              <span>Add Product</span>
            </Link>

            <Link
              to="/parties"
              className="p-2.5 rounded-xl border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--card)] hover:border-[var(--blue)] transition-all flex flex-col items-center justify-center gap-1 text-center text-xs font-medium text-[var(--ink)]"
            >
              <i className="bi bi-person-plus text-lg text-[var(--amber)]"></i>
              <span>Add Party</span>
            </Link>

            <Link
              to="/invoice-templates"
              className="p-2.5 rounded-xl border border-[var(--line)] bg-[var(--soft)] hover:bg-[var(--card)] hover:border-[var(--blue)] transition-all flex flex-col items-center justify-center gap-1 text-center text-xs font-medium text-[var(--ink)]"
            >
              <i className="bi bi-file-earmark-pdf text-lg text-rose-500"></i>
              <span>Templates</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Low Stock Warning */}
        <div className="card2">
          <div className="h !mb-2">
            <div>
              <b>Low Stock Watchlist</b>
              <small>Products with 5 or fewer items</small>
            </div>
            <span className="fl danger font-bold">
              {dashboardData?.low_stock_products?.length || 0} Critical
            </span>
          </div>

          <div className="space-y-1 mt-1">
            {dashboardData?.low_stock_products && dashboardData.low_stock_products.length > 0 ? (
              dashboardData.low_stock_products.slice(0, 3).map((item, idx) => (
                <div key={idx} className="dd">
                  <div>
                    <b>{item.name}</b>
                    <span className="mut xs">{fmtCurrency(item.sale_price)}</span>
                  </div>
                  <span className="fl danger font-bold">
                    Qty: {item.quantity}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-5 text-center text-xs text-[var(--mut)]">
                <i className="bi bi-check2-circle text-3xl text-emerald-500 block mb-1"></i>
                All inventory levels are healthy!
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Business Identity */}
        <div className="card2 flex flex-col justify-between">
          <div>
            <div className="h !mb-2">
              <div>
                <b>Business Summary</b>
                <small>Connected profile</small>
              </div>
              <Link to="/profile" className="go" title="Edit Profile">
                <i className="bi bi-pencil-square"></i>
              </Link>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--soft)] border border-[var(--line)] space-y-1.5 text-xs mt-1">
              <div className="flex justify-between">
                <span className="text-[var(--mut)]">Firm:</span>
                <b className="text-[var(--ink)]">{user?.business_name || 'KAUSHIK'}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mut)]">Owner:</span>
                <span className="text-[var(--ink)]">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--mut)]">Mobile:</span>
                <span className="text-[var(--ink)]">+91 {user?.mobile}</span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-[var(--line)]">
            <Link
              to="/profile"
              className="btn-d w-full justify-center text-xs font-semibold !h-8"
            >
              Manage Store Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
