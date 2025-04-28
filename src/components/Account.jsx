import React from 'react';
import { useAuth } from './AuthContext';

const Account = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Account Details</h1>
      <p><strong>Username:</strong> {user?.username}</p>
    </div>
  );
};

export default Account;
