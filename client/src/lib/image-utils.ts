/**
 * Utility to resize and compress a base64 image client-side.
 * Resolves to a compressed base64 JPEG data URL.
 */
export const resizeImageBase64 = (
  base64Str: string,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<string> => {
  return new Promise((resolve) => {
    // If it's not a valid base64 data URL, return it as-is
    if (!base64Str || !base64Str.startsWith("data:image")) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          resolve(base64Str);
          return;
        }

        // Draw and compress to JPEG with 75% quality
        context.drawImage(img, 0, 0, width, height);
        const result = canvas.toDataURL("image/jpeg", 0.75);
        resolve(result);
      } catch (err) {
        console.error("Error resizing image:", err);
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
};
