import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Platform } from 'react-native';

import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen as OTPVerificationScreen } from './src/screens/OtpScreen';
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';
import { createNativeStackNavigator as createMainStackNavigator } from '@react-navigation/native-stack';
// @ts-ignore - module resolution picks this up at runtime
import ChatScreen from './src/screens/ChatScreen';
// @ts-ignore - module resolution picks this up at runtime
import CallInProgress from './src/screens/CallInProgress';
// @ts-ignore - module resolution picks this up at runtime
import NewChatScreen from './src/screens/NewChatScreen';
// @ts-ignore - exists at runtime
import RecentlyDeletedScreen from './src/screens/RecentlyDeletedScreen';

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  OTPVerification: { phone: string; countryCode: string } | undefined;
  ProfileSetup: { phone: string; countryCode: string } | undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainStack = createMainStackNavigator();

const MainStackNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="Tabs" component={BottomTabNavigator} />
    <MainStack.Screen name="ChatScreen" component={ChatScreen} />
    <MainStack.Screen name="CallInProgress" component={CallInProgress} />
    <MainStack.Screen name="NewChatScreen" component={NewChatScreen} />
  <MainStack.Screen name="RecentlyDeleted" component={RecentlyDeletedScreen} />
  </MainStack.Navigator>
);

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      {/* Start directly at Main to bypass OTP/Auth for now */}
      <RootStack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
        {/* Auth Flow (temporarily bypassed) */}
        {/* <RootStack.Screen name="Auth">{() => (<AuthStack />)}</RootStack.Screen> */}

        {/* Main App */}
  <RootStack.Screen name="Main" component={MainStackNavigator} />
        <RootStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        <RootStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// Auth Stack as an inline component to simplify for now
import { createNativeStackNavigator as createAuthStackNavigator } from '@react-navigation/native-stack';
const AuthStackNavigator = createAuthStackNavigator();

const AuthStack = () => (
  <AuthStackNavigator.Navigator screenOptions={{ headerShown: false }}>
    <AuthStackNavigator.Screen name="Login" component={LoginScreen} />
    <AuthStackNavigator.Screen name="OTPVerification" component={OTPVerificationScreen as any} />
    <AuthStackNavigator.Screen name="ProfileSetup" component={ProfileSetupScreen as any} />
  </AuthStackNavigator.Navigator>
);
