/**
 * Response templates for the Inca London WhatsApp bot
 * All responses are in English as per the bot requirements
 */

import { INCA_INFO } from './config';

export const RESPONSES = {
  // Welcome message for first-time users
  welcome: `Hello and welcome to Inca London — where Latin spirit meets London nights.

I'm your virtual host! I can help you with table bookings, menus, events or any questions about our dining show.

How can I assist you tonight?`,

  // Reservation-related responses
  reservations: {
    howToBook: `To book your table at Inca London, please visit:
${INCA_INFO.contact.bookingUrl}

You can also call us at ${INCA_INFO.contact.phone} or email ${INCA_INFO.contact.emails.reservations}

How many guests will be joining you and what date are you looking at?`,

    largeGroup: `For groups of 9 or more guests, we require a set menu.
Our team will discuss the minimum spend for your date and section.

Please visit ${INCA_INFO.contact.bookingUrl} or contact us at ${INCA_INFO.contact.emails.reservations}`,

    policies: `Here are our booking policies:

• Booking duration: ${INCA_INFO.policies.bookingDuration}
• Grace period: ${INCA_INFO.policies.gracePeriod}
• Service charge: ${INCA_INFO.policies.serviceCharge}
• Minimum spend varies by day and section (confirmed at booking)

For groups of 9+, a set menu is required and pre-payment may be requested.`,

    cancellation: `For cancellations or modifications, please contact our reservations team:

Email: ${INCA_INFO.contact.emails.reservations}
Phone: ${INCA_INFO.contact.phone}

Please note: late cancellations or no-shows may incur a fee.`,
  },

  // Menu and culinary information
  menu: {
    overview: `Our menu features ${INCA_INFO.dining.cuisineType}, crafted by Chef ${INCA_INFO.dining.chef}.

🍽️ Signature dishes include:
• Wagyu Tacos
• Seabass Ceviche
• Tea-Smoked Lamb Chops
• Truffle Fries

🍰 Desserts:
• Passion fruit cheesecake
• Chocolate fondant
• Tropical pavlova

We also offer vegetarian and gluten-free options upon request.

📋 Would you like to see our menus? We have:
• A La Carte Menu
• Wagyu Platter Menu
• Drinks Menu
• Wine Menu`,

    drinks: `Our signature cocktails include:

🍹 Pisco Sour (Peruvian classic)
🍸 Inca Gold
🌺 Amazonia Spritz

We have an extensive selection of Latin American-inspired cocktails, premium spirits, and fine wines.

📋 Would you like to see our drinks menu or wine list?`,

    dietary: `We're happy to accommodate dietary requirements!

We offer:
✓ Vegetarian options
✓ Gluten-free options
✓ Custom preparations for allergies

Please inform our team in advance when booking, and we'll do our best to create a wonderful experience for you.`,

    sendMenus: `Here are our menus:

📋 A La Carte Menu - Full dining menu
🥩 Wagyu Platter Menu - Premium wagyu selections
🍹 Drinks Menu - Cocktails and beverages
🍷 Wine Menu - Curated wine selection

I'll send them to you now!`,

    alacarte: `Perfect! I'll send you our A La Carte menu featuring Chef ${INCA_INFO.dining.chef}'s signature dishes.`,

    wagyu: `Excellent choice! I'll send you our Wagyu Platter menu with our premium selections.`,

    wineMenu: `Great! I'll send you our Wine Menu with our carefully curated wine selection.`,

    drinksMenu: `Perfect! I'll send you our Drinks Menu featuring our signature cocktails and beverages.`,
  },

  // Entertainment and experience
  experience: {
    show: `Inca London offers an immersive dining show inspired by Latin America.

🎭 Experience:
• Live performances during dinner
• World-class dancers and singers
• Multiple acts throughout the evening
• Show starts ${INCA_INFO.dining.showStartTime}

After dinner, the space transforms into a lively club atmosphere with DJs and cocktails. It's a complete sensory journey!

Photography is allowed without flash.`,

    spaces: `We have several stunning spaces:

🍽️ Main Dining Room (with stage view)
🥂 Private Dining Room (up to ${INCA_INFO.privateEvents.privateDiningRoom} guests)
🍸 Bar & Lounge area
💃 Luna Club (late-night party zone)

Each space offers its own unique atmosphere while maintaining the luxurious Inca London experience.`,

    club: `After dinner, the night continues at Luna Lounge!

💃 Features:
• Live DJs and performances
• Premium cocktails
• Vibrant Latin atmosphere
• Dancing until late

Table booking or guestlist entry required.

Would you like information about booking a club table?`,
  },

  // Dress code and entry
  entry: {
    dressCode: `Our dress code is Smart Elegant.

✓ Allowed: Smart casual to formal attire
✗ Not allowed: Sportswear, shorts, caps, or sneakers

We want everyone to feel part of the sophisticated Inca London experience!

The venue is ${INCA_INFO.policies.ageRestriction}.`,

    agePolicy: `Inca London is strictly ${INCA_INFO.policies.ageRestriction}.

Valid ID will be required at the door. We appreciate your understanding in maintaining the elegant atmosphere of our venue.`,
  },

  // Location and access
  location: {
    address: `We're located in the heart of Soho:

📍 ${INCA_INFO.contact.address}

🚇 Nearest tube: ${INCA_INFO.transport.nearestTube}
🚗 ${INCA_INFO.transport.parking}

We also have a cloakroom service available (mandatory on weekends).`,

    directions: `Finding us is easy:

📍 Address: ${INCA_INFO.contact.address}
🚇 Take the tube to ${INCA_INFO.transport.nearestTube}

We're right in the heart of Soho, surrounded by the vibrant energy of London's West End.

See you soon!`,
  },

  // Operating hours
  hours: {
    schedule: `Our opening hours:

Wednesday: ${INCA_INFO.hours.wednesday}
Thursday: ${INCA_INFO.hours.thursday}
Friday: ${INCA_INFO.hours.friday}
Saturday: ${INCA_INFO.hours.saturday}
Sunday: ${INCA_INFO.hours.sunday}

Closed: Monday & Tuesday

The show starts ${INCA_INFO.dining.showStartTime}.`,

    closed: `We're currently closed on Mondays and Tuesdays.

We're open:
• Wed, Thu, Sun: 8 PM – Late
• Fri, Sat: 7 PM – Late

You can book your table now at ${INCA_INFO.contact.bookingUrl}`,
  },

  // Private events
  privateEvents: {
    overview: `We host unforgettable private events!

🎉 Perfect for:
• Corporate events
• Birthday celebrations
• Product launches
• Fashion shows
• After-parties

📊 Capacity:
• Up to ${INCA_INFO.privateEvents.maxGuests} guests total
• ${INCA_INFO.privateEvents.maxSeated} seated

We offer custom menus, live entertainment, and themed experiences.

For inquiries: ${INCA_INFO.contact.emails.privateEvents}`,

    contact: `For private events and corporate bookings:

📧 Email: ${INCA_INFO.contact.emails.privateEvents}
📞 Phone: ${INCA_INFO.contact.phone}

Our events team will work with you to create a truly memorable experience tailored to your vision.`,
  },

  // Payment and services
  payment: {
    methods: `We accept:

💳 Visa, Mastercard, Amex
💵 Cash

• ${INCA_INFO.policies.serviceCharge}
• Split bills available within reason
• Cloakroom service available (mandatory on weekends)
• Wi-Fi available upon request`,
  },

  // Contact information
  contact: {
    details: `📞 Phone: ${INCA_INFO.contact.phone}

📧 Emails:
• Reservations: ${INCA_INFO.contact.emails.reservations}
• Private Events: ${INCA_INFO.contact.emails.privateEvents}
• Media & Press: ${INCA_INFO.contact.emails.mediaPress}

🌐 Website: ${INCA_INFO.contact.website}
📸 Instagram: ${INCA_INFO.contact.instagram}`,

    social: `Follow us for the latest updates and exclusive content:

📸 Instagram: ${INCA_INFO.contact.instagram}
${INCA_INFO.contact.instagramUrl}

🌐 Website: ${INCA_INFO.contact.website}

Experience the Latin spirit of London!`,
  },

  // Special requests and edge cases
  special: {
    lostItems: `For lost items, please contact our reception team:

📧 ${INCA_INFO.contact.emails.reservations}
📞 ${INCA_INFO.contact.phone}

We'll do our best to help locate your belongings.`,

    complaints: `We truly value your feedback.

For complaints, refunds, or management inquiries:

📧 ${INCA_INFO.contact.emails.reservations}
📞 ${INCA_INFO.contact.phone}

Our team will address your concerns promptly and professionally.`,

    mediaPress: `For media inquiries, press requests, or collaborations:

📧 ${INCA_INFO.contact.emails.mediaPress}

We'd love to share the Inca London story with you!`,
  },

  // Generic helpful responses
  generic: {
    notUnderstood: `I'm not quite sure I understand. I can help you with:

• Table reservations
• Menu information
• Opening hours
• Dress code
• Private events
• Location and directions

What would you like to know?`,

    thankYou: `Thank you for choosing Inca London.

We can't wait to welcome you to an unforgettable night filled with taste, rhythm and passion. 💃

See you soon!`,

    goodbye: `Thank you for contacting Inca London! We look forward to welcoming you soon.

For reservations: ${INCA_INFO.contact.bookingUrl}

Have a wonderful day! ✨`,
  },
};
