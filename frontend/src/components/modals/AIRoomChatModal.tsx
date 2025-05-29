"use client";

import React, { useEffect, useMemo, useState } from "react";

type AIRoomChatModalProps = {
  sender: "user" | "ai";
  message: string;
};

interface IAIRoomChatModal {
  initialChats?: AIRoomChatModalProps[];
  onClose?: () => void;
  show?: boolean;
}

const AIRoomChatModal: React.FC<IAIRoomChatModal> = ({
  initialChats = [],
  onClose = () => {},
  show = false
}) => {
  const randomDummyResponsesArray = useMemo(
    () => [
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      "It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
      "It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.",
      "Contrary to popular belief, Lorem Ipsum is not simply random text.",
      "The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested.",
      "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form.",
      "If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
      "All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary.",
      "Making this the first true generator on the Internet.",
      "It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable."
    ],
    []
  );

  const [chats, setChats] = useState<AIRoomChatModalProps[]>([]);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    setChats([
      ...initialChats,
      {
        sender: "ai",
        message:
          randomDummyResponsesArray[
            Math.floor(Math.random() * randomDummyResponsesArray.length)
          ]
      }
    ]);
  }, [initialChats, randomDummyResponsesArray]);

  const handleSendMessage = (message: string) => {
    if (message.trim() === "") return;

    setChats((prevChats) => [
      ...prevChats,
      { sender: "user", message },
      {
        sender: "ai",
        message:
          randomDummyResponsesArray[
            Math.floor(Math.random() * randomDummyResponsesArray.length)
          ]
      }
    ]);
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
      <div className="bg-white rounded-lg border-2 border-blue-400 w-[50%] h-[75%] flex flex-col justify-between p-4 shadow-xl">
        {/* Header */}
        <div className="text-center font-semibold text-blue-700">
          AI Room Chat
        </div>

        {/* Chat Area */}
        <div className="flex flex-col gap-2 flex-grow overflow-y-auto my-2">
          {chats.map((chat, index) => (
            <div
              key={index}
              className={`flex ${
                chat.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-2 rounded-md text-sm ${
                  chat.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {chat.message}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="flex items-center gap-2 border-t pt-2">
          <input
            type="text"
            placeholder="Make the conversation with AI..."
            className="flex-grow px-3 py-1 rounded-md border border-gray-300 text-sm focus:outline-none"
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
            className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
            onClick={() => {
              handleSendMessage(inputMessage);
              setInputMessage("");
            }}
          >
            Send
          </button>
          <button
            className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
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
