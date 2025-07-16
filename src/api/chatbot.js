/**
 * Chatbot API service for handling AI-powered campsite recommendations
 * Provides intelligent responses based on user preferences and camping needs
 */
class ChatbotService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "https://api.kampscout.com";
    this.apiKey = import.meta.env.VITE_AI_API_KEY;
  }

  /**
   * Generates AI response for campsite recommendations
   * @param {string} userMessage - The user's input message
   * @param {Object} context - Additional context about the user's preferences
   * @returns {Promise<Object>} - The AI response with recommendations
   */
  async generateRecommendation(userMessage, context = {}) {
    try {
      // For now, we'll use a local AI response system
      // In the future, this can be connected to OpenAI, Claude, or other AI services
      const response = await this.processLocalAI(userMessage, context);
      return response;
    } catch (error) {
      console.error("Error generating AI recommendation:", error);
      throw new Error("Failed to generate recommendation");
    }
  }

  /**
   * Processes user message using local AI logic
   * @param {string} userMessage - The user's input message
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} - The processed response
   */
  async processLocalAI(userMessage, context) {
    // Simulate AI processing time
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );

    const lowerMessage = userMessage.toLowerCase();
    const recommendations = this.getRecommendations(lowerMessage, context);

    // Use context for future enhancements
    if (context.location) {
      console.log("Location context:", context.location);
    }

    return {
      content: recommendations.content,
      suggestions: recommendations.suggestions,
      campgrounds: recommendations.campgrounds,
      activities: recommendations.activities,
    };
  }

  /**
   * Gets camping recommendations based on user input
   * @param {string} message - Lowercase user message
   * @param {Object} context - User context
   * @returns {Object} - Recommendations object
   */
  getRecommendations(message, context) {
    // Family camping
    if (
      message.includes("family") ||
      message.includes("kids") ||
      message.includes("children")
    ) {
      return {
        content:
          "Great choice! For family camping, I recommend looking for campgrounds with amenities that make camping with kids enjoyable and safe. Here are some key features to consider:\n\n• Playgrounds and recreational areas\n• Swimming beaches or pools\n• Easy hiking trails suitable for children\n• Family-friendly activities and programs\n• Clean restroom facilities\n• Camp stores for essentials\n\nPopular family-friendly options include state parks, national park campgrounds, and private campgrounds with family areas.",
        suggestions: [
          "Look for campgrounds with designated family areas",
          "Choose sites near water for swimming and fishing",
          "Consider campgrounds with ranger programs",
          "Check for nearby attractions and activities",
        ],
        campgrounds: [
          "State Parks",
          "National Park Campgrounds",
          "Private Family Campgrounds",
        ],
        activities: [
          "Swimming",
          "Fishing",
          "Hiking",
          "Ranger Programs",
          "Campfire Programs",
        ],
      };
    }

    // Backpacking and wilderness
    if (
      message.includes("backpack") ||
      message.includes("hiking") ||
      message.includes("wilderness") ||
      message.includes("primitive")
    ) {
      return {
        content:
          "Perfect for adventure seekers! For backpacking and wilderness camping, you'll want to focus on areas that offer true outdoor experiences:\n\n• National Forest dispersed camping areas\n• Backcountry sites in National Parks\n• Primitive campgrounds with hiking access\n• Areas with established trails nearby\n• Wilderness areas with permits\n\nThese areas often require more preparation but offer incredible solitude and natural beauty.",
        suggestions: [
          "Check permit requirements for wilderness areas",
          "Research trail conditions and difficulty",
          "Plan for water sources and food storage",
          "Consider seasonal access and weather",
        ],
        campgrounds: [
          "National Forests",
          "Wilderness Areas",
          "Backcountry Sites",
          "Primitive Campgrounds",
        ],
        activities: [
          "Backpacking",
          "Hiking",
          "Wildlife Viewing",
          "Photography",
          "Primitive Camping",
        ],
      };
    }

    // Water activities
    if (
      message.includes("fishing") ||
      message.includes("lake") ||
      message.includes("river") ||
      message.includes("water")
    ) {
      return {
        content:
          "Excellent! For fishing and water activities, look for campgrounds that provide easy access to aquatic adventures:\n\n• Campgrounds near lakes, rivers, or streams\n• Sites with boat ramps or fishing docks\n• Areas with good fish populations\n• Campgrounds with water access permits\n• Sites with kayak/canoe launch areas\n\nMany state and national parks have excellent fishing opportunities with camping nearby.",
        suggestions: [
          "Check fishing regulations and licenses",
          "Look for campgrounds with boat rentals",
          "Consider seasonal fish migrations",
          "Research water quality and access",
        ],
        campgrounds: [
          "Lake Campgrounds",
          "River Campgrounds",
          "State Parks",
          "National Recreation Areas",
        ],
        activities: [
          "Fishing",
          "Boating",
          "Swimming",
          "Kayaking",
          "Canoeing",
          "Water Skiing",
        ],
      };
    }

    // Quiet and peaceful
    if (
      message.includes("quiet") ||
      message.includes("peaceful") ||
      message.includes("solitude") ||
      message.includes("tranquil")
    ) {
      return {
        content:
          "For a peaceful, quiet camping experience, I suggest areas that offer maximum solitude and natural tranquility:\n\n• Primitive campgrounds away from main roads\n• Dispersed camping in National Forests\n• Smaller, less popular state parks\n• Mid-week camping to avoid crowds\n• Off-season camping for maximum solitude\n• Campgrounds with larger, more private sites\n\nThese options often provide the most peaceful camping experiences.",
        suggestions: [
          "Choose mid-week camping dates",
          "Look for campgrounds with larger sites",
          "Consider off-season camping",
          "Research campground noise policies",
        ],
        campgrounds: [
          "Primitive Campgrounds",
          "National Forests",
          "Less Popular State Parks",
          "Dispersed Camping Areas",
        ],
        activities: [
          "Nature Observation",
          "Photography",
          "Meditation",
          "Stargazing",
          "Wildlife Viewing",
        ],
      };
    }

    // RV camping
    if (
      message.includes("rv") ||
      message.includes("camper") ||
      message.includes("trailer") ||
      message.includes("motorhome")
    ) {
      return {
        content:
          "RV camping is a great choice! Look for campgrounds that cater to RV travelers with these essential amenities:\n\n• Full hookups (water, electric, sewer)\n• Pull-through sites for easy parking\n• Dump stations for waste disposal\n• Level sites for stability\n• WiFi and cable TV options\n• Adequate space for slide-outs\n• Easy access roads for larger vehicles",
        suggestions: [
          "Check site length restrictions",
          "Verify hookup types available",
          "Look for campgrounds with laundry facilities",
          "Consider proximity to attractions",
        ],
        campgrounds: [
          "RV Parks",
          "Private Campgrounds",
          "State Parks with RV Sites",
          "National Park RV Areas",
        ],
        activities: [
          "RV Travel",
          "Sightseeing",
          "Comfortable Camping",
          "Extended Stays",
        ],
      };
    }

    // Pet-friendly camping
    if (
      message.includes("dog") ||
      message.includes("pet") ||
      message.includes("furry")
    ) {
      return {
        content:
          "Pet-friendly camping is available! Look for campgrounds that welcome your four-legged companions:\n\n• Allow dogs on leashes in campgrounds\n• Have pet-friendly trails nearby\n• Provide dog waste stations\n• Allow pets in cabins or yurts\n• Have nearby dog parks or beaches\n• Offer pet-friendly amenities\n\nRemember to bring your pet's vaccination records and check specific pet policies.",
        suggestions: [
          "Bring pet vaccination records",
          "Check leash requirements",
          "Look for pet-friendly trails",
          "Pack pet waste disposal bags",
        ],
        campgrounds: [
          "Pet-Friendly State Parks",
          "Private Pet-Friendly Campgrounds",
          "National Forest Campgrounds",
        ],
        activities: [
          "Pet-Friendly Hiking",
          "Dog Swimming Areas",
          "Pet-Friendly Trails",
          "Companion Animal Activities",
        ],
      };
    }

    // Winter camping
    if (
      message.includes("winter") ||
      message.includes("cold") ||
      message.includes("snow") ||
      message.includes("ice")
    ) {
      return {
        content:
          "Winter camping can be magical! Consider these options for cold-weather camping:\n\n• Campgrounds with heated facilities\n• Sites with winter access roads\n• Areas with winter activities (skiing, snowshoeing)\n• Campgrounds that stay open year-round\n• Cabins or yurts for warmth\n• Areas with winter sports opportunities\n\nWinter camping requires special preparation but offers unique experiences.",
        suggestions: [
          "Check winter road access",
          "Research heating options",
          "Plan for cold weather gear",
          "Consider cabin or yurt rentals",
        ],
        campgrounds: [
          "Year-Round Campgrounds",
          "Winter Cabins",
          "Yurt Campgrounds",
          "Ski Area Campgrounds",
        ],
        activities: [
          "Snowshoeing",
          "Cross-Country Skiing",
          "Winter Hiking",
          "Ice Fishing",
          "Snow Sports",
        ],
      };
    }

    // Budget camping
    if (
      message.includes("budget") ||
      message.includes("cheap") ||
      message.includes("affordable") ||
      message.includes("economy")
    ) {
      return {
        content:
          "Budget-friendly camping options are available! Here are some cost-effective camping choices:\n\n• National Forest dispersed camping (often free)\n• State parks with reasonable rates\n• BLM land for primitive camping\n• Mid-week discounts at many campgrounds\n• Annual passes for frequent campers\n• Group camping areas for cost sharing\n• Off-season camping discounts",
        suggestions: [
          "Look for free dispersed camping",
          "Consider annual passes for savings",
          "Choose mid-week camping dates",
          "Research group camping options",
        ],
        campgrounds: [
          "National Forests",
          "BLM Land",
          "State Parks",
          "Dispersed Camping Areas",
        ],
        activities: [
          "Primitive Camping",
          "Hiking",
          "Nature Observation",
          "Budget Travel",
        ],
      };
    }

    // Accessible camping
    if (
      message.includes("accessible") ||
      message.includes("disability") ||
      message.includes("wheelchair") ||
      message.includes("ada")
    ) {
      return {
        content:
          "Accessible camping is important! Look for campgrounds that provide inclusive camping experiences:\n\n• ADA-compliant campsites with paved surfaces\n• Accessible restrooms and showers\n• Paved paths and ramps throughout\n• Accessible fishing piers and docks\n• Sites near accessible trails\n• Campgrounds with accessible facilities\n\nMany state and national parks have specific accessible camping options.",
        suggestions: [
          "Call ahead to verify accessibility",
          "Check for accessible transportation",
          "Research nearby accessible attractions",
          "Plan for accessible equipment needs",
        ],
        campgrounds: [
          "ADA-Compliant State Parks",
          "Accessible National Parks",
          "Private Accessible Campgrounds",
        ],
        activities: [
          "Accessible Hiking",
          "Adaptive Fishing",
          "Nature Observation",
          "Accessible Recreation",
        ],
      };
    }

    // Default response
    return {
      content:
        "I'd love to help you find the perfect campsite! To give you better recommendations, could you tell me:\n\n• What type of camping experience you're looking for?\n• Your preferred location or region?\n• What activities you enjoy (hiking, fishing, swimming, etc.)?\n• Whether you prefer primitive camping or full amenities?\n• What time of year you're planning to camp?\n\nThis will help me suggest the best options for your needs!",
      suggestions: [
        "Consider your camping experience level",
        "Think about your preferred activities",
        "Plan for the right time of year",
        "Research your destination area",
      ],
      campgrounds: ["Various Options Available"],
      activities: ["Multiple Activities Available"],
    };
  }

  /**
   * Gets campground suggestions based on location
   * @param {string} location - The desired location
   * @returns {Promise<Array>} - Array of campground suggestions
   */
  async getCampgroundSuggestions(location) {
    // This would integrate with your existing campground data
    // For now, return mock data
    return [
      {
        name: "Sample Campground",
        location: location,
        type: "State Park",
        amenities: ["Hiking", "Fishing", "Swimming"],
        availability: "Check website",
      },
    ];
  }

  /**
   * Gets activity suggestions based on preferences
   * @param {Array} preferences - User preferences
   * @returns {Promise<Array>} - Array of activity suggestions
   */
  async getActivitySuggestions(preferences) {
    // This would integrate with your existing activity data
    // Use preferences for future enhancements
    if (preferences && preferences.length > 0) {
      console.log("User preferences:", preferences);
    }
    return ["Hiking", "Fishing", "Swimming", "Wildlife Viewing", "Photography"];
  }
}

export default new ChatbotService();
