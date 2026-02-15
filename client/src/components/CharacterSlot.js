import React from 'react';
import '../styles/components/CharacterSlots.css';

export default function CharacterSlot({ character, isActive, isDimmed, onClick }) {
  return (
    <div
      className={`character-slot ${isActive ? 'slot-active' : ''} ${isDimmed ? 'slot-dimmed' : ''} ${character ? 'has-character' : ''}`}
      onClick={isActive ? onClick : undefined}
      style={{ cursor: isActive ? 'pointer' : 'default' }}
    >
      {character ? (
        <>
          <img src={character.image} alt={character.name} className="character-image" />
          <div className="character-info">
            <p className="character-name">{character.name}</p>
          </div>
        </>
      ) : (
        <div className="empty-slot-content">
          <span className="material-icons">add_circle_outline</span>
          <span className="slot-text">Invocar</span>
        </div>
      )}
    </div>
  );
}
