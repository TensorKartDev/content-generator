import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import "./Footer.css";
const Footer = () => {
    return (
        <footer className="bg-dark text-light  mt-auto sticky-footer">
            <Container>
                <Row>
                    <Col className="text-center">
                    Content Generator{new Date().getFullYear()}, Powered by Spaces 1.0
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};

export default Footer;
