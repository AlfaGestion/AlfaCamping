import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const horizontalScale = (size) => (width / guidelineBaseWidth) * size;
const verticalScale = (size) => (height / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (horizontalScale(size) - size) * factor;

const fontScale = PixelRatio.getFontScale();
export const getFontSize = size => size / fontScale;

const paddingHorizontalGlobal = horizontalScale(20)

export { horizontalScale, verticalScale, moderateScale, paddingHorizontalGlobal };
