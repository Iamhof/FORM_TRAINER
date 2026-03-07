import React from 'react';

import CyberNoirAuthScreen from '@/components/auth/CyberNoirAuthScreen';
import { useAuthForm } from '@/hooks/useAuthForm';

export default function AuthScreen() {
  const authForm = useAuthForm();

  return <CyberNoirAuthScreen {...authForm} />;
}
