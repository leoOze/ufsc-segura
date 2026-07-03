import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/api';
import { getToken } from '../services/authStorage';

export default function Index() {
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    async function checkToken() {
      const token = await getToken();

      if (!token) {
        setRedirectTo('/login');
        return;
      }

      try {
        await getCurrentUser();
        setRedirectTo('/home');
      } catch {
        setRedirectTo('/login');
      }
    }

    checkToken();
  }, []);

  if (!redirectTo) {
    return null;
  }

  return <Redirect href={redirectTo} />;
}
