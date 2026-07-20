import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageSourcePropType,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AppLayout from '../components/AppLayout';
import { scale } from '../utils/scale';
import {
    buySeedPackages,
    CurrencyType,
    getAvailableTreePools,
    getMyWallet,
    TreePoolDto,
    WalletDto,
} from '../api/store';
import { resolveSeedPackageImage } from '../utils/seedPackageAssets';
import { useLocalization } from '../localization';

const BODY_BG = '#FFFFFF';
const PANEL_BG = '#F7FFF7';
const SEED_ROW_BG = '#F3FCF2';
const GREEN = '#3B653F';
const MINT = '#96E6B3';
const BORDER = '#DCE5DB';
const TEXT = '#161D18';
const MUTED = '#424940';
const BUY_DEBOUNCE_MS = 1000;
const MINUTE_MS = 60000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const assetCoin = require('../assets/asset_coin.png');
const assetGem = require('../assets/asset_gem.png');

type PurchaseMap = Record<number, number>;

const CURRENCY_ASSETS: Partial<Record<CurrencyType, ImageSourcePropType>> = {
    0: assetCoin,
    1: assetGem,
};

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

const getCurrencyAsset = (currencyType: CurrencyType) => CURRENCY_ASSETS[currencyType];

const getWalletBalance = (wallet: WalletDto | null, currencyType: CurrencyType) => {
    if (!wallet) {
        return 0;
    }

    if (currencyType === 0) {
        return wallet.coin;
    }

    if (currencyType === 1) {
        return wallet.gem;
    }

    return 0;
};

const canBuyPool = (pool: TreePoolDto, wallet: WalletDto | null) => {
    if (pool.cost <= 0) {
        return true;
    }

    if (!getCurrencyAsset(pool.currencyType)) {
        return false;
    }

    return getWalletBalance(wallet, pool.currencyType) >= pool.cost;
};

const getPurchaseQuantity = (purchases: PurchaseMap, treePoolId: number) => purchases[treePoolId] ?? 0;

const addPurchaseQuantity = (purchases: PurchaseMap, treePoolId: number, quantity: number): PurchaseMap => ({
    ...purchases,
    [treePoolId]: getPurchaseQuantity(purchases, treePoolId) + quantity,
});

const subtractPurchaseQuantities = (purchases: PurchaseMap, batch: PurchaseMap): PurchaseMap => {
    const nextPurchases = { ...purchases };

    Object.entries(batch).forEach(([treePoolIdKey, quantity]) => {
        const treePoolId = Number(treePoolIdKey);
        const nextQuantity = getPurchaseQuantity(nextPurchases, treePoolId) - quantity;

        if (nextQuantity > 0) {
            nextPurchases[treePoolId] = nextQuantity;
        } else {
            delete nextPurchases[treePoolId];
        }
    });

    return nextPurchases;
};

const getReservedCost = (
    purchases: PurchaseMap,
    poolsById: ReadonlyMap<number, TreePoolDto>,
): WalletDto => {
    let coin = 0;
    let gem = 0;

    Object.entries(purchases).forEach(([treePoolIdKey, quantity]) => {
        const pool = poolsById.get(Number(treePoolIdKey));
        if (!pool || pool.cost <= 0) {
            return;
        }

        const cost = pool.cost * quantity;
        if (pool.currencyType === 0) {
            coin += cost;
        } else if (pool.currencyType === 1) {
            gem += cost;
        }
    });

    return { coin, gem };
};

const getEffectiveWallet = (
    wallet: WalletDto | null,
    queuedPurchases: PurchaseMap,
    inFlightPurchases: PurchaseMap,
    poolsById: ReadonlyMap<number, TreePoolDto>,
): WalletDto | null => {
    if (!wallet) {
        return null;
    }

    const queuedCost = getReservedCost(queuedPurchases, poolsById);
    const inFlightCost = getReservedCost(inFlightPurchases, poolsById);

    return {
        coin: Math.max(0, wallet.coin - queuedCost.coin - inFlightCost.coin),
        gem: Math.max(0, wallet.gem - queuedCost.gem - inFlightCost.gem),
    };
};

const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || fallback;

const isLimitedPool = (pool: TreePoolDto) =>
    pool.poolType === 2
    || pool.poolType === 3
    || Boolean(pool.endTime);

const formatRemainingUnit = (
    value: number,
    unit: string,
    format: (count: number, unitLabel: string) => string,
) => format(value, unit);

const getLimitedLabel = (
    pool: TreePoolDto,
    nowMs: number,
    format: (count: number, unitLabel: string) => string,
    units: { minute: string; hour: string; day: string },
) => {
    if (!pool.endTime) {
        return null;
    }

    const end = new Date(pool.endTime);

    if (Number.isNaN(end.getTime())) {
        return null;
    }

    const remainingMs = end.getTime() - nowMs;
    if (remainingMs <= 0) {
        return null;
    }

    if (remainingMs < HOUR_MS) {
        return formatRemainingUnit(Math.ceil(remainingMs / MINUTE_MS), units.minute, format);
    }

    if (remainingMs < DAY_MS) {
        return formatRemainingUnit(Math.ceil(remainingMs / HOUR_MS), units.hour, format);
    }

    return formatRemainingUnit(Math.ceil(remainingMs / DAY_MS), units.day, format);
};

interface WalletChipProps {
    image: ImageSourcePropType;
    value: number;
}

const WalletChip: React.FC<WalletChipProps> = ({ image, value }) => (
    <View style={styles.walletChip}>
        <Image source={image} style={styles.walletAsset} resizeMode="contain" />
        <Text style={styles.walletValue}>{formatNumber(value)}</Text>
    </View>
);

interface SeedRowProps {
    pool: TreePoolDto;
    wallet: WalletDto | null;
    queuedQuantity: number;
    nowMs: number;
    onBuy: (pool: TreePoolDto) => void;
}

const SeedRow: React.FC<SeedRowProps> = ({ pool, wallet, queuedQuantity, nowMs, onBuy }) => {
    const { t } = useLocalization();
    const currencyAsset = getCurrencyAsset(pool.currencyType);
    const affordable = canBuyPool(pool, wallet);
    const disabled = !affordable;
    const limitedLabel = getLimitedLabel(
        pool,
        nowMs,
        (count, unit) => t('shop.timeLeft', { count, unit }),
        {
            minute: t('shop.minuteUnit'),
            hour: t('shop.hourUnit'),
            day: t('shop.dayUnit'),
        },
    );
    const displayedOwnedQuantity = pool.ownedSeedQuantity + queuedQuantity;

    return (
        <View style={styles.seedRow}>
            <View style={styles.seedImageFrame}>
                <Image
                    source={resolveSeedPackageImage(pool.packageImageKey, pool.name)}
                    style={styles.seedImage}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.seedInfo}>
                <Text numberOfLines={1} style={styles.seedName}>{pool.name}</Text>
                <Text style={styles.ownedText}>
                    {t('shop.owned', { count: displayedOwnedQuantity })}{queuedQuantity > 0 ? ` (+${queuedQuantity})` : ''}
                </Text>
                {limitedLabel ? (
                    <View style={styles.durationPill}>
                        <Text style={styles.durationText}>{limitedLabel}</Text>
                    </View>
                ) : null}
            </View>

            <TouchableOpacity
                style={[styles.buyPill, disabled && styles.buyPillDisabled]}
                activeOpacity={0.82}
                disabled={disabled}
                onPress={() => onBuy(pool)}
            >
                {currencyAsset ? (
                    <Image source={currencyAsset} style={styles.buyAsset} resizeMode="contain" />
                ) : (
                    <Icon name="tag" size={scale.ms(16)} color="#FFFFFF" />
                )}
                <Text style={styles.buyText}>
                    {affordable ? formatNumber(pool.cost) : t('shop.notEnough')}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

interface SeedSectionProps {
    title: string;
    iconName?: string;
    pools: TreePoolDto[];
    wallet: WalletDto | null;
    queuedPurchases: PurchaseMap;
    nowMs: number;
    onBuy: (pool: TreePoolDto) => void;
}

const SeedSection: React.FC<SeedSectionProps> = ({
    title,
    iconName,
    pools,
    wallet,
    queuedPurchases,
    nowMs,
    onBuy,
}) => {
    if (pools.length === 0) {
        return null;
    }

    return (
        <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {iconName ? <Icon name={iconName} size={scale.ms(13)} color={MUTED} /> : null}
            </View>

            <View style={styles.sectionRows}>
                {pools.map(pool => (
                    <SeedRow
                        key={pool.id}
                        pool={pool}
                        wallet={wallet}
                        queuedQuantity={getPurchaseQuantity(queuedPurchases, pool.id)}
                        nowMs={nowMs}
                        onBuy={onBuy}
                    />
                ))}
            </View>
        </View>
    );
};

const ShopScreen = () => {
    const { t } = useLocalization();
    const [wallet, setWallet] = useState<WalletDto | null>(null);
    const [treePools, setTreePools] = useState<TreePoolDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [queuedPurchases, setQueuedPurchases] = useState<PurchaseMap>({});
    const [inFlightPurchases, setInFlightPurchases] = useState<PurchaseMap>({});
    const [nowMs, setNowMs] = useState(Date.now());

    const queuedPurchasesRef = useRef<PurchaseMap>({});
    const inFlightPurchasesRef = useRef<PurchaseMap>({});
    const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { permanentPools, limitedPools } = useMemo(() => {
        const sorted = [...treePools].sort((a, b) => a.id - b.id);

        return {
            permanentPools: sorted.filter(pool => !isLimitedPool(pool)),
            limitedPools: sorted.filter(isLimitedPool),
        };
    }, [treePools]);

    const treePoolsById = useMemo(
        () => new Map(treePools.map(pool => [pool.id, pool])),
        [treePools],
    );

    const reservedPurchases = useMemo(() => {
        const purchases = { ...inFlightPurchases };

        Object.entries(queuedPurchases).forEach(([treePoolIdKey, quantity]) => {
            const treePoolId = Number(treePoolIdKey);
            purchases[treePoolId] = getPurchaseQuantity(purchases, treePoolId) + quantity;
        });

        return purchases;
    }, [inFlightPurchases, queuedPurchases]);

    const effectiveWallet = useMemo(
        () => getEffectiveWallet(wallet, queuedPurchases, inFlightPurchases, treePoolsById),
        [inFlightPurchases, queuedPurchases, treePoolsById, wallet],
    );

    const loadShop = useCallback(async (showFullLoader = false) => {
        if (showFullLoader) {
            setLoading(true);
        } else {
            setRefreshing(true);
        }

        setErrorMessage(null);

        try {
            const [walletData, poolData] = await Promise.all([
                getMyWallet(),
                getAvailableTreePools(),
            ]);

            setWallet(walletData);
            setTreePools(poolData);
        } catch (error: any) {
            setErrorMessage(getErrorMessage(error, t('shop.loadError')));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useEffect(() => {
        loadShop(true);
    }, [loadShop]);

    useEffect(() => {
        const timer = setInterval(() => setNowMs(Date.now()), MINUTE_MS);
        return () => clearInterval(timer);
    }, []);

    const clearFlushTimer = useCallback(() => {
        if (flushTimerRef.current) {
            clearTimeout(flushTimerRef.current);
            flushTimerRef.current = null;
        }
    }, []);

    const resetPurchaseBuffers = useCallback(() => {
        clearFlushTimer();
        queuedPurchasesRef.current = {};
        inFlightPurchasesRef.current = {};
        setQueuedPurchases({});
        setInFlightPurchases({});
    }, [clearFlushTimer]);

    const flushQueuedPurchases = useCallback(async () => {
        const batch = queuedPurchasesRef.current;
        const items = Object.entries(batch)
            .map(([treePoolId, quantity]) => ({
                treePoolId: Number(treePoolId),
                quantity,
            }))
            .filter(item => item.quantity > 0);

        if (items.length === 0) {
            return;
        }

        queuedPurchasesRef.current = {};
        setQueuedPurchases({});

        inFlightPurchasesRef.current = items.reduce<PurchaseMap>(
            (purchases, item) => addPurchaseQuantity(purchases, item.treePoolId, item.quantity),
            inFlightPurchasesRef.current,
        );
        setInFlightPurchases(inFlightPurchasesRef.current);

        try {
            const result = await buySeedPackages({ items });
            const batchPurchases = items.reduce<PurchaseMap>(
                (purchases, item) => addPurchaseQuantity(purchases, item.treePoolId, item.quantity),
                {},
            );

            inFlightPurchasesRef.current = subtractPurchaseQuantities(
                inFlightPurchasesRef.current,
                batchPurchases,
            );
            setInFlightPurchases(inFlightPurchasesRef.current);

            setWallet(result.wallet);
            setTreePools(prev => prev.map(pool => {
                const seedPackage = result.seedPackages.find(item => item.treePoolId === pool.id);
                return seedPackage
                    ? { ...pool, ownedSeedQuantity: seedPackage.quantity }
                    : pool;
            }));
        } catch (error: any) {
            resetPurchaseBuffers();
            Alert.alert(t('shop.purchaseErrorTitle'), getErrorMessage(error, t('shop.purchaseError')));
            await loadShop(false);
        }
    }, [loadShop, resetPurchaseBuffers, t]);

    const schedulePurchaseFlush = useCallback(() => {
        clearFlushTimer();
        flushTimerRef.current = setTimeout(() => {
            flushTimerRef.current = null;
            flushQueuedPurchases();
        }, BUY_DEBOUNCE_MS);
    }, [clearFlushTimer, flushQueuedPurchases]);

    useEffect(() => () => {
        clearFlushTimer();
    }, [clearFlushTimer]);

    const handleBuy = useCallback((pool: TreePoolDto) => {
        const currentEffectiveWallet = getEffectiveWallet(
            wallet,
            queuedPurchasesRef.current,
            inFlightPurchasesRef.current,
            treePoolsById,
        );

        if (!canBuyPool(pool, currentEffectiveWallet)) {
            Alert.alert(t('shop.balanceErrorTitle'), t('shop.balanceError'));
            return;
        }

        queuedPurchasesRef.current = addPurchaseQuantity(queuedPurchasesRef.current, pool.id, 1);
        setQueuedPurchases(queuedPurchasesRef.current);
        schedulePurchaseFlush();
    }, [schedulePurchaseFlush, t, treePoolsById, wallet]);

    if (loading) {
        return (
            <AppLayout title={t('shop.title')} iconPosition="left">
                <View style={styles.loadingState}>
                    <ActivityIndicator color={GREEN} size="large" />
                </View>
            </AppLayout>
        );
    }

    return (
        <AppLayout title={t('shop.title')} iconPosition="left">
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.scrollContent}
                refreshControl={(
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadShop(false)}
                        tintColor={GREEN}
                        colors={[GREEN]}
                    />
                )}
            >
                <View style={styles.walletRow}>
                    <WalletChip image={assetCoin} value={effectiveWallet?.coin ?? 0} />
                    <WalletChip image={assetGem} value={effectiveWallet?.gem ?? 0} />
                </View>

                {errorMessage ? (
                    <View style={styles.errorCard}>
                        <Icon name="alert-circle" size={scale.ms(24)} color="#B42318" />
                        <Text style={styles.errorText}>{errorMessage}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => loadShop(true)}>
                            <Text style={styles.retryText}>{t('common.retry')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : treePools.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Icon name="package" size={scale.ms(28)} color="#7C847D" />
                        <Text style={styles.emptyTitle}>{t('shop.empty')}</Text>
                    </View>
                ) : (
                    <View style={styles.sections}>
                        <SeedSection
                            title={t('shop.regularSeeds')}
                            pools={permanentPools}
                            wallet={effectiveWallet}
                            queuedPurchases={reservedPurchases}
                            nowMs={nowMs}
                            onBuy={handleBuy}
                        />
                        <SeedSection
                            title={t('shop.limitedSeeds')}
                            iconName="clock"
                            pools={limitedPools}
                            wallet={effectiveWallet}
                            queuedPurchases={reservedPurchases}
                            nowMs={nowMs}
                            onBuy={handleBuy}
                        />
                    </View>
                )}
            </ScrollView>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: BODY_BG,
    },
    scrollContent: {
        paddingHorizontal: scale.s(16),
        paddingTop: scale.vs(8),
        paddingBottom: scale.vs(32),
    },
    loadingState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BODY_BG,
    },
    walletRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: scale.s(10),
        marginBottom: scale.vs(48),
    },
    walletChip: {
        minHeight: scale.vs(29),
        borderWidth: 1,
        borderColor: '#C1C9BE',
        borderRadius: scale.s(999),
        paddingLeft: scale.s(9),
        paddingRight: scale.s(12),
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PANEL_BG,
    },
    walletAsset: {
        width: scale.s(18),
        height: scale.s(18),
        marginRight: scale.s(5),
    },
    walletValue: {
        color: TEXT,
        fontSize: scale.ms(13),
        fontWeight: '800',
        lineHeight: scale.ms(17),
    },
    sections: {
        gap: scale.vs(20),
    },
    sectionCard: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: scale.s(12),
        paddingHorizontal: scale.s(16),
        paddingTop: scale.vs(18),
        paddingBottom: scale.vs(22),
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale.s(5),
        marginBottom: scale.vs(16),
    },
    sectionTitle: {
        color: TEXT,
        fontSize: scale.ms(15),
        fontWeight: '800',
        lineHeight: scale.ms(20),
    },
    sectionRows: {
        gap: scale.vs(12),
    },
    seedRow: {
        minHeight: scale.vs(78),
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: scale.s(8),
        paddingHorizontal: scale.s(10),
        paddingVertical: scale.vs(12),
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: SEED_ROW_BG,
        overflow: 'hidden',
    },
    seedImageFrame: {
        width: scale.s(45),
        height: scale.s(45),
        borderRadius: scale.s(5),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: scale.s(13),
        backgroundColor: '#E8F6E8',
    },
    seedImage: {
        width: scale.s(33),
        height: scale.s(41),
    },
    seedInfo: {
        flex: 1,
        minWidth: 0,
    },
    seedName: {
        color: TEXT,
        fontSize: scale.ms(14),
        fontWeight: '800',
        lineHeight: scale.ms(18),
    },
    ownedText: {
        marginTop: scale.vs(2),
        color: MUTED,
        fontSize: scale.ms(12),
        lineHeight: scale.ms(16),
    },
    durationPill: {
        alignSelf: 'flex-start',
        borderRadius: scale.s(4),
        marginTop: scale.vs(4),
        paddingHorizontal: scale.s(7),
        paddingVertical: scale.vs(2),
        backgroundColor: '#CCFCCB',
    },
    durationText: {
        color: '#207249',
        fontSize: scale.ms(10),
        fontWeight: '800',
        lineHeight: scale.ms(13),
    },
    buyPill: {
        minWidth: scale.s(78),
        minHeight: scale.vs(34),
        borderRadius: scale.s(999),
        paddingHorizontal: scale.s(12),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: scale.s(5),
        backgroundColor: MINT,
    },
    buyPillDisabled: {
        opacity: 0.48,
    },
    buyAsset: {
        width: scale.s(17),
        height: scale.s(17),
    },
    buyText: {
        color: '#207249',
        fontSize: scale.ms(13),
        fontWeight: '800',
        lineHeight: scale.ms(17),
    },
    emptyCard: {
        minHeight: scale.vs(180),
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#C1C9BE',
        borderRadius: scale.s(12),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PANEL_BG,
    },
    emptyTitle: {
        marginTop: scale.vs(8),
        color: TEXT,
        fontSize: scale.ms(16),
        fontWeight: '800',
    },
    errorCard: {
        minHeight: scale.vs(180),
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: scale.s(12),
        padding: scale.s(20),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
    },
    errorText: {
        marginTop: scale.vs(8),
        color: '#7A271A',
        fontSize: scale.ms(13),
        lineHeight: scale.ms(18),
        textAlign: 'center',
    },
    retryButton: {
        minHeight: scale.vs(36),
        borderRadius: scale.s(10),
        marginTop: scale.vs(12),
        paddingHorizontal: scale.s(16),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#B42318',
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: scale.ms(13),
        fontWeight: '800',
    },
});

export default ShopScreen;
