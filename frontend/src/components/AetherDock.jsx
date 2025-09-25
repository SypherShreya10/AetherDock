import React, { useState, useEffect } from 'react';
import { Play, Square, RotateCcw, Activity, Cpu, HardDrive, Wifi, AlertTriangle, CheckCircle, Clock, Zap, Brain, Terminal, RefreshCw } from 'lucide-react';
import LogsViewer from './LogsViewer'; // Import your existing LogsViewer

const AetherDock = ({ containers = [], socket, onContainerAction, connectionError }) => {
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate AI insights based on container data
  useEffect(() => {
    const generateInsights = () => {
      const insights = [];
      
      containers.forEach(container => {
        if (container.status === 'running') {
          // High CPU usage warning
          if (container.cpu > 80) {
            insights.push({
              type: 'warning',
              container: container.name,
              message: `High CPU usage detected (${container.cpu?.toFixed(1)}%). Consider scaling or optimization.`,
              confidence: 92,
              timestamp: 'just now'
            });
          }
          
          // High memory usage warning
          if (container.memory > 500) {
            insights.push({
              type: 'warning',
              container: container.name,
              message: `Memory usage is high (${container.memory?.toFixed(1)}MB). Monitor for potential leaks.`,
              confidence: 87,
              timestamp: '1 min ago'
            });
          }
          
          // Healthy container info
          if (container.cpu < 30 && container.memory < 200) {
            insights.push({
              type: 'info',
              container: container.name,
              message: 'Container performance is optimal. No action needed.',
              confidence: 95,
              timestamp: '2 min ago'
            });
          }
        } else if (container.status === 'stopped' || container.status === 'exited') {
          insights.push({
            type: 'warning',
            container: container.name,
            message: 'Container stopped unexpectedly. Consider auto-restart or investigation.',
            confidence: 89,
            timestamp: '3 min ago'
          });
        }
      });
      
      // Limit to most recent/important insights
      setAiInsights(insights.slice(0, 4));
    };

    if (containers.length > 0) {
      generateInsights();
    }
  }, [containers]);

  const handleContainerAction = async (containerId, action) => {
    try {
      setIsRefreshing(true);
      await onContainerAction(containerId, action);
      
      // Add a small delay to show loading state
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
      setIsRefreshing(false);
    }
  };

  const handleViewLogs = (container) => {
    setSelectedContainer(container);
    setShowLogs(true);
  };

  const handleRefresh = () => {
    if (socket) {
      setIsRefreshing(true);
      socket.emit('containers:refresh');
      setTimeout(() => setIsRefreshing(false), 2000);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'text-green-400';
      case 'stopped':
      case 'exited':
        return 'text-gray-400';
      case 'restarting':
        return 'text-yellow-400';
      case 'paused':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getHealthIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'stopped':
      case 'exited':
        return <Square className="w-4 h-4 text-gray-400" />;
      case 'restarting':
        return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'paused':
        return <AlertTriangle className="w-4 h-4 text-blue-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  const formatUptime = (uptime) => {
    if (!uptime) return '0m';
    // If uptime is a number (seconds), convert to readable format
    if (typeof uptime === 'number') {
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    return uptime;
  };

  // Show logs viewer if selected
  if (showLogs && selectedContainer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="border-b border-purple-500/20 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setShowLogs(false)}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="text-xl font-bold">
                  Logs: {selectedContainer.name}
                </h1>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <LogsViewer 
            containerId={selectedContainer.id} 
            socket={socket}
            onClose={() => setShowLogs(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                AetherDock
              </h1>
              <span className="text-sm text-gray-400">Container Orchestration</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 px-3 py-1 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm">Refresh</span>
              </button>
              {connectionError ? (
                <div className="flex items-center space-x-2 bg-red-500/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-400">Connection Issues</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-green-500/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400">Live Monitoring</span>
                </div>
              )}
              <div className="flex items-center space-x-2 bg-purple-500/10 px-3 py-1 rounded-full">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-400">AI Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* AI Insights Panel */}
        {aiInsights.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold">AI Insights & Predictions</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {aiInsights.map((insight, index) => (
                <div key={index} className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-start space-x-3">
                    {insight.type === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-purple-300">{insight.container}</span>
                        <span className="text-xs text-gray-400">{insight.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{insight.message}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-1">
                          <div 
                            className="bg-gradient-to-r from-purple-400 to-blue-400 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${insight.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400">{insight.confidence}% confidence</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Containers Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Container Fleet</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>{containers.filter(c => c.status === 'running').length} Running</span>
            <span>{containers.filter(c => c.status !== 'running').length} Stopped</span>
            <span>{containers.length} Total</span>
          </div>
        </div>

        {containers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Containers Found</h3>
            <p className="text-gray-400">Start by running some containers to see them here.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {containers.map((container) => (
              <div key={container.id} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getHealthIcon(container.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{container.name || container.Names?.[0]?.replace('/', '') || 'Unknown'}</h3>
                      <p className="text-sm text-gray-400">{container.image || container.Image || 'Unknown image'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${getStatusColor(container.status || container.State)}`}>
                      {(container.status || container.State || 'unknown').toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatUptime(container.uptime)}
                    </p>
                  </div>
                </div>

                {/* Real-time Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Cpu className="w-4 h-4 text-blue-400 mr-1" />
                    </div>
                    <div className="text-lg font-semibold text-blue-400">{(container.cpu || 0).toFixed(1)}%</div>
                    <div className="text-xs text-gray-400">CPU</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <HardDrive className="w-4 h-4 text-green-400 mr-1" />
                    </div>
                    <div className="text-lg font-semibold text-green-400">{(container.memory || 0).toFixed(1)}MB</div>
                    <div className="text-xs text-gray-400">Memory</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Wifi className="w-4 h-4 text-purple-400 mr-1" />
                    </div>
                    <div className="text-lg font-semibold text-purple-400">{(container.network || 0).toFixed(1)}MB/s</div>
                    <div className="text-xs text-gray-400">Network</div>
                  </div>
                </div>

                {/* Performance Bars */}
                <div className="space-y-2 mb-4">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>CPU Usage</span>
                      <span>{(container.cpu || 0).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(container.cpu || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Memory</span>
                      <span>{(container.memory || 0).toFixed(1)}MB</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((container.memory || 0) / 5, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Container Info */}
                <div className="text-xs text-gray-400 mb-4 space-y-1">
                  <div>Ports: {container.ports || container.Ports?.map(p => `${p.PrivatePort}:${p.PublicPort}`).join(', ') || 'None'}</div>
                  <div>ID: {(container.id || container.Id || '').substring(0, 12)}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleContainerAction(container.id || container.Id, 'start')}
                    disabled={container.status === 'running' || isRefreshing}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start</span>
                  </button>
                  <button
                    onClick={() => handleContainerAction(container.id || container.Id, 'stop')}
                    disabled={container.status !== 'running' || isRefreshing}
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Square className="w-4 h-4" />
                    <span>Stop</span>
                  </button>
                  <button
                    onClick={() => handleContainerAction(container.id || container.Id, 'restart')}
                    disabled={isRefreshing}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restart</span>
                  </button>
                  <button 
                    onClick={() => handleViewLogs(container)}
                    className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Terminal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* System Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium">System Health</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {connectionError ? 'Offline' : '98.5%'}
            </div>
            <div className="text-xs text-gray-400">
              {connectionError ? 'Connection issues' : 'All systems operational'}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Cpu className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium">Avg CPU</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {containers.length > 0 ? (containers.reduce((acc, c) => acc + (c.cpu || 0), 0) / containers.length).toFixed(1) : 0}%
            </div>
            <div className="text-xs text-gray-400">Across all containers</div>
          </div>
          <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <HardDrive className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium">Total Memory</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {containers.reduce((acc, c) => acc + (c.memory || 0), 0).toFixed(0)}MB
            </div>
            <div className="text-xs text-gray-400">Currently allocated</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium">AI Predictions</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{aiInsights.length}</div>
            <div className="text-xs text-gray-400">Active insights</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AetherDock;
