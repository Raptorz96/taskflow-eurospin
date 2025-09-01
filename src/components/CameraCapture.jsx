import React, { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Camera, RotateCcw, Check, X, Upload, FlipHorizontal } from 'lucide-react'

const CameraCapture = ({ isOpen, onClose, onPhotoCapture }) => {
  const webcamRef = useRef(null)
  const fileInputRef = useRef(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isFrontCamera, setIsFrontCamera] = useState(false)
  const [cameraError, setCameraError] = useState(false)

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: isFrontCamera ? 'user' : 'environment'
  }

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setCapturedImage(imageSrc)
    }
  }, [webcamRef])

  const handleRetake = () => {
    setCapturedImage(null)
  }

  const handleConfirm = () => {
    if (capturedImage) {
      onPhotoCapture(capturedImage)
      setCapturedImage(null)
      onClose()
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCapturedImage(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleCamera = () => {
    setIsFrontCamera(!isFrontCamera)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-white font-medium">Scatta una foto</h2>
            <div className="flex gap-2">
              <button
                onClick={toggleCamera}
                className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
              >
                <FlipHorizontal size={20} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
              >
                <Upload size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Camera/Preview Area */}
        <div className="flex-1 relative overflow-hidden">
          {capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              {!cameraError ? (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                  onUserMediaError={() => setCameraError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white">
                  <Camera size={64} className="mb-4 text-gray-400" />
                  <p className="text-lg mb-2">Fotocamera non disponibile</p>
                  <p className="text-gray-400 text-center px-4 mb-6">
                    Consenti l'accesso alla fotocamera o usa il caricamento file
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#0066CC] text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Upload size={20} />
                    Carica file
                  </button>
                </div>
              )}
              
              {/* Framing overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full relative">
                  <div className="absolute inset-4 border-2 border-white/30 rounded-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br"></div>
                  </div>
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/30 px-3 py-1 rounded">
                    Inquadra il prodotto o documento
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          {capturedImage ? (
            <div className="flex justify-center gap-6">
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 bg-gray-600 text-white px-6 py-4 rounded-full font-medium hover:bg-gray-700 transition-colors"
              >
                <RotateCcw size={20} />
                Rifai
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 bg-[#0066CC] text-white px-8 py-4 rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                <Check size={20} />
                Conferma
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={capture}
                disabled={cameraError}
                className="w-20 h-20 bg-white rounded-full border-4 border-[#0066CC] flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-16 h-16 bg-[#0066CC] rounded-full flex items-center justify-center">
                  <Camera size={24} className="text-white" />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}

export default CameraCapture