'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, Users, Database, AlertCircle, CheckCircle, X, DollarSign, Clock, BarChart3, Target } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const removeExpert = (index: number) => {
    if (experts.length > 1) {
      setExperts(experts.filter((_, i) => i !== index));
    }
  };

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
    setError(null);
    setResults(null);
    
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
      
      if (!response.ok) {
        setError(result.error || 'An error occurred during estimation');
        return;
      }
      
      setResults(result);
      onEstimationComplete({ method: 'delphi', ...result });
    } catch (error) {
      console.error('Delphi estimation failed:', error);
      setError('Network error occurred during estimation');
    }
    setLoading(false);
  };

  const runRegressionEstimation = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    
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
      
      if (!response.ok) {
        setError(result.error || 'An error occurred during estimation');
        return;
      }
      
      setResults(result);
      onEstimationComplete({ method: 'regression', ...result });
    } catch (error) {
      console.error('Regression estimation failed:', error);
      setError('Network error occurred during estimation');
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
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-medium text-gray-800">{expert.expertId}</h5>
                {experts.length > 1 && (
                  <button
                    onClick={() => removeExpert(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
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

          {/* Error Display Card */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">Estimation Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Results Display for Delphi */}
          {results && results.method === 'delphi' && (
            <div className="space-y-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <h4 className="text-lg font-semibold text-green-800">Delphi Analysis Complete</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Final Estimate Card */}
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-600">Final Estimate</h5>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${results.result.finalEstimate.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Confidence-weighted average</p>
                  </div>

                  {/* PERT Average Card */}
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-600">PERT Average</h5>
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${results.result.pertAverage.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Mathematical PERT calculation</p>
                  </div>

                  {/* Consensus Score Card */}
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-600">Consensus</h5>
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {(results.result.consensus * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Expert agreement level</p>
                  </div>
                </div>

                {/* Expert Analysis */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Expert Analysis</h5>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {results.result.expertAnalysis.map((expert: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm text-gray-900">{expert.expertId}</span>
                          <span className="text-xs text-gray-600">
                            Confidence: {(expert.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">PERT Estimate:</span>
                            <span className="font-medium ml-1">${expert.pertEstimate.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Range:</span>
                            <span className="font-medium ml-1">${expert.range.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Methodology Info */}
                <div className="mt-4 bg-blue-50 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-blue-800 mb-2">Methodology</h5>
                  <p className="text-xs text-blue-700 mb-1">{results.result.methodology.description}</p>
                  <p className="text-xs text-blue-600">Formula: {results.result.methodology.formula}</p>
                </div>
              </div>
            </div>
          )}
          
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

          {/* Error Display Card for Regression */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">Estimation Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Results Display for Regression */}
          {results && results.method === 'regression' && (
            <div className="space-y-4 mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <h4 className="text-lg font-semibold text-green-800">Regression Analysis Complete</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Estimated Cost Card */}
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-600">Estimated Cost</h5>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${results.result.estimatedCost.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Predicted project cost</p>
                  </div>

                  {/* Estimated Duration Card */}
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-600">Estimated Duration</h5>
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {results.result.estimatedDuration.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Months</p>
                  </div>

                  {/* R-Squared Card */}
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-600">R-Squared</h5>
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {(results.result.rSquared * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Model accuracy</p>
                  </div>

                  {/* Confidence Card */}
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-600">Confidence</h5>
                      <Target className="h-4 w-4 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {(results.result.confidence * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Prediction confidence</p>
                  </div>
                </div>

                {/* Cost Prediction Interval */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Cost Prediction Interval (95% Confidence)</h5>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Lower Bound</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${Math.max(0, results.result.costPredictionInterval.lower).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Estimate</p>
                        <p className="text-lg font-semibold text-green-700">
                          ${results.result.estimatedCost.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Upper Bound</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${results.result.costPredictionInterval.upper.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Historical Statistics */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Historical Statistics</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600">Projects</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {results.result.historicalStatistics.projectCount}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600">Mean Cost</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${results.result.historicalStatistics.meanCost.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600">Mean Duration</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {results.result.historicalStatistics.meanDuration.toFixed(1)}m
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600">Cost Range</p>
                      <p className="text-sm font-semibold text-gray-900">
                        ${results.result.historicalStatistics.costRange.min.toLocaleString()} - 
                        ${results.result.historicalStatistics.costRange.max.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Methodology Info */}
                <div className="mt-4 bg-blue-50 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-blue-800 mb-2">Methodology</h5>
                  <p className="text-xs text-blue-700 mb-1">{results.result.methodology.description}</p>
                  <p className="text-xs text-blue-600">
                    Factors: {results.result.methodology.factors.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 