import { useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowRightOutlined, ArrowUpOutlined, CheckCircleOutlined, MessageOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Input, Spin } from 'antd';
import { ChefHatIcon } from '../components/ChefHatIcon';
import { RecipeCard } from '../components/RecipeCard';
import type { CookingChatPageProps } from '../types/interfaces/CookingChatPageProps';
import { culinaryPalette } from '../theme/themeConfig';

const matchingRecipesMessage = 'Matching recipes are being shown...';

const styles: Record<string, CSSProperties> = {
  page: { width: '100%', height: 'calc(100dvh - 72px)', minHeight: 0, overflow: 'hidden', background: culinaryPalette.pageBackground },
  layout: { display: 'flex', width: '100%', height: '100%', minHeight: 0 },
  sidebar: { display: 'flex', flex: '0 0 275px', flexDirection: 'column', height: '100%', minHeight: 0, padding: '28px 20px', overflow: 'hidden', background: culinaryPalette.surface, borderRight: `1px solid ${culinaryPalette.border}` },
  newChatButton: { width: '100%', justifyContent: 'flex-start' },
  sidebarDivider: { margin: '20px 0', border: 'none', borderTop: `1px solid ${culinaryPalette.border}` },
  sidebarTitle: { margin: '0 0 10px', color: culinaryPalette.textSecondary, fontSize: 14, fontWeight: 700 },
  conversationList: { display: 'flex', flex: 1, flexDirection: 'column', gap: 6, minHeight: 0, overflowY: 'auto', paddingRight: 4 },
  conversationButton: { flexShrink: 0, width: '100%', height: 50, justifyContent: 'flex-start', overflow: 'hidden', textAlign: 'left', whiteSpace: 'normal' },
  activeConversationButton: { background: culinaryPalette.successSurface, color: culinaryPalette.primary },
  chatContent: { display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' },
  conversation: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '32px' },
  chat: { display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 1240, margin: '0 auto' },
  row: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  userRow: { justifyContent: 'flex-start' },
  assistantRow: { justifyContent: 'flex-end' },
  assistantContent: { width: '82%', maxWidth: 1120, minWidth: 0 },
  avatar: { width: 34, height: 34, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: culinaryPalette.primary, color: culinaryPalette.surface },
  assistantAvatar: { background: 'transparent' },
  userAvatar: { background: culinaryPalette.accent },
  bubble: { maxWidth: '78%', padding: '13px 16px', borderRadius: 18, background: culinaryPalette.surface, color: culinaryPalette.textSecondary, border: `1px solid ${culinaryPalette.border}`, lineHeight: 1.55, whiteSpace: 'pre-wrap' },
  userBubble: { background: culinaryPalette.primary, color: culinaryPalette.surface, borderColor: culinaryPalette.primary, borderBottomLeftRadius: 4 },
  assistantBubble: { maxWidth: '100%', borderBottomRightRadius: 4 },
  assistantStatus: { marginBottom: 10 },
  assistantStatusText: { flex: 1, margin: 0, padding: '13px 16px', color: culinaryPalette.textSecondary, background: culinaryPalette.surface, border: `1px solid ${culinaryPalette.border}`, borderRadius: 16 },
  followUp: { width: 'min(100%, 620px)', marginTop: 10, padding: 14, borderRadius: 14, background: culinaryPalette.surface, border: `1px solid ${culinaryPalette.border}` },
  followUpLabel: { margin: '0 0 10px', color: culinaryPalette.text, fontWeight: 700 },
  optionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 },
  optionButton: { height: 'auto', minHeight: 42, padding: '9px 12px', textAlign: 'left', whiteSpace: 'normal', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
  selectedOption: { background: '#E7F5EC', borderColor: culinaryPalette.primary, color: culinaryPalette.text },
  continueButton: { width: '100%', marginTop: 10 },
  fallbackChoices: { width: 'min(100%, 620px)', marginTop: 10, padding: 14, borderRadius: 14, background: culinaryPalette.surface, border: `1px solid ${culinaryPalette.border}` },
  fallbackButton: { width: '100%', height: 'auto', minHeight: 42, marginTop: 8, padding: '9px 12px', textAlign: 'left', whiteSpace: 'normal', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
  recipeList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, width: '100%', marginTop: 10 },
  viewAllButton: { marginTop: 10 },
  chatFooter: { flexShrink: 0, padding: '16px 32px 24px', background: culinaryPalette.pageBackground, borderTop: `1px solid ${culinaryPalette.border}` },
  composer: { display: 'flex', gap: 10, alignItems: 'center', width: '100%', maxWidth: 1240, margin: '0 auto', padding: 10, background: culinaryPalette.surface, border: `1px solid ${culinaryPalette.border}`, borderRadius: 18, boxShadow: '0 12px 30px rgba(17, 24, 39, 0.12)' },
  input: { border: 'none', boxShadow: 'none', fontSize: 15 },
  empty: { padding: '24px 0', color: culinaryPalette.textSecondary, lineHeight: 1.6 },
  error: { width: '100%', maxWidth: 1240, margin: '0 auto 10px', padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' },
};

const CookingChatPage = ({ messages, isLoading, error, onSendMessage, onStartOver, onSelectRecipe, onViewAllRecipes, onSelectFallback, conversations, activeConversationId, onSelectConversation }: CookingChatPageProps) => {
  const [message, setMessage] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!message.trim() || isLoading) {
      return;
    }

    onSendMessage(message.trim());
    setMessage('');
  };

  const toggleOption = (messageId: string, option: string) => {
    setSelectedOptions((previous) => {
      const selectedForMessage = previous[messageId] ?? [];
      const nextSelection = selectedForMessage.includes(option)
        ? selectedForMessage.filter((selected) => selected !== option)
        : [...selectedForMessage, option];

      return { ...previous, [messageId]: nextSelection };
    });
  };

  const submitOptions = (messageId: string) => {
    const choices = selectedOptions[messageId] ?? [];
    onSendMessage(choices.length > 0 ? `I have: ${choices.join(', ')}.` : "I don't have any of those.");
  };

  return (
    <section style={styles.page}>
      <div style={styles.layout}>
        <aside style={styles.sidebar} aria-label="Recent chats">
          <Button type="primary" icon={<PlusOutlined />} onClick={onStartOver} style={styles.newChatButton}>New chat</Button>
          <hr style={styles.sidebarDivider} />
          <h2 style={styles.sidebarTitle}>Recent chats</h2>
          {conversations.length > 0 && (
            <div style={styles.conversationList}>
              {conversations.map((conversation) => (
                <Button
                  key={conversation.id}
                  type="text"
                  icon={<MessageOutlined />}
                  onClick={() => onSelectConversation(conversation)}
                  style={{ ...styles.conversationButton, ...(conversation.id === activeConversationId ? styles.activeConversationButton : {}) }}
                >
                  {conversation.title}
                </Button>
              ))}
            </div>
          )}
        </aside>

        <div style={styles.chatContent}>
          <div style={styles.conversation}>
            <div style={styles.chat} aria-live="polite">
              {messages.length === 0 && (
                <p style={styles.empty}>Tell me what you feel like cooking or which ingredients you have. I&apos;ll ask a few questions, then suggest one recipe.</p>
              )}

              {messages.map((chatMessage, messageIndex) => {
                const isUser = chatMessage.role === 'user';
                const canAnswerFollowUp = !isUser && messageIndex === messages.length - 1 && Boolean(chatMessage.followUpOptions?.length);
                const canChooseFallback = !isUser && messageIndex === messages.length - 1 && Boolean(chatMessage.fallbackOptions?.length);
                const selectedForMessage = selectedOptions[chatMessage.id] ?? [];

                return (
                  <div key={chatMessage.id} style={{ ...styles.row, ...(isUser ? styles.userRow : styles.assistantRow) }}>
                    {isUser && <span style={{ ...styles.avatar, ...styles.userAvatar }}><UserOutlined /></span>}
                    <div style={isUser ? undefined : styles.assistantContent}>
                      {!isUser && (
                        <div style={styles.assistantStatus}>
                          <p style={styles.assistantStatusText}>{chatMessage.recipes?.length ? matchingRecipesMessage : 'AI response'}</p>
                        </div>
                      )}
                      {(!chatMessage.recipes?.length || chatMessage.content !== matchingRecipesMessage) && (
                        <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.assistantBubble) }}>{chatMessage.content}</div>
                      )}
                      {canAnswerFollowUp && (
                        <div style={styles.followUp}>
                          <p style={styles.followUpLabel}>Choose anything you have or prefer:</p>
                          <div style={styles.optionGrid}>
                            {chatMessage.followUpOptions?.map((option) => {
                              const isSelected = selectedForMessage.includes(option);

                              return (
                                <Button
                                  key={option}
                                  onClick={() => toggleOption(chatMessage.id, option)}
                                  disabled={isLoading}
                                  icon={<CheckCircleOutlined />}
                                  style={{ ...styles.optionButton, ...(isSelected ? styles.selectedOption : {}) }}
                                >
                                  {option}
                                </Button>
                              );
                            })}
                          </div>
                          <Button type="primary" onClick={() => submitOptions(chatMessage.id)} disabled={isLoading} style={styles.continueButton}>
                            Continue with my choices
                          </Button>
                        </div>
                      )}
                      {canChooseFallback && (
                        <div style={styles.fallbackChoices}>
                          <p style={styles.followUpLabel}>Choose how you would like to continue:</p>
                          {chatMessage.fallbackOptions?.map((option) => (
                            <Button key={option.id} disabled={isLoading} onClick={() => onSelectFallback(option)} style={styles.fallbackButton}>
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      {chatMessage.recipes && chatMessage.recipes.length > 0 && (
                        <>
                          <div style={styles.recipeList}>
                            {chatMessage.recipes.slice(0, 5).map((recipe) => (
                              <div key={recipe.id}>
                                <RecipeCard recipe={recipe} onSelect={onSelectRecipe} />
                              </div>
                            ))}
                          </div>
                          {chatMessage.recipes.length > 5 && (
                            <Button type="link" icon={<ArrowRightOutlined />} iconPosition="end" onClick={() => onViewAllRecipes(chatMessage.recipes ?? [])} style={styles.viewAllButton}>
                              View all {chatMessage.recipes.length} recipes
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    {!isUser && <span style={{ ...styles.avatar, ...styles.assistantAvatar }}><ChefHatIcon /></span>}
                  </div>
                );
              })}

              {isLoading && (
                <div style={{ ...styles.row, ...styles.assistantRow }}>
                  <div style={styles.bubble}><Spin size="small" /> <span style={{ marginLeft: 8 }}>Thinking about your meal...</span></div>
                  <span style={{ ...styles.avatar, ...styles.assistantAvatar }}><ChefHatIcon /></span>
                </div>
              )}
            </div>
          </div>

          <footer style={styles.chatFooter}>
            {error && <div style={styles.error}>{error}</div>}
            <form style={styles.composer} onSubmit={handleSubmit}>
              <Input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Reply with your preference..."
                disabled={isLoading}
                style={styles.input}
              />
              <Button type="primary" htmlType="submit" disabled={!message.trim() || isLoading} icon={<ArrowUpOutlined />} aria-label="Send message" />
            </form>
          </footer>
        </div>
      </div>
    </section>
  );
};

export default CookingChatPage;
