export type Message = {
  role: string;
  content: string;
};

export type Messages = Message[];

export async function deepseekAsk(messages: Messages) {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.DEEPSEEK_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          messages
        })
      }
    );

    // Check if the response is ok (status in the range 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json(); // Parse the JSON data

    // Access and log the message content
    const messageContent = data.choices[0].message;

    // Return the message content
    return messageContent;
  } catch (error) {
    console.error("Error:", error); // Handle errors
  }
}
