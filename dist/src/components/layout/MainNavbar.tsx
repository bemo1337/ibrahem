'use client';

import { useEffect, useState } from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

// Client-side only component to prevent hydration mismatch
const ClientOnlyNavbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Set mounted state after component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true);
    
    // Check for authentication token
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
    }
    setIsLoggedIn(false);
    setUserRole(null);
    router.push('/');
  };

  // Don't render anything on the server
  if (!isMounted) {
    return (
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm py-2" dir="ltr" />
    );
  }

  // Check if the current page is an authentication page
  const isAuthPage = pathname?.includes('/auth/');

  // Don't show the navigation bar on authentication pages
  if (isAuthPage) {
    return null;
  }

  return (
    <Navbar 
      bg="dark" 
      variant="dark" 
      expand="lg" 
      className="shadow-sm py-2" 
      dir="ltr"
      as="div"
    >
      <Container fluid="lg">
        <Navbar.Brand as="div" className="me-4">
          <Link href="/" className="text-white text-decoration-none">
            Syndicate Management System
          </Link>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Item className="mx-2">
              <Link href="/" className={`nav-link ${pathname === '/' ? 'active fw-bold' : ''}`}>
                Home
              </Link>
            </Nav.Item>
            
            {isLoggedIn && userRole === 'user' && (
              <>
                <Nav.Item className="mx-2">
                  <Link 
                    href="/dashboard" 
                    className={`nav-link ${pathname === '/dashboard' ? 'active fw-bold' : ''}`}
                  >
                    Dashboard
                  </Link>
                </Nav.Item>
                <Nav.Item className="mx-2">
                  <Link 
                    href="/services" 
                    className={`nav-link ${pathname?.includes('/services') ? 'active fw-bold' : ''}`}
                  >
                    Services
                  </Link>
                </Nav.Item>
              </>
            )}
            
            {isLoggedIn && (userRole === 'manager' || userRole === 'staff') && (
              <>
                <Nav.Item className="mx-2">
                  <Link 
                    href="/manager/dashboard" 
                    className={`nav-link ${pathname === '/manager/dashboard' ? 'active fw-bold' : ''}`}
                  >
                    Dashboard
                  </Link>
                </Nav.Item>
                <Nav.Item className="mx-2">
                  <Link 
                    href="/manager/service-requests" 
                    className={`nav-link ${pathname === '/manager/service-requests' ? 'active fw-bold' : ''}`}
                  >
                    Service Requests
                  </Link>
                </Nav.Item>
                <Nav.Item className="mx-2">
                  <Link 
                    href="/manager/pending-registrations" 
                    className={`nav-link ${pathname === '/manager/pending-registrations' ? 'active fw-bold' : ''}`}
                  >
                    Registration Requests
                  </Link>
                </Nav.Item>
              </>
            )}
          </Nav>
          
          <Nav className="mt-3 mt-lg-0 d-flex align-items-center">
            {!isLoggedIn ? (
              <>
                <Nav.Item className="p-0 me-2">
                  <Link href="/auth/login" className="text-decoration-none">
                    <Button variant="outline-light" className="px-3">
                      Login
                    </Button>
                  </Link>
                </Nav.Item>
                <Nav.Item className="p-0">
                  <Link href="/auth/register" className="text-decoration-none">
                    <Button variant="primary" className="px-3">
                      Register
                    </Button>
                  </Link>
                </Nav.Item>
              </>
            ) : (
              <Button 
                variant="outline-light" 
                onClick={handleLogout} 
                className="px-3"
              >
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default function MainNavbar() {
  return <ClientOnlyNavbar />;
}
