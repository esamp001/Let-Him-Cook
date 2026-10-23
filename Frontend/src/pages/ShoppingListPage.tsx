import { useState, type CSSProperties } from 'react';
import { Button, Checkbox, Modal, Input, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, BulbOutlined, ClearOutlined } from '@ant-design/icons';
import { toast } from '../components/Toast';
import type { ShoppingItem } from '../types/shoppingList';
import { culinaryPalette } from '../theme/themeConfig';

interface Props {
  items: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onAddItem: (name: string, quantity: string) => void;
  onExploreRecipes: () => void;
}

const styles: Record<string, CSSProperties> = {
  wrapper: { padding: '32px 0 64px' },
  container: { maxWidth: 720, margin: '0 auto', padding: '0 24px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 800, color: culinaryPalette.text, margin: 0 },
  actions: { display: 'flex', alignItems: 'center', gap: 12 },
  addItemButton: { height: 42, fontWeight: 600 },
  itemsCard: { backgroundColor: culinaryPalette.surface, borderRadius: 16, border: `1px solid ${culinaryPalette.border}`, boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)', overflow: 'hidden', marginBottom: 24 },
  itemRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${culinaryPalette.borderSubtle}` },
  itemLeft: { display: 'flex', alignItems: 'center', gap: 14, flex: 1, cursor: 'pointer' },
  itemName: { fontSize: 15, fontWeight: 600, color: culinaryPalette.textSecondary },
  checkedItemName: { textDecoration: 'line-through', color: culinaryPalette.textSubtle },
  itemRight: { display: 'flex', alignItems: 'center', gap: 16 },
  itemQuantity: { fontSize: 14, color: culinaryPalette.textMuted, fontWeight: 500 },
  checkedItemQuantity: { color: culinaryPalette.textSubtle },
  deleteButton: { background: 'none', border: 'none', color: culinaryPalette.textSubtle, cursor: 'pointer', padding: 4, fontSize: 15 },
  emptyCard: { backgroundColor: culinaryPalette.surface, borderRadius: 16, border: `1px solid ${culinaryPalette.border}`, padding: '48px 24px', textAlign: 'center', marginBottom: 24 },
  tipBanner: { display: 'flex', alignItems: 'flex-start', gap: 12, backgroundColor: culinaryPalette.warmSurface, border: `1px solid ${culinaryPalette.warmBorder}`, borderRadius: 12, padding: '14px 18px' },
  tipIcon: { fontSize: 18, color: culinaryPalette.primary, marginTop: 2 },
  tipContent: { fontSize: 13, color: culinaryPalette.textSecondary, lineHeight: 1.5 },
  tipTitle: { fontWeight: 700, color: culinaryPalette.primary },
  modalFields: { display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 },
  modalLabel: { display: 'block', marginBottom: 6, fontWeight: 500 },
};

const ShoppingListPage = ({
  items,
  onToggleItem,
  onDeleteItem,
  onClearAll,
  onAddItem,
  onExploreRecipes,
}: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');

  const handleCreateItem = () => {
    if (!newItemName.trim()) {
      toast.warning('Please enter an item name');
      return;
    }
    onAddItem(newItemName.trim(), newItemQty.trim() || '1');
    setNewItemName('');
    setNewItemQty('');
    setIsModalOpen(false);
    toast.success('Item added to your shopping list');
  };

  const handleClearWithConfirm = () => {
    if (items.length === 0) return;
    Modal.confirm({
      title: 'Clear Shopping List?',
      content: 'Are you sure you want to remove all items from your shopping list?',
      okText: 'Clear All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        onClearAll();
        toast.info('Shopping list cleared');
      },
    });
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Header Row */}
        <div style={styles.header}>
          <h1 style={styles.title}>Your Shopping List</h1>

          <div style={styles.actions}>
            {items.length > 0 && (
              <Button
                type="text"
                danger
                icon={<ClearOutlined />}
                onClick={handleClearWithConfirm}
              >
                Clear All
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
              style={styles.addItemButton}
            >
              Add Item
            </Button>
          </div>
        </div>

        {/* Shopping Items List */}
        {items.length > 0 ? (
          <div style={styles.itemsCard}>
            {items.map((item) => (
              <div
                key={item.id}
                style={styles.itemRow}
              >
                <div
                  style={styles.itemLeft}
                  onClick={() => onToggleItem(item.id)}
                >
                  <Checkbox checked={item.checked} />
                  <span style={{ ...styles.itemName, ...(item.checked ? styles.checkedItemName : {}) }}>{item.name}</span>
                </div>

                <div style={styles.itemRight}>
                  {item.quantity && (
                    <span style={{ ...styles.itemQuantity, ...(item.checked ? styles.checkedItemQuantity : {}) }}>{item.quantity}</span>
                  )}
                  <button
                    type="button"
                    style={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    aria-label="Remove item"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyCard}>
            <Empty
              description="Your shopping list is empty"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                onClick={onExploreRecipes}
                style={{ marginTop: 8 }}
              >
                Discover Recipes
              </Button>
            </Empty>
          </div>
        )}

        {/* Tip Banner */}
        <div style={styles.tipBanner}>
          <BulbOutlined style={styles.tipIcon} />
          <div style={styles.tipContent}>
            <span style={styles.tipTitle}>Tip:</span> You can add more items manually
            or automatically generate missing items when viewing a recipe.
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        title="Add Shopping Item"
        open={isModalOpen}
        onOk={handleCreateItem}
        onCancel={() => setIsModalOpen(false)}
        okText="Add Item"
        destroyOnClose
      >
        <div style={styles.modalFields}>
          <div>
            <label style={styles.modalLabel}>
              Item Name *
            </label>
            <Input
              placeholder="e.g. Olive Oil, Garlic, Butter"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onPressEnter={handleCreateItem}
              autoFocus
            />
          </div>
          <div>
            <label style={styles.modalLabel}>
              Quantity / Size (optional)
            </label>
            <Input
              placeholder="e.g. 500g, 2 bottles, 1 bunch"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              onPressEnter={handleCreateItem}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ShoppingListPage;


