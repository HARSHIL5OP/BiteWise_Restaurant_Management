import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Index = () => {
  const { user, userProfile, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cafe Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {userProfile?.firstName || 'User'}</p>
          </div>
          <Button onClick={() => logout()} variant="destructive">Logout</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Current Session</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="font-medium">Email</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="font-medium">UID</span>
                <span className="font-mono text-xs">{user.uid}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="font-medium">Provider</span>
                <span>{user.providerData[0]?.providerId || 'password'}</span>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">User Profile (Firestore)</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="font-medium">Role</span>
                <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full">{userProfile?.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="font-medium">First Name</span>
                <span>{userProfile?.firstName}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="font-medium">Last Name</span>
                <span>{userProfile?.lastName}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="font-medium">Created</span>
                <span>{userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
