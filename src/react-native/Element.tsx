import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import type { ElementData } from "../core";

export type ElementProps<TMeta = unknown> = ElementData<TMeta> & {
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export function Element(_props: ElementProps) {
  return null;
}
