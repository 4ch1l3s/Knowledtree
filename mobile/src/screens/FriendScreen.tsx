import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    ListRenderItemInfo,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
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
    FriendCandidateDto,
    getFriendRequests,
    getFriends,
    getPendingFriends,
    searchFriendCandidates,
    sendFriendRequest,
} from '../api/friendships';
import { AppLanguage, useLocalization } from '../localization';

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

const formatItemTime = (
    item: FriendshipDto,
    tab: FriendTab,
    language: AppLanguage,
    justNow: string,
    yesterdayLabel: string,
): string => {
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
        return justNow;
    }

    const isSameDay =
        now.getFullYear() === date.getFullYear()
        && now.getMonth() === date.getMonth()
        && now.getDate() === date.getDate();

    if (isSameDay) {
        return date.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: 'numeric', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
        yesterday.getFullYear() === date.getFullYear()
        && yesterday.getMonth() === date.getMonth()
        && yesterday.getDate() === date.getDate();

    if (isYesterday) {
        return yesterdayLabel;
    }

    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' });
};

const FriendScreen = () => {
    const { theme } = useTheme();
    const { language, t } = useLocalization();
    const tabs = useMemo<Array<{ key: FriendTab; label: string }>>(() => [
        { key: 'friends', label: t('friends.tab.friends') },
        { key: 'requests', label: t('friends.tab.requests') },
        { key: 'pending', label: t('friends.tab.pending') },
    ], [t]);
    const [activeTab, setActiveTab] = useState<FriendTab>('friends');
    const [tabData, setTabData] = useState<Record<FriendTab, FriendTabState>>(createInitialState);
    const [showInitialLoader, setShowInitialLoader] = useState(false);
    const [isAddFriendVisible, setIsAddFriendVisible] = useState(false);
    const [candidateQuery, setCandidateQuery] = useState('');
    const [candidateResults, setCandidateResults] = useState<FriendCandidateDto[]>([]);
    const [candidateLoading, setCandidateLoading] = useState(false);
    const [candidateLoaded, setCandidateLoaded] = useState(false);
    const [candidateError, setCandidateError] = useState<string | null>(null);
    const [sendingCandidateId, setSendingCandidateId] = useState<string | null>(null);
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

            Alert.alert(t('common.error'), error?.response?.data?.error?.message || t('friends.loadError'));
        }
    }, [t, tabData]);

    useEffect(() => {
        tabs.forEach(({ key }) => {
            if (!tabData[key].loading && !tabData[key].loadingMore) {
                loadInFlightRef.current[key] = false;
            }
        });
    }, [tabData, tabs]);

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
            Alert.alert(t('common.error'), error?.response?.data?.error?.message || t('friends.acceptError'));
        }
    }, [markTabStale, removeItem, t]);

    const handleDecline = useCallback(async (item: FriendshipDto) => {
        try {
            await declineFriendRequest(item.id);
            removeItem('requests', item.id);
        } catch (error: any) {
            Alert.alert(t('common.error'), error?.response?.data?.error?.message || t('friends.declineError'));
        }
    }, [removeItem, t]);

    const handleCancel = useCallback(async (item: FriendshipDto) => {
        try {
            await cancelFriendRequest(item.id);
            removeItem('pending', item.id);
        } catch (error: any) {
            Alert.alert(t('common.error'), error?.response?.data?.error?.message || t('friends.cancelError'));
        }
    }, [removeItem, t]);

    const handleLoadMore = useCallback(() => {
        loadTab(activeTab, 'more');
    }, [activeTab, loadTab]);

    const openAddFriendModal = useCallback(() => {
        setCandidateQuery('');
        setCandidateResults([]);
        setCandidateLoaded(false);
        setCandidateError(null);
        setIsAddFriendVisible(true);
    }, []);

    const closeAddFriendModal = useCallback(() => {
        setIsAddFriendVisible(false);
        setCandidateLoading(false);
        setSendingCandidateId(null);
    }, []);

    const handleCandidateSearch = useCallback(async () => {
        const query = candidateQuery.trim();

        if (!query) {
            setCandidateResults([]);
            setCandidateLoaded(false);
            setCandidateError(null);
            return;
        }

        setCandidateLoading(true);
        setCandidateLoaded(false);
        setCandidateError(null);

        try {
            const results = await searchFriendCandidates(query);
            setCandidateResults(results);
            setCandidateLoaded(true);
        } catch (error: any) {
            setCandidateResults([]);
            setCandidateLoaded(true);
            setCandidateError(error?.response?.data?.error?.message || t('friends.searchError'));
        } finally {
            setCandidateLoading(false);
        }
    }, [candidateQuery, t]);

    const handleSendFriendRequest = useCallback(async (candidate: FriendCandidateDto) => {
        setSendingCandidateId(candidate.id);

        try {
            await sendFriendRequest(candidate.id);
            setCandidateResults(prev => prev.filter(item => item.id !== candidate.id));
            markTabStale('pending');
            Alert.alert(t('friends.requestSent'), t('friends.requestSentTo', { name: candidate.displayName || candidate.userName }));
        } catch (error: any) {
            Alert.alert(t('common.error'), error?.response?.data?.error?.message || t('friends.sendError'));
        } finally {
            setSendingCandidateId(null);
        }
    }, [markTabStale, t]);

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

    const renderCandidateAvatar = (candidate: FriendCandidateDto) => {
        if (candidate.avatarBase64Content && candidate.avatarContentType) {
            return (
                <Image
                    source={{
                        uri: `data:${candidate.avatarContentType};base64,${candidate.avatarBase64Content}`,
                    }}
                    style={styles.modalAvatarImage}
                />
            );
        }

        return (
            <View style={styles.modalAvatarFallback}>
                <Text style={styles.modalAvatarInitials}>
                    {candidate.initials || '?'}
                </Text>
            </View>
        );
    };

    const renderCandidateItem = ({ item }: ListRenderItemInfo<FriendCandidateDto>) => {
        const isSending = sendingCandidateId === item.id;

        return (
            <View style={styles.modalCandidateCard}>
                <View style={styles.modalAvatar}>
                    {renderCandidateAvatar(item)}
                </View>
                <View style={styles.modalCandidateText}>
                    <Text numberOfLines={1} style={styles.modalCandidateName}>
                        {item.displayName || item.userName}
                    </Text>
                    <Text numberOfLines={1} style={styles.modalCandidateUsername}>
                        @{item.userName}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.modalAddCandidateButton, isSending && styles.modalAddCandidateButtonBusy]}
                    onPress={() => handleSendFriendRequest(item)}
                    activeOpacity={0.75}
                    disabled={isSending}
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color="#464E47" />
                    ) : (
                        <Icon name="plus" size={scale.ms(26)} color="#464E47" />
                    )}
                </TouchableOpacity>
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
                <Text style={styles.timeText}>{formatItemTime(item, activeTab, language, t('friends.justNow'), t('friends.yesterday'))}</Text>
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
            return t('friends.emptyFriends');
        }

        if (activeTab === 'requests') {
            return t('friends.emptyRequests');
        }

        return t('friends.emptyPending');
    }, [activeTab, t]);

    return (
        <AppLayout title={t('friends.title')} iconPosition="left" rightAction={rightAction}>
            <View style={styles.container}>
                <View style={styles.tabs}>
                    {tabs.map(tab => {
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

                <TouchableOpacity style={styles.addButton} onPress={openAddFriendModal} activeOpacity={0.8}>
                    <Icon name="user-plus" size={scale.ms(16)} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>{t('friends.addFriend')}</Text>
                </TouchableOpacity>

                <Modal
                    visible={isAddFriendVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={closeAddFriendModal}
                >
                    <KeyboardAvoidingView
                        style={styles.modalOverlay}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    >
                        <Pressable style={styles.modalBackdrop} onPress={closeAddFriendModal}>
                            <Pressable style={styles.modalSurface} onPress={() => undefined}>
                                <Text style={styles.modalEyebrow}>{t('friends.addFriend')}</Text>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{t('friends.addFriend')}</Text>
                                    <TouchableOpacity
                                        style={styles.modalCloseButton}
                                        onPress={closeAddFriendModal}
                                        activeOpacity={0.75}
                                    >
                                        <Icon name="x" size={scale.ms(18)} color="#464E47" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalSearchBox}>
                                    <Icon name="search" size={scale.ms(25)} color="#747D74" />
                                    <TextInput
                                        value={candidateQuery}
                                        onChangeText={setCandidateQuery}
                                        placeholder={t('friends.searchPlaceholder')}
                                        placeholderTextColor="#A5AAA5"
                                        style={styles.modalSearchInput}
                                        returnKeyType="search"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        onSubmitEditing={handleCandidateSearch}
                                    />
                                </View>

                                <View style={styles.modalResults}>
                                    {candidateLoading ? (
                                        <View style={styles.modalStateRow}>
                                            <ActivityIndicator color="#464E47" />
                                        </View>
                                    ) : candidateError ? (
                                        <Text style={styles.modalStateText}>{candidateError}</Text>
                                    ) : candidateLoaded && candidateResults.length === 0 ? (
                                        <Text style={styles.modalStateText}>{t('friends.noMatches')}</Text>
                                    ) : (
                                        <FlatList
                                            data={candidateResults}
                                            keyExtractor={item => item.id}
                                            renderItem={renderCandidateItem}
                                            scrollEnabled={candidateResults.length > 3}
                                            showsVerticalScrollIndicator={false}
                                        />
                                    )}
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.modalSearchButton,
                                        (!candidateQuery.trim() || candidateLoading) && styles.modalSearchButtonDisabled,
                                    ]}
                                    onPress={handleCandidateSearch}
                                    activeOpacity={0.82}
                                    disabled={!candidateQuery.trim() || candidateLoading}
                                >
                                    <Text style={styles.modalSearchButtonText}>
                                        {t(candidateLoading ? 'friends.searching' : 'friends.search')}
                                    </Text>
                                </TouchableOpacity>
                            </Pressable>
                        </Pressable>
                    </KeyboardAvoidingView>
                </Modal>
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
    modalOverlay: {
        flex: 1,
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: scale.s(18),
        backgroundColor: 'rgba(17, 24, 20, 0.28)',
    },
    modalSurface: {
        width: '100%',
        maxHeight: '82%',
        borderWidth: 1.5,
        borderColor: '#4B574D',
        borderRadius: scale.s(24),
        paddingHorizontal: scale.s(22),
        paddingTop: scale.vs(28),
        paddingBottom: scale.vs(24),
        backgroundColor: '#E6EEE4',
    },
    modalEyebrow: {
        position: 'absolute',
        top: -scale.vs(18),
        left: scale.s(2),
        color: '#A5AAA5',
        fontSize: scale.ms(10),
        fontWeight: '500',
    },
    modalHeader: {
        minHeight: scale.vs(40),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: scale.vs(26),
    },
    modalTitle: {
        flex: 1,
        color: '#161F1A',
        fontSize: scale.ms(28),
        fontWeight: '800',
    },
    modalCloseButton: {
        width: scale.s(36),
        height: scale.s(36),
        borderRadius: scale.s(18),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.48)',
    },
    modalSearchBox: {
        minHeight: scale.vs(66),
        borderRadius: scale.s(16),
        paddingHorizontal: scale.s(16),
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    modalSearchInput: {
        flex: 1,
        minHeight: scale.vs(66),
        paddingVertical: 0,
        marginLeft: scale.s(12),
        color: '#161F1A',
        fontSize: scale.ms(20),
        fontWeight: '400',
    },
    modalResults: {
        minHeight: scale.vs(82),
        maxHeight: scale.vs(254),
        marginTop: scale.vs(28),
        marginBottom: scale.vs(24),
    },
    modalCandidateCard: {
        minHeight: scale.vs(76),
        borderRadius: scale.s(16),
        paddingHorizontal: scale.s(14),
        paddingVertical: scale.vs(12),
        marginBottom: scale.vs(12),
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    modalAvatar: {
        width: scale.s(46),
        height: scale.s(46),
        borderRadius: scale.s(23),
        overflow: 'hidden',
        marginRight: scale.s(14),
    },
    modalAvatarImage: {
        width: '100%',
        height: '100%',
    },
    modalAvatarFallback: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D8C8BD',
    },
    modalAvatarInitials: {
        color: '#6A4F47',
        fontSize: scale.ms(14),
        fontWeight: '800',
    },
    modalCandidateText: {
        flex: 1,
        minWidth: 0,
        marginRight: scale.s(12),
    },
    modalCandidateName: {
        color: '#161F1A',
        fontSize: scale.ms(18),
        fontWeight: '800',
    },
    modalCandidateUsername: {
        marginTop: scale.vs(2),
        color: '#7C847D',
        fontSize: scale.ms(11),
        fontWeight: '600',
    },
    modalAddCandidateButton: {
        width: scale.s(44),
        height: scale.s(44),
        borderRadius: scale.s(22),
        borderWidth: 2.5,
        borderColor: '#464E47',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    modalAddCandidateButtonBusy: {
        opacity: 0.6,
    },
    modalStateRow: {
        minHeight: scale.vs(76),
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalStateText: {
        minHeight: scale.vs(76),
        textAlign: 'center',
        textAlignVertical: 'center',
        color: '#7C847D',
        fontSize: scale.ms(13),
        fontWeight: '600',
    },
    modalSearchButton: {
        minHeight: scale.vs(58),
        borderRadius: scale.s(12),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#464E47',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
        elevation: 7,
    },
    modalSearchButtonDisabled: {
        opacity: 0.55,
    },
    modalSearchButtonText: {
        color: '#FFFFFF',
        fontSize: scale.ms(18),
        fontWeight: '800',
    },
});

export default FriendScreen;
