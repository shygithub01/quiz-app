import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PracticeSessionManager() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/admin/practice/host', { replace: true }); }, [navigate]);
  return null;
}
