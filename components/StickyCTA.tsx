"use client";

import React from "react";

export function StickyCTA() {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 999, background: '#dc2626', color: '#fff', padding: '10px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      ⚠️ AC issue? Don’t risk a $2,000 Repair —
      <button 
        onClick={() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("open-leadcard"));
          }
        }}
        style={{
          marginLeft: '12px',
          padding: '6px 16px',
          background: 'white',
          color: '#dc2626',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Get Help Now
      </button>
    </div>
  );
}
