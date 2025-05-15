"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Image, Share2, Pencil, Trash2 } from 'lucide-react'
import { useParams, useRouter } from "next/navigation"
import ShareModal from "../../../components/ShareDocumentModal"
import AIRoomChatModal from "../../../components/AIRoomChatModal"

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-[#4a90e2] py-3 px-4 flex items-center justify-between">
        <div className="flex items-center flex-1">
          <Link href="/documents" className="bg-[#f0ad4e] text-white p-2 rounded mr-3 hover:bg-[#ec971f] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="bg-white rounded-md px-4 py-2 flex-1 max-w-3xl">
            {isRenaming ? (
              <form onSubmit={handleRenameSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded"
                  autoFocus
                />
                <button type="submit" className="bg-[#4a90e2] text-white px-3 py-1 rounded">
                  Save
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsRenaming(false)}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <h1 className="text-xl font-medium text-gray-800 truncate">
                {fileName}
              </h1>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRename}
            className="bg-white text-[#4a90e2] px-4 py-1 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-1"
          >
            <Pencil size={16} />
            Rename
          </button>
          <button 
            onClick={handleDelete}
            className="bg-[#f0ad4e] text-white px-4 py-1 rounded-md hover:bg-[#ec971f] transition-colors flex items-center gap-1"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row gap-6">
          {/* PDF Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-start mb-4">
              <p className="text-gray-700 text-sm">Prompted by. ZackyKey</p>
              <button 
                onClick={handleShare}
                className="ml-auto bg-[#4a90e2] text-white px-4 py-1 rounded-md hover:bg-[#3a80d2] transition-colors flex items-center gap-1"
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
                <h2 className="text-2xl font-medium text-center mb-4">What is Lorem Ipsum?</h2>
                <div className="flex gap-6">
                  <div className="border border-gray-300 p-2 w-[150px] h-[150px] flex items-center justify-center">
                    <Image className="text-gray-400" size={40} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800">
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
          <div className="w-full md:w-[300px] bg-white rounded-lg p-4">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-3">Key Summary</h3>
              <ol className="list-decimal pl-5 space-y-1">
                {keySummaryPoints.map((point, index) => (
                  <li key={index} className="text-gray-700">{point}</li>
                ))}
              </ol>
            </div>
            
            <button 
              onClick={handleAskSomething}
              className="w-full bg-[#4a90e2] text-white py-2 rounded-md hover:bg-[#3a80d2] transition-colors"
            >
              Ask Something
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#4a90e2] py-3 px-6 flex justify-center items-center">
        <div className="flex gap-2">
          <button 
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === "Overview" 
                ? "bg-[#f0ad4e] text-white" 
                : "bg-white text-gray-800 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("Overview")}
          >
            Overview
          </button>
          <Link
            href={`/documents/${encodeURIComponent(fileName)}/flashcard`}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === "Flash Cards" 
                ? "bg-[#f0ad4e] text-white" 
                : "bg-white text-gray-800 hover:bg-gray-100"
            }`}
          >
            Flash Cards
          </Link>
          <button 
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === "Quiz" 
                ? "bg-[#f0ad4e] text-white" 
                : "bg-white text-gray-800 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("Quiz")}
          >
            Quiz
          </button>
        </div>
      </footer>

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
          isOpen={isAIRoomOpen}
          onClose={() => setIsAIRoomOpen(false)}
          documentName={fileName}
        />
      )}
    </div>
  )
}