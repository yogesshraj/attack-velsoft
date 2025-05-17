import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Sales</h3>
          <p className="text-3xl font-bold text-blue-600">₹0.00</p>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Purchases</h3>
          <p className="text-3xl font-bold text-green-600">₹0.00</p>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Orders</h3>
          <p className="text-3xl font-bold text-purple-600">0</p>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Active Users</h3>
          <p className="text-3xl font-bold text-orange-600">0</p>
          <p className="text-sm text-gray-500">Current</p>
        </div>
      </div>
      <div className="mt-6">
        <p className="text-gray-600">Welcome to VelSoft ERP Dashboard. More analytics and insights coming soon.</p>
      </div>
    </div>
  );
};

export default Dashboard; 