/**
 * Custom tools for the Mastra agent
 * These tools provide the agent with specific capabilities for the Inca London context
 */

import { createTool } from '@mastra/core';
import { z } from 'zod';
import { INCA_INFO } from '../config.js';

/**
 * Tool to get restaurant opening hours
 */
export const getOpeningHoursTool = createTool({
  id: 'get_opening_hours',
  description: 'Get the opening hours of Inca London restaurant for a specific day or the full schedule',
  inputSchema: z.object({
    day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'all'])
      .optional()
      .describe('The day to get hours for, or "all" for full schedule'),
  }),
  outputSchema: z.object({
    schedule: z.string(),
    closed: z.array(z.string()).optional(),
  }),
  execute: async ({ context }) => {
    const day = context.day?.toLowerCase() || 'all';

    if (day === 'all') {
      return {
        schedule: `Wednesday: ${INCA_INFO.hours.wednesday}\nThursday: ${INCA_INFO.hours.thursday}\nFriday: ${INCA_INFO.hours.friday}\nSaturday: ${INCA_INFO.hours.saturday}\nSunday: ${INCA_INFO.hours.sunday}`,
        closed: INCA_INFO.hours.closed,
      };
    }

    const dayHours = INCA_INFO.hours[day as keyof typeof INCA_INFO.hours];

    if (Array.isArray(dayHours)) {
      return {
        schedule: `Closed on ${day.charAt(0).toUpperCase() + day.slice(1)}`,
        closed: INCA_INFO.hours.closed,
      };
    }

    return {
      schedule: `${day.charAt(0).toUpperCase() + day.slice(1)}: ${dayHours}`,
    };
  },
});

/**
 * Tool to get contact information
 */
export const getContactInfoTool = createTool({
  id: 'get_contact_info',
  description: 'Get contact information for Inca London (phone, email, social media)',
  inputSchema: z.object({
    type: z.enum(['all', 'phone', 'email', 'address', 'social', 'booking'])
      .optional()
      .describe('Type of contact information to retrieve'),
  }),
  outputSchema: z.object({
    info: z.string(),
  }),
  execute: async ({ context }) => {
    const type = context.type || 'all';

    switch (type) {
      case 'phone':
        return { info: INCA_INFO.contact.phone };
      case 'email':
        return {
          info: `Reservations: ${INCA_INFO.contact.emails.reservations}\nPrivate Events: ${INCA_INFO.contact.emails.privateEvents}\nMedia: ${INCA_INFO.contact.emails.mediaPress}`
        };
      case 'address':
        return { info: INCA_INFO.contact.address };
      case 'social':
        return {
          info: `Instagram: ${INCA_INFO.contact.instagram}\nWebsite: ${INCA_INFO.contact.website}`
        };
      case 'booking':
        return { info: INCA_INFO.contact.bookingUrl };
      default:
        return {
          info: `Address: ${INCA_INFO.contact.address}\nPhone: ${INCA_INFO.contact.phone}\nEmail: ${INCA_INFO.contact.emails.reservations}\nWebsite: ${INCA_INFO.contact.website}\nBooking: ${INCA_INFO.contact.bookingUrl}`,
        };
    }
  },
});

/**
 * Tool to check dress code and entry policies
 */
export const getDressCodeTool = createTool({
  id: 'get_dress_code',
  description: 'Get information about dress code and entry policies (age restriction, attire requirements)',
  inputSchema: z.object({}),
  outputSchema: z.object({
    dressCode: z.string(),
    ageRestriction: z.string(),
    additionalPolicies: z.array(z.string()),
  }),
  execute: async () => {
    return {
      dressCode: INCA_INFO.policies.dressCode,
      ageRestriction: INCA_INFO.policies.ageRestriction,
      additionalPolicies: [
        `Grace period: ${INCA_INFO.policies.gracePeriod}`,
        `Booking duration: ${INCA_INFO.policies.bookingDuration}`,
        `Service charge: ${INCA_INFO.policies.serviceCharge}`,
      ],
    };
  },
});

/**
 * Tool to get reservation information
 */
export const getReservationInfoTool = createTool({
  id: 'get_reservation_info',
  description: 'Get information about table reservations, group bookings, and booking policies',
  inputSchema: z.object({
    guestCount: z.number().optional().describe('Number of guests for the reservation'),
  }),
  outputSchema: z.object({
    bookingUrl: z.string(),
    requiresSetMenu: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const guestCount = context.guestCount;

    if (guestCount && guestCount >= INCA_INFO.dining.setMenuMin) {
      return {
        bookingUrl: INCA_INFO.contact.bookingUrl,
        requiresSetMenu: true,
        message: `For groups of ${INCA_INFO.dining.setMenuMin} or more, a set menu is required. Our team will discuss minimum spend requirements when you book.`,
      };
    }

    return {
      bookingUrl: INCA_INFO.contact.bookingUrl,
      requiresSetMenu: false,
      message: `You can book your table online at ${INCA_INFO.contact.bookingUrl} or call us at ${INCA_INFO.contact.phone}`,
    };
  },
});

/**
 * Tool to get location and transport information
 */
export const getLocationInfoTool = createTool({
  id: 'get_location_info',
  description: 'Get location information including address, nearest tube station, and parking',
  inputSchema: z.object({}),
  outputSchema: z.object({
    address: z.string(),
    nearestTube: z.string(),
    parking: z.string(),
  }),
  execute: async () => {
    return {
      address: INCA_INFO.contact.address,
      nearestTube: INCA_INFO.transport.nearestTube,
      parking: INCA_INFO.transport.parking,
    };
  },
});

/**
 * Tool to get private events information
 */
export const getPrivateEventsInfoTool = createTool({
  id: 'get_private_events_info',
  description: 'Get information about private events, corporate bookings, and venue hire',
  inputSchema: z.object({}),
  outputSchema: z.object({
    maxGuests: z.number(),
    maxSeated: z.number(),
    privateDiningRoom: z.number(),
    contactEmail: z.string(),
    contactPhone: z.string(),
  }),
  execute: async () => {
    return {
      maxGuests: INCA_INFO.privateEvents.maxGuests,
      maxSeated: INCA_INFO.privateEvents.maxSeated,
      privateDiningRoom: INCA_INFO.privateEvents.privateDiningRoom,
      contactEmail: INCA_INFO.contact.emails.privateEvents,
      contactPhone: INCA_INFO.contact.phonePrivateEvents,
    };
  },
});

/**
 * Tool to get menu information and PDF links
 */
export const getMenuTool = createTool({
  id: 'get_menu',
  description: 'Get menu information and PDF download links for different menu types. Use this when someone asks for a menu.',
  inputSchema: z.object({
    menuType: z.enum(['a_la_carte', 'wagyu', 'wine', 'drinks', 'all'])
      .optional()
      .describe('Type of menu requested - default is a_la_carte'),
  }),
  outputSchema: z.object({
    menuType: z.string(),
    name: z.string(),
    url: z.string().optional(),
    allMenus: z.array(z.object({
      name: z.string(),
      type: z.string(),
      url: z.string(),
    })).optional(),
    sendAsDocument: z.boolean(),
  }),
  execute: async ({ context }) => {
    const menuType = context.menuType || 'a_la_carte';

    // Use the hosted URLs from the Inca London website
    const menus = {
      a_la_carte: {
        name: 'A La Carte Menu',
        type: 'a_la_carte',
        url: INCA_INFO.menus.alacarte.url,
      },
      wagyu: {
        name: 'Wagyu Platter Menu',
        type: 'wagyu',
        url: INCA_INFO.menus.wagyu.url,
      },
      wine: {
        name: 'Wine Menu',
        type: 'wine',
        url: INCA_INFO.menus.wine.url,
      },
      drinks: {
        name: 'Drinks Menu',
        type: 'drinks',
        url: INCA_INFO.menus.drinks.url,
      },
    };

    if (menuType === 'all') {
      return {
        menuType: 'all',
        name: 'All Menus',
        allMenus: Object.values(menus),
        sendAsDocument: true,
      };
    }

    const selectedMenu = menus[menuType as keyof typeof menus];
    return {
      menuType: selectedMenu.type,
      name: selectedMenu.name,
      url: selectedMenu.url,
      sendAsDocument: true,
    };
  },
});

/**
 * Export all tools as an array for easy registration
 */
export const incaLondonTools = [
  getOpeningHoursTool,
  getContactInfoTool,
  getDressCodeTool,
  getReservationInfoTool,
  getLocationInfoTool,
  getPrivateEventsInfoTool,
  getMenuTool,
];
