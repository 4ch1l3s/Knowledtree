import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';
import AppLayout from '../components/AppLayout';
import {
    claimDailyMission,
    getTodayDailyMissions,
    TodayDailyMissionsDto,
    UserDailyMissionDto,
} from '../api/dailyMissions';
import { useLocalization } from '../localization';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';

const assetCoin = require('../assets/asset_coin.png');
const assetGem = require('../assets/asset_gem.png');

const formatCountdown = (milliseconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map(value => value.toString().padStart(2, '0')).join(':');
};

const getErrorMessage = (error: unknown, fallback: string) => {
    const candidate = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
    return candidate?.response?.data?.error?.message || candidate?.message || fallback;
};

interface MissionCardProps {
    mission: UserDailyMissionDto;
    claiming: boolean;
    onClaim: (mission: UserDailyMissionDto) => void;
}

const MissionCard: React.FC<MissionCardProps> = ({ mission, claiming, onClaim }) => {
    const { t } = useLocalization();
    const { theme } = useTheme();
    const progressRatio = Math.min(1, mission.progress / mission.targetValue);
    const rewardImage = mission.rewardType === 0 ? assetCoin : assetGem;
    const rewardLabel = mission.rewardType === 0 ? t('dailyMissions.gold') : t('dailyMissions.gem');
    const actionLabel = mission.isClaimed
        ? t('dailyMissions.claimed')
        : mission.isCompleted
            ? t('dailyMissions.claim')
            : t('dailyMissions.inProgress');

    return (
        <View style={[
            styles.missionCard,
            {
                backgroundColor: theme.colors.surface,
                borderColor: mission.isCompleted ? '#8BC69A' : theme.colors.borderLight,
            },
        ]}>
            <View style={styles.cardHeader}>
                <View style={[
                    styles.missionIcon,
                    { backgroundColor: mission.isCompleted ? '#DDFBEA' : theme.colors.backgroundSecondary },
                ]}>
                    <FontAwesome
                        name={mission.isCompleted ? 'check' : mission.missionType === 0 ? 'check-square-o' : 'clock-o'}
                        size={scale.ms(18)}
                        color={mission.isCompleted ? '#157A42' : theme.colors.primaryDark}
                    />
                </View>
                <View style={styles.cardTitleBlock}>
                    <Text style={[styles.missionName, { color: theme.colors.text }]}>{mission.name}</Text>
                    {!!mission.description && (
                        <Text numberOfLines={2} style={[styles.missionDescription, { color: theme.colors.textSecondary }]}>
                            {mission.description}
                        </Text>
                    )}
                </View>
                <View style={styles.rewardChip}>
                    <Image source={rewardImage} style={styles.rewardImage} resizeMode="contain" />
                    <Text style={styles.rewardAmount}>+{mission.rewardAmount}</Text>
                </View>
            </View>

            <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                    {mission.missionType === 0 ? t('dailyMissions.sessions') : t('dailyMissions.minutes')}
                </Text>
                <Text style={[styles.progressValue, { color: theme.colors.text }]}>
                    {Math.min(mission.progress, mission.targetValue)}/{mission.targetValue}
                </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.colors.borderLight }]}>
                <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
            </View>

            <View style={styles.cardFooter}>
                <Text style={[styles.rewardType, { color: theme.colors.textSecondary }]}>{rewardLabel}</Text>
                <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={!mission.isCompleted || mission.isClaimed || claiming}
                    onPress={() => onClaim(mission)}
                    style={[
                        styles.claimButton,
                        (!mission.isCompleted || mission.isClaimed) && styles.claimButtonDisabled,
                    ]}
                >
                    {claiming ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={[
                            styles.claimButtonText,
                            (!mission.isCompleted || mission.isClaimed) && styles.claimButtonTextDisabled,
                        ]}>
                            {actionLabel}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const DailyMissionsScreen: React.FC = () => {
    const { t } = useLocalization();
    const { theme } = useTheme();
    const [data, setData] = useState<TodayDailyMissionsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState(Date.now());

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            setData(await getTodayDailyMissions());
        } catch (loadError) {
            setError(getErrorMessage(loadError, t('dailyMissions.loadError')));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useFocusEffect(useCallback(() => {
        load();
    }, [load]));

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const countdown = useMemo(() => {
        if (!data) return '--:--:--';
        return formatCountdown(new Date(data.resetsAt).getTime() - now);
    }, [data, now]);

    const handleClaim = useCallback(async (mission: UserDailyMissionDto) => {
        setClaimingId(mission.id);
        try {
            const result = await claimDailyMission(mission.id);
            setData(current => current ? {
                ...current,
                claimedCount: current.claimedCount + 1,
                wallet: result.wallet,
                missions: current.missions.map(item => item.id === mission.id ? result.mission : item),
            } : current);
            Alert.alert(t('dailyMissions.rewardReceived'), t('dailyMissions.rewardReceivedMessage', {
                amount: result.mission.rewardAmount,
                currency: result.mission.rewardType === 0 ? t('dailyMissions.gold') : t('dailyMissions.gem'),
            }));
        } catch (claimError) {
            Alert.alert(
                t('dailyMissions.claimErrorTitle'),
                getErrorMessage(claimError, t('dailyMissions.claimError')),
            );
        } finally {
            setClaimingId(null);
        }
    }, [t]);

    return (
        <AppLayout title={t('nav.dailyMissions')} iconPosition="left">
            <ScrollView
                style={[styles.container, { backgroundColor: theme.colors.background }]}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={(
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => load(true)}
                        tintColor={theme.colors.primaryDark}
                    />
                )}
            >
                <View style={styles.heroCard}>
                    <View style={styles.heroTopRow}>
                        <View>
                            <Text style={styles.heroEyebrow}>{t('dailyMissions.today')}</Text>
                            <Text style={styles.heroTitle}>{t('dailyMissions.title')}</Text>
                        </View>
                        <View style={styles.walletRow}>
                            <View style={styles.walletChip}>
                                <Image source={assetCoin} style={styles.walletImage} />
                                <Text style={styles.walletText}>{data?.wallet.coin ?? 0}</Text>
                            </View>
                            <View style={styles.walletChip}>
                                <Image source={assetGem} style={styles.walletImage} />
                                <Text style={styles.walletText}>{data?.wallet.gem ?? 0}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.heroBottomRow}>
                        <View style={styles.completionPill}>
                            <FontAwesome name="trophy" size={scale.ms(13)} color="#315E3B" />
                            <Text style={styles.completionText}>
                                {t('dailyMissions.completedCount', {
                                    completed: data?.completedCount ?? 0,
                                    total: data?.totalCount ?? 3,
                                })}
                            </Text>
                        </View>
                        <View style={styles.resetRow}>
                            <FontAwesome name="refresh" size={scale.ms(12)} color="#E9F7EC" />
                            <Text style={styles.resetText}>{t('dailyMissions.resetsIn', { time: countdown })}</Text>
                        </View>
                    </View>
                </View>

                {loading && !data ? (
                    <View style={styles.centerState}>
                        <ActivityIndicator size="large" color={theme.colors.primaryDark} />
                    </View>
                ) : error && !data ? (
                    <View style={styles.centerState}>
                        <FontAwesome name="exclamation-circle" size={scale.ms(34)} color={theme.colors.error} />
                        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
                            <Text style={styles.retryText}>{t('common.retry')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.missionList}>
                        {data?.missions.map(mission => (
                            <MissionCard
                                key={mission.id}
                                mission={mission}
                                claiming={claimingId === mission.id}
                                onClaim={handleClaim}
                            />
                        ))}
                    </View>
                )}

                <View style={[styles.tipCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <FontAwesome name="leaf" size={scale.ms(16)} color={theme.colors.primaryDark} />
                    <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>{t('dailyMissions.tip')}</Text>
                </View>
            </ScrollView>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: scale.s(16), paddingBottom: scale.vs(32) },
    heroCard: { backgroundColor: '#638A63', borderRadius: scale.s(18), padding: scale.s(18), marginBottom: scale.vs(18) },
    heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    heroEyebrow: { color: '#DDFBEA', fontSize: scale.ms(10), fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
    heroTitle: { color: '#FFFFFF', fontSize: scale.ms(24), fontWeight: '700', marginTop: scale.vs(3) },
    walletRow: { gap: scale.vs(6), alignItems: 'flex-end' },
    walletChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,.92)', borderRadius: 999, paddingHorizontal: scale.s(9), paddingVertical: scale.vs(4), minWidth: scale.s(66) },
    walletImage: { width: scale.s(18), height: scale.s(18), marginRight: scale.s(5) },
    walletText: { color: '#464E47', fontSize: scale.ms(12), fontWeight: '700' },
    heroBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: scale.vs(18) },
    completionPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DDFBEA', borderRadius: 999, paddingHorizontal: scale.s(10), paddingVertical: scale.vs(6) },
    completionText: { color: '#315E3B', fontSize: scale.ms(11), fontWeight: '700', marginLeft: scale.s(6) },
    resetRow: { flexDirection: 'row', alignItems: 'center' },
    resetText: { color: '#E9F7EC', fontSize: scale.ms(10), fontWeight: '600', marginLeft: scale.s(5) },
    missionList: { gap: scale.vs(12) },
    missionCard: { borderWidth: 1, borderRadius: scale.s(14), padding: scale.s(14) },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    missionIcon: { width: scale.s(40), height: scale.s(40), borderRadius: scale.s(12), alignItems: 'center', justifyContent: 'center', marginRight: scale.s(10) },
    cardTitleBlock: { flex: 1, minWidth: 0 },
    missionName: { fontSize: scale.ms(15), fontWeight: '700' },
    missionDescription: { fontSize: scale.ms(11), lineHeight: scale.ms(16), marginTop: scale.vs(3) },
    rewardChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8D9', borderRadius: 999, paddingHorizontal: scale.s(8), paddingVertical: scale.vs(4), marginLeft: scale.s(6) },
    rewardImage: { width: scale.s(18), height: scale.s(18), marginRight: scale.s(3) },
    rewardAmount: { color: '#725C16', fontSize: scale.ms(11), fontWeight: '800' },
    progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: scale.vs(13), marginBottom: scale.vs(6) },
    progressLabel: { fontSize: scale.ms(11), fontWeight: '500' },
    progressValue: { fontSize: scale.ms(11), fontWeight: '700' },
    progressTrack: { height: scale.vs(7), borderRadius: 999, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#638A63', borderRadius: 999 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: scale.vs(12) },
    rewardType: { fontSize: scale.ms(10), fontWeight: '600', textTransform: 'uppercase', letterSpacing: .5 },
    claimButton: { minWidth: scale.s(104), minHeight: scale.vs(34), paddingHorizontal: scale.s(12), borderRadius: scale.s(9), backgroundColor: '#464E47', alignItems: 'center', justifyContent: 'center' },
    claimButtonDisabled: { backgroundColor: '#EEF2EE' },
    claimButtonText: { color: '#FFFFFF', fontSize: scale.ms(11), fontWeight: '700' },
    claimButtonTextDisabled: { color: '#8A948C' },
    centerState: { minHeight: scale.vs(270), alignItems: 'center', justifyContent: 'center', paddingHorizontal: scale.s(24) },
    errorText: { textAlign: 'center', fontSize: scale.ms(13), lineHeight: scale.ms(19), marginTop: scale.vs(10) },
    retryButton: { backgroundColor: '#464E47', borderRadius: scale.s(8), paddingHorizontal: scale.s(18), paddingVertical: scale.vs(9), marginTop: scale.vs(12) },
    retryText: { color: '#FFFFFF', fontSize: scale.ms(12), fontWeight: '700' },
    tipCard: { flexDirection: 'row', alignItems: 'center', borderRadius: scale.s(12), padding: scale.s(13), marginTop: scale.vs(16) },
    tipText: { flex: 1, fontSize: scale.ms(11), lineHeight: scale.ms(16), marginLeft: scale.s(10) },
});

export default DailyMissionsScreen;
