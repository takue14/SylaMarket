'use client';

import styled from 'styled-components';

const StyledWrapper = styled.div`
  .input {
    display: flex;
    flex-direction: column;
    width: 240px;
    background-color: #0d1117;
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }

  .value {
    font-size: 15px;
    background-color: transparent;
    border: none;
    padding: 12px 16px;
    color: white;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .value:hover {
    background-color: #1a1f24;
  }

  .value svg {
    width: 22px;
    height: 22px;
  }
`;

export default function ProfileDropdown() {
  return (
    <StyledWrapper>
      <div className="input">
        {/* Seller Profile */}
        <button className="value">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h10a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2" />
          </svg>
          Seller Profile
        </button>

        {/* Delivery Profile */}
        <button className="value">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2" />
          </svg>
          Delivery Profile
        </button>

        {/* Admin */}
        <button className="value">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 4L2 8l4 4" />
          </svg>
          Admin
        </button>

        {/* Credits */}
        <button className="value">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 4.01V8" />
          </svg>
          Credits
        </button>

        {/* Settings */}
        <button className="value">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 002.573-1.066c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00.817 1.194 1.724 1.724 0 01.817 1.194c-.94 1.543.827 3.31 2.37 2.37 1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 01-2.573 1.066 1.724 1.724 0 01-.817 1.194 1.724 1.724 0 01-.817 1.194c-.94 1.543.827 3.31 2.37 2.37 1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 01-2.573 1.066 1.724 1.724 0 01-.817 1.194 1.724 1.724 0 01-.817 1.194c-.94 1.543.827 3.31 2.37 2.37 1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 01-2.573 1.066 1.724 1.724 0 01-.817 1.194 1.724 1.724 0 01-.817 1.194c-.94 1.543.827 3.31 2.37 2.37 1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 01-2.573 1.066 1.724 1.724 0 01-.817 1.194 1.724 1.724 0 01-.817 1.194c-.94 1.543.827 3.31 2.37 2.37 1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 01-2.573 1.066 1.724 1.724 0 01-.817 1.194 1.724 1.724 0 01-.817 1.194c-.94 1.543.827 3.31 2.37 2.37" />
          </svg>
          Settings
        </button>

        {/* Logout */}
        <button className="value" style={{ color: '#ef4444' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4V7m-4 4V7" />
          </svg>
          Logout
        </button>
      </div>
    </StyledWrapper>
  );
}