import React, { useCallback } from "react";
import {
  Text,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useBGRemovalStore } from "../store";
import { useBackgroundRemoval } from "../hooks";
import { sanitizeError } from "../services/errorSanitizer";
import {
  Checkerboard,
  ErrorBanner,
  FileSpecsPanel,
  ImageSlider,
  ActionControls,
  UploadCard,
} from "../components";

export default function HomeScreen() {
  const [showMetadata, setShowMetadata] = React.useState(false);

  const {
    sourceImage,
    errorMessage,
    status,
    setSourceImage,
    setStatus,
    setError,
    reset,
    result,
  } = useBGRemovalStore();

  const removeBackgroundMutation = useBackgroundRemoval();
  const isProcessing =
    status === "processing" || removeBackgroundMutation.isPending;

  const handleReset = useCallback(() => {
    reset();
    setShowMetadata(false);
  }, [reset]);

  const [isSaving, setIsSaving] = React.useState(false);

  const handleDownload = useCallback(async () => {
    if (!result || isSaving) return;
    try {
      setIsSaving(true);

      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = result.resultUri;
        link.download = `bglyt_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert(
          "Downloaded Successfully!",
          "The transparent PNG has been saved to your computer.",
        );
        setIsSaving(false);
        return;
      }

      const { status: permissionStatus } =
        await MediaLibrary.requestPermissionsAsync(true);
      if (permissionStatus !== "granted") {
        Alert.alert(
          "Permission Required",
          "Permission to access the media library is needed to save the processed image.",
        );
        setIsSaving(false);
        return;
      }

      const filename = `${FileSystem.documentDirectory}bglyt_${Date.now()}.png`;
      const base64Data = result.resultUri;
      const base64Code = base64Data.includes("base64,")
        ? base64Data.split("base64,")[1]
        : base64Data;

      await FileSystem.writeAsStringAsync(filename, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await MediaLibrary.saveToLibraryAsync(filename);
      Alert.alert(
        "Downloaded Successfully!",
        "The transparent PNG has been saved to your photo gallery.",
      );
    } catch (err: any) {
      console.error("Error saving image:", err);
      Alert.alert(
        "Download Failed",
        err?.message || "An unexpected error occurred while saving the image.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [result, isSaving]);

  const handleSelectFromGallery = useCallback(async () => {
    try {
      setError(null);
      setStatus("picking");

      const { status: existingStatus } =
        await ImagePicker.getMediaLibraryPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status: askStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        finalStatus = askStatus;
      }

      if (finalStatus !== "granted") {
        setError(
          "Permission to access the photo library was denied. Please enable it in system settings.",
        );
        setStatus("error");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (
        pickerResult.canceled ||
        !pickerResult.assets ||
        pickerResult.assets.length === 0
      ) {
        setStatus(sourceImage ? "done" : "idle");
        return;
      }

      const asset = pickerResult.assets[0];
      let fileSize = asset.fileSize;

      if (!fileSize) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
          if (fileInfo.exists) {
            fileSize = fileInfo.size;
          }
        } catch (infoErr) {
          console.log("Error getting file size info:", infoErr);
        }
      }

      const MAX_FILE_SIZE = 15 * 1024 * 1024;
      if (fileSize && fileSize > MAX_FILE_SIZE) {
        Alert.alert(
          "File Too Large",
          `The selected image is ${(fileSize / (1024 * 1024)).toFixed(1)} MB. The maximum supported file size is 15 MB. Please select a smaller image.`,
        );
        setStatus(sourceImage ? "done" : "idle");
        return;
      }

      setSourceImage({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType,
        fileSize: fileSize || asset.fileSize,
        fileName: asset.fileName || "gallery_photo.jpg",
      });
    } catch (err: any) {
      setError(sanitizeError(err));
      setStatus("error");
    }
  }, [sourceImage, setSourceImage, setError, setStatus]);

  const handleOpenCamera = useCallback(async () => {
    try {
      setError(null);
      setStatus("picking");

      const { status: existingStatus } =
        await ImagePicker.getCameraPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status: askStatus } =
          await ImagePicker.requestCameraPermissionsAsync();
        finalStatus = askStatus;
      }

      if (finalStatus !== "granted") {
        setError(
          "Permission to access the camera was denied. Please enable it in system settings.",
        );
        setStatus("error");
        return;
      }

      const cameraResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (
        cameraResult.canceled ||
        !cameraResult.assets ||
        cameraResult.assets.length === 0
      ) {
        setStatus(sourceImage ? "done" : "idle");
        return;
      }

      const asset = cameraResult.assets[0];
      let fileSize = asset.fileSize;

      if (!fileSize) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
          if (fileInfo.exists) {
            fileSize = fileInfo.size;
          }
        } catch (infoErr) {
          console.log("Error getting file size info:", infoErr);
        }
      }

      const MAX_FILE_SIZE = 15 * 1024 * 1024;
      if (fileSize && fileSize > MAX_FILE_SIZE) {
        Alert.alert(
          "File Too Large",
          `The selected image is ${(fileSize / (1024 * 1024)).toFixed(1)} MB. The maximum supported file size is 15 MB. Please select a smaller image.`,
        );
        setStatus(sourceImage ? "done" : "idle");
        return;
      }

      setSourceImage({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType,
        fileSize: fileSize || asset.fileSize,
        fileName: asset.fileName || "camera_photo.jpg",
      });
    } catch (err: any) {
      setError(sanitizeError(err));
      setStatus("error");
    }
  }, [sourceImage, setSourceImage, setError, setStatus]);



  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="flex-1 px-5"
      >
        <View className="items-center">
          <View className="h-14 justify-center w-full max-w-md">
            <Image
              source={require("../assets/logo.svg")}
              style={{ width: "100%", aspectRatio: 370 / 115 }}
              contentFit="contain"
              transition={200}
            />
          </View>
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

        <ErrorBanner message={errorMessage} onDismiss={() => setError(null)} />

        <View className="flex-1 justify-center max-w-md w-full mx-auto my-4">
          <View className="bg-emerald-50/20 border-2 border-dashed border-emerald-200 rounded-[32px] p-6 items-center justify-between min-h-[320px] shadow-sm relative overflow-hidden">
            <View className="absolute -top-12 -left-12 w-24 h-24 bg-emerald-100/20 rounded-full blur-xl" />
            <View className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-200/10 rounded-full blur-2xl" />

            {sourceImage ? (
              <View className="w-full flex-1 justify-between py-2">
                <View className="w-full h-80 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 relative shadow-sm">
                  {result ? (
                    <ImageSlider sourceImage={sourceImage} result={result} />
                  ) : (
                    <>
                      <Checkerboard />
                      <Image
                        source={sourceImage.uri}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="contain"
                        transition={300}
                      />
                    </>
                  )}

                  {isProcessing && (
                    <View className="absolute inset-0 bg-black/60 items-center justify-center z-20 rounded-2xl">
                      <ActivityIndicator size="large" color="#10b981" />
                      <Text className="text-white text-sm font-bold mt-4 tracking-wide text-center">
                        Removing Background...
                      </Text>
                    </View>
                  )}

                  <Pressable
                    onPress={handleReset}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                    accessibilityHint="Clears the currently selected image."
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/50 items-center justify-center active:scale-90 active:bg-black/70 transition-all shadow-md z-10"
                  >
                    <Feather name="trash-2" size={14} color="white" />
                  </Pressable>
                </View>

                {showMetadata && (
                  <FileSpecsPanel sourceImage={sourceImage} result={result} />
                )}

                {status === "done" && result ? (
                  <ActionControls
                    isSaving={isSaving}
                    showMetadata={showMetadata}
                    onDownload={handleDownload}
                    onToggleMetadata={() => setShowMetadata(!showMetadata)}
                    onReset={handleReset}
                  />
                ) : (
                  <View className="w-full mt-4 flex-row items-center space-x-3 gap-2">
                    <Pressable
                      onPress={() => {
                        if (sourceImage) {
                          removeBackgroundMutation.mutate(sourceImage);
                        }
                      }}
                      disabled={isProcessing || !sourceImage}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isProcessing
                          ? "Removing background"
                          : "Remove background"
                      }
                      accessibilityHint="Runs the AI background removal model on the selected image."
                      className={`flex-1 py-3.5 px-3 rounded-2xl flex-row items-center justify-center shadow-md active:scale-[0.98] transition-all ${
                        isProcessing
                          ? "bg-emerald-400"
                          : "bg-emerald-500 shadow-emerald-500/10 active:bg-emerald-600"
                      }`}
                    >
                      {isProcessing ? (
                        <ActivityIndicator
                          size="small"
                          color="white"
                          className="mr-2"
                        />
                      ) : (
                        <Feather
                          name="scissors"
                          size={16}
                          color="white"
                          className="mr-2"
                        />
                      )}
                      <Text className="text-white text-[13px] font-extrabold tracking-wide text-center">
                        {isProcessing ? "Removing BG..." : "Remove BG"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        if (isProcessing) return;
                        setShowMetadata(!showMetadata);
                      }}
                      disabled={isProcessing}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Toggle file specifications"
                      accessibilityHint="Displays metadata including file name, size, dimensions, and type."
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        showMetadata
                          ? "bg-emerald-500 shadow-md shadow-emerald-500/10"
                          : "bg-emerald-50 border border-emerald-100"
                      } ${isProcessing ? "opacity-50 pointer-events-none" : "active:scale-[0.95]"}`}
                    >
                      <Feather
                        name="info"
                        size={18}
                        color={showMetadata ? "white" : "#059669"}
                      />
                    </Pressable>
                  </View>
                )}
              </View>
            ) : (
              <UploadCard
                onSelectGallery={handleSelectFromGallery}
                onOpenCamera={handleOpenCamera}
                isProcessing={isProcessing}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
