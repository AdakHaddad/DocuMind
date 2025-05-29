"use client";

import { DocumentObject } from "@/src/app/[user]/page";
import React, { useEffect, useRef, useState } from "react";

type AIRoomChatModalProps = {
  sender: "user" | "ai";
  message: string;
};

type ChatPurpose = "general";

interface IAIRoomChatModal {
  initialChats?: AIRoomChatModalProps[];
  onClose?: () => void;
  show?: boolean;
  document: DocumentObject;
  purpose: ChatPurpose;
}

const AIRoomChatModal: React.FC<IAIRoomChatModal> = ({
  initialChats = [],
  onClose = () => {},
  show = false,
  document,
  purpose
}) => {
  const [chats, setChats] = useState<AIRoomChatModalProps[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chats]);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      setChats([
        ...initialChats,
        {
          sender: "ai",
          message: (() => {
            switch (purpose) {
              case "general":
                return `Hi, there! Is there anything I can help related to ${document.title}?`;
                break;
            }
          })()
        }
      ]);
      initializedRef.current = true;
    }
  }, [initialChats, document, purpose]);

  const handleSendMessage = async (message: string) => {
    if (message.trim() === "") return;

    // Add user message to chat
    setChats((prevChats) => [...prevChats, { sender: "user", message }]);

    // Add AI respone telling to wait
    setChats((prevChats) => [
      ...prevChats,
      { sender: "ai", message: "Please wait, processing your request..." }
    ]);

    // Check if conversationId is set and if not, create a new conversation
    if (!conversationId)
      await fetch(`/api/learning/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          documentId: document._id,
          purpose,
          conversationId
        })
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error("Error:", data.error);
            return;
          }

          setConversationId(data.id);

          // Remove the "Please wait" message
          setChats((prevChats) =>
            prevChats.filter(
              (chat) =>
                chat.message !== "Please wait, processing your request..."
            )
          );

          // Add AI response to chat
          setChats((prevChats) => [
            ...prevChats,
            { sender: "ai", message: data.latestResponse }
          ]);
        })
        .catch((error) => {
          console.error("Error:", error);
          setChats((prevChats) => [
            ...prevChats,
            {
              sender: "ai",
              message: "An error occurred while processing your request."
            }
          ]);
        });
    else {
      await fetch(`/api/learning/conversation?id=${conversationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          documentId: document._id,
          purpose,
          conversationId
        })
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error("Error:", data.error);
            return;
          }

          // Remove the "Please wait" message
          setChats((prevChats) =>
            prevChats.filter(
              (chat) =>
                chat.message !== "Please wait, processing your request..."
            )
          );

          // Add AI response to chat
          setChats((prevChats) => [
            ...prevChats,
            { sender: "ai", message: data.latestResponse }
          ]);
        })
        .catch((error) => {
          console.error("Error:", error);
          setChats((prevChats) => [
            ...prevChats,
            {
              sender: "ai",
              message: "An error occurred while processing your request."
            }
          ]);
        });
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div
      className={`flex items-center justify-center w-full h-full bg-black/40 z-[1] fixed top-0 left-0 ${
        show ? "" : "hidden"
      }`}
    >
      <div className="bg-white rounded-lg ring-3 ring-blue-400 w-[60%] h-[75%] flex flex-col justify-between p-4 shadow-xl">
        {/* Header */}
        <div className="text-center pb-2 text-xl font-bold text-documind-primary">
          AI Room Chat
        </div>

        {/* Chat Area */}
        <div className="ring-2 flex flex-col p-3 gap-2 flex-grow overflow-y-auto my-2 space-y-2 rounded-lg">
          {chats.map((chat, index) => (
            <div
              key={index}
              className={`flex ${
                chat.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-2 break-words rounded-md text-justify ${
                  chat.sender === "user"
                    ? "bg-documind-primary text-white font-medium"
                    : "bg-gray-200 text-gray-700 font-medium"
                }`}
              >
                {chat.message}
              </div>
            </div>
          ))}
          {/* Add this div at the end */}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="text"
            placeholder="Make conversation with AI..."
            className="flex-grow h-[100%] px-3 py-1 rounded-md ring-2 ring-gray-300 text-base focus:ring-gray-700"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage(inputMessage);
                setInputMessage("");
              }
            }}
          />
          <button
            className="bg-documind-primary font-medium text-white px-4 py-2 rounded-md text-lg hover:bg-[#3a80d2]"
            onClick={() => {
              handleSendMessage(inputMessage);
              setInputMessage("");
            }}
          >
            Send
          </button>
          <button
            className="bg-documind-secondary font-medium text-white px-4 py-2 rounded-md text-lg hover:bg-orange-500"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIRoomChatModal;
