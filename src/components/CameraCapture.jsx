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
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 via-black/40 to-transparent">
          <div className="safe-top">
            <div className="flex justify-between items-center px-6 py-4">
              <button
                onClick={onClose}
                className="p-3 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200"
              >
                <X size={22} />
              </button>
              <h2 className="text-white font-semibold text-lg tracking-wide">Scatta una foto</h2>
              <div className="flex gap-3">
                <button
                  onClick={toggleCamera}
                  className="p-3 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200"
                >
                  <FlipHorizontal size={20} />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200"
                >
                  <Upload size={20} />
                </button>
              </div>
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
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
                  <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 text-center max-w-sm mx-auto">
                    <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Camera size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Fotocamera non disponibile</h3>
                    <p className="text-gray-300 text-sm leading-relaxed mb-8">
                      Consenti l'accesso alla fotocamera nelle impostazioni del browser o carica un'immagine dal dispositivo
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#0066CC] text-white px-8 py-4 rounded-2xl font-semibold hover:bg-blue-600 transition-all duration-200 flex items-center gap-3 mx-auto shadow-lg hover:scale-105"
                    >
                      <Upload size={22} />
                      Carica immagine
                    </button>
                  </div>
                </div>
              )}
              
              {/* Modern Framing overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full relative flex items-center justify-center">
                  {/* Main frame */}
                  <div className="relative w-80 h-80 max-w-[80vw] max-h-[60vh]">
                    {/* Corner brackets */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg shadow-lg"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg shadow-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg shadow-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg shadow-lg"></div>
                    
                    {/* Center grid lines */}
                    <div className="absolute inset-0 border border-white/20 rounded-lg">
                      <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20"></div>
                      <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20"></div>
                      <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20"></div>
                      <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20"></div>
                    </div>
                  </div>
                  
                  {/* Instruction text */}
                  <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
                    <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                      <span className="text-white text-sm font-medium">Inquadra il prodotto o documento</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modern Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="safe-bottom">
            {capturedImage ? (
              <div className="flex justify-center gap-4 px-8 py-8">
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-3 bg-white/15 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/25 transition-all duration-200 border border-white/20"
                >
                  <RotateCcw size={22} />
                  Rifai
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-3 bg-[#0066CC] text-white px-10 py-4 rounded-2xl font-semibold hover:bg-blue-600 transition-all duration-200 shadow-lg"
                >
                  <Check size={22} />
                  Conferma
                </button>
              </div>
            ) : (
              <div className="flex justify-center items-center px-8 py-8">
                <div className="relative">
                  <button
                    onClick={capture}
                    disabled={cameraError}
                    className="w-24 h-24 bg-white rounded-full border-4 border-[#0066CC] flex items-center justify-center hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:scale-105 active:scale-95"
                  >
                    <div className="w-20 h-20 bg-[#0066CC] rounded-full flex items-center justify-center shadow-inner">
                      <Camera size={28} className="text-white" />
                    </div>
                  </button>
                  
                  {/* Capture ring animation */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
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