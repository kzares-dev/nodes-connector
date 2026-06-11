declare module "react-native" {
  import type { ComponentType, ReactNode } from "react";

  export type GestureResponderEvent = {
    nativeEvent: {
      locationX?: number;
      locationY?: number;
      pageX: number;
      pageY: number;
    };
  };

  export type PanResponderGestureState = {
    dx: number;
    dy: number;
  };

  export type StyleProp<T> = T | Array<StyleProp<T>> | false | null | undefined;
  export type ViewStyle = Record<string, unknown>;
  export type TextStyle = Record<string, unknown>;

  export const View: ComponentType<{ children?: ReactNode; style?: StyleProp<ViewStyle>; onLayout?: (event: { nativeEvent: { layout: { width: number; height: number } } }) => void } & Record<string, unknown>>;
  export const Text: ComponentType<{ children?: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number } & Record<string, unknown>>;
  export const Pressable: ComponentType<{ children?: ReactNode; style?: StyleProp<ViewStyle>; onPress?: (event: GestureResponderEvent) => void; onLongPress?: (event: GestureResponderEvent) => void } & Record<string, unknown>>;
  export const TextInput: ComponentType<{ value?: string; style?: StyleProp<TextStyle>; onChangeText?: (value: string) => void; onBlur?: () => void; autoFocus?: boolean } & Record<string, unknown>>;
  export const StyleSheet: { create<T extends Record<string, unknown>>(styles: T): T; absoluteFillObject: ViewStyle };
  export const PanResponder: {
    create(config: Record<string, unknown>): {
      panHandlers: Record<string, unknown>;
    };
  };
}

declare module "react-native-svg" {
  import type { ComponentType, ReactNode } from "react";

  export type SvgProps = { children?: ReactNode } & Record<string, unknown>;
  export const Svg: ComponentType<SvgProps>;
  export const Path: ComponentType<Record<string, unknown>>;
  export const Rect: ComponentType<Record<string, unknown>>;
  export const Circle: ComponentType<Record<string, unknown>>;
  export const Polygon: ComponentType<Record<string, unknown>>;
  export const G: ComponentType<SvgProps>;
}
