'use client';

import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

export default function HelpSupport() {
  const router = useRouter();

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Help & Support</h2>
        <Button variant="outline-secondary" onClick={() => router.back()}>
          Back to Dashboard
        </Button>
      </div>

      <Row className="g-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Frequently Asked Questions</Card.Title>
              <Card.Text>
                Find answers to common questions about using the system, submitting requests, and more.
              </Card.Text>
              <Button variant="outline-primary">View FAQ</Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Contact Support</Card.Title>
              <Card.Text>
                Need help? Our support team is here to assist you with any questions or issues.
              </Card.Text>
              <div className="mb-3">
                <p className="mb-1"><strong>Email:</strong> support@engineers-syndicate.com</p>
                <p className="mb-0"><strong>Phone:</strong> +963 955 588 817</p>
              </div>
              <Button variant="outline-primary">Contact Us</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>User Guides</Card.Title>
              <Card.Text>
                Access our comprehensive user guides and tutorials to make the most of our platform.
              </Card.Text>
              <Button variant="outline-primary">View Guides</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Report an Issue</Card.Title>
              <Card.Text>
                Found a bug or experiencing technical difficulties? Let us know so we can help.
              </Card.Text>
              <Button variant="outline-primary">Report Issue</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
