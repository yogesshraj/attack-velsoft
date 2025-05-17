import { useState } from 'react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Legend
);

const stats = [
  {
    name: 'Total Revenue',
    value: '₹92,45,000',
    change: '+4.75%',
    changeType: 'positive',
    icon: CurrencyRupeeIcon,
  },
  {
    name: 'Active Orders',
    value: '245',
    change: '+5.25%',
    changeType: 'positive',
    icon: ShoppingCartIcon,
  },
  {
    name: 'New Customers',
    value: '35',
    change: '-3.2%',
    changeType: 'negative',
    icon: UserGroupIcon,
  },
  {
    name: 'Inventory Items',
    value: '1,250',
    change: '+2.3%',
    changeType: 'positive',
    icon: CubeIcon,
  },
];

const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Revenue',
      data: [3000000, 3500000, 4200000, 3800000, 4500000, 4800000],
      borderColor: 'rgb(14, 165, 233)',
      backgroundColor: 'rgba(14, 165, 233, 0.5)',
      tension: 0.4,
    },
    {
      label: 'Expenses',
      data: [2500000, 2800000, 3300000, 3100000, 3600000, 3900000],
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.5)',
      tension: 0.4,
    },
  ],
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Revenue vs Expenses',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: number) => `₹${(value / 100000).toFixed(1)}L`,
      },
    },
  },
};

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Dashboard
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon
                  className="h-6 w-6 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-4 flex-1">
                <div className="text-sm font-medium text-gray-500">
                  {stat.name}
                </div>
                <div className="mt-1 flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </div>
                  <div
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {stat.changeType === 'positive' ? (
                      <ArrowUpIcon
                        className="h-4 w-4 flex-shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <ArrowDownIcon
                        className="h-4 w-4 flex-shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span className="sr-only">
                      {stat.changeType === 'positive'
                        ? 'Increased by'
                        : 'Decreased by'}
                    </span>
                    {stat.change}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <Line options={chartOptions} data={chartData} />
        </div>
        
        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              <li className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                      <ShoppingCartIcon
                        className="h-5 w-5 text-white"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        New order{' '}
                        <a href="#" className="font-medium text-gray-900">
                          #12345
                        </a>{' '}
                        received
                      </p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      10 minutes ago
                    </div>
                  </div>
                </div>
              </li>
              {/* Add more activity items here */}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 