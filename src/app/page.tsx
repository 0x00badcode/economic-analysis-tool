'use client';

import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import ProjectForm from '@/components/ProjectForm';
import ProjectList from '@/components/ProjectList';
import CostEstimationForm from '@/components/CostEstimationForm';
import DecisionTreeAnalysis from '@/components/DecisionTreeAnalysis';
import ResourceAllocation from '@/components/ResourceAllocation';
import { 
  Calculator, 
  GitBranch, 
  Users, 
  BarChart3, 
  Home, 
  FolderPlus,
  Database 
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'create' | 'cost-estimation' | 'decision-tree' | 'resource-allocation'>('dashboard');
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const handleEstimationComplete = (results: any) => {
    console.log('Cost Estimation Results:', results);
  };

  const handleAnalysisComplete = (results: any) => {
    console.log('Decision Tree Analysis Results:', results);
  };

  const handleOptimizationComplete = (results: any) => {
    console.log('Resource Optimization Results:', results);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard selectedProject={selectedProject} />;
             case 'projects':
         return <ProjectList onSelectProject={setSelectedProject} selectedProject={selectedProject} />;
       case 'create':
         return <ProjectForm onProjectCreated={() => setActiveTab('projects')} />;
      case 'cost-estimation':
        return <CostEstimationForm onEstimationComplete={handleEstimationComplete} />;
      case 'decision-tree':
        return <DecisionTreeAnalysis onAnalysisComplete={handleAnalysisComplete} />;
      case 'resource-allocation':
        return <ResourceAllocation onOptimizationComplete={handleOptimizationComplete} />;
      default:
        return <Dashboard selectedProject={selectedProject} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Economic Analysis Tool</h1>
                <p className="text-sm text-gray-600">Software Project Decision-Making Platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Home className="h-4 w-4 mr-3" />
                  Dashboard
                </button>

                <button
                  onClick={() => setActiveTab('projects')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'projects'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Database className="h-4 w-4 mr-3" />
                  Projects
                </button>

                <button
                  onClick={() => setActiveTab('create')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'create'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <FolderPlus className="h-4 w-4 mr-3" />
                  Create Project
                </button>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Analysis Tools
                  </p>
                  
                  <button
                    onClick={() => setActiveTab('cost-estimation')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'cost-estimation'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Calculator className="h-4 w-4 mr-3" />
                    Cost Estimation
                  </button>

                  <button
                    onClick={() => setActiveTab('decision-tree')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'decision-tree'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <GitBranch className="h-4 w-4 mr-3" />
                    Decision Trees
                  </button>

                  <button
                    onClick={() => setActiveTab('resource-allocation')}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'resource-allocation'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Users className="h-4 w-4 mr-3" />
                    Resource Allocation
                  </button>
                </div>
              </div>
            </nav>

            {/* Feature Summary */}
            <div className="mt-6 bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Available Features</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  COCOMO & Function Points
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  Delphi Method & Regression
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  ROI, NPV, IRR, Payback
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  Monte Carlo Simulation
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  Sensitivity Analysis
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  Decision Tree Analysis
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  Resource Optimization
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  Scenario Planning
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
