import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    GestureResponderEvent,
    Image,
    KeyboardAvoidingView,
    Modal,
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

const dirtAsset = require('../assets/dirt-asset.png');

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

const formatFocusTime = (minutes: number) => `${minutes}:00`;

const GrowTreeScreen = () => {
    const { theme } = useTheme();
    const { height } = useWindowDimensions();
    const isShortScreen = height < 760;
    const [focusMinutes, setFocusMinutes] = useState(INITIAL_MINUTES);
    const progressControlRef = useRef<View>(null);
    const progressOriginRef = useRef({ x: 0, y: 0 });
    const [tags, setTags] = useState<TagDto[]>([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [tagsLoaded, setTagsLoaded] = useState(false);
    const [isTagPickerVisible, setIsTagPickerVisible] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<TagDto | null>(null);
    const [draftSelectedTag, setDraftSelectedTag] = useState<TagDto | null>(null);
    const [isCreateTagVisible, setIsCreateTagVisible] = useState(false);
    const [formName, setFormName] = useState('');
    const [formColor, setFormColor] = useState(TAG_COLORS[0]);
    const [creatingTag, setCreatingTag] = useState(false);

    const progress = (focusMinutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES);
    const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
    const knobAngle = progress * 360;
    const knobRadians = knobAngle * Math.PI / 180;
    const knobX = RING_RADIUS + Math.sin(knobRadians) * KNOB_RADIUS - KNOB_SIZE / 2;
    const knobY = RING_RADIUS - Math.cos(knobRadians) * KNOB_RADIUS - KNOB_SIZE / 2;
    const displayedTagName = selectedTag?.name || 'Deep Work';
    const displayedTagColor = selectedTag?.colorCode || '#3C6540';

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
            Alert.alert('Error', error?.response?.data?.error?.message || 'Cant load tags');
            return [];
        } finally {
            setTagsLoading(false);
        }
    }, []);

    const openTagPicker = useCallback(() => {
        setDraftSelectedTag(selectedTag);
        setTagSearchQuery('');
        setIsTagPickerVisible(true);

        if (!tagsLoaded) {
            loadTags();
        }
    }, [loadTags, selectedTag, tagsLoaded]);

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
            Alert.alert('Error', error?.response?.data?.error?.message || 'Cant create tag');
        } finally {
            setCreatingTag(false);
        }
    }, [formColor, formName, loadTags, resetCreateTagForm]);

    const confirmSelectedTag = useCallback(() => {
        setSelectedTag(draftSelectedTag);
        setIsTagPickerVisible(false);
        setTagSearchQuery('');
    }, [draftSelectedTag]);

    const measureProgressControl = useCallback(() => {
        requestAnimationFrame(() => {
            progressControlRef.current?.measureInWindow((x, y) => {
                progressOriginRef.current = { x, y };
            });
        });
    }, []);

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
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: updateFocusMinutes,
        onPanResponderMove: updateFocusMinutes,
    }), [updateFocusMinutes]);

    return (
        <AppLayout title="Grow a tree" iconPosition="left">
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
                        ]}
                        onPress={openTagPicker}
                        activeOpacity={0.78}
                    >
                        <View style={[styles.focusDot, { backgroundColor: displayedTagColor }]} />
                        <Text numberOfLines={1} style={styles.focusText}>{displayedTagName}</Text>
                    </TouchableOpacity>

                    <Text style={[
                        styles.timerText,
                        isShortScreen && styles.timerTextCompact,
                    ]}>
                        {formatFocusTime(focusMinutes)}
                    </Text>

                    <View style={[
                        styles.spacer,
                        isShortScreen && styles.spacerCompact,
                    ]} />

                    <TouchableOpacity
                        style={styles.startButton}
                        activeOpacity={0.82}
                        onPress={() => undefined}
                    >
                        <Icon name="play" size={scale.ms(15)} color="#FFFFFF" />
                        <Text style={styles.startButtonText}>Start Focus</Text>
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
                                    placeholder="Search existing tags..."
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
                                        {tagSearchQuery.trim() ? 'No matching tags' : 'No tags yet'}
                                    </Text>
                                )}

                                <TouchableOpacity
                                    style={styles.newTagPill}
                                    activeOpacity={0.75}
                                    onPress={openCreateTagModal}
                                >
                                    <Icon name="plus" size={scale.ms(12)} color="#161D18" />
                                    <Text style={styles.newTagText}>New Tag</Text>
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
                                <Text style={styles.selectTagButtonText}>Select Tag</Text>
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

                            <Text style={styles.createTagTitle}>Create New Tag</Text>

                            <Text style={styles.createTagLabel}>Enter tag name</Text>
                            <TextInput
                                value={formName}
                                onChangeText={setFormName}
                                style={styles.createTagInput}
                                placeholder="e.g. Deep Work"
                                placeholderTextColor="#AAAAAA"
                                maxLength={15}
                                autoFocus
                            />

                            <Text style={styles.createTagLabel}>Select Color</Text>
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
                                    <Text style={styles.createTagButtonText}>Create Tag</Text>
                                )}
                            </TouchableOpacity>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
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
});

export default GrowTreeScreen;
