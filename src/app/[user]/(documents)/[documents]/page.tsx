"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { useParams } from "next/navigation";
import ShareModal from "@/src/components/modals/ShareDocumentModal";
import AIRoomChatModal from "@/src/components/modals/AIRoomChatModal";
import { DocumentObject } from "../../page";

export default function PDFViewPage() {
  const params = useParams();
  const [document, setDocument] = useState<DocumentObject | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        `/api/learning/documents?slug=${params.documents}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        window.location.href = "/login";
      }

      const data = await response.json();

      if (data) {
        const document: DocumentObject = data;

        // if document is not yet summarized, call summary
        if (!document.summary) {
          const response = await fetch(
            `/api/learning/documents/summarize?id=${document._id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json"
              }
            }
          );

          if (!response.ok) {
            window.location.href = "/login";
          }

          const data = await response.json();

          document.summary = data.summary;
        }

        setDocument(document);
      }
    };

    Promise.all([fetchData()]);
  }, [params.documents]);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAIRoomOpen, setIsAIRoomOpen] = useState(false);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleAskSomething = () => {
    setIsAIRoomOpen(true);
  };

  const primaryButtonClasses = `border-3 border-[#4a90e2] bg-[#4a90e2] text-white px-4 py-2 rounded-md font-medium hover:bg-[#3a80d2] hover:border-[#3a80d2] hover:cursor-pointer transition-colors shadow-md`;

  if (!document) return;

  return (
    <div className="flex flex-col max-h-screen w-full h-full items-center justify-center">
      {/* Main Content */}
      <div className="lg:max-w-6xl w-full lg:max-h-[60vh] h-full mx-auto bg-white rounded-2xl p-6 flex flex-col md:flex-row gap-6 shadow-[-3px_2px_10px_0px_rgba(0,0,0,0.3)]">
        {/* PDF Content */}
        <div className="flex-1 flex flex-col w-full">
          <div className="flex items-start mb-4">
            <p className="text-gray-700 text-md font-medium">
              Prompted by. {document?.owner}
            </p>
            <button
              onClick={handleShare}
              className={`ml-auto gap-3 rounded-md hover:bg-[#3a80d2] flex items-center ${primaryButtonClasses}`}
            >
              <Share2 size={16} />
              Share
            </button>
          </div>

          <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex w-full">
            {/* Left blue sidebar */}
            <div className="w-[60px] bg-[#4a90e2] hidden md:block"></div>

            {/* PDF content */}
            <div className="flex-1 p-6 bg-gray-100">
              <iframe
                src={`${document.driveFileUrl}`}
                className="w-full h-full rounded-md"
                title={document.title}
              />
            </div>

            {/* Right blue sidebar */}
            <div className="w-[60px] bg-[#4a90e2] hidden md:block"></div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full h-full md:w-[300px] bg-white rounded-lg p-4 shadow-[-2px_2px_6px_0px_rgba(0,0,0,0.3)]">
          <div className="mb-6 h-full flex flex-col">
            <h3 className="text-xl font-bold mb-3">Key Summary</h3>

            <div className="flex-1 overflow-auto rounded-md bg-gray-50 p-3 mb-4 text-sm text-gray-800 shadow-inner">
              {document.summary}
            </div>

            <button
              onClick={handleAskSomething}
              className={`w-full h-fit rounded-md transition-colors ${primaryButtonClasses}`}
            >
              Ask Something
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={document}
      />

      {/* AI Room Chat Modal */}
      <AIRoomChatModal
        show={isAIRoomOpen}
        onClose={() => setIsAIRoomOpen(false)}
        document={document}
        purpose="general"
      />
    </div>
  );
}
