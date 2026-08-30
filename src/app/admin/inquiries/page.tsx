'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';

interface Inquiry {
  _id: string;
  adTitle: string;
  adDescription?: string;
  customerName: string;
  contact: string;
  timestamp: string;
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

const RefreshBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #3730a3, #5b6cff);
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

  svg {
    width: 15px;
    height: 15px;
    fill: white;
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
  }

  td:last-child { text-align: center; }
`;

const AdTitleBadge = styled.span`
  background: #1f1f2e;
  color: #818cf8;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
`;

const ContactBadge = styled.span`
  background: #0f2a1e;
  color: #10b981;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
`;

const DateText = styled.span`
  color: #6b6b76;
  font-size: 12px;
`;

const DeleteBtn = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 7px 16px;
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

// ================== COMPONENT ==================

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const fetchInquiries = async () => {
    const res = await fetch('/api/inquiries');
    if (res.ok) {
      const data = await res.json();
      setInquiries(data);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const deleteInquiry = async (id: string) => {
    if (!confirm('Delete this inquiry permanently?')) return;
    const res = await fetch(`/api/inquiries/${id}`, { method: 'DELETE' });
    if (res.ok) fetchInquiries();
  };

  return (
    <PageContainer>

      <Header>
        <Title>Ad Inquiries &amp; Leads</Title>

        <RefreshBtn onClick={fetchInquiries}>
          <svg viewBox="0 0 24 24">
            <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          Refresh
        </RefreshBtn>
      </Header>

      {inquiries.length === 0 ? (
        <EmptyState>No inquiries yet.</EmptyState>
      ) : (
        <TableWrapper>
          <StyledTable>
            <thead>
              <tr>
                <th>Date</th>
                <th>Ad Title</th>
                <th>Customer Name</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map(inquiry => (
                <tr key={inquiry._id}>
                  <td>
                    <DateText>
                      {new Date(inquiry.timestamp).toLocaleString()}
                    </DateText>
                  </td>
                  <td>
                    <AdTitleBadge>{inquiry.adTitle}</AdTitleBadge>
                  </td>
                  <td>{inquiry.customerName}</td>
                  <td>
                    <ContactBadge>{inquiry.contact}</ContactBadge>
                  </td>
                  <td>
                    <DeleteBtn onClick={() => deleteInquiry(inquiry._id)}>
                      Delete
                    </DeleteBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        </TableWrapper>
      )}

    </PageContainer>
  );
}