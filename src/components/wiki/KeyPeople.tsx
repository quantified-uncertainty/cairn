import React from 'react';
import './wiki.css';

interface Person {
  name: string;
  role: string;
  image?: string;
}

interface KeyPeopleProps {
  people: Person[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function KeyPeople({ people }: KeyPeopleProps) {
  return (
    <div className="wiki-key-people">
      {people.map((person, index) => (
        <div key={index} className="wiki-person">
          <div className="wiki-person__avatar">
            {person.image ? (
              <img src={person.image} alt={person.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              getInitials(person.name)
            )}
          </div>
          <div className="wiki-person__info">
            <div className="wiki-person__name">{person.name}</div>
            <div className="wiki-person__role">{person.role}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default KeyPeople;
