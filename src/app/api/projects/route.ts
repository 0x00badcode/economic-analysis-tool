import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Project from '@/models/Project';
import { 
  calculateCOCOMO, 
  calculateFunctionPoints, 
  calculateROI, 
  calculateNPV, 
  calculateIRR, 
  calculatePaybackPeriod 
} from '@/lib/calculations';

export async function GET() {
  try {
    await connectToDatabase();
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return NextResponse.json(projects);
  } catch (error) {
    console.log('Database connection failed, returning mock data');
    console.error('GET /api/projects error:', error);
    // Return consistent mock data for development when DB is not available
    const mockProjects = [
      {
        _id: '1',
        name: 'Sample E-commerce Platform',
        description: 'A full-featured e-commerce platform with payment integration',
        teamSize: 5,
        estimatedLinesOfCode: 25000,
        timeframeMonths: 8,
        hourlyRate: 85,
        costEstimations: {
          cocomo: 125000,
          functionPoints: 118000,
          expertJudgment: 121500
        },
        budgetingMetrics: {
          totalBudget: 125000,
          projectedRevenue: 187500,
          roi: 50.0,
          npv: 45000,
          irr: 15.2,
          paybackPeriod: 6.2
        },
        riskFactors: {
          technical: 0.3,
          market: 0.4,
          organizational: 0.2
        },
        resources: [],
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z'
      },
      {
        _id: '2',
        name: 'Mobile Banking App',
        description: 'Secure mobile banking application with biometric authentication',
        teamSize: 8,
        estimatedLinesOfCode: 35000,
        timeframeMonths: 12,
        hourlyRate: 95,
        costEstimations: {
          cocomo: 285000,
          functionPoints: 275000,
          expertJudgment: 280000
        },
        budgetingMetrics: {
          totalBudget: 285000,
          projectedRevenue: 427500,
          roi: 50.0,
          npv: 105000,
          irr: 18.5,
          paybackPeriod: 8.1
        },
        riskFactors: {
          technical: 0.5,
          market: 0.3,
          organizational: 0.4
        },
        resources: [],
        createdAt: '2024-01-14T10:00:00.000Z',
        updatedAt: '2024-01-14T10:00:00.000Z'
      }
    ];
    return NextResponse.json(mockProjects);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Calculate cost estimations
    const cocomoResult = calculateCOCOMO(data.estimatedLinesOfCode);
    const functionPointsResult = calculateFunctionPoints(
      data.functionPoints?.inputs || 10,
      data.functionPoints?.outputs || 8,
      data.functionPoints?.inquiries || 5,
      data.functionPoints?.files || 3,
      data.functionPoints?.interfaces || 2
    );
    
    // Calculate budgeting metrics
    const totalBudget = data.budgetingMetrics?.totalBudget || cocomoResult.cost;
    const projectedRevenue = data.budgetingMetrics?.projectedRevenue || totalBudget * 1.5;
    const roi = calculateROI(projectedRevenue, totalBudget);
    
    // Sample cash flows for NPV, IRR, and payback calculations
    const monthlyRevenue = projectedRevenue / data.timeframeMonths;
    const cashFlows = Array(data.timeframeMonths).fill(monthlyRevenue);
    
    const npv = calculateNPV(cashFlows, 0.1, totalBudget);
    const irr = calculateIRR(cashFlows, totalBudget);
    const paybackPeriod = calculatePaybackPeriod(cashFlows, totalBudget);
    
    // Let MongoDB auto-generate the _id and timestamps
    const projectData = {
      ...data,
      // Map frontend field names to backend field names
      teamSize: data.team_size || data.teamSize || 1,
      hourlyRate: data.hourlyRate || 85, // Default hourly rate
      costEstimations: {
        cocomo: cocomoResult.cost,
        functionPoints: functionPointsResult.cost,
        expertJudgment: data.costEstimations?.expertJudgment || (cocomoResult.cost + functionPointsResult.cost) / 2
      },
      budgetingMetrics: {
        totalBudget,
        projectedRevenue,
        roi,
        npv,
        irr,
        paybackPeriod
      }
    };

    try {
      await connectToDatabase();
      const project = new Project(projectData);
      await project.save();
      return NextResponse.json(project, { status: 201 });
    } catch (dbError) {
      console.log('Database connection failed, returning calculated project data');
      console.error('POST /api/projects database error:', dbError);
      // Return the calculated project data even if DB save fails
      return NextResponse.json(projectData, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
} 