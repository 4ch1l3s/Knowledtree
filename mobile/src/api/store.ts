import client from './client';

export type CurrencyType = 0 | 1 | 2;
export type TreePoolType = 0 | 1 | 2 | 3;
export type TreeRarity = 0 | 1 | 2;

export interface WalletDto {
    coin: number;
    gem: number;
}

export interface TreeDto {
    id: number;
    name: string;
    description?: string | null;
    rarity: TreeRarity;
    imageKey: string;
    baseGoldYield: number;
}

export interface TreePoolDto {
    id: number;
    name: string;
    poolType: TreePoolType;
    currencyType: CurrencyType;
    cost: number;
    commonRate: number;
    rareRate: number;
    goldRate: number;
    startTime?: string | null;
    endTime?: string | null;
    isActive: boolean;
    packageImageKey?: string | null;
    ownedSeedQuantity: number;
    trees: TreeDto[];
}

export interface SeedPackageDto {
    id: string;
    treePoolId: number;
    treePoolName: string;
    packageImageKey?: string | null;
    quantity: number;
}

export interface BuySeedPackageResultDto {
    wallet: WalletDto;
    seedPackage: SeedPackageDto;
}

export interface BuySeedPackageItemDto {
    treePoolId: number;
    quantity: number;
}

export interface BuySeedPackagesDto {
    items: BuySeedPackageItemDto[];
}

export interface BuySeedPackagesResultDto {
    wallet: WalletDto;
    seedPackages: SeedPackageDto[];
}

export const getMyWallet = async (): Promise<WalletDto> => {
    const response = await client.get<WalletDto>('/api/store/wallet');
    return response.data;
};

export const getAvailableTreePools = async (): Promise<TreePoolDto[]> => {
    const response = await client.get<TreePoolDto[]>('/api/store/tree-pools');
    return response.data;
};

export const getMySeedPackages = async (): Promise<SeedPackageDto[]> => {
    const response = await client.get<SeedPackageDto[]>('/api/store/seed-packages');
    return response.data;
};

export const buySeedPackage = async (treePoolId: number): Promise<BuySeedPackageResultDto> => {
    const response = await client.post<BuySeedPackageResultDto>(`/api/store/tree-pools/${treePoolId}/buy`);
    return response.data;
};

export const buySeedPackages = async (input: BuySeedPackagesDto): Promise<BuySeedPackagesResultDto> => {
    const response = await client.post<BuySeedPackagesResultDto>('/api/store/seed-package-purchases/batch', input);
    return response.data;
};
