export interface DashboardUserSummary {
  id: number;
  nickname: string;
}

export interface DashboardSummary {
  pendingLearningCount: number;
  completedTodayCount: number;
  folderCount: number;
}

export interface LearningQueue {
  type: string;
  pendingCount: number;
  completedTodayCount: number;
}

export interface Dashboard {
  user: DashboardUserSummary;
  summary: DashboardSummary;
  learningQueues: LearningQueue[];
  calculatedAt: string;
}
