import { Messages } from "@/src/app/api/deepseekLogic";

interface DeepSeekConversationRequest {
  documentId: string;
  messages: Messages;
}

export async function createDeepSeekConversation({
  documentId,
  messages
}: DeepSeekConversationRequest) {
  if (!documentId || !messages) {
    throw new Error("Missing required fields: documentId and messages");
  }
}
