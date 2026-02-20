'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Users, Shield, ShieldCheck, ShieldAlert, Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'

interface UserItem {
    id: string
    email: string
    role: string
    clinicId: string | null
    isActive: boolean
    createdAt: string
    lastLoginAt: string | null
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserItem[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [page, setPage] = useState(1)
    const limit = 20

    useEffect(() => {
        fetchUsers()
    }, [page, roleFilter])

    async function fetchUsers() {
        setLoading(true)
        try {
            const skip = (page - 1) * limit
            let url = `/users?skip=${skip}&take=${limit}`
            if (roleFilter) url += `&role=${roleFilter}`
            const res = await api.get<any>(url)
            setUsers(res.items || [])
            setTotal(res.meta?.total || 0)
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setLoading(false)
        }
    }

    async function toggleStatus(userId: string, currentActive: boolean) {
        try {
            await api.patch(`/users/${userId}/status?isActive=${!currentActive}`, {})
            fetchUsers()
        } catch (error) {
            console.error('Failed to toggle user status:', error)
            alert('Failed to update user status')
        }
    }

    async function deleteUser(userId: string, email: string) {
        if (!confirm(`Are you sure you want to delete ${email}? This action is irreversible.`)) return
        try {
            await api.delete(`/users/${userId}`)
            fetchUsers()
        } catch (error) {
            console.error('Failed to delete user:', error)
            alert('Failed to delete user')
        }
    }

    function getRoleIcon(role: string) {
        switch (role) {
            case 'SUPER_ADMIN': return <ShieldAlert className="w-4 h-4 text-red-500" />
            case 'CLINIC_ADMIN': return <ShieldCheck className="w-4 h-4 text-blue-500" />
            case 'DOCTOR': return <Shield className="w-4 h-4 text-green-500" />
            default: return <Users className="w-4 h-4 text-gray-500" />
        }
    }

    function getRoleBadge(role: string) {
        const styles: Record<string, string> = {
            'SUPER_ADMIN': 'bg-red-100 text-red-700',
            'CLINIC_ADMIN': 'bg-blue-100 text-blue-700',
            'DOCTOR': 'bg-green-100 text-green-700',
        }
        return styles[role] || 'bg-gray-100 text-gray-700'
    }

    const totalPages = Math.ceil(total / limit)

    const filteredUsers = search
        ? users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()))
        : users

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Global Users</h1>
                <p className="text-gray-500">Manage all platform users across clinics</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by email..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
                    value={roleFilter}
                    onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
                >
                    <option value="">All Roles</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="CLINIC_ADMIN">Clinic Admin</option>
                    <option value="DOCTOR">Doctor</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No users found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Login</th>
                                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-gray-900">{user.email}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                                                {getRoleIcon(user.role)}
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleStatus(user.id, user.isActive)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title={user.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    {user.isActive
                                                        ? <ToggleRight className="w-5 h-5 text-green-600" />
                                                        : <ToggleLeft className="w-5 h-5 text-gray-400" />
                                                    }
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user.id, user.email)}
                                                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                        <span className="text-sm text-gray-500">
                            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
