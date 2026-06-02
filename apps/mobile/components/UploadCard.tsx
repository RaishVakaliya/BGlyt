import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";

export interface UploadCardProps {
  onSelectGallery: () => void;
  onOpenCamera: () => void;
  isProcessing: boolean;
}

export const UploadCard = React.memo(({
  onSelectGallery,
  onOpenCamera,
  isProcessing,
}: UploadCardProps) => {
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

  const animatedFloatIcon = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatValue.value },
      { scale: pulseValue.value },
    ],
  }));

  const animatedGalleryBtn = useAnimatedStyle(() => ({
    transform: [{ scale: galleryScale.value }],
  }));

  const animatedCameraBtn = useAnimatedStyle(() => ({
    transform: [{ scale: cameraScale.value }],
  }));

  return (
    <>
      <Pressable
        onPress={onSelectGallery}
        disabled={isProcessing}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Select an image file"
        accessibilityHint="Opens your photo gallery to choose a photo for background removal."
        className="w-full flex-1 justify-center items-center py-8"
      >
        <Animated.View style={animatedFloatIcon} className="mb-4">
          <View className="w-16 h-16 bg-emerald-500 rounded-2xl items-center justify-center shadow-lg shadow-emerald-500/20">
            <Feather name="upload-cloud" size={28} color="white" />
          </View>
        </Animated.View>
        <Text selectable className="text-base font-semibold text-slate-800">
          Select an image file
        </Text>
        <Text className="text-xs text-slate-400 mt-1">
          PNG, JPG, WebP up to 15MB
        </Text>
      </Pressable>

      <View className="flex-row w-full space-x-3 gap-2 mt-2">
        <Animated.View style={animatedGalleryBtn} className="flex-1">
          <Pressable
            onPress={onSelectGallery}
            onPressIn={() => {
              galleryScale.value = withSpring(0.97);
            }}
            onPressOut={() => {
              galleryScale.value = withSpring(1);
            }}
            disabled={isProcessing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Select Gallery"
            accessibilityHint="Browse photos on your device."
            className="py-3.5 px-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex-row items-center justify-center active:scale-[0.98] active:bg-emerald-100/50 transition-all w-full"
          >
            <Feather name="image" size={15} color="#059669" className="mr-2" />
            <Text className="text-emerald-700 text-xs font-extrabold tracking-wide text-center">
              Select Gallery
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={animatedCameraBtn} className="flex-1">
          <Pressable
            onPress={onOpenCamera}
            onPressIn={() => {
              cameraScale.value = withSpring(0.97);
            }}
            onPressOut={() => {
              cameraScale.value = withSpring(1);
            }}
            disabled={isProcessing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open Camera"
            accessibilityHint="Take a new photo with your device camera."
            className="py-3.5 px-4 bg-slate-900 rounded-2xl flex-row items-center justify-center active:scale-[0.98] active:bg-slate-800 transition-all shadow-md shadow-slate-900/10 w-full"
          >
            <Feather name="camera" size={15} color="white" className="mr-2" />
            <Text className="text-white text-xs font-extrabold tracking-wide text-center">
              Open Camera
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </>
  );
});

UploadCard.displayName = "UploadCard";
