'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';

type ListingType = 'scholarship' | 'enrollment' | 'job';

interface Listing {
  _id: string;
  organizationName: string;
  title: string;
  description: string;
  type: ListingType;
  category?: string;
  location?: string;
  deadline?: string;
  externalUrl: string;
  status: 'draft' | 'published' | 'archived';
  logo?: string;
  funding?: string;
  studyLevel?: string;
  school?: string;
  program?: string;
  tuitionFee?: string;
  intake?: string;
  employmentType?: string;
  salary?: string;
  experienceLevel?: string;
  workMode?: string;
}

const EMPTY_FORM: Partial<Listing> = {
  type: 'scholarship',
  status: 'published',
  organizationName: '',
  title: '',
  description: '',
  externalUrl: '',
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filterType, setFilterType] = useState<ListingType | 'all'>('all');
  const [form, setForm] = useState<Partial<Listing>>(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchListings = async () => {
    const url = filterType === 'all' ? '/api/admin/listings' : `/api/admin/listings?type=${filterType}`;
    const res = await fetch(url);
    if (res.status === 401) {
      window.location.href = '/admin/login';
      return;
    }
    const data = await res.json();
    setListings(data.listings || []);
  };

  useEffect(() => {
    fetchListings();
  }, [filterType]);

  const handleField = (key: keyof Listing, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null) fd.append(key, String(value));
      });
      if (logoFile) fd.append('logo', logoFile);

      const url = editingId ? `/api/admin/listings/${editingId}` : '/api/admin/listings';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: fd });

      if (res.ok) {
        resetForm();
        fetchListings();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to save listing');
      }
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (listing: Listing) => {
    setForm(listing);
    setEditingId(listing._id);
    setLogoFile(null);
    setLogoPreview(listing.logo || null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    const res = await fetch(`/api/admin/listings/${id}`, { method: 'DELETE' });
    if (res.ok) fetchListings();
  };

  return (
    <Wrapper>
      <h1>DealoAc Listings</h1>

      <div className="filter-row">
        {(['all', 'scholarship', 'enrollment', 'job'] as const).map((t) => (
          <button key={t} className={filterType === t ? 'active' : ''} onClick={() => setFilterType(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <h2>{editingId ? 'Edit Listing' : 'New Listing'}</h2>

        <div className="logo-row">
          <div className="logo-preview">
            {logoPreview ? <img src={logoPreview} alt="Logo preview" /> : <span>No logo</span>}
          </div>
          <label className="logo-upload">
            <span>{logoFile || form.logo ? 'Change thumbnail' : 'Upload thumbnail'}</span>
            <input type="file" accept="image/*" onChange={handleLogoChange} />
          </label>
        </div>

        <select value={form.type} onChange={(e) => handleField('type', e.target.value)}>
          <option value="scholarship">Scholarship</option>
          <option value="enrollment">Enrollment</option>
          <option value="job">Job</option>
        </select>

        <input placeholder="Organization name" value={form.organizationName || ''} onChange={(e) => handleField('organizationName', e.target.value)} required />
        <input placeholder="Title" value={form.title || ''} onChange={(e) => handleField('title', e.target.value)} required />
        <textarea placeholder="Description" value={form.description || ''} onChange={(e) => handleField('description', e.target.value)} required />
        <input placeholder="External link (https://...)" value={form.externalUrl || ''} onChange={(e) => handleField('externalUrl', e.target.value)} required />
        <input placeholder="Category" value={form.category || ''} onChange={(e) => handleField('category', e.target.value)} />
        <input placeholder="Location" value={form.location || ''} onChange={(e) => handleField('location', e.target.value)} />
        <input type="date" value={form.deadline ? form.deadline.slice(0, 10) : ''} onChange={(e) => handleField('deadline', e.target.value)} />

        {form.type === 'scholarship' && (
          <>
            <input placeholder="Funding (e.g. Full, Partial)" value={form.funding || ''} onChange={(e) => handleField('funding', e.target.value)} />
            <input placeholder="Study level" value={form.studyLevel || ''} onChange={(e) => handleField('studyLevel', e.target.value)} />
          </>
        )}
        {form.type === 'enrollment' && (
          <>
            <input placeholder="School" value={form.school || ''} onChange={(e) => handleField('school', e.target.value)} />
            <input placeholder="Program" value={form.program || ''} onChange={(e) => handleField('program', e.target.value)} />
            <input placeholder="Tuition fee" value={form.tuitionFee || ''} onChange={(e) => handleField('tuitionFee', e.target.value)} />
            <input placeholder="Intake (e.g. Sept 2026)" value={form.intake || ''} onChange={(e) => handleField('intake', e.target.value)} />
          </>
        )}
        {form.type === 'job' && (
          <>
            <input placeholder="Employment type" value={form.employmentType || ''} onChange={(e) => handleField('employmentType', e.target.value)} />
            <input placeholder="Salary" value={form.salary || ''} onChange={(e) => handleField('salary', e.target.value)} />
            <input placeholder="Experience level" value={form.experienceLevel || ''} onChange={(e) => handleField('experienceLevel', e.target.value)} />
            <input placeholder="Work mode (Remote, Onsite, Hybrid)" value={form.workMode || ''} onChange={(e) => handleField('workMode', e.target.value)} />
          </>
        )}

        <select value={form.status} onChange={(e) => handleField('status', e.target.value)}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        <div className="form-actions">
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update' : 'Create'}</button>
          {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <div className="listing-table">
        {listings.map((l) => (
          <div key={l._id} className="listing-row">
            <div className="row-main">
              {l.logo ? <img className="thumb" src={l.logo} alt="" /> : <div className="thumb thumb-empty" />}
              <div>
                <strong>{l.title}</strong> — {l.organizationName}
                <div>
                  <span className={`badge badge-${l.type}`}>{l.type}</span>
                  <span className={`badge badge-${l.status}`}>{l.status}</span>
                </div>
              </div>
            </div>
            <div className="row-actions">
              <button onClick={() => startEdit(l)}>Edit</button>
              <button onClick={() => handleDelete(l._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 20px;
  color: #f0f0f5;
  font-family: 'Inter', system-ui, sans-serif;

  h1 { font-size: 1.6rem; margin-bottom: 20px; }

  .filter-row {
    display: flex; gap: 8px; margin-bottom: 20px;
    button { background: #1b1b22; color: #9b9ba3; border: none; padding: 8px 16px; border-radius: 999px; cursor: pointer; font-size: 13px; }
    button.active { background: #7c3aed; color: white; }
  }

  .form-card {
    background: #14141c; border: 1px solid #26262e; border-radius: 14px; padding: 20px;
    display: flex; flex-direction: column; gap: 10px; margin-bottom: 32px;
    h2 { font-size: 1.1rem; margin-bottom: 6px; }
    input, textarea, select { background: #1b1b22; border: 1px solid #2c2c35; border-radius: 8px; padding: 10px 12px; color: #f0f0f5; font-size: 0.9rem; font-family: inherit; }
    textarea { min-height: 70px; resize: vertical; }
  }

  .logo-row { display: flex; align-items: center; gap: 14px; }
  .logo-preview {
    width: 72px; height: 72px; border-radius: 10px; background: #1b1b22; border: 1px solid #2c2c35;
    display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
    font-size: 11px; color: #6b6b76;
    img { width: 100%; height: 100%; object-fit: cover; }
  }
  .logo-upload {
    font-size: 13px; color: #818cf8; cursor: pointer; border: 1px dashed #2c2c35; padding: 10px 14px; border-radius: 8px;
    input { display: none; }
  }

  .form-actions {
    display: flex; gap: 10px;
    button[type='submit'] { background: #7c3aed; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    button[type='button'] { background: transparent; border: 1px solid #2c2c35; color: #9b9ba3; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
  }

  .listing-row {
    background: #14141c; border: 1px solid #26262e; border-radius: 10px; padding: 14px 16px;
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.88rem;
  }
  .row-main { display: flex; align-items: center; gap: 12px; }
  .thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
  .thumb-empty { background: #1b1b22; border: 1px solid #2c2c35; }

  .badge { margin-right: 6px; font-size: 10px; padding: 2px 8px; border-radius: 999px; background: #26262e; color: #9b9ba3; }
  .badge-published { background: #0f2a1e; color: #10b981; }
  .badge-draft { background: #2a2410; color: #eab308; }

  .row-actions button { background: transparent; border: none; color: #818cf8; cursor: pointer; font-size: 13px; margin-left: 10px; }
`;