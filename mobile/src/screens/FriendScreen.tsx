import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ListRenderItemInfo,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AppLayout from '../components/AppLayout';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';
import {
    FriendshipDto,
    PagedResultDto,
    acceptFriendRequest,
    cancelFriendRequest,
    declineFriendRequest,
    getFriendRequests,
    getFriends,
    getPendingFriends,
} from '../api/friendships';

type FriendTab = 'friends' | 'requests' | 'pending';
type LoadMode = 'reset' | 'more';

interface FriendTabState {
    items: FriendshipDto[];
    totalCount: number;
    loading: boolean;
    loadingMore: boolean;
    loaded: boolean;
}

const PAGE_SIZE = 20;
const INITIAL_LOADER_DELAY_MS = 250;

const TABS: Array<{ key: FriendTab; label: string }> = [
    { key: 'friends', label: 'Friends' },
    { key: 'requests', label: 'Requests' },
    { key: 'pending', label: 'Pending' },
];

const createInitialTabState = (): FriendTabState => ({
    items: [],
    totalCount: 0,
    loading: false,
    loadingMore: false,
    loaded: false,
});

const createInitialState = (): Record<FriendTab, FriendTabState> => ({
    friends: createInitialTabState(),
    requests: createInitialTabState(),
    pending: createInitialTabState(),
});

const fetchByTab = async (
    tab: FriendTab,
    skipCount: number,
): Promise<PagedResultDto<FriendshipDto>> => {
    const input = { skipCount, maxResultCount: PAGE_SIZE };

    if (tab === 'friends') {
        return getFriends(input);
    }

    if (tab === 'requests') {
        return getFriendRequests(input);
    }

    return getPendingFriends(input);
};

const formatItemTime = (item: FriendshipDto, tab: FriendTab): string => {
    const rawDate = tab === 'friends'
        ? item.lastModificationTime || item.creationTime
        : item.creationTime;
    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
        return 'Just Now';
    }

    const isSameDay =
        now.getFullYear() === date.getFullYear()
        && now.getMonth() === date.getMonth()
        && now.getDate() === date.getDate();

    if (isSameDay) {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
        yesterday.getFullYear() === date.getFullYear()
        && yesterday.getMonth() === date.getMonth()
        && yesterday.getDate() === date.getDate();

    if (isYesterday) {
        return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const FriendScreen = () => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<FriendTab>('friends');
    const [tabData, setTabData] = useState<Record<FriendTab, FriendTabState>>(createInitialState);
    const [showInitialLoader, setShowInitialLoader] = useState(false);
    const loadInFlightRef = useRef<Record<FriendTab, boolean>>({
        friends: false,
        requests: false,
        pending: false,
    });

    const activeState = tabData[activeTab];
    const shouldShowFullLoader = activeState.loading && activeState.items.length === 0 && showInitialLoader;

    const loadTab = useCallback(async (tab: FriendTab, mode: LoadMode) => {
        const current = tabData[tab];

        if (loadInFlightRef.current[tab] || current.loading || current.loadingMore) {
            return;
        }

        if (mode === 'more' && current.items.length >= current.totalCount) {
            return;
        }

        const skipCount = mode === 'reset' ? 0 : current.items.length;
        loadInFlightRef.current[tab] = true;

        setTabData(prev => ({
            ...prev,
            [tab]: {
                ...prev[tab],
                loading: mode === 'reset',
                loadingMore: mode === 'more',
            },
        }));

        try {
            const result = await fetchByTab(tab, skipCount);

            setTabData(prev => ({
                ...prev,
                [tab]: {
                    ...prev[tab],
                    items: mode === 'reset'
                        ? result.items
                        : [...prev[tab].items, ...result.items],
                    totalCount: result.totalCount,
                    loading: false,
                    loadingMore: false,
                    loaded: true,
                },
            }));
        } catch (error: any) {
            setTabData(prev => ({
                ...prev,
                [tab]: {
                    ...prev[tab],
                    loading: false,
                    loadingMore: false,
                    loaded: true,
                },
            }));

            Alert.alert('Error', error?.response?.data?.error?.message || 'Cant load friends');
        }
    }, [tabData]);

    useEffect(() => {
        TABS.forEach(({ key }) => {
            if (!tabData[key].loading && !tabData[key].loadingMore) {
                loadInFlightRef.current[key] = false;
            }
        });
    }, [tabData]);

    useEffect(() => {
        if (!activeState.loaded && !activeState.loading) {
            loadTab(activeTab, 'reset');
        }
    }, [activeState.loaded, activeState.loading, activeTab, loadTab]);

    useEffect(() => {
        setShowInitialLoader(false);

        const timer = setTimeout(() => {
            setShowInitialLoader(true);
        }, INITIAL_LOADER_DELAY_MS);

        return () => clearTimeout(timer);
    }, [activeTab]);

    const markTabStale = useCallback((tab: FriendTab) => {
        setTabData(prev => ({
            ...prev,
            [tab]: {
                ...prev[tab],
                loaded: false,
            },
        }));
    }, []);

    const removeItem = useCallback((tab: FriendTab, id: string) => {
        setTabData(prev => ({
            ...prev,
            [tab]: {
                ...prev[tab],
                items: prev[tab].items.filter(item => item.id !== id),
                totalCount: Math.max(prev[tab].totalCount - 1, 0),
            },
        }));
    }, []);

    const handleAccept = useCallback(async (item: FriendshipDto) => {
        try {
            await acceptFriendRequest(item.id);
            removeItem('requests', item.id);
            markTabStale('friends');
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.error?.message || 'Cant accept request');
        }
    }, [markTabStale, removeItem]);

    const handleDecline = useCallback(async (item: FriendshipDto) => {
        try {
            await declineFriendRequest(item.id);
            removeItem('requests', item.id);
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.error?.message || 'Cant decline request');
        }
    }, [removeItem]);

    const handleCancel = useCallback(async (item: FriendshipDto) => {
        try {
            await cancelFriendRequest(item.id);
            removeItem('pending', item.id);
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.error?.message || 'Cant cancel request');
        }
    }, [removeItem]);

    const handleLoadMore = useCallback(() => {
        loadTab(activeTab, 'more');
    }, [activeTab, loadTab]);

    const rightAction = useMemo(() => (
        <TouchableOpacity style={styles.headerAction} activeOpacity={0.7}>
            <Icon name="more-vertical" size={scale.ms(20)} color={theme.colors.primaryDark} />
        </TouchableOpacity>
    ), [theme.colors.primaryDark]);

    const renderAvatar = (item: FriendshipDto) => {
        if (item.otherUserAvatarBase64Content && item.otherUserAvatarContentType) {
            return (
                <Image
                    source={{
                        uri: `data:${item.otherUserAvatarContentType};base64,${item.otherUserAvatarBase64Content}`,
                    }}
                    style={styles.avatarImage}
                />
            );
        }

        return (
            <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                    {item.otherUserInitials || '?'}
                </Text>
            </View>
        );
    };

    const renderActions = (item: FriendshipDto) => {
        if (activeTab === 'requests') {
            return (
                <View style={styles.requestActions}>
                    <TouchableOpacity style={styles.requestActionButton} onPress={() => handleAccept(item)}>
                        <Icon name="check-circle" size={scale.ms(24)} color="#568259" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.requestActionButton} onPress={() => handleDecline(item)}>
                        <Icon name="x-circle" size={scale.ms(24)} color="#FF5A5F" />
                    </TouchableOpacity>
                </View>
            );
        }

        if (activeTab === 'pending') {
            return (
                <TouchableOpacity style={styles.pendingActionButton} onPress={() => handleCancel(item)}>
                    <Icon name="clock" size={scale.ms(20)} color="#7C847D" />
                </TouchableOpacity>
            );
        }

        return (
            <View style={styles.timeWrapper}>
                <Text style={styles.timeText}>{formatItemTime(item, activeTab)}</Text>
            </View>
        );
    };

    const renderItem = ({ item }: ListRenderItemInfo<FriendshipDto>) => (
        <View style={[
            styles.friendItem,
            activeTab === 'pending' ? styles.pendingItem : styles.activeItem,
        ]}>
            <View style={styles.avatar}>
                {renderAvatar(item)}
            </View>
            <Text numberOfLines={1} style={styles.friendName}>
                {item.otherUserDisplayName || item.otherUserName}
            </Text>
            {renderActions(item)}
        </View>
    );

    const emptyText = useMemo(() => {
        if (activeTab === 'friends') {
            return 'No friends yet';
        }

        if (activeTab === 'requests') {
            return 'No requests';
        }

        return 'No pending requests';
    }, [activeTab]);

    return (
        <AppLayout title="Friend" iconPosition="left" rightAction={rightAction}>
            <View style={styles.container}>
                <View style={styles.tabs}>
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key;

                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                                onPress={() => setActiveTab(tab.key)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {shouldShowFullLoader ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primaryDark} />
                    </View>
                ) : (
                    <FlatList
                        data={activeState.items}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={[
                            styles.listContent,
                            activeState.items.length === 0 && styles.emptyContent,
                        ]}
                        showsVerticalScrollIndicator={false}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.35}
                        ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
                        ListFooterComponent={
                            activeState.loadingMore ? (
                                <ActivityIndicator style={styles.footerLoader} color={theme.colors.primaryDark} />
                            ) : null
                        }
                    />
                )}

                <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
                    <Icon name="user-plus" size={scale.ms(16)} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add Friend</Text>
                </TouchableOpacity>
            </View>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: scale.s(12),
    },
    headerAction: {
        width: scale.s(40),
        height: scale.s(40),
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabs: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F1F4',
        borderRadius: scale.s(8),
        padding: scale.s(4),
        marginTop: scale.vs(4),
        marginBottom: scale.vs(12),
    },
    tabButton: {
        flex: 1,
        height: scale.vs(36),
        borderRadius: scale.s(6),
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabButtonActive: {
        backgroundColor: '#568259',
    },
    tabText: {
        fontSize: scale.ms(12),
        color: '#4A5A4D',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    listContent: {
        paddingBottom: scale.vs(96),
    },
    emptyContent: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    friendItem: {
        minHeight: scale.vs(56),
        borderRadius: scale.s(8),
        paddingHorizontal: scale.s(12),
        paddingVertical: scale.vs(10),
        marginBottom: scale.vs(10),
        flexDirection: 'row',
        alignItems: 'center',
    },
    activeItem: {
        backgroundColor: '#EEF6EC',
    },
    pendingItem: {
        backgroundColor: '#FAFBFA',
    },
    avatar: {
        width: scale.s(30),
        height: scale.s(30),
        borderRadius: scale.s(15),
        overflow: 'hidden',
        marginRight: scale.s(10),
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarFallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D8C8BD',
    },
    avatarInitials: {
        color: '#6A4F47',
        fontSize: scale.ms(11),
        fontWeight: '700',
    },
    friendName: {
        flex: 1,
        color: '#111814',
        fontSize: scale.ms(14),
        fontWeight: '700',
    },
    timeWrapper: {
        minWidth: scale.s(64),
        alignItems: 'flex-end',
    },
    timeText: {
        color: '#1D2A20',
        fontSize: scale.ms(9),
        fontWeight: '500',
    },
    requestActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale.s(8),
    },
    requestActionButton: {
        width: scale.s(30),
        height: scale.s(30),
        alignItems: 'center',
        justifyContent: 'center',
    },
    pendingActionButton: {
        width: scale.s(34),
        height: scale.s(34),
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerLoader: {
        paddingVertical: scale.vs(16),
    },
    emptyText: {
        color: '#7C847D',
        fontSize: scale.ms(14),
        fontWeight: '500',
    },
    addButton: {
        position: 'absolute',
        right: scale.s(12),
        bottom: scale.vs(28),
        height: scale.vs(48),
        borderRadius: scale.s(8),
        paddingHorizontal: scale.s(14),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#464E47',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
        elevation: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: scale.ms(12),
        fontWeight: '700',
        marginLeft: scale.s(8),
    },
});

export default FriendScreen;
