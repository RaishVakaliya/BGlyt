import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const floatValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  const galleryScale = useSharedValue(1);
  const cameraScale = useSharedValue(1);

  useEffect(() => {
    floatValue.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1800 }),
        withTiming(0, { duration: 1800 }),
      ),
      -1,
      true,
    );

    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedFloatIcon = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: floatValue.value },
        { scale: pulseValue.value },
      ],
    };
  });

  const animatedGalleryBtn = useAnimatedStyle(() => {
    return {
      transform: [{ scale: galleryScale.value }],
    };
  });

  const animatedCameraBtn = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cameraScale.value }],
    };
  });

  const isTablet = width > 768;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="flex-1 px-6 justify-between">
          <View className="flex-row justify-between items-center py-2">
            <View className="h-14 justify-center">
              <Image
                source={require("../assets/logo.png")}
                className="w-40 h-12"
                contentFit="contain"
                transition={200}
              />
            </View>
            <Pressable className="w-10 h-10 items-center justify-center bg-emerald-50 rounded-full active:bg-emerald-100 transition-colors">
              <Feather name="info" size={20} color="#059669" />
            </Pressable>
          </View>

          <View className="mt-4 mb-6">
            <Text className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight text-center md:text-4xl">
              Remove Background{"\n"}
              <Text className="text-emerald-500">Instantly</Text>
            </Text>
            <Text className="text-sm font-medium text-slate-500 text-center mt-3 max-w-sm mx-auto leading-relaxed">
              Upload your photos to remove backgrounds with pixel-perfect AI
              accuracy. Completely free and incredibly fast.
            </Text>
          </View>

          <View className="flex-1 justify-center max-w-md w-full mx-auto my-4">
            <View className="bg-emerald-50/20 border-2 border-dashed border-emerald-200 rounded-[32px] p-6 items-center justify-between min-h-[300px] shadow-sm relative overflow-hidden">
              <View className="absolute -top-12 -left-12 w-24 h-24 bg-emerald-100/20 rounded-full blur-xl" />
              <View className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-200/10 rounded-full blur-2xl" />

              <View className="items-center justify-center flex-1 my-6">
                <Animated.View style={animatedFloatIcon} className="mb-4">
                  <View className="w-16 h-16 bg-emerald-500 items-center justify-center rounded-2xl shadow-md shadow-emerald-500/20">
                    <Feather name="upload-cloud" size={28} color="white" />
                  </View>
                </Animated.View>
                <Text className="text-base font-semibold text-slate-800">
                  Select an image file
                </Text>
                <Text className="text-xs text-slate-400 mt-1">
                  Supports PNG, JPEG or WEBP up to 10MB
                </Text>
              </View>

              <View className="w-full bg-white/80 border border-slate-100/80 rounded-2xl p-3 flex-row items-center justify-between">
                <View className="flex-1 items-center py-2 px-1 border-r border-slate-100">
                  <View className="w-10 h-10 bg-slate-100 rounded-lg items-center justify-center mb-1">
                    <Feather name="image" size={18} color="#64748b" />
                  </View>
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Original
                  </Text>
                </View>

                <View className="px-3 items-center">
                  <View className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 items-center justify-center">
                    <Feather name="arrow-right" size={12} color="#059669" />
                  </View>
                </View>

                <View className="flex-1 items-center py-2 px-1 relative">
                  <View className="w-10 h-10 bg-emerald-50 rounded-lg items-center justify-center mb-1 overflow-hidden relative">
                    <View className="absolute inset-0 flex-row flex-wrap">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <View key={i} className="w-5 h-5 flex-row">
                          <View
                            className={`w-2.5 h-2.5 ${i % 2 === 0 ? "bg-slate-50" : "bg-slate-100/80"}`}
                          />
                          <View
                            className={`w-2.5 h-2.5 ${i % 2 === 0 ? "bg-slate-100/80" : "bg-slate-50"}`}
                          />
                        </View>
                      ))}
                    </View>
                    <Feather
                      name="user"
                      size={18}
                      color="#059669"
                      className="z-10"
                    />
                  </View>
                  <Text className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    No BG
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="flex-row w-full max-w-md mx-auto mt-6 space-x-3 px-1 gap-2">
            <Animated.View style={animatedGalleryBtn} className="flex-1">
              <Pressable
                onPressIn={() => {
                  galleryScale.value = withSpring(0.97);
                }}
                onPressOut={() => {
                  galleryScale.value = withSpring(1);
                }}
                className="bg-emerald-500 py-3.5 px-3 rounded-2xl flex-row items-center justify-center shadow-md shadow-emerald-500/10 active:bg-emerald-600"
              >
                <Feather
                  name="image"
                  size={16}
                  color="white"
                  className="mr-2"
                />
                <Text className="text-white text-[13px] font-extrabold tracking-wide text-center">
                  Select Gallery
                </Text>
              </Pressable>
            </Animated.View>

            <Animated.View style={animatedCameraBtn} className="flex-1">
              <Pressable
                onPressIn={() => {
                  cameraScale.value = withSpring(0.97);
                }}
                onPressOut={() => {
                  cameraScale.value = withSpring(1);
                }}
                className="border border-emerald-500 bg-white py-3.5 px-3 rounded-2xl flex-row items-center justify-center active:bg-emerald-50/50"
              >
                <Feather
                  name="camera"
                  size={16}
                  color="#059669"
                  className="mr-2"
                />
                <Text className="text-emerald-600 text-[13px] font-extrabold tracking-wide text-center">
                  Open Camera
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
