import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

export type TicketEvent =
  | 'ticket.created'
  | 'ticket.status_changed'
  | 'ticket.reply_added'
  | 'ticket.escalated'
  | 'ticket.resolved';

export interface TicketWebhookPayload {
  event: TicketEvent;
  ticket: {
    id: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    plan: string;
  };
  message?: string;
  previousStatus?: string;
  respondedBy?: string;
}

@Injectable()
export class N8nService {
  private webhookUrl: string;
  private baseUrl: string;
  private apiKey: string;

  constructor(
    private config: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    this.webhookUrl = this.config.get<string>('n8n.webhookUrl') || '';
    this.baseUrl = this.config.get<string>('n8n.baseUrl') || '';
    this.apiKey = this.config.get<string>('n8n.apiKey') || '';
  }

  /**
   * Trigger an n8n webhook for ticket events.
   * Each event type maps to a specific webhook path.
   */
  async triggerTicketWebhook(payload: TicketWebhookPayload): Promise<void> {
    const webhookPath = `${this.webhookUrl}/viralpostify-ticket`;

    try {
      const response = await fetch(webhookPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          source: 'viralpostify',
        }),
      });

      if (!response.ok) {
        this.logger.warn(
          `n8n webhook returned ${response.status}: ${await response.text()}`,
          'N8nService',
        );
      } else {
        this.logger.log(
          `n8n webhook triggered: ${payload.event} for ticket ${payload.ticket.id}`,
          'N8nService',
        );
      }
    } catch (error: any) {
      // Don't throw — webhook failures shouldn't break ticket operations
      this.logger.warn(
        `n8n webhook failed for ${payload.event}: ${error.message}`,
        'N8nService',
      );
    }
  }

  /**
   * List existing n8n workflows via the API.
   */
  async listWorkflows(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows?limit=50`, {
        headers: { 'X-N8N-API-KEY': this.apiKey },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.data || [];
    } catch (error: any) {
      this.logger.warn(`Failed to list n8n workflows: ${error.message}`, 'N8nService');
      return [];
    }
  }

  /**
   * Create a ticket support workflow in n8n.
   * This sets up a webhook-triggered workflow that handles ticket events.
   */
  async createTicketWorkflow(): Promise<any> {
    const workflowData = {
      name: 'Viralpostify - Ticket Support Automation',
      nodes: [
        {
          parameters: {
            httpMethod: 'POST',
            path: 'viralpostify-ticket',
            responseMode: 'onReceived',
            responseData: 'allEntries',
          },
          type: 'n8n-nodes-base.webhook',
          typeVersion: 2,
          position: [0, 0],
          id: 'webhook-trigger',
          name: 'Ticket Webhook',
          webhookId: 'viralpostify-ticket',
        },
        {
          parameters: {
            conditions: {
              options: { caseSensitive: false, leftValue: '' },
              combinator: 'and',
              conditions: [
                {
                  leftValue: '={{ $json.event }}',
                  rightValue: 'ticket.created',
                  operator: { type: 'string', operation: 'equals' },
                },
              ],
            },
          },
          type: 'n8n-nodes-base.if',
          typeVersion: 2,
          position: [300, -100],
          id: 'check-new-ticket',
          name: 'Is New Ticket?',
        },
        {
          parameters: {
            conditions: {
              options: { caseSensitive: false, leftValue: '' },
              combinator: 'and',
              conditions: [
                {
                  leftValue: '={{ $json.event }}',
                  rightValue: 'ticket.resolved',
                  operator: { type: 'string', operation: 'equals' },
                },
              ],
            },
          },
          type: 'n8n-nodes-base.if',
          typeVersion: 2,
          position: [300, 100],
          id: 'check-resolved',
          name: 'Is Resolved?',
        },
        {
          parameters: {
            conditions: {
              options: { caseSensitive: false, leftValue: '' },
              combinator: 'and',
              conditions: [
                {
                  leftValue: '={{ $json.event }}',
                  rightValue: 'ticket.reply_added',
                  operator: { type: 'string', operation: 'equals' },
                },
              ],
            },
          },
          type: 'n8n-nodes-base.if',
          typeVersion: 2,
          position: [300, 300],
          id: 'check-reply',
          name: 'Is Reply?',
        },
        // Placeholder: Set nodes for email content
        {
          parameters: {
            values: {
              string: [
                {
                  name: 'emailSubject',
                  value: '=New Support Ticket: {{ $json.ticket.subject }}',
                },
                {
                  name: 'emailBody',
                  value: '=Hi {{ $json.user.name }},\n\nThank you for contacting Viralpostify Support.\n\nWe\'ve received your ticket:\n\nSubject: {{ $json.ticket.subject }}\nCategory: {{ $json.ticket.category }}\nPriority: {{ $json.ticket.priority }}\nTicket ID: {{ $json.ticket.id }}\n\nOur team will review your request and get back to you shortly.\n\nBest regards,\nViralpostify Support Team',
                },
              ],
            },
          },
          type: 'n8n-nodes-base.set',
          typeVersion: 3.4,
          position: [600, -100],
          id: 'set-new-ticket-email',
          name: 'Set New Ticket Email',
        },
        {
          parameters: {
            values: {
              string: [
                {
                  name: 'emailSubject',
                  value: '=Ticket Resolved: {{ $json.ticket.subject }}',
                },
                {
                  name: 'emailBody',
                  value: '=Hi {{ $json.user.name }},\n\nYour support ticket has been resolved:\n\nSubject: {{ $json.ticket.subject }}\nTicket ID: {{ $json.ticket.id }}\n\nIf you have any further questions, feel free to reopen the ticket or create a new one.\n\nThank you for using Viralpostify!\n\nBest regards,\nViralpostify Support Team',
                },
              ],
            },
          },
          type: 'n8n-nodes-base.set',
          typeVersion: 3.4,
          position: [600, 100],
          id: 'set-resolved-email',
          name: 'Set Resolved Email',
        },
        {
          parameters: {
            values: {
              string: [
                {
                  name: 'emailSubject',
                  value: '=New Reply on Ticket: {{ $json.ticket.subject }}',
                },
                {
                  name: 'emailBody',
                  value: '=Hi {{ $json.user.name }},\n\nA new reply has been added to your support ticket:\n\nSubject: {{ $json.ticket.subject }}\nTicket ID: {{ $json.ticket.id }}\n\nReply:\n{{ $json.message }}\n\nYou can view the full conversation in your Viralpostify dashboard.\n\nBest regards,\nViralpostify Support Team',
                },
              ],
            },
          },
          type: 'n8n-nodes-base.set',
          typeVersion: 3.4,
          position: [600, 300],
          id: 'set-reply-email',
          name: 'Set Reply Email',
        },
      ],
      connections: {
        'Ticket Webhook': {
          main: [
            [
              { node: 'Is New Ticket?', type: 'main', index: 0 },
              { node: 'Is Resolved?', type: 'main', index: 0 },
              { node: 'Is Reply?', type: 'main', index: 0 },
            ],
          ],
        },
        'Is New Ticket?': {
          main: [
            [{ node: 'Set New Ticket Email', type: 'main', index: 0 }],
            [],
          ],
        },
        'Is Resolved?': {
          main: [
            [{ node: 'Set Resolved Email', type: 'main', index: 0 }],
            [],
          ],
        },
        'Is Reply?': {
          main: [
            [{ node: 'Set Reply Email', type: 'main', index: 0 }],
            [],
          ],
        },
      },
      settings: {
        executionOrder: 'v1',
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': this.apiKey,
        },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const workflow = await response.json();
      this.logger.log(`Created n8n workflow: ${workflow.id}`, 'N8nService');

      // Activate the workflow
      await this.activateWorkflow(workflow.id);

      return workflow;
    } catch (error: any) {
      this.logger.error(`Failed to create n8n workflow: ${error.message}`, 'N8nService');
      throw error;
    }
  }

  /**
   * Activate a workflow by ID.
   */
  async activateWorkflow(workflowId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}/activate`, {
        method: 'POST',
        headers: { 'X-N8N-API-KEY': this.apiKey },
      });
      this.logger.log(`Activated n8n workflow: ${workflowId}`, 'N8nService');
    } catch (error: any) {
      this.logger.warn(`Failed to activate workflow ${workflowId}: ${error.message}`, 'N8nService');
    }
  }

  /**
   * Get n8n connection status and workflow info.
   */
  async getStatus(): Promise<{
    connected: boolean;
    workflowCount: number;
    activeWorkflows: number;
    ticketWorkflow: any | null;
  }> {
    try {
      const workflows = await this.listWorkflows();
      const ticketWorkflow = workflows.find(
        (w: any) => w.name === 'Viralpostify - Ticket Support Automation',
      );
      return {
        connected: true,
        workflowCount: workflows.length,
        activeWorkflows: workflows.filter((w: any) => w.active).length,
        ticketWorkflow: ticketWorkflow || null,
      };
    } catch {
      return {
        connected: false,
        workflowCount: 0,
        activeWorkflows: 0,
        ticketWorkflow: null,
      };
    }
  }
}
