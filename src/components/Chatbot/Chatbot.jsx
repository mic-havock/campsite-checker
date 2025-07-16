import { useEffect, useRef, useState } from "react";
import { FaComments, FaPaperPlane, FaSpinner, FaTimes } from "react-icons/fa";
import chatbotService from "../../api/chatbot";
import "./chatbot.scss";

/**
 * Chatbot component for providing AI-powered campsite recommendations
 * Features a floating chat interface with real-time messaging
 */
const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        type: "bot",
        content:
          "Hi! I'm your camping assistant. I can help you find the perfect campsite based on your preferences. What kind of camping experience are you looking for?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  /**
   * Generates AI response for campsite recommendations using the chatbot service
   * @param {string} userMessage - The user's input message
   * @returns {Promise<string>} - The AI-generated response
   */
  const generateAIResponse = async (userMessage) => {
    // Use the chatbot service for AI responses
    const aiResult = await chatbotService.generateRecommendation(userMessage);
    // Compose a response string from the result
    let response = aiResult.content;
    if (aiResult.suggestions && aiResult.suggestions.length > 0) {
      response += "\n\nSuggestions:";
      aiResult.suggestions.forEach((s) => {
        response += `\n• ${s}`;
      });
    }
    if (aiResult.campgrounds && aiResult.campgrounds.length > 0) {
      response += "\n\nRecommended Campgrounds:";
      aiResult.campgrounds.forEach((c) => {
        response += `\n• ${c}`;
      });
    }
    if (aiResult.activities && aiResult.activities.length > 0) {
      response += "\n\nSuggested Activities:";
      aiResult.activities.forEach((a) => {
        response += `\n• ${a}`;
      });
    }
    return response;
  };

  /**
   * Handles sending a message to the chatbot
   * @param {Event} e - The form submission event
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(userMessage.content);

      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error generating AI response:", error);

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles keyboard shortcuts
   * @param {KeyboardEvent} e - The keyboard event
   */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="chatbot-container">
      {/* Floating chat button */}
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <FaTimes /> : <FaComments />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Camping Assistant</h3>
            <p>Ask me about campsite recommendations!</p>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.type === "user" ? "user" : "bot"
                }`}
              >
                <div className="message-content">
                  {message.content.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
                <div className="message-timestamp">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <FaSpinner className="spinner" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-form" onSubmit={handleSendMessage}>
            <div className="input-container">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about campsite recommendations..."
                disabled={isLoading}
                rows={1}
                className="chatbot-input"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="send-button"
                aria-label="Send message"
              >
                <FaPaperPlane />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
