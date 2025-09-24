import * as React from 'react';
import { View, ViewStyle } from 'react-native';

type Props = { style?: ViewStyle };

const LottieWeb = React.forwardRef<any, Props>((props: Props, _ref: any) => {
  return React.createElement(View, { style: props.style });
});

export default LottieWeb;
