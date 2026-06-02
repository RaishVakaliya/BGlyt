import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
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
import * as ImagePicker from "expo-image-picker";
import { useBGRemovalStore } from "../store";
import { useBackgroundRemoval } from "../hooks";

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const floatValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  const galleryScale = useSharedValue(1);
  const cameraScale = useSharedValue(1);

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

  const handleReset = () => {
    reset();
    setShowMetadata(false);
  };

  const [isSaving, setIsSaving] = React.useState(false);

  const handleDownload = async () => {
    if (!result || isSaving) return;
    try {
      setIsSaving(true);
      // Passing true requests writeOnly permission, avoiding READ_MEDIA_AUDIO and other read permissions on Android 13+
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
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      // Create a temporary cache file path to share the physical PNG file
      const tempPath = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}bglyt_share_${Date.now()}.png`;
      const base64Data = result.resultUri;
      const base64Code = base64Data.includes("base64,")
        ? base64Data.split("base64,")[1]
        : base64Data;

      await FileSystem.writeAsStringAsync(tempPath, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(tempPath, {
          mimeType: "image/png",
          dialogTitle: "Share your transparent image",
          UTI: "public.png",
        });
      } else {
        Alert.alert(
          "Sharing Unavailable",
          "Sharing is not supported on this platform.",
        );
      }
    } catch (err: any) {
      console.error("Error sharing transparent PNG:", err);
      Alert.alert(
        "Share Failed",
        err?.message || "An unexpected error occurred while sharing the image.",
      );
    }
  };

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

  const handleSelectFromGallery = async () => {
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

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setStatus(sourceImage ? "done" : "idle");
        return;
      }

      const asset = result.assets[0];
      let fileSize = asset.fileSize;

      // Robust fallback to check file size from storage if missing from ImagePicker metadata
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

      const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
      if (fileSize && fileSize > MAX_FILE_SIZE) {
        Alert.alert(
          "File Too Large",
          `The selected image is ${(fileSize / (1024 * 1024)).toFixed(1)} MB. The maximum supported file size is 15 MB. Please select a smaller image.`
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
      setError(
        err?.message || "An unexpected error occurred while picking the image.",
      );
      setStatus("error");
    }
  };

  const handleOpenCamera = async () => {
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

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setStatus(sourceImage ? "done" : "idle");
        return;
      }

      const asset = result.assets[0];
      let fileSize = asset.fileSize;

      // Robust fallback to check file size from storage if missing from ImagePicker metadata
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

      const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
      if (fileSize && fileSize > MAX_FILE_SIZE) {
        Alert.alert(
          "File Too Large",
          `The selected image is ${(fileSize / (1024 * 1024)).toFixed(1)} MB. The maximum supported file size is 15 MB. Please select a smaller image.`
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
      setError(
        err?.message ||
          "An unexpected error occurred while launching the camera.",
      );
      setStatus("error");
    }
  };

  const isTablet = width > 768;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

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
        <View className="flex-1 justify-between">
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

          {errorMessage && (
            <View className="mb-4 mx-auto w-full max-w-md bg-red-50/80 border border-red-100 rounded-2xl p-4 flex-row items-start justify-between shadow-sm">
              <View className="flex-row items-start flex-1 mr-2">
                <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center mr-3 mt-0.5">
                  <Feather name="alert-triangle" size={16} color="#dc2626" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-red-800">
                    Image Selection Failed
                  </Text>
                  <Text className="text-[11px] text-red-600 mt-0.5 leading-relaxed">
                    {errorMessage}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setError(null)}
                className="w-6 h-6 items-center justify-center bg-red-100/50 rounded-full active:bg-red-100"
              >
                <Feather name="x" size={14} color="#dc2626" />
              </Pressable>
            </View>
          )}

          <View className="flex-1 justify-center max-w-md w-full mx-auto my-4">
            <View className="bg-emerald-50/20 border-2 border-dashed border-emerald-200 rounded-[32px] p-6 items-center justify-between min-h-[320px] shadow-sm relative overflow-hidden">
              <View className="absolute -top-12 -left-12 w-24 h-24 bg-emerald-100/20 rounded-full blur-xl" />
              <View className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-200/10 rounded-full blur-2xl" />

              {sourceImage ? (
                <View className="w-full flex-1 justify-between py-2">
                  <View className="w-full h-80 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 relative shadow-sm">
                    {result ? (
                      <View className="w-full h-full justify-center items-center relative">
                        <View className="absolute inset-0 bg-slate-100/50 flex-row flex-wrap">
                          {Array.from({ length: 80 }).map((_, i) => (
                            <View
                              key={i}
                              style={{ width: 24, height: 24 }}
                              className={
                                i % 2 === 0
                                  ? "bg-slate-200/50"
                                  : "bg-transparent"
                              }
                            />
                          ))}
                        </View>
                        <Image
                          source={result.resultUri}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="contain"
                          transition={300}
                        />
                      </View>
                    ) : (
                      <>
                        <Image
                          source={sourceImage.uri}
                          style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}
                          contentFit="cover"
                          blurRadius={20}
                        />

                        <Image
                          source={sourceImage.uri}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="contain"
                          transition={300}
                        />
                      </>
                    )}

                    {status === "processing" && (
                      <View className="absolute inset-0 bg-black/60 items-center justify-center z-20 rounded-2xl">
                        <ActivityIndicator size="large" color="#10b981" />
                        <Text className="text-white text-sm font-bold mt-4 tracking-wide text-center">
                          Removing Background...
                        </Text>
                        <Text className="text-white/60 text-xs mt-1 text-center">
                          AI is working its magic
                        </Text>
                      </View>
                    )}

                    <Pressable
                      onPress={handleReset}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/50 items-center justify-center active:scale-90 active:bg-black/70 transition-all shadow-md z-10"
                    >
                      <Feather name="trash-2" size={14} color="white" />
                    </Pressable>
                  </View>

                  {showMetadata && (
                    <View className="w-full mt-3.5 bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-4 shadow-sm">
                      <Text className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest mb-3">
                        File Specifications
                      </Text>

                      <View className="gap-2">
                        <View className="flex-row justify-between items-center py-1 border-b border-emerald-100/20">
                          <View className="flex-row items-center">
                            <Feather
                              name="file"
                              size={13}
                              color="#059669"
                              className="mr-2"
                            />
                            <Text className="text-slate-500 text-xs font-semibold">
                              Name
                            </Text>
                          </View>
                          <Text
                            className="text-slate-800 text-xs font-bold truncate max-w-[60%]"
                            numberOfLines={1}
                          >
                            {sourceImage.fileName}
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
                          <Text className="text-slate-800 text-xs font-bold">
                            {sourceImage.width} × {sourceImage.height} px
                          </Text>
                        </View>

                        {sourceImage.fileSize && (
                          <View className="flex-row justify-between items-center py-1 border-b border-emerald-100/20">
                            <View className="flex-row items-center">
                              <Feather
                                name="database"
                                size={13}
                                color="#059669"
                                className="mr-2"
                              />
                              <Text className="text-slate-500 text-xs font-semibold">
                                Size
                              </Text>
                            </View>
                            <Text className="text-slate-800 text-xs font-bold">
                              {formatFileSize(sourceImage.fileSize)}
                            </Text>
                          </View>
                        )}

                        {sourceImage.mimeType && (
                          <View className="flex-row justify-between items-center py-1">
                            <View className="flex-row items-center">
                              <Feather
                                name="tag"
                                size={13}
                                color="#059669"
                                className="mr-2"
                              />
                              <Text className="text-slate-500 text-xs font-semibold">
                                Format
                              </Text>
                            </View>
                            <Text className="text-slate-800 text-xs font-bold uppercase">
                              {sourceImage.mimeType.split("/")[1] || "JPEG"}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  <View className="w-full mt-4 flex-row items-center space-x-3 gap-2">
                    {status === "done" ? (
                      <>
                        <Pressable
                          onPress={handleDownload}
                          disabled={isSaving}
                          className="flex-1 bg-emerald-500 py-3.5 px-3 rounded-2xl flex-row items-center justify-center shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {isSaving ? (
                            <ActivityIndicator
                              size="small"
                              color="white"
                              className="mr-2"
                            />
                          ) : (
                            <Feather
                              name="download"
                              size={16}
                              color="white"
                              className="mr-2"
                            />
                          )}
                          <Text className="text-white text-[13px] font-extrabold tracking-wide text-center">
                            {isSaving ? "Saving..." : "Download"}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={handleShare}
                          className="flex-1 border border-emerald-500 bg-white py-3.5 px-3 rounded-2xl flex-row items-center justify-center active:bg-slate-50 active:scale-[0.98] transition-all"
                        >
                          <Feather
                            name="share-2"
                            size={16}
                            color="#059669"
                            className="mr-2"
                          />
                          <Text className="text-emerald-600 text-[13px] font-extrabold tracking-wide text-center">
                            Share
                          </Text>
                        </Pressable>
                      </>
                    ) : (
                      <Pressable
                        onPress={() => {
                          if (sourceImage) {
                            removeBackgroundMutation.mutate(sourceImage);
                          }
                        }}
                        disabled={status === "processing" || !sourceImage}
                        className={`flex-1 py-3.5 px-3 rounded-2xl flex-row items-center justify-center shadow-md active:scale-[0.98] transition-all ${
                          status === "processing"
                            ? "bg-emerald-400"
                            : "bg-emerald-500 shadow-emerald-500/10 active:bg-emerald-600"
                        }`}
                      >
                        {status === "processing" ? (
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
                          {status === "processing"
                            ? "Removing BG..."
                            : "Remove BG"}
                        </Text>
                      </Pressable>
                    )}

                    <Pressable
                      onPress={() => setShowMetadata(!showMetadata)}
                      disabled={status === "processing"}
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
                </View>
              ) : (
                <>
                  <Pressable
                    onPress={handleSelectFromGallery}
                    className="items-center justify-center flex-1 my-6 active:opacity-75"
                  >
                    <Animated.View style={animatedFloatIcon} className="mb-4">
                      <View className="w-16 h-16 bg-emerald-500 items-center justify-center rounded-2xl shadow-md shadow-emerald-500/20">
                        <Feather name="upload-cloud" size={28} color="white" />
                      </View>
                    </Animated.View>
                    <Text selectable className="text-base font-semibold text-slate-800">
                      Select an image file
                    </Text>
                    <Text className="text-xs text-slate-400 mt-1">
                      Supports PNG, JPEG or WEBP up to 15MB
                    </Text>
                  </Pressable>

                  <View className="flex-row w-full space-x-3 gap-2 mt-2">
                    <Animated.View style={animatedGalleryBtn} className="flex-1">
                      <Pressable
                        onPress={handleSelectFromGallery}
                        disabled={status === "processing"}
                        onPressIn={() => {
                          galleryScale.value = withSpring(0.97);
                        }}
                        onPressOut={() => {
                          galleryScale.value = withSpring(1);
                        }}
                        className={`bg-emerald-500 py-3.5 px-3 rounded-2xl flex-row items-center justify-center shadow-md shadow-emerald-500/10 active:bg-emerald-600 ${
                          status === "processing" ? "opacity-50" : ""
                        }`}
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
                        onPress={handleOpenCamera}
                        disabled={status === "processing"}
                        onPressIn={() => {
                          cameraScale.value = withSpring(0.97);
                        }}
                        onPressOut={() => {
                          cameraScale.value = withSpring(1);
                        }}
                        className={`border border-emerald-500 bg-white py-3.5 px-3 rounded-2xl flex-row items-center justify-center active:bg-slate-50/50 ${
                          status === "processing" ? "opacity-50" : ""
                        }`}
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
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
