import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardMetrics {
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  expenses: {
    current: number;
    previous: number;
    change: number;
  };
  profit: {
    current: number;
    previous: number;
    change: number;
  };
  accountsReceivable: number;
  accountsPayable: number;
  cashBalance: number;
  revenueByCategory: {
    labels: string[];
    data: number[];
  };
  expensesByCategory: {
    labels: string[];
    data: number[];
  };
  monthlyTrend: {
    labels: string[];
    revenue: number[];
    expenses: number[];
    profit: number[];
  };
}

interface AIInsight {
  id: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  message: string;
  metric?: string;
  change?: number;
}

const Dashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Fetch dashboard metrics
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>(
    ['dashboard-metrics', dateRange],
    () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      return fetch(`/api/finance/dashboard/metrics?${params}`).then((res) =>
        res.json()
      );
    }
  );

  // Fetch AI insights
  const { data: insights } = useQuery<AIInsight[]>(
    ['ai-insights', dateRange],
    () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      return fetch(`/api/finance/dashboard/insights?${params}`).then((res) =>
        res.json()
      );
    }
  );

  const askAI = async () => {
    try {
      const response = await fetch('/api/finance/dashboard/ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: aiQuery,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
      });
      const data = await response.json();
      setAiResponse(data.response);
    } catch (error) {
      console.error('Error querying AI:', error);
      alert('Failed to get AI response');
    }
  };

  const renderMetricCard = (
    title: string,
    value: number,
    previousValue: number,
    change: number,
    icon: React.ReactNode
  ) => {
    const isPositive = change >= 0;
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              ₹{value.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              vs ₹{previousValue.toLocaleString()}
            </p>
          </div>
          <div
            className={`rounded-full p-3 ${
              isPositive ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            {icon}
          </div>
        </div>
        <div className="mt-4">
          <span
            className={`inline-flex items-center text-sm font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isPositive ? (
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
            )}
            {Math.abs(change)}%
          </span>
          <span className="text-sm text-gray-500 ml-2">vs previous period</span>
        </div>
      </div>
    );
  };

  const lineChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => `₹${value.toLocaleString()}`,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
        <div className="flex gap-4">
          <button
            onClick={() => {
              const now = new Date();
              setDateRange({
                startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
                endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
              });
            }}
            className="btn btn-secondary text-sm"
          >
            This Month
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const lastMonth = subMonths(now, 1);
              setDateRange({
                startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
                endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
              });
            }}
            className="btn btn-secondary text-sm"
          >
            Last Month
          </button>
          <button
            onClick={() => {
              const now = new Date();
              setDateRange({
                startDate: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'),
                endDate: format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'),
              });
            }}
            className="btn btn-secondary text-sm"
          >
            This Year
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics && (
          <>
            {renderMetricCard(
              'Revenue',
              metrics.revenue.current,
              metrics.revenue.previous,
              metrics.revenue.change,
              <BanknotesIcon className="h-6 w-6 text-green-600" />
            )}
            {renderMetricCard(
              'Expenses',
              metrics.expenses.current,
              metrics.expenses.previous,
              metrics.expenses.change,
              <DocumentTextIcon className="h-6 w-6 text-red-600" />
            )}
            {renderMetricCard(
              'Net Profit',
              metrics.profit.current,
              metrics.profit.previous,
              metrics.profit.change,
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            )}
            {renderMetricCard(
              'Cash Balance',
              metrics.cashBalance,
              0,
              0,
              <BanknotesIcon className="h-6 w-6 text-gray-600" />
            )}
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics && (
          <>
            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Revenue vs Expenses
              </h2>
              <Line
                data={{
                  labels: metrics.monthlyTrend.labels,
                  datasets: [
                    {
                      label: 'Revenue',
                      data: metrics.monthlyTrend.revenue,
                      borderColor: 'rgb(34, 197, 94)',
                      backgroundColor: 'rgba(34, 197, 94, 0.5)',
                    },
                    {
                      label: 'Expenses',
                      data: metrics.monthlyTrend.expenses,
                      borderColor: 'rgb(239, 68, 68)',
                      backgroundColor: 'rgba(239, 68, 68, 0.5)',
                    },
                    {
                      label: 'Profit',
                      data: metrics.monthlyTrend.profit,
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    },
                  ],
                }}
                options={lineChartOptions}
              />
            </div>

            <div className="grid grid-rows-2 gap-6">
              <div className="card p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Revenue by Category
                </h2>
                <Doughnut
                  data={{
                    labels: metrics.revenueByCategory.labels,
                    datasets: [
                      {
                        data: metrics.revenueByCategory.data,
                        backgroundColor: [
                          'rgba(34, 197, 94, 0.5)',
                          'rgba(59, 130, 246, 0.5)',
                          'rgba(168, 85, 247, 0.5)',
                          'rgba(234, 179, 8, 0.5)',
                        ],
                        borderColor: [
                          'rgb(34, 197, 94)',
                          'rgb(59, 130, 246)',
                          'rgb(168, 85, 247)',
                          'rgb(234, 179, 8)',
                        ],
                      },
                    ],
                  }}
                  options={doughnutOptions}
                />
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Expenses by Category
                </h2>
                <Doughnut
                  data={{
                    labels: metrics.expensesByCategory.labels,
                    datasets: [
                      {
                        data: metrics.expensesByCategory.data,
                        backgroundColor: [
                          'rgba(239, 68, 68, 0.5)',
                          'rgba(245, 158, 11, 0.5)',
                          'rgba(99, 102, 241, 0.5)',
                          'rgba(236, 72, 153, 0.5)',
                        ],
                        borderColor: [
                          'rgb(239, 68, 68)',
                          'rgb(245, 158, 11)',
                          'rgb(99, 102, 241)',
                          'rgb(236, 72, 153)',
                        ],
                      },
                    ],
                  }}
                  options={doughnutOptions}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* AI Insights */}
      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            AI Financial Assistant
          </h2>
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask about your financial data (e.g., 'What's my net profit this quarter?')"
              className="input-field flex-1"
            />
            <button onClick={askAI} className="btn btn-primary">
              Ask AI
            </button>
          </div>
          {aiResponse && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900">{aiResponse}</p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">AI Insights</h2>
          <div className="space-y-4">
            {insights?.map((insight) => (
              <div
                key={insight.id}
                className={`flex items-start gap-4 p-4 rounded-lg ${
                  insight.type === 'POSITIVE'
                    ? 'bg-green-50'
                    : insight.type === 'NEGATIVE'
                    ? 'bg-red-50'
                    : 'bg-blue-50'
                }`}
              >
                <ChatBubbleLeftRightIcon
                  className={`h-6 w-6 ${
                    insight.type === 'POSITIVE'
                      ? 'text-green-600'
                      : insight.type === 'NEGATIVE'
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-medium ${
                      insight.type === 'POSITIVE'
                        ? 'text-green-900'
                        : insight.type === 'NEGATIVE'
                        ? 'text-red-900'
                        : 'text-blue-900'
                    }`}
                  >
                    {insight.message}
                  </p>
                  {insight.metric && (
                    <p className="text-sm mt-1">
                      {insight.metric}:{' '}
                      {insight.change && (
                        <span
                          className={
                            insight.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {insight.change >= 0 ? '+' : ''}
                          {insight.change}%
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 