import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { deepseekAsk, Messages } from "@/src/app/api/deepseekLogic";

interface ConversationRequest {
  documentId: ObjectId; // Change this to string to match incoming request
  message: string;
}

interface Conversation {
  documentId: ObjectId;
  messages: Messages;
  createdAt?: Date;
  updatedAt?: Date;
}

// POST for creating conversation with the given document id
export async function POST(req: NextRequest) {
  const { documentId, message }: ConversationRequest = await req.json();

  // Validate required fields
  if (!documentId || !message) {
    return NextResponse.json(
      { error: "Missing required fields: documentId and messages" },
      { status: 400 }
    );
  }

  // Get document from documentId
  let document;
  try {
    const db = await connectToDatabase();
    const documentsCollection = db.collection("documents");
    const objectId = new ObjectId(documentId); // Convert string to ObjectId
    document = await documentsCollection.findOne({ _id: objectId });
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }

  // Get document content
  const documentContent = document.content || "";
  if (!documentContent) {
    return NextResponse.json(
      { error: "Document content is empty" },
      { status: 400 }
    );
  }

  // Create messages array with the initial user message
  const messages: Messages = [
    {
      role: "user",
      content: `Here is the document content:\n\n${documentContent}`
    },
    {
      role: "user",
      content: message
    }
  ];

  // Try to ask for deepseek's response
  let response;
  try {
    response = await deepseekAsk(messages);
    if (!response || !response.content) {
      return NextResponse.json(
        { error: "Deepseek response is invalid or missing content" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error calling Deepseek:", error);
    return NextResponse.json(
      { error: "Failed to get response from Deepseek" },
      { status: 500 }
    );
  }

  // Add the Deepseek response to the messages
  messages.push({
    role: "assistant",
    content: response.content
  });

  try {
    const db = await connectToDatabase();
    const conversationsCollection =
      db.collection<Conversation>("conversations");

    // Convert documentId to ObjectId
    const objectId = new ObjectId(documentId); // Convert string to ObjectId

    // Create new conversation object
    const newConversation: Conversation = {
      documentId: objectId, // Store as ObjectId in the database
      messages,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the new conversation into the database
    const result = await conversationsCollection.insertOne(newConversation);

    // Respond with success
    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        documentId: newConversation.documentId.toString(), // Convert ObjectId to string for the response
        messages: newConversation.messages,
        latestResponse: response.content,
        createdAt: newConversation.createdAt,
        updatedAt: newConversation.updatedAt
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET all or by conversation id if provided
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("id");
  const db = await connectToDatabase();
  const conversationsCollection = db.collection<Conversation>("conversations");
  try {
    if (conversationId) {
      // Fetch a specific conversation by id
      const conversation = await conversationsCollection.findOne({
        _id: new ObjectId(conversationId)
      });
      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          id: conversation._id.toString(),
          documentId: conversation.documentId.toString(),
          messages: conversation.messages,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        },
        { status: 200 }
      );
    } else {
      // Fetch all conversations
      const conversations = await conversationsCollection.find({}).toArray();
      const formattedConversations = conversations.map((conv) => ({
        id: conv._id.toString(),
        documentId: conv.documentId.toString(),
        messages: conv.messages, // Assuming messages is already in the correct format
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      }));
      return NextResponse.json(formattedConversations, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Define the request body structure for continuing a conversation
interface ContinueConversationRequest {
  conversationId: string;
  message: string;
}

// PATCH for continuing conversation with the given conversation id
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("id");

  const { message }: ContinueConversationRequest = await req.json();

  // Validate required fields
  if (!conversationId || !message) {
    return NextResponse.json(
      { error: "Missing required fields: conversationId and message" },
      { status: 400 }
    );
  }

  try {
    const db = await connectToDatabase();
    const conversationsCollection =
      db.collection<Conversation>("conversations");

    // Find the existing conversation
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId)
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Add the new user message to the existing messages
    const updatedMessages = [
      ...conversation.messages,
      { role: "user", content: message }
    ];

    // Call Deepseek with the updated messages
    const response = await deepseekAsk(updatedMessages);
    if (!response || !response.content) {
      return NextResponse.json(
        { error: "Deepseek response is invalid or missing content" },
        { status: 500 }
      );
    }

    // Add the Deepseek response to the messages
    updatedMessages.push({ role: "assistant", content: response.content });

    // Update the conversation in the database
    const result = await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          messages: updatedMessages,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update conversation" },
        { status: 500 }
      );
    }

    // Respond with the updated conversation
    return NextResponse.json(
      {
        id: conversationId,
        documentId: conversation.documentId.toString(),
        messages: updatedMessages,
        latestResponse: response.content,
        createdAt: conversation.createdAt,
        updatedAt: new Date()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE for deleting conversation by id
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("id");

  // Validate required fields
  if (!conversationId) {
    return NextResponse.json(
      { error: "Missing required field: conversationId" },
      { status: 400 }
    );
  }

  try {
    const db = await connectToDatabase();
    const conversationsCollection =
      db.collection<Conversation>("conversations");

    // Delete the conversation by id
    const result = await conversationsCollection.deleteOne({
      _id: new ObjectId(conversationId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Conversation not found or already deleted" },
        { status: 404 }
      );
    }

    // Respond with success
    return NextResponse.json(
      { message: "Conversation deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
