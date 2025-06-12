import { NextRequest, NextResponse } from 'next/server';
import { 
  optimizeResourceAllocation,
  performResourceLeveling,
  performScenarioAnalysis,
  type Task,
  type Resource,
  type ScenarioParameters
} from '../../../lib/calculations';

export async function POST(req: NextRequest) {
  try {
    const { method, data } = await req.json();

    switch (method) {
      case 'optimize':
        const { tasks, resources, projectDeadline } = data as {
          tasks: Task[];
          resources: Resource[];
          projectDeadline?: number;
        };
        const optimizationResult = optimizeResourceAllocation(tasks, resources, projectDeadline);
        return NextResponse.json(optimizationResult);

      case 'leveling':
        const { schedule, resourcesForLeveling } = data as {
          schedule: any;
          resourcesForLeveling: Resource[];
        };
        const levelingResult = performResourceLeveling(schedule, resourcesForLeveling);
        return NextResponse.json(levelingResult);

      case 'scenario':
        const { baseTasks, baseResources, scenarios } = data as {
          baseTasks: Task[];
          baseResources: Resource[];
          scenarios: ScenarioParameters[];
        };
        const scenarioResults = performScenarioAnalysis(baseTasks, baseResources, scenarios);
        return NextResponse.json(scenarioResults);

      default:
        return NextResponse.json(
          { error: 'Invalid resource allocation method' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Resource allocation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform resource allocation' },
      { status: 500 }
    );
  }
} 