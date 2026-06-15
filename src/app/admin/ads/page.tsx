'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styled from 'styled-components';

interface Ad {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  buttonText: string;
  badge?: string;
  badgeColor?: string;
  isLarge?: boolean;
  active: boolean;
}

// ================== STYLES ==================

const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: var(--bg-base);
  color: var(--text-primary);
  padding: 24px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 14px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
`;

const Title = styled.h1`
  color: var(--text-primary);
  margin: 0;
  font-size: 22px;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #065f46, #10b981);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;

  &:hover {
    opacity: 0.88;
    transform: translateY(-2px);
  }
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: 14px;
  scrollbar-width: thin;
  scrollbar-color: #222 transparent;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: linear-gradient(145deg, #1b1b22, #111116);
  border-radius: 14px;
  overflow: hidden;
  min-width: 580px;

  thead tr {
    background: #1b1b22;
  }

  th {
    padding: 14px 16px;
    text-align: left;
    font-size: 13px;
    font-weight: 700;
    color: #5b6cff;
    white-space: nowrap;
  }

  th:last-child { text-align: center; }

  tbody tr {
    border-bottom: 1px solid #1f1f25;
    transition: background 0.15s;
  }

  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: rgba(91, 108, 255, 0.04); }

  td {
    padding: 13px 16px;
    font-size: 13.5px;
    color: #d1d1d8;
    white-space: nowrap;
    vertical-align: middle;
  }

  td:last-child { text-align: center; }
`;

const TypeBadge = styled.span<{ large?: boolean }>`
  background: ${props => props.large ? '#1e3a5f' : '#1f1f2e'};
  color: ${props => props.large ? '#3b82f6' : '#818cf8'};
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
`;

const StatusBadge = styled.span<{ active: boolean }>`
  background: ${props => props.active ? '#0f2a1e' : '#2a0f0f'};
  color: ${props => props.active ? '#10b981' : '#ef4444'};
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const EditBtn = styled.button`
  background: #1e3a5f;
  color: #3b82f6;
  border: none;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
`;

const DeleteBtn = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #444;
  padding: 60px 20px;
  font-size: 15px;
`;

/* ── Modal ── */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

const Modal = styled.div`
  background: linear-gradient(145deg, #1b1b22, #111116);
  border: 1px solid #1f1f2e;
  padding: 28px;
  border-radius: 18px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  color: white;

  scrollbar-width: thin;
  scrollbar-color: #222 transparent;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
`;

const ModalTitle = styled.h2`
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 700;
  color: white;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 11px 14px;
  margin: 8px 0;
  border-radius: 10px;
  border: 1px solid #2a2a35;
  background: #0d0d10;
  color: white;
  font-size: 13.5px;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;

  &::placeholder { color: #555; }
  &:focus { border-color: #5b6cff; }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 11px 14px;
  margin: 8px 0;
  border-radius: 10px;
  border: 1px solid #2a2a35;
  background: #0d0d10;
  color: white;
  font-size: 13.5px;
  height: 80px;
  resize: vertical;
  box-sizing: border-box;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;

  &::placeholder { color: #555; }
  &:focus { border-color: #5b6cff; }
`;

const FormLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #9b9ba3;
  margin: 12px 0 4px;
`;

const FileInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px dashed #2a2a35;
  background: #0d0d10;
  color: #9b9ba3;
  font-size: 13px;
  box-sizing: border-box;
  cursor: pointer;
  margin: 8px 0;

  &::-webkit-file-upload-button {
    background: #1f1f2e;
    color: #818cf8;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    margin-right: 10px;
  }
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  font-size: 13.5px;
  color: #d1d1d8;
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #5b6cff;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 22px;
`;

const SubmitBtn = styled.button`
  flex: 1;
  padding: 13px;
  background: linear-gradient(135deg, #065f46, #10b981);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:hover:not(:disabled) { opacity: 0.88; }
`;

const CancelBtn = styled.button`
  flex: 1;
  padding: 13px;
  background: #1f1f2e;
  color: #9b9ba3;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover { opacity: 0.85; }
`;

// ================== COMPONENT ==================

export default function AdminAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    buttonText: 'BUY NOW',
    badge: '',
    badgeColor: '#10b981',
    isLarge: false,
    active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAds = async () => {
    const res = await fetch('/api/ads');
    if (res.ok) {
      const data = await res.json();
      setAds(data);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData();
    form.append('title', formData.title);
    if (formData.subtitle) form.append('subtitle', formData.subtitle);
    if (formData.description) form.append('description', formData.description);
    form.append('buttonText', formData.buttonText);
    if (formData.badge) form.append('badge', formData.badge);
    form.append('badgeColor', formData.badgeColor);
    form.append('isLarge', String(formData.isLarge));
    form.append('active', String(formData.active));
    if (imageFile) form.append('image', imageFile);

    const method = editingAd ? 'PUT' : 'POST';
    const url = editingAd ? `/api/ads/${editingAd._id}` : '/api/ads';

    const res = await fetch(url, { method, body: form });

    if (res.ok) {
      await fetchAds();
      setShowForm(false);
      setEditingAd(null);
      setImageFile(null);
      setFormData({
        title: '', subtitle: '', description: '', buttonText: 'BUY NOW',
        badge: '', badgeColor: '#10b981', isLarge: false, active: true,
      });
      alert(editingAd ? 'Ad updated successfully!' : 'Ad created successfully!');
    } else {
      alert('Failed to save ad. Please try again.');
    }
    setLoading(false);
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      subtitle: ad.subtitle || '',
      description: ad.description || '',
      buttonText: ad.buttonText,
      badge: ad.badge || '',
      badgeColor: ad.badgeColor || '#10b981',
      isLarge: ad.isLarge || false,
      active: ad.active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad permanently?')) return;
    const res = await fetch(`/api/ads/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchAds();
      alert('Ad deleted successfully!');
    } else {
      alert('Failed to delete ad.');
    }
  };

  return (
    <PageContainer>

      <Header>
        <Title>Manage Ads &amp; Promotions</Title>
        <AddButton onClick={() => setShowForm(true)}>
          + Add New Ad
        </AddButton>
      </Header>

      {ads.length === 0 ? (
        <EmptyState>
          No ads found. Click &quot;Add New Ad&quot; to create one.
        </EmptyState>
      ) : (
        <TableWrapper>
          <StyledTable>
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.map(ad => (
                <tr key={ad._id}>
                  <td>
                    <Image
                      src={ad.image}
                      alt={ad.title}
                      width={72}
                      height={54}
                      style={{ objectFit: 'cover', borderRadius: '10px', display: 'block' }}
                    />
                  </td>
                  <td>{ad.title}</td>
                  <td>
                    <TypeBadge large={ad.isLarge}>
                      {ad.isLarge ? 'Large' : 'Small'}
                    </TypeBadge>
                  </td>
                  <td>
                    <StatusBadge active={ad.active}>
                      {ad.active ? 'Active' : 'Hidden'}
                    </StatusBadge>
                  </td>
                  <td>
                    <ActionGroup>
                      <EditBtn onClick={() => handleEdit(ad)}>Edit</EditBtn>
                      <DeleteBtn onClick={() => handleDelete(ad._id)}>Delete</DeleteBtn>
                    </ActionGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        </TableWrapper>
      )}

      {/* ── Modal ── */}
      {showForm && (
        <Overlay>
          <Modal>
            <ModalTitle>{editingAd ? 'Edit Ad' : 'Add New Ad'}</ModalTitle>

            <form onSubmit={handleSubmit}>
              <FormLabel>Title *</FormLabel>
              <FormInput
                type="text"
                placeholder="Ad title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <FormLabel>Subtitle</FormLabel>
              <FormInput
                type="text"
                placeholder="Subtitle (optional)"
                value={formData.subtitle}
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
              />

              <FormLabel>Description</FormLabel>
              <FormTextarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />

              <FormLabel>Button Text</FormLabel>
              <FormInput
                type="text"
                placeholder="BUY NOW"
                value={formData.buttonText}
                onChange={e => setFormData({ ...formData, buttonText: e.target.value })}
              />

              <FormLabel>Badge Text</FormLabel>
              <FormInput
                type="text"
                placeholder="e.g. NEW, SALE (optional)"
                value={formData.badge}
                onChange={e => setFormData({ ...formData, badge: e.target.value })}
              />

              <FormLabel>Upload Image</FormLabel>
              <FileInput
                type="file"
                accept="image/*"
                onChange={e => e.target.files && setImageFile(e.target.files[0])}
              />

              <CheckboxRow>
                <input
                  type="checkbox"
                  checked={formData.isLarge}
                  onChange={e => setFormData({ ...formData, isLarge: e.target.checked })}
                />
                Large format ad
              </CheckboxRow>

              <CheckboxRow>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                />
                Active (visible to customers)
              </CheckboxRow>

              <ModalActions>
                <SubmitBtn type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingAd ? 'Update Ad' : 'Create Ad'}
                </SubmitBtn>

                <CancelBtn
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAd(null);
                    setImageFile(null);
                  }}
                >
                  Cancel
                </CancelBtn>
              </ModalActions>
            </form>
          </Modal>
        </Overlay>
      )}

    </PageContainer>
  );
}