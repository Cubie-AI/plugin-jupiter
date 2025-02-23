export function generateTelegramResponse(response: string): string {
  return `
    Generate a response template for the users request by extracting out the important text from the response and an optional image link. Your response should be a JSON object with 2 fields, text and image.
    The response should be related to the original message you received from the user. 

    Do NOT include any metadata, context information, or explanation of how the response was generated.
    If the response contains an image, you should include the image link in the response.
    If the response contains a reference to the image you should strip that out of the text.
    All other text should be included in the text field.

    Here is the data you received from the user:
    ${JSON.stringify(response, null, 2)}

    Return a JSON object with 2 fields, text and image.
    
    Example of valid response:
    {
       "text": "Bears are mammals of the family Ursidae. They are classified as caniforms, or doglike carnivorans.",
        "image": "https://example.com/image.jpg"
    }
    `;
}
