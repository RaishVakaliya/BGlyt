import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";

export interface ActionControlsProps {
  isSaving: boolean;
  showMetadata: boolean;
  onDownload: () => void;
  onToggleMetadata: () => void;
  onReset: () => void;
}

export const ActionControls = React.memo(({
  isSaving,
  showMetadata,
  onDownload,
  onToggleMetadata,
  onReset,
}: ActionControlsProps) => {
  return (
    <View className="w-full mt-4 gap-3">
      <View className="flex-row items-center space-x-3 gap-2 w-full">
        <Pressable
          onPress={onDownload}
          disabled={isSaving}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isSaving ? "Saving image" : "Download image"}
          accessibilityHint="Saves the transparent PNG image to your camera roll or downloads folder."
          className="flex-1 bg-emerald-500 py-3.5 px-3 rounded-2xl flex-row items-center justify-center shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" className="mr-2" />
          ) : (
            <Feather name="download" size={16} color="white" className="mr-2" />
          )}
          <Text className="text-white text-[13px] font-extrabold tracking-wide text-center">
            {isSaving ? "Saving..." : "Download"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onToggleMetadata}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Toggle file specifications"
          accessibilityHint="Toggles the details card showing name, size, dimensions, and type."
          className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-[0.95] transition-all ${
            showMetadata
              ? "bg-emerald-500 shadow-md shadow-emerald-500/10"
              : "bg-emerald-50 border border-emerald-100"
          }`}
        >
          <Feather
            name="info"
            size={18}
            color={showMetadata ? "white" : "#059669"}
          />
        </Pressable>
      </View>

      <Pressable
        onPress={onReset}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Process another image"
        accessibilityHint="Resets the workspace and goes back to the photo selection screen."
        className="w-full border border-slate-200 bg-white py-3.5 px-4 rounded-2xl flex-row items-center justify-center active:bg-slate-50 active:scale-[0.98] transition-all"
      >
        <Feather name="plus" size={16} color="#475569" className="mr-2" />
        <Text className="text-slate-600 text-[13px] font-extrabold tracking-wide text-center">
          Process Another Image
        </Text>
      </Pressable>
    </View>
  );
});

ActionControls.displayName = "ActionControls";
