'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AdminUsersPage() {
  const router = useRouter();
  const [data, setData] = useState<any>({ users: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    api.get<any>(`/admin/users?${params}`)
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    setPage(1);
    setSearch('');
  };

  const roleBadge = (role: string) =>
    role === 'ADMIN'
      ? 'bg-purple-500/15 text-purple-400'
      : 'bg-dark-600 text-dark-200';

  const planBadge = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-dark-600 text-dark-200',
      PRO: 'bg-primary-500/15 text-primary-400',
      AGENCY: 'bg-accent-500/15 text-accent-400',
    };
    return colors[plan] || 'bg-dark-600 text-dark-200';
  };

  const planPrice: Record<string, string> = { FREE: '$0', PRO: '$29', AGENCY: '$99' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-dark-300 mt-1">{data.total} total users</p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-72 pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-sm text-white placeholder:text-dark-400 focus:outline-none focus:border-primary-500/50 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl text-sm transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {['FREE', 'PRO', 'AGENCY'].map((plan) => {
          const count = data.users.filter((u: any) => u.plan === plan).length;
          return (
            <div key={plan} className="bg-dark-800 border border-white/5 rounded-xl p-4">
              <p className="text-xs text-dark-400 uppercase tracking-wider">{plan} Plan</p>
              <p className="text-xl font-bold text-white mt-1">{count}</p>
              <p className="text-xs text-dark-400 mt-0.5">{planPrice[plan]}/mo each</p>
            </div>
          );
        })}
        <div className="bg-dark-800 border border-white/5 rounded-xl p-4">
          <p className="text-xs text-dark-400 uppercase tracking-wider">Active Subs</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">
            {data.users.filter((u: any) => u.subscription?.status === 'ACTIVE').length}
          </p>
          <p className="text-xs text-dark-400 mt-0.5">on this page</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-dark-300">
          <div className="inline-block w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Loading users...</p>
        </div>
      ) : data.users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-dark-300">No users found{search ? ` matching "${search}"` : ''}.</p>
          {search && (
            <button onClick={clearSearch} className="text-primary-400 hover:text-primary-300 text-sm mt-2 transition-colors">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3.5 px-5 font-medium text-dark-300">User</th>
                    <th className="text-left py-3.5 px-5 font-medium text-dark-300">Role</th>
                    <th className="text-left py-3.5 px-5 font-medium text-dark-300">Plan</th>
                    <th className="text-left py-3.5 px-5 font-medium text-dark-300 text-center">Posts</th>
                    <th className="text-left py-3.5 px-5 font-medium text-dark-300 text-center">Accounts</th>
                    <th className="text-left py-3.5 px-5 font-medium text-dark-300 text-center">Tickets</th>
                    <th className="text-left py-3.5 px-5 font-medium text-dark-300">Status</th>
                    <th className="text-left py-3.5 px-5 font-medium text-dark-300">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user: any) => (
                    <tr
                      key={user.id}
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-white group-hover:text-primary-400 transition-colors">{user.name}</p>
                            <p className="text-xs text-dark-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${planBadge(user.plan)}`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center text-dark-200">
                        {user._count?.posts ?? '—'}
                      </td>
                      <td className="py-3.5 px-5 text-center text-dark-200">
                        {user._count?.accounts ?? '—'}
                      </td>
                      <td className="py-3.5 px-5 text-center text-dark-200">
                        {user._count?.tickets ?? '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          user.subscription?.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : user.subscription?.status === 'CANCELED'
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-dark-600 text-dark-300'
                        }`}>
                          {user.subscription?.status || 'No sub'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-dark-300 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-dark-300">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-dark-300">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= data.total}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
