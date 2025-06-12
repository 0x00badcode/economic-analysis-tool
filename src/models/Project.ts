import mongoose from 'mongoose';

export interface IProject extends mongoose.Document {
  name: string;
  description: string;
  teamSize: number;
  estimatedLinesOfCode: number;
  timeframeMonths: number;
  hourlyRate: number;
  riskFactors: {
    technical: number;
    market: number;
    organizational: number;
  };
  costEstimations: {
    cocomo: number;
    functionPoints: number;
    expertJudgment: number;
  };
  budgetingMetrics: {
    totalBudget: number;
    projectedRevenue: number;
    roi: number;
    npv: number;
    irr: number;
    paybackPeriod: number;
  };
  resources: Array<{
    name: string;
    type: string;
    cost: number;
    allocation: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new mongoose.Schema<IProject>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  teamSize: { type: Number, required: true, min: 1 },
  estimatedLinesOfCode: { type: Number, required: true, min: 0 },
  timeframeMonths: { type: Number, required: true, min: 1 },
  hourlyRate: { type: Number, required: true, min: 0 },
  riskFactors: {
    technical: { type: Number, default: 0.5, min: 0, max: 1 },
    market: { type: Number, default: 0.5, min: 0, max: 1 },
    organizational: { type: Number, default: 0.5, min: 0, max: 1 }
  },
  costEstimations: {
    cocomo: { type: Number, default: 0 },
    functionPoints: { type: Number, default: 0 },
    expertJudgment: { type: Number, default: 0 }
  },
  budgetingMetrics: {
    totalBudget: { type: Number, default: 0 },
    projectedRevenue: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },
    npv: { type: Number, default: 0 },
    irr: { type: Number, default: 0 },
    paybackPeriod: { type: Number, default: 0 }
  },
  resources: [{
    name: { type: String, required: true },
    type: { type: String, required: true },
    cost: { type: Number, required: true },
    allocation: { type: Number, required: true, min: 0, max: 1 }
  }]
}, {
  timestamps: true
});

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema); 