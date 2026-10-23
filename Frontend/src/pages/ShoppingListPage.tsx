import { useState } from 'react';
import { Button, Checkbox, Modal, Input, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, BulbOutlined, ClearOutlined } from '@ant-design/icons';
import { toast } from '../components/Toast';
import type { ShoppingItem } from '../types/shoppingList';

interface Props {
  items: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onAddItem: (name: string, quantity: string) => void;
  onExploreRecipes: () => void;
}

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
    <div className="shopping-list-wrapper">
      <div className="shopping-list-container">
        {/* Header Row */}
        <div className="shopping-list-header">
          <h1 className="shopping-list-title">Your Shopping List</h1>

          <div className="shopping-list-actions">
            {items.length > 0 && (
              <Button
                type="text"
                danger
                icon={<ClearOutlined />}
                onClick={handleClearWithConfirm}
                className="clear-all-btn"
              >
                Clear All
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
              className="add-item-btn"
            >
              Add Item
            </Button>
          </div>
        </div>

        {/* Shopping Items List */}
        {items.length > 0 ? (
          <div className="shopping-items-card">
            {items.map((item) => (
              <div
                key={item.id}
                className={`shopping-item-row ${item.checked ? 'checked' : ''}`}
              >
                <div
                  className="item-left"
                  onClick={() => onToggleItem(item.id)}
                >
                  <Checkbox checked={item.checked} />
                  <span className="item-name">{item.name}</span>
                </div>

                <div className="item-right">
                  {item.quantity && (
                    <span className="item-quantity">{item.quantity}</span>
                  )}
                  <button
                    type="button"
                    className="item-delete-btn"
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
          <div className="shopping-empty-card">
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
        <div className="shopping-tip-banner">
          <BulbOutlined className="tip-icon" />
          <div className="tip-content">
            <span className="tip-title">Tip:</span> You can add more items manually
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
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
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
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


