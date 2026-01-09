import React from 'react';

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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 my-4">
      {people.map((person, index) => (
        <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div className="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center font-semibold text-sm text-foreground">
            {person.image ? (
              <img
                src={person.image}
                alt={person.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(person.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-foreground">{person.name}</div>
            <div className="text-xs text-muted-foreground">{person.role}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default KeyPeople;
