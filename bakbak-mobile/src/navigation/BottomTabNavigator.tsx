import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '../constants/theme';
import { ChatsScreen } from '../screens/ChatsScreen';
import { CallsScreen } from '../screens/CallsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Custom Header Component
interface CustomHeaderProps {
  title: string;
  onSettingsPress: () => void;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ title, onSettingsPress }) => (
  <View style={{ 
    height: 100, 
    paddingTop: 44, // Status bar height
  }}>
    <LinearGradient
      colors={theme.colors.primary.gradient as any}
      style={{ flex: 1 }}
    >
      <BlurView intensity={20} style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
      }}>
        {/* Settings Icon (Left) */}
        <TouchableOpacity
          onPress={onSettingsPress}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <Ionicons name="settings-outline" size={20} color="white" />
        </TouchableOpacity>

        {/* Brand Title (Center) */}
        <View style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          backgroundColor: 'rgba(0,0,0,0.25)',
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            letterSpacing: 1,
          }}>
            {title}
          </Text>
        </View>

        {/* Spacer for symmetry */}
        <View style={{ width: 36 }} />
      </BlurView>
    </LinearGradient>
  </View>
);

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 90,
      paddingBottom: 34, // Safe area bottom
    }}>
      <BlurView 
        intensity={80} 
        tint="dark"
        style={{
          flex: 1,
          flexDirection: 'row',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined 
            ? options.tabBarLabel 
            : options.title !== undefined 
            ? options.title 
            : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Icon mapping
          const getIcon = (routeName: string, focused: boolean) => {
            switch (routeName) {
              case 'Chats':
                return focused ? 'chatbubbles' : 'chatbubbles-outline';
              case 'Calls':
                return focused ? 'call' : 'call-outline';
              case 'Settings':
                return focused ? 'settings' : 'settings-outline';
              default:
                return 'circle-outline';
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: theme.spacing.sm,
              }}
            >
              {isFocused && (
                <LinearGradient
                  colors={[theme.colors.primary.start, theme.colors.primary.end]}
                  style={{
                    position: 'absolute',
                    top: 8,
                    width: 60,
                    height: 32,
                    borderRadius: 16,
                    opacity: 0.3,
                  }}
                />
              )}
              <Ionicons
                name={getIcon(route.name, isFocused) as any}
                size={24}
                color={isFocused ? 'white' : 'rgba(255, 255, 255, 0.6)'}
              />
              <Text style={{
                fontSize: 11,
                fontWeight: isFocused ? '600' : '400',
                color: isFocused ? 'white' : 'rgba(255, 255, 255, 0.6)',
                marginTop: 2,
              }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
};

export const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen 
        name="Chats" 
        component={ChatsScreen}
        options={{
          header: ({ navigation }) => (
            <CustomHeader 
              title="BAK BAK" 
              onSettingsPress={() => navigation.navigate('Settings')}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Calls" 
        component={CallsScreen}
        options={{
          header: ({ navigation }) => (
            <CustomHeader 
              title="BAK BAK" 
              onSettingsPress={() => navigation.navigate('Settings')}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          header: ({ navigation }) => (
            <CustomHeader 
              title="BAK BAK" 
              onSettingsPress={() => {}}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
