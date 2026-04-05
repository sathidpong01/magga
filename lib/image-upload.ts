export const MIN_IMAGE_DIMENSION = 10;
export const MAX_IMAGE_DIMENSION = 8000;
export const TRANSCODED_IMAGE_CONTENT_TYPE = "image/webp";

export function assertValidImageDimensions(dimensions: {
  width?: number | null;
  height?: number | null;
}) {
  const { width, height } = dimensions;

  if (
    !width ||
    !height ||
    width < MIN_IMAGE_DIMENSION ||
    height < MIN_IMAGE_DIMENSION ||
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION
  ) {
    throw new Error(
      `Image dimensions out of valid range (${MIN_IMAGE_DIMENSION}-${MAX_IMAGE_DIMENSION}px)`
    );
  }
}
