import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    AppState,
    Easing,
    GestureResponderEvent,
    Image,
    KeyboardAvoidingView,
    Modal,
    NativeModules,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Svg, { Circle } from 'react-native-svg';
import AppLayout from '../components/AppLayout';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';
import {
    createTag,
    getMyTags,
    TagDto,
} from '../api/tags';
import {
    getMySeedPackages,
    SeedPackageDto,
} from '../api/store';
import {
    CompletePlantingSessionResultDto,
    PlantingSessionDto,
    completePlantingSession,
    failPlantingSession,
    getActivePlantingSession,
    startPlantingSession,
} from '../api/plantingSessions';
import { resolveSeedPackageImage } from '../utils/seedPackageAssets';
import { getRarityColor, resolveTreeImage } from '../utils/treeAssets';
import { useLocalization } from '../localization';
import { useStrictMode } from '../context/StrictModeContext';

const dirtAsset = require('../assets/dirt-asset.png');
const minorTreeAsset = require('../assets/trees/asset_minor_tree.png');
const { ScreenAwake } = NativeModules;

const STEP_MINUTES = 5;
const MIN_MINUTES = 30;
const MAX_MINUTES = 180;
const INITIAL_MINUTES = MIN_MINUTES;
const VALUE_STEP_COUNT = (MAX_MINUTES - MIN_MINUTES) / STEP_MINUTES;
const RING_SIZE = scale.s(240);
const RING_RADIUS = RING_SIZE / 2;
const STROKE_WIDTH = scale.s(16);
const KNOB_SIZE = scale.s(28);
const KNOB_RADIUS = RING_RADIUS - STROKE_WIDTH / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * KNOB_RADIUS;
const PROGRESS_COLOR = '#3B653F';
const TRACK_COLOR = '#DCE5DB';
const SEAM_LOCK_DEGREES = 90;
const PLOT_TOUCH_SIZE = RING_SIZE - scale.s(60);
const PLOT_TOUCH_RADIUS = PLOT_TOUCH_SIZE / 2;
const SEEDLING_SIZE = scale.s(92);
const SEED_MODAL_TARGET_HEIGHT = scale.vs(646);
const ACTIVE_PLANTING_SESSION_CODE = 'Knowledtree:TreeStore:00010';
const PLANTING_SESSION_NOT_READY_CODE = 'Knowledtree:TreeStore:00012';
const ACTIVE_SESSION_ID_KEY = '@knowledtree/activePlantingSessionId';
const PENDING_FAILED_SESSION_ID_KEY = '@knowledtree/pendingFailedPlantingSessionId';
const ACTIVE_SESSION_STRICT_MODE_KEY = '@knowledtree/activePlantingSessionStrictMode';
const STRICT_FOCUS_LOST_AT_KEY = '@knowledtree/strictFocusLostAt';
const STRICT_MODE_WARNING_MS = 30_000;
const STRICT_MODE_FAILURE_MS = 60_000;
const TAG_COLORS = [
    '#3B6B3B',
    '#E85D5D',
    '#4A9FD9',
    '#5CB8E8',
    '#F5A623',
    '#9B59B6',
    '#E84393',
    '#48D1CC',
    '#F1C40F',
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatFocusTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getPlannedFocusDurationSeconds = (plannedDurationMinutes: number) => (
    plannedDurationMinutes * 60
);

const getSessionEndTimeMs = (session: PlantingSessionDto) => (
    new Date(session.serverStartTime).getTime() + session.requiredFocusDurationSeconds * 1000
);

const getStrictFocusLossDuration = (
    session: PlantingSessionDto,
    focusLostAt: number,
    now = Date.now(),
) => Math.max(
    0,
    // Chỉ tính thời gian mất tập trung trong lúc cây còn đang lớn;
    // thời gian sau khi phiên đã hoàn tất không được dùng để đánh dấu thất bại.
    Math.min(now, getSessionEndTimeMs(session)) - focusLostAt,
);

const getErrorMessage = (
    error: any,
    fallback: string,
    knownMessages?: { activeSession?: string; notReady?: string },
) =>
    error?.response?.data?.error?.code === ACTIVE_PLANTING_SESSION_CODE
        ? knownMessages?.activeSession || fallback
        : error?.response?.data?.error?.code === PLANTING_SESSION_NOT_READY_CODE
        ? knownMessages?.notReady || fallback
        : error?.response?.data?.error?.message
            || error?.response?.data?.message
            || error?.message
            || fallback;

const isActivePlantingSessionError = (error: any) => (
    error?.response?.data?.error?.code === ACTIVE_PLANTING_SESSION_CODE
);

const isPlantingSessionNotReadyError = (error: any) => (
    error?.response?.data?.error?.code === PLANTING_SESSION_NOT_READY_CODE
);

const isFailEndpointUnavailableError = (error: any) => error?.response?.status === 405;

const persistActiveSessionGuard = async (sessionId: string, strictModeEnabled: boolean) => {
    // Lưu các dữ liệu tối thiểu để khôi phục luật strict mode nếu app bị tắt giữa phiên.
    await AsyncStorage.multiSet([
        [ACTIVE_SESSION_ID_KEY, sessionId],
        [PENDING_FAILED_SESSION_ID_KEY, ''],
        [ACTIVE_SESSION_STRICT_MODE_KEY, String(strictModeEnabled)],
        [STRICT_FOCUS_LOST_AT_KEY, ''],
    ]);
};

const persistPendingSessionFailure = async (sessionId: string) => {
    // Đánh dấu trước khi gọi API fail. Nếu mất mạng hoặc app bị tắt,
    // lần mở sau sẽ tiếp tục gửi yêu cầu fail cho đúng phiên này.
    await AsyncStorage.setItem(PENDING_FAILED_SESSION_ID_KEY, sessionId);
};

const clearPersistedSessionGuard = async () => {
    await AsyncStorage.multiRemove([
        ACTIVE_SESSION_ID_KEY,
        PENDING_FAILED_SESSION_ID_KEY,
        ACTIVE_SESSION_STRICT_MODE_KEY,
        STRICT_FOCUS_LOST_AT_KEY,
    ]);
};

const GrowTreeScreen = () => {
    const navigation = useNavigation<any>();
    const { theme } = useTheme();
    const { t } = useLocalization();
    const { strictModeEnabled, strictModeReady } = useStrictMode();
    const { height, width } = useWindowDimensions();
    const isShortScreen = height < 760;
    const seedGridGap = scale.s(14);
    const seedGridHorizontalPadding = scale.s(29);
    const seedCardWidth = Math.min(
        scale.s(124),
        Math.floor((width - seedGridHorizontalPadding * 2 - seedGridGap * 2) / 3),
    );
    const seedCardHeight = Math.round(seedCardWidth * 1.31);
    const seedModalHeight = Math.min(SEED_MODAL_TARGET_HEIGHT, height - scale.vs(38));
    const [focusMinutes, setFocusMinutes] = useState(INITIAL_MINUTES);
    const progressControlRef = useRef<View>(null);
    const progressOriginRef = useRef({ x: 0, y: 0 });
    const [tags, setTags] = useState<TagDto[]>([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [tagsLoaded, setTagsLoaded] = useState(false);
    const [isSeedPickerVisible, setIsSeedPickerVisible] = useState(false);
    const [seedPackages, setSeedPackages] = useState<SeedPackageDto[]>([]);
    const [seedPackagesLoading, setSeedPackagesLoading] = useState(false);
    const [seedPackagesError, setSeedPackagesError] = useState<string | null>(null);
    const [selectedSeedPackage, setSelectedSeedPackage] = useState<SeedPackageDto | null>(null);
    const [isTagPickerVisible, setIsTagPickerVisible] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<TagDto | null>(null);
    const [draftSelectedTag, setDraftSelectedTag] = useState<TagDto | null>(null);
    const [isCreateTagVisible, setIsCreateTagVisible] = useState(false);
    const [formName, setFormName] = useState('');
    const [formColor, setFormColor] = useState(TAG_COLORS[0]);
    const [creatingTag, setCreatingTag] = useState(false);
    const [activeSession, setActiveSession] = useState<PlantingSessionDto | null>(null);

    // State dùng để render; ref cho timer/listener đọc được phiên mới nhất ngay lập tức,
    // không phải chờ React render lại sau setActiveSession.
    const activeSessionRef = useRef<PlantingSessionDto | null>(null);
    const [activeSessionStrictMode, setActiveSessionStrictMode] = useState(false);
    const activeSessionStrictModeRef = useRef(false);
    const [strictFocusLostAt, setStrictFocusLostAt] = useState<number | null>(null);
    const strictFocusLostAtRef = useRef<number | null>(null);
    const [strictModeWarningVisible, setStrictModeWarningVisible] = useState(false);
    const seedlingGrowthProgress = useRef(new Animated.Value(0)).current;
    const isFailingSessionRef = useRef(false);
    const failErrorAlertSessionIdRef = useRef<string | null>(null);
    const nextFailAttemptAtRef = useRef(0);
    const [remainingSeconds, setRemainingSeconds] = useState(getPlannedFocusDurationSeconds(INITIAL_MINUTES));
    const [isStartConfirming, setIsStartConfirming] = useState(false);
    const [isStartingSession, setIsStartingSession] = useState(false);
    const [isCompletingSession, setIsCompletingSession] = useState(false);
    const [isFailingSession, setIsFailingSession] = useState(false);
    const [rewardResult, setRewardResult] = useState<CompletePlantingSessionResultDto | null>(null);

    const canEditSession = !activeSession
        && !isStartConfirming
        && !isStartingSession
        && !isCompletingSession
        && !isFailingSession;
    const displaySeconds = activeSession ? remainingSeconds : getPlannedFocusDurationSeconds(focusMinutes);
    const isReadyToClaim = !!activeSession && remainingSeconds <= 0;
    const progress = (focusMinutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES);
    const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
    const knobAngle = progress * 360;
    const knobRadians = knobAngle * Math.PI / 180;
    const knobX = RING_RADIUS + Math.sin(knobRadians) * KNOB_RADIUS - KNOB_SIZE / 2;
    const knobY = RING_RADIUS - Math.cos(knobRadians) * KNOB_RADIUS - KNOB_SIZE / 2;
    const displayedTagName = selectedTag?.name || t('grow.defaultTag');
    const displayedTagColor = selectedTag?.colorCode || '#3C6540';
    const seedHintText = activeSession
        ? t('grow.sessionLockedHint')
        : selectedSeedPackage?.treePoolName || t('grow.chooseSeedHint');
    const isPrimaryActionBusy = isStartConfirming
        || isStartingSession
        || isCompletingSession
        || isFailingSession;
    const isPrimaryActionDisabled = !strictModeReady
        || isPrimaryActionBusy
        || (!!activeSession && !isReadyToClaim);
    const primaryActionIcon = activeSession
        ? (isReadyToClaim ? 'gift' : 'lock')
        : 'play';
    const primaryActionLabel = activeSession
        ? (isReadyToClaim ? t('grow.claimReward') : t('grow.sessionLocked'))
        : t('grow.startFocus');

    useEffect(() => {
        activeSessionRef.current = activeSession;
    }, [activeSession]);

    useEffect(() => {
        if (Platform.OS !== 'android' || !ScreenAwake) {
            return undefined;
        }

        // Có phiên đang chạy thì nhờ Android giữ màn hình sáng.
        // Cleanup luôn tắt cờ để không ảnh hưởng các màn hình khác khi rời Grow Tree.
        ScreenAwake.setKeepScreenOn(!!activeSession);

        return () => ScreenAwake.setKeepScreenOn(false);
    }, [activeSession]);

    useEffect(() => {
        if (!activeSession) {
            seedlingGrowthProgress.setValue(0);
            return undefined;
        }

        seedlingGrowthProgress.setValue(0);
        const growthAnimation = Animated.timing(seedlingGrowthProgress, {
            toValue: 1,
            duration: 620,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        });

        growthAnimation.start();

        return () => growthAnimation.stop();
    }, [activeSession, seedlingGrowthProgress]);

    useEffect(() => {
        if (!activeSession) {
            setRemainingSeconds(getPlannedFocusDurationSeconds(focusMinutes));
            return undefined;
        }

        const updateRemaining = () => {
            const sessionEndMs = getSessionEndTimeMs(activeSession);
            const nextRemainingSeconds = Math.max(
                0,
                Math.ceil((sessionEndMs - Date.now()) / 1000),
            );

            setRemainingSeconds(nextRemainingSeconds);
        };

        updateRemaining();
        const intervalId = setInterval(updateRemaining, 1000);

        return () => clearInterval(intervalId);
    }, [activeSession, focusMinutes]);

    const filteredTags = useMemo(() => {
        const query = tagSearchQuery.trim().toLowerCase();

        if (!query) {
            return tags;
        }

        return tags.filter(tag => tag.name.toLowerCase().includes(query));
    }, [tagSearchQuery, tags]);

    const resetCreateTagForm = useCallback(() => {
        setFormName('');
        setFormColor(TAG_COLORS[0]);
    }, []);

    const loadTags = useCallback(async () => {
        setTagsLoading(true);

        try {
            const data = await getMyTags();
            setTags(data);
            setTagsLoaded(true);
            return data;
        } catch (error: any) {
            Alert.alert(t('common.error'), error?.response?.data?.error?.message || t('grow.loadTagsError'));
            return [];
        } finally {
            setTagsLoading(false);
        }
    }, [t]);

    const loadSeedPackages = useCallback(async () => {
        setSeedPackagesLoading(true);
        setSeedPackagesError(null);

        try {
            const data = await getMySeedPackages();
            const availablePackages = data
                .filter(seedPackage => seedPackage.quantity > 0)
                .sort((first, second) => (
                    first.treePoolId - second.treePoolId
                    || first.treePoolName.localeCompare(second.treePoolName)
                ));

            setSeedPackages(availablePackages);
            setSelectedSeedPackage(currentPackage => {
                if (!currentPackage) {
                    return null;
                }

                return availablePackages.find(seedPackage => seedPackage.id === currentPackage.id) ?? null;
            });
        } catch (error: any) {
            setSeedPackagesError(getErrorMessage(error, t('grow.loadSeedsError')));
        } finally {
            setSeedPackagesLoading(false);
        }
    }, [t]);

    const openSeedPicker = useCallback(() => {
        if (!canEditSession) {
            return;
        }

        setIsSeedPickerVisible(true);
        loadSeedPackages();
    }, [canEditSession, loadSeedPackages]);

    const closeSeedPicker = useCallback(() => {
        setIsSeedPickerVisible(false);
    }, []);

    const handleSelectSeedPackage = useCallback((seedPackage: SeedPackageDto) => {
        setSelectedSeedPackage(seedPackage);
        setIsSeedPickerVisible(false);
    }, []);

    const goToShop = useCallback(() => {
        setIsSeedPickerVisible(false);
        navigation.navigate('Shop');
    }, [navigation]);

    const openTagPicker = useCallback(() => {
        if (!canEditSession) {
            return;
        }

        setDraftSelectedTag(selectedTag);
        setTagSearchQuery('');
        setIsTagPickerVisible(true);

        if (!tagsLoaded) {
            loadTags();
        }
    }, [canEditSession, loadTags, selectedTag, tagsLoaded]);

    const closeTagPicker = useCallback(() => {
        setIsTagPickerVisible(false);
        setTagSearchQuery('');
        setDraftSelectedTag(selectedTag);
    }, [selectedTag]);

    const openCreateTagModal = useCallback(() => {
        resetCreateTagForm();
        setIsTagPickerVisible(false);
        setIsCreateTagVisible(true);
    }, [resetCreateTagForm]);

    const closeCreateTagModal = useCallback(() => {
        setIsCreateTagVisible(false);
        resetCreateTagForm();
        setIsTagPickerVisible(true);
    }, [resetCreateTagForm]);

    const handleCreateTag = useCallback(async () => {
        const name = formName.trim();

        if (!name) {
            return;
        }

        setCreatingTag(true);

        try {
            const createdTag = await createTag({ name, colorCode: formColor });

            setTags(prev => [
                createdTag,
                ...prev.filter(tag => tag.id !== createdTag.id),
            ]);
            setTagsLoaded(true);
            setSelectedTag(createdTag);
            setDraftSelectedTag(createdTag);
            setIsCreateTagVisible(false);
            resetCreateTagForm();
            setIsTagPickerVisible(true);
            loadTags();
        } catch (error: any) {
            Alert.alert(t('common.error'), error?.response?.data?.error?.message || t('grow.createTagError'));
        } finally {
            setCreatingTag(false);
        }
    }, [formColor, formName, loadTags, resetCreateTagForm, t]);

    const confirmSelectedTag = useCallback(() => {
        setSelectedTag(draftSelectedTag);
        setIsTagPickerVisible(false);
        setTagSearchQuery('');
    }, [draftSelectedTag]);

    const decrementSelectedSeedPackage = useCallback((treePoolId: number) => {
        setSeedPackages(currentPackages => currentPackages
            .map(seedPackage => (
                seedPackage.treePoolId === treePoolId
                    ? { ...seedPackage, quantity: Math.max(0, seedPackage.quantity - 1) }
                    : seedPackage
            ))
            .filter(seedPackage => seedPackage.quantity > 0));

        setSelectedSeedPackage(currentPackage => {
            if (!currentPackage || currentPackage.treePoolId !== treePoolId) {
                return currentPackage;
            }

            const nextQuantity = Math.max(0, currentPackage.quantity - 1);
            return nextQuantity > 0
                ? { ...currentPackage, quantity: nextQuantity }
                : null;
        });
    }, []);

    const resumeActiveSession = useCallback(async () => {
        // Server là nguồn dữ liệu chính: luôn hỏi server xem người dùng còn phiên Growing hay không.
        const session = await getActivePlantingSession();

        if (!session) {
            await clearPersistedSessionGuard();
            activeSessionStrictModeRef.current = false;
            strictFocusLostAtRef.current = null;
            setActiveSessionStrictMode(false);
            setStrictFocusLostAt(null);
            setStrictModeWarningVisible(false);
            return false;
        }

        const [
            [, persistedActiveSessionId],
            [, pendingFailedSessionId],
            [, persistedStrictMode],
            [, persistedFocusLostAt],
        ] = await AsyncStorage.multiGet([
            ACTIVE_SESSION_ID_KEY,
            PENDING_FAILED_SESSION_ID_KEY,
            ACTIVE_SESSION_STRICT_MODE_KEY,
            STRICT_FOCUS_LOST_AT_KEY,
        ]);
        const isPersistedSession = persistedActiveSessionId === session.id;
        const sessionUsesStrictMode = isPersistedSession && persistedStrictMode === 'true';
        const parsedFocusLostAt = isPersistedSession && persistedFocusLostAt
            ? Number(persistedFocusLostAt)
            : Number.NaN;
        const focusLostAt = Number.isFinite(parsedFocusLostAt) ? parsedFocusLostAt : null;
        const focusLostDuration = focusLostAt === null
            ? 0
            : getStrictFocusLossDuration(session, focusLostAt);
        const shouldFailRecoveredSession = pendingFailedSessionId === session.id
            || (sessionUsesStrictMode && focusLostDuration >= STRICT_MODE_FAILURE_MS);

        if (shouldFailRecoveredSession) {
            // Phiên đã vi phạm strict mode từ trước khi app bị tắt/mất mạng,
            // vì vậy phải hoàn tất việc đánh dấu Failed trước khi cho người dùng thao tác tiếp.
            setIsFailingSession(true);
            activeSessionRef.current = session;

            try {
                await persistPendingSessionFailure(session.id);
                await failPlantingSession(session.id, {
                    clientEndTime: new Date().toISOString(),
                });
                await clearPersistedSessionGuard();
                activeSessionRef.current = null;
                activeSessionStrictModeRef.current = false;
                strictFocusLostAtRef.current = null;
                setRewardResult(null);
                setActiveSession(null);
                setActiveSessionStrictMode(false);
                setStrictFocusLostAt(null);
                setStrictModeWarningVisible(false);
                setRemainingSeconds(getPlannedFocusDurationSeconds(focusMinutes));
                Alert.alert(t('grow.sessionFailed'), t('grow.sessionFailedMessage'));
            } catch (error: any) {
                activeSessionRef.current = null;
                activeSessionStrictModeRef.current = false;
                strictFocusLostAtRef.current = null;
                setRewardResult(null);
                setActiveSession(null);
                setActiveSessionStrictMode(false);
                setStrictFocusLostAt(null);
                setStrictModeWarningVisible(false);
                setRemainingSeconds(getPlannedFocusDurationSeconds(focusMinutes));

                if (failErrorAlertSessionIdRef.current !== session.id) {
                    failErrorAlertSessionIdRef.current = session.id;
                    Alert.alert(
                        t('grow.failSessionError'),
                        isFailEndpointUnavailableError(error)
                            ? t('grow.oldBackendError')
                            : getErrorMessage(error, t('grow.tryAgain')),
                    );
                }
            } finally {
                setIsFailingSession(false);
            }

            return false;
        }

        await AsyncStorage.multiSet([
            [ACTIVE_SESSION_ID_KEY, session.id],
            [ACTIVE_SESSION_STRICT_MODE_KEY, String(sessionUsesStrictMode)],
            [STRICT_FOCUS_LOST_AT_KEY, ''],
        ]);
        setRewardResult(null);
        activeSessionRef.current = session;
        activeSessionStrictModeRef.current = sessionUsesStrictMode;
        strictFocusLostAtRef.current = null;
        setActiveSession(session);
        setActiveSessionStrictMode(sessionUsesStrictMode);
        setStrictFocusLostAt(null);
        setStrictModeWarningVisible(
            sessionUsesStrictMode && focusLostDuration >= STRICT_MODE_WARNING_MS,
        );
        setRemainingSeconds(session.requiredFocusDurationSeconds);
        return true;
    }, [focusMinutes, t]);

    useEffect(() => {
        if (!strictModeReady) {
            return;
        }

        resumeActiveSession().catch(() => undefined);
    }, [resumeActiveSession, strictModeReady]);

    const failActiveSession = useCallback(async (
        session: PlantingSessionDto,
        options?: {
            onSucceeded?: () => void;
            showAlert?: boolean;
            showErrorAlert?: boolean;
        },
    ) => {
        // AppState có thể phát nhiều event gần nhau (change/blur), ref này ngăn gọi API fail trùng.
        if (isFailingSessionRef.current) {
            return;
        }

        const now = Date.now();
        if (now < nextFailAttemptAtRef.current) {
            return;
        }

        nextFailAttemptAtRef.current = now + 3000;
        isFailingSessionRef.current = true;
        setIsFailingSession(true);
        activeSessionRef.current = null;
        activeSessionStrictModeRef.current = false;
        strictFocusLostAtRef.current = null;
        setRewardResult(null);
        setActiveSession(null);
        setActiveSessionStrictMode(false);
        setStrictFocusLostAt(null);
        setStrictModeWarningVisible(false);
        setRemainingSeconds(getPlannedFocusDurationSeconds(focusMinutes));

        try {
            await persistPendingSessionFailure(session.id);
            await failPlantingSession(session.id, {
                clientEndTime: new Date().toISOString(),
            });
            await clearPersistedSessionGuard();

            options?.onSucceeded?.();

            if (options?.showAlert !== false) {
                Alert.alert(t('grow.sessionFailed'), t('grow.sessionFailedMessage'));
            }
        } catch (error: any) {
            if (options?.showErrorAlert !== false && failErrorAlertSessionIdRef.current !== session.id) {
                failErrorAlertSessionIdRef.current = session.id;
                Alert.alert(
                    t('grow.failSessionError'),
                    isFailEndpointUnavailableError(error)
                        ? t('grow.oldBackendError')
                        : getErrorMessage(error, t('grow.tryAgain')),
                );
            }
        } finally {
            isFailingSessionRef.current = false;
            setIsFailingSession(false);
        }
    }, [focusMinutes, t]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
            const session = activeSessionRef.current;

            if (!session) {
                return;
            }

            event.preventDefault();
            failActiveSession(session, {
                onSucceeded: () => navigation.dispatch(event.data.action),
            });
        });

        return unsubscribe;
    }, [failActiveSession, navigation]);

    useEffect(() => {
        if (!activeSession || !activeSessionStrictMode || strictFocusLostAt === null) {
            return undefined;
        }

        const evaluateStrictFocusLoss = () => {
            if (strictFocusLostAtRef.current !== strictFocusLostAt) {
                return;
            }

            const now = Date.now();
            const elapsedMs = getStrictFocusLossDuration(activeSession, strictFocusLostAt, now);

            if (elapsedMs >= STRICT_MODE_WARNING_MS) {
                setStrictModeWarningVisible(true);
            }

            if (elapsedMs >= STRICT_MODE_FAILURE_MS) {
                strictFocusLostAtRef.current = null;
                setStrictFocusLostAt(null);
                failActiveSession(activeSession);
                return;
            }

            if (now >= getSessionEndTimeMs(activeSession)) {
                strictFocusLostAtRef.current = null;
                setStrictFocusLostAt(null);
                AsyncStorage.removeItem(STRICT_FOCUS_LOST_AT_KEY).catch(() => undefined);
            }
        };

        evaluateStrictFocusLoss();
        const intervalId = setInterval(evaluateStrictFocusLoss, 1000);

        return () => clearInterval(intervalId);
    }, [activeSession, activeSessionStrictMode, failActiveSession, strictFocusLostAt]);

    useEffect(() => {
        const markStrictFocusLost = () => {
            const session = activeSessionRef.current;

            if (
                !session
                || !activeSessionStrictModeRef.current
                || strictFocusLostAtRef.current !== null
                || Date.now() >= getSessionEndTimeMs(session)
            ) {
                return;
            }

            const focusLostAt = Date.now();

            // Ghi cả ref, state và bộ nhớ máy: ref phục vụ event hiện tại,
            // state cập nhật cảnh báo, AsyncStorage phục vụ trường hợp app bị tắt.
            strictFocusLostAtRef.current = focusLostAt;
            setStrictFocusLostAt(focusLostAt);
            AsyncStorage.setItem(STRICT_FOCUS_LOST_AT_KEY, String(focusLostAt))
                .catch(() => undefined);
        };

        const restoreStrictFocus = () => {
            const session = activeSessionRef.current;
            const focusLostAt = strictFocusLostAtRef.current;

            if (!session || !activeSessionStrictModeRef.current || focusLostAt === null) {
                return;
            }

            strictFocusLostAtRef.current = null;
            setStrictFocusLostAt(null);
            AsyncStorage.removeItem(STRICT_FOCUS_LOST_AT_KEY).catch(() => undefined);

            const elapsedMs = getStrictFocusLossDuration(session, focusLostAt);

            // Rời app từ 30 giây thì cảnh báo; từ 60 giây thì phiên thất bại.
            if (elapsedMs >= STRICT_MODE_WARNING_MS) {
                setStrictModeWarningVisible(true);
            }

            if (elapsedMs >= STRICT_MODE_FAILURE_MS) {
                failActiveSession(session);
            }
        };

        const changeSubscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                restoreStrictFocus();
                return;
            }

            markStrictFocusLost();
        });
        const blurSubscription = AppState.addEventListener('blur', markStrictFocusLost);
        const focusSubscription = AppState.addEventListener('focus', restoreStrictFocus);

        return () => {
            changeSubscription.remove();
            blurSubscription.remove();
            focusSubscription.remove();
        };
    }, [failActiveSession]);

    const beginStartFocus = useCallback(async () => {
        if (!selectedSeedPackage) {
            return;
        }

        setIsStartingSession(true);
        setRewardResult(null);

        try {
            const session = await startPlantingSession({
                treePoolId: selectedSeedPackage.treePoolId,
                tagId: selectedTag?.id ?? null,
                plannedDurationMinutes: focusMinutes,
                clientStartTime: new Date().toISOString(),
            });

            await persistActiveSessionGuard(session.id, strictModeEnabled);
            activeSessionRef.current = session;
            activeSessionStrictModeRef.current = strictModeEnabled;
            strictFocusLostAtRef.current = null;
            setActiveSession(session);
            setActiveSessionStrictMode(strictModeEnabled);
            setStrictFocusLostAt(null);
            setStrictModeWarningVisible(false);
            setRemainingSeconds(session.requiredFocusDurationSeconds);
            decrementSelectedSeedPackage(session.treePoolId);
        } catch (error: any) {
            if (isActivePlantingSessionError(error) && await resumeActiveSession()) {
                return;
            }

            Alert.alert(t('grow.startError'), getErrorMessage(error, t('grow.tryAgain'), {
                activeSession: t('grow.activeSession'),
            }));
        } finally {
            setIsStartingSession(false);
        }
    }, [
        decrementSelectedSeedPackage,
        focusMinutes,
        resumeActiveSession,
        selectedSeedPackage,
        selectedTag,
        strictModeEnabled,
        t,
    ]);

    const handleStartFocus = useCallback(() => {
        if (!selectedSeedPackage) {
            Alert.alert(t('grow.selectSeed'), t('grow.selectSeedMessage'));
            openSeedPicker();
            return;
        }

        if (isStartConfirming) {
            return;
        }

        setIsStartConfirming(true);
        Alert.alert(
            t('grow.startConfirmTitle'),
            t(strictModeEnabled
                ? 'grow.startConfirmStrictMessage'
                : 'grow.startConfirmMessage'),
            [
                {
                    text: t('common.cancel'),
                    style: 'cancel',
                    onPress: () => setIsStartConfirming(false),
                },
                {
                    text: t('grow.start'),
                    style: 'destructive',
                    onPress: () => {
                        setIsStartConfirming(false);
                        beginStartFocus();
                    },
                },
            ],
            {
                cancelable: true,
                onDismiss: () => setIsStartConfirming(false),
            },
        );
    }, [
        beginStartFocus,
        isStartConfirming,
        openSeedPicker,
        selectedSeedPackage,
        strictModeEnabled,
        t,
    ]);

    const handleCompleteFocus = useCallback(async () => {
        if (!activeSession) {
            return;
        }

        if (remainingSeconds > 0) {
            Alert.alert(t('grow.stillGrowing'), t('grow.notReady'));
            return;
        }

        setIsCompletingSession(true);

        try {
            const result = await completePlantingSession(activeSession.id, {
                clientEndTime: new Date().toISOString(),
            });

            setRewardResult(result);
            await clearPersistedSessionGuard();
            activeSessionRef.current = null;
            activeSessionStrictModeRef.current = false;
            strictFocusLostAtRef.current = null;
            setActiveSession(null);
            setActiveSessionStrictMode(false);
            setStrictFocusLostAt(null);
            setStrictModeWarningVisible(false);
            setRemainingSeconds(getPlannedFocusDurationSeconds(focusMinutes));
        } catch (error: any) {
            if (isPlantingSessionNotReadyError(error)) {
                setRemainingSeconds(1);
                Alert.alert(t('grow.stillGrowing'), getErrorMessage(error, t('grow.notReady'), {
                    notReady: t('grow.notReady'),
                }));
                return;
            }

            Alert.alert(t('grow.claimError'), getErrorMessage(error, t('grow.tryAgain')));
        } finally {
            setIsCompletingSession(false);
        }
    }, [activeSession, focusMinutes, remainingSeconds, t]);

    const handlePrimaryAction = useCallback(() => {
        if (activeSession) {
            handleCompleteFocus();
            return;
        }

        handleStartFocus();
    }, [activeSession, handleCompleteFocus, handleStartFocus]);

    const measureProgressControl = useCallback(() => {
        requestAnimationFrame(() => {
            progressControlRef.current?.measureInWindow((x, y) => {
                progressOriginRef.current = { x, y };
            });
        });
    }, []);

    const isTouchInsidePlot = useCallback((event: GestureResponderEvent) => {
        const { pageX, pageY } = event.nativeEvent;
        const { x, y } = progressOriginRef.current;
        const centerX = x + RING_RADIUS;
        const centerY = y + RING_RADIUS;
        const dx = pageX - centerX;
        const dy = pageY - centerY;

        return Math.sqrt(dx * dx + dy * dy) <= PLOT_TOUCH_RADIUS;
    }, []);

    const shouldHandleProgressGesture = useCallback((event: GestureResponderEvent) => {
        return canEditSession && !isTouchInsidePlot(event);
    }, [canEditSession, isTouchInsidePlot]);

    const updateFocusMinutes = useCallback((event: GestureResponderEvent) => {
        const { pageX, pageY } = event.nativeEvent;
        const { x, y } = progressOriginRef.current;
        const dx = pageX - x - RING_RADIUS;
        const dy = pageY - y - RING_RADIUS;
        const rawAngle = Math.atan2(dx, -dy) * 180 / Math.PI;
        const normalizedAngle = rawAngle < 0 ? rawAngle + 360 : rawAngle;
        const nextStep = clamp(
            Math.round((normalizedAngle / 360) * VALUE_STEP_COUNT),
            0,
            VALUE_STEP_COUNT,
        );
        const nextMinutes = clamp(
            MIN_MINUTES + nextStep * STEP_MINUTES,
            MIN_MINUTES,
            MAX_MINUTES,
        );

        setFocusMinutes(currentMinutes => {
            if (
                currentMinutes <= MIN_MINUTES + STEP_MINUTES
                && normalizedAngle >= 360 - SEAM_LOCK_DEGREES
            ) {
                return MIN_MINUTES;
            }

            if (
                currentMinutes >= MAX_MINUTES - STEP_MINUTES
                && normalizedAngle <= SEAM_LOCK_DEGREES
            ) {
                return MAX_MINUTES;
            }

            return nextMinutes;
        });
    }, []);

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: shouldHandleProgressGesture,
        onMoveShouldSetPanResponder: shouldHandleProgressGesture,
        onPanResponderGrant: updateFocusMinutes,
        onPanResponderMove: updateFocusMinutes,
    }), [shouldHandleProgressGesture, updateFocusMinutes]);

    return (
        <AppLayout title={t('nav.growTree')} iconPosition="left" menuDisabled={!!activeSession}>
            <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
                <View style={[
                    styles.panel,
                    isShortScreen && styles.panelCompact,
                ]}>
                    <View
                        ref={progressControlRef}
                        style={styles.progressControl}
                        onLayout={measureProgressControl}
                        {...panResponder.panHandlers}
                    >
                        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.progressSvg}>
                            <Circle
                                cx={RING_RADIUS}
                                cy={RING_RADIUS}
                                r={KNOB_RADIUS}
                                fill="#F3FCF2"
                                stroke={TRACK_COLOR}
                                strokeWidth={STROKE_WIDTH}
                            />
                            <Circle
                                cx={RING_RADIUS}
                                cy={RING_RADIUS}
                                r={KNOB_RADIUS}
                                fill="transparent"
                                stroke={PROGRESS_COLOR}
                                strokeWidth={STROKE_WIDTH}
                                strokeLinecap="round"
                                strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                                strokeDashoffset={strokeDashoffset}
                                transform={`rotate(-90 ${RING_RADIUS} ${RING_RADIUS})`}
                            />
                        </Svg>

                        <Image source={dirtAsset} style={styles.dirtImage} resizeMode="contain" />

                        {activeSession ? (
                            <Animated.Image
                                source={minorTreeAsset}
                                style={[
                                    styles.seedlingImage,
                                    {
                                        opacity: seedlingGrowthProgress,
                                        transform: [
                                            {
                                                translateY: seedlingGrowthProgress.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [scale.s(30), 0],
                                                }),
                                            },
                                            {
                                                scale: seedlingGrowthProgress.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.45, 1],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                                resizeMode="contain"
                            />
                        ) : null}

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('grow.selectSeed')}
                            style={styles.plotTouchTarget}
                            onPress={openSeedPicker}
                            disabled={!canEditSession}
                        />

                        <View style={[
                            styles.progressKnob,
                            {
                                left: knobX,
                                top: knobY,
                            },
                        ]}>
                            <View style={styles.progressKnobInner} />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.focusPill,
                            isShortScreen && styles.focusPillCompact,
                            !canEditSession && styles.controlDisabled,
                        ]}
                        onPress={openTagPicker}
                        activeOpacity={0.78}
                        disabled={!canEditSession}
                    >
                        <View style={[styles.focusDot, { backgroundColor: displayedTagColor }]} />
                        <Text numberOfLines={1} style={styles.focusText}>{displayedTagName}</Text>
                    </TouchableOpacity>

                    <Text numberOfLines={1} style={styles.seedHintText}>
                        {seedHintText}
                    </Text>

                    <Text style={[
                        styles.timerText,
                        isShortScreen && styles.timerTextCompact,
                    ]}>
                        {formatFocusTime(displaySeconds)}
                    </Text>

                    {activeSession && activeSessionStrictMode && strictModeWarningVisible ? (
                        <Text
                            accessibilityLiveRegion="assertive"
                            style={styles.strictModeWarningText}
                        >
                            {t('grow.strictModeWarning')}
                        </Text>
                    ) : null}

                    <View style={[
                        styles.spacer,
                        isShortScreen && styles.spacerCompact,
                    ]} />

                    <TouchableOpacity
                        style={[
                            styles.startButton,
                            isPrimaryActionDisabled && styles.startButtonDisabled,
                        ]}
                        activeOpacity={0.82}
                        onPress={handlePrimaryAction}
                        disabled={isPrimaryActionDisabled}
                    >
                        {isPrimaryActionBusy ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Icon
                                    name={primaryActionIcon}
                                    size={scale.ms(15)}
                                    color="#FFFFFF"
                                />
                                <Text style={styles.startButtonText}>
                                    {primaryActionLabel}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                visible={isTagPickerVisible}
                transparent
                animationType="fade"
                onRequestClose={closeTagPicker}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <Pressable style={styles.modalBackdrop} onPress={closeTagPicker}>
                        <Pressable
                            style={[
                                styles.tagPickerSurface,
                                { maxHeight: height * 0.4 },
                            ]}
                            onPress={() => undefined}
                        >
                            <View style={styles.tagSearchBox}>
                                <Icon name="search" size={scale.ms(18)} color="#424940" />
                                <TextInput
                                    value={tagSearchQuery}
                                    onChangeText={setTagSearchQuery}
                                    placeholder={t('grow.tagSearchPlaceholder')}
                                    placeholderTextColor="rgba(66, 73, 64, 0.5)"
                                    style={styles.tagSearchInput}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <ScrollView
                                style={styles.tagPillsScroll}
                                contentContainerStyle={styles.tagPillsContent}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                {tagsLoading ? (
                                    <View style={styles.tagPickerState}>
                                        <ActivityIndicator color={PROGRESS_COLOR} />
                                    </View>
                                ) : filteredTags.length > 0 ? (
                                    filteredTags.map(tag => {
                                        const isActive = draftSelectedTag?.id === tag.id;

                                        return (
                                            <TouchableOpacity
                                                key={tag.id}
                                                style={[
                                                    styles.tagPill,
                                                    isActive ? styles.tagPillActive : styles.tagPillInactive,
                                                ]}
                                                activeOpacity={0.75}
                                                onPress={() => setDraftSelectedTag(tag)}
                                            >
                                                <View style={[styles.tagPillDot, { backgroundColor: tag.colorCode }]} />
                                                <Text
                                                    numberOfLines={1}
                                                    style={[
                                                        styles.tagPillText,
                                                        isActive && styles.tagPillTextActive,
                                                    ]}
                                                >
                                                    {tag.name}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.tagPickerEmptyText}>
                                        {t(tagSearchQuery.trim() ? 'tags.noMatches' : 'tags.empty')}
                                    </Text>
                                )}

                                <TouchableOpacity
                                    style={styles.newTagPill}
                                    activeOpacity={0.75}
                                    onPress={openCreateTagModal}
                                >
                                    <Icon name="plus" size={scale.ms(12)} color="#161D18" />
                                    <Text style={styles.newTagText}>{t('tags.new')}</Text>
                                </TouchableOpacity>
                            </ScrollView>

                            <TouchableOpacity
                                style={[
                                    styles.selectTagButton,
                                    !draftSelectedTag && styles.selectTagButtonDisabled,
                                ]}
                                activeOpacity={0.82}
                                onPress={confirmSelectedTag}
                                disabled={!draftSelectedTag}
                            >
                                <Text style={styles.selectTagButtonText}>{t('tags.select')}</Text>
                            </TouchableOpacity>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={isCreateTagVisible}
                transparent
                animationType="slide"
                onRequestClose={closeCreateTagModal}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <Pressable style={styles.createTagBackdrop} onPress={closeCreateTagModal}>
                        <Pressable style={styles.createTagSurface} onPress={() => undefined}>
                            <View style={styles.createTagHandle} />

                            <Text style={styles.createTagTitle}>{t('tags.createTitle')}</Text>

                            <Text style={styles.createTagLabel}>{t('tags.nameLabel')}</Text>
                            <TextInput
                                value={formName}
                                onChangeText={setFormName}
                                style={styles.createTagInput}
                                placeholder={t('tags.example')}
                                placeholderTextColor="#AAAAAA"
                                maxLength={15}
                                autoFocus
                            />

                            <Text style={styles.createTagLabel}>{t('tags.selectColor')}</Text>
                            <View style={styles.colorGrid}>
                                {TAG_COLORS.map(color => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorOption,
                                            { backgroundColor: color },
                                            formColor === color && styles.colorSelected,
                                        ]}
                                        activeOpacity={0.8}
                                        onPress={() => setFormColor(color)}
                                    />
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.createTagButton,
                                    (!formName.trim() || creatingTag) && styles.createTagButtonDisabled,
                                ]}
                                activeOpacity={0.82}
                                onPress={handleCreateTag}
                                disabled={!formName.trim() || creatingTag}
                            >
                                {creatingTag ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.createTagButtonText}>{t('tags.create')}</Text>
                                )}
                            </TouchableOpacity>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={isSeedPickerVisible}
                transparent
                animationType="slide"
                onRequestClose={closeSeedPicker}
            >
                <Pressable style={styles.seedModalBackdrop} onPress={closeSeedPicker}>
                    <Pressable
                        style={[styles.seedModalSurface, { height: seedModalHeight }]}
                        onPress={() => undefined}
                    >
                        <View style={styles.seedModalHandle} />

                        <View style={styles.seedModalHeader}>
                            <Text style={styles.seedModalTitle}>{t('grow.seedPickerTitle')}</Text>
                        </View>

                        <View style={styles.seedModalBody}>
                            {seedPackagesLoading ? (
                                <View style={styles.seedPickerState}>
                                    <ActivityIndicator color={PROGRESS_COLOR} size="large" />
                                    <Text style={styles.seedPickerStateText}>{t('grow.loadingSeeds')}</Text>
                                </View>
                            ) : seedPackagesError ? (
                                <View style={styles.seedPickerState}>
                                    <View style={styles.seedEmptyIconWrap}>
                                        <Icon name="alert-circle" size={scale.ms(30)} color="#B42318" />
                                    </View>
                                    <Text style={styles.seedEmptyTitle}>{t('grow.cannotLoadSeeds')}</Text>
                                    <Text style={styles.seedEmptyDescription}>{seedPackagesError}</Text>
                                    <TouchableOpacity
                                        style={styles.seedRetryButton}
                                        activeOpacity={0.82}
                                        onPress={loadSeedPackages}
                                    >
                                        <Text style={styles.seedRetryButtonText}>{t('common.retry')}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : seedPackages.length > 0 ? (
                                <ScrollView
                                    style={styles.seedList}
                                    contentContainerStyle={[
                                        styles.seedListContent,
                                        {
                                            columnGap: seedGridGap,
                                            rowGap: seedGridGap,
                                        },
                                    ]}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {seedPackages.map(seedPackage => {
                                        const isActive = selectedSeedPackage?.id === seedPackage.id;

                                        return (
                                            <TouchableOpacity
                                                key={seedPackage.id}
                                                style={[
                                                    styles.seedPackageCard,
                                                    {
                                                        width: seedCardWidth,
                                                        height: seedCardHeight,
                                                    },
                                                    isActive && styles.seedPackageCardActive,
                                                ]}
                                                activeOpacity={0.78}
                                                onPress={() => handleSelectSeedPackage(seedPackage)}
                                            >
                                                <Image
                                                    source={resolveSeedPackageImage(
                                                        seedPackage.packageImageKey,
                                                        seedPackage.treePoolName,
                                                    )}
                                                    style={[
                                                        styles.seedPackageImage,
                                                        {
                                                            width: seedCardWidth * 0.52,
                                                            height: seedCardHeight * 0.58,
                                                        },
                                                    ]}
                                                    resizeMode="contain"
                                                />

                                                <View style={[
                                                    styles.seedQuantityPill,
                                                    isActive && styles.seedQuantityPillActive,
                                                ]}>
                                                    <Text style={[
                                                        styles.seedQuantityText,
                                                        isActive && styles.seedQuantityTextActive,
                                                    ]}>
                                                        x{seedPackage.quantity}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            ) : (
                                <View style={styles.seedPickerState}>
                                    <View style={styles.seedEmptyIconWrap}>
                                        <Icon name="package" size={scale.ms(30)} color="#3B653F" />
                                    </View>
                                    <Text style={styles.seedEmptyTitle}>{t('grow.noSeeds')}</Text>
                                    <Text style={styles.seedEmptyDescription}>
                                        {t('grow.noSeedsDescription')}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.seedModalFooter}>
                            <TouchableOpacity
                                style={styles.seedShopButton}
                                activeOpacity={0.82}
                                onPress={goToShop}
                            >
                                <Icon name="shopping-bag" size={scale.ms(18)} color="#FFFFFF" />
                                <Text style={styles.seedShopButtonText}>{t('grow.shop')}</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={!!rewardResult}
                transparent
                animationType="fade"
                onRequestClose={() => setRewardResult(null)}
            >
                <Pressable style={styles.rewardBackdrop} onPress={() => setRewardResult(null)}>
                    <Pressable style={styles.rewardSurface} onPress={() => undefined}>
                        {rewardResult && (
                            <>
                                <Image
                                    source={resolveTreeImage(rewardResult.resultTree)}
                                    style={styles.rewardTreeImage}
                                    resizeMode="contain"
                                />

                                <View
                                    style={[
                                        styles.rewardRarityPill,
                                        { backgroundColor: getRarityColor(rewardResult.resultTree.rarity) },
                                    ]}
                                >
                                    <Text style={styles.rewardRarityText}>
                                        {t(rewardResult.resultTree.rarity === 0
                                            ? 'rarity.common'
                                            : rewardResult.resultTree.rarity === 1
                                                ? 'rarity.rare'
                                                : 'rarity.gold')}
                                    </Text>
                                </View>

                                <Text style={styles.rewardTitle}>{rewardResult.resultTree.name}</Text>
                                <Text style={styles.rewardDescription}>
                                    {rewardResult.isDuplicate
                                        ? t(
                                            rewardResult.bonusGemReward > 0
                                                ? 'grow.duplicateRewardGem'
                                                : 'grow.duplicateRewardCoin',
                                            { count: rewardResult.bonusGemReward > 0
                                                ? rewardResult.bonusGemReward
                                                : rewardResult.bonusCoinReward },
                                        )
                                        : t('grow.newTreeReward')}
                                </Text>

                                <View style={styles.rewardStats}>
                                    <Text style={styles.rewardStatText}>
                                        {t('grow.owned', { count: rewardResult.totalObtainedCount })}
                                    </Text>
                                    <Text style={styles.rewardStatText}>
                                        {t('grow.coin', { count: rewardResult.wallet.coin })}
                                    </Text>
                                    <Text style={styles.rewardStatText}>
                                        {t('grow.gem', { count: rewardResult.wallet.gem })}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.rewardButton}
                                    activeOpacity={0.82}
                                    onPress={() => setRewardResult(null)}
                                >
                                    <Text style={styles.rewardButtonText}>{t('common.done')}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        paddingHorizontal: scale.s(20),
        paddingTop: scale.vs(12),
        paddingBottom: scale.vs(24),
    },
    panel: {
        flex: 1,
        minHeight: scale.vs(566),
        borderWidth: 1,
        borderColor: '#DCE5DB',
        borderRadius: scale.s(32),
        paddingHorizontal: scale.s(20),
        paddingTop: scale.vs(128),
        paddingBottom: scale.vs(22),
        alignItems: 'center',
        backgroundColor: '#EEF6EC',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    panelCompact: {
        paddingTop: scale.vs(56),
    },
    progressControl: {
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressSvg: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    progressKnob: {
        position: 'absolute',
        width: KNOB_SIZE,
        height: KNOB_SIZE,
        borderRadius: KNOB_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 2,
    },
    progressKnobInner: {
        width: scale.s(20),
        height: scale.s(20),
        borderRadius: scale.s(10),
        backgroundColor: PROGRESS_COLOR,
    },
    dirtImage: {
        width: scale.s(240),
        height: scale.vs(280),
        marginTop: scale.vs(90),
    },
    seedlingImage: {
        position: 'absolute',
        top: scale.s(55),
        left: (RING_SIZE - SEEDLING_SIZE) / 2,
        width: SEEDLING_SIZE,
        height: SEEDLING_SIZE,
        zIndex: 1,
    },
    plotTouchTarget: {
        position: 'absolute',
        top: (RING_SIZE - PLOT_TOUCH_SIZE) / 2,
        left: (RING_SIZE - PLOT_TOUCH_SIZE) / 2,
        width: PLOT_TOUCH_SIZE,
        height: PLOT_TOUCH_SIZE,
        borderRadius: PLOT_TOUCH_SIZE / 2,
        backgroundColor: 'transparent',
        zIndex: 3,
    },
    focusPill: {
        height: scale.vs(49),
        minWidth: scale.s(112),
        borderWidth: 1,
        borderColor: '#C1C9BE',
        borderRadius: scale.s(12),
        marginTop: scale.vs(92),
        paddingHorizontal: scale.s(13),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3FCF2',
    },
    focusPillCompact: {
        marginTop: scale.vs(48),
    },
    focusDot: {
        width: scale.s(8),
        height: scale.s(8),
        borderRadius: scale.s(4),
        marginRight: scale.s(8),
        backgroundColor: '#3C6540',
    },
    focusText: {
        color: '#161D18',
        fontSize: scale.ms(14),
        fontWeight: '500',
        lineHeight: scale.ms(20),
        maxWidth: scale.s(160),
    },
    controlDisabled: {
        opacity: 0.62,
    },
    seedHintText: {
        width: '100%',
        marginTop: scale.vs(12),
        color: '#424940',
        fontSize: scale.ms(13),
        fontWeight: '700',
        lineHeight: scale.ms(18),
        textAlign: 'center',
    },
    timerText: {
        marginTop: scale.vs(28),
        color: '#3B653F',
        fontSize: scale.ms(48),
        fontWeight: '800',
        lineHeight: scale.ms(52),
        textAlign: 'center',
    },
    timerTextCompact: {
        marginTop: scale.vs(18),
    },
    strictModeWarningText: {
        marginTop: scale.vs(10),
        paddingHorizontal: scale.s(8),
        color: '#C62828',
        fontSize: scale.ms(12),
        fontWeight: '700',
        lineHeight: scale.ms(17),
        textAlign: 'center',
    },
    spacer: {
        flex: 1,
        minHeight: scale.vs(32),
    },
    spacerCompact: {
        minHeight: scale.vs(16),
    },
    startButton: {
        width: '100%',
        minHeight: scale.vs(56),
        borderRadius: scale.s(16),
        paddingHorizontal: scale.s(18),
        paddingVertical: scale.vs(16),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B653F',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 6,
    },
    startButtonDisabled: {
        opacity: 0.62,
    },
    startButtonText: {
        marginLeft: scale.s(8),
        color: '#FFFFFF',
        fontSize: scale.ms(16),
        fontWeight: '700',
        lineHeight: scale.ms(24),
        textAlign: 'center',
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
    tagPickerSurface: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#DCE5DB',
        borderRadius: scale.s(16),
        padding: scale.s(17),
        gap: scale.vs(14),
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 3,
    },
    tagSearchBox: {
        minHeight: scale.vs(36),
        borderRadius: scale.s(999),
        paddingLeft: scale.s(12),
        paddingRight: scale.s(16),
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF6EC',
    },
    tagSearchInput: {
        flex: 1,
        minHeight: scale.vs(36),
        paddingVertical: 0,
        marginLeft: scale.s(10),
        color: '#161D18',
        fontSize: scale.ms(14),
    },
    tagPillsScroll: {
        flexShrink: 1,
    },
    tagPillsContent: {
        minHeight: scale.vs(70),
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: scale.s(8),
        paddingBottom: scale.vs(2),
    },
    tagPickerState: {
        minHeight: scale.vs(48),
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tagPickerEmptyText: {
        minHeight: scale.vs(32),
        color: '#7C847D',
        fontSize: scale.ms(12),
        fontWeight: '600',
        textAlignVertical: 'center',
    },
    tagPill: {
        minHeight: scale.vs(30),
        borderRadius: scale.s(999),
        borderWidth: 1,
        paddingHorizontal: scale.s(17),
        paddingVertical: scale.vs(7),
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale.s(4),
    },
    tagPillActive: {
        borderColor: 'rgba(23, 108, 67, 0.2)',
        backgroundColor: '#A3F4C0',
    },
    tagPillInactive: {
        borderColor: '#C1C9BE',
        backgroundColor: '#E8F0E6',
    },
    tagPillDot: {
        width: scale.s(8),
        height: scale.s(8),
        borderRadius: scale.s(4),
    },
    tagPillText: {
        maxWidth: scale.s(108),
        color: '#161D18',
        fontSize: scale.ms(12),
        fontWeight: '600',
        lineHeight: scale.ms(16),
    },
    tagPillTextActive: {
        color: '#207249',
    },
    newTagPill: {
        minHeight: scale.vs(32),
        borderRadius: scale.s(999),
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#C1C9BE',
        paddingHorizontal: scale.s(18),
        paddingVertical: scale.vs(8),
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale.s(4),
        backgroundColor: '#F7FAF6',
    },
    newTagText: {
        color: '#161D18',
        fontSize: scale.ms(12),
        fontWeight: '600',
        lineHeight: scale.ms(16),
    },
    selectTagButton: {
        minHeight: scale.vs(56),
        borderRadius: scale.s(16),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PROGRESS_COLOR,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 6,
    },
    selectTagButtonDisabled: {
        opacity: 0.5,
    },
    selectTagButtonText: {
        color: '#FFFFFF',
        fontSize: scale.ms(16),
        fontWeight: '700',
        lineHeight: scale.ms(24),
        textAlign: 'center',
    },
    createTagBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    createTagSurface: {
        borderTopLeftRadius: scale.s(20),
        borderTopRightRadius: scale.s(20),
        paddingHorizontal: scale.s(24),
        paddingTop: scale.vs(12),
        paddingBottom: scale.vs(32),
        backgroundColor: '#E2EAE1',
    },
    createTagHandle: {
        width: scale.s(40),
        height: scale.vs(4),
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: scale.vs(16),
        backgroundColor: '#DDDDDD',
    },
    createTagTitle: {
        marginBottom: scale.vs(20),
        color: '#333333',
        fontSize: scale.ms(20),
        fontWeight: '700',
    },
    createTagLabel: {
        marginBottom: scale.vs(8),
        color: '#666666',
        fontSize: scale.ms(13),
    },
    createTagInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: scale.s(8),
        marginBottom: scale.vs(20),
        paddingHorizontal: scale.s(14),
        paddingVertical: scale.vs(12),
        color: '#333333',
        fontSize: scale.ms(14),
        backgroundColor: '#FFFFFF',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: scale.s(12),
        marginBottom: scale.vs(24),
    },
    colorOption: {
        width: scale.s(36),
        height: scale.s(36),
        borderRadius: scale.s(18),
    },
    colorSelected: {
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    createTagButton: {
        borderRadius: scale.s(12),
        paddingVertical: scale.vs(16),
        alignItems: 'center',
        backgroundColor: '#464E47',
    },
    createTagButtonDisabled: {
        opacity: 0.5,
    },
    createTagButtonText: {
        color: '#FFFFFF',
        fontSize: scale.ms(16),
        fontWeight: '600',
    },
    seedModalBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(17, 24, 20, 0.32)',
    },
    seedModalSurface: {
        borderTopLeftRadius: scale.s(24),
        borderTopRightRadius: scale.s(24),
        borderTopWidth: 1,
        borderColor: 'rgba(220, 229, 219, 0.7)',
        overflow: 'hidden',
        backgroundColor: '#F3FCF2',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 16,
    },
    seedModalHandle: {
        width: scale.s(48),
        height: scale.vs(6),
        borderRadius: scale.s(999),
        alignSelf: 'center',
        marginTop: scale.vs(12),
        marginBottom: scale.vs(10),
        backgroundColor: 'rgba(193, 201, 190, 0.5)',
    },
    seedModalHeader: {
        minHeight: scale.vs(72),
        borderBottomWidth: 1,
        borderBottomColor: '#DCE5DB',
        paddingHorizontal: scale.s(29),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    seedModalTitle: {
        color: '#161D18',
        fontSize: scale.ms(20),
        fontWeight: '800',
        lineHeight: scale.ms(28),
    },
    seedModalBody: {
        flex: 1,
        paddingHorizontal: scale.s(29),
        paddingTop: scale.vs(30),
        paddingBottom: scale.vs(16),
        backgroundColor: '#F3FCF2',
    },
    seedPickerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    seedPickerStateText: {
        marginTop: scale.vs(12),
        color: '#424940',
        fontSize: scale.ms(13),
        fontWeight: '700',
        lineHeight: scale.ms(18),
    },
    seedList: {
        flex: 1,
        width: '100%',
    },
    seedListContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        paddingBottom: scale.vs(18),
    },
    seedPackageCard: {
        borderWidth: 1,
        borderColor: '#DCE5DB',
        borderRadius: scale.s(18),
        paddingTop: scale.vs(15),
        paddingBottom: scale.vs(14),
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
    },
    seedPackageCardActive: {
        borderWidth: 2,
        borderColor: '#3B653F',
        backgroundColor: '#E2F1E4',
    },
    seedPackageImage: {
        marginTop: scale.vs(2),
    },
    seedQuantityPill: {
        minWidth: scale.s(42),
        height: scale.vs(26),
        borderRadius: scale.s(999),
        paddingHorizontal: scale.s(10),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    seedQuantityPillActive: {
        backgroundColor: '#F3FCF2',
    },
    seedQuantityText: {
        color: '#424940',
        fontSize: scale.ms(12),
        fontWeight: '800',
        lineHeight: scale.ms(16),
    },
    seedQuantityTextActive: {
        color: '#3B653F',
    },
    seedEmptyIconWrap: {
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
    seedEmptyTitle: {
        color: '#161D18',
        fontSize: scale.ms(18),
        fontWeight: '800',
        lineHeight: scale.ms(26),
        textAlign: 'center',
    },
    seedEmptyDescription: {
        width: scale.s(248),
        marginTop: scale.vs(8),
        color: '#424940',
        fontSize: scale.ms(13),
        lineHeight: scale.ms(19),
        textAlign: 'center',
    },
    seedRetryButton: {
        minHeight: scale.vs(40),
        borderRadius: scale.s(10),
        marginTop: scale.vs(16),
        paddingHorizontal: scale.s(18),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#B42318',
    },
    seedRetryButtonText: {
        color: '#FFFFFF',
        fontSize: scale.ms(13),
        fontWeight: '800',
        lineHeight: scale.ms(18),
    },
    seedModalFooter: {
        height: scale.vs(127),
        borderTopWidth: 1,
        borderTopColor: '#DCE5DB',
        paddingHorizontal: scale.s(29),
        paddingTop: scale.vs(30),
        paddingBottom: scale.vs(29),
        backgroundColor: '#F3FCF2',
    },
    seedShopButton: {
        height: scale.vs(67),
        borderRadius: scale.s(12),
        paddingHorizontal: scale.s(24),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: scale.s(8),
        backgroundColor: PROGRESS_COLOR,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 6,
    },
    seedShopButtonText: {
        color: '#FFFFFF',
        fontSize: scale.ms(16),
        fontWeight: '800',
        lineHeight: scale.ms(24),
        textAlign: 'center',
    },
    rewardBackdrop: {
        flex: 1,
        paddingHorizontal: scale.s(22),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(17, 24, 20, 0.42)',
    },
    rewardSurface: {
        width: '100%',
        borderRadius: scale.s(24),
        borderWidth: 1,
        borderColor: '#DCE5DB',
        paddingHorizontal: scale.s(22),
        paddingTop: scale.vs(26),
        paddingBottom: scale.vs(22),
        alignItems: 'center',
        backgroundColor: '#F3FCF2',
    },
    rewardTreeImage: {
        width: scale.s(180),
        height: scale.vs(180),
    },
    rewardRarityPill: {
        minHeight: scale.vs(28),
        borderRadius: scale.s(999),
        marginTop: scale.vs(8),
        paddingHorizontal: scale.s(14),
        alignItems: 'center',
        justifyContent: 'center',
    },
    rewardRarityText: {
        color: '#FFFFFF',
        fontSize: scale.ms(12),
        fontWeight: '800',
        lineHeight: scale.ms(16),
    },
    rewardTitle: {
        marginTop: scale.vs(14),
        color: '#161D18',
        fontSize: scale.ms(22),
        fontWeight: '800',
        lineHeight: scale.ms(30),
        textAlign: 'center',
    },
    rewardDescription: {
        marginTop: scale.vs(8),
        color: '#424940',
        fontSize: scale.ms(14),
        fontWeight: '600',
        lineHeight: scale.ms(20),
        textAlign: 'center',
    },
    rewardStats: {
        width: '100%',
        borderRadius: scale.s(14),
        marginTop: scale.vs(18),
        paddingVertical: scale.vs(12),
        paddingHorizontal: scale.s(14),
        gap: scale.vs(6),
        backgroundColor: '#E8F0E6',
    },
    rewardStatText: {
        color: '#161D18',
        fontSize: scale.ms(13),
        fontWeight: '700',
        lineHeight: scale.ms(18),
        textAlign: 'center',
    },
    rewardButton: {
        width: '100%',
        minHeight: scale.vs(52),
        borderRadius: scale.s(14),
        marginTop: scale.vs(18),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PROGRESS_COLOR,
    },
    rewardButtonText: {
        color: '#FFFFFF',
        fontSize: scale.ms(16),
        fontWeight: '800',
        lineHeight: scale.ms(22),
    },
});

export default GrowTreeScreen;
