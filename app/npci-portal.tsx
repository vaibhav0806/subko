import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import {
  RefreshCw,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

const NPCI_URL = 'https://upihelp.npci.org.in';

export default function NpciPortalScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(NPCI_URL);

  const handleRefresh = () => {
    webViewRef.current?.reload();
  };

  const handleGoBack = () => {
    webViewRef.current?.goBack();
  };

  const handleGoForward = () => {
    webViewRef.current?.goForward();
  };

  const handleGoHome = () => {
    webViewRef.current?.injectJavaScript(`window.location.href = '${NPCI_URL}'`);
  };

  const handleOpenExternal = () => {
    Linking.openURL(currentUrl);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Custom Header */}
        <View style={[styles.header, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#e5e5e5' }]}>
          <Pressable onPress={handleClose} style={styles.headerButton}>
            <X size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={[styles.headerText, { color: colors.text }]} numberOfLines={1}>
              NPCI UPI Portal
            </Text>
            <Text style={[styles.headerSubtext, { color: colors.text, opacity: 0.5 }]} numberOfLines={1}>
              {currentUrl.replace('https://', '')}
            </Text>
          </View>
          <Pressable onPress={handleRefresh} style={styles.headerButton}>
            <RefreshCw size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: '#2196F320' }]}>
          <Text style={[styles.infoText, { color: '#2196F3' }]}>
            This is the official NPCI portal. Log in with your mobile number to view all your UPI mandates.
          </Text>
        </View>

        {/* WebView */}
        <View style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: NPCI_URL }}
            style={styles.webView}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onNavigationStateChange={(navState) => {
              setCanGoBack(navState.canGoBack);
              setCanGoForward(navState.canGoForward);
              setCurrentUrl(navState.url);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            // Allow camera for any OTP scanning features
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            // Handle errors gracefully
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error:', nativeEvent);
            }}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  Loading NPCI Portal...
                </Text>
              </View>
            )}
          />

          {isLoading && (
            <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          )}
        </View>

        {/* Bottom Navigation Bar */}
        <View style={[styles.bottomBar, { borderTopColor: colorScheme === 'dark' ? '#333' : '#e5e5e5', backgroundColor: colors.background }]}>
          <Pressable
            onPress={handleGoBack}
            disabled={!canGoBack}
            style={[styles.navButton, { opacity: canGoBack ? 1 : 0.3 }]}
          >
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={handleGoForward}
            disabled={!canGoForward}
            style={[styles.navButton, { opacity: canGoForward ? 1 : 0.3 }]}
          >
            <ChevronRight size={24} color={colors.text} />
          </Pressable>

          <Pressable onPress={handleGoHome} style={styles.navButton}>
            <Home size={22} color={colors.text} />
          </Pressable>

          <Pressable onPress={handleOpenExternal} style={styles.navButton}>
            <ExternalLink size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Help Text */}
        <View style={[styles.helpBar, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
          <Text style={[styles.helpText, { color: colors.text, opacity: 0.6 }]}>
            After viewing your mandates, go back to add them manually to the app for tracking.
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  infoBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 13,
    textAlign: 'center',
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  navButton: {
    padding: 12,
  },
  helpBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
