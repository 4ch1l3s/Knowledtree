import client from './client';
import { TreeDto, WalletDto } from './store';

export type PlantingSessionStatus = 0 | 1 | 2 | 3 | 4;

export interface StartPlantingSessionDto {
    treePoolId: number;
    tagId?: number | null;
    plannedDurationMinutes: number;
    clientStartTime?: string | null;
}

export interface CompletePlantingSessionDto {
    clientEndTime?: string | null;
}

export interface PlantingSessionDto {
    id: string;
    treePoolId: number;
    resultTreeId?: number | null;
    tagId?: number | null;
    plannedDurationMinutes: number;
    clientStartTime: string;
    serverStartTime: string;
    clientEndTime?: string | null;
    serverEndTime?: string | null;
    status: PlantingSessionStatus;
    duplicateGemReward: number;
    duplicateCoinReward: number;
}

export interface CompletePlantingSessionResultDto {
    session: PlantingSessionDto;
    resultTree: TreeDto;
    isDuplicate: boolean;
    bonusCoinReward: number;
    bonusGemReward: number;
    totalObtainedCount: number;
    wallet: WalletDto;
}

export const startPlantingSession = async (
    input: StartPlantingSessionDto,
): Promise<PlantingSessionDto> => {
    const response = await client.post<PlantingSessionDto>('/api/planting-sessions/start', input);
    return response.data;
};

export const completePlantingSession = async (
    id: string,
    input: CompletePlantingSessionDto,
): Promise<CompletePlantingSessionResultDto> => {
    const response = await client.post<CompletePlantingSessionResultDto>(
        `/api/planting-sessions/${id}/complete`,
        input,
    );
    return response.data;
};
