import { NextRequest, NextResponse } from 'next/server';
import {
  calculateDelphiEstimation,
  calculateRegressionEstimation,
  monteCarloSimulation,
  ExpertEstimate,
  HistoricalProject
} from '@/lib/calculations';

interface DelphiRequestData {
  estimates: ExpertEstimate[];
  iterations?: number;
  riskFactors?: {
    technical: number;
    market: number;
    organizational: number;
  };
}

interface RegressionRequestData {
  historicalData: HistoricalProject[];
  newProject: {
    linesOfCode: number;
    teamSize: number;
    complexity: number;
  };
}

interface CostEstimationRequest {
  method: 'delphi' | 'regression';
  data: DelphiRequestData | RegressionRequestData;
}

export async function POST(request: NextRequest) {
  try {
    const body: CostEstimationRequest = await request.json();
    const { method, data } = body;

    if (method === 'delphi') {
      const delphiData = data as DelphiRequestData;
      
      // Validate expert estimates
      if (!delphiData.estimates || delphiData.estimates.length === 0) {
        return NextResponse.json(
          { error: 'At least one expert estimate is required' },
          { status: 400 }
        );
      }

      // Validate expert estimate structure
      for (const estimate of delphiData.estimates) {
        if (
          typeof estimate.optimistic !== 'number' ||
          typeof estimate.mostLikely !== 'number' ||
          typeof estimate.pessimistic !== 'number' ||
          typeof estimate.confidence !== 'number' ||
          estimate.optimistic < 0 ||
          estimate.mostLikely < 0 ||
          estimate.pessimistic < 0 ||
          estimate.confidence < 0 ||
          estimate.confidence > 1 ||
          estimate.optimistic > estimate.mostLikely ||
          estimate.mostLikely > estimate.pessimistic
        ) {
          return NextResponse.json(
            { error: `Invalid estimate data for expert ${estimate.expertId}. Ensure optimistic <= mostLikely <= pessimistic and confidence is between 0-1` },
            { status: 400 }
          );
        }
      }

      // Perform Delphi estimation
      const delphiResult = calculateDelphiEstimation(
        delphiData.estimates,
        delphiData.iterations || 3
      );

      // Calculate additional metrics
      const expertCount = delphiData.estimates.length;
      const estimateRange = {
        min: Math.min(...delphiData.estimates.map(e => e.optimistic)),
        max: Math.max(...delphiData.estimates.map(e => e.pessimistic)),
        spread: Math.max(...delphiData.estimates.map(e => e.pessimistic)) - 
                Math.min(...delphiData.estimates.map(e => e.optimistic))
      };

      // Calculate individual expert PERT estimates for analysis
      const expertAnalysis = delphiData.estimates.map(estimate => ({
        expertId: estimate.expertId,
        pertEstimate: (estimate.optimistic + 4 * estimate.mostLikely + estimate.pessimistic) / 6,
        confidence: estimate.confidence,
        range: estimate.pessimistic - estimate.optimistic,
        optimisticBias: (estimate.mostLikely - estimate.optimistic) / (estimate.pessimistic - estimate.optimistic),
        pessimisticBias: (estimate.pessimistic - estimate.mostLikely) / (estimate.pessimistic - estimate.optimistic)
      }));

      // Risk analysis if risk factors provided
      let riskAnalysis = null;
      if (delphiData.riskFactors) {
        riskAnalysis = monteCarloSimulation(
          delphiResult.finalEstimate,
          delphiData.riskFactors,
          1000
        );
      }

      return NextResponse.json({
        method: 'delphi',
        result: {
          finalEstimate: delphiResult.finalEstimate,
          consensus: delphiResult.consensus,
          pertAverage: delphiResult.pert,
          confidenceWeightedAverage: delphiResult.confidenceWeightedAverage,
          expertCount,
          estimateRange,
          expertAnalysis,
          riskAnalysis,
          methodology: {
            description: 'Delphi method with PERT estimation and confidence weighting',
            formula: 'PERT = (Optimistic + 4 × Most Likely + Pessimistic) / 6',
            weightingMethod: 'Confidence-weighted average of expert PERT estimates'
          }
        },
        timestamp: new Date().toISOString()
      });

    } else if (method === 'regression') {
      const regressionData = data as RegressionRequestData;
      
      // Validate regression data
      if (!regressionData.historicalData || regressionData.historicalData.length < 2) {
        return NextResponse.json(
          { error: 'At least 2 historical projects are required for regression analysis' },
          { status: 400 }
        );
      }

      if (!regressionData.newProject) {
        return NextResponse.json(
          { error: 'New project parameters are required' },
          { status: 400 }
        );
      }

      // Validate historical project data
      for (const project of regressionData.historicalData) {
        if (
          typeof project.linesOfCode !== 'number' ||
          typeof project.teamSize !== 'number' ||
          typeof project.complexity !== 'number' ||
          typeof project.actualCost !== 'number' ||
          typeof project.actualDuration !== 'number' ||
          project.linesOfCode <= 0 ||
          project.teamSize <= 0 ||
          project.complexity < 1 ||
          project.complexity > 5 ||
          project.actualCost <= 0 ||
          project.actualDuration <= 0
        ) {
          return NextResponse.json(
            { error: 'Invalid historical project data. Ensure all values are positive and complexity is between 1-5' },
            { status: 400 }
          );
        }
      }

      // Validate new project data
      const { newProject } = regressionData;
      if (
        typeof newProject.linesOfCode !== 'number' ||
        typeof newProject.teamSize !== 'number' ||
        typeof newProject.complexity !== 'number' ||
        newProject.linesOfCode <= 0 ||
        newProject.teamSize <= 0 ||
        newProject.complexity < 1 ||
        newProject.complexity > 5
      ) {
        return NextResponse.json(
          { error: 'Invalid new project parameters. Ensure all values are positive and complexity is between 1-5' },
          { status: 400 }
        );
      }

      // Perform regression estimation
      const regressionResult = calculateRegressionEstimation(
        regressionData.historicalData,
        regressionData.newProject
      );

      // Calculate additional statistical metrics
      const historicalCosts = regressionData.historicalData.map(p => p.actualCost);
      const meanCost = historicalCosts.reduce((sum, cost) => sum + cost, 0) / historicalCosts.length;
      const costVariance = historicalCosts.reduce((sum, cost) => sum + Math.pow(cost - meanCost, 2), 0) / historicalCosts.length;
      const costStandardDeviation = Math.sqrt(costVariance);

      const historicalDurations = regressionData.historicalData.map(p => p.actualDuration);
      const meanDuration = historicalDurations.reduce((sum, duration) => sum + duration, 0) / historicalDurations.length;

      // Calculate prediction intervals (simplified)
      const costPredictionInterval = {
        lower: regressionResult.estimatedCost - (1.96 * costStandardDeviation),
        upper: regressionResult.estimatedCost + (1.96 * costStandardDeviation)
      };

      return NextResponse.json({
        method: 'regression',
        result: {
          estimatedCost: regressionResult.estimatedCost,
          estimatedDuration: regressionResult.estimatedDuration,
          confidence: regressionResult.confidence,
          rSquared: regressionResult.rSquared,
          costPredictionInterval,
          historicalStatistics: {
            projectCount: regressionData.historicalData.length,
            meanCost,
            costStandardDeviation,
            meanDuration,
            costRange: {
              min: Math.min(...historicalCosts),
              max: Math.max(...historicalCosts)
            }
          },
          methodology: {
            description: 'Multiple linear regression based on historical project similarity',
            factors: ['Lines of Code', 'Team Size', 'Complexity'],
            similarityMetric: 'Weighted similarity score across all factors'
          }
        },
        timestamp: new Date().toISOString()
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid method. Use "delphi" or "regression"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Cost estimation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during cost estimation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Cost Estimation API',
    supportedMethods: ['delphi', 'regression'],
    endpoints: {
      POST: '/api/cost-estimation',
      description: 'Perform cost estimation using expert judgment (Delphi) or regression analysis'
    },
    delphiMethodSchema: {
      method: 'delphi',
      data: {
        estimates: [
          {
            expertId: 'string',
            optimistic: 'number (>= 0)',
            mostLikely: 'number (>= optimistic)',
            pessimistic: 'number (>= mostLikely)',
            confidence: 'number (0-1)'
          }
        ],
        iterations: 'number (optional, default: 3)',
        riskFactors: {
          technical: 'number (0-1, optional)',
          market: 'number (0-1, optional)',
          organizational: 'number (0-1, optional)'
        }
      }
    },
    regressionMethodSchema: {
      method: 'regression',
      data: {
        historicalData: [
          {
            linesOfCode: 'number (> 0)',
            teamSize: 'number (> 0)',
            complexity: 'number (1-5)',
            actualCost: 'number (> 0)',
            actualDuration: 'number (> 0)'
          }
        ],
        newProject: {
          linesOfCode: 'number (> 0)',
          teamSize: 'number (> 0)',
          complexity: 'number (1-5)'
        }
      }
    }
  });
}