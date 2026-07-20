import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AppLayout from '../components/AppLayout';
import { useTheme } from '../theme';
import type { Theme } from '../theme';
import { scale } from '../utils/scale';
import { AppLanguage, useLocalization } from '../localization';

type ThemePreference = 'Light' | 'Dark' | 'System';

const CARD_BORDER_COLOR = '#D9E0D9';
const DIVIDER_COLOR = '#E8ECE8';

interface SectionHeaderProps {
    title: string;
    theme: Theme;
}

interface SettingRowProps {
    icon: string;
    title: string;
    children: React.ReactNode;
    isLast?: boolean;
    theme: Theme;
}

const SectionHeader = ({ title, theme }: SectionHeaderProps) => (
    <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primaryDark }]}>{title}</Text>
    </View>
);

const SettingRow = ({ icon, title, children, isLast = false, theme }: SettingRowProps) => (
    <View
        style={[
            styles.settingRow,
            !isLast && styles.settingRowBorder,
            !isLast && { borderBottomColor: DIVIDER_COLOR },
        ]}
    >
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <FontAwesome name={icon} size={scale.ms(17)} color={theme.colors.textSecondary} />
        </View>
        <View style={styles.settingCopy}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
        </View>
        {children}
    </View>
);

const SettingsScreen = () => {
    const { theme } = useTheme();
    const { language, setLanguage, t } = useLocalization();
    const [dailyReminder, setDailyReminder] = useState(true);
    const [completionSound, setCompletionSound] = useState(true);
    const [vibration, setVibration] = useState(true);
    const [themePreference, setThemePreference] = useState<ThemePreference>('System');

    const renderSwitch = (value: boolean, onValueChange: (nextValue: boolean) => void) => (
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#D9DEDA', true: '#9BC5A2' }}
            thumbColor={value ? '#3D6B45' : '#FFFFFF'}
            ios_backgroundColor="#D9DEDA"
        />
    );

    return (
        <AppLayout title={t('nav.settings')}>
            <ScrollView
                style={[styles.screen, { backgroundColor: theme.colors.background }]}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <SectionHeader
                    title={t('settings.focus')}
                    theme={theme}
                />
                <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: CARD_BORDER_COLOR }]}>
                    <SettingRow
                        icon="bell-o"
                        title={t('settings.dailyReminder')}
                        theme={theme}
                    >
                        {renderSwitch(dailyReminder, setDailyReminder)}
                    </SettingRow>
                    {dailyReminder ? (
                        <View style={[styles.reminderTimeRow, { borderBottomColor: DIVIDER_COLOR }]}>
                            <View style={styles.reminderGuide} />
                            <Text style={[styles.reminderTimeLabel, { color: theme.colors.textSecondary }]}>{t('settings.reminderTime')}</Text>
                            <View style={styles.timePill}>
                                <FontAwesome name="clock-o" size={scale.ms(13)} color="#3D6B45" />
                                <Text style={styles.timePillText}>20:00</Text>
                            </View>
                        </View>
                    ) : null}
                    <SettingRow
                        icon="volume-up"
                        title={t('settings.completionSound')}
                        theme={theme}
                    >
                        {renderSwitch(completionSound, setCompletionSound)}
                    </SettingRow>
                    <SettingRow
                        icon="mobile"
                        title={t('settings.vibration')}
                        isLast
                        theme={theme}
                    >
                        {renderSwitch(vibration, setVibration)}
                    </SettingRow>
                </View>

                <SectionHeader
                    title={t('settings.appearance')}
                    theme={theme}
                />
                <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: CARD_BORDER_COLOR }]}>
                    <View style={[styles.choiceBlock, styles.choiceBlockBorder, { borderBottomColor: DIVIDER_COLOR }]}>
                        <View style={styles.choiceHeading}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                <FontAwesome name="moon-o" size={scale.ms(17)} color={theme.colors.textSecondary} />
                            </View>
                            <View style={styles.settingCopy}>
                                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{t('settings.theme')}</Text>
                            </View>
                        </View>
                        <View style={[styles.segmentedControl, { backgroundColor: theme.colors.backgroundSecondary }]}>
                            {(['Light', 'Dark', 'System'] as ThemePreference[]).map(option => {
                                const selected = option === themePreference;
                                return (
                                    <TouchableOpacity
                                        key={option}
                                        activeOpacity={0.8}
                                        style={[styles.segment, selected && styles.segmentSelected]}
                                        onPress={() => setThemePreference(option)}
                                    >
                                        <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{t(`settings.theme.${option.toLowerCase()}` as 'settings.theme.light' | 'settings.theme.dark' | 'settings.theme.system')}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                    <View style={styles.choiceBlock}>
                        <View style={styles.choiceHeading}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                <FontAwesome name="language" size={scale.ms(17)} color={theme.colors.textSecondary} />
                            </View>
                            <View style={styles.settingCopy}>
                                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{t('settings.language')}</Text>
                            </View>
                        </View>
                        <View style={styles.languageOptions}>
                            {(['en', 'vi'] as AppLanguage[]).map(option => {
                                const selected = option === language;
                                return (
                                    <TouchableOpacity
                                        key={option}
                                        activeOpacity={0.8}
                                        style={[
                                            styles.languagePill,
                                            selected ? styles.languagePillSelectedBorder : styles.languagePillDefaultBorder,
                                            selected && styles.languagePillSelected,
                                        ]}
                                        onPress={() => setLanguage(option)}
                                    >
                                        <Text style={[styles.languageText, selected && styles.languageTextSelected]}>{t(option === 'en' ? 'settings.english' : 'settings.vietnamese')}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                <SectionHeader
                    title={t('settings.about')}
                    theme={theme}
                />
                <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: CARD_BORDER_COLOR }]}>
                    <SettingRow icon="info-circle" title={t('settings.appVersion')} theme={theme}>
                        <Text style={[styles.rowValue, { color: theme.colors.textSecondary }]}>1.0.0</Text>
                    </SettingRow>
                    <SettingRow icon="shield" title={t('settings.privacyPolicy')} theme={theme}>
                        <FontAwesome name="angle-right" size={scale.ms(20)} color={theme.colors.textSecondary} />
                    </SettingRow>
                    <SettingRow icon="file-text-o" title={t('settings.terms')} isLast theme={theme}>
                        <FontAwesome name="angle-right" size={scale.ms(20)} color={theme.colors.textSecondary} />
                    </SettingRow>
                </View>

            </ScrollView>
        </AppLayout>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    content: {
        paddingHorizontal: scale.s(16),
        paddingTop: 0,
        paddingBottom: scale.vs(36),
    },
    sectionHeader: {
        marginTop: scale.vs(18),
        marginBottom: scale.vs(10),
        paddingHorizontal: scale.s(2),
    },
    sectionTitle: {
        fontSize: scale.ms(16),
        fontWeight: '700',
    },
    card: {
        borderWidth: 1,
        borderRadius: scale.s(16),
        overflow: 'hidden',
    },
    settingRow: {
        minHeight: scale.vs(72),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale.s(14),
        paddingVertical: scale.vs(12),
    },
    settingRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    iconContainer: {
        width: scale.s(36),
        height: scale.s(36),
        borderRadius: scale.s(11),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: scale.s(12),
    },
    settingCopy: {
        flex: 1,
        paddingRight: scale.s(10),
    },
    settingTitle: {
        fontSize: scale.ms(14),
        fontWeight: '600',
    },
    reminderTimeRow: {
        minHeight: scale.vs(49),
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: scale.s(14),
        paddingLeft: scale.s(62),
    },
    reminderGuide: {
        position: 'absolute',
        left: scale.s(31),
        top: 0,
        width: 1,
        height: '100%',
        backgroundColor: '#D9E8D9',
    },
    reminderTimeLabel: {
        flex: 1,
        fontSize: scale.ms(11),
        fontWeight: '500',
    },
    timePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale.s(6),
        backgroundColor: '#E2F1E1',
        borderRadius: scale.s(10),
        paddingHorizontal: scale.s(11),
        paddingVertical: scale.vs(7),
    },
    timePillText: {
        color: '#3D6B45',
        fontSize: scale.ms(12),
        fontWeight: '700',
    },
    choiceBlock: {
        paddingHorizontal: scale.s(14),
        paddingVertical: scale.vs(14),
    },
    choiceBlockBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    choiceHeading: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    segmentedControl: {
        flexDirection: 'row',
        borderRadius: scale.s(11),
        padding: scale.s(3),
        marginTop: scale.vs(12),
    },
    segment: {
        flex: 1,
        minHeight: scale.vs(34),
        borderRadius: scale.s(9),
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentSelected: {
        backgroundColor: '#568259',
    },
    segmentText: {
        color: '#627166',
        fontSize: scale.ms(11),
        fontWeight: '600',
    },
    segmentTextSelected: {
        color: '#FFFFFF',
    },
    languageOptions: {
        flexDirection: 'row',
        gap: scale.s(8),
        marginTop: scale.vs(12),
    },
    languagePill: {
        flex: 1,
        minHeight: scale.vs(36),
        borderWidth: 1,
        borderRadius: scale.s(10),
        alignItems: 'center',
        justifyContent: 'center',
    },
    languagePillSelected: {
        backgroundColor: '#E8F3E6',
    },
    languagePillSelectedBorder: {
        borderColor: '#568259',
    },
    languagePillDefaultBorder: {
        borderColor: CARD_BORDER_COLOR,
    },
    languageText: {
        color: '#68746A',
        fontSize: scale.ms(11),
        fontWeight: '600',
    },
    languageTextSelected: {
        color: '#3D6B45',
    },
    rowValue: {
        fontSize: scale.ms(12),
        fontWeight: '600',
    },
});

export default SettingsScreen;
