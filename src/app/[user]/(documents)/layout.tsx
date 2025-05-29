"use client";

import Header from "@/src/components/Header";
import InsideFooter from "@/src/components/InsideFooter";
import { DocumentObject } from "../page";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { User } from "../../api/auth/[...nextauth]/route";

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const [document, setDocument] = useState<DocumentObject | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const slug = params?.documents as string;

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch(`/api/auth/session`, {
        method: "GET"
      });

      if (!response.ok) return (window.location.href = "/login");

      const data = await response.json();
      setUser(data);

      return data;
    };

    const fetchData = async () => {
      const response = await fetch(`/api/learning/documents?slug=${slug}`, {
        method: "GET"
      });
      if (!response.ok) return (window.location.href = `/${slug}`);

      const data = await response.json();
      setDocument(data);
      setNewTitle(data.title);
    };

    Promise.all([fetchUser(), fetchData()]);
  }, [slug]);

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim() || !document) return;

    const response = await fetch(`/api/learning/documents?id=${document._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() })
    });

    if (response.ok) {
      await response.json();
      setDocument((prev) =>
        prev ? { ...prev, title: newTitle.trim() } : null
      );
      setIsRenaming(false);
    } else {
      alert("Failed to rename document.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    if (!document) return;

    const response = await fetch(`/api/learning/documents?id=${document._id}`, {
      method: "DELETE"
    });

    if (response.ok) {
      return (window.location.href = `/${user?.slug}`);
    } else {
      alert("Failed to delete document.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-white text-black h-full w-full">
      <Header>
        <div className="flex gap-6 py-2 flex-wrap justify-between items-center w-full px-4">
          {/* Back Button & Title */}
          <div className="flex gap-6 items-center">
            <button
              onClick={() => (window.location.href = `/${user?.slug}`)}
              className="border-2 border-[#F5A623] bg-[#F5A623] text-white font-bold px-4 py-3 rounded-md hover:bg-gray-400 hover:border-gray-400 transition-colors"
            >
              {`<<`}
            </button>

            {isRenaming ? (
              <form
                onSubmit={handleRenameSubmit}
                className="flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-2xl font-semibold px-3 py-1 border rounded-md shadow-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  className="px-3 py-1 bg-gray-300 text-black rounded hover:bg-gray-400"
                  onClick={() => {
                    setNewTitle(document?.title || "");
                    setIsRenaming(false);
                  }}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="bg-white rounded-md px-6 py-2 shadow-md">
                <h1 className="text-3xl font-bold text-gray-800">
                  {document?.title}
                </h1>
              </div>
            )}
          </div>

          {/* Rename & Delete Buttons */}
          <div className="flex gap-4">
            <button
              hidden={isRenaming}
              onClick={() => setIsRenaming(true)}
              className="border-2 border-white bg-transparent text-white px-6 py-3 rounded-md font-medium hover:bg-gray-400 hover:border-gray-400 hover:text-white transition-colors shadow-md"
            >
              Rename
            </button>
            <button
              onClick={handleDelete}
              className="border-2 border-[#F5A623] bg-[#F5A623] text-white font-bold px-4 py-3 rounded-md hover:bg-gray-400 hover:border-gray-400 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Header>

      {children}
      <InsideFooter />
    </div>
  );
}
