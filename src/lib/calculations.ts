/**
 * COCOMO Cost Estimation Model
 * Effort = a * (KLOC)^b * EAF
 */
export function calculateCOCOMO(
  linesOfCode: number,
  projectType: 'organic' | 'semidetached' | 'embedded' = 'semidetached'
): { effort: number; duration: number; cost: number } {
  const kloc = linesOfCode / 1000;
  
  const coefficients = {
    organic: { a: 2.4, b: 1.05, c: 2.5, d: 0.38 },
    semidetached: { a: 3.0, b: 1.12, c: 2.5, d: 0.35 },
    embedded: { a: 3.6, b: 1.20, c: 2.5, d: 0.32 }
  };
  
  const { a, b, c, d } = coefficients[projectType];
  
  // Effort in person-months
  const effort = a * Math.pow(kloc, b);
  
  // Duration in months
  const duration = c * Math.pow(effort, d);
  
  // Assuming average hourly rate for cost calculation
  const cost = effort * 160 * 75; // 160 hours/month * $75/hour
  
  return { effort, duration, cost };
}

/**
 * Function Points Cost Estimation
 */
export function calculateFunctionPoints(
  inputs: number,
  outputs: number,
  inquiries: number,
  files: number,
  interfaces: number,
  complexityFactor: number = 1.0
): { functionPoints: number; effort: number; cost: number } {
  const weights = {
    inputs: 4,
    outputs: 5,
    inquiries: 4,
    files: 10,
    interfaces: 7
  };
  
  const unadjustedFP = 
    inputs * weights.inputs +
    outputs * weights.outputs +
    inquiries * weights.inquiries +
    files * weights.files +
    interfaces * weights.interfaces;
  
  const functionPoints = unadjustedFP * complexityFactor;
  
  // Industry average: 6-8 hours per function point
  const effort = functionPoints * 7;
  const cost = effort * 75; // $75/hour
  
  return { functionPoints, effort, cost };
}

/**
 * Calculate Return on Investment (ROI)
 */
export function calculateROI(gain: number, cost: number): number {
  if (cost === 0) return 0;
  return ((gain - cost) / cost) * 100;
}

/**
 * Calculate Net Present Value (NPV)
 */
export function calculateNPV(
  cashFlows: number[],
  discountRate: number,
  initialInvestment: number
): number {
  let npv = -initialInvestment;
  
  cashFlows.forEach((cashFlow, period) => {
    npv += cashFlow / Math.pow(1 + discountRate, period + 1);
  });
  
  return npv;
}

/**
 * Calculate Internal Rate of Return (IRR)
 * Using Newton-Raphson method for approximation
 */
export function calculateIRR(
  cashFlows: number[],
  initialInvestment: number,
  maxIterations: number = 100
): number {
  const allCashFlows = [-initialInvestment, ...cashFlows];
  let rate = 0.1; // Initial guess
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;
    
    allCashFlows.forEach((cf, period) => {
      npv += cf / Math.pow(1 + rate, period);
      if (period > 0) {
        derivative -= period * cf / Math.pow(1 + rate, period + 1);
      }
    });
    
    if (Math.abs(npv) < 0.01) break;
    if (derivative === 0) break;
    
    rate = rate - npv / derivative;
  }
  
  return rate * 100;
}

/**
 * Calculate Payback Period
 */
export function calculatePaybackPeriod(
  cashFlows: number[],
  initialInvestment: number
): number {
  let cumulativeCashFlow = -initialInvestment;
  
  for (let period = 0; period < cashFlows.length; period++) {
    cumulativeCashFlow += cashFlows[period];
    
    if (cumulativeCashFlow >= 0) {
      // Linear interpolation for more precise payback period
      const previousCumulative = cumulativeCashFlow - cashFlows[period];
      const fraction = -previousCumulative / cashFlows[period];
      return period + fraction;
    }
  }
  
  return cashFlows.length; // If payback period exceeds project duration
}

/**
 * Monte Carlo Simulation for Risk Analysis
 */
export function monteCarloSimulation(
  baseValue: number,
  riskFactors: { technical: number; market: number; organizational: number },
  iterations: number = 1000
): { mean: number; standardDeviation: number; percentiles: { p10: number; p50: number; p90: number } } {
  const results: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    // Generate random factors based on risk levels
    const technicalFactor = 1 + (Math.random() - 0.5) * 2 * riskFactors.technical;
    const marketFactor = 1 + (Math.random() - 0.5) * 2 * riskFactors.market;
    const organizationalFactor = 1 + (Math.random() - 0.5) * 2 * riskFactors.organizational;
    
    const simulatedValue = baseValue * technicalFactor * marketFactor * organizationalFactor;
    results.push(simulatedValue);
  }
  
  results.sort((a, b) => a - b);
  
  const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
  const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
  const standardDeviation = Math.sqrt(variance);
  
  const p10Index = Math.floor(iterations * 0.1);
  const p50Index = Math.floor(iterations * 0.5);
  const p90Index = Math.floor(iterations * 0.9);
  
  return {
    mean,
    standardDeviation,
    percentiles: {
      p10: results[p10Index],
      p50: results[p50Index],
      p90: results[p90Index]
    }
  };
}

/**
 * Sensitivity Analysis
 */
export function sensitivityAnalysis(
  baseParameters: Record<string, number>,
  calculateFunction: (params: Record<string, number>) => number,
  variationPercent: number = 0.2
): Record<string, { increase: number; decrease: number; sensitivity: number }> {
  const baseResult = calculateFunction(baseParameters);
  const results: Record<string, { increase: number; decrease: number; sensitivity: number }> = {};
  
  Object.keys(baseParameters).forEach(param => {
    const originalValue = baseParameters[param];
    
    // Test increase
    const increasedParams = { ...baseParameters };
    increasedParams[param] = originalValue * (1 + variationPercent);
    const increasedResult = calculateFunction(increasedParams);
    
    // Test decrease
    const decreasedParams = { ...baseParameters };
    decreasedParams[param] = originalValue * (1 - variationPercent);
    const decreasedResult = calculateFunction(decreasedParams);
    
    // Calculate sensitivity (% change in output / % change in input)
    const outputChangePercent = ((increasedResult - baseResult) / baseResult) * 100;
    const inputChangePercent = variationPercent * 100;
    const sensitivity = Math.abs(outputChangePercent / inputChangePercent);
    
    results[param] = {
      increase: increasedResult,
      decrease: decreasedResult,
      sensitivity
    };
  });
  
  return results;
}

/**
 * Expert Judgment / Delphi Method Cost Estimation
 */
export interface ExpertEstimate {
  expertId: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  confidence: number; // 0-1 scale
}

export function calculateDelphiEstimation(
  estimates: ExpertEstimate[],
  iterations: number = 3
): { 
  finalEstimate: number; 
  consensus: number; 
  pert: number;
  confidenceWeightedAverage: number;
} {
  if (estimates.length === 0) return { finalEstimate: 0, consensus: 0, pert: 0, confidenceWeightedAverage: 0 };
  
  // Calculate PERT estimate for each expert
  const pertEstimates = estimates.map(est => 
    (est.optimistic + 4 * est.mostLikely + est.pessimistic) / 6
  );
  
  // Simple average
  const average = pertEstimates.reduce((sum, est) => sum + est, 0) / pertEstimates.length;
  
  // Confidence-weighted average
  const totalConfidence = estimates.reduce((sum, est) => sum + est.confidence, 0);
  const confidenceWeightedAverage = estimates.reduce((sum, est, idx) => 
    sum + (pertEstimates[idx] * est.confidence), 0) / totalConfidence;
  
  // Calculate consensus (inverse of coefficient of variation)
  const stdDev = Math.sqrt(
    pertEstimates.reduce((sum, est) => sum + Math.pow(est - average, 2), 0) / pertEstimates.length
  );
  const consensus = average > 0 ? 1 - (stdDev / average) : 0;
  
  return {
    finalEstimate: confidenceWeightedAverage,
    consensus: Math.max(0, Math.min(1, consensus)),
    pert: average,
    confidenceWeightedAverage
  };
}

/**
 * Regression Analysis for Cost Estimation
 */
export interface HistoricalProject {
  linesOfCode: number;
  teamSize: number;
  complexity: number; // 1-5 scale
  actualCost: number;
  actualDuration: number;
}

export function calculateRegressionEstimation(
  historicalData: HistoricalProject[],
  newProject: { linesOfCode: number; teamSize: number; complexity: number }
): { 
  estimatedCost: number; 
  estimatedDuration: number; 
  confidence: number;
  rSquared: number;
} {
  if (historicalData.length < 1) {
    return { estimatedCost: 0, estimatedDuration: 0, confidence: 0, rSquared: 0 };
  }
  
  // Simple multiple linear regression for cost estimation
  // Cost = a + b1*LOC + b2*TeamSize + b3*Complexity
  
  const n = historicalData.length;
  const x1 = historicalData.map(p => p.linesOfCode);
  const x2 = historicalData.map(p => p.teamSize);
  const x3 = historicalData.map(p => p.complexity);
  const y = historicalData.map(p => p.actualCost);
  
  // Calculate means
  const meanX1 = x1.reduce((sum, val) => sum + val, 0) / n;
  const meanX2 = x2.reduce((sum, val) => sum + val, 0) / n;
  const meanX3 = x3.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Simple correlation-based estimation (simplified for this implementation)
  const correlationLOC = calculateCorrelation(x1, y);
  const correlationTeam = calculateCorrelation(x2, y);
  const correlationComplexity = calculateCorrelation(x3, y);
  
  // Estimate based on closest historical project
  const similarities = historicalData.map(project => {
    const locSim = project.linesOfCode === 0 && newProject.linesOfCode === 0 ? 1 : 
                   1 - Math.abs(project.linesOfCode - newProject.linesOfCode) / Math.max(project.linesOfCode, newProject.linesOfCode, 1);
    const teamSim = project.teamSize === 0 && newProject.teamSize === 0 ? 1 :
                    1 - Math.abs(project.teamSize - newProject.teamSize) / Math.max(project.teamSize, newProject.teamSize, 1);
    const complexitySim = 1 - Math.abs(project.complexity - newProject.complexity) / 5;
    return (locSim + teamSim + complexitySim) / 3;
  });
  
  const maxSimilarityIndex = similarities.indexOf(Math.max(...similarities));
  const baseCost = historicalData[maxSimilarityIndex].actualCost;
  const baseDuration = historicalData[maxSimilarityIndex].actualDuration;
  
  // Adjust based on project differences
  const baseProject = historicalData[maxSimilarityIndex];
  const locRatio = baseProject.linesOfCode === 0 ? 1 : newProject.linesOfCode / baseProject.linesOfCode;
  const teamRatio = baseProject.teamSize === 0 ? 1 : newProject.teamSize / baseProject.teamSize;
  const complexityRatio = baseProject.complexity === 0 ? 1 : newProject.complexity / baseProject.complexity;
  
  const estimatedCost = baseCost * Math.pow(locRatio, 0.7) * Math.pow(teamRatio, 0.3) * Math.pow(complexityRatio, 0.2);
  const estimatedDuration = baseDuration * Math.pow(locRatio, 0.5) * Math.pow(complexityRatio, 0.3);
  
  // Calculate R-squared (simplified)
  const correlations = [Math.abs(correlationLOC), Math.abs(correlationTeam), Math.abs(correlationComplexity)];
  const rSquared = correlations.length > 0 ? Math.max(...correlations) : 0;
  
  return {
    estimatedCost: Math.max(0, estimatedCost || 0),
    estimatedDuration: Math.max(0, estimatedDuration || 0),
    confidence: similarities.length > 0 ? Math.max(...similarities) : 0,
    rSquared: Math.max(0, Math.min(1, rSquared || 0))
  };
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }
  
  const denominator = Math.sqrt(denomX * denomY);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Decision Tree Analysis for Risk Management
 */
export interface DecisionNode {
  id: string;
  name: string;
  type: 'decision' | 'chance' | 'outcome';
  probability?: number;
  cost?: number;
  value?: number;
  children?: DecisionNode[];
}

export interface DecisionAnalysisResult {
  expectedValue: number;
  bestPath: string[];
  sensitivityAnalysis: Record<string, number>;
  riskAnalysis?: {
    bestOption: string;
    riskLevel: string;
    reasoning: string[];
  };
}

export function analyzeDecisionTree(rootNode: DecisionNode): DecisionAnalysisResult {
  const calculateExpectedValue = (node: DecisionNode): number => {
    if (node.type === 'outcome') {
      return (node.value || 0) - (node.cost || 0);
    }
    
    if (!node.children || node.children.length === 0) {
      return 0;
    }
    
    if (node.type === 'decision') {
      // For decision nodes, return the maximum expected value
      return Math.max(...node.children.map(child => calculateExpectedValue(child)));
    }
    
    if (node.type === 'chance') {
      // For chance nodes, return the weighted average
      return node.children.reduce((sum, child) => 
        sum + (child.probability || 0) * calculateExpectedValue(child), 0);
    }
    
    return 0;
  };

  const calculateRiskMetrics = (node: DecisionNode) => {
    if (!node.children) return null;
    
    const successOutcome = node.children.find(child => 
      child.name.toLowerCase().includes('success'));
    const failureOutcome = node.children.find(child => 
      child.name.toLowerCase().includes('failure'));
    
    if (!successOutcome || !failureOutcome) return null;
    
    const successProbability = successOutcome.probability || 0;
    const failureProbability = failureOutcome.probability || 0;
    const avgCost = successProbability * (successOutcome.cost || 0) + 
                   failureProbability * (failureOutcome.cost || 0);
    const avgValue = successProbability * (successOutcome.value || 0) + 
                     failureProbability * (failureOutcome.value || 0);
    const roi = avgCost > 0 ? ((avgValue - avgCost) / avgCost * 100) : 0;
    const worstCase = Math.min(
      (successOutcome.value || 0) - (successOutcome.cost || 0),
      (failureOutcome.value || 0) - (failureOutcome.cost || 0)
    );
    
    return {
      successProbability,
      failureProbability,
      roi,
      avgCost,
      worstCase,
      riskLevel: failureProbability > 0.3 ? 'High' : failureProbability > 0.15 ? 'Medium' : 'Low'
    };
  };

  const findBestPathWithRiskAnalysis = (node: DecisionNode, currentPath: string[] = []): { path: string[], riskAnalysis?: any } => {
    const newPath = [...currentPath, node.name];
    
    if (node.type === 'outcome' || !node.children || node.children.length === 0) {
      return { path: newPath };
    }
    
    if (node.type === 'decision') {
      const childAnalysis = node.children.map(child => ({
        name: child.name,
        expectedValue: calculateExpectedValue(child),
        riskMetrics: calculateRiskMetrics(child),
        path: findBestPathWithRiskAnalysis(child, newPath)
      }));
      
      // Sort by expected value first
      childAnalysis.sort((a, b) => b.expectedValue - a.expectedValue);
      
      // Check if top options have similar expected values (within 5%)
      const topOption = childAnalysis[0];
      const secondOption = childAnalysis[1];
      const valueDifference = Math.abs(topOption.expectedValue - secondOption.expectedValue);
      const averageValue = (topOption.expectedValue + secondOption.expectedValue) / 2;
      const percentageDifference = averageValue > 0 ? (valueDifference / averageValue) * 100 : 0;
      
      let bestOption = topOption;
      let reasoning: string[] = [];
      
      if (percentageDifference < 5 && topOption.riskMetrics && secondOption.riskMetrics) {
        // Expected values are similar, consider other factors
        reasoning.push(`Expected values are very close (${topOption.expectedValue.toFixed(0)} vs ${secondOption.expectedValue.toFixed(0)})`);
        
        // Factor in risk, ROI, and success probability
        const riskScore = (option: any) => {
          let score = 0;
          // Higher success probability is better
          score += option.riskMetrics.successProbability * 30;
          // Lower risk is generally better
          score += option.riskMetrics.riskLevel === 'Low' ? 25 : 
                   option.riskMetrics.riskLevel === 'Medium' ? 15 : 5;
          // Better ROI is preferred (capped to prevent extreme values from dominating)
          score += Math.min(option.riskMetrics.roi / 10, 20);
          // Less worst-case loss is better
          score += Math.max(0, option.riskMetrics.worstCase / 10000);
          return score;
        };
        
        const topScore = riskScore(topOption);
        const secondScore = riskScore(secondOption);
        
        if (secondScore > topScore) {
          bestOption = secondOption;
          reasoning.push(`${secondOption.name} offers better risk-adjusted returns`);
          reasoning.push(`Higher success probability: ${(secondOption.riskMetrics.successProbability * 100).toFixed(0)}% vs ${(topOption.riskMetrics.successProbability * 100).toFixed(0)}%`);
          
          if (secondOption.riskMetrics.roi > topOption.riskMetrics.roi * 1.5) {
            reasoning.push(`Significantly better ROI: ${secondOption.riskMetrics.roi.toFixed(1)}% vs ${topOption.riskMetrics.roi.toFixed(1)}%`);
          }
          
          if (secondOption.riskMetrics.riskLevel !== topOption.riskMetrics.riskLevel) {
            reasoning.push(`Lower risk profile: ${secondOption.riskMetrics.riskLevel} vs ${topOption.riskMetrics.riskLevel}`);
          }
        } else {
          reasoning.push(`${topOption.name} provides the best balance of return and risk`);
        }
      } else {
        reasoning.push(`Clear expected value advantage: ${topOption.expectedValue.toFixed(0)}`);
      }
      
      const result = bestOption.path;
      const riskAnalysis = {
        bestOption: bestOption.name,
        riskLevel: bestOption.riskMetrics?.riskLevel || 'Unknown',
        reasoning
      };
      
      return { path: result.path, riskAnalysis };
    }
    
    // For chance nodes, follow the most likely path
    const mostLikelyChild = node.children.reduce((best, current) => 
      (current.probability || 0) > (best.probability || 0) ? current : best);
    
    return findBestPathWithRiskAnalysis(mostLikelyChild, newPath);
  };
  
  const analysis = findBestPathWithRiskAnalysis(rootNode);
  
  return {
    expectedValue: calculateExpectedValue(rootNode),
    bestPath: analysis.path,
    sensitivityAnalysis: {}, // Simplified for this implementation
    riskAnalysis: analysis.riskAnalysis
  };
}

/**
 * Resource Allocation and Optimization
 */
export interface Resource {
  id: string;
  name: string;
  type: string;
  maxCapacity: number;
  hourlyRate: number;
  availability: number[]; // Availability per time period (0-1)
}

export interface Task {
  id: string;
  name: string;
  duration: number;
  requiredResources: { resourceId: string; amount: number }[];
  prerequisites: string[];
  priority: number;
}

export interface ScheduleResult {
  schedule: { taskId: string; startPeriod: number; endPeriod: number; assignedResources: Record<string, number> }[];
  resourceUtilization: Record<string, number[]>;
  totalCost: number;
  projectDuration: number;
  conflicts: string[];
}

export function optimizeResourceAllocation(
  tasks: Task[],
  resources: Resource[],
  projectDeadline?: number
): ScheduleResult {
  // Sort tasks by priority and dependencies
  const sortedTasks = topologicalSort(tasks);
  const schedule: { taskId: string; startPeriod: number; endPeriod: number; assignedResources: Record<string, number> }[] = [];
  const resourceUtilization: Record<string, number[]> = {};
  const conflicts: string[] = [];
  
  // Initialize resource utilization tracking
  const maxPeriods = projectDeadline || 100;
  resources.forEach(resource => {
    resourceUtilization[resource.id] = new Array(maxPeriods).fill(0);
  });
  
  // Schedule each task
  for (const task of sortedTasks) {
    const earliestStart = getEarliestStartTime(task, schedule);
    const { startPeriod, assignedResources, conflicts: taskConflicts } = scheduleTask(
      task,
      resources,
      resourceUtilization,
      earliestStart,
      maxPeriods
    );
    
    if (startPeriod === -1) {
      conflicts.push(`Cannot schedule task ${task.name} - insufficient resources`);
      continue;
    }
    
    schedule.push({
      taskId: task.id,
      startPeriod,
      endPeriod: startPeriod + task.duration,
      assignedResources
    });
    
    conflicts.push(...taskConflicts);
    
    // Update resource utilization
    for (let period = startPeriod; period < startPeriod + task.duration; period++) {
      Object.entries(assignedResources).forEach(([resourceId, amount]) => {
        if (resourceUtilization[resourceId] && period < resourceUtilization[resourceId].length) {
          resourceUtilization[resourceId][period] += amount;
        }
      });
    }
  }
  
  // Calculate total cost and project duration
  let totalCost = 0;
  let projectDuration = 0;
  
  schedule.forEach(item => {
    projectDuration = Math.max(projectDuration, item.endPeriod);
    Object.entries(item.assignedResources).forEach(([resourceId, amount]) => {
      const resource = resources.find(r => r.id === resourceId);
      if (resource) {
        totalCost += amount * resource.hourlyRate * (item.endPeriod - item.startPeriod);
      }
    });
  });
  
  return {
    schedule,
    resourceUtilization,
    totalCost,
    projectDuration,
    conflicts
  };
}

function topologicalSort(tasks: Task[]): Task[] {
  const visited = new Set<string>();
  const result: Task[] = [];
  const visiting = new Set<string>();
  
  function visit(taskId: string) {
    if (visiting.has(taskId)) return; // Cycle detection (simplified)
    if (visited.has(taskId)) return;
    
    visiting.add(taskId);
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.prerequisites.forEach(prereq => visit(prereq));
      result.push(task);
      visited.add(taskId);
    }
    visiting.delete(taskId);
  }
  
  tasks.forEach(task => visit(task.id));
  return result;
}

function getEarliestStartTime(task: Task, schedule: any[]): number {
  if (task.prerequisites.length === 0) return 0;
  
  let earliestStart = 0;
  task.prerequisites.forEach(prereqId => {
    const prereqSchedule = schedule.find(s => s.taskId === prereqId);
    if (prereqSchedule) {
      earliestStart = Math.max(earliestStart, prereqSchedule.endPeriod);
    }
  });
  
  return earliestStart;
}

function scheduleTask(
  task: Task,
  resources: Resource[],
  resourceUtilization: Record<string, number[]>,
  earliestStart: number,
  maxPeriods: number
): { startPeriod: number; assignedResources: Record<string, number>; conflicts: string[] } {
  
  for (let start = earliestStart; start <= maxPeriods - task.duration; start++) {
    const assignedResources: Record<string, number> = {};
    let canSchedule = true;
    const conflicts: string[] = [];
    
    // Check if required resources are available
    for (const requirement of task.requiredResources) {
      const resource = resources.find(r => r.id === requirement.resourceId);
      if (!resource) {
        canSchedule = false;
        conflicts.push(`Resource ${requirement.resourceId} not found`);
        break;
      }
      
      // Check availability for the entire task duration
      let available = true;
      for (let period = start; period < start + task.duration; period++) {
        const currentUtilization = resourceUtilization[resource.id][period] || 0;
        const availableCapacity = resource.maxCapacity * (resource.availability[period % resource.availability.length] || 1);
        
        if (currentUtilization + requirement.amount > availableCapacity) {
          available = false;
          break;
        }
      }
      
      if (available) {
        assignedResources[requirement.resourceId] = requirement.amount;
      } else {
        canSchedule = false;
        conflicts.push(`Insufficient capacity for resource ${resource.name} at period ${start}`);
        break;
      }
    }
    
    if (canSchedule) {
      return { startPeriod: start, assignedResources, conflicts: [] };
    }
  }
  
  return { startPeriod: -1, assignedResources: {}, conflicts: [] };
}

/**
 * Resource Leveling Algorithm
 */
export function performResourceLeveling(
  schedule: ScheduleResult,
  resources: Resource[]
): ScheduleResult {
  const leveledSchedule = { ...schedule };
  const conflicts: string[] = [];
  
  // Identify resource over-allocations
  Object.entries(schedule.resourceUtilization).forEach(([resourceId, utilization]) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;
    
    utilization.forEach((usage, period) => {
      const maxCapacity = resource.maxCapacity * (resource.availability[period % resource.availability.length] || 1);
      if (usage > maxCapacity) {
        conflicts.push(`Resource ${resource.name} over-allocated in period ${period}: ${usage}/${maxCapacity}`);
      }
    });
  });
  
  // Simple leveling: delay tasks that cause over-allocation
  // This is a simplified implementation - real resource leveling is more complex
  
  return {
    ...leveledSchedule,
    conflicts: [...schedule.conflicts, ...conflicts]
  };
}

/**
 * Scenario Analysis for Resource Optimization
 */
export interface ScenarioParameters {
  resourceMultiplier: number; // Scale resource availability
  budgetConstraint?: number;
  timeConstraint?: number;
  qualityRequirement?: number;
}

export function performScenarioAnalysis(
  baseTasks: Task[],
  baseResources: Resource[],
  scenarios: ScenarioParameters[]
): { scenario: ScenarioParameters; result: ScheduleResult; metrics: { efficiency: number; riskLevel: number } }[] {
  
  return scenarios.map(scenario => {
    // Adjust resources based on scenario
    const adjustedResources = baseResources.map(resource => ({
      ...resource,
      maxCapacity: resource.maxCapacity * scenario.resourceMultiplier
    }));
    
    // Schedule with adjusted parameters
    const result = optimizeResourceAllocation(baseTasks, adjustedResources, scenario.timeConstraint);
    
    // Calculate scenario metrics
    const efficiency = result.totalCost > 0 ? (result.projectDuration / result.totalCost) * 1000 : 0;
    const riskLevel = result.conflicts.length / Math.max(1, baseTasks.length);
    
    return {
      scenario,
      result,
      metrics: { efficiency, riskLevel }
    };
  });
} 