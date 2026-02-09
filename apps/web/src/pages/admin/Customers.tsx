import { trpc } from '../../utils/trpc';
import { Mail, Calendar, Shield } from 'lucide-react';

export function AdminCustomers() {
  // Using auth.getUsers if it exists, otherwise we'll leave it empty/mocked for now 
  // until we verify the API router has this procedure.
  // Assuming a 'getUsers' or similar might needed.
  // For now, let's render a static structure or try to query if we knew the signature.
  // Given the user said "no customers yet", implies they might expect data.
  // Let's assume we need to implement the FE component first.
  
  const { data: users, isLoading } = trpc.auth.getUsers.useQuery(undefined, {
      retry: false
  });
  // const isLoading = false;
  // const users: any[] = []; 


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-libre-bodoni transition-colors">Customers</h1>
        <p className="text-gray-500 dark:text-gray-400 font-exo-2 transition-colors">Manage your registered users</p>
      </div>

      <div className="bg-white dark:bg-[#1a2333] border border-gray-200 dark:border-[#F0E6CA]/10 rounded-xl overflow-hidden shadow-sm transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 font-exo-2 transition-colors">
            <thead className="bg-gray-100 dark:bg-[#0a0f1c] uppercase font-bold text-xs text-gray-900 dark:text-[#F0E6CA] transition-colors">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#F0E6CA]/5 transition-colors">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : users?.length === 0 ? (
                <tr>
                   <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No customers found.</td>
                </tr>
              ) : (
                users?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#0a0f1c]/50 transition-colors border-b border-gray-200 dark:border-[#F0E6CA]/5 last:border-0">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#0a0f1c] border border-gray-300 dark:border-[#F0E6CA]/20 flex items-center justify-center text-gray-700 dark:text-[#F0E6CA] font-bold transition-colors">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-900 dark:text-white transition-colors">{user.email}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit transition-colors ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20' 
                          : 'bg-gray-100 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-500/20'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2 text-gray-500 dark:text-gray-400 transition-colors">
                      <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
