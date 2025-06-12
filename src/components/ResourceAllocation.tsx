'use client';

import { useState } from 'react';
import { Users, Clock, Settings, BarChart3, TrendingUp } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  duration: number;
  requiredResources: { resourceId: string; amount: number }[];
  prerequisites: string[];
  priority: number;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  maxCapacity: number;
  hourlyRate: number;
  availability: number[];
}

interface ResourceAllocationProps {
  onOptimizationComplete: (results: any) => void;
}

export default function ResourceAllocation({ onOptimizationComplete }: ResourceAllocationProps) {
  const [activeTab, setActiveTab] = useState<'setup' | 'optimize' | 'scenario'>('setup');
  
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task1',
      name: 'Requirements Analysis',
      duration: 3,
      requiredResources: [{ resourceId: 'dev1', amount: 2 }],
      prerequisites: [],
      priority: 1
    },
    {
      id: 'task2',
      name: 'System Design',
      duration: 4,
      requiredResources: [{ resourceId: 'dev1', amount: 3 }],
      prerequisites: ['task1'],
      priority: 2
    }
  ]);

  const [resources, setResources] = useState<Resource[]>([
    {
      id: 'dev1',
      name: 'Development Team',
      type: 'Developer',
      maxCapacity: 5,
      hourlyRate: 75,
      availability: [1, 1, 1, 1, 1, 0.5, 0.5] // Weekly availability
    },
    {
      id: 'qa1',
      name: 'QA Team',
      type: 'QA',
      maxCapacity: 3,
      hourlyRate: 60,
      availability: [1, 1, 1, 1, 1, 0, 0]
    }
  ]);

  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [scenarioResults, setScenarioResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addTask = () => {
    const newTask: Task = {
      id: `task${tasks.length + 1}`,
      name: `New Task ${tasks.length + 1}`,
      duration: 2,
      requiredResources: [{ resourceId: resources[0]?.id || '', amount: 1 }],
      prerequisites: [],
      priority: tasks.length + 1
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (index: number, field: keyof Task, value: any) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const addResource = () => {
    const newResource: Resource = {
      id: `resource${resources.length + 1}`,
      name: `New Resource ${resources.length + 1}`,
      type: 'General',
      maxCapacity: 1,
      hourlyRate: 50,
      availability: [1, 1, 1, 1, 1, 0, 0]
    };
    setResources([...resources, newResource]);
  };

  const updateResource = (index: number, field: keyof Resource, value: any) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], [field]: value };
    setResources(updated);
  };

  const runOptimization = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/resource-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'optimize',
          data: { tasks, resources, projectDeadline: 20 }
        })
      });
      
      const result = await response.json();
      setOptimizationResult(result);
      onOptimizationComplete(result);
    } catch (error) {
      console.error('Resource optimization failed:', error);
    }
    setLoading(false);
  };

  const runScenarioAnalysis = async () => {
    setLoading(true);
    try {
      const scenarios = [
        { resourceMultiplier: 0.8, timeConstraint: 15 },
        { resourceMultiplier: 1.0, timeConstraint: 20 },
        { resourceMultiplier: 1.2, timeConstraint: 25 }
      ];

      const response = await fetch('/api/resource-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'scenario',
          data: { baseTasks: tasks, baseResources: resources, scenarios }
        })
      });
      
      const results = await response.json();
      setScenarioResults(results);
    } catch (error) {
      console.error('Scenario analysis failed:', error);
    }
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Allocation & Optimization</h3>
        
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6">
          <button
            onClick={() => setActiveTab('setup')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'setup' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="h-4 w-4 mr-2" />
            Setup
          </button>
          <button
            onClick={() => setActiveTab('optimize')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'optimize' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Optimize
          </button>
          <button
            onClick={() => setActiveTab('scenario')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'scenario' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Scenarios
          </button>
        </div>

        {activeTab === 'setup' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-800">Tasks</h4>
                <button
                  onClick={addTask}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Add Task
                </button>
              </div>
              
              {tasks.map((task, index) => (
                <div key={task.id} className="border rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => updateTask(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (weeks)</label>
                      <input
                        type="number"
                        value={task.duration}
                        onChange={(e) => updateTask(index, 'duration', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                      <select
                        value={task.requiredResources[0]?.resourceId || ''}
                        onChange={(e) => updateTask(index, 'requiredResources', [{ resourceId: e.target.value, amount: task.requiredResources[0]?.amount || 1 }])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      >
                        {resources.map(resource => (
                          <option key={resource.id} value={resource.id}>{resource.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                      <input
                        type="number"
                        value={task.requiredResources[0]?.amount || 0}
                        onChange={(e) => updateTask(index, 'requiredResources', [{ resourceId: task.requiredResources[0]?.resourceId || '', amount: parseInt(e.target.value) || 0 }])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-800">Resources</h4>
                <button
                  onClick={addResource}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Add Resource
                </button>
              </div>
              
              {resources.map((resource, index) => (
                <div key={resource.id} className="border rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={resource.name}
                        onChange={(e) => updateResource(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <input
                        type="text"
                        value={resource.type}
                        onChange={(e) => updateResource(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
                      <input
                        type="number"
                        value={resource.maxCapacity}
                        onChange={(e) => updateResource(index, 'maxCapacity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                      <input
                        type="number"
                        value={resource.hourlyRate}
                        onChange={(e) => updateResource(index, 'hourlyRate', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'optimize' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-800">Resource Optimization</h4>
              <button
                onClick={runOptimization}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {loading ? 'Optimizing...' : 'Run Optimization'}
              </button>
            </div>

            {optimizationResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-blue-900 mb-1">Total Cost</h5>
                    <p className="text-xl font-bold text-blue-800">
                      {formatCurrency(optimizationResult.totalCost)}
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-green-900 mb-1">Project Duration</h5>
                    <p className="text-xl font-bold text-green-800">
                      {optimizationResult.projectDuration} weeks
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-yellow-900 mb-1">Conflicts</h5>
                    <p className="text-xl font-bold text-yellow-800">
                      {optimizationResult.conflicts?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4">
                  <h5 className="text-md font-medium text-gray-800 mb-3">Schedule</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Task</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Start Week</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">End Week</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Resources</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optimizationResult.schedule?.map((item: any, index: number) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {tasks.find(t => t.id === item.taskId)?.name || item.taskId}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.startPeriod}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.endPeriod}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {Object.entries(item.assignedResources).map(([resourceId, amount]) => (
                                <span key={resourceId} className="mr-2">
                                  {resources.find(r => r.id === resourceId)?.name}: {amount as number}
                                </span>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scenario' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-800">Scenario Analysis</h4>
              <button
                onClick={runScenarioAnalysis}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {loading ? 'Analyzing...' : 'Run Scenario Analysis'}
              </button>
            </div>

            {scenarioResults.length > 0 && (
              <div className="space-y-4">
                <h5 className="text-md font-medium text-gray-800">Scenario Comparison</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Scenario</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Resource Factor</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Time Constraint</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Total Cost</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Duration</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenarioResults.map((scenario: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2 text-sm text-gray-900">Scenario {index + 1}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{scenario.scenario.resourceMultiplier}x</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{scenario.scenario.timeConstraint} weeks</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(scenario.result.totalCost)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{scenario.result.projectDuration} weeks</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{scenario.metrics.efficiency.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 