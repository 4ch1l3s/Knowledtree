import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ListRenderItemInfo,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import {
    PlantingSessionHistoryItemDto,
    getPlantingSessionHistory,
} from '../api/plantingSessions';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';
import { resolveTreeImage } from '../utils/treeAssets';

type LoadMode = 'reset' | 'more';

const PAGE_SIZE = 30;
const TIMELINE_COLOR = '#568259';
const BODY_TEXT_COLOR = '#7E8897';
const CARD_BORDER_COLOR = '#EEF1EF';
const FALLBACK_TAG_COLOR = '#6F7C75';
const TIMELINE_COLUMN_WIDTH = 0;
const TIMELINE_DOT_SIZE = scale.s(10);
const TIMELINE_LINE_WIDTH = scale.s(2);
const TIMELINE_ROW_GAP = scale.vs(8);
const SESSION_CARD_MIN_HEIGHT = scale.vs(86);
const TIMELINE_DOT_CENTER_TOP = Math.round(SESSION_CARD_MIN_HEIGHT / 2);

const parseDate = (value?: string | null): Date | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const pad2 = (value: number) => value.toString().padStart(2, '0');

const formatDate = (date: Date | null) => {
    if (!date) {
        return '--/--/----';
    }

    return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
};

const formatTime = (date: Date | null) => {
    if (!date) {
        return '--:--';
    }

    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const getSessionStartDate = (item: PlantingSessionHistoryItemDto) =>
    parseDate(item.clientStartTime) || parseDate(item.serverStartTime);

const getSessionEndDate = (item: PlantingSessionHistoryItemDto) =>
    parseDate(item.clientEndTime) || parseDate(item.serverEndTime);

const getDurationMinutes = (
    item: PlantingSessionHistoryItemDto,
    startDate: Date | null,
    endDate: Date | null,
) => {
    if (startDate && endDate) {
        return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
    }

    return item.plannedDurationMinutes;
};

const HistoryScreen = () => {
    const { theme } = useTheme();
    const [items, setItems] = useState<PlantingSessionHistoryItemDto[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const loadInFlightRef = useRef(false);

    const loadHistory = useCallback(async (mode: LoadMode) => {
        if (loadInFlightRef.current || loading || loadingMore) {
            return;
        }

        if (mode === 'more' && loaded && items.length >= totalCount) {
            return;
        }

        const skipCount = mode === 'reset' ? 0 : items.length;
        loadInFlightRef.current = true;

        if (mode === 'reset') {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const result = await getPlantingSessionHistory({
                skipCount,
                maxResultCount: PAGE_SIZE,
            });

            setItems(prev => (
                mode === 'reset'
                    ? result.items
                    : [...prev, ...result.items]
            ));
            setTotalCount(result.totalCount);
            setLoaded(true);
        } catch (error: any) {
            setLoaded(true);
            Alert.alert('Error', error?.response?.data?.error?.message || 'Cant load history');
        } finally {
            loadInFlightRef.current = false;
            setLoading(false);
            setLoadingMore(false);
        }
    }, [items.length, loaded, loading, loadingMore, totalCount]);

    useEffect(() => {
        if (!loaded && !loading) {
            loadHistory('reset');
        }
    }, [loaded, loading, loadHistory]);

    const handleLoadMore = useCallback(() => {
        loadHistory('more');
    }, [loadHistory]);

    const renderHistoryItem = useCallback(({ item, index }: ListRenderItemInfo<PlantingSessionHistoryItemDto>) => {
        const startDate = getSessionStartDate(item);
        const endDate = getSessionEndDate(item);
        const durationMinutes = getDurationMinutes(item, startDate, endDate);
        const tagColor = item.tag?.colorCode || FALLBACK_TAG_COLOR;
        const tagName = item.tag?.name || 'Focus session';
        const isTerminalItem = index === items.length - 1 && items.length >= totalCount;

        return (
            <View style={styles.timelineRow}>
                <View pointerEvents="none" style={styles.timelineColumn}>
                    <View style={[styles.timelineSegment, styles.timelineSegmentTop]} />
                    <View
                        style={[
                            styles.timelineSegment,
                            styles.timelineSegmentBottom,
                            isTerminalItem && styles.timelineSegmentTerminal,
                        ]}
                    />
                    <View style={styles.timelineDot} />
                </View>

                <View style={styles.sessionCard}>
                    <View style={styles.treeFrame}>
                        <Image
                            source={resolveTreeImage(item.resultTree)}
                            style={styles.treeImage}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.sessionContent}>
                        <Text style={styles.sessionDate}>{formatDate(startDate)}</Text>
                        <Text style={styles.sessionTime}>
                            {formatTime(startDate)} - {formatTime(endDate)} ({durationMinutes} mins)
                        </Text>
                        <View style={styles.tagRow}>
                            <View style={[styles.tagDot, { backgroundColor: tagColor }]} />
                            <Text numberOfLines={1} style={styles.tagName}>
                                {tagName}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }, [items.length, totalCount]);

    return (
        <AppLayout title="Timeline" iconPosition="left">
            <View style={styles.container}>
                {loading && items.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primaryDark} />
                    </View>
                ) : (
                    <FlatList
                        data={items}
                        keyExtractor={item => item.id}
                        renderItem={renderHistoryItem}
                        contentContainerStyle={[
                            styles.listContent,
                            items.length === 0 && styles.emptyContent,
                        ]}
                        showsVerticalScrollIndicator={false}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.35}
                        ListEmptyComponent={<Text style={styles.emptyText}>No completed sessions yet</Text>}
                        ListFooterComponent={
                            loadingMore ? (
                                <ActivityIndicator style={styles.footerLoader} color={theme.colors.primaryDark} />
                            ) : null
                        }
                    />
                )}
            </View>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F2F1',
    },
    listContent: {
        paddingTop: scale.vs(16),
        paddingLeft: scale.s(36),
        paddingRight: scale.s(16),
        paddingBottom: scale.vs(28),
    },
    emptyContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingLeft: scale.s(16),
    },
    timelineRow: {
        flexDirection: 'row',
        minHeight: SESSION_CARD_MIN_HEIGHT + TIMELINE_ROW_GAP,
    },
    timelineColumn: {
        width: TIMELINE_COLUMN_WIDTH,
        alignSelf: 'stretch',
        position: 'relative',
        overflow: 'visible',
        zIndex: 2,
    },
    timelineSegment: {
        position: 'absolute',
        left: -TIMELINE_LINE_WIDTH / 2,
        width: TIMELINE_LINE_WIDTH,
        backgroundColor: TIMELINE_COLOR,
    },
    timelineSegmentTop: {
        top: 0,
        height: TIMELINE_DOT_CENTER_TOP,
    },
    timelineSegmentBottom: {
        top: TIMELINE_DOT_CENTER_TOP,
        bottom: 0,
    },
    timelineSegmentTerminal: {
        bottom: TIMELINE_ROW_GAP,
    },
    timelineDot: {
        position: 'absolute',
        left: -TIMELINE_DOT_SIZE / 2,
        top: TIMELINE_DOT_CENTER_TOP - TIMELINE_DOT_SIZE / 2,
        width: TIMELINE_DOT_SIZE,
        height: TIMELINE_DOT_SIZE,
        borderRadius: TIMELINE_DOT_SIZE / 2,
        backgroundColor: TIMELINE_COLOR,
    },
    sessionCard: {
        flex: 1,
        minHeight: SESSION_CARD_MIN_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: CARD_BORDER_COLOR,
        backgroundColor: '#FFFFFF',
        paddingLeft: scale.s(18),
        paddingRight: scale.s(12),
        paddingVertical: scale.vs(10),
        marginBottom: TIMELINE_ROW_GAP,
    },
    treeFrame: {
        width: scale.s(44),
        height: scale.s(44),
        borderWidth: 1,
        borderColor: '#7FA27F',
        backgroundColor: '#F7FAF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: scale.s(28),
    },
    treeImage: {
        width: scale.s(38),
        height: scale.s(38),
    },
    sessionContent: {
        flex: 1,
        minWidth: 0,
    },
    sessionDate: {
        fontSize: scale.ms(14),
        fontWeight: '500',
        color: BODY_TEXT_COLOR,
        marginBottom: scale.vs(6),
    },
    sessionTime: {
        fontSize: scale.ms(13),
        color: BODY_TEXT_COLOR,
        marginBottom: scale.vs(6),
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagDot: {
        width: scale.s(11),
        height: scale.s(11),
        borderRadius: scale.s(6),
        marginRight: scale.s(10),
    },
    tagName: {
        flex: 1,
        fontSize: scale.ms(13),
        fontWeight: '700',
        color: '#747C89',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        textAlign: 'center',
        fontSize: scale.ms(14),
        color: BODY_TEXT_COLOR,
    },
    footerLoader: {
        marginTop: scale.vs(8),
        marginBottom: scale.vs(14),
    },
});

export default HistoryScreen;
