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
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500">Manage your registered users</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 uppercase font-bold text-xs text-gray-700">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center">Loading...</td>
                </tr>
              ) : users?.length === 0 ? (
                <tr>
                   <td colSpan={3} className="px-6 py-8 text-center">No customers found.</td>
                </tr>
              ) : (
                users?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-900">{user.email}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
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
