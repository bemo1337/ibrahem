'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
const userService = {
  getDashboard: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/users/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    
    return response.json();
  },
};

interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  idNumber: string;
  licenseID: string;
  gender: string;
  major: string;
  status: string;
  membershipJoinDate: string;
  rank: string;
}

interface Stats {
  activeJobs: number;
  completedJobs: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    // Parse user data
    let user: UserInfo;
    try {
      user = JSON.parse(userData);
      setUserInfo(user);
    } catch (err) {
      console.error('Error parsing user data:', err);
      localStorage.removeItem('user');
      router.push('/auth/login');
      return;
    }

    // Fetch dashboard data
    const fetchDashboard = async () => {
      try {
        const response = await userService.getDashboard();
        // Update with fresh data if available, otherwise use stored data
        setUserInfo(prev => ({
          ...prev,
          ...(response.data?.userInfo || {})
        }));
        setStats(response.data?.stats || { activeJobs: 0, completedJobs: 0 });
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError('Failed to load dashboard data');
        
        // If unauthorized, clear storage and redirect to login
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
      case 'on-hold':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <Container className="dashboard-container ltr">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading data...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="dashboard-container ltr py-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Dashboard</h2>
          <p className="text-muted small mb-0">Welcome back, {userInfo?.fullName || 'User'}</p>
        </div>
        <Button 
          variant="outline-danger" 
          onClick={handleLogout}
          className="d-flex align-items-center"
        >
          <i className="bi bi-box-arrow-right me-2"></i> Logout
        </Button>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {userInfo && (
        <>
          {/* User Info Card */}
          <Card className="shadow-sm mb-4 border-0">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <Badge bg={getStatusBadgeVariant(userInfo.status)} className="px-3 py-2 align-self-start">
                  {userInfo.status === 'approved' ? 'Active' : 
                   userInfo.status === 'pending' || userInfo.status === 'on-hold' ? 'Under Review' : 'Inactive'}
                </Badge>
                <div className="text-end">
                  <h5 className="fw-bold text-dark mb-2">User Information</h5>
                  <p className="text-muted small mb-0">Your profile details and status</p>
                </div>
              </div>
              
              <Row className="g-4">
                <Col md={6} className="text-start">
                  <div className="info-item">
                    <span className="text-muted small d-block mb-1">Major</span>
                    <p className="mb-3 fw-medium">{userInfo.major}</p>
                  </div>
                  <div className="info-item">
                    <span className="text-muted small d-block mb-1">Email Address</span>
                    <p className="mb-3">{userInfo.email}</p>
                  </div>
                  <div className="info-item">
                    <span className="text-muted small d-block mb-1">Date of Birth</span>
                    <p className="mb-3">{new Date(userInfo.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="info-item">
                    <span className="text-muted small d-block mb-1">Gender</span>
                    <p className="mb-0">{
                      userInfo.gender?.toLowerCase() === 'male' ? 'Male' : 
                      userInfo.gender?.toLowerCase() === 'female' ? 'Female' : 
                      userInfo.gender || 'Not specified'
                    }</p>
                  </div>
                </Col>
                <Col md={6} className="text-start">
                  <div className="info-item">
                    <span className="text-muted small d-block mb-1">Full Name</span>
                    <p className="mb-3 fw-medium">{userInfo.fullName}</p>
                  </div>
                  <div className="info-item">
                    <span className="text-muted small d-block mb-1">ID Number</span>
                    <p className="mb-3">{userInfo.idNumber}</p>
                  </div>
                  <div className="info-item">
                    <span className="text-muted small d-block mb-1">License ID</span>
                    <p className="mb-0">{userInfo.licenseID || 'N/A'}</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Stats & Quick Links */}
          <Row className="g-4">
            {/* Quick Links */}
            <Col lg={6} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="p-4">
                  <h5 className="fw-bold text-dark mb-4 text-start">Quick Actions</h5>
                  <div className="d-flex flex-column gap-3 w-100">
                    <Button 
                      variant="outline-primary" 
                      onClick={() => router.push('/services')}
                      className="d-flex align-items-center py-3 px-4 rounded-3 w-100"
                      style={{ textAlign: 'left' }}
                    >
                      <i className="bi bi-grid me-3"></i>
                      <span className="flex-grow-1">Browse Available Services</span>
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => router.push('/services/my-requests')}
                      className="d-flex align-items-center py-3 px-4 rounded-3 w-100"
                      style={{ textAlign: 'left' }}
                    >
                      <i className="bi bi-list-check me-3"></i>
                      <span className="flex-grow-1">My Service Requests</span>
                    </Button>
                    <Button 
                      variant="outline-info" 
                      onClick={() => router.push('/help-support')}
                      className="d-flex align-items-center py-3 px-4 rounded-3 w-100"
                      style={{ textAlign: 'left' }}
                    >
                      <i className="bi bi-question-circle me-3"></i>
                      <span className="flex-grow-1">Help & Support</span>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Statistics */}
            <Col lg={6} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="p-4">
                  <h5 className="fw-bold text-dark mb-4 text-start">Service Statistics</h5>
                  <div className="d-flex h-100">
                    <div className="w-50 d-flex flex-column align-items-center justify-content-center border-end">
                      <h3 className="text-primary fw-bold mb-1">{stats?.activeJobs || 0}</h3>
                      <p className="mb-1 text-muted small">Active Services</p>
                    </div>
                    <div className="w-50 d-flex flex-column align-items-center justify-content-center">
                      <h3 className="text-success fw-bold mb-1">{stats?.completedJobs || 0}</h3>
                      <p className="mb-1 text-muted small">Completed Requests</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
      
      {/* Custom Styles */}
      <style jsx>{`        
        .info-item {
          padding: 0.75rem 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .info-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1) !important;
        }
        .btn {
          transition: all 0.2s ease;
        }
      `}</style>
    </Container>
  );
}
