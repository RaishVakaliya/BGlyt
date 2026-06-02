import React from "react";
import { View } from "react-native";

export const Checkerboard = React.memo(() => (
  <View className="absolute inset-0 bg-slate-100/50 flex-row flex-wrap">
    {Array.from({ length: 80 }).map((_, i) => (
      <View
        key={i}
        style={{ width: 24, height: 24 }}
        className={i % 2 === 0 ? "bg-slate-200/50" : "bg-transparent"}
      />
    ))}
  </View>
));

Checkerboard.displayName = "Checkerboard";
