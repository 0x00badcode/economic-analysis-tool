'use client';

import { useState } from 'react';
import { GitBranch, Target, Zap, Calculator } from 'lucide-react';

interface DecisionNode {
  id: string;
  name: string;
  type: 'decision' | 'chance' | 'outcome';
  probability?: number;
  cost?: number;
  value?: number;
  children?: DecisionNode[];
}

interface DecisionTreeAnalysisProps {
  onAnalysisComplete: (results: any) => void;
}

export default function DecisionTreeAnalysis({ onAnalysisComplete }: DecisionTreeAnalysisProps) {
  const [decisionTree, setDecisionTree] = useState<DecisionNode>({
    id: 'root',
    name: 'Project Decision',
    type: 'decision',
    children: [
      {
        id: 'option1',
        name: 'Develop In-House',
        type: 'chance',
        children: [
          {
            id: 'success1',
            name: 'Success',
            type: 'outcome',
            probability: 0.7,
            cost: 200000,
            value: 500000
          },
          {
            id: 'failure1',
            name: 'Failure',
            type: 'outcome',
            probability: 0.3,
            cost: 200000,
            value: 100000
          }
        ]
      },
      {
        id: 'option2',
        name: 'Outsource',
        type: 'chance',
        children: [
          {
            id: 'success2',
            name: 'Success',
            type: 'outcome',
            probability: 0.8,
            cost: 150000,
            value: 400000
          },
          {
            id: 'failure2',
            name: 'Failure',
            type: 'outcome',
            probability: 0.2,
            cost: 150000,
            value: 50000
          }
        ]
      }
    ]
  });

  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const updateNode = (nodeId: string, field: keyof DecisionNode, value: any) => {
    const updateNodeRecursive = (node: DecisionNode): DecisionNode => {
      if (node.id === nodeId) {
        return { ...node, [field]: value };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNodeRecursive)
        };
      }
      return node;
    };

    setDecisionTree(updateNodeRecursive(decisionTree));
  };

  const runDecisionTreeAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/decision-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionTree })
      });
      
      const result = await response.json();
      setAnalysisResult(result);
      onAnalysisComplete(result);
    } catch (error) {
      console.error('Decision tree analysis failed:', error);
    }
    setLoading(false);
  };

  const renderNode = (node: DecisionNode, depth: number = 0): React.ReactElement => {
    const getNodeIcon = (type: string) => {
      switch (type) {
        case 'decision': return <GitBranch className="h-4 w-4" />;
        case 'chance': return <Zap className="h-4 w-4" />;
        case 'outcome': return <Target className="h-4 w-4" />;
        default: return null;
      }
    };

    const getNodeColor = (type: string) => {
      switch (type) {
        case 'decision': return 'border-blue-500 bg-blue-50';
        case 'chance': return 'border-yellow-500 bg-yellow-50';
        case 'outcome': return 'border-green-500 bg-green-50';
        default: return 'border-gray-500 bg-gray-50';
      }
    };

    const getNodeBadgeColor = (type: string) => {
      switch (type) {
        case 'decision': return 'bg-blue-100 text-blue-800 border border-blue-200';
        case 'chance': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        case 'outcome': return 'bg-green-100 text-green-800 border border-green-200';
        default: return 'bg-gray-100 text-gray-800 border border-gray-200';
      }
    };

    return (
      <div key={node.id} className={`ml-${depth * 8}`}>
        <div className={`border-2 rounded-lg p-4 mb-4 ${getNodeColor(node.type)}`}>
          <div className="flex items-center mb-2">
            <div className={`p-1 rounded ${getNodeBadgeColor(node.type)}`}>
              {getNodeIcon(node.type)}
            </div>
            <span className="ml-3 font-medium text-gray-900">{node.name}</span>
            <span className={`ml-2 text-xs px-2 py-1 rounded font-medium ${getNodeBadgeColor(node.type)}`}>{node.type}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={node.name}
                onChange={(e) => updateNode(node.id, 'name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>

            {node.type === 'chance' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Probability (0-1)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={node.probability || 0}
                  onChange={(e) => updateNode(node.id, 'probability', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
            )}

            {node.type === 'outcome' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost ($)
                  </label>
                  <input
                    type="number"
                    value={node.cost || 0}
                    onChange={(e) => updateNode(node.id, 'cost', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value ($)
                  </label>
                  <input
                    type="number"
                    value={node.value || 0}
                    onChange={(e) => updateNode(node.id, 'value', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {node.children && node.children.map(child => renderNode(child, depth + 1))}
      </div>
    );
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Decision Tree Analysis</h3>
          <button
            onClick={runDecisionTreeAnalysis}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {loading ? 'Analyzing...' : 'Analyze Decision Tree'}
          </button>
        </div>

        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Decision Tree Structure</h4>
          {renderNode(decisionTree)}
        </div>
      </div>

      {analysisResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-md font-semibold text-green-900 mb-2">Expected Value</h4>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(analysisResult.expectedValue)}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-md font-semibold text-blue-900 mb-2">Best Decision Path</h4>
              <div className="space-y-1">
                {analysisResult.bestPath.map((step: string, index: number) => (
                  <div key={index} className="flex items-center text-blue-800">
                    <span className="text-sm bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                      {index + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">Decision Recommendations</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700">
                Based on the expected value analysis, the optimal decision path yields an expected value of{' '}
                <span className="font-semibold">{formatCurrency(analysisResult.expectedValue)}</span>.
                This analysis considers all probabilities and potential outcomes to guide your decision-making process.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 