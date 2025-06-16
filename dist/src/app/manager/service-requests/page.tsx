'use client';

import { useEffect, useState } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Alert, 
  Table, 
  Badge, 
  Modal, 
  Form,
  Pagination 
} from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { unionService } from '../../../services/api';

interface ServiceRequest {
  _id: string;
  service?: {
    serviceName: string;
    description: string;
  };
  serviceName?: string;
  description?: string;
  user?: {
    fullName: string;
    email: string;
  };
  requestedBy?: {
    fullName: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  requestedAt?: string;
  createdAt?: string;
  processedAt?: string;
  rejectionReason?: string;
}

interface ServiceRequestsResponse {
  data: ServiceRequest[];
  page: number;
  pages: number;
  total: number;
}

function ServiceRequests() {
  const router = useRouter();
  
  // Request list state
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal state for approve/reject actions
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Get badge variant based on status
  const getStatusBadgeVariant = (status: 'pending' | 'approved' | 'rejected') => {
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

  // Get status display text
  const getStatusText = (status: 'pending' | 'approved' | 'rejected') => {
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

  useEffect(() => {
    // Check authentication and authorization
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || (userRole !== 'manager' && userRole !== 'staff')) {
      router.push('/auth/login');
      return;
    }

    // Fetch service requests
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching service requests with filter:', statusFilter, 'page:', currentPage);
        
        const response = await unionService.getServiceRequests(statusFilter, currentPage);
        console.log('Service requests response:', response);
        
        // The API service now handles the transformation
        const responseData = response.data;
        
        if (!responseData || !Array.isArray(responseData.data)) {
          throw new Error('Invalid response format from server');
        }
        
        setRequests(responseData.data);
        setTotalPages(responseData.pages || 1);
        setCurrentPage(Number(responseData.page) || 1);
        
        // Log the first request for debugging
        if (responseData.data.length > 0) {
          console.log('First request item:', responseData.data[0]);
        }
      } catch (err: any) {
        console.error('Service requests error:', err);
        setError('Failed to load service requests');
        
        // Redirect to login if unauthorized
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [router, currentPage, statusFilter]);

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    
    try {
      await unionService.approveServiceRequest(selectedRequest._id);
      setActionSuccess('Request approved successfully');
      
      // Update the list after approval
      setRequests(prev => 
        prev.map(req => 
          req._id === selectedRequest._id 
            ? { ...req, status: 'approved', processedAt: new Date().toISOString() } 
            : req
        )
      );
      
      // Close the modal after 2 seconds
      setTimeout(() => {
        setShowModal(false);
        setSelectedRequest(null);
        setActionType(null);
      }, 2000);
    } catch (err: any) {
      console.error('Approve request error:', err);
      setActionError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setActionType('reject');
    setShowModal(true);
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    
    console.log('Rejecting request with ID:', selectedRequest._id, 'Reason:', rejectionReason);
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    
    try {
      console.log('Calling rejectServiceRequest API...');
      const response = await unionService.rejectServiceRequest(selectedRequest._id, rejectionReason);
      console.log('Reject service request response:', response);
      
      setActionSuccess('Request rejected successfully');
      
      // Update the list after rejection
      setRequests(prev => 
        prev.map(req => 
          req._id === selectedRequest._id 
            ? { 
                ...req, 
                status: 'rejected', 
                processedAt: new Date().toISOString(),
                rejectionReason: rejectionReason
              } 
            : req
        )
      );
      
      // Close the modal after 2 seconds
      setTimeout(() => {
        setShowModal(false);
        setSelectedRequest(null);
        setActionType(null);
        setRejectionReason('');
      }, 2000);
    } catch (err: any) {
      console.error('Reject request error:', err);
      setActionError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Container className="page-container" style={{ maxWidth: '1400px' }} dir="ltr">
        <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm">
          <h2 className="m-0 text-primary">Service Requests</h2>
          <Button variant="outline-primary" onClick={() => router.push('/manager/dashboard')} className="d-flex align-items-center">
            <span>Back to Dashboard</span>
            <i className="bi bi-arrow-right ms-2"></i>
          </Button>
        </div>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading service requests...</p>
        </div>
      </Container>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container className="page-container" style={{ maxWidth: '1400px' }} dir="ltr">
        <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm">
          <h2 className="m-0 text-primary">Service Requests</h2>
          <Button variant="outline-primary" onClick={() => router.push('/manager/dashboard')} className="d-flex align-items-center">
            <span>Back to Dashboard</span>
            <i className="bi bi-arrow-right ms-2"></i>
          </Button>
        </div>
        <Alert variant="danger">
          <Alert.Heading>Error loading service requests</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="page-container" style={{ maxWidth: '1400px' }} dir="ltr">
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm">
        <h2 className="m-0 text-primary">Service Requests</h2>
        <Button variant="outline-primary" onClick={() => router.push('/manager/dashboard')} className="d-flex align-items-center">
          <span>Back to Dashboard</span>
          <i className="bi bi-arrow-right ms-2"></i>
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Card.Title className="mb-3">Filter Requests</Card.Title>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="d-block mb-2">Request Status</Form.Label>
                <Form.Select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {requests.length === 0 ? (
        <Alert variant="info" className="mt-4">No service requests found</Alert>
      ) : (
        <Card className="mb-4">
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Service</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Requested At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request, index) => (
                  <tr key={request._id}>
                    <td>{(currentPage - 1) * 10 + index + 1}</td>
                    <td>
                      <div><strong>{(request.service?.serviceName || request.serviceName || 'N/A')}</strong></div>
                      <small className="text-muted d-block">
                        {(request.service?.description || request.description || '').substring(0, 50)}
                        {(request.service?.description || request.description || '').length > 50 ? '...' : ''}
                      </small>
                    </td>
                    <td>
                      <div>{request.requestedBy?.fullName || request.user?.fullName || 'N/A'}</div>
                      <small className="text-muted d-block">{request.requestedBy?.email || request.user?.email || ''}</small>
                    </td>
                    <td>
                      <Badge bg={getStatusBadgeVariant(request.status)}>
                        {getStatusText(request.status)}
                      </Badge>
                      {request.status === 'rejected' && request.rejectionReason && (
                        <div className="text-danger small mt-1">
                          <strong>Reason:</strong> {request.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>
                      {request.requestedAt || request.createdAt 
                        ? new Date(request.requestedAt || request.createdAt || '').toLocaleString() 
                        : 'N/A'}
                    </td>
                    <td>
                      {request.status === 'pending' && (
                        <div className="d-flex gap-2">
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType('approve');
                              setShowModal(true);
                            }}
                            className="d-flex align-items-center"
                          >
                            <i className="bi bi-check-lg me-2"></i>
                            <span>Approve</span>
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType('reject');
                              setShowModal(true);
                            }}
                            className="d-flex align-items-center"
                          >
                            <i className="bi bi-x-lg me-2"></i>
                            <span>Reject</span>
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.Prev 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  />
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (currentPage > 3 && currentPage <= totalPages - 2) {
                      pageNum = currentPage - 2 + i;
                    } else if (currentPage > totalPages - 3) {
                      pageNum = totalPages - 4 + i;
                    }
                    return (
                      <Pagination.Item 
                        key={pageNum} 
                        active={pageNum === currentPage}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  })}
                  <Pagination.Next 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  />
                </Pagination>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {actionError && (
            <Alert variant="danger" className="mb-3">
              {actionError}
            </Alert>
          )}
          {actionSuccess ? (
            <Alert variant="success" className="mb-3">
              {actionSuccess}
            </Alert>
          ) : (
            <>
              {actionType === 'reject' && (
                <Form.Group className="mb-3">
                  <Form.Label>Reason for Rejection</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection"
                    required
                  />
                </Form.Group>
              )}
              {actionType === 'approve' && (
                <p>Are you sure you want to approve this request?</p>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowModal(false);
              setActionType(null);
              setActionError('');
              setActionSuccess('');
              setRejectionReason('');
            }}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          {!actionSuccess && actionType && (
            <Button 
              variant={actionType === 'approve' ? 'success' : 'danger'}
              onClick={actionType === 'approve' ? handleApproveRequest : handleRejectRequest}
              disabled={actionLoading || (actionType === 'reject' && !rejectionReason.trim())}
            >
              {actionLoading ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ServiceRequests;
