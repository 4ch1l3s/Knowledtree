import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    Image,
    LayoutChangeEvent,
    Modal,
    PanResponder,
    PixelRatio,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AppLayout from '../components/AppLayout';
import { getTreepedia, TreepediaEntryDto } from '../api/store';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';
import { getRarityColor, resolveTreeImage } from '../utils/treeAssets';
import { useLocalization } from '../localization';

const FRAME_SOURCE = require('../assets/frame-assets/frame.png');

const FRAME_RATIO = 1024 / 1235;
const COLS = 3;
const ROWS = 4;
const TREES_PER_PAGE = COLS * ROWS;
const GAP_X = 10;
const GAP_Y = 12;

const PAGE_FRONT_COLOR = '#D6CEB8';
const PAGE_BACK_COLOR = '#B8AA8F';
const PAGE_BACK_LINE_COLOR = 'rgba(63, 49, 32, 0.16)';
const PHOTO_SURFACE_COLOR = '#D7CFB8';
const MIN_ROTATION_MAGNITUDE = 0.35;
const MAX_ROTATION_MAGNITUDE = 2.15;
const PAGE_FLIP_DISTANCE_RATIO = 0.14;
const PAGE_FLIP_MIN_DISTANCE = 36;
const PAGE_FLIP_VELOCITY = 0.18;
const PAGE_RENDER_BEHIND = 1;
const PAGE_RENDER_AHEAD = 2;

type BookSize = {
    width: number;
    height: number;
};

type TreePage = {
    id: string;
    pageNumber: number;
    entries: TreepediaEntryDto[];
};

const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || fallback;

const stableHash01 = (value: string) => {
    const modulus = 4294967291;
    let hash = 5381;

    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 33 + value.charCodeAt(index)) % modulus;
    }

    return hash / modulus;
};

const getFrameRotation = (treeId: number) => {
    const sign = stableHash01(`${treeId}:sign`) >= 0.5 ? 1 : -1;
    const magnitude =
        MIN_ROTATION_MAGNITUDE
        + stableHash01(`${treeId}:magnitude`) * (MAX_ROTATION_MAGNITUDE - MIN_ROTATION_MAGNITUDE);

    return `${(sign * magnitude).toFixed(2)}deg`;
};

const chunkEntries = (entries: TreepediaEntryDto[]): TreePage[] => {
    const pages: TreePage[] = [];

    for (let index = 0; index < entries.length; index += TREES_PER_PAGE) {
        const pageEntries = entries.slice(index, index + TREES_PER_PAGE);
        pages.push({
            id: `tree-page-${pages.length + 1}`,
            pageNumber: pages.length + 1,
            entries: pageEntries,
        });
    }

    return pages;
};

const getBookMetrics = (bookSize: BookSize) => {
    const horizontalPadding = scale.s(20);
    const topPadding = scale.vs(24);
    const bottomPadding = scale.vs(22);

    const availableWidth = Math.max(0, bookSize.width - horizontalPadding * 2);
    const availableHeight = Math.max(
        0,
        bookSize.height - topPadding - bottomPadding,
    );

    const frameWidthByWidth = (availableWidth - GAP_X * (COLS - 1)) / COLS;
    const frameHeightByHeight = (availableHeight - GAP_Y * (ROWS - 1)) / ROWS;
    const frameWidthByHeight = frameHeightByHeight * FRAME_RATIO;
    const rawFrameWidth = Math.max(0, Math.min(frameWidthByWidth, frameWidthByHeight));
    const frameWidth = PixelRatio.roundToNearestPixel(rawFrameWidth);

    return {
        horizontalPadding,
        topPadding,
        bottomPadding,
        frameWidth,
        frameHeight: PixelRatio.roundToNearestPixel(frameWidth / FRAME_RATIO),
    };
};

interface FrameItemProps {
    item: TreepediaEntryDto;
    index: number;
    frameWidth: number;
    frameHeight: number;
    onPress: (item: TreepediaEntryDto) => void;
}

const FrameItem: React.FC<FrameItemProps> = ({ item, index, frameWidth, frameHeight, onPress }) => {
    const rotate = getFrameRotation(item.tree.id);
    const colIndex = index % COLS;
    const rowIndex = Math.floor(index / COLS);
    const surfaceWashColor = item.isUnlocked ? getRarityColor(item.tree.rarity) : '#2B2A26';
    const frameWrapperStyle = useMemo(
        () => [
            styles.frameWrapper,
            {
                width: frameWidth,
                height: frameHeight,
                marginRight: colIndex === COLS - 1 ? 0 : GAP_X,
                marginBottom: rowIndex === ROWS - 1 ? 0 : GAP_Y,
            },
        ],
        [colIndex, frameHeight, frameWidth, rowIndex],
    );

    return (
        <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.86}
            onPress={() => onPress(item)}
            style={frameWrapperStyle}
        >
            <View
                renderToHardwareTextureAndroid
                shouldRasterizeIOS
                style={[styles.frameTiltWrapper, { transform: [{ rotate }] }]}
            >
                <View style={styles.framePhotoSurface}>
                    <View style={[styles.rarityWash, { backgroundColor: surfaceWashColor }]} />
                    <Image
                        source={resolveTreeImage(item.tree)}
                        style={[
                            styles.treeImage,
                            !item.isUnlocked && styles.treeImageLocked,
                        ]}
                        resizeMode="contain"
                    />
                    {!item.isUnlocked ? <View style={styles.lockedOverlay} /> : null}
                </View>

                <Image
                    source={FRAME_SOURCE}
                    style={styles.frameImage}
                    resizeMode="contain"
                    resizeMethod="scale"
                />
            </View>
        </TouchableOpacity>
    );
};

interface PageLayerProps {
    page: TreePage;
    pageIndex: number;
    pageCount: number;
    progress: Animated.Value;
    bookSize: BookSize;
    metrics: ReturnType<typeof getBookMetrics>;
    onFramePress: (item: TreepediaEntryDto) => void;
}

const PageLayer: React.FC<PageLayerProps> = ({
    page,
    pageIndex,
    pageCount,
    progress,
    bookSize,
    metrics,
    onFramePress,
}) => {
    const { width, height } = bookSize;
    const inputStart = pageIndex * width;
    const inputEnd = (pageIndex + 1) * width;

    const flatWidth = progress.interpolate({
        inputRange: [inputStart, inputEnd],
        outputRange: [width, 0],
        extrapolate: 'clamp',
    });

    const foldLeft = progress.interpolate({
        inputRange: [inputStart, inputEnd],
        outputRange: [width, -width],
        extrapolate: 'clamp',
    });

    const foldWidth = progress.interpolate({
        inputRange: [inputStart, inputEnd],
        outputRange: [0, width],
        extrapolate: 'clamp',
    });

    const foldFadeDistance = Math.max(1, width * 0.035);
    const foldOpacity = progress.interpolate({
        inputRange: [
            inputStart,
            inputStart + foldFadeDistance,
            inputEnd - foldFadeDistance,
            inputEnd,
        ],
        outputRange: [0, 1, 1, 0],
        extrapolate: 'clamp',
    });

    return (
        <>
            <Animated.View style={[styles.flatPage, { width: flatWidth }]}>
                <View
                    style={[
                        styles.pageContent,
                        {
                            width,
                            height,
                            paddingHorizontal: metrics.horizontalPadding,
                            paddingTop: metrics.topPadding,
                            paddingBottom: metrics.bottomPadding,
                        },
                    ]}
                >
                    <View style={StyleSheet.absoluteFill}>
                        {Array.from({ length: 18 }).map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.notebookLine,
                                    {
                                        top: metrics.topPadding + index * scale.vs(36),
                                        transform: [{ rotate: index % 2 === 0 ? '0.1deg' : '-0.1deg' }],
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    <View style={styles.frameGrid}>
                        {page.entries.map((entry, treeIndex) => (
                            <FrameItem
                                key={entry.tree.id}
                                item={entry}
                                index={treeIndex}
                                frameWidth={metrics.frameWidth}
                                frameHeight={metrics.frameHeight}
                                onPress={onFramePress}
                            />
                        ))}
                    </View>
                </View>
            </Animated.View>

            {pageIndex < pageCount - 1 ? (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.fold,
                        {
                            left: foldLeft,
                            width: foldWidth,
                            height,
                            opacity: foldOpacity,
                        },
                    ]}
                >
                    <View style={[styles.foldPaper, { width, height }]}>
                        <View style={styles.foldCrease} />
                        {Array.from({ length: 18 }).map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.foldNotebookLine,
                                    {
                                        top: metrics.topPadding + index * scale.vs(36),
                                        transform: [{ rotate: index % 2 === 0 ? '0.08deg' : '-0.08deg' }],
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </Animated.View>
            ) : null}
        </>
    );
};

const TreepediaScreen = () => {
    const { theme } = useTheme();
    const { t } = useLocalization();
    const [entries, setEntries] = useState<TreepediaEntryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookSize, setBookSize] = useState<BookSize>({ width: 0, height: 0 });
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [selectedEntry, setSelectedEntry] = useState<TreepediaEntryDto | null>(null);

    const progress = useRef(new Animated.Value(0)).current;
    const progressValueRef = useRef(0);
    const savedProgressRef = useRef(0);
    const isLoadingRef = useRef(false);

    const pages = useMemo(() => chunkEntries(entries), [entries]);
    const renderedPages = useMemo(
        () => pages.filter((_, index) =>
            index >= currentPageIndex - PAGE_RENDER_BEHIND
            && index <= currentPageIndex + PAGE_RENDER_AHEAD,
        ),
        [currentPageIndex, pages],
    );
    const metrics = useMemo(() => getBookMetrics(bookSize), [bookSize]);
    const maxProgress = Math.max(0, (pages.length - 1) * bookSize.width);

    const loadTreepedia = useCallback(async () => {
        if (isLoadingRef.current) {
            return;
        }

        isLoadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const result = await getTreepedia();
            setEntries(result);
        } catch (loadError: any) {
            setError(getErrorMessage(loadError, t('treepedia.loadError')));
        } finally {
            isLoadingRef.current = false;
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadTreepedia();
    }, [loadTreepedia]);

    useEffect(() => {
        const listenerId = progress.addListener(({ value }) => {
            progressValueRef.current = value;
        });

        return () => progress.removeListener(listenerId);
    }, [progress]);

    useEffect(() => {
        if (bookSize.width <= 0) {
            return;
        }

        const nextProgress = Math.min(progressValueRef.current, maxProgress);
        progressValueRef.current = nextProgress;
        savedProgressRef.current = nextProgress;
        progress.setValue(nextProgress);
        setCurrentPageIndex(Math.round(nextProgress / bookSize.width));
    }, [bookSize.width, maxProgress, progress]);

    const handleBookLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;

        setBookSize(prev => {
            const nextWidth = Math.round(width);
            const nextHeight = Math.round(height);

            if (prev.width === nextWidth && prev.height === nextHeight) {
                return prev;
            }

            return {
                width: nextWidth,
                height: nextHeight,
            };
        });
    }, []);

    const animateToPage = useCallback((targetIndex: number) => {
        if (bookSize.width <= 0 || pages.length <= 1) {
            progress.setValue(0);
            setCurrentPageIndex(0);
            return;
        }

        const nextIndex = Math.max(0, Math.min(pages.length - 1, targetIndex));

        Animated.timing(progress, {
            toValue: nextIndex * bookSize.width,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished) {
                progressValueRef.current = nextIndex * bookSize.width;
                savedProgressRef.current = progressValueRef.current;
                setCurrentPageIndex(nextIndex);
            }
        });
    }, [bookSize.width, pages.length, progress]);

    const animateToNearestPage = useCallback((dragX = 0, velocityX = 0) => {
        if (bookSize.width <= 0 || pages.length <= 1) {
            progress.setValue(0);
            setCurrentPageIndex(0);
            return;
        }

        const startIndex = Math.round(savedProgressRef.current / bookSize.width);
        const dragThreshold = Math.max(
            PAGE_FLIP_MIN_DISTANCE,
            bookSize.width * PAGE_FLIP_DISTANCE_RATIO,
        );
        let targetIndex = startIndex;

        if (dragX <= -dragThreshold || velocityX <= -PAGE_FLIP_VELOCITY) {
            targetIndex = startIndex + 1;
        } else if (dragX >= dragThreshold || velocityX >= PAGE_FLIP_VELOCITY) {
            targetIndex = startIndex - 1;
        }

        targetIndex = Math.max(startIndex - 1, Math.min(startIndex + 1, targetIndex));
        animateToPage(targetIndex);
    }, [animateToPage, bookSize.width, pages.length, progress]);

    const panResponder = useMemo(() => PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
            pages.length > 1
            && Math.abs(gestureState.dx) > 4
            && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
            pages.length > 1
            && Math.abs(gestureState.dx) > 4
            && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderGrant: () => {
            progress.stopAnimation(value => {
                savedProgressRef.current = value;
                progressValueRef.current = value;
            });
        },
        onPanResponderMove: (_, gestureState) => {
            if (bookSize.width <= 0) {
                return;
            }

            const savedProgress = savedProgressRef.current;
            let nextProgress = savedProgress - gestureState.dx;

            nextProgress = Math.max(
                savedProgress - bookSize.width,
                Math.min(savedProgress + bookSize.width, nextProgress),
            );
            nextProgress = Math.max(0, Math.min(maxProgress, nextProgress));

            progress.setValue(nextProgress);
        },
        onPanResponderRelease: (_, gestureState) => {
            animateToNearestPage(gestureState.dx, gestureState.vx);
        },
        onPanResponderTerminate: () => {
            animateToNearestPage();
        },
    }), [animateToNearestPage, bookSize.width, maxProgress, pages.length, progress]);

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
                <Icon name="book-open" size={scale.ms(30)} color="#3B653F" />
            </View>
            <Text style={styles.emptyTitle}>{t('treepedia.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('treepedia.emptyMessage')}</Text>
        </View>
    );

    const handleFramePress = useCallback((item: TreepediaEntryDto) => {
        setSelectedEntry(item);
    }, []);

    const closeDetail = useCallback(() => {
        setSelectedEntry(null);
    }, []);

    const renderTreeDetail = () => {
        const description = selectedEntry?.tree.description?.trim();

        return (
            <Modal
                animationType="fade"
                transparent
                visible={!!selectedEntry}
                onRequestClose={closeDetail}
            >
                <Pressable style={styles.detailBackdrop} onPress={closeDetail}>
                    <Pressable style={styles.detailSurface} onPress={() => undefined}>
                        {selectedEntry ? (
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.detailContent}
                            >
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    activeOpacity={0.82}
                                    style={styles.detailCloseButton}
                                    onPress={closeDetail}
                                >
                                    <Icon name="x" size={scale.ms(18)} color="#4F4635" />
                                </TouchableOpacity>

                                {selectedEntry.isUnlocked ? (
                                    <View style={styles.detailImageWrap}>
                                        <View
                                            style={[
                                                styles.detailRarityWash,
                                                { backgroundColor: getRarityColor(selectedEntry.tree.rarity) },
                                            ]}
                                        />
                                        <Image
                                            source={resolveTreeImage(selectedEntry.tree)}
                                            style={styles.detailTreeImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                ) : null}

                                <Text style={styles.detailTitle}>{selectedEntry.tree.name}</Text>
                                <Text style={styles.detailDescription}>
                                    {description || t('treepedia.noDescription')}
                                </Text>
                            </ScrollView>
                        ) : null}
                    </Pressable>
                </Pressable>
            </Modal>
        );
    };

    const renderBook = () => (
        <View style={styles.bookShell}>
            <View
                style={styles.book}
                onLayout={handleBookLayout}
                {...panResponder.panHandlers}
            >
                {bookSize.width > 0 && bookSize.height > 0 ? (
                    renderedPages
                        .slice()
                        .reverse()
                        .map(page => {
                            const pageIndex = page.pageNumber - 1;

                            return (
                                <PageLayer
                                    key={page.id}
                                    page={page}
                                    pageIndex={pageIndex}
                                    pageCount={pages.length}
                                    progress={progress}
                                    bookSize={bookSize}
                                    metrics={metrics}
                                    onFramePress={handleFramePress}
                                />
                            );
                        })
                ) : null}
            </View>

            {pages.length > 1 ? (
                <View style={styles.paginationBar}>
                    <Text style={styles.pageIndicator}>
                        {currentPageIndex + 1}/{pages.length}
                    </Text>
                </View>
            ) : null}
        </View>
    );

    return (
        <AppLayout title={t('nav.treepedia')} iconPosition="left">
            <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
                {loading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator color="#3B653F" size="large" />
                        <Text style={styles.loadingText}>{t('treepedia.loading')}</Text>
                    </View>
                ) : error ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconWrap}>
                            <Icon name="alert-circle" size={scale.ms(30)} color="#B42318" />
                        </View>
                        <Text style={styles.emptyTitle}>{t('treepedia.cannotLoad')}</Text>
                        <Text style={styles.emptyText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={loadTreepedia}>
                            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : entries.length === 0 ? (
                    renderEmpty()
                ) : (
                    renderBook()
                )}

                {renderTreeDetail()}
            </View>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    bookShell: {
        flex: 1,
        backgroundColor: '#191715',
    },
    book: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#191715',
    },
    flatPage: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
    },
    pageContent: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: PAGE_FRONT_COLOR,
    },
    notebookLine: {
        position: 'absolute',
        left: scale.s(20),
        right: scale.s(20),
        height: 1,
        backgroundColor: 'rgba(70, 55, 35, 0.14)',
    },
    frameGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
    },
    frameWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    frameTiltWrapper: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backfaceVisibility: 'hidden',
    },
    framePhotoSurface: {
        position: 'absolute',
        top: '12.5%',
        left: '13.2%',
        right: '13.2%',
        bottom: '28.2%',
        borderRadius: scale.s(2),
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PHOTO_SURFACE_COLOR,
    },
    rarityWash: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.08,
    },
    treeImage: {
        width: '86%',
        height: '88%',
    },
    treeImageLocked: {
        opacity: 0.72,
        tintColor: '#272723',
    },
    lockedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#1B1B18',
        opacity: 0.16,
    },
    frameImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backfaceVisibility: 'hidden',
    },
    fold: {
        position: 'absolute',
        top: 0,
        overflow: 'hidden',
        backgroundColor: PAGE_BACK_COLOR,
        shadowColor: '#000000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 12,
    },
    foldPaper: {
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
        backgroundColor: PAGE_BACK_COLOR,
    },
    foldNotebookLine: {
        position: 'absolute',
        left: scale.s(26),
        right: scale.s(24),
        height: 1,
        backgroundColor: PAGE_BACK_LINE_COLOR,
    },
    foldCrease: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(54, 42, 27, 0.2)',
    },
    paginationBar: {
        minHeight: scale.vs(34),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PAGE_FRONT_COLOR,
    },
    pageIndicator: {
        color: '#4F4635',
        fontSize: scale.ms(13),
        fontWeight: '800',
        lineHeight: scale.ms(18),
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
    detailBackdrop: {
        flex: 1,
        paddingHorizontal: scale.s(20),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(25, 23, 21, 0.52)',
    },
    detailSurface: {
        width: '100%',
        maxHeight: '82%',
        borderRadius: scale.s(18),
        borderWidth: 1,
        borderColor: '#C4B899',
        overflow: 'hidden',
        backgroundColor: PAGE_FRONT_COLOR,
    },
    detailContent: {
        paddingHorizontal: scale.s(22),
        paddingTop: scale.vs(22),
        paddingBottom: scale.vs(24),
        alignItems: 'center',
    },
    detailCloseButton: {
        position: 'absolute',
        top: scale.vs(12),
        right: scale.s(12),
        width: scale.s(34),
        height: scale.s(34),
        borderRadius: scale.s(17),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.42)',
        zIndex: 2,
    },
    detailImageWrap: {
        width: scale.s(188),
        height: scale.vs(188),
        borderRadius: scale.s(14),
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 53, 0.16)',
        marginTop: scale.vs(10),
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PHOTO_SURFACE_COLOR,
    },
    detailRarityWash: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.1,
    },
    detailTreeImage: {
        width: '86%',
        height: '86%',
    },
    detailTitle: {
        marginTop: scale.vs(18),
        color: '#2F281D',
        fontSize: scale.ms(22),
        fontWeight: '800',
        lineHeight: scale.ms(30),
        textAlign: 'center',
    },
    detailDescription: {
        width: '100%',
        marginTop: scale.vs(10),
        color: '#4F4635',
        fontSize: scale.ms(14),
        fontWeight: '600',
        lineHeight: scale.ms(21),
        textAlign: 'center',
    },
});

export default TreepediaScreen;
