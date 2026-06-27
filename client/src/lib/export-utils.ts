// Shared export utilities for visiting cards client-side rendering

/**
 * Converts an SVG Element to a high-resolution PNG Data URL client-side.
 * Uses HTML5 Canvas offscreen drawing.
 */
export const convertSvgToPngDataUrl = (
  svgElement: SVGElement,
  scale: number = 3
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const svgSvg = svgElement as SVGSVGElement;
        const viewBoxWidth = (svgSvg.viewBox && svgSvg.viewBox.baseVal && svgSvg.viewBox.baseVal.width) || svgElement.clientWidth || 800;
        const viewBoxHeight = (svgSvg.viewBox && svgSvg.viewBox.baseVal && svgSvg.viewBox.baseVal.height) || svgElement.clientHeight || 450;
        
        canvas.width = viewBoxWidth * scale;
        canvas.height = viewBoxHeight * scale;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Failed to get 2D canvas context"));
          return;
        }

        // Fill white background (matches visiting card designs)
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const pngDataUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(blobURL);
        resolve(pngDataUrl);
      };
      image.onerror = (err) => {
        URL.revokeObjectURL(blobURL);
        reject(err);
      };
      image.src = blobURL;
    } catch (e) {
      reject(e);
    }
  });
};
