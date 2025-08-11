import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
}

const defaultBreakpoints: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
};

export const useBreakpoint = (customBreakpoints?: Partial<BreakpointConfig>) => {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = (result: { window: any }) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const { width } = screenData;
  const isWeb = Platform.OS === 'web';

  return {
    width,
    height: screenData.height,
    isMobile: width < breakpoints.mobile,
    isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
    isDesktop: width >= breakpoints.desktop,
    isWeb,
    breakpoints,
  };
};