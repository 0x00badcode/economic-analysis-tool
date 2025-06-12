'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, Users, Database } from 'lucide-react';

interface ExpertEstimate {
  expertId: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  confidence: number;
}

interface HistoricalProject {
  linesOfCode: number;
  teamSize: number;
  complexity: number;
  actualCost: number;
  actualDuration: number;
}

interface CostEstimationFormProps {
  onEstimationComplete: (results: any) => void;
}

export default function CostEstimationForm({ onEstimationComplete }: CostEstimationFormProps) {
  const [activeTab, setActiveTab] = useState<'delphi' | 'regression'>('delphi');
  const [experts, setExperts] = useState<ExpertEstimate[]>([
    { expertId: 'Expert 1', optimistic: 0, mostLikely: 0, pessimistic: 0, confidence: 0.8 }
  ]);
  const [historicalData, setHistoricalData] = useState<HistoricalProject[]>([
    { linesOfCode: 10000, teamSize: 5, complexity: 3, actualCost: 150000, actualDuration: 6 }
  ]);
  const [newProject, setNewProject] = useState({
    linesOfCode: 15000,
    teamSize: 6,
    complexity: 3
  });
  const [loading, setLoading] = useState(false);

  const addExpert = () => {
    setExperts([...experts, {
      expertId: `Expert ${experts.length + 1}`,
      optimistic: 0,
      mostLikely: 0,
      pessimistic: 0,
      confidence: 0.8
    }]);
  };

  const updateExpert = (index: number, field: keyof ExpertEstimate, value: string | number) => {
    const updated = [...experts];
    updated[index] = { ...updated[index], [field]: value };
    setExperts(updated);
  };

  const addHistoricalProject = () => {
    setHistoricalData([...historicalData, {
      linesOfCode: 10000,
      teamSize: 5,
      complexity: 3,
      actualCost: 150000,
      actualDuration: 6
    }]);
  };

  const updateHistoricalProject = (index: number, field: keyof HistoricalProject, value: number) => {
    const updated = [...historicalData];
    updated[index] = { ...updated[index], [field]: value };
    setHistoricalData(updated);
  };

  const runDelphiEstimation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cost-estimation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'delphi',
          data: { estimates: experts }
        })
      });
      
      const result = await response.json();
      onEstimationComplete({ method: 'delphi', ...result });
    } catch (error) {
      console.error('Delphi estimation failed:', error);
    }
    setLoading(false);
  };

  const runRegressionEstimation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cost-estimation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'regression',
          data: { historicalData, newProject }
        })
      });
      
      const result = await response.json();
      onEstimationComplete({ method: 'regression', ...result });
    } catch (error) {
      console.error('Regression estimation failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Cost Estimation</h3>
      
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6">
        <button
          onClick={() => setActiveTab('delphi')}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'delphi'
              ? 'bg-white text-gray-900 shadow'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="h-4 w-4 mr-2" />
          Delphi Method
        </button>
        <button
          onClick={() => setActiveTab('regression')}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'regression'
              ? 'bg-white text-gray-900 shadow'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Regression Analysis
        </button>
      </div>

      {activeTab === 'delphi' && (
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">Expert Estimates</h4>
          
          {experts.map((expert, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expert Name
                  </label>
                  <input
                    type="text"
                    value={expert.expertId}
                    onChange={(e) => updateExpert(index, 'expertId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Optimistic ($)
                  </label>
                  <input
                    type="number"
                    value={expert.optimistic}
                    onChange={(e) => updateExpert(index, 'optimistic', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Most Likely ($)
                  </label>
                  <input
                    type="number"
                    value={expert.mostLikely}
                    onChange={(e) => updateExpert(index, 'mostLikely', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pessimistic ($)
                  </label>
                  <input
                    type="number"
                    value={expert.pessimistic}
                    onChange={(e) => updateExpert(index, 'pessimistic', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confidence (0-1)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={expert.confidence}
                    onChange={(e) => updateExpert(index, 'confidence', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex space-x-3 mb-4">
            <button
              onClick={addExpert}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add Expert
            </button>
            
            <button
              onClick={runDelphiEstimation}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {loading ? 'Calculating...' : 'Run Delphi Analysis'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'regression' && (
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">Historical Project Data</h4>
          
          {historicalData.map((project, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lines of Code
                  </label>
                  <input
                    type="number"
                    value={project.linesOfCode}
                    onChange={(e) => updateHistoricalProject(index, 'linesOfCode', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Size
                  </label>
                  <input
                    type="number"
                    value={project.teamSize}
                    onChange={(e) => updateHistoricalProject(index, 'teamSize', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complexity (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={project.complexity}
                    onChange={(e) => updateHistoricalProject(index, 'complexity', parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Cost ($)
                  </label>
                  <input
                    type="number"
                    value={project.actualCost}
                    onChange={(e) => updateHistoricalProject(index, 'actualCost', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (months)
                  </label>
                  <input
                    type="number"
                    value={project.actualDuration}
                    onChange={(e) => updateHistoricalProject(index, 'actualDuration', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            onClick={addHistoricalProject}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mb-4"
          >
            Add Historical Project
          </button>
          
          <h4 className="text-md font-medium text-gray-800 mb-3 mt-6">New Project Parameters</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lines of Code
              </label>
              <input
                type="number"
                value={newProject.linesOfCode}
                onChange={(e) => setNewProject({...newProject, linesOfCode: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Size
              </label>
              <input
                type="number"
                value={newProject.teamSize}
                onChange={(e) => setNewProject({...newProject, teamSize: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complexity (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={newProject.complexity}
                onChange={(e) => setNewProject({...newProject, complexity: parseFloat(e.target.value) || 1})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          
          <button
            onClick={runRegressionEstimation}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Database className="h-4 w-4 mr-2" />
            {loading ? 'Calculating...' : 'Run Regression Analysis'}
          </button>
        </div>
      )}
    </div>
  );
} 