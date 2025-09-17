import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Activity, DollarSign, TrendingUp, AlertTriangle, Server, Cpu, HardDrive } from 'lucide-react';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}

interface RecommendationItem {
  id: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedSavings: number;
  estimatedSavingsPercent: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [costData, setCostData] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls - in real implementation, these would fetch from your performance monitor
      const mockMetrics = generateMockMetrics();
      const mockCostData = generateMockCostData();
      const mockRecommendations = generateMockRecommendations();

      setMetrics(mockMetrics);
      setCostData(mockCostData);
      setRecommendations(mockRecommendations);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setIsLoading(false);
    }
  };

  const generateMockMetrics = () => {
    const now = new Date();
    return Array.from({ length: 24 }, (_, i) => ({
      time: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cpuUsage: 30 + Math.random() * 40,
      memoryUsage: 40 + Math.random() * 30,
      responseTime: 100 + Math.random() * 200,
      throughput: 800 + Math.random() * 400,
      errorRate: Math.random() * 2
    }));
  };

  const generateMockCostData = () => {
    return [
      { service: 'EC2', cost: 450, percentage: 35 },
      { service: 'RDS', cost: 280, percentage: 22 },
      { service: 'Lambda', cost: 120, percentage: 9 },
      { service: 'S3', cost: 80, percentage: 6 },
      { service: 'EKS', cost: 200, percentage: 16 },
      { service: 'Other', cost: 150, percentage: 12 }
    ];
  };

  const generateMockRecommendations = (): RecommendationItem[] => {
    return [
      {
        id: '1',
        type: 'autoscaling',
        priority: 'high',
        title: 'Enable Auto Scaling for EC2 Instances',
        description: 'High CPU usage detected during peak hours. Implement horizontal auto scaling.',
        estimatedSavings: 850,
        estimatedSavingsPercent: 25
      },
      {
        id: '2',
        type: 'instance-rightsizing',
        priority: 'medium',
        title: 'Rightsize RDS Instance',
        description: 'Database instance is underutilized. Consider downsizing to reduce costs.',
        estimatedSavings: 420,
        estimatedSavingsPercent: 30
      },
      {
        id: '3',
        type: 'reserved-instances',
        priority: 'medium',
        title: 'Purchase Reserved Instances',
        description: 'Consistent usage patterns detected. Reserved instances can save 40% on costs.',
        estimatedSavings: 1200,
        estimatedSavingsPercent: 40
      }
    ];
  };

  const metricCards: MetricCard[] = [
    {
      title: 'Avg Response Time',
      value: `${metrics.length > 0 ? Math.round(metrics[metrics.length - 1]?.responseTime || 0) : 0}ms`,
      change: '+12%',
      trend: 'up',
      icon: <Activity className="h-6 w-6" />
    },
    {
      title: 'Total Monthly Cost',
      value: '$1,280',
      change: '-8%',
      trend: 'down',
      icon: <DollarSign className="h-6 w-6" />
    },
    {
      title: 'CPU Utilization',
      value: `${metrics.length > 0 ? Math.round(metrics[metrics.length - 1]?.cpuUsage || 0) : 0}%`,
      change: '+5%',
      trend: 'up',
      icon: <Cpu className="h-6 w-6" />
    },
    {
      title: 'Potential Savings',
      value: '$2,470',
      change: '+15%',
      trend: 'up',
      icon: <TrendingUp className="h-6 w-6" />
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Performance Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Performance & Cost Optimization Dashboard</title>
        <meta name="description" content="Monitor performance metrics, costs, and optimization recommendations" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance & Cost Optimization Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor your system performance, track costs, and get optimization recommendations</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricCards.map((card, index) => (
            <div key={index} className="bg-white overflow-hidden shadow-lg rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-primary-500">
                      {card.icon}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                  </div>
                  <div className={`ml-2 flex items-center text-sm ${card.trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                    <span>{card.change}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Metrics Chart */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics (24h)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cpuUsage" stroke="#8884d8" name="CPU Usage %" />
                <Line type="monotone" dataKey="memoryUsage" stroke="#82ca9d" name="Memory Usage %" />
                <Line type="monotone" dataKey="responseTime" stroke="#ffc658" name="Response Time (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Breakdown Chart */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown by Service</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cost"
                >
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Throughput and Error Rate Chart */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Throughput & Error Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="throughput" fill="#8884d8" name="Throughput (req/s)" />
              <Line yAxisId="right" type="monotone" dataKey="errorRate" stroke="#ff7300" name="Error Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Optimization Recommendations */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Optimization Recommendations</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                          {rec.priority.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500 capitalize">{rec.type.replace('-', ' ')}</span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">{rec.title}</h4>
                      <p className="text-gray-600 mb-3">{rec.description}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-600 font-medium">
                          Potential Savings: ${rec.estimatedSavings}/month ({rec.estimatedSavingsPercent}%)
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {rec.priority === 'high' && <AlertTriangle className="h-6 w-6 text-red-500" />}
                      {rec.priority === 'medium' && <TrendingUp className="h-6 w-6 text-yellow-500" />}
                      {rec.priority === 'low' && <Server className="h-6 w-6 text-green-500" />}
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors">
                      Implement
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
                      Learn More
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p>Performance & Cost Optimization Dashboard by FlashFusion</p>
        </div>
      </div>
    </div>
  );
}