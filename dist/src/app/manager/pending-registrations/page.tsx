'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Badge, Modal, Form, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { unionService } from '../../../services/api';

interface Engineer {
  _id: string;
  fullName: string;
  email: string;
  idNumber: string;
  licenseID: string;
  major: string;
  status: string;
  dateOfBirth: string;
}

export default function PendingRegistrations() {
  const router = useRouter();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state for approve/reject actions
  const [showModal, setShowModal] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    // Check authentication and authorization
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || (userRole !== 'manager' && userRole !== 'staff')) {
      router.push('/auth/login');
      return;
    }

    // Fetch pending registrations
    const fetchPendingRegistrations = async () => {
      try {
        const response = await unionService.getPendingRegistrations();
        // The backend returns { users: Engineer[] } but we need just the array
        setEngineers(response.data?.users || []);
      } catch (err: any) {
        console.error('Pending registrations error:', err);
        setError('Failed to load pending registration requests');
        
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

    fetchPendingRegistrations();
  }, [router]);

  const handleApproveClick = (engineer: Engineer) => {
    setSelectedEngineer(engineer);
    setActionType('approve');
    setRejectReason('');
    setActionError('');
    setActionSuccess('');
    setShowModal(true);
  };

  const handleRejectClick = (engineer: Engineer) => {
    setSelectedEngineer(engineer);
    setActionType('reject');
    setRejectReason('');
    setActionError('');
    setActionSuccess('');
    setShowModal(true);
  };

  const handleApproveEngineer = async () => {
    if (!selectedEngineer) return;
    
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    
    try {
      await unionService.approveEngineer(selectedEngineer._id);
      setActionSuccess('Engineer approved successfully');
      
      // Update the list after approval
      setEngineers(prev => 
        prev.filter(eng => eng._id !== selectedEngineer._id)
      );
      
      // Close the modal after 2 seconds
      setTimeout(() => {
        setShowModal(false);
        setSelectedEngineer(null);
        setActionType(null);
      }, 2000);
    } catch (err: any) {
      console.error('Approve engineer error:', err);
      setActionError(err.response?.data?.message || 'Failed to approve engineer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectEngineer = async () => {
    if (!selectedEngineer) return;
    
    if (!rejectReason.trim()) {
      setActionError('Please enter a rejection reason');
      return;
    }
    
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    
    try {
      await unionService.rejectEngineer(selectedEngineer._id, rejectReason);
      setActionSuccess('Engineer rejected successfully');
      
      // Update the list after rejection
      setEngineers(prev => 
        prev.filter(eng => eng._id !== selectedEngineer._id)
      );
      
      // Close the modal after 2 seconds
      setTimeout(() => {
        setShowModal(false);
        setSelectedEngineer(null);
        setActionType(null);
        setRejectReason('');
      }, 2000);
    } catch (err: any) {
      console.error('Reject engineer error:', err);
      setActionError(err.response?.data?.message || 'Failed to reject engineer');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="dashboard-container" style={{ maxWidth: '1400px' }}>
        <div className="text-center py-5">
          <Spinner animation="border" role="status" className="text-primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading registration requests...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="dashboard-container" style={{ maxWidth: '1400px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm">
        <div className="text-start">
          <h2 className="m-0 text-primary">Engineer Registration Requests</h2>
          <p className="text-muted mb-0">Review and manage pending engineer registrations</p>
        </div>
        <Button variant="outline-primary" onClick={() => router.push('/manager/dashboard')} className="d-flex align-items-center">
          <i className="bi bi-arrow-left me-2"></i>
          <span>Back to Dashboard</span>
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {engineers.length === 0 ? (
        <Alert variant="info" className="text-right">No pending registration requests</Alert>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Actions</th>
                    <th>Major</th>
                    <th>License ID</th>
                    <th>ID Number</th>
                    <th>Email</th>
                    <th>Full Name</th>
                    <th>#</th>
                  </tr>
                </thead>
                <tbody>
                  {engineers.map((engineer, index) => (
                    <tr key={engineer._id}>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => handleApproveClick(engineer)}
                            className="d-flex align-items-center"
                          >
                            <i className="bi bi-check-lg me-2"></i>
                            <span>Approve</span>
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleRejectClick(engineer)}
                            className="d-flex align-items-center"
                          >
                            <i className="bi bi-x-lg me-2"></i>
                            <span>Reject</span>
                          </Button>
                        </div>
                      </td>
                      <td>{engineer.major}</td>
                      <td>{engineer.licenseID}</td>
                      <td>{engineer.idNumber}</td>
                      <td>{engineer.email}</td>
                      <td>{engineer.fullName}</td>
                      <td>{index + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Confirmation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered dir="rtl">
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}
          {actionError && <Alert variant="danger">{actionError}</Alert>}
          
          {selectedEngineer && (
            <>
              <p>
                {actionType === 'approve' 
                  ? 'Are you sure you want to approve this engineer?' 
                  : 'Are you sure you want to reject this engineer?'}
              </p>
              <div className="p-3 bg-light rounded mb-3">
                <p className="mb-1"><strong>Name:</strong> {selectedEngineer.fullName}</p>
                <p className="mb-1"><strong>Email:</strong> {selectedEngineer.email}</p>
                <p className="mb-1"><strong>ID Number:</strong> {selectedEngineer.idNumber}</p>
                <p className="mb-1"><strong>License ID:</strong> {selectedEngineer.licenseID}</p>
                <p className="mb-0"><strong>Major:</strong> {selectedEngineer.major}</p>
              </div>
              
              {actionType === 'reject' && (
                <Form.Group className="mt-3">
                  <Form.Label className="d-block text-right">Rejection Reason <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please enter the reason for rejection"
                    disabled={actionLoading}
                    style={{ textAlign: 'left' }}
                  />
                </Form.Group>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowModal(false);
              setRejectReason('');
              setActionError('');
            }}
            disabled={actionLoading}
            className="d-flex align-items-center"
          >
            <i className="bi bi-x-lg me-1"></i>
            <span>Cancel</span>
          </Button>
          <Button 
            variant={actionType === 'approve' ? 'success' : 'danger'} 
            onClick={actionType === 'approve' ? handleApproveEngineer : handleRejectEngineer}
            disabled={actionLoading || (actionType === 'reject' && !rejectReason.trim())}
            className="d-flex align-items-center"
          >
            {actionLoading ? (
              <>
                <Spinner as="span" size="sm" animation="border" role="status" aria-hidden="true" className="me-1" />
                <span>Processing...</span>
              </>
            ) : actionType === 'approve' ? (
              <>
                <i className="bi bi-check-lg me-1"></i>
                <span>Approve</span>
              </>
            ) : (
              <>
                <i className="bi bi-x-lg me-1"></i>
                <span>Reject</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
