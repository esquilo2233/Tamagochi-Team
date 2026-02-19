
import React, { useState } from 'react';

export default function Home() {
  const [hunger, setHunger] = useState(100);
  const [energy, setEnergy] = useState(100);
  const [happiness, setHappiness] = useState(100);

  const handleFeed = () => {
    setHunger(prev => Math.max(0, prev - 10));
    setHappiness(prev => Math.min(100, prev + 5));
  };

  const handlePlay = () => {
    setEnergy(prev => Math.min(100, prev + 10));
    setHappiness(prev => Math.min(100, prev + 5));
  };

  const handleSleep = () => {
    setEnergy(prev => Math.min(100, prev + 20));
    setHunger(prev => Math.max(0, prev - 5));
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '15px' }}>
        🐾 Team Tamagochi
      </h1>
      
      <div style={{
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        backgroundColor: '#f0f0f0',
        position: 'relative',
        overflow: 'hidden',
        margin: '0 auto 20px'
      }}>
        <div 
          style={{
            width: `${happiness}%`,
            height: '100%',
            backgroundColor: '#4CAF50',
            borderRadius: '50%',
            transition: 'width 0.3s ease'
          }}
        />
      </div>
      
      <div style={{
        textAlign: 'center',
        fontSize: '14px',
        color: '#7f8c8d',
        marginBottom: '20px'
      }}>
        <p>Hunger: <strong>{hunger}%</strong></p>
        <p>Energy: <strong>{energy}%</strong></p>
        <p>Happiness: <strong>{happiness}%</strong></p>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={handleFeed}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          Feed
        </button>
        
        <button 
          onClick={handlePlay}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          Play
        </button>
        
        <button 
          onClick={handleSleep}
          style={{
            padding: '8px 16px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          Sleep
        </button>
      </div>
    </div>
  );
}
