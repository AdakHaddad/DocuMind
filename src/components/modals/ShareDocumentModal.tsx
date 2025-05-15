"use client"

import { useState, useRef } from "react"
import { Check, Copy } from 'lucide-react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  documentName: string
  documentId: string
}

export default function ShareModal({ isOpen, onClose, documentName, documentId }: ShareModalProps) {
  const [accessType, setAccessType] = useState<"public" | "private">("public")
  const [copied, setCopied] = useState(false)
  const linkRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const shareLink = `https://documind.web.id/${documentId.toLowerCase().replace(/\s+/g, "-")}`

  const handleCopy = () => {
    if (linkRef.current) {
      linkRef.current.select()
      navigator.clipboard.writeText(linkRef.current.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSaveChanges = () => {
    // Here you would implement the logic to save the access settings
    console.log("Saving access settings:", { accessType, shareLink })
    onClose()
  }

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-0 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#4a90e2] text-white text-center py-3 text-xl font-medium">
          Share Access
        </div>
        
        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Access Type */}
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-700 min-w-[100px]">Access Type:</span>
            <div className="flex rounded-md overflow-hidden border border-[#4a90e2]">
              <button
                className={`px-4 py-1 ${
                  accessType === "public" 
                    ? "bg-[#4a90e2] text-white" 
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setAccessType("public")}
              >
                Public
              </button>
              <button
                className={`px-4 py-1 ${
                  accessType === "private" 
                    ? "bg-[#4a90e2] text-white" 
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setAccessType("private")}
              >
                Private
              </button>
            </div>
          </div>
          
          {/* Access Link */}
          <div className="space-y-2">
            <span className="font-medium text-gray-700">Access Link:</span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={linkRef}
                  type="text"
                  value={shareLink}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                />
              </div>
              <button
                onClick={handleCopy}
                className="bg-[#4a90e2] text-white px-3 py-2 rounded-md hover:bg-[#3a80d2] transition-colors flex items-center"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="flex justify-center p-4 border-t border-gray-200">
          <button
            onClick={handleSaveChanges}
            className="bg-[#4a90e2] text-white px-6 py-2 rounded-md hover:bg-[#3a80d2] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
