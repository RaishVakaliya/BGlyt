import React, { useRef, useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { Checkerboard } from "./Checkerboard";
import type { PickedImage, BackgroundRemovalResult } from "../types";

export interface ImageSliderProps {
  sourceImage: PickedImage;
  result: BackgroundRemovalResult;
}

export const ImageSlider = React.memo(({ sourceImage, result }: ImageSliderProps) => {
  const [sliderPosition, setSliderPosition] = useState(0.5);
  const containerWidth = useRef(0);

  const handleTouch = (event: any) => {
    const nativeEvent = event.nativeEvent;
    if (containerWidth.current > 0) {
      const x = nativeEvent.locationX;
      setSliderPosition(Math.max(0, Math.min(1, x / containerWidth.current)));
    }
  };

  return (
    <View
      onLayout={(e) => {
        containerWidth.current = e.nativeEvent.layout.width;
      }}
      onStartShouldSetResponder={() => true}
      onResponderMove={handleTouch}
      onResponderRelease={handleTouch}
      className="w-full h-full relative"
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel="Interactive comparison slider card. Drag your finger horizontally to swipe between original image and the transparent background-removed version."
    >
      <Checkerboard />
      <Image
        source={sourceImage.uri}
        style={{ width: "100%", height: "100%" }}
        contentFit="contain"
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: `${sliderPosition * 100}%`,
          overflow: "hidden",
          borderRightWidth: 1.5,
          borderRightColor: "#ffffff",
        }}
      >
        <Checkerboard />
        <Image
          source={result.resultUri}
          style={{
            width: containerWidth.current || "100%",
            height: "100%",
          }}
          contentFit="contain"
        />
      </View>
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${sliderPosition * 100}%`,
          marginLeft: -16,
          width: 32,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 30,
        }}
        pointerEvents="none"
      >
        <View className="w-8 h-8 rounded-full bg-white shadow-lg border border-slate-100 items-center justify-center">
          <Feather name="code" size={14} color="#059669" />
        </View>
      </View>
    </View>
  );
});

ImageSlider.displayName = "ImageSlider";
