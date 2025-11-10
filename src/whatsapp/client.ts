/**
 * Meta WhatsApp Business API Client
 * Handles sending messages to users via Meta's Cloud API
 */

import axios, { AxiosInstance } from 'axios';

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'document' | 'interactive' | 'location';
  text?: {
    body: string;
  };
  document?: {
    link: string;
    caption?: string;
    filename?: string;
  };
  interactive?: {
    type: 'button' | 'list';
    body: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
      button?: string;
      sections?: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

export interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export class WhatsAppClient {
  private client: AxiosInstance;
  private phoneNumberId: string;

  constructor(accessToken: string, phoneNumberId: string) {
    this.phoneNumberId = phoneNumberId;
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/v21.0/${phoneNumberId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Send a text message to a WhatsApp user
   */
  async sendTextMessage(to: string, message: string): Promise<WhatsAppResponse> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          body: message,
        },
      };

      console.log(`📤 Sending message to ${to}:`, message.substring(0, 50) + '...');

      const response = await this.client.post('/messages', payload);

      console.log('✅ Message sent successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error sending WhatsApp message:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  /**
   * Send a document (PDF, image, etc.) to a WhatsApp user
   */
  async sendDocument(
    to: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<WhatsAppResponse> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'document',
        document: {
          link: documentUrl,
          filename: filename,
          ...(caption && { caption }),
        },
      };

      console.log(`📤 Sending document to ${to}: ${filename}`);

      const response = await this.client.post('/messages', payload);

      console.log('✅ Document sent successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error sending WhatsApp document:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp document: ${error.message}`);
    }
  }

  /**
   * Mark a message as read (optionally with typing indicator)
   */
  async markAsRead(messageId: string, showTyping: boolean = false): Promise<void> {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      // Add typing indicator if requested
      if (showTyping) {
        payload.typing_indicator = { type: 'text' };
      }

      await this.client.post('/messages', payload);
      console.log(`✓ Message ${messageId} marked as read${showTyping ? ' with typing indicator' : ''}`);
    } catch (error: any) {
      console.error('⚠️ Error marking message as read:', error.response?.data || error.message);
      // Non-critical error, don't throw
    }
  }

  /**
   * Send typing indicator (3 dots animation)
   * Note: This is a legacy method. Prefer using markAsRead(messageId, true) instead.
   * The typing indicator lasts for up to 25 seconds or until you send a message.
   */
  async sendTypingIndicator(to: string): Promise<void> {
    try {
      // According to WhatsApp Cloud API docs, typing indicator should be sent
      // as part of the read status. This standalone method is kept for compatibility
      // but may not work as expected with all API versions.
      console.log(`⌨️ Typing indicator for ${to} (use markAsRead with typing=true instead)`);
    } catch (error: any) {
      console.error('⚠️ Error sending typing indicator:', error.response?.data || error.message);
      // Non-critical error, don't throw
    }
  }

  /**
   * Maintain typing indicator for long operations
   * Automatically re-sends typing indicator every 20 seconds until stopped
   * Returns a function to stop the typing indicator
   */
  startTypingIndicator(userId: string, messageId: string): () => void {
    let isTyping = true;

    const sendTyping = async () => {
      while (isTyping) {
        try {
          await this.markAsRead(messageId, true);
          await new Promise(resolve => setTimeout(resolve, 20000)); // Re-send every 20s (before 25s timeout)
        } catch (error) {
          console.error('⚠️ Error maintaining typing indicator:', error);
          break;
        }
      }
    };

    sendTyping();

    // Return stop function
    return () => {
      isTyping = false;
      console.log(`⌨️ Stopped typing indicator for ${userId}`);
    };
  }

  /**
   * Send an interactive button message (max 3 buttons for WhatsApp)
   */
  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<WhatsAppResponse> {
    try {
      // WhatsApp only allows max 3 buttons in button messages
      if (buttons.length > 3) {
        throw new Error('WhatsApp button messages support maximum 3 buttons. Use sendInteractiveList for more options.');
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: bodyText,
          },
          action: {
            buttons: buttons.map(btn => ({
              type: 'reply' as const,
              reply: {
                id: btn.id,
                title: btn.title.substring(0, 20), // WhatsApp limit is 20 chars
              },
            })),
          },
        },
      };

      console.log(`📤 Sending interactive buttons to ${to}`);

      const response = await this.client.post('/messages', payload);

      console.log('✅ Interactive buttons sent successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error sending interactive buttons:', error.response?.data || error.message);
      throw new Error(`Failed to send interactive buttons: ${error.message}`);
    }
  }

  /**
   * Send an interactive list message (for more than 3 options)
   */
  async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>
  ): Promise<WhatsAppResponse> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: bodyText,
          },
          action: {
            button: buttonText,
            sections: sections.map(section => ({
              title: section.title.substring(0, 24), // WhatsApp limit
              rows: section.rows.map(row => ({
                id: row.id,
                title: row.title.substring(0, 24), // WhatsApp limit
                ...(row.description && { description: row.description.substring(0, 72) }), // WhatsApp limit
              })),
            })),
          },
        },
      };

      console.log(`📤 Sending interactive list to ${to}`);

      const response = await this.client.post('/messages', payload);

      console.log('✅ Interactive list sent successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error sending interactive list:', error.response?.data || error.message);
      throw new Error(`Failed to send interactive list: ${error.message}`);
    }
  }

  /**
   * Send a location message to a WhatsApp user
   */
  async sendLocationMessage(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): Promise<WhatsAppResponse> {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'location',
        location: {
          latitude,
          longitude,
          ...(name && { name }),
          ...(address && { address }),
        },
      };

      console.log(`📤 Sending location to ${to}: ${name || 'Location'}`);

      const response = await this.client.post('/messages', payload);

      console.log('✅ Location sent successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error sending WhatsApp location:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp location: ${error.message}`);
    }
  }

  /**
   * Send a WhatsApp Flow with CalendarPicker
   * Uses WhatsApp's Flow API to send an interactive calendar for date selection
   *
   * NOTE: Date constraints (min/max dates, unavailable dates, include days) must be configured
   * in the Flow JSON in Meta Business Manager. This method sends a minimal payload that triggers
   * the Flow without dynamic data (which causes "Integrity" errors).
   *
   * ⚠️ TEMPORARILY DISABLED - Using manual date input instead
   */
  // async sendCalendarFlow(
  //   to: string,
  //   options: {
  //     flowId: string; // Your WhatsApp Flow ID (must be created in Meta Business Manager)
  //     flowCta: string; // Call-to-action button text
  //     bodyText: string; // Message body text
  //   }
  // ): Promise<WhatsAppResponse> {
  //   try {
  //     const payload = {
  //       messaging_product: 'whatsapp',
  //       recipient_type: 'individual',
  //       to,
  //       type: 'interactive',
  //       interactive: {
  //         type: 'flow',
  //         body: {
  //           text: options.bodyText,
  //         },
  //         action: {
  //           name: 'flow',
  //           parameters: {
  //             flow_message_version: '3',
  //             flow_token: `reservation_${Date.now()}`,
  //             flow_id: options.flowId,
  //             flow_cta: options.flowCta,
  //             // ✅ NO flow_action or flow_action_payload to avoid "Integrity" error
  //             // ✅ Flow configuration (dates, constraints) must be in Flow JSON in Meta Business Manager
  //           },
  //         },
  //       },
  //     };

  //     console.log(`📤 Sending WhatsApp Flow to ${to}`);
  //     console.log(`   Flow ID: ${options.flowId}`);

  //     const response = await this.client.post('/messages', payload);

  //     console.log('✅ Flow sent successfully');
  //     return response.data;
  //   } catch (error: any) {
  //     console.error('❌ Error sending WhatsApp Flow:', error.response?.data || error.message);
  //     throw new Error(`Failed to send WhatsApp Flow: ${error.message}`);
  //   }
  // }

}

/**
 * Create and configure WhatsApp client instance
 */
export function createWhatsAppClient(): WhatsAppClient {
  const accessToken = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    throw new Error(
      'Missing required environment variables: META_WHATSAPP_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID'
    );
  }

  return new WhatsAppClient(accessToken, phoneNumberId);
}
// export function sendCalendar() {
//     const calendarPayload = {
//         version: "7.2",
//         data_api_version: "3.0",
//         routing_model: {},
//         screens: [
//             {
//                 id: "DEMO_SCREEN",
//                 terminal: true,
//                 title: "Demo screen",
//                 layout: {
//                     type: "SingleColumnLayout",
//                     children: [
//                         {
//                             type: "CalendarPicker",
//                             name: "calendar",
//                             label: "Single date",
//                             "helper-text": "Select a date",
//                             required: true,
//                             mode: "single",
//                             "min-date": "2024-10-21",
//                             "max-date": "2025-12-12",
//                             "unavailable-dates": [
//                                 "2024-11-28",
//                                 "2024-11-01"
//                             ],
//                             "include-days": [
//                                 "Mon", "Tue", "Wed", "Thu", "Fri"
//                             ],
//                             "init-value": "2024-10-23",
//                             "on-select-action": {
//                                 name: "data_exchange",
//                                 payload: {
//                                     calendar: "${form.calendar}"
//                                 }
//                             }
//                         },
//                         {
//                             type: "Footer",
//                             label: "Continue",
//                             "on-click-action": {
//                                 name: "data_exchange",
//                                 payload: {}
//                             }
//                         }
//                     ]
//                 }
//             }
//         ]
//     };
//
//     // Envoi à l’API (remplace l’URL par celle de ton endpoint)
//     fetch("https://ton-api-endpoint.com/calendar", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify(calendarPayload)
//     })
//         .then(res => res.json())
//         .then(data => console.log("Réponse API :", data))
//         .catch(err => console.error("Erreur API :", err));
// }