'use client';

import { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Badge, Modal, Form, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Service {
  _id: string;
  serviceName: string;
  description: string;
  requirements: string[];
  createdBy: {
    fullName: string;
  };
}

export default function Services() {
  const router = useRouter();
  
  // State for services list and pagination
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // State for service request modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [requestLoading, setRequestLoading] = useState<boolean>(false);
  const [requestSuccess, setRequestSuccess] = useState<string>('');
  const [requestError, setRequestError] = useState<string>('');

  // Fetch services function
  const fetchServices = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/auth/login');
        return;
      }

      // Create axios instance with default headers
      const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Add token to request headers
      api.interceptors.request.use(config => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });

      // Handle responses and errors
      api.interceptors.response.use(
        response => response,
        error => {
          if (error.response?.status === 401) {
            // If unauthorized, remove token and redirect to login
            localStorage.removeItem('token');
            router.push('/auth/login?session=expired');
          }
          return Promise.reject(error);
        }
      );

      // Use the correct API endpoint for fetching active services
      const endpoint = 'users/services/active';
      console.log('Fetching active services from:', endpoint);
      
      const response = await api.get(endpoint, {
        params: { 
          page, 
          limit: 10 
        }
      });
      
      // Update the services list and pagination
      setServices(response.data.services || []);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(Number(response.data.currentPage) || 1);
    } catch (err: any) {
      console.error('Services error:', err);
      if (err.response?.status === 401) {
        console.error('Authentication error:', err.response?.data || 'No additional error details');
        // Token is invalid or expired
        localStorage.removeItem('token');
        // Redirect with specific error message
        const errorMessage = err.response?.data?.message || 'session_expired';
        router.push(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
        return;
      }
      setError('Failed to load available services: ' + (err.response?.data?.message || 'An error occurred'));
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial data fetch
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    fetchServices();
  }, [fetchServices, router]);

  const handleRequestService = async () => {
    if (!selectedService) return;
    
    setRequestLoading(true);
    setRequestError('');
    setRequestSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const api = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const endpoint = '/service-requests';
      console.log('Sending service request to:', endpoint);
      
      const response = await api.post(endpoint, { 
        service: selectedService._id,
        description: `Request for service: ${selectedService.serviceName}`
      });
      
      setRequestSuccess('Service request sent successfully');
      setShowModal(false);
      setSelectedService(null);
      
      // Refresh the services list
      fetchServices();
      
      // Show success message
      toast.success('Service request sent successfully');
      
      return response.data;
    } catch (err: any) {
      console.error('Error requesting service:', err);
      
      let errorMessage = 'An error occurred while sending the request';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message.includes('Network Error')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection';
      }
      
      setRequestError(errorMessage);
      toast.error(errorMessage);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/auth/login?session=expired');
      }
      console.error('Request service error:', err);
      setRequestError('An error occurred while sending the request');
    } finally {
      setRequestLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <Container className="page-container rtl">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading services...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Available Services</h2>
        <Button variant="outline-primary" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {services.length === 0 ? (
        <Alert variant="info">No services available at the moment</Alert>
      ) : (
        <>
          <Row>
            {services.map((service) => (
              <Col key={service._id} md={6} lg={4} className="mb-4">
                <Card className="h-100 service-card card-hover">
                  <Card.Body>
                    <Card.Title>{service.serviceName}</Card.Title>
                    <Card.Text>{service.description}</Card.Text>
                    
                    {service.requirements.length > 0 && (
                      <div className="mb-3">
                        <strong>Requirements:</strong>
                        <ul className="ps-3">
                          {service.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="text-muted mb-3">
                      <small>Service Provider: {service.createdBy?.fullName || 'Unknown'}</small>
                    </div>
                    
                    <Button 
                      variant="primary" 
                      className="w-100"
                      onClick={() => {
                        setSelectedService(service);
                        setShowModal(true);
                      }}
                    >
                      طلب الخدمة
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="outline-secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="me-2"
              >
                Previous
              </Button>
              
              <div className="d-flex mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "primary" : "outline-primary"}
                    onClick={() => handlePageChange(page)}
                    className="mx-1"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline-secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ms-2"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* نافذة منبثقة لتأكيد طلب الخدمة */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Service Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {requestSuccess && <Alert variant="success">{requestSuccess}</Alert>}
          {requestError && <Alert variant="danger">{requestError}</Alert>}
          
          {selectedService && (
            <>
              <p>Are you sure you want to request the following service?</p>
              <p><strong>Service Name:</strong> {selectedService.serviceName}</p>
              <p><strong>Description:</strong> {selectedService.description}</p>
              
              {selectedService.requirements.length > 0 && (
                <div>
                  <strong>Requirements:</strong>
                  <ul className="ps-3">
                    {selectedService.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleRequestService}
            disabled={requestLoading}
          >
            {requestLoading ? 'Sending...' : 'Confirm Request'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
