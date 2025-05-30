"use client";

import { useState, useRef } from "react";
import { Check, Copy } from "lucide-react";
import { DocumentObject } from "@/src/app/[user]/page";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentObject;
}

export default function ShareModal({
  isOpen,
  onClose,
  document
}: ShareModalProps) {
  const [accessType, setAccessType] = useState<"public" | "private">(
    document.access
  );
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // get current domain
  const domain = window.location.origin;

  const shareLink = `${domain}/${document.owner}/${document.slug}`;

  const handleCopy = () => {
    if (linkRef.current) {
      linkRef.current.select();
      navigator.clipboard.writeText(linkRef.current.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveChanges = async () => {
    // Here you would implement the logic to save the access settings
    await fetch(`/api/learning/documents/access?documentId=${document._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ access: accessType })
    });
    document.access = accessType; // Update the document object with the new access type
    onClose();
  };

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#4a90e2] text-white text-center py-3 text-xl font-semibold">
          Share Access
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Access Type */}
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-700 min-w-[100px]">
              Access Type:
            </span>
            <div className="flex rounded-md overflow-hidden border-2 border-[#4a90e2]">
              <button
                className={`px-4 py-1 ${
                  accessType === "public"
                    ? "bg-[#4a90e2] text-white font-medium"
                    : "bg-white text-gray-700 hover:bg-gray-200 hover:cursor-pointer font-medium"
                }`}
                onClick={() => setAccessType("public")}
              >
                Public
              </button>
              <button
                className={`px-4 py-1 ${
                  accessType === "private"
                    ? "bg-[#4a90e2] text-white font-medium"
                    : "bg-white text-gray-700 hover:bg-gray-200 hover:cursor-pointer font-medium"
                }`}
                onClick={() => setAccessType("private")}
              >
                Private
              </button>
            </div>
          </div>

          {/* Access Link */}
          <div className="space-y-2">
            <span className="font-medium text-gray-700 mb-2">Access Link:</span>
            <div className="flex items-center gap-2 mt-2">
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
                className="bg-[#4a90e2] text-white px-3 py-2 rounded-md font-medium hover:bg-[#3a80d2] hover:cursor-pointer transition-colors flex items-center"
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
            className="bg-[#4a90e2] text-white px-6 py-2 rounded-md font-medium hover:bg-[#3a80d2] hover:cursor-pointer transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
