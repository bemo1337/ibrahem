'use client';

import { useState } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    loginType: 'user' // 'user' or 'manager'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value } = target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Determine the correct API endpoint based on login type
      const endpoint = formData.loginType === 'user' 
        ? 'http://localhost:5000/api/users/login'
        : 'http://localhost:5000/api/shared/login';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          // loginType is not needed in the request body as the endpoint determines the type
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save the token and user info to local storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userType', formData.loginType);
      // Also save userRole for compatibility with dashboard checks
      if (data.user?.role) {
        localStorage.setItem('userRole', data.user.role);
      } else {
        localStorage.setItem('userRole', formData.loginType === 'user' ? 'engineer' : 'manager');
      }
      
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect based on user type
      if (formData.loginType === 'user') {
        router.push('/dashboard');
      } else {
        // For union users (managers/staff), use the dashboardPath from the response
        // or default to /manager/dashboard
        const redirectPath = data.dashboardPath || '/manager/dashboard';
        router.push(redirectPath);
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="auth-container" dir="ltr" style={{ textAlign: 'left' }}>
      <div className="auth-card">
        <h1 className="text-center mb-4">Engineers Management System</h1>
        <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Login</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" dir="ltr" style={{ textAlign: 'left' }}>
              <Form.Label>Account Type</Form.Label>
              <Form.Select
                name="loginType"
                value={formData.loginType}
                onChange={handleChange}
                className="form-select"
              >
                <option value="user">Engineer/User</option>
                <option value="manager">Manager/Staff</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" dir="ltr" style={{ textAlign: 'left' }}>
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" dir="ltr" style={{ textAlign: 'left' }}>
              <div className="d-flex justify-content-between">
                <Form.Label>Password</Form.Label>
                <Link href="/auth/forgot-password" className="text-decoration-none">
                  Forgot Password?
                </Link>
              </div>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>
          
          <div className="text-center mt-3">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-decoration-none">
              Create New Account
            </Link>
          </div>
        </Card.Body>
      </Card>
      </div>
    </Container>
  );
}
