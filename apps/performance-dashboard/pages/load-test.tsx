import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Activity, DollarSign, TrendingUp, AlertTriangle, Server, Cpu, Users, Zap } from 'lucide-react';

export default function LoadTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [config, setConfig] = useState({
    url: 'http://localhost:3000',
    connections: 10,
    duration: 30,
    method: 'GET'
  });

  const runLoadTest = async () => {
    setIsRunning(true);
    setResults(null);

    // Simulate load test
    setTimeout(() => {
      const mockResults = {
        latency: {
          average: 150 + Math.random() * 100,
          p50: 120 + Math.random() * 80,
          p75: 180 + Math.random() * 100,
          p90: 250 + Math.random() * 150,
          p95: 300 + Math.random() * 200,
          p99: 500 + Math.random() * 300,
          max: 800 + Math.random() * 400,
          min: 50 + Math.random() * 30
        },
        throughput: {
          total: config.connections * config.duration * (8 + Math.random() * 4),
          average: config.connections * (8 + Math.random() * 4),
          min: config.connections * (6 + Math.random() * 2),
          max: config.connections * (10 + Math.random() * 2)
        },
        requests: {
          total: config.connections * config.duration * 10,
          sent: config.connections * config.duration * 10,
          completed: config.connections * config.duration * (9.8 + Math.random() * 0.2),
          errors: Math.floor(config.connections * config.duration * Math.random() * 0.2)
        },
        duration: config.duration,
        errorRate: Math.random() * 2,
        connections: config.connections
      };

      setResults(mockResults);
      setIsRunning(false);
    }, config.duration * 100); // Simulate based on duration
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Load Testing - Performance Dashboard</title>
      </Head>

      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Load Testing</h1>
          <p className="mt-2 text-gray-600">Test your application's performance under load</p>
        </div>

        {/* Configuration Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
              <input
                type="url"
                value={config.url}
                onChange={(e) => setConfig({...config, url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="http://localhost:3000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Connections</label>
              <input
                type="number"
                value={config.connections}
                onChange={(e) => setConfig({...config, connections: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
                max="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (seconds)</label>
              <input
                type="number"
                value={config.duration}
                onChange={(e) => setConfig({...config, duration: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
                max="3600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
              <select
                value={config.method}
                onChange={(e) => setConfig({...config, method: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={runLoadTest}
              disabled={isRunning}
              className={`px-6 py-2 rounded-md font-medium ${
                isRunning 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary-600 hover:bg-primary-700'
              } text-white transition-colors`}
            >
              {isRunning ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running Test...
                </>
              ) : (
                <>
                  <Zap className="inline h-4 w-4 mr-2" />
                  Run Load Test
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <Activity className="h-6 w-6 text-primary-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
                    <p className="text-2xl font-semibold text-gray-900">{Math.round(results.latency.average)}ms</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Throughput</p>
                    <p className="text-2xl font-semibold text-gray-900">{Math.round(results.throughput.average)} req/s</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Error Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{results.errorRate.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Requests</p>
                    <p className="text-2xl font-semibold text-gray-900">{Math.round(results.requests.completed)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Latency Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average:</span>
                    <span className="font-medium">{Math.round(results.latency.average)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">50th percentile:</span>
                    <span className="font-medium">{Math.round(results.latency.p50)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">75th percentile:</span>
                    <span className="font-medium">{Math.round(results.latency.p75)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">90th percentile:</span>
                    <span className="font-medium">{Math.round(results.latency.p90)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">95th percentile:</span>
                    <span className="font-medium">{Math.round(results.latency.p95)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">99th percentile:</span>
                    <span className="font-medium">{Math.round(results.latency.p99)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maximum:</span>
                    <span className="font-medium">{Math.round(results.latency.max)}ms</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Request Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Sent:</span>
                    <span className="font-medium">{Math.round(results.requests.sent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium">{Math.round(results.requests.completed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Errors:</span>
                    <span className="font-medium">{Math.round(results.requests.errors)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium">{((results.requests.completed / results.requests.sent) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{results.duration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Connections:</span>
                    <span className="font-medium">{results.connections}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Assessment */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Performance Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${results.latency.average < 200 ? 'bg-green-50 border border-green-200' : results.latency.average < 500 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
                  <h4 className="font-medium">Response Time</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {results.latency.average < 200 ? 'Excellent' : results.latency.average < 500 ? 'Good' : 'Needs Improvement'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${results.errorRate < 1 ? 'bg-green-50 border border-green-200' : results.errorRate < 5 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
                  <h4 className="font-medium">Error Rate</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {results.errorRate < 1 ? 'Excellent' : results.errorRate < 5 ? 'Acceptable' : 'High Error Rate'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${results.throughput.average > 100 ? 'bg-green-50 border border-green-200' : results.throughput.average > 50 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
                  <h4 className="font-medium">Throughput</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {results.throughput.average > 100 ? 'High' : results.throughput.average > 50 ? 'Medium' : 'Low'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}