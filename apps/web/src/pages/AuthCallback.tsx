import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { trpc } from '../utils/trpc';

export function AuthCallback() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
  
  // We force a refetch to ensure we get the latest role, possibly after a sync
  const { data: user, isError } = trpc.auth.me.useQuery(undefined, {
    enabled: isLoaded && isSignedIn,
    retry: 1,
  });

  // Sync user to DB if needed (optional here if we trust webhooks, but we don't have webhooks yet)
  // We can trigger the sync mutation here to be safe!
  const syncMutation = trpc.auth.sync.useMutation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/');
    }
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else if (isError) {
      // If error (e.g. user not found in DB), try syncing
      if (!syncMutation.isPending && !syncMutation.isSuccess) {
         syncMutation.mutate({ email: undefined }); // Email will be inferred or we can pass it if we mapped it
      }
    }
  }, [user, isError, navigate, syncMutation]);

  // Handle sync success
  useEffect(() => {
    if (syncMutation.isSuccess && syncMutation.data) {
       if (syncMutation.data.role === 'ADMIN') {
         navigate('/admin');
       } else {
         navigate('/');
       }
    }
  }, [syncMutation.isSuccess, syncMutation.data, navigate]);


  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-950 gap-4">
      <Loader2 className="w-16 h-16 text-yellow-500 animate-spin" />
      <h2 className="text-xl font-bold text-white tracking-widest uppercase italic animate-pulse">
        Authenticating...
      </h2>
    </div>
  );
}
