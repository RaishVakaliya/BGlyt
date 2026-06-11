import React from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

export interface ErrorBannerProps {
  title?: string;
  message: string | null;
  onDismiss: () => void;
}

export const ErrorBanner = React.memo(({ title, message, onDismiss }: ErrorBannerProps) => {
  if (!message) return null;

  const displayTitle = title || (
    message.toLowerCase().includes("internet") || 
    message.toLowerCase().includes("network") || 
    message.toLowerCase().includes("connection") ||
    message.toLowerCase().includes("host") ||
    message.toLowerCase().includes("address")
      ? "Network Error"
      : "Processing Failed"
  );

  return (
    <View
      accessible={true}
      accessibilityRole="alert"
      className="mb-4 mx-auto w-full max-w-md bg-red-50/80 border border-red-100 rounded-2xl p-4 flex-row items-start justify-between shadow-sm"
    >
      <View className="flex-row items-start flex-1 mr-2">
        <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center mr-3 mt-0.5">
          <Feather name="alert-triangle" size={16} color="#dc2626" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold text-red-800">
            {displayTitle}
          </Text>
          <Text className="text-[11px] text-red-600 mt-0.5 leading-relaxed">
            {message}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onDismiss}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Dismiss error"
        accessibilityHint="Closes the error notification banner"
        className="w-6 h-6 items-center justify-center bg-red-100/50 rounded-full active:bg-red-100"
      >
        <Feather name="x" size={14} color="#dc2626" />
      </Pressable>
    </View>
  );
});

ErrorBanner.displayName = "ErrorBanner";
