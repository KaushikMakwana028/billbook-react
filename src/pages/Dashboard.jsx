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

  // Group by month if chartView === 'months'
  const displayChartData = React.useMemo(() => {
    if (!chartLabels || chartLabels.length === 0) {
      return { labels: [], sales: [], profit: [] };
    }

    if (chartView === 'months') {
      const monthMap = {};
      chartLabels.forEach((lbl, i) => {
        const parts = lbl.trim().split(' ');
        const monthKey = parts.length > 1 ? parts[1] : lbl;
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { sales: 0, profit: 0 };
        }
        monthMap[monthKey].sales += Number(chartSales[i]) || 0;
        monthMap[monthKey].profit += Number(chartProfit[i]) || 0;
      });

      const mLabels = Object.keys(monthMap);
      return {
        labels: mLabels,
        sales: mLabels.map((m) => monthMap[m].sales),
        profit: mLabels.map((m) => monthMap[m].profit),
      };
    }

    return {
      labels: chartLabels,
      sales: chartSales.map((v) => Number(v) || 0),
      profit: chartProfit.map((v) => Number(v) || 0),
    };
  }, [chartLabels, chartSales, chartProfit, chartView]);

  // Clean, rounded ceiling with ~18% headroom so tallest bar never breaches the top gridline
  const maxChartVal = React.useMemo(() => {
    const raw = Math.max(...displayChartData.sales, ...displayChartData.profit, 100);
    if (!raw || raw <= 0) return 1000;
    const target = raw * 1.18;
    const mag = Math.pow(10, Math.floor(Math.log10(target)));
    const norm = target / mag;
    let nice = 10;
    if (norm <= 1.25) nice = 1.25;
    else if (norm <= 1.5) nice = 1.5;
    else if (norm <= 2) nice = 2;
    else if (norm <= 2.5) nice = 2.5;
    else if (norm <= 4) nice = 4;
    else if (norm <= 5) nice = 5;
    else if (norm <= 7.5) nice = 7.5;
    return Math.round(nice * mag);
  }, [displayChartData]);

  const totalSalesView = React.useMemo(() => {
    return displayChartData.sales.reduce((acc, v) => acc + v, 0) || Number(chart.total_sales) || 0;
  }, [displayChartData, chart.total_sales]);

  const totalProfitView = React.useMemo(() => {
    return displayChartData.profit.reduce((acc, v) => acc + v, 0) || Number(chart.total_profit) || 0;
  }, [displayChartData, chart.total_profit]);

  const todayDateStr = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-4">
      {/* ── Welcome Greeting & Filter Bar ── */}
      <div className="hello flex flex-col sm:flex-row sm:items-end justify-between gap-3">
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Filter segment with mobile horizontal scroll */}
          <div className="seg mobile-scroll text-xs w-full sm:w-auto flex justify-between sm:justify-start">
            <button
              className={filter === 'day' ? 'on flex-1 sm:flex-initial' : 'flex-1 sm:flex-initial'}
              onClick={() => handleFilterPreset('day')}
            >
              Today
            </button>
            <button
              className={filter === 'week' ? 'on flex-1 sm:flex-initial' : 'flex-1 sm:flex-initial'}
              onClick={() => handleFilterPreset('week')}
            >
              This Week
            </button>
            <button
              className={filter === 'month' ? 'on flex-1 sm:flex-initial' : 'flex-1 sm:flex-initial'}
              onClick={() => handleFilterPreset('month')}
            >
              This Month
            </button>
            <button
              className={filter === 'year' ? 'on flex-1 sm:flex-initial' : 'flex-1 sm:flex-initial'}
              onClick={() => handleFilterPreset('year')}
            >
              This Year
            </button>
            <button
              className={filter === 'custom' || showCustomDate ? 'on flex-1 sm:flex-initial' : 'flex-1 sm:flex-initial'}
              onClick={() => setShowCustomDate(!showCustomDate)}
              title="Filter by custom date range"
            >
              <i className="bi bi-calendar-range me-1"></i>
              <span>Custom</span>
            </button>
          </div>

          <Link to="/sales" className="btn-b text-xs font-semibold !h-9 px-3.5 flex items-center justify-center gap-1.5 shrink-0">
            <i className="bi bi-plus-lg"></i>
            <span>Create Sale</span>
          </Link>
        </div>
      </div>

      {/* ── Custom Date Range Filter Box (From - To) ── */}
      {(showCustomDate || filter === 'custom') && (
        <form
          onSubmit={handleApplyCustomRange}
          className="card2 !p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150 border border-[var(--blue)]/30"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
            <div className="w-7 h-7 rounded-lg bg-[var(--blue)]/10 text-[var(--blue)] flex items-center justify-center shrink-0">
              <i className="bi bi-calendar3"></i>
            </div>
            <span>Filter by Custom Date Range:</span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
              <span className="text-[11px] text-[var(--mut)] font-medium">From:</span>
              <input
                type="date"
                className="auth-input !h-9 text-xs py-1 px-2.5 cursor-pointer w-full sm:w-auto"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
              <span className="text-[11px] text-[var(--mut)] font-medium">To:</span>
              <input
                type="date"
                className="auth-input !h-9 text-xs py-1 px-2.5 cursor-pointer w-full sm:w-auto"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="col-span-2 sm:col-span-1 flex items-center gap-2 mt-1 sm:mt-0">
              <button
                type="submit"
                className="btn-b text-xs font-semibold !h-9 px-3.5 flex-1 sm:flex-none justify-center"
              >
                <i className="bi bi-funnel"></i>
                <span>Apply</span>
              </button>

              <button
                type="button"
                onClick={handleResetDateFilter}
                className="chip text-xs !h-9 px-3 hover:bg-[var(--soft)] flex-1 sm:flex-none justify-center"
                title="Reset to default filter"
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                <span>Reset</span>
              </button>
            </div>
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
                <div className="h !mb-2 flex-wrap gap-2">
                  <div>
                    <b>Sales & Profit Trend</b>
                    <small>
                      Total Sales: {fmtCurrency(totalSalesView)} • Total Profit: {fmtCurrency(totalProfitView)}
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
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-[var(--ink)]">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[var(--blue)] inline-block"></span>
                        <span>Sales</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[var(--ink)]">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[var(--green)] inline-block"></span>
                        <span>Profit</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bar Plot */}
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

                  {/* Grouped Side-by-Side Bars */}
                  <div className="bars">
                    {displayChartData.labels.length > 0 ? (
                      displayChartData.labels.map((lbl, idx) => {
                        const sVal = displayChartData.sales[idx] || 0;
                        const pVal = displayChartData.profit[idx] || 0;
                        const sHeight = Math.min(100, Math.max(sVal > 0 ? 3 : 0, (sVal / maxChartVal) * 100));
                        const pHeight = Math.min(100, Math.max(pVal > 0 ? 3 : 0, (pVal / maxChartVal) * 100));

                        return (
                          <div key={idx} className="cl">
                            <div className="tip">
                              <div className="font-semibold text-white mb-1 pb-1 border-b border-slate-700/60">
                                {lbl}
                              </div>
                              <div className="flex items-center justify-between gap-4 text-[11px] text-slate-300">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                                  <span>Sales:</span>
                                </span>
                                <b className="text-blue-400 font-semibold">{fmtCurrency(sVal)}</b>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-[11px] mt-0.5 text-slate-300">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                  <span>Profit:</span>
                                </span>
                                <b className="text-emerald-400 font-semibold">{fmtCurrency(pVal)}</b>
                              </div>
                            </div>
                            <div className="bar-group">
                              <div
                                className="bar-s"
                                style={{ height: `${sHeight}%` }}
                                title={`Sales: ${fmtCurrency(sVal)}`}
                              ></div>
                              <div
                                className="bar-p"
                                style={{ height: `${pHeight}%` }}
                                title={`Profit: ${fmtCurrency(pVal)}`}
                              ></div>
                            </div>
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
                <div className="h !mb-2 flex-wrap gap-2">
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
