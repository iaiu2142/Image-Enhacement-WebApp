
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ImageUploader from './components/ImageUploader';
import EnhancementControls from './components/EnhancementControls';
import BeforeAfterSlider from './components/BeforeAfterSlider';
import { applyEnhancements, getImagePixelData, createImageFromPixelData } from './services/imageProcessingService';
import { EnhancementOptions, EnhancementType, PixelData } from './types';

function App() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<HTMLImageElement | null>(null);
  const [selectedEnhancements, setSelectedEnhancements] = useState<EnhancementOptions>({
    contrast: false,
    brightness: false,
    sharpening: false,
    color: false,
    noiseReduction: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Store original pixel data to re-apply enhancements from scratch
  const originalPixelDataRef = useRef<PixelData | null>(null);

  const handleImageUpload = useCallback((image: HTMLImageElement) => {
    setOriginalImage(image);
    setEnhancedImage(null); // Clear enhanced image on new upload
    setSelectedEnhancements({ // Reset enhancements
      contrast: false,
      brightness: false,
      sharpening: false,
      color: false,
      noiseReduction: false,
    });
    setUploadError(null);
    try {
      originalPixelDataRef.current = getImagePixelData(image);
    } catch (error) {
      console.error('Failed to get pixel data from uploaded image:', error);
      setUploadError('Failed to process image data. Please try another image.');
      setOriginalImage(null);
    }
  }, []);

  const handleUploadError = useCallback((message: string) => {
    setUploadError(message);
    setOriginalImage(null);
    setEnhancedImage(null);
  }, []);

  const toggleEnhancement = useCallback((option: EnhancementType) => {
    setSelectedEnhancements((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  }, []);

  // Effect to re-process image whenever enhancements or original image changes
  useEffect(() => {
    const processImage = async () => {
      if (!originalImage || !originalPixelDataRef.current) {
        setEnhancedImage(null);
        return;
      }

      // Check if any enhancements are selected
      const hasEnhancements = Object.values(selectedEnhancements).some(Boolean);

      if (!hasEnhancements) {
        setEnhancedImage(null); // If no enhancements, show only original image (or no comparison)
        return;
      }

      setIsProcessing(true);
      try {
        const processedPixelData = applyEnhancements(
          originalPixelDataRef.current,
          selectedEnhancements
        );
        const newEnhancedImage = await createImageFromPixelData(processedPixelData);
        setEnhancedImage(newEnhancedImage);
      } catch (error) {
        console.error('Error during image enhancement:', error);
        setUploadError('Failed to apply enhancements. Please try again.');
        setEnhancedImage(null);
      } finally {
        setIsProcessing(false);
      }
    };

    // Add a debounce to prevent too frequent processing if toggles are rapidly changed
    const handler = setTimeout(() => {
      processImage();
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [originalImage, selectedEnhancements]); // Re-run effect when original image or enhancements change

  const handleDownload = useCallback(() => {
    if (enhancedImage) {
      const link = document.createElement('a');
      link.href = enhancedImage.src;
      link.download = `enhanced_${Date.now()}.png`; // Suggest a filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [enhancedImage]);

  return (
    <div className="container max-w-4xl mx-auto p-4 bg-gray-800 rounded-xl shadow-lg my-8">
      <h1 className="text-3xl font-bold text-center text-blue-400 mb-6 sm:mb-8">
        Automatic Image Enhancement Web App 🎨
      </h1>

      <p className="text-center text-gray-400 mb-6 text-sm">
        Images are processed instantly and never stored.
      </p>

      {!originalImage && !uploadError && (
        <ImageUploader onImageUpload={handleImageUpload} onUploadError={handleUploadError} isLoading={isProcessing} />
      )}

      {uploadError && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{uploadError}</span>
          <button
            onClick={() => {
              setUploadError(null);
              setOriginalImage(null);
            }}
            className="ml-4 text-sm text-red-400 hover:text-red-200"
          >
            Clear
          </button>
        </div>
      )}

      {originalImage && (
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Choose enhancement</h2>
          <EnhancementControls
            selectedOptions={selectedEnhancements}
            onToggle={toggleEnhancement}
            isProcessing={isProcessing}
          />

          {isProcessing && (
            <div className="flex items-center space-x-2 text-blue-400 my-4">
              <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            </div>
          )}

          <div className="mt-6 w-full flex justify-center min-h-[300px] items-center">
            {originalImage && enhancedImage && (
              <BeforeAfterSlider
                originalImageSrc={originalImage.src}
                enhancedImageSrc={enhancedImage.src}
                imageWidth={originalImage.naturalWidth}
                imageHeight={originalImage.naturalHeight}
              />
            )}
            {originalImage && !enhancedImage && !isProcessing && (
              // Display original image if no enhancements applied or being processed
              <div className="relative overflow-hidden rounded-lg shadow-inner max-w-[800px] max-h-[600px]">
                <img
                  src={originalImage.src}
                  alt="Original"
                  className="w-full h-full object-contain"
                  style={{ maxHeight: '600px' }} // Limit max height
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            {enhancedImage && (
              <button
                onClick={handleDownload}
                className="
                  px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-md
                  hover:bg-blue-700 transition-colors duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  w-full sm:w-auto
                "
              >
                Download enhanced image
              </button>
            )}
            <button
                onClick={() => {
                  setOriginalImage(null);
                  setEnhancedImage(null);
                  setUploadError(null);
                  originalPixelDataRef.current = null;
                }}
                className="
                  px-6 py-3 bg-gray-700 text-gray-200 font-semibold rounded-full shadow-md
                  hover:bg-gray-600 transition-colors duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                  w-full sm:w-auto
                "
              >
                Upload New Image
              </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;