'use client';

import { useState } from 'react';
import { GitBranch, Target, Zap, Calculator, Brain, TrendingUp } from 'lucide-react';
import { AITool, hasApiKey } from '@/lib/ai-tool';

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
            name: 'In-House Success',
            type: 'outcome',
            probability: 0.7,
            cost: 200000,
            value: 500000
          },
          {
            id: 'failure1',
            name: 'In-House Failure',
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
            name: 'Outsource Success',
            type: 'outcome',
            probability: 0.8,
            cost: 150000,
            value: 400000
          },
          {
            id: 'failure2',
            name: 'Outsource Failure',
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
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    best_solution: string;
    justification_key_points: string;
    justification_long: string;
  } | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'synthetic' | 'interactive'>('synthetic');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateDecisionTree = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate root decision
    if (!decisionTree.name.trim()) {
      errors['root'] = 'Decision name is required';
    }

    // Validate each option
    decisionTree.children?.forEach((option, optionIndex) => {
      if (!option.name.trim()) {
        errors[`option_${option.id}`] = 'Option name is required';
      }

      let totalProbability = 0;
      option.children?.forEach((outcome, outcomeIndex) => {
        const outcomeKey = `outcome_${outcome.id}`;
        
        // Validate outcome name
        if (!outcome.name.trim()) {
          errors[`${outcomeKey}_name`] = 'Outcome name is required';
        }

        // Validate probability
        if (outcome.probability === undefined || outcome.probability === null) {
          errors[`${outcomeKey}_probability`] = 'Probability is required';
        } else if (outcome.probability < 0 || outcome.probability > 1) {
          errors[`${outcomeKey}_probability`] = 'Probability must be between 0 and 1';
        }

        // Validate cost
        if (outcome.cost === undefined || outcome.cost === null || outcome.cost < 0) {
          errors[`${outcomeKey}_cost`] = 'Cost must be 0 or greater';
        }

        // Validate value
        if (outcome.value === undefined || outcome.value === null || outcome.value < 0) {
          errors[`${outcomeKey}_value`] = 'Value must be 0 or greater';
        }

        totalProbability += outcome.probability || 0;
      });

      // Validate total probability for each option
      if (Math.abs(totalProbability - 1) > 0.01) {
        errors[`option_${option.id}_probability_sum`] = `Total probability must equal 1.0 (currently ${totalProbability.toFixed(2)})`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormComplete = (): boolean => {
    // Check if main decision name is filled
    if (!decisionTree.name.trim()) return false;

    // Check if all options and outcomes are properly filled
    return decisionTree.children?.every(option => {
      // Check option name
      if (!option.name.trim()) return false;

      // Check if option has outcomes
      if (!option.children || option.children.length === 0) return false;

      // Check all outcomes in this option
      return option.children.every(outcome => {
        return (
          outcome.name.trim() !== '' &&
          outcome.probability !== undefined &&
          outcome.probability !== null &&
          outcome.probability >= 0 &&
          outcome.probability <= 1 &&
          outcome.cost !== undefined &&
          outcome.cost !== null &&
          outcome.cost >= 0 &&
          outcome.value !== undefined &&
          outcome.value !== null &&
          outcome.value >= 0
        );
      });
    }) || false;
  };

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
    // Clear validation errors when data changes
    setValidationErrors({});
  };

  // New function to handle probability updates with automatic balancing
  const updateProbability = (nodeId: string, newProbability: number, parentNodeId: string) => {
    const updateNodeRecursive = (node: DecisionNode): DecisionNode => {
      if (node.id === parentNodeId && node.children) {
        // Find the current node and its sibling
        const updatedChildren = node.children.map((child, index) => {
          if (child.id === nodeId) {
            return { ...child, probability: newProbability };
          } else {
            // This is the sibling - adjust its probability
            return { ...child, probability: 1 - newProbability };
          }
        });
        return { ...node, children: updatedChildren };
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
    // Clear validation errors when data changes
    setValidationErrors({});
  };

  const runDecisionTreeAnalysis = async () => {
    // Validate before running analysis
    if (!validateDecisionTree()) {
      return; // Don't proceed if validation fails
    }

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

      // Automatically run AI analysis with synthetic results
      await runAIAnalysisWithSyntheticData(result);
    } catch (error) {
      console.error('Decision tree analysis failed:', error);
    }
    setLoading(false);
  };

  const runAIAnalysisWithSyntheticData = async (syntheticResult: any) => {
    if (!hasApiKey()) {
      setAiAnalysisResult({
        best_solution: 'API Key Required',
        justification_key_points: 'AI analysis requires a Gemini API key.',
        justification_long: 'Please configure your Gemini API key in the settings (gear icon) to use AI analysis.',
      });
      return;
    }

    setAiLoading(true);
    try {
      // Prepare enhanced data for AI analysis using synthetic results
      const analysisData = {
        decision: decisionTree.name,
        syntheticAnalysisResults: {
          bestOption: syntheticResult.riskAnalysis?.bestOption || syntheticResult.bestPath[1],
          expectedValue: syntheticResult.expectedValue,
          optimalPath: syntheticResult.bestPath,
          riskLevel: syntheticResult.expectedValue > 200000 ? 'Low' : syntheticResult.expectedValue > 100000 ? 'Medium' : 'High'
        },
        options: decisionTree.children?.map(option => {
          const expectedValue = option.children?.reduce((sum, child) => 
            sum + (child.probability || 0) * ((child.value || 0) - (child.cost || 0)), 0) || 0;
          
          const successRate = option.children?.reduce((sum, child) => 
            sum + (child.name.toLowerCase().includes('success') ? (child.probability || 0) : 0), 0) || 0;
          
          const totalCost = option.children?.reduce((sum, child) => sum + (child.cost || 0), 0) || 0;
          const totalValue = option.children?.reduce((sum, child) => sum + (child.value || 0), 0) || 0;
          const roi = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

          return {
            name: option.name,
            expectedValue,
            successRate: successRate * 100,
            roi,
            riskLevel: expectedValue > 200000 ? 'Low' : expectedValue > 100000 ? 'Medium' : 'High',
            isRecommended: (syntheticResult.riskAnalysis?.bestOption || syntheticResult.bestPath[1])?.includes(option.name),
            outcomes: option.children?.map(outcome => ({
              name: outcome.name,
              probability: (outcome.probability || 0) * 100,
              cost: outcome.cost || 0,
              value: outcome.value || 0,
              netValue: (outcome.value || 0) - (outcome.cost || 0)
            })) || []
          };
        }) || []
      };

      const aiTool = new AITool();
      const result = await aiTool.generateDecisionAnalysis(analysisData);
      setAiAnalysisResult(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAiAnalysisResult({
        best_solution: 'Analysis Failed',
        justification_key_points: 'AI analysis encountered an error.',
        justification_long: 'The AI analysis could not be completed. Please check your API key configuration and try again.',
      });
    }
    setAiLoading(false);
  };

  const renderDecisionOption = (option: DecisionNode) => {
    const calculateExpectedValue = (node: DecisionNode): number => {
      if (!node.children) return 0;
      return node.children.reduce((sum, child) => 
        sum + (child.probability || 0) * ((child.value || 0) - (child.cost || 0)), 0);
    };

    const expectedValue = calculateExpectedValue(option);

    return (
      <div key={option.id} className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
        {/* Option Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GitBranch className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h4 className="text-xl font-bold text-gray-900">{option.name}</h4>
              <span className="text-sm text-blue-600 font-medium">Decision Option</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-700 font-medium">Expected Value</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(expectedValue)}</div>
          </div>
        </div>

        {/* Edit Option Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Option Name
          </label>
          <input
            type="text"
            value={option.name}
            onChange={(e) => updateNode(option.id, 'name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 ${
              validationErrors[`option_${option.id}`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter option name"
            required
          />
          {validationErrors[`option_${option.id}`] && (
            <p className="text-red-600 text-sm mt-1">{validationErrors[`option_${option.id}`]}</p>
          )}
        </div>

        {/* Outcomes */}
        <div className="space-y-4">
          <h5 className="text-lg font-semibold text-gray-800 mb-3">Possible Outcomes</h5>
          
          {/* Probability Sum Validation */}
          {validationErrors[`option_${option.id}_probability_sum`] && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm font-medium">
                {validationErrors[`option_${option.id}_probability_sum`]}
              </p>
            </div>
          )}
          
          {option.children && option.children.map(outcome => (
            <div key={outcome.id} className={`border-2 rounded-lg p-4 ${
              outcome.name.toLowerCase().includes('success') 
                ? 'border-green-300 bg-green-50' 
                : 'border-red-300 bg-red-50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Target className={`h-5 w-5 mr-2 ${
                    outcome.name.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span className="font-semibold text-gray-900">{outcome.name}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  outcome.name.toLowerCase().includes('success') 
                    ? 'bg-green-200 text-green-800' 
                    : 'bg-red-200 text-red-800'
                }`}>
                  {((outcome.probability || 0) * 100).toFixed(0)}% chance
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-800 mb-1">
                    Outcome Name
                  </label>
                  <input
                    type="text"
                    value={outcome.name}
                    onChange={(e) => updateNode(outcome.id, 'name', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-600 ${
                      validationErrors[`outcome_${outcome.id}_name`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter outcome name"
                    required
                  />
                  {validationErrors[`outcome_${outcome.id}_name`] && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors[`outcome_${outcome.id}_name`]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-800 mb-1">
                    Probability (0-1)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={outcome.probability || 0}
                    onChange={(e) => updateProbability(outcome.id, parseFloat(e.target.value) || 0, option.id)}
                    className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-600 ${
                      validationErrors[`outcome_${outcome.id}_probability`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0.0 - 1.0"
                    required
                  />
                  {validationErrors[`outcome_${outcome.id}_probability`] && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors[`outcome_${outcome.id}_probability`]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-800 mb-1">
                    Net Value
                  </label>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency((outcome.value || 0) - (outcome.cost || 0))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-800 mb-1">
                    Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={outcome.cost || 0}
                    onChange={(e) => updateNode(outcome.id, 'cost', parseFloat(e.target.value) || 0)}
                    className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-600 ${
                      validationErrors[`outcome_${outcome.id}_cost`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter cost"
                    required
                  />
                  {validationErrors[`outcome_${outcome.id}_cost`] && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors[`outcome_${outcome.id}_cost`]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-800 mb-1">
                    Value ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={outcome.value || 0}
                    onChange={(e) => updateNode(outcome.id, 'value', parseFloat(e.target.value) || 0)}
                    className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-600 ${
                      validationErrors[`outcome_${outcome.id}_value`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter value"
                    required
                  />
                  {validationErrors[`outcome_${outcome.id}_value`] && (
                    <p className="text-red-600 text-xs mt-1">{validationErrors[`outcome_${outcome.id}_value`]}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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
            disabled={loading || !isFormComplete()}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              loading || !isFormComplete() 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Calculator className="h-4 w-4 mr-2" />
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {/* Validation Summary */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="text-red-800 font-medium mb-2">Please fix the following issues:</h4>
            <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
              {Object.entries(validationErrors).map(([key, error]) => (
                <li key={key}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-6">Decision Tree Structure</h4>
          
          {/* Main Decision */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center bg-blue-100 border-2 border-blue-300 rounded-xl px-6 py-4">
              <GitBranch className="h-6 w-6 text-blue-600 mr-3" />
              <input
                type="text"
                value={decisionTree.name}
                onChange={(e) => updateNode('root', 'name', e.target.value)}
                className={`text-xl font-bold bg-transparent border-none outline-none ${
                  validationErrors['root'] ? 'text-red-600' : 'text-gray-900'
                } placeholder-gray-600`}
                placeholder="Enter main decision name"
                required
              />
            </div>
            {validationErrors['root'] && (
              <p className="text-red-600 text-sm mt-2">{validationErrors['root']}</p>
            )}
          </div>

          {/* Decision Options Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {decisionTree.children && decisionTree.children.map(option => renderDecisionOption(option))}
          </div>
        </div>
      </div>

      {(analysisResult || aiAnalysisResult) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Analysis Results</h3>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveAnalysisTab('synthetic')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
                activeAnalysisTab === 'synthetic'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={!analysisResult}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Synthetic Analysis
            </button>
            <button
              onClick={() => setActiveAnalysisTab('interactive')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
                activeAnalysisTab === 'interactive'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={!aiAnalysisResult}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Analysis
            </button>
          </div>

          {/* Synthetic Analysis Results */}
          {activeAnalysisTab === 'synthetic' && analysisResult && (
            <div>
              {/* Key Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-md font-semibold text-green-900">Expected Value</h4>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calculator className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-green-800 mb-1">
                {formatCurrency(analysisResult.expectedValue)}
              </p>
              <p className="text-sm text-green-700">Optimal decision outcome</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-md font-semibold text-blue-900">Best Option</h4>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <GitBranch className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xl font-bold text-blue-800 mb-1">
                {analysisResult.riskAnalysis?.bestOption || analysisResult.bestPath[1] || 'N/A'}
              </p>
              <p className="text-sm text-blue-700">
                {analysisResult.riskAnalysis?.riskLevel ? `${analysisResult.riskAnalysis.riskLevel} Risk` : 'Recommended choice'}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-md font-semibold text-purple-900">Risk Level</h4>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="text-xl font-bold text-purple-800 mb-1">
                {analysisResult.expectedValue > 200000 ? 'Low' : analysisResult.expectedValue > 100000 ? 'Medium' : 'High'}
              </p>
              <p className="text-sm text-purple-700">Based on expected value</p>
            </div>
          </div>

          {/* Decision Comparison */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Decision Options Comparison</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {decisionTree.children && decisionTree.children.map(option => {
                const optionExpectedValue = option.children?.reduce((sum, child) => 
                  sum + (child.probability || 0) * ((child.value || 0) - (child.cost || 0)), 0) || 0;
                const isRecommended = (analysisResult.riskAnalysis?.bestOption || analysisResult.bestPath[1])?.includes(option.name);
                
                return (
                  <div key={option.id} className={`border-2 rounded-lg p-4 ${
                    isRecommended ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${isRecommended ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <GitBranch className={`h-5 w-5 ${isRecommended ? 'text-green-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="ml-3">
                          <h5 className="font-semibold text-gray-900">{option.name}</h5>
                          {isRecommended && (
                            <span className="text-sm text-green-600 font-medium">✓ Recommended</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(optionExpectedValue)}
                        </div>
                        <div className="text-sm text-gray-600">Expected Value</div>
                      </div>
                    </div>
                    
                    {/* Outcomes Breakdown */}
                    <div className="space-y-2">
                      {option.children && option.children.map(outcome => (
                        <div key={outcome.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <Target className={`h-4 w-4 mr-2 ${
                              outcome.name.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-600'
                            }`} />
                            <span className="text-gray-700">{outcome.name}</span>
                            <span className="ml-2 text-gray-500">
                              ({((outcome.probability || 0) * 100).toFixed(0)}%)
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {formatCurrency((outcome.value || 0) - (outcome.cost || 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Decision Path */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Optimal Decision Path</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-4 overflow-x-auto">
                {analysisResult.bestPath.map((step: string, index: number) => (
                  <div key={index} className="flex items-center flex-shrink-0">
                    <div className="flex items-center bg-blue-100 border border-blue-300 rounded-lg px-4 py-2">
                      <span className="text-sm bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-blue-900">{step}</span>
                    </div>
                    {index < analysisResult.bestPath.length - 1 && (
                      <div className="mx-2 text-blue-400">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Analysis by Decision Option */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">📊 Detailed Analysis by Option</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {decisionTree.children && decisionTree.children.map((option, optionIndex) => {
                // Financial calculations
                const avgCost = option.children?.reduce((sum, child) => 
                  sum + (child.probability || 0) * (child.cost || 0), 0) || 0;
                const avgValue = option.children?.reduce((sum, child) => 
                  sum + (child.probability || 0) * (child.value || 0), 0) || 0;
                const roi = avgCost > 0 ? ((avgValue - avgCost) / avgCost * 100) : 0;
                
                // Calculate all ROIs to determine relative performance
                const allROIs = decisionTree.children?.map(opt => {
                  const cost = opt.children?.reduce((sum, child) => 
                    sum + (child.probability || 0) * (child.cost || 0), 0) || 0;
                  const value = opt.children?.reduce((sum, child) => 
                    sum + (child.probability || 0) * (child.value || 0), 0) || 0;
                  return cost > 0 ? ((value - cost) / cost * 100) : 0;
                }) || [];
                
                const maxROI = Math.max(...allROIs);
                const minROI = Math.min(...allROIs);
                const isTopPerformer = roi === maxROI && roi > minROI;
                const roiColor = roi > 100 ? (isTopPerformer ? 'text-emerald-700' : 'text-green-700') : 
                                roi > 50 ? 'text-green-600' : 
                                roi > 0 ? 'text-yellow-600' : 'text-red-600';

                // Risk calculations
                const successProbability = option.children?.find(child => 
                  child.name.toLowerCase().includes('success'))?.probability || 0;
                const failureProbability = 1 - successProbability;
                const riskLevel = failureProbability > 0.3 ? 'High' : failureProbability > 0.15 ? 'Medium' : 'Low';
                
                // Dynamic colors based on actual probabilities
                const successColor = successProbability >= 0.8 ? 'bg-emerald-500' : 
                                   successProbability >= 0.7 ? 'bg-green-500' : 
                                   successProbability >= 0.6 ? 'bg-yellow-500' : 'bg-orange-500';
                
                const failureColor = failureProbability <= 0.2 ? 'bg-red-300' : 
                                   failureProbability <= 0.3 ? 'bg-red-400' : 
                                   failureProbability <= 0.4 ? 'bg-red-500' : 'bg-red-600';

                // Color theme based on option index
                const colorTheme = optionIndex === 0 ? 
                  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', accent: 'text-blue-700' } :
                  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', accent: 'text-green-700' };

                return (
                  <div key={option.id} className={`${colorTheme.bg} ${colorTheme.border} border rounded-xl p-6 space-y-6`}>
                    {/* Option Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-2 ${optionIndex === 0 ? 'bg-blue-100' : 'bg-green-100'} rounded-lg`}>
                          <GitBranch className={`h-6 w-6 ${optionIndex === 0 ? 'text-blue-600' : 'text-green-600'}`} />
                        </div>
                        <div className="ml-3">
                          <h5 className={`text-xl font-bold ${colorTheme.text}`}>{option.name}</h5>
                          <span className={`text-sm ${colorTheme.accent} font-medium`}>Complete Analysis</span>
                        </div>
                      </div>
                      {isTopPerformer && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                          ★ Best ROI
                        </span>
                      )}
                    </div>

                    {/* Financial Analysis */}
                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <div className="flex items-center mb-4">
                        <Calculator className={`h-5 w-5 ${colorTheme.accent} mr-2`} />
                        <h6 className={`font-semibold ${colorTheme.text}`}>💰 Financial Metrics</h6>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <span className={`${colorTheme.accent} font-medium block mb-1`}>Avg Cost</span>
                          <div className={`font-bold text-lg ${colorTheme.text}`}>{formatCurrency(avgCost)}</div>
                        </div>
                        <div className="text-center">
                          <span className={`${colorTheme.accent} font-medium block mb-1`}>Avg Value</span>
                          <div className={`font-bold text-lg ${colorTheme.text}`}>{formatCurrency(avgValue)}</div>
                        </div>
                        <div className="text-center">
                          <span className={`${colorTheme.accent} font-medium block mb-1`}>ROI</span>
                          <div className={`font-bold text-xl flex items-center justify-center ${roiColor}`}>
                            {roi.toFixed(1)}%
                            {isTopPerformer && <span className="ml-1">↗</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Zap className={`h-5 w-5 ${colorTheme.accent} mr-2`} />
                          <h6 className={`font-semibold ${colorTheme.text}`}>⚠️ Risk Profile</h6>
                        </div>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                          riskLevel === 'High' ? 'bg-red-100 text-red-700' : 
                          riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {riskLevel} Risk
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 ${successColor} rounded-full mr-3`}></div>
                            <span className="font-semibold text-gray-900">Success Rate</span>
                          </div>
                          <span className="text-xl font-bold text-gray-900">
                            {(successProbability * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 ${failureColor} rounded-full mr-3`}></div>
                            <span className="font-semibold text-gray-900">Failure Rate</span>
                          </div>
                          <span className="text-xl font-bold text-gray-900">
                            {(failureProbability * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expected Value Summary */}
                    <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                      <div className="text-center">
                        <span className={`text-sm ${colorTheme.accent} font-medium block mb-1`}>Expected Value</span>
                        <div className={`text-2xl font-bold ${colorTheme.text}`}>
                          {formatCurrency(option.children?.reduce((sum, child) => 
                            sum + (child.probability || 0) * ((child.value || 0) - (child.cost || 0)), 0) || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Decision Recommendations</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <span className="font-semibold">Best Choice:</span> {analysisResult.riskAnalysis?.bestOption || analysisResult.bestPath[1] || 'N/A'} with an expected value of{' '}
                  <span className="font-semibold text-green-600">{formatCurrency(analysisResult.expectedValue)}</span>
                </p>
              </div>
              
              {/* Display reasoning if available */}
              {analysisResult.riskAnalysis?.reasoning && analysisResult.riskAnalysis.reasoning.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h5 className="font-semibold text-gray-900 mb-2">Analysis Reasoning:</h5>
                  {analysisResult.riskAnalysis.reasoning.map((reason: string, index: number) => (
                    <div key={index} className="flex items-start mb-1">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">{reason}</p>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-700">
                  This analysis considers expected value, risk tolerance, success probability, ROI, and worst-case scenarios to guide your decision-making process.
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-700">
                  <span className="font-semibold">Note:</span> Consider factors beyond financial metrics such as strategic alignment, resource availability, and market conditions.
                </p>
              </div>
            </div>
          </div>
            </div>
          )}

          {/* AI Analysis Results */}
          {activeAnalysisTab === 'interactive' && aiAnalysisResult && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Brain className="h-6 w-6 text-purple-600 mr-3" />
                  <h4 className="text-lg font-semibold text-purple-900">AI-Powered Analysis</h4>
                </div>
                
                {/* Best Solution Card */}
                <div className="bg-white rounded-lg p-6 border border-purple-200 mb-4">
                  <div className="flex items-center mb-3">
                    <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                    <h5 className="text-lg font-semibold text-purple-900">Recommended Solution</h5>
                  </div>
                  <div className="text-2xl font-bold text-purple-800 mb-2">
                    {aiAnalysisResult.best_solution}
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {aiAnalysisResult.justification_key_points}
                  </p>
                </div>

                {/* Detailed Analysis */}
                <div className="bg-white rounded-lg p-6 border border-purple-200">
                  <h5 className="text-lg font-semibold text-purple-900 mb-3">Detailed Analysis</h5>
                  <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {aiAnalysisResult.justification_long}
                  </div>
                </div>

                <div className="mt-4 text-xs text-purple-600">
                  <p>✨ This analysis was generated using AI with structured output based on the numerical data from your decision tree.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}