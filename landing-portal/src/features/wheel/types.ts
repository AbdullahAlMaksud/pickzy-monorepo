export interface DrawRules {
  /** How many winners the draw should produce. */
  requestedWinnerCount: number;
  /**
   * `false`: a person who already won in this draw is temporarily excluded from the following spins
   * of the same draw session (they stay in the project's participant list).
   */
  allowRepeatWinners: boolean;
  /**
   * `true`: when the draw is finished, winners are permanently deleted from the project's participant
   * list. Completed history keeps its snapshot. Implies "no repeat winners" within the draw.
   */
  removeSelectedWinners: boolean;
}

export type DrawStatus = 'active' | 'completed';

/** One row of the roster snapshot taken when a draw session starts. */
export interface DrawParticipant {
  id: number;
  drawSessionId: number;
  /** The original `participants.id`, kept for removal/diffing. `null` if the project row is gone. */
  sourceParticipantId: number | null;
  displayName: string;
  position: number;
}

export interface DrawWinner {
  id: number;
  drawSessionId: number;
  drawParticipantId: number;
  winnerOrder: number;
  selectedAt: number;
  /** `null` while the winner has been drawn and saved but the reveal was not acknowledged yet. */
  revealedAt: number | null;
}

export interface DrawSession extends DrawRules {
  id: number;
  projectId: number | null;
  /** Project name at the time the draw started (the project may be renamed or deleted later). */
  projectName: string;
  status: DrawStatus;
  startedAt: number;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface DrawWinnerWithName extends DrawWinner {
  displayName: string;
}

export interface DrawSnapshot {
  session: DrawSession;
  participants: DrawParticipant[];
  winners: DrawWinnerWithName[];
}

export type WheelPhase = 'idle' | 'selecting' | 'spinning' | 'revealing';
