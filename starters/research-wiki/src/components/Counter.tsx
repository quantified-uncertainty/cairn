import { useState } from 'react';

export default function Counter({ label = 'Count' }: { label?: string }) {
  const [count, setCount] = useState(0);
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, display: 'inline-block' }}>
      <p style={{ margin: 0 }}>{label}: {count}</p>
      <button onClick={() => setCount(c => c + 1)} style={{ marginTop: 8, cursor: 'pointer' }}>
        Increment
      </button>
    </div>
  );
}
