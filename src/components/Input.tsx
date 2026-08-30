'use client';
import React from 'react';

interface InputProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  type?: string;
  children?: React.ReactNode;
}

const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  children
}: InputProps) => {
  return (
    <div className="input-group">
      <label>{label}</label>

      {children ? (
        <select value={value} onChange={onChange}>
          {children}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}

      <style jsx>{`
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        label {
          font-size: 13px;
          font-weight: 500;
          color: #4c1d95;
        }

        input,
        select {
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid rgba(124, 58, 237, 0.3);
          background: #ffffff;
          transition: all 0.2s ease;
        }

        input:focus,
        select:focus {
          outline: none;
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
        }
      `}</style>
    </div>
  );
};

export default Input;