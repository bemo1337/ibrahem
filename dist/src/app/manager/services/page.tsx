'use client';

import { useEffect, useState } from 'react';
import { Container, Button, Table, Alert, Modal, Form, Spinner, FormCheck } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { unionService } from '../../../services/api';
import { toast } from 'react-toastify';

interface Service {
  _id: string;
  serviceName: string;
  description: string;
  requirements: string[];
  isActive: boolean;
  createdAt: string;
}

interface ApiResponse {
  services: Service[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newService, setNewService] = useState({
    serviceName: '',
    description: '',
    requirements: ''
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await unionService.getServices();
      // The backend returns { services: Service[], totalPages, currentPage, total }
      setServices(response?.data?.services || []);
    } catch (err: any) {
      console.error('Error fetching services:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load services';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (serviceId: string, currentStatus: boolean) => {
    try {
      const response = await unionService.toggleServiceActive(serviceId);
      // Update the local state with the server's response
      setServices(services.map(service => 
        service._id === serviceId 
          ? { ...service, isActive: response.data.service.isActive } 
          : service
      ));
      toast.success(response.data.message);
    } catch (err: any) {
      console.error('Error toggling service status:', err);
      toast.error(err.response?.data?.message || 'Failed to update service status');
      // Revert the UI state on error
      setServices(services.map(service => 
        service._id === serviceId 
          ? { ...service, isActive: currentStatus } 
          : service
      ));
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!newService.serviceName.trim()) {
      setFormError('Service name is required');
      return;
    }

    try {
      setLoading(true);
      setFormError('');
      
      // Create the service
      await unionService.createService({
        serviceName: newService.serviceName,
        description: newService.description,
        requirements: newService.requirements
          .split('\n')
          .map(r => r.trim())
          .filter(r => r.length > 0)
      });
      
      // Refresh the services list
      await fetchServices();
      
      // Close the modal and show success message
      setShowCreateModal(false);
      setNewService({
        serviceName: '',
        description: '',
        requirements: ''
      });
      
      toast.success('Service created successfully');
      
    } catch (err: any) {
      console.error('Error creating service:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create service';
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceActive = async (serviceId: string, currentStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this service?`)) {
      return;
    }

    try {
      await unionService.toggleServiceActive(serviceId);
      fetchServices();
    } catch (err) {
      console.error('Error toggling service status:', err);
      alert('Failed to update service status');
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading services...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="m-0 text-dark fw-semibold">Services Management</h2>
        <div className="d-flex gap-3">
          <Button 
            variant="outline-secondary" 
            onClick={fetchServices}
            disabled={loading}
            className="px-3 py-2 d-flex align-items-center justify-content-center"
            style={{
              minWidth: '120px',
              transition: 'all 0.2s ease-in-out',
              border: '1px solid #dee2e6',
              background: 'white',
            }}
          >
            <i className={`fas fa-sync ${loading ? 'fa-spin' : ''} me-2`}></i>
            <span>Refresh</span>
          </Button>
          <Button 
            variant="primary" 
            onClick={() => router.push('/manager/services/create')}
            className="px-4 py-2 d-flex align-items-center justify-content-center"
            style={{
              minWidth: '160px',
              transition: 'all 0.2s ease-in-out',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <i className="fas fa-plus me-2"></i>
            <span>Add New Service</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex align-items-center">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading services...</p>
        </div>
      ) : services.length === 0 ? (
        <Alert variant="info">
          No services available at the moment
        </Alert>
      ) : (
        <div className="table-responsive border rounded-3 overflow-hidden">
          <Table hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="py-3 px-4 border-bottom-0 fw-semibold text-uppercase small text-muted">Service Name</th>
                <th className="py-3 px-4 border-bottom-0 fw-semibold text-uppercase small text-muted">Description</th>
                <th className="py-3 px-4 border-bottom-0 fw-semibold text-uppercase small text-muted">Requirements</th>
                <th className="py-3 px-4 border-bottom-0 fw-semibold text-uppercase small text-muted text-end">Created At</th>
                <th className="py-3 px-4 border-bottom-0 fw-semibold text-uppercase small text-muted text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service._id} className="border-top">
                  <td className="py-3 px-4 align-middle fw-medium text-dark">
                    {service.serviceName}
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <div className="text-muted" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '300px'
                    }}>
                      {service.description || 'No description'}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle">
                    {service.requirements && service.requirements.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {service.requirements.slice(0, 3).map((req, idx) => (
                          <span key={idx} className="badge bg-light text-dark border border-1 border-gray-300 px-2 py-1 rounded-pill small">
                            {req}
                          </span>
                        ))}
                        {service.requirements.length > 3 && (
                          <span className="badge bg-light text-muted border border-1 border-gray-300 px-2 py-1 rounded-pill small">
                            +{service.requirements.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted small">No requirements</span>
                    )}
                  </td>
                  <td className="py-3 px-4 align-middle text-end text-muted small">
                    <div className="d-flex flex-column">
                      <span>{new Date(service.createdAt).toLocaleDateString()}</span>
                      <span className="text-muted small">{new Date(service.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <div className="d-flex align-items-center justify-content-center">
                      <div className="position-relative" style={{ minWidth: '110px' }}>
                        <div className="d-flex align-items-center bg-light rounded-pill p-1">
                          <div className="form-check form-switch mb-0 d-flex align-items-center">
                            <input
                              type="checkbox"
                              className="form-check-input flex-shrink-0 m-0"
                              role="switch"
                              id={`toggle-${service._id}`}
                              checked={service.isActive}
                              onChange={() => handleToggleActive(service._id, service.isActive)}
                              style={{
                                width: '2.5em',
                                height: '1.4em',
                                cursor: 'pointer',
                                backgroundColor: service.isActive ? '#0d6efd' : '#e9ecef',
                                borderColor: service.isActive ? '#0c63e4' : '#ced4da',
                                boxShadow: 'none',
                                backgroundImage: 'none',
                                position: 'relative',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                margin: '0 0.5rem 0 0.25rem',
                              }}
                            />
                            <label 
                              htmlFor={`toggle-${service._id}`}
                              className={`form-check-label fw-medium ms-2 ${service.isActive ? 'text-primary' : 'text-muted'}`}
                              style={{
                                cursor: 'pointer',
                                userSelect: 'none',
                                whiteSpace: 'nowrap',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                letterSpacing: '0.01em',
                                transition: 'color 0.2s ease-in-out',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                backgroundColor: service.isActive ? 'rgba(13, 110, 253, 0.1)' : 'transparent',
                              }}
                            >
                              {service.isActive ? 'Active' : 'Inactive'}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Create Service Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Service</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateService}>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label>Service Name</Form.Label>
              <Form.Control
                type="text"
                value={newService.serviceName}
                onChange={(e) => setNewService({...newService, serviceName: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newService.description}
                onChange={(e) => setNewService({...newService, description: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Requirements (comma-separated)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newService.requirements}
                onChange={(e) => setNewService({...newService, requirements: e.target.value})}
                placeholder="e.g., ID copy, Certificate, etc."
              />
              <Form.Text className="text-muted">
                List the required documents or information, separated by commas
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Service
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
