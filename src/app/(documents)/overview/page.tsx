"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Image, Share2, Pencil, Trash2 } from 'lucide-react'
import { useParams, useRouter } from "next/navigation"
import ShareModal from "@/src/components/modals/ShareDocumentModal"
import AIRoomChatModal from "@/src/components/modals/AIRoomChatModal"

export default function PDFViewPage() {
  const [activeTab, setActiveTab] = useState("Overview")
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isAIRoomOpen, setIsAIRoomOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const params = useParams()
  const router = useRouter()
  
  // Decode the slug to get the original filename
  const fileName = decodeURIComponent(params.view as string)
  
  // Sample key summary points
  const keySummaryPoints = [
    "Lorem ipsum",
    "Dolor sit amet",
    "Consecttur",
    "Adipisching",
    "etat"
  ]

  const handleRename = () => {
    setIsRenaming(true)
    setNewFileName(fileName)
  }

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically make an API call to rename the file
    setIsRenaming(false)
    // For demo, we'll just update the URL
    router.push(`/documents/${encodeURIComponent(newFileName)}`)
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      // Here you would typically make an API call to delete the file
      router.push("/documents")
    }
  }

  const handleShare = () => {
    setIsShareModalOpen(true)
  }

  const handleAskSomething = () => {
    setIsAIRoomOpen(true)
  }

  const primaryButtonClasses = `border-3 border-[#4a90e2] bg-[#4a90e2] text-white px-4 py-2 rounded-md font-medium hover:bg-[#3a80d2] hover:border-[#3a80d2] hover:cursor-pointer transition-colors shadow-md`;

  return (
    <div className="flex flex-col max-h-screen items-center justify-center">

      {/* Main Content */}
        <div className="max-w-7xl mx-auto bg-white rounded-2xl p-6 flex flex-col md:flex-row gap-6 shadow-[-3px_2px_10px_0px_rgba(0,0,0,0.3)]">
          {/* PDF Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-start mb-4">
              <p className="text-gray-700 text-md font-medium">Prompted by. ZackyKey</p>
              <button 
                onClick={handleShare}
                className={`ml-auto gap-3 rounded-md hover:bg-[#3a80d2] flex items-center ${primaryButtonClasses}`}
              >
                <Share2 size={16} />
                Share
              </button>
            </div>
            
            <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex">
              {/* Left blue sidebar */}
              <div className="w-[60px] bg-[#4a90e2] hidden md:block"></div>
              
              {/* PDF content */}
              <div className="flex-1 p-6 bg-gray-100">
                <h2 className="text-2xl font-bold text-center mb-4">What is Lorem Ipsum?</h2>
                <div className="flex gap-6">
                  <div className="border border-gray-300 p-2 w-[150px] h-[150px] flex items-center justify-center">
                    <Image className="text-gray-400" size={40} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 text-lg">
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry&apos;s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right blue sidebar */}
              <div className="w-[60px] bg-[#4a90e2] hidden md:block"></div>
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="w-full md:w-[300px] bg-white rounded-lg p-4 shadow-[-2px_2px_6px_0px_rgba(0,0,0,0.3)]">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-3">Key Summary</h3>
              <ol className="list-decimal pl-5 space-y-1">
                {keySummaryPoints.map((point, index) => (
                  <li key={index} className="text-gray-700 font-medium">{point}</li>
                ))}
              </ol>
            </div>
            
            <button 
              // onClick={handleAskSomething}
              className={`w-full rounded-md transition-colors ${primaryButtonClasses}`}
            >
              Ask Something
            </button>
          </div>
        </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          documentName={fileName}
          documentId={fileName}
        />
      )}

      {/* AI Room Chat Modal */}
      {isAIRoomOpen && (
        <AIRoomChatModal
          onClose={() => setIsAIRoomOpen(false)}
        />
      )}
    </div>
  )
}