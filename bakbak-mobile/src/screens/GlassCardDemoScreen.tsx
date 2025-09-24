import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  GlassCard, 
  GlassButton, 
  LightGlassCard, 
  MediumGlassCard,
  DarkGlassCard,
  GlassCardProps 
} from '../components/GlassCard';
import { theme } from '../constants/theme';

export const GlassCardDemoScreen: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [elevation, setElevation] = useState(8);

  const showAlert = (title: string) => {
    Alert.alert('Glass Button Pressed', title);
  };

  return (
    <LinearGradient
      colors={theme.colors.primary.gradient as any}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LightGlassCard style={styles.headerCard} elevation={3} borderRadius={20}>
          <View style={styles.header}>
            <Text style={styles.title}>Glass Cards Demo</Text>
            <Text style={styles.subtitle}>
              Showcasing different glass card variants with various effects
            </Text>
          </View>
        </LightGlassCard>

        {/* Basic Glass Cards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Glass Cards</Text>
          
          {/* Light Glass Card */}
          <LightGlassCard style={styles.demoCard} elevation={2} borderRadius={16}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Light Glass Card</Text>
              <Text style={styles.cardDescription}>
                Subtle transparency with light blur effect. Perfect for overlays and headers.
              </Text>
            </View>
          </LightGlassCard>

          {/* Medium Glass Card */}
          <MediumGlassCard style={styles.demoCard} elevation={6} borderRadius={16}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Medium Glass Card</Text>
              <Text style={styles.cardDescription}>
                Balanced transparency with medium blur. Great for forms and content blocks.
              </Text>
            </View>
          </MediumGlassCard>

          {/* Dark Glass Card */}
          <DarkGlassCard style={styles.demoCard} elevation={10} borderRadius={16}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Dark Glass Card</Text>
              <Text style={styles.cardDescription}>
                Strong blur with darker overlay. Ideal for modals and emphasis.
              </Text>
            </View>
          </DarkGlassCard>

          {/* Custom Glass Card */}
          <GlassCard 
            style={styles.demoCard} 
            elevation={elevation} 
            borderRadius={20}
            intensity={25}
            tint="light"
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Custom Glass Card</Text>
              <Text style={styles.cardDescription}>
                Customizable intensity, tint, and elevation. Current elevation: {elevation}
              </Text>
            </View>
          </GlassCard>
        </View>

        {/* Interactive Glass Buttons Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactive Glass Buttons</Text>
          
          {/* Basic Glass Button */}
          <GlassButton
            style={styles.buttonDemo}
            onPress={() => showAlert('Basic Glass Button')}
            elevation={4}
            borderRadius={12}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Basic Glass Button</Text>
            </View>
          </GlassButton>

          {/* High Intensity Glass Button */}
          <GlassButton
            style={styles.buttonDemo}
            onPress={() => showAlert('High Intensity Glass Button')}
            elevation={8}
            borderRadius={16}
            intensity={30}
            tint="dark"
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>High Intensity Button</Text>
            </View>
          </GlassButton>

          {/* Disabled Glass Button */}
          <GlassButton
            style={{ ...styles.buttonDemo, opacity: 0.6 }}
            onPress={() => {}}
            disabled
            elevation={2}
            borderRadius={12}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Disabled Glass Button</Text>
            </View>
          </GlassButton>
        </View>

        {/* Form Elements with Glass Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Form Elements</Text>
          
          <MediumGlassCard style={styles.formCard} elevation={6} borderRadius={18}>
            <Text style={styles.formTitle}>Settings</Text>
            
            {/* Switch Control */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Enable Notifications</Text>
              <Switch
                value={isEnabled}
                onValueChange={setIsEnabled}
                trackColor={{ 
                  false: 'rgba(255, 255, 255, 0.3)', 
                  true: theme.colors.primary.start 
                }}
                thumbColor={isEnabled ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            {/* Slider Control - Removed for simplicity */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Volume Control</Text>
              <Text style={styles.formLabel}>Enabled</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.formActions}>
              <GlassButton
                style={styles.formButton}
                onPress={() => showAlert('Save Settings')}
                elevation={4}
                borderRadius={12}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Save</Text>
                </View>
              </GlassButton>

              <GlassButton
                style={styles.formButton}
                onPress={() => showAlert('Reset Settings')}
                elevation={4}
                borderRadius={12}
                intensity={20}
                tint="dark"
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Reset</Text>
                </View>
              </GlassButton>
            </View>
          </MediumGlassCard>
        </View>

        {/* Nested Glass Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nested Glass Cards</Text>
          
          <DarkGlassCard style={styles.outerCard} elevation={12} borderRadius={24}>
            <Text style={styles.nestedTitle}>Outer Dark Glass Card</Text>
            
            <MediumGlassCard style={styles.innerCard} elevation={6} borderRadius={16}>
              <Text style={styles.nestedSubtitle}>Medium Inner Card</Text>
              <Text style={styles.nestedDescription}>
                Glass cards can be nested to create layered effects with different blur intensities.
              </Text>
              
              <LightGlassCard style={styles.deepInnerCard} elevation={3} borderRadius={12}>
                <Text style={styles.deepNestedText}>Light Deepest Card</Text>
                <Text style={styles.deepNestedDescription}>
                  This creates a beautiful depth effect.
                </Text>
              </LightGlassCard>
            </MediumGlassCard>
          </DarkGlassCard>
        </View>

        {/* Footer */}
        <LightGlassCard style={styles.footerCard} elevation={2} borderRadius={16}>
          <Text style={styles.footerText}>
            🎨 Glass cards provide beautiful frosted glass effects that work across iOS and Android
          </Text>
        </LightGlassCard>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  headerCard: {
    marginBottom: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  demoCard: {
    marginBottom: theme.spacing.md,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  sliderContainer: {
    marginTop: theme.spacing.md,
  },
  sliderLabel: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  buttonDemo: {
    marginBottom: theme.spacing.md,
  },
  buttonContent: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  formCard: {
    padding: theme.spacing.lg,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  formLabel: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  formSlider: {
    width: '100%',
    height: 40,
    marginBottom: theme.spacing.lg,
  },
  formActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  formButton: {
    flex: 1,
  },
  outerCard: {
    padding: theme.spacing.lg,
  },
  nestedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  innerCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  nestedSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  nestedDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  deepInnerCard: {
    padding: theme.spacing.sm,
  },
  deepNestedText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  deepNestedDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  footerCard: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
