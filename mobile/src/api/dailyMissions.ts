import client from './client';
import { WalletDto } from './store';

export type DailyMissionType = 0 | 1;
export type DailyMissionRewardType = 0 | 1;

export interface UserDailyMissionDto {
    id: string;
    dailyMissionId?: number | null;
    missionDate: string;
    slot: number;
    name: string;
    description?: string | null;
    missionType: DailyMissionType;
    targetValue: number;
    rewardType: DailyMissionRewardType;
    rewardAmount: number;
    progress: number;
    isCompleted: boolean;
    isClaimed: boolean;
    completedAt?: string | null;
    claimedAt?: string | null;
}

export interface TodayDailyMissionsDto {
    missionDate: string;
    resetsAt: string;
    completedCount: number;
    claimedCount: number;
    totalCount: number;
    wallet: WalletDto;
    missions: UserDailyMissionDto[];
}

export interface ClaimDailyMissionResultDto {
    mission: UserDailyMissionDto;
    wallet: WalletDto;
}

export const getTodayDailyMissions = async (): Promise<TodayDailyMissionsDto> => {
    const response = await client.get<TodayDailyMissionsDto>('/api/daily-missions/today');
    return response.data;
};

export const claimDailyMission = async (id: string): Promise<ClaimDailyMissionResultDto> => {
    const response = await client.post<ClaimDailyMissionResultDto>(`/api/daily-missions/${id}/claim`);
    return response.data;
};
