export type SavingsMovementType = 'DEPOSIT' | 'WITHDRAWAL';

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  deadline: string | null;
  created_at: string;
}

export interface SavingsMovement {
  id: string;
  goal_id: string;
  type: SavingsMovementType;
  amount: number;
  created_at: string;
}

export interface CreateSavingsGoalInput {
  name: string;
  target_amount: number;
  deadline?: string | null;
}

export interface UpdateSavingsGoalInput {
  name?: string;
  target_amount?: number;
  deadline?: string | null;
}

export interface SavingsGoalWithProgress extends SavingsGoal {
  saved_amount: number;
  remaining_amount: number;
  progress_percentage: number;
}

export interface SavingsBalanceSummary {
  accumulated_balance: number;
  reserved_amount: number;
  available_balance: number;
}
