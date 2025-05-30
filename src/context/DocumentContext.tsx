"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DocumentObject } from "@/src/types/documents";

interface DocumentContextType {
  document: DocumentObject | null;
  setDocument: (doc: DocumentObject | null) => void;
  isLoading: boolean;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [document, setDocument] = useState<DocumentObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();

  const slug = params?.documents as string;

  useEffect(() => {
    const fetchDocument = async () => {
      if (!session?.user?.slug || !slug) {
        setIsLoading(false);
        return;
      }

      try {
        console.log("Context - Fetching document with slug:", slug);
        const response = await fetch(`/api/learning/documents?slug=${slug}`, {
          method: "GET"
        });

        if (!response.ok) {
          console.error("Context - Error fetching document:", response.status);
          if (response.status === 401) {
            router.push("/signin");
          } else {
            router.push(`/${session.user.slug}`);
          }
          return;
        }

        const data = await response.json();
        console.log("Context - Fetched document:", data);

        if (!data) {
          console.error("Context - No document data received");
          router.push(`/${session.user.slug}`);
          return;
        }

        // Check if document is not public and the user is not the owner
        if (data.access !== "public" && data.owner !== session.user.slug) {
          router.push(`/${session.user.slug}`);
          return;
        }

        setDocument(data);
      } catch (error) {
        console.error("Context - Error fetching document:", error);
        router.push(`/${session.user.slug}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchDocument();
    }
  }, [slug, session?.user?.slug, status, router]);

  return (
    <DocumentContext.Provider value={{ document, setDocument, isLoading }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocument must be used within a DocumentProvider");
  }
  return context;
} 