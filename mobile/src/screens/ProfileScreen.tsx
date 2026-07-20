import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    View,
    Text,
    StyleSheet,
    ScrollView,
    StatusBar,
    TouchableOpacity,
    TextStyle,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';
import AvatarPicker from '../components/AvatarPicker';
import AppDrawer from '../components/AppDrawer';
import { getMyWallet, getTreepedia } from '../api/store';
import {
    PlantingSessionHistoryItemDto,
    getPlantingSessionHistory,
} from '../api/plantingSessions';
import { AppLanguage, useLocalization } from '../localization';

// ── Màu từ Figma ──
const GREEN_BG = '#568259';
const BODY_BG = '#F3FCF2';
const HEADER_TEXT = '#3D5A40';
const CARD_BORDER = '#C1C9BE';
const SCREEN_HEIGHT = Dimensions.get('window').height;
const GREEN_HEIGHT = SCREEN_HEIGHT * 0.30;
const HISTORY_PAGE_SIZE = 100;
const HEATMAP_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface ProfileStats {
    treesUnlocked: number;
    coin: number;
    focusSeconds: number;
    streakDays: number;
    heatmapData: number[];
}

const EMPTY_PROFILE_STATS: ProfileStats = {
    treesUnlocked: 0,
    coin: 0,
    focusSeconds: 0,
    streakDays: 0,
    heatmapData: Array.from({ length: HEATMAP_DAYS }, () => 0),
};

// ── Màu heatmap ──
const HEATMAP_COLORS: Record<number, string> = {
    0: '#D5E8D4',
    1: '#A5D6A7',
    2: '#568259',
    3: '#2E5732',
};

const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || fallback;

const parseDate = (value?: string | null): Date | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const pad2 = (value: number) => value.toString().padStart(2, '0');

const getDateKey = (date: Date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const startOfLocalDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) =>
    new Date(date.getTime() + days * MS_PER_DAY);

const getSessionEndDate = (item: PlantingSessionHistoryItemDto) =>
    parseDate(item.serverEndTime) || parseDate(item.clientEndTime);

const getSessionDurationSeconds = (item: PlantingSessionHistoryItemDto) => {
    const startDate = parseDate(item.serverStartTime) || parseDate(item.clientStartTime);
    const endDate = getSessionEndDate(item);

    if (startDate && endDate) {
        return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 1000));
    }

    return item.requiredFocusDurationSeconds || item.plannedDurationMinutes * 60;
};

const getHeatmapLevel = (seconds: number) => {
    const minutes = seconds / 60;

    if (minutes <= 0) {
        return 0;
    }

    if (minutes < 30) {
        return 1;
    }

    if (minutes < 90) {
        return 2;
    }

    return 3;
};

const getSessionDayTotals = (history: PlantingSessionHistoryItemDto[]) => {
    const totalsByDay = new Map<string, number>();

    history.forEach(item => {
        const endDate = getSessionEndDate(item);
        if (!endDate) {
            return;
        }

        const key = getDateKey(endDate);
        totalsByDay.set(key, (totalsByDay.get(key) || 0) + getSessionDurationSeconds(item));
    });

    return totalsByDay;
};

const buildHeatmapData = (history: PlantingSessionHistoryItemDto[]) => {
    const totalsByDay = getSessionDayTotals(history);
    const today = startOfLocalDay(new Date());
    const firstDay = addDays(today, -(HEATMAP_DAYS - 1));

    return Array.from({ length: HEATMAP_DAYS }, (_, index) => {
        const key = getDateKey(addDays(firstDay, index));
        return getHeatmapLevel(totalsByDay.get(key) || 0);
    });
};

const getCurrentStreakDays = (history: PlantingSessionHistoryItemDto[]) => {
    const activeDays = new Set<string>();

    history.forEach(item => {
        const endDate = getSessionEndDate(item);
        if (endDate) {
            activeDays.add(getDateKey(endDate));
        }
    });

    const today = startOfLocalDay(new Date());
    const yesterday = addDays(today, -1);
    let cursor: Date | null = null;

    if (activeDays.has(getDateKey(today))) {
        cursor = today;
    } else if (activeDays.has(getDateKey(yesterday))) {
        cursor = yesterday;
    }

    if (!cursor) {
        return 0;
    }

    let streak = 0;
    while (activeDays.has(getDateKey(cursor))) {
        streak += 1;
        cursor = addDays(cursor, -1);
    }

    return streak;
};

const loadAllHistory = async () => {
    const history: PlantingSessionHistoryItemDto[] = [];
    let skipCount = 0;
    let totalCount = Number.POSITIVE_INFINITY;

    while (history.length < totalCount) {
        const page = await getPlantingSessionHistory({
            skipCount,
            maxResultCount: HISTORY_PAGE_SIZE,
        });

        history.push(...page.items);
        totalCount = page.totalCount;
        skipCount += page.items.length;

        if (page.items.length === 0) {
            break;
        }
    }

    return history;
};

const getLocale = (language: AppLanguage) => language === 'vi' ? 'vi-VN' : 'en-US';

const formatNumber = (value: number, language: AppLanguage) =>
    Math.round(value).toLocaleString(getLocale(language));

const formatFocusHours = (seconds: number, language: AppLanguage, hourUnit: string) => {
    if (seconds <= 0) {
        return `0 ${hourUnit}`;
    }

    const hours = seconds / 3600;
    if (hours < 1) {
        return `<1 ${hourUnit}`;
    }

    if (hours < 10) {
        return `${Number(hours.toFixed(1)).toLocaleString(getLocale(language))} ${hourUnit}`;
    }

    return `${Math.round(hours).toLocaleString(getLocale(language))} ${hourUnit}`;
};

const formatStreak = (days: number, dayLabel: string, daysLabel: string) =>
    `${days} ${days === 1 ? dayLabel : daysLabel}`;

// ── Thẻ thống kê ──
interface StatCardProps {
    iconName: string;
    value: string;
    label: string;
}

const StatCard: React.FC<StatCardProps> = ({ iconName, value, label }) => (
    <View style={styles.statCard}>
        <FontAwesome name={iconName} size={scale.ms(16)} color={GREEN_BG} style={styles.statIcon} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// ── Heatmap (tự fill ngang) ──
interface HeatmapProps {
    data: number[];
    loading?: boolean;
}

interface HeatmapCellProps {
    level: number;
    size: number;
}

const HeatmapCell: React.FC<HeatmapCellProps> = ({ level, size }) => {
    const cellStyle = useMemo(() => ({
        width: size,
        height: size,
        borderRadius: scale.s(2),
        backgroundColor: level >= 0 ? HEATMAP_COLORS[level] : 'transparent',
    }), [level, size]);

    return <View style={cellStyle} />;
};

const Heatmap: React.FC<HeatmapProps> = ({ data, loading = false }) => {
    const { t } = useLocalization();
    const containerPadding = scale.s(16);
    const marginH = scale.s(16);
    const screenWidth = Dimensions.get('window').width;
    const availableWidth = screenWidth - (marginH * 2) - (containerPadding * 2);

    const rows = 7;
    const cols = Math.ceil(data.length / rows);
    const gap = scale.s(3);
    const cellSize = Math.floor((availableWidth - (cols - 1) * gap) / cols);

    const grid: number[][] = [];
    for (let col = 0; col < cols; col++) {
        const column: number[] = [];
        for (let row = 0; row < rows; row++) {
            const idx = col * rows + row;
            column.push(idx < data.length ? data[idx] : -1);
        }
        grid.push(column);
    }

    return (
        <View style={[styles.heatmapContainer, { padding: containerPadding }]}>
            <View style={styles.heatmapHeader}>
                <Text style={styles.heatmapTitle}>{t('profile.heatmap')}</Text>
                {loading ? (
                    <ActivityIndicator size="small" color={GREEN_BG} />
                ) : (
                    <FontAwesome name="info-circle" size={scale.ms(14)} color="#888" />
                )}
            </View>
            <View style={[styles.heatmapGrid, { gap }]}>
                {grid.map((column, colIdx) => (
                    <View key={colIdx} style={{ gap }}>
                        {column.map((level, rowIdx) => (
                            <HeatmapCell key={rowIdx} level={level} size={cellSize} />
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
};

// ── Khoảng lấn của stat cards vào phần xanh ──
const CARD_OVERLAP = scale.vs(35);

const ProfileScreen = () => {
    const { logout, userInfo, avatar, setAvatar } = useContext(AuthContext);
    const { isDark } = useTheme();
    const { language, t } = useLocalization();
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
    const [profileStats, setProfileStats] = useState<ProfileStats>(EMPTY_PROFILE_STATS);
    const [statsLoading, setStatsLoading] = useState(true);

    const displayName = userInfo?.name || userInfo?.userName || t('common.user');
    const avatarSize = scale.s(80);
    const statValues = useMemo(() => ({
        treesUnlocked: statsLoading ? '...' : formatNumber(profileStats.treesUnlocked, language),
        coin: statsLoading ? '...' : `${formatNumber(profileStats.coin, language)}`,
        focusHours: statsLoading ? '...' : formatFocusHours(profileStats.focusSeconds, language, t('profile.hourShort')),
        streak: statsLoading ? '...' : formatStreak(profileStats.streakDays, t('profile.day'), t('profile.days')),
    }), [language, profileStats, statsLoading, t]);

    useEffect(() => {
        let isMounted = true;

        const loadProfileStats = async () => {
            setStatsLoading(true);

            try {
                const [wallet, treepedia, history] = await Promise.all([
                    getMyWallet(),
                    getTreepedia(),
                    loadAllHistory(),
                ]);

                if (!isMounted) {
                    return;
                }

                setProfileStats({
                    treesUnlocked: treepedia.filter(entry => entry.isUnlocked).length,
                    coin: wallet.coin,
                    focusSeconds: history.reduce(
                        (total, item) => total + getSessionDurationSeconds(item),
                        0,
                    ),
                    streakDays: getCurrentStreakDays(history),
                    heatmapData: buildHeatmapData(history),
                });
            } catch (error: any) {
                if (isMounted) {
                    Alert.alert(t('profile.loadErrorTitle'), getErrorMessage(error, t('grow.tryAgain')));
                }
            } finally {
                if (isMounted) {
                    setStatsLoading(false);
                }
            }
        };

        loadProfileStats();

        return () => {
            isMounted = false;
        };
    }, [t]);

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="#FFFFFF" />

            {/* ── Header trắng: menu + "Profile" xanh ── */}
            <View style={styles.headerBar}>
                <TouchableOpacity
                    onPress={() => setIsDrawerOpen(true)}
                    style={styles.menuButton}
                >
                    <FontAwesome name="navicon" size={scale.ms(20)} color={HEADER_TEXT} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('nav.profile')}</Text>
                <View style={styles.menuButton} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                {/* ── Phần xanh: avatar + tên ── */}
                <View style={styles.greenSection}>
                    <View style={styles.avatarArea}>
                        <View style={styles.avatarRing}>
                            <AvatarPicker
                                avatar={avatar}
                                displayName={displayName}
                                size={avatarSize}
                                onAvatarChanged={(newAvatar) => setAvatar(newAvatar)}
                            />
                        </View>
                        <Text style={styles.displayName}>{displayName}</Text>
                    </View>
                </View>

                {/* ── Body: nền #F3FCF2, kéo dài tới chân trang ── */}
                <View style={styles.bodySection}>
                    {/* Grid 2x2 - kéo lên lấn vào vùng xanh */}
                    <View style={[styles.statsGrid, { marginTop: -CARD_OVERLAP }]}>
                        <View style={styles.statsRow}>
                            <StatCard iconName="tree" value={statValues.treesUnlocked} label={t('profile.treesUnlocked')} />
                            <StatCard iconName="money" value={statValues.coin} label={t('profile.coin')} />
                        </View>
                        <View style={styles.statsRow}>
                            <StatCard iconName="clock-o" value={statValues.focusHours} label={t('profile.focusHours')} />
                            <StatCard iconName="fire" value={statValues.streak} label={t('profile.streak')} />
                        </View>
                    </View>

                    {/* Heatmap */}
                    <Heatmap data={profileStats.heatmapData} loading={statsLoading} />
                </View>
            </ScrollView>

            {/* Drawer */}
            <AppDrawer
                isVisible={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onLogout={logout}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },

    // ── Header: nền trắng, chữ xanh ──
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale.s(16),
        paddingVertical: scale.vs(10),
        backgroundColor: '#FFFFFF',
    },
    menuButton: {
        width: scale.s(40),
        height: scale.s(40),
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: scale.ms(18),
        fontWeight: '500' as TextStyle['fontWeight'],
        color: HEADER_TEXT,
    },

    // ── Phần xanh ──
    greenSection: {
        backgroundColor: GREEN_BG,
        alignItems: 'center',
        paddingTop: scale.vs(16),
        minHeight: GREEN_HEIGHT,
        justifyContent: 'center',
    },
    avatarArea: {
        alignItems: 'center',
        marginTop: -scale.vs(8),
    },
    avatarRing: {
        padding: scale.s(3),
        borderRadius: 9999,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        backgroundColor: 'transparent',
    },
    displayName: {
        fontSize: scale.ms(20),
        fontWeight: '600' as TextStyle['fontWeight'],
        color: '#FFFFFF',
        marginTop: scale.vs(14),
    },

    // ── Body nền #F3FCF2, fill tới chân ──
    bodySection: {
        flex: 1,
        backgroundColor: BODY_BG,
        paddingTop: scale.vs(4),
        paddingBottom: scale.vs(32),
    },

    // ── Stats ──
    statsGrid: {
        paddingHorizontal: scale.s(16),
        gap: scale.s(12),
    },
    statsRow: {
        flexDirection: 'row',
        gap: scale.s(12),
    },
    statCard: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: CARD_BORDER,
        borderRadius: scale.s(12),
        paddingVertical: scale.vs(14),
        paddingHorizontal: scale.s(12),
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    statIcon: {
        marginBottom: scale.vs(6),
    },
    statValue: {
        fontSize: scale.ms(22),
        fontWeight: '700' as TextStyle['fontWeight'],
        color: '#2D2D2D',
    },
    statLabel: {
        fontSize: scale.ms(11),
        fontWeight: '400' as TextStyle['fontWeight'],
        marginTop: scale.vs(2),
        color: '#666',
    },

    // ── Heatmap ──
    heatmapContainer: {
        marginHorizontal: scale.s(16),
        marginTop: scale.vs(16),
        borderWidth: 1.5,
        borderColor: CARD_BORDER,
        borderRadius: scale.s(12),
        backgroundColor: '#FFFFFF',
    },
    heatmapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: scale.vs(12),
    },
    heatmapTitle: {
        fontSize: scale.ms(14),
        fontWeight: '600' as TextStyle['fontWeight'],
        color: '#2D2D2D',
    },
    heatmapGrid: {
        flexDirection: 'row',
    },
});

export default ProfileScreen;
