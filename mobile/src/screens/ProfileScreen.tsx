import React, { useContext, useMemo } from 'react';
import {
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

// ── Màu từ Figma ──
const GREEN_BG = '#568259';
const BODY_BG = '#F3FCF2';
const HEADER_TEXT = '#3D5A40';
const CARD_BORDER = '#C1C9BE';
const SCREEN_HEIGHT = Dimensions.get('window').height;
const GREEN_HEIGHT = SCREEN_HEIGHT * 0.30;

// ── Tạo dữ liệu heatmap giả (91 ngày = 13 tuần) ──
const generateHeatmapData = (): number[] => {
    const data: number[] = [];
    for (let i = 0; i < 91; i++) {
        data.push(Math.floor(Math.random() * 4));
    }
    return data;
};

// ── Màu heatmap ──
const HEATMAP_COLORS: Record<number, string> = {
    0: '#D5E8D4',
    1: '#A5D6A7',
    2: '#568259',
    3: '#2E5732',
};

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
}

const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
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
                <Text style={styles.heatmapTitle}>90 days heatmap</Text>
                <FontAwesome name="info-circle" size={scale.ms(14)} color="#888" />
            </View>
            <View style={[styles.heatmapGrid, { gap }]}>
                {grid.map((column, colIdx) => (
                    <View key={colIdx} style={{ gap }}>
                        {column.map((level, rowIdx) => (
                            <View
                                key={rowIdx}
                                style={{
                                    width: cellSize,
                                    height: cellSize,
                                    borderRadius: scale.s(2),
                                    backgroundColor: level >= 0 ? HEATMAP_COLORS[level] : 'transparent',
                                }}
                            />
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
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

    const displayName = userInfo?.name || userInfo?.userName || 'Nguoi dung';
    const avatarSize = scale.s(80);
    const heatmapData = useMemo(() => generateHeatmapData(), []);

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
                <Text style={styles.headerTitle}>Profile</Text>
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
                            <StatCard iconName="tree" value="49" label="Trees unlocked" />
                            <StatCard iconName="money" value="2,000 $" label="Coin" />
                        </View>
                        <View style={styles.statsRow}>
                            <StatCard iconName="clock-o" value="1,024 h" label="Focus hours" />
                            <StatCard iconName="fire" value="6 days" label="Streak" />
                        </View>
                    </View>

                    {/* Heatmap */}
                    <Heatmap data={heatmapData} />
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
