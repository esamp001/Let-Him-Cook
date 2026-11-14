import type { RequestHandler } from 'express';
import { findConversationOwnerId, listConversations, saveConversation } from './conversations.repository.js';
import { conversationIdParamsSchema, saveConversationRequestSchema } from './conversations.schemas.js';
import type { SavedConversation } from './interfaces/SavedConversation.js';

export const listMyConversations: RequestHandler = async (_request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('listMyConversations must run after requireAuth.');
  }

  let conversations: SavedConversation[] = [];

  try {
    conversations = await listConversations(authUser.id);

    response.status(200).json({ data: { conversations } });
  } catch (error) {
    next(error);
  }
};

export const saveMyConversation: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('saveMyConversation must run after requireAuth.');
  }

  const parsedParams = conversationIdParamsSchema.safeParse(request.params);
  const parsedRequest = saveConversationRequestSchema.safeParse(request.body);

  if (!parsedParams.success || !parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'This conversation could not be saved.',
      },
    });
    return;
  }

  const { conversationId } = parsedParams.data;
  const { title, messages, plan } = parsedRequest.data;

  try {
    const ownerId = await findConversationOwnerId(conversationId);

    // The client creates conversation IDs, so never let one user overwrite another user's conversation.
    if (ownerId && ownerId !== authUser.id) {
      response.status(404).json({
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'This conversation was not found.',
        },
      });
      return;
    }

    await saveConversation(authUser.id, conversationId, title, messages, plan);

    response.status(200).json({ data: { id: conversationId, saved: true } });
  } catch (error) {
    next(error);
  }
};
