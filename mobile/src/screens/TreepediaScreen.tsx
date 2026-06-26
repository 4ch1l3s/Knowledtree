import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AppLayout from '../components/AppLayout';
import { getMyTrees, OwnedTreeDto } from '../api/store';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';
import { getRarityColor, getRarityLabel, resolveTreeImage } from '../utils/treeAssets';

const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || fallback;

const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleDateString();
};

const TreepediaScreen = () => {
    const { theme } = useTheme();
    const [trees, setTrees] = useState<OwnedTreeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalObtained = useMemo(
        () => trees.reduce((total, item) => total + item.totalObtainedCount, 0),
        [trees],
    );

    const loadTrees = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
        if (mode === 'initial') {
            setLoading(true);
        } else {
            setRefreshing(true);
        }

        setError(null);

        try {
            const result = await getMyTrees();
            setTrees(result);
        } catch (loadError: any) {
            setError(getErrorMessage(loadError, 'Cannot load Treepedia.'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadTrees();
    }, [loadTrees]);

    const renderTree = ({ item }: { item: OwnedTreeDto }) => {
        const rarityColor = getRarityColor(item.tree.rarity);

        return (
            <View style={styles.treeCard}>
                <View style={styles.treeImageWrap}>
                    <Image
                        source={resolveTreeImage(item.tree)}
                        style={styles.treeImage}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.treeInfo}>
                    <View style={styles.treeTitleRow}>
                        <Text numberOfLines={1} style={styles.treeName}>{item.tree.name}</Text>
                        <View style={[styles.rarityPill, { backgroundColor: rarityColor }]}>
                            <Text style={styles.rarityText}>{getRarityLabel(item.tree.rarity)}</Text>
                        </View>
                    </View>

                    <Text numberOfLines={2} style={styles.treeDescription}>
                        {item.tree.description || 'No description yet.'}
                    </Text>

                    <View style={styles.treeMetaRow}>
                        <Text style={styles.treeMetaText}>Owned x{item.totalObtainedCount}</Text>
                        <Text style={styles.treeMetaText}>{formatDate(item.firstObtainedAt)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
                <Icon name="book-open" size={scale.ms(30)} color="#3B653F" />
            </View>
            <Text style={styles.emptyTitle}>No trees yet</Text>
            <Text style={styles.emptyText}>Complete a focus session to add your first tree.</Text>
        </View>
    );

    return (
        <AppLayout title="Treepedia" iconPosition="left">
            <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{trees.length}</Text>
                        <Text style={styles.summaryLabel}>Unique trees</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{totalObtained}</Text>
                        <Text style={styles.summaryLabel}>Total owned</Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator color="#3B653F" size="large" />
                        <Text style={styles.loadingText}>Loading Treepedia...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconWrap}>
                            <Icon name="alert-circle" size={scale.ms(30)} color="#B42318" />
                        </View>
                        <Text style={styles.emptyTitle}>Cannot load trees</Text>
                        <Text style={styles.emptyText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => loadTrees('initial')}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={trees}
                        keyExtractor={item => item.id}
                        renderItem={renderTree}
                        contentContainerStyle={[
                            styles.listContent,
                            trees.length === 0 && styles.listContentEmpty,
                        ]}
                        ListEmptyComponent={renderEmpty}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => loadTrees('refresh')}
                                tintColor="#3B653F"
                            />
                        }
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        paddingHorizontal: scale.s(18),
        paddingTop: scale.vs(16),
    },
    summaryRow: {
        minHeight: scale.vs(86),
        borderRadius: scale.s(16),
        borderWidth: 1,
        borderColor: '#DCE5DB',
        marginBottom: scale.vs(16),
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3FCF2',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryValue: {
        color: '#3B653F',
        fontSize: scale.ms(28),
        fontWeight: '800',
        lineHeight: scale.ms(34),
    },
    summaryLabel: {
        marginTop: scale.vs(4),
        color: '#424940',
        fontSize: scale.ms(12),
        fontWeight: '700',
        lineHeight: scale.ms(16),
    },
    summaryDivider: {
        width: 1,
        height: scale.vs(46),
        backgroundColor: '#DCE5DB',
    },
    loadingState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: scale.vs(12),
        color: '#424940',
        fontSize: scale.ms(13),
        fontWeight: '700',
    },
    listContent: {
        paddingBottom: scale.vs(24),
        gap: scale.vs(12),
    },
    listContentEmpty: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    treeCard: {
        minHeight: scale.vs(124),
        borderRadius: scale.s(16),
        borderWidth: 1,
        borderColor: '#DCE5DB',
        padding: scale.s(12),
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
    },
    treeImageWrap: {
        width: scale.s(96),
        borderRadius: scale.s(14),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF6EC',
    },
    treeImage: {
        width: scale.s(82),
        height: scale.vs(92),
    },
    treeInfo: {
        flex: 1,
        marginLeft: scale.s(12),
        justifyContent: 'space-between',
    },
    treeTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale.s(8),
    },
    treeName: {
        flex: 1,
        color: '#161D18',
        fontSize: scale.ms(16),
        fontWeight: '800',
        lineHeight: scale.ms(22),
    },
    rarityPill: {
        minHeight: scale.vs(24),
        borderRadius: scale.s(999),
        paddingHorizontal: scale.s(10),
        alignItems: 'center',
        justifyContent: 'center',
    },
    rarityText: {
        color: '#FFFFFF',
        fontSize: scale.ms(10),
        fontWeight: '800',
        lineHeight: scale.ms(14),
    },
    treeDescription: {
        marginTop: scale.vs(8),
        color: '#59625A',
        fontSize: scale.ms(12),
        fontWeight: '600',
        lineHeight: scale.ms(17),
    },
    treeMetaRow: {
        marginTop: scale.vs(10),
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: scale.s(8),
    },
    treeMetaText: {
        color: '#3B653F',
        fontSize: scale.ms(12),
        fontWeight: '800',
        lineHeight: scale.ms(16),
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: scale.s(24),
    },
    emptyIconWrap: {
        width: scale.s(72),
        height: scale.s(72),
        borderRadius: scale.s(36),
        borderWidth: 1,
        borderColor: '#D4E2D2',
        marginBottom: scale.vs(18),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E8F6E8',
    },
    emptyTitle: {
        color: '#161D18',
        fontSize: scale.ms(18),
        fontWeight: '800',
        lineHeight: scale.ms(26),
        textAlign: 'center',
    },
    emptyText: {
        width: scale.s(250),
        marginTop: scale.vs(8),
        color: '#424940',
        fontSize: scale.ms(13),
        fontWeight: '600',
        lineHeight: scale.ms(19),
        textAlign: 'center',
    },
    retryButton: {
        minHeight: scale.vs(42),
        borderRadius: scale.s(10),
        marginTop: scale.vs(16),
        paddingHorizontal: scale.s(18),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#B42318',
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: scale.ms(13),
        fontWeight: '800',
        lineHeight: scale.ms(18),
    },
});

export default TreepediaScreen;
