import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';

function Test() {
  return (
    <Container className="mt-5 text-center">
      <h1>Customer Test Page</h1>
      <p>If you see this, your frontend setup is working perfectly!</p>

      <Card className="mt-4 mx-auto" style={{ width: '18rem' }}>
        <Card.Body>
          <Card.Title>Test Card</Card.Title>
          <Card.Text>
            This is a sample card using React-Bootstrap styling.
          </Card.Text>
          <Button variant="primary">Click Me</Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Test;
