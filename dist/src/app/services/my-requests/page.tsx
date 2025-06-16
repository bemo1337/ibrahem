'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Badge } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { userService } from '../../../services/api';

interface ServiceRequest {
  _id: string;
  service: {
    serviceName: string;
    description: string;
  };
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export default function MyRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Fetch user requests
    const fetchMyRequests = async () => {
      try {
        // هذه الدالة ستحتاج إلى إضافتها في خدمات API
        const response = await fetch('http://localhost:5000/api/users/my-requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load requests');
        }
        
        const data = await response.json();
        setRequests(data.data || []);
      } catch (err: any) {
        console.error('My requests error:', err);
        setError('Failed to load your requests');
        
        // If error is due to authentication, redirect to login page
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyRequests();
  }, [router]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Container className="page-container rtl">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading your requests...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Requests</h2>
        <Button variant="outline-primary" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {requests.length === 0 ? (
        <Alert variant="info">You haven't submitted any service requests yet</Alert>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Service Name</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Processed Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request, index) => (
                <tr key={request._id}>
                  <td>{index + 1}</td>
                  <td>{request.service.serviceName}</td>
                  <td>{new Date(request.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/(\d+)\/(\d+)\/(\d+)/, '$3/$1/$2')}</td>
                  <td>
                    <Badge bg={getStatusBadgeVariant(request.status)} className="status-badge">
                      {getStatusText(request.status)}
                    </Badge>
                  </td>
                  <td>
                    {request.status !== 'pending' && request.updatedAt
                      ? new Date(request.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/(\d+)\/(\d+)\/(\d+)/, '$3/$1/$2')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      
      <div className="mt-4">
        <Button variant="primary" onClick={() => router.push('/services')}>
          New Service Request
        </Button>
      </div>
    </Container>
  );
}
