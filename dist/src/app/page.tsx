'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import Link from 'next/link';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check for authentication token
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);
    }
  }, []);

  return (
    <Container className="page-container" dir="ltr">
      <div className="text-center py-5">
        <h1 className="display-4 mb-4">Engineers Syndicate Digital Management System</h1>
        <p className="lead mb-5">An integrated platform for managing syndicate services and engineers' requests</p>
        
        {!isLoggedIn ? (
          <Row className="justify-content-center">
            <Col md={6} lg={4} className="mb-4">
              <Card className="h-100 card-hover">
                <Card.Body className="d-flex flex-column">
                  <Card.Title>Login</Card.Title>
                  <Card.Text>
                    If you already have an account, log in to access your dashboard.
                  </Card.Text>
                  <div className="mt-auto">
                    <Link href="/auth/login">
                      <Button variant="primary" className="w-100">Login</Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={4} className="mb-4">
              <Card className="h-100 card-hover">
                <Card.Body className="d-flex flex-column">
                  <Card.Title>About the System</Card.Title>
                  <Card.Text>
                    Learn more about the Digital Syndicate System and how to use it to enhance your experience.
                  </Card.Text>
                  <div className="mt-auto">
                    <Button variant="outline-secondary" className="w-100">Learn More</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Card className="card-hover">
                <Card.Body className="text-center">
                  <h2>Welcome Back!</h2>
                  <Card.Text className="mb-4">
                    You are already logged in. Go to your dashboard.
                  </Card.Text>
                  <div className="mt-auto">
                    <Link href={userRole === 'manager' || userRole === 'staff' ? '/manager/dashboard' : '/dashboard'}>
                      <Button variant="primary" className="w-100">Dashboard</Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
        
        <div className="mt-5 pt-5">
          <h2 className="mb-4">System Features</h2>
          <Row>
            <Col md={4} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <h3 className="h5">Request Management</h3>
                  <p>Submit and track service requests easily and conveniently.</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <h3 className="h5">E-Services</h3>
                  <p>Benefit from our integrated electronic services anytime, anywhere.</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <h3 className="h5">Request Tracking</h3>
                  <p>Track the status of your submitted requests with an easy-to-use interface.</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </Container>
  );
}
