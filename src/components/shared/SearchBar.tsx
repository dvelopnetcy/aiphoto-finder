import React from 'react';
import { View, TextInput, StyleSheet, Pressable, NativeSyntheticEvent, TextInputSubmitEditingEventData } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radii, spacing, typography } from '@/constants/Theme';
import { Icon } from '@/components/ui/Icon';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onVoicePress: () => void;
  placeholder?: string;
  onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
}

export const SearchBar = ({
  value,
  onChangeText,
  onVoicePress,
  placeholder = 'Search your memories...',
  onSubmitEditing,
}: SearchBarProps) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Icon name="Search" size={20} color={theme.textSecondary} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
      />
      <Pressable onPress={onVoicePress} style={({ pressed }) => [styles.micButton, pressed && styles.pressed]}>
        <Icon name="Mic" size={20} color={theme.primary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 50,
    borderRadius: radii.full,
    borderWidth: 1,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    height: '100%',
  },
  micButton: {
    padding: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
});