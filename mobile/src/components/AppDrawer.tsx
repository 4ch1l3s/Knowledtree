import React, { useEffect, useRef, useContext, useState } from 'react';
import { View, Text, Image, Modal, TouchableOpacity, Animated, Dimensions, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.82; // Adjusting to exactly match the proportion in Figma

interface AppDrawerProps {
    isVisible: boolean;
    onClose: () => void;
    onLogout?: () => void;
}

const AppDrawer: React.FC<AppDrawerProps> = ({ isVisible, onClose, onLogout }) => {
    const { theme } = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { userInfo, avatar } = useContext(AuthContext);
    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [modalVisible, setModalVisible] = useState(isVisible);

    // Use user's real name or fallback
    const displayName = userInfo?.name || userInfo?.userName || 'User';
    const initials = displayName.charAt(0).toUpperCase();

    useEffect(() => {
        if (isVisible) {
            setModalVisible(true);
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -DRAWER_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start(() => {
                setModalVisible(false);
            });
        }
    }, [isVisible, slideAnim, fadeAnim]);

    return (
        <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.backgroundDim, { opacity: fadeAnim }]} />
                </TouchableWithoutFeedback>

                <Animated.View style={[
                    styles.drawer,
                    {
                        width: DRAWER_WIDTH,
                        backgroundColor: theme.colors.surface,
                        transform: [{ translateX: slideAnim }]
                    }
                ]}>
                    <View style={styles.scrollContainer}>
                        {/* ── Banner ── */}
                        <View style={[styles.banner, { backgroundColor: '#638A63' }]} />

                        {/* ── Profile Section ── */}
                        <View style={styles.profileSection}>
                            <View style={[styles.avatarContainer, { borderColor: theme.colors.surface, backgroundColor: '#464E47' }]}>
                                {avatar ? (
                                    <Image
                                        source={{ uri: `data:${avatar.contentType};base64,${avatar.base64Content}` }}
                                        style={styles.avatarImage}
                                    />
                                ) : (
                                    <Text style={styles.avatarInitials}>{initials}</Text>
                                )}
                            </View>
                            <View style={styles.nameWrapper}>
                                <Text style={[styles.userName, { color: theme.colors.text }]}>
                                    {displayName}
                                </Text>
                            </View>
                        </View>

                        {/* ── Navigation Items ── */}
                        <View style={styles.content}>
                            <TouchableOpacity
                                style={[styles.menuItem, route.name === 'Profile' && { backgroundColor: '#DDFBEA' }]}
                                onPress={() => { onClose(); navigation.navigate('Profile'); }}
                            >
                                <FontAwesome name="user-o" size={scale.ms(16)} color={route.name === 'Profile' ? "#157A42" : "#4A5A4D"} style={styles.menuIcon} />
                                <Text style={[styles.menuText, { color: route.name === 'Profile' ? '#157A42' : '#4A5A4D', fontWeight: route.name === 'Profile' ? 'bold' : '500' }]}>Profile</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.menuItem, route.name === 'GrowTree' && { backgroundColor: '#DDFBEA' }]}
                                onPress={() => { onClose(); navigation.navigate('GrowTree'); }}
                            >
                                <FontAwesome name="tree" size={scale.ms(16)} color={route.name === 'GrowTree' ? "#157A42" : "#4A5A4D"} style={styles.menuIcon} />
                                <Text style={[styles.menuText, { color: route.name === 'GrowTree' ? '#157A42' : '#4A5A4D', fontWeight: route.name === 'GrowTree' ? 'bold' : '500' }]}>Grow a tree</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.menuItem, route.name === 'Treepedia' && { backgroundColor: '#DDFBEA' }]}
                                onPress={() => { onClose(); navigation.navigate('Treepedia'); }}
                            >
                                <FontAwesome name="book" size={scale.ms(16)} color={route.name === 'Treepedia' ? "#157A42" : "#4A5A4D"} style={styles.menuIcon} />
                                <Text style={[styles.menuText, { color: route.name === 'Treepedia' ? '#157A42' : '#4A5A4D', fontWeight: route.name === 'Treepedia' ? 'bold' : '500' }]}>Treepedia</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.menuItem, route.name === 'Shop' && { backgroundColor: '#DDFBEA' }]}
                                onPress={() => { onClose(); navigation.navigate('Shop'); }}
                            >
                                <FontAwesome name="shopping-bag" size={scale.ms(16)} color={route.name === 'Shop' ? "#157A42" : "#4A5A4D"} style={styles.menuIcon} />
                                <Text style={[styles.menuText, { color: route.name === 'Shop' ? '#157A42' : '#4A5A4D', fontWeight: route.name === 'Shop' ? 'bold' : '500' }]}>Shop</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.menuItem, route.name === 'Friend' && { backgroundColor: '#DDFBEA' }]}
                                onPress={() => { onClose(); navigation.navigate('Friend'); }}
                            >
                                <FontAwesome name="users" size={scale.ms(16)} color={route.name === 'Friend' ? "#157A42" : "#4A5A4D"} style={styles.menuIcon} />
                                <Text style={[styles.menuText, { color: route.name === 'Friend' ? '#157A42' : '#4A5A4D', fontWeight: route.name === 'Friend' ? 'bold' : '500' }]}>Friend</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.menuItem, route.name === 'History' && { backgroundColor: '#DDFBEA' }]}
                                onPress={() => { onClose(); navigation.navigate('History'); }}
                            >
                                <FontAwesome name="history" size={scale.ms(16)} color={route.name === 'History' ? "#157A42" : "#4A5A4D"} style={styles.menuIcon} />
                                <Text style={[styles.menuText, { color: route.name === 'History' ? '#157A42' : '#4A5A4D', fontWeight: route.name === 'History' ? 'bold' : '500' }]}>Timeline</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.menuItem, route.name === 'Tags' && { backgroundColor: '#DDFBEA' }]}
                                onPress={() => { onClose(); navigation.navigate('Tags'); }}
                            >
                                <FontAwesome name="tag" size={scale.ms(16)} color={route.name === 'Tags' ? "#157A42" : "#4A5A4D"} style={styles.menuIcon} />
                                <Text style={[styles.menuText, { color: route.name === 'Tags' ? '#157A42' : '#4A5A4D', fontWeight: route.name === 'Tags' ? 'bold' : '500' }]}>Tags</Text>
                            </TouchableOpacity>

                            {/* Divider line */}
                            <View style={styles.divider} />

                            <Text style={styles.sectionHeader}>SETTINGS & ACCOUNT</Text>

                            <TouchableOpacity style={styles.menuItem} onPress={onClose}>
                                <FontAwesome name="cog" size={scale.ms(16)} color="#4A5A4D" style={styles.menuIcon} />
                                <Text style={[styles.menuText, { color: '#4A5A4D' }]}>Config</Text>
                            </TouchableOpacity>

                            {onLogout && (
                                <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onLogout(); }}>
                                    <FontAwesome name="sign-out" size={scale.ms(16)} color="#4A5A4D" style={styles.menuIcon} />
                                    <Text style={[styles.menuText, { color: '#4A5A4D' }]}>Sign out</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* ── Footer ── */}
                    <View style={[styles.footer, { backgroundColor: '#EEF6EC' }]}>
                        <View style={styles.footerBrandContainer}>
                            <FontAwesome name="leaf" size={scale.ms(12)} color="#3D5A40" />
                            <Text style={styles.footerBrandText}>KAIROS GARDEN</Text>
                        </View>
                        <Text style={styles.footerVersion}>v1.0.0</Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        flexDirection: 'row',
    },
    backgroundDim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    drawer: {
        height: '100%',
        borderTopRightRadius: scale.s(22),
        borderBottomRightRadius: scale.s(22),
        overflow: 'hidden', // Ensures the banner corners are also rounded seamlessly
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
        justifyContent: 'space-between',
    },
    scrollContainer: {
        flex: 1,
    },
    banner: {
        height: scale.vs(160),
        width: '100%',
    },
    profileSection: {
        flexDirection: 'row',
        paddingHorizontal: scale.s(20),
        marginTop: -scale.vs(38),
        marginBottom: scale.vs(15),
    },
    avatarContainer: {
        width: scale.s(76),
        height: scale.s(76),
        borderRadius: scale.s(38),
        borderWidth: scale.s(4),
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: scale.s(68),
        height: scale.s(68),
        borderRadius: scale.s(34),
    },
    avatarInitials: {
        fontSize: scale.ms(28),
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    nameWrapper: {
        justifyContent: 'flex-end',
        paddingBottom: scale.vs(12),
        marginLeft: scale.s(12),
    },
    userName: {
        fontSize: scale.ms(22),
        fontWeight: '300', // A lighter font weight to match the design
    },
    content: {
        paddingTop: scale.vs(10),
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: scale.vs(14),
        paddingHorizontal: scale.s(16),
        marginHorizontal: scale.s(16),
        marginBottom: scale.vs(4),
        borderRadius: scale.s(8),
    },
    menuIcon: {
        width: scale.s(26),
        textAlign: 'center',
    },
    menuText: {
        fontSize: scale.ms(15),
        fontWeight: '500',
        marginLeft: scale.s(8),
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: scale.s(16),
        marginVertical: scale.vs(10),
    },
    sectionHeader: {
        fontSize: scale.ms(10),
        color: '#8A9A8C',
        fontWeight: '600',
        marginLeft: scale.s(33),
        marginTop: scale.vs(8),
        marginBottom: scale.vs(10),
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: scale.vs(18),
        paddingHorizontal: scale.s(24),
    },
    footerBrandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerBrandText: {
        color: '#3D5A40',
        fontSize: scale.ms(11),
        fontWeight: 'bold',
        letterSpacing: 1,
        marginLeft: scale.s(8),
    },
    footerVersion: {
        color: '#9E9E9E',
        fontSize: scale.ms(11),
    }
});

export default AppDrawer;
