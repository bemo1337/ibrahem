'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

interface UnionUser {
  fullName: string;
  email: string;
  role: string;
}

interface Stats {
  pendingApprovals: number;
  activeJobs: number;
  totalMembers: number;
}

interface QuickAction {
  title: string;
  path: string;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UnionUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check authentication and authorization
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const userType = localStorage.getItem('userType');
    
    // If no token or not authorized as manager/staff, redirect to login
    if (!token || (role !== 'manager' && role !== 'staff' && userType !== 'manager')) {
      // Clear any existing auth data
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userType');
      localStorage.removeItem('user');
      
      router.push('/auth/login');
      return;
    }

    // Fetch dashboard data for the manager
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/union/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized');
          }
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        setUserInfo(data.userInfo);
        setStats(data.stats);
        
        // Process quick actions to ensure they have the correct path and filter out unwanted actions
        const processQuickActions = (actions) => {
          if (!actions || !Array.isArray(actions)) {
            return [
              { title: 'View Pending Registrations', path: '/manager/pending-registrations' },
              { title: 'Manage Services', path: '/manager/services' },
              { title: 'View Service Requests', path: '/manager/service-requests' }
            ];
          }
          
          return actions
            .filter(action => {
              const lowerTitle = action.title.toLowerCase();
              return ![
                'view report',
                'view reports',
                'manage union staff',
                'عرض التقرير',
                'التقارير',
                'إدارة موظفي النقابة',
                'إدارة الموظفين'
              ].some(term => lowerTitle.includes(term.toLowerCase()));
            })
            .map(action => ({
              ...action,
              // Ensure the path starts with /manager/
              path: action.path.startsWith('/manager/') ? action.path : 
                   (action.path.startsWith('/') ? `/manager${action.path}` : `/manager/${action.path}`)
            }));
        };
        
        setQuickActions(processQuickActions(data.quickActions));
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError('Failed to load dashboard data');
        
        // Redirect to login if unauthorized
        if (err.message === 'Unauthorized') {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <Container className="dashboard-container" dir="ltr">
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
    <Container className="dashboard-container" style={{ maxWidth: '1400px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm">
        <div>
          <h2 className="m-0 text-primary">Union Dashboard</h2>
          <p className="text-muted mb-0">Welcome back, {userInfo?.fullName || 'Admin'}</p>
        </div>
        <Button variant="outline-danger" onClick={handleLogout} className="d-flex align-items-center">
          <i className="bi bi-box-arrow-right me-2"></i>
          <span>Logout</span>
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {userInfo && (
        <>
          <Row className="mb-4 g-4">
            <Col md={12}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title className="mb-4">User Information</Card.Title>
                  <Row className="g-4">
                    <Col xs={12} md={4}>
                      <div className="p-3 bg-light rounded">
                        <h6 className="text-muted mb-2">Full Name</h6>
                        <p className="mb-0 fw-bold">{userInfo.fullName}</p>
                      </div>
                    </Col>
                    <Col xs={12} md={4}>
                      <div className="p-3 bg-light rounded">
                        <h6 className="text-muted mb-2">Email Address</h6>
                        <p className="mb-0">{userInfo.email}</p>
                      </div>
                    </Col>
                    <Col xs={12} md={4}>
                      <div className="p-3 bg-light rounded">
                        <h6 className="text-muted mb-2">Role</h6>
                        <p className="mb-0">
                          <span className={`badge bg-${userInfo.role === 'manager' ? 'primary' : 'info'}`}>
                            {userInfo.role === 'manager' ? 'Manager' : 'Staff'}
                          </span>
                        </p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4">
            <Col xs={12} lg={6}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title className="mb-4">Statistics</Card.Title>
                  <Row className="g-3">
                    <Col xs={12} md={4}>
                      <div className="stat-card">
                        <h3 className="text-primary">{stats?.pendingApprovals || 0}</h3>
                        <p className="text-muted mb-0">Pending Registrations</p>
                      </div>
                    </Col>
                    <Col xs={12} md={4}>
                      <div className="stat-card">
                        <h3 className="text-success">{stats?.activeJobs || 0}</h3>
                        <p className="text-muted mb-0">Active Services</p>
                      </div>
                    </Col>
                    <Col xs={12} md={4}>
                      <div className="stat-card">
                        <h3 className="text-info">{stats?.totalMembers || 0}</h3>
                        <p className="text-muted mb-0">Total Members</p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title className="mb-4">Quick Actions</Card.Title>
                  <div className="d-grid gap-3">
                    {quickActions.map((action, index) => (
                      <Button 
                        key={index} 
                        variant="outline-primary" 
                        className="d-flex align-items-center justify-content-between text-start py-2"
                        onClick={() => router.push(action.path)}
                      >
                        <span>{action.title}</span>
                        <i className="bi bi-arrow-right"></i>
                      </Button>
                    ))}
                    <Button 
                      variant="outline-success" 
                      className="d-flex align-items-center justify-content-between text-start py-2"
                      onClick={() => router.push('/manager/services/create')}
                    >
                      <span>Create New Service</span>
                      <i className="bi bi-plus-circle"></i>
                    </Button>
                    <Button 
                      variant="outline-info" 
                      className="d-flex align-items-center justify-content-between text-start py-2"
                      onClick={() => router.push('/manager/service-requests')}
                    >
                      <span>Manage Service Requests</span>
                      <i className="bi bi-list-task"></i>
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      className="d-flex align-items-center justify-content-between text-start py-2"
                      onClick={() => router.push('/manager/services')}
                    >
                      <span>View Available Services</span>
                      <i className="bi bi-grid"></i>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}
