import { NextRequest, NextResponse } from 'next/server';
import { analyzeDecisionTree, DecisionNode } from '@/lib/calculations';

export async function POST(req: NextRequest) {
  try {
    const { decisionTree } = await req.json();
    if (!decisionTree) {
      return NextResponse.json({ error: 'No decision tree provided' }, { status: 400 });
    }
    // Run the analysis
    const result = analyzeDecisionTree(decisionTree as DecisionNode);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to analyze decision tree', details: (error as Error).message }, { status: 500 });
  }
}
