import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    GestureResponderEvent,
    Image,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Svg, { Circle } from 'react-native-svg';
import AppLayout from '../components/AppLayout';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';

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

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatFocusTime = (minutes: number) => `${minutes}:00`;

const GrowTreeScreen = () => {
    const { theme } = useTheme();
    const { height } = useWindowDimensions();
    const isShortScreen = height < 760;
    const [focusMinutes, setFocusMinutes] = useState(INITIAL_MINUTES);
    const progressControlRef = useRef<View>(null);
    const progressOriginRef = useRef({ x: 0, y: 0 });

    const progress = (focusMinutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES);
    const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
    const knobAngle = progress * 360;
    const knobRadians = knobAngle * Math.PI / 180;
    const knobX = RING_RADIUS + Math.sin(knobRadians) * KNOB_RADIUS - KNOB_SIZE / 2;
    const knobY = RING_RADIUS - Math.cos(knobRadians) * KNOB_RADIUS - KNOB_SIZE / 2;

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

                    <View style={[
                        styles.focusPill,
                        isShortScreen && styles.focusPillCompact,
                    ]}>
                        <View style={styles.focusDot} />
                        <Text style={styles.focusText}>Deep Work</Text>
                    </View>

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
});

export default GrowTreeScreen;
