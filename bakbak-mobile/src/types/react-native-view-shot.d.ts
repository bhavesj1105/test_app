declare module 'react-native-view-shot' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export type CaptureOptions = {
    width?: number;
    height?: number;
    format?: 'jpg' | 'png' | 'webm' | 'raw';
    quality?: number; // 0..1
    result?: 'tmpfile' | 'base64' | 'data-uri' | 'zip-base64';
  };

  export interface ViewShotProps extends ViewProps {}

  export default class ViewShot extends React.Component<ViewShotProps> {
    capture(options?: CaptureOptions): Promise<string>;
  }
}
