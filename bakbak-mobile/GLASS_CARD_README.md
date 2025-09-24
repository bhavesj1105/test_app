# GlassCard Component Documentation

## Overview

The `GlassCard` component provides a beautiful frosted glass effect for React Native applications. It uses platform-specific optimizations to deliver the best visual experience on both iOS and Android.

## Features

- ✨ **Frosted Glass Effect**: Beautiful translucent blur effect
- 📱 **Platform Optimized**: iOS uses `BlurView`, Android uses fallback styling
- 🎨 **Customizable**: Multiple variants and styling options
- 🔧 **TypeScript Support**: Fully typed with comprehensive type definitions
- 🎯 **Accessible**: Proper accessibility support
- ⚡ **Performance Optimized**: Efficient rendering and memory usage

## Installation

The component uses `expo-blur` for the glass effect. Make sure you have it installed:

```bash
npx expo install expo-blur
```

## Component Variants

### 1. GlassCard (Base Component)

The main component with full customization options.

```tsx
import { GlassCard } from '../components/GlassCard';

<GlassCard
  style={styles.card}
  elevation={8}
  borderRadius={16}
  intensity={20}
  tint="light"
>
  <Text>Your content here</Text>
</GlassCard>
```

### 2. LightGlassCard

Pre-configured variant with light glass effect.

```tsx
import { LightGlassCard } from '../components/GlassCard';

<LightGlassCard style={styles.card} elevation={3} borderRadius={12}>
  <Text>Light glass content</Text>
</LightGlassCard>
```

### 3. MediumGlassCard

Pre-configured variant with medium glass effect.

```tsx
import { MediumGlassCard } from '../components/GlassCard';

<MediumGlassCard style={styles.card} elevation={6} borderRadius={16}>
  <Text>Medium glass content</Text>
</MediumGlassCard>
```

### 4. DarkGlassCard

Pre-configured variant with dark glass effect.

```tsx
import { DarkGlassCard } from '../components/GlassCard';

<DarkGlassCard style={styles.card} elevation={10} borderRadius={20}>
  <Text>Dark glass content</Text>
</DarkGlassCard>
```

### 5. GlassButton

Interactive button with glass effect and press feedback.

```tsx
import { GlassButton } from '../components/GlassCard';

<GlassButton
  style={styles.button}
  onPress={() => console.log('Pressed!')}
  elevation={5}
  borderRadius={12}
  intensity={15}
>
  <Text>Press Me</Text>
</GlassButton>
```

## Props

### GlassCardProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `style` | `ViewStyle` | `undefined` | Custom styles for the container |
| `elevation` | `number` | `4` | Shadow elevation (0-24) |
| `borderRadius` | `number` | `12` | Border radius in pixels |
| `intensity` | `number` | `15` | Blur intensity (iOS only, 0-100) |
| `tint` | `'light' \| 'dark' \| 'default'` | `'light'` | Blur tint (iOS only) |
| `children` | `React.ReactNode` | `undefined` | Content to render inside |

### GlassButtonProps

Extends `GlassCardProps` and adds:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onPress` | `() => void` | `undefined` | Press handler function |
| `disabled` | `boolean` | `false` | Whether button is disabled |
| `pressScale` | `number` | `0.95` | Scale factor when pressed |

## Styling Examples

### Basic Usage

```tsx
const styles = StyleSheet.create({
  card: {
    padding: 16,
    margin: 8,
  },
});

<GlassCard style={styles.card} elevation={6} borderRadius={16}>
  <Text>Glass card content</Text>
</GlassCard>
```

### Form Input

```tsx
<MediumGlassCard style={styles.inputContainer} elevation={4} borderRadius={12}>
  <TextInput
    style={styles.input}
    placeholder="Enter text..."
    placeholderTextColor="rgba(255, 255, 255, 0.7)"
  />
</MediumGlassCard>
```

### Modal Header

```tsx
<DarkGlassCard style={styles.modalHeader} elevation={12} borderRadius={0}>
  <View style={styles.headerContent}>
    <Text style={styles.title}>Modal Title</Text>
    <TouchableOpacity onPress={onClose}>
      <Text style={styles.closeButton}>Close</Text>
    </TouchableOpacity>
  </View>
</DarkGlassCard>
```

### Interactive Button

```tsx
<GlassButton
  style={styles.actionButton}
  onPress={handleSubmit}
  elevation={8}
  borderRadius={16}
  intensity={25}
>
  <View style={styles.buttonContent}>
    <Text style={styles.buttonText}>Submit</Text>
  </View>
</GlassButton>
```

## Platform Differences

### iOS
- Uses `expo-blur`'s `BlurView` for native blur effect
- Supports `intensity` and `tint` props
- Hardware-accelerated rendering
- Smooth animations and transitions

### Android
- Uses gradient and opacity fallback
- Ignores `intensity` and `tint` props
- Still provides attractive glass-like appearance
- Optimized for performance

## Best Practices

### 1. Elevation Guidelines

- **Light content**: Use elevation 2-6
- **Medium content**: Use elevation 6-12
- **Heavy content/modals**: Use elevation 12-20
- **Floating elements**: Use elevation 16-24

### 2. Border Radius Recommendations

- **Small cards**: 8-12px
- **Medium cards**: 12-16px
- **Large cards**: 16-24px
- **Full-screen**: 0px (no radius)

### 3. Content Considerations

- Use light-colored text for better readability
- Add proper contrast for accessibility
- Consider text shadows for better visibility
- Test on various background colors

### 4. Performance Tips

- Avoid nesting too many glass cards
- Use appropriate elevation values
- Consider using lighter variants for better performance
- Test on lower-end devices

## Accessibility

The component includes proper accessibility support:

```tsx
<GlassCard
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Glass card with content"
  accessibilityHint="Double tap to interact"
>
  <Text>Accessible content</Text>
</GlassCard>
```

## Examples

### Login Form

```tsx
<MediumGlassCard style={styles.formCard} elevation={8} borderRadius={24}>
  <Text style={styles.formTitle}>Sign In</Text>
  
  <View style={styles.inputGroup}>
    <LightGlassCard style={styles.inputCard} elevation={2} borderRadius={12}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="rgba(255, 255, 255, 0.7)"
      />
    </LightGlassCard>
    
    <LightGlassCard style={styles.inputCard} elevation={2} borderRadius={12}>
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        placeholderTextColor="rgba(255, 255, 255, 0.7)"
      />
    </LightGlassCard>
  </View>
  
  <GlassButton
    style={styles.submitButton}
    onPress={handleLogin}
    elevation={6}
    borderRadius={16}
  >
    <Text style={styles.buttonText}>Sign In</Text>
  </GlassButton>
</MediumGlassCard>
```

### Settings Panel

```tsx
<DarkGlassCard style={styles.settingsPanel} elevation={12} borderRadius={20}>
  <Text style={styles.panelTitle}>Settings</Text>
  
  <View style={styles.settingItem}>
    <Text style={styles.settingLabel}>Notifications</Text>
    <Switch
      value={notifications}
      onValueChange={setNotifications}
      trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#4CAF50' }}
    />
  </View>
  
  <GlassButton
    style={styles.settingButton}
    onPress={() => navigation.navigate('Profile')}
    elevation={4}
    borderRadius={12}
  >
    <Text style={styles.settingButtonText}>Edit Profile</Text>
  </GlassButton>
</DarkGlassCard>
```

### Nested Cards

```tsx
<DarkGlassCard style={styles.outerCard} elevation={16} borderRadius={24}>
  <Text style={styles.outerTitle}>Main Container</Text>
  
  <MediumGlassCard style={styles.innerCard} elevation={8} borderRadius={16}>
    <Text style={styles.innerTitle}>Nested Content</Text>
    
    <LightGlassCard style={styles.deepCard} elevation={4} borderRadius={12}>
      <Text style={styles.deepContent}>Deep nested element</Text>
    </LightGlassCard>
  </MediumGlassCard>
</DarkGlassCard>
```

## Troubleshooting

### Common Issues

1. **Blur not showing on iOS**
   - Ensure `expo-blur` is properly installed
   - Check that `intensity` is greater than 0
   - Verify the component is inside a proper parent view

2. **Performance issues**
   - Reduce the number of nested glass cards
   - Lower the elevation values
   - Use lighter variants when possible

3. **Text readability**
   - Add text shadows: `textShadow: '0 1px 2px rgba(0,0,0,0.5)'`
   - Use higher contrast colors
   - Consider using semi-transparent backgrounds

4. **Android appearance**
   - Remember that Android uses fallback styling
   - Test the visual appearance on Android devices
   - Adjust colors and opacity for better results

## Contributing

To contribute to the GlassCard component:

1. Follow the existing code style
2. Add proper TypeScript types
3. Test on both iOS and Android
4. Update documentation for new features
5. Add examples for new functionality

## License

This component is part of the Bak Bak mobile application and follows the project's licensing terms.
