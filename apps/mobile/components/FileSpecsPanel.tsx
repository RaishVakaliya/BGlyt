import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { PickedImage, BackgroundRemovalResult } from "../types";

export interface FileSpecsPanelProps {
  sourceImage: PickedImage;
  result: BackgroundRemovalResult | null;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const FileSpecsPanel = React.memo(
  ({ sourceImage, result }: FileSpecsPanelProps) => {
    const processedSize = useMemo(() => {
      if (!result) return 0;
      const base64WithoutPrefix = result.resultUri.includes("base64,")
        ? result.resultUri.split("base64,")[1]
        : result.resultUri;
      const padding = (base64WithoutPrefix.match(/=/g) || []).length;
      return (base64WithoutPrefix.length * 3) / 4 - padding;
    }, [result]);

    return (
      <View
        accessible={true}
        accessibilityLabel="Image metadata and file specifications panel"
        className="w-full mt-3.5 bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-4 shadow-sm"
      >
        <Text className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest mb-3">
          File Specifications {result ? "(Processed)" : "(Original)"}
        </Text>

        <View className="gap-2">
          <View className="flex-row justify-between items-center py-1 border-b border-emerald-100/20">
            <View className="flex-row items-center">
              <Feather name="file" size={13} color="#059669" className="mr-2" />
              <Text className="text-slate-500 text-xs font-semibold">Name</Text>
            </View>
            <Text
              className="text-slate-800 text-xs font-bold truncate max-w-[60%]"
              numberOfLines={1}
              accessibilityLabel={`File name: ${result ? `BGlyt_${sourceImage.fileName || "image.png"}` : sourceImage.fileName}`}
            >
              {result
                ? `BGlyt_${sourceImage.fileName || "image.png"}`
                : sourceImage.fileName}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-1 border-b border-emerald-100/20">
            <View className="flex-row items-center">
              <Feather
                name="maximize"
                size={13}
                color="#059669"
                className="mr-2"
              />
              <Text className="text-slate-500 text-xs font-semibold">
                Dimensions
              </Text>
            </View>
            <Text
              className="text-slate-800 text-xs font-bold"
              accessibilityLabel={`Dimensions: ${sourceImage.width} by ${sourceImage.height} pixels`}
            >
              {sourceImage.width} × {sourceImage.height} px
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-1 border-b border-emerald-100/20">
            <View className="flex-row items-center">
              <Feather
                name="database"
                size={13}
                color="#059669"
                className="mr-2"
              />
              <Text className="text-slate-500 text-xs font-semibold">Size</Text>
            </View>
            <Text
              className="text-slate-800 text-xs font-bold"
              accessibilityLabel={`File size: ${result ? formatFileSize(processedSize) : formatFileSize(sourceImage.fileSize)}`}
            >
              {result
                ? formatFileSize(processedSize)
                : formatFileSize(sourceImage.fileSize)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-1 border-b border-emerald-100/20">
            <View className="flex-row items-center">
              <Feather name="tag" size={13} color="#059669" className="mr-2" />
              <Text className="text-slate-500 text-xs font-semibold">
                Format
              </Text>
            </View>
            <Text
              className="text-slate-800 text-xs font-bold uppercase"
              accessibilityLabel={`Format: ${result ? "PNG with transparency" : sourceImage.mimeType?.split("/")[1] || "JPEG"}`}
            >
              {result
                ? "PNG (Transparent)"
                : sourceImage.mimeType?.split("/")[1] || "JPEG"}
            </Text>
          </View>

          {result && result.durationMs && (
            <View className="flex-row justify-between items-center py-1">
              <View className="flex-row items-center">
                <Feather
                  name="clock"
                  size={13}
                  color="#059669"
                  className="mr-2"
                />
                <Text className="text-slate-500 text-xs font-semibold">
                  Processing Time
                </Text>
              </View>
              <Text
                className="text-slate-800 text-xs font-bold"
                accessibilityLabel={`Processing duration: ${(result.durationMs / 1000).toFixed(2)} seconds`}
              >
                {(result.durationMs / 1000).toFixed(2)}s
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  },
);

FileSpecsPanel.displayName = "FileSpecsPanel";
export { formatFileSize };
