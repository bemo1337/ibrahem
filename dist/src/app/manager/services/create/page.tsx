'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { unionService } from '../../../../services/api';

export default function CreateService() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    serviceName: '',
    description: '',
    requirements: ['']
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check for authentication token and user role
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'manager') {
      router.push('/auth/login');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequirementChange = (index: number, value: string) => {
    const updatedRequirements = [...formData.requirements];
    updatedRequirements[index] = value;
    setFormData(prev => ({ ...prev, requirements: updatedRequirements }));
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index: number) => {
    const updatedRequirements = [...formData.requirements];
    updatedRequirements.splice(index, 1);
    setFormData(prev => ({ ...prev, requirements: updatedRequirements }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Check the data
    if (!formData.serviceName.trim()) {
      setError('Service name is required');
      return;
    }
    
    // Filter out empty requirements
    const filteredRequirements = formData.requirements.filter(req => req.trim() !== '');
    
    try {
      setLoading(true);
      
      await unionService.createService({
        serviceName: formData.serviceName,
        description: formData.description,
        requirements: filteredRequirements
      });
      
      setSuccess('Service created successfully');
      
      // Reset the form
      setFormData({
        serviceName: '',
        description: '',
        requirements: ['']
      });
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/manager/dashboard');
      }, 2000);
      
    } catch (err: any) {
      console.error('Create service error:', err);
      setError(err.response?.data?.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="m-0">Create New Service</h2>
        <Button variant="outline-primary" onClick={() => router.push('/manager/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3 text-start">
              <Form.Label>Service Name *</Form.Label>
              <Form.Control
                type="text"
                name="serviceName"
                value={formData.serviceName}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3 text-start">
              <Form.Label>Service Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3 text-start">
              <Form.Label>Service Requirements</Form.Label>
              {formData.requirements.map((requirement, index) => (
                <div key={index} className="d-flex align-items-center mb-2">
                  <Form.Control
                    type="text"
                    value={requirement}
                    onChange={(e) => handleRequirementChange(index, e.target.value)}
                    placeholder={`Requirement ${index + 1}`}
                    className="flex-grow-1 me-2 text-start"
                    style={{ textAlign: 'left' }}
                  />
                  <Button 
                    variant="outline-danger" 
                    onClick={() => removeRequirement(index)}
                    disabled={formData.requirements.length === 1}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline-secondary" 
                onClick={addRequirement}
                className="mt-2 text-start"
              >
                Add Requirement
              </Button>
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              className="mt-3 text-start" 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Service'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
