import { useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowRightOutlined, ArrowUpOutlined, CheckCircleOutlined, ReloadOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Input, Spin } from 'antd';
import { RecipeCard } from '../components/RecipeCard';
import type { CookingChatPageProps } from '../types/interfaces/CookingChatPageProps';
import { culinaryPalette } from '../theme/themeConfig';

const styles: Record<string, CSSProperties> = {
  page: { width: '100%', minHeight: 'calc(100vh - 72px)', background: culinaryPalette.pageBackground, padding: '28px 16px 120px' },
  container: { width: '100%', maxWidth: 820, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 },
  eyebrow: { margin: 0, color: culinaryPalette.accent, fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' },
  title: { margin: '4px 0 0', color: culinaryPalette.text, fontSize: 30, lineHeight: 1.15 },
  conversationList: { display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 2 },
  conversationButton: { flex: '0 0 auto', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' },
  chat: { display: 'flex', flexDirection: 'column', gap: 18 },
  row: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  assistantContent: { width: '100%', minWidth: 0 },
  avatar: { width: 34, height: 34, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: culinaryPalette.primary, color: culinaryPalette.surface },
  userAvatar: { background: culinaryPalette.accent },
  bubble: { maxWidth: '78%', padding: '13px 16px', borderRadius: 18, background: culinaryPalette.surface, color: culinaryPalette.textSecondary, border: `1px solid ${culinaryPalette.border}`, lineHeight: 1.55, whiteSpace: 'pre-wrap' },
  userBubble: { background: culinaryPalette.primary, color: culinaryPalette.surface, borderColor: culinaryPalette.primary, borderBottomRightRadius: 4 },
  assistantBubble: { borderBottomLeftRadius: 4 },
  followUp: { width: 'min(100%, 620px)', marginTop: 10, padding: 14, borderRadius: 14, background: culinaryPalette.surface, border: `1px solid ${culinaryPalette.border}` },
  followUpLabel: { margin: '0 0 10px', color: culinaryPalette.text, fontWeight: 700 },
  optionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 },
  optionButton: { height: 'auto', minHeight: 42, padding: '9px 12px', textAlign: 'left', whiteSpace: 'normal', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
  selectedOption: { background: '#E7F5EC', borderColor: culinaryPalette.primary, color: culinaryPalette.text },
  continueButton: { width: '100%', marginTop: 10 },
  fallbackChoices: { width: 'min(100%, 620px)', marginTop: 10, padding: 14, borderRadius: 14, background: culinaryPalette.surface, border: `1px solid ${culinaryPalette.border}` },
  fallbackButton: { width: '100%', height: 'auto', minHeight: 42, marginTop: 8, padding: '9px 12px', textAlign: 'left', whiteSpace: 'normal', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
  recipeList: { display: 'flex', gap: 14, width: '100%', overflowX: 'auto', marginTop: 10, paddingBottom: 8 },
  recipeCardItem: { flex: '0 0 min(290px, 78vw)' },
  viewAllButton: { marginTop: 10 },
  composer: { position: 'sticky', bottom: 16, display: 'flex', gap: 10, alignItems: 'center', marginTop: 28, padding: 10, background: culinaryPalette.surface, border: `1px solid ${culinaryPalette.border}`, borderRadius: 18, boxShadow: '0 12px 30px rgba(17, 24, 39, 0.12)' },
  input: { border: 'none', boxShadow: 'none', fontSize: 15 },
  empty: { padding: '24px 0', color: culinaryPalette.textSecondary, lineHeight: 1.6 },
  error: { marginTop: 16, padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' },
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
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Cooking plan</p>
            <h1 style={styles.title}>Let&apos;s figure out dinner</h1>
          </div>
          <Button icon={<ReloadOutlined />} onClick={onStartOver}>New idea</Button>
        </div>

        {conversations.length > 0 && (
          <div style={styles.conversationList} aria-label="Saved conversations">
            {conversations.map((conversation) => (
              <Button
                key={conversation.id}
                type={conversation.id === activeConversationId ? 'primary' : 'default'}
                onClick={() => onSelectConversation(conversation)}
                style={styles.conversationButton}
              >
                {conversation.title}
              </Button>
            ))}
          </div>
        )}

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
              <div key={chatMessage.id} style={{ ...styles.row, ...(isUser ? styles.userRow : {}) }}>
                {!isUser && <span style={styles.avatar}><RobotOutlined /></span>}
                <div style={isUser ? undefined : styles.assistantContent}>
                  <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.assistantBubble) }}>{chatMessage.content}</div>
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
                          <div key={recipe.id} style={styles.recipeCardItem}>
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
                {isUser && <span style={{ ...styles.avatar, ...styles.userAvatar }}><UserOutlined /></span>}
              </div>
            );
          })}

          {isLoading && (
            <div style={styles.row}>
              <span style={styles.avatar}><RobotOutlined /></span>
              <div style={styles.bubble}><Spin size="small" /> <span style={{ marginLeft: 8 }}>Thinking about your meal...</span></div>
            </div>
          )}
        </div>

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
      </div>
    </section>
  );
};

export default CookingChatPage;
