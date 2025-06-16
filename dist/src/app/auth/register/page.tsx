'use client';

import { useState } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    idNumber: '',
    licenseID: '',
    dateOfBirth: '',
    gender: '',
    major: '',
    profilePicture: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileError, setFileError] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    
    if (name === 'profilePicture' && files && files.length > 0) {
      const file = files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/tiff'];
      const maxSize = 100 * 1024; // Max 100 KB
      
      // Reset previous errors
      setFileError('');
      
      // Check file type
      if (!validTypes.includes(file.type)) {
        setFileError('File type not supported. Please upload an image in JPG, PNG, or TIFF format.');
        return;
      }
      
      // Check file size
      if (file.size > maxSize) {
        setFileError('File is too large. Maximum allowed size is 100KB.');
        return;
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setFormData(prev => ({ ...prev, [name]: file }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Check if there's a file error
    if (fileError) {
      return;
    }
    
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('idNumber', formData.idNumber);
      formDataToSend.append('licenseID', formData.licenseID);
      formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('major', formData.major);
      
      if (formData.profilePicture) {
        formDataToSend.append('profilePicture', formData.profilePicture);
      }
      
      // Send registration data to the backend
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        body: formDataToSend,
      });
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, get the response as text
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('An error occurred on the server. Please try again later.');
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      setSuccess('Registration successful. Your account is pending approval.');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      // Try to extract a more detailed error message
      let errorMessage = 'An error occurred during registration';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error?.message) {
        errorMessage = err.error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container className="auth-container" dir="ltr" style={{ textAlign: 'left' }}>
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Engineer Registration</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>ID Number</Form.Label>
              <Form.Control
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>License ID</Form.Label>
              <Form.Control
                type="text"
                name="licenseID"
                value={formData.licenseID}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Date of Birth</Form.Label>
              <Form.Control
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Gender</Form.Label>
              <Form.Select 
                name="gender"
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                required
                className={!formData.gender ? 'text-muted' : ''}
              >
                <option value="" disabled className="text-muted">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Major/Specialization</Form.Label>
              <Form.Select 
                name="major"
                value={formData.major}
                onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                required
                className={!formData.major ? 'text-muted' : ''}
              >
                <option value="" disabled className="text-muted">Select Major</option>
                <option value="IT">IT</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Chemical Engineering">Chemical Engineering</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="d-block">Profile Picture</Form.Label>
              <div className="position-relative" style={{ direction: 'ltr' }}>
                <Form.Control
                  type="file"
                  name="profilePicture"
                  accept=".jpg,.jpeg,.png,.tiff,image/jpeg,image/png,image/tiff"
                  onChange={handleChange}
                  className="form-control"
                  style={{
                    opacity: 0,
                    position: 'absolute',
                    zIndex: 2,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                />
                <div className="d-flex align-items-center" style={{
                  border: '1px solid #ced4da',
                  borderRadius: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#f8f9fa',
                  minHeight: '38px'
                }}>
                  <span className="me-2">
                    {formData.profilePicture ? formData.profilePicture.name : 'No file chosen'}
                  </span>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-secondary ms-auto"
                    onClick={(e) => {
                      e.preventDefault();
                      (document.querySelector('input[name="profilePicture"]') as HTMLInputElement)?.click();
                    }}
                  >
                    Choose File
                  </button>
                </div>
              </div>
              <div className="text-muted small mt-1" style={{ fontSize: '0.8rem' }}>
                <div>Maximum 100 KB</div>
              </div>
              {fileError && <div className="text-danger small mt-1">{fileError}</div>}
              {previewUrl && (
                <div className="mt-2">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ maxWidth: '100px', maxHeight: '100px', marginTop: '10px' }} 
                    className="img-thumbnail"
                  />
                </div>
              )}
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-3" 
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </Form>
          
          <div className="text-center mt-3">
            Already have an account?{' '}
            <Link href="/auth/login">
              Login
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
