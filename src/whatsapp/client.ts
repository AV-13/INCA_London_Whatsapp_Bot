/**
 * Meta WhatsApp Business API Client
 * Handles sending messages to users via Meta's Cloud API
 */

import axios, { AxiosInstance } from 'axios';

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'document' | 'interactive';
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
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.client.post('/messages', {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      });
      console.log(`✓ Message ${messageId} marked as read`);
    } catch (error: any) {
      console.error('⚠️ Error marking message as read:', error.response?.data || error.message);
      // Non-critical error, don't throw
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(to: string): Promise<void> {
    try {
      // Note: Meta WhatsApp API doesn't support typing indicators directly
      // This is a placeholder for future implementation or custom logic
      console.log(`⌨️ Typing indicator for ${to} (simulated)`);
    } catch (error) {
      // Silent fail for typing indicator
    }
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
