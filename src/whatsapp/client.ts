/**
 * Meta WhatsApp Business API Client
 * Handles sending messages to users via Meta's Cloud API
 */

import axios, { AxiosInstance } from 'axios';

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'document';
  text?: {
    body: string;
  };
  document?: {
    link: string;
    caption?: string;
    filename?: string;
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
