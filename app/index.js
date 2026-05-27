import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { getToken } from '../services/authStorage';

export default function Index() {
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    async function checkToken() {
      const token = await getToken();
      setRedirectTo(token ? '/home' : '/login');
    }

    checkToken();
  }, []);

  if (!redirectTo) {
    return null;
  }

  return <Redirect href={redirectTo} />;
}
