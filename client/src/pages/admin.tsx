import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Users, Building } from "lucide-react";

interface User {
  id: number;
  username: string;
  role: "admin" | "user";
  companyId: number | null;
  createdAt: string;
}

interface Company {
  id: number;
  name: string;
  createdAt: string;
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user");
  const [newUserCompany, setNewUserCompany] = useState<string>('');
  const [newCompanyName, setNewCompanyName] = useState('');

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  // Fetch companies
  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ['/api/admin/companies'],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; role: string; companyId: number | null }) => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setNewUsername('');
      setNewPassword('');
      setNewUserRole('user');
      setNewUserCompany('');
      toast({ title: "User created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update user company mutation
  const updateUserCompanyMutation = useMutation({
    mutationFn: async ({ userId, companyId }: { userId: number; companyId: number | null }) => {
      const res = await fetch(`/api/admin/users/${userId}/company`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });
      if (!res.ok) throw new Error('Failed to update user company');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User company updated" });
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: "admin" | "user" }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Failed to update user role');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User role updated" });
    },
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create company');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
      setNewCompanyName('');
      toast({ title: "Company created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete company');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
      toast({ title: "Company deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      toast({ title: "Error", description: "Username and password are required", variant: "destructive" });
      return;
    }
    createUserMutation.mutate({
      username: newUsername,
      password: newPassword,
      role: newUserRole,
      companyId: newUserCompany ? parseInt(newUserCompany) : null,
    });
  };

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName) {
      toast({ title: "Error", description: "Company name is required", variant: "destructive" });
      return;
    }
    createCompanyMutation.mutate(newCompanyName);
  };

  const getCompanyName = (companyId: number | null) => {
    if (!companyId) return "No company";
    const company = companies.find(c => c.id === companyId);
    return company?.name || "Unknown";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users and companies</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Companies Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Companies
              </CardTitle>
              <CardDescription>Manage company accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create Company Form */}
              <form onSubmit={handleCreateCompany} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <Label htmlFor="companyName">Create New Company</Label>
                <div className="flex gap-2">
                  <Input
                    id="companyName"
                    placeholder="Company name"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                  <Button type="submit" disabled={createCompanyMutation.isPending}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </form>

              {/* Companies List */}
              <div className="space-y-2">
                {companiesLoading ? (
                  <p className="text-gray-500">Loading companies...</p>
                ) : companies.length === 0 ? (
                  <p className="text-gray-500">No companies yet</p>
                ) : (
                  companies.map(company => (
                    <div key={company.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(company.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete company "${company.name}"?`)) {
                            deleteCompanyMutation.mutate(company.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Users Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users
              </CardTitle>
              <CardDescription>Manage user accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create User Form */}
              <form onSubmit={handleCreateUser} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <Label>Create New User</Label>
                <Input
                  placeholder="Username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Select value={newUserRole} onValueChange={(value: "user" | "admin") => setNewUserRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newUserCompany} onValueChange={setNewUserCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No company</SelectItem>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={createUserMutation.isPending} className="w-full">
                  <Plus className="w-4 h-4 mr-1" />
                  Create User
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <p className="text-gray-500">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-gray-500">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Username</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Company</th>
                      <th className="text-left p-3">Created</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{user.username}</td>
                        <td className="p-3">
                          <Select
                            value={user.role}
                            onValueChange={(value: "admin" | "user") => {
                              updateUserRoleMutation.mutate({ userId: user.id, role: value });
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3">
                          <Select
                            value={user.companyId?.toString() || ""}
                            onValueChange={(value) => {
                              updateUserCompanyMutation.mutate({
                                userId: user.id,
                                companyId: value ? parseInt(value) : null
                              });
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder={getCompanyName(user.companyId)} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No company</SelectItem>
                              {companies.map(company => (
                                <SelectItem key={company.id} value={company.id.toString()}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete user "${user.username}"?`)) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
