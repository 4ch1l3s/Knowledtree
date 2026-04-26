import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Modal,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TextStyle,
    Pressable,
} from 'react-native';
import { useTheme } from '../theme';
import { scale } from '../utils/scale';
import AppLayout from '../components/AppLayout';
import { AuthContext } from '../context/AuthContext';
import {
    TagDto,
    getMyTags,
    createTag,
    updateTag,
    deleteTag,
} from '../api/tags';

// Mau sac co dinh cho color picker (theo thiet ke)
const TAG_COLORS = [
    '#3B6B3B', // xanh dam
    '#E85D5D', // do
    '#4A9FD9', // xanh duong
    '#5CB8E8', // xanh nhat
    '#F5A623', // cam
    '#9B59B6', // tim
    '#E84393', // hong
    '#48D1CC', // cyan
    '#F1C40F', // vang
];

const TagsScreen = () => {
    const { theme } = useTheme();
    const { userToken } = useContext(AuthContext);

    // State
    const [tags, setTags] = useState<TagDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showMenuId, setShowMenuId] = useState<number | null>(null);

    // Form state cho create/edit
    const [formName, setFormName] = useState('');
    const [formColor, setFormColor] = useState(TAG_COLORS[0]);
    const [editingTag, setEditingTag] = useState<TagDto | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Load tags
    const loadTags = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMyTags();
            setTags(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTags();
    }, [loadTags]);

    // Loc tags theo search
    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Tao tag moi
    const handleCreate = async () => {
        if (!formName.trim()) return;
        try {
            setSubmitting(true);
            await createTag({ name: formName.trim(), colorCode: formColor });
            setShowCreateModal(false);
            resetForm();
            await loadTags();
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.error?.message || 'Cant create tag');
        } finally {
            setSubmitting(false);
        }
    };

    // Cap nhat tag
    const handleUpdate = async () => {
        if (!editingTag || !formName.trim()) return;
        try {
            setSubmitting(true);
            await updateTag(editingTag.id, { name: formName.trim(), colorCode: formColor });
            setShowCreateModal(false);
            resetForm();
            await loadTags();
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.error?.message || 'Cant update tag');
        } finally {
            setSubmitting(false);
        }
    };

    // Xoa tag
    const handleDelete = (tag: TagDto) => {
        setShowMenuId(null);
        Alert.alert(
            'Delete tag',
            `Are you sure you want to delete "${tag.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTag(tag.id);
                            await loadTags();
                        } catch (error: any) {
                            Alert.alert('Error', 'Cant delete tag');
                        }
                    },
                },
            ]
        );
    };

    // Mo form edit
    const openEdit = (tag: TagDto) => {
        setShowMenuId(null);
        setEditingTag(tag);
        setFormName(tag.name);
        setFormColor(tag.colorCode);
        setShowCreateModal(true);
    };

    // Mo form create
    const openCreate = () => {
        resetForm();
        setShowCreateModal(true);
    };

    // Reset form
    const resetForm = () => {
        setFormName('');
        setFormColor(TAG_COLORS[0]);
        setEditingTag(null);
    };

    // Render 1 tag item
    const renderTagItem = ({ item }: { item: TagDto }) => (
        <View style={styles.tagItem}>
            <View style={[styles.tagDot, { backgroundColor: item.colorCode }]} />
            <Text style={[styles.tagName, { color: theme.colors.text }]}>{item.name}</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowMenuId(showMenuId === item.id ? null : item.id)}
            >
                <Text style={[styles.menuDots, { color: theme.colors.textSecondary }]}>...</Text>
            </TouchableOpacity>

            {/* Popup menu */}
            {showMenuId === item.id && (
                <View style={[styles.popupMenu, { backgroundColor: theme.colors.surface }]}>
                    <TouchableOpacity style={styles.popupItem} onPress={() => openEdit(item)}>
                        <Text style={styles.popupText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.popupItem} onPress={() => handleDelete(item)}>
                        <Text style={[styles.popupText, { color: '#E85D5D' }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    // Dong popup khi nhan ngoai
    const dismissMenu = () => {
        if (showMenuId !== null) setShowMenuId(null);
    };

    return (
        <AppLayout title="Tags" iconPosition="left">
            <Pressable style={styles.container} onPress={dismissMenu}>
                {/* Search bar */}
                <View style={[styles.searchContainer, { backgroundColor: '#F5F5F5' }]}>
                    <Text style={styles.searchIcon}>Q</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search existing tags.."
                        placeholderTextColor="#AAAAAA"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Header danh sach */}
                <View style={styles.listHeader}>
                    <Text style={[styles.listTitle, { color: theme.colors.text }]}>Your Tags</Text>
                    <Text style={[styles.listCount, { color: theme.colors.textSecondary }]}>
                        {filteredTags.length} Tags found
                    </Text>
                </View>

                {/* Danh sach tags */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredTags}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderTagItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                )}

                {/* FAB button */}
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: '#464E47' }]}
                    onPress={openCreate}
                    activeOpacity={0.8}
                >
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
            </Pressable>

            {/* Modal tao/sua tag */}
            <Modal
                visible={showCreateModal}
                transparent
                animationType="slide"
                onRequestClose={() => { setShowCreateModal(false); resetForm(); }}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => { setShowCreateModal(false); resetForm(); }}
                >
                    <Pressable style={styles.modalContent} onPress={() => { }}>
                        {/* Thanh keo */}
                        <View style={styles.modalHandle} />

                        <Text style={styles.modalTitle}>
                            {editingTag ? 'Edit Tag' : 'Create New Tag'}
                        </Text>

                        {/* Input ten tag */}
                        <Text style={styles.inputLabel}>Enter tag name</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. Fragile"
                            placeholderTextColor="#AAAAAA"
                            value={formName}
                            onChangeText={setFormName}
                            maxLength={15}
                            autoFocus
                        />

                        {/* Color picker */}
                        <Text style={styles.inputLabel}>Select Color</Text>
                        <View style={styles.colorGrid}>
                            {TAG_COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        formColor === color && styles.colorSelected,
                                    ]}
                                    onPress={() => setFormColor(color)}
                                />
                            ))}
                        </View>

                        {/* Button tao/cap nhat */}
                        <TouchableOpacity
                            style={[
                                styles.createButton,
                                { backgroundColor: '#464E47' },
                                (!formName.trim() || submitting) && styles.buttonDisabled,
                            ]}
                            onPress={editingTag ? handleUpdate : handleCreate}
                            disabled={!formName.trim() || submitting}
                            activeOpacity={0.8}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.createButtonText}>
                                    {editingTag ? 'Update Tag' : 'Create Tag'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: scale.s(20),
    },

    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: scale.s(25),
        paddingHorizontal: scale.s(16),
        paddingVertical: scale.vs(10),
        marginTop: scale.vs(8),
        marginBottom: scale.vs(16),
    },
    searchIcon: {
        fontSize: scale.ms(16),
        color: '#AAAAAA',
        marginRight: scale.s(8),
        fontWeight: 'bold',
    },
    searchInput: {
        flex: 1,
        fontSize: scale.ms(14),
        color: '#333333',
        padding: 0,
    },

    // List header
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: scale.vs(8),
    },
    listTitle: {
        fontSize: scale.ms(16),
        fontWeight: '700',
    },
    listCount: {
        fontSize: scale.ms(12),
    },

    // Tag item
    tagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: scale.vs(18),
        paddingHorizontal: scale.s(4),
        position: 'relative',
    },
    tagDot: {
        width: scale.s(12),
        height: scale.s(12),
        borderRadius: scale.s(6),
        marginRight: scale.s(14),
    },
    tagName: {
        fontSize: scale.ms(15),
        fontWeight: '500',
    },
    menuButton: {
        padding: scale.s(8),
    },
    menuDots: {
        fontSize: scale.ms(20),
        fontWeight: 'bold',
        lineHeight: scale.ms(14),
        letterSpacing: 1,
        // Xoay doc
        transform: [{ rotate: '90deg' }],
    },

    // Popup menu
    popupMenu: {
        position: 'absolute',
        right: scale.s(40),
        top: scale.vs(10),
        borderRadius: scale.s(8),
        paddingVertical: scale.vs(4),
        minWidth: scale.s(100),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 100,
    },
    popupItem: {
        paddingVertical: scale.vs(10),
        paddingHorizontal: scale.s(16),
    },
    popupText: {
        fontSize: scale.ms(14),
        color: '#333333',
    },

    // List
    listContent: {
        paddingBottom: scale.vs(80),
    },
    separator: {
        height: 1,
        backgroundColor: '#F0F0F0',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: scale.vs(24),
        right: scale.s(20),
        width: scale.s(56),
        height: scale.s(56),
        borderRadius: scale.s(28),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 8,
    },
    fabText: {
        fontSize: scale.ms(28),
        color: '#FFFFFF',
        fontWeight: '300',
        lineHeight: scale.ms(30),
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: scale.s(20),
        borderTopRightRadius: scale.s(20),
        paddingHorizontal: scale.s(24),
        paddingBottom: scale.vs(32),
        paddingTop: scale.vs(12),
    },
    modalHandle: {
        width: scale.s(40),
        height: scale.vs(4),
        backgroundColor: '#DDDDDD',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: scale.vs(16),
    },
    modalTitle: {
        fontSize: scale.ms(20),
        fontWeight: '700',
        color: '#333333',
        marginBottom: scale.vs(20),
    },
    inputLabel: {
        fontSize: scale.ms(13),
        color: '#666666',
        marginBottom: scale.vs(8),
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: scale.s(8),
        paddingHorizontal: scale.s(14),
        paddingVertical: scale.vs(12),
        fontSize: scale.ms(14),
        color: '#333333',
        marginBottom: scale.vs(20),
    },

    // Color picker
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },

    // Create button
    createButton: {
        borderRadius: scale.s(12),
        paddingVertical: scale.vs(16),
        alignItems: 'center',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: scale.ms(16),
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default TagsScreen;
