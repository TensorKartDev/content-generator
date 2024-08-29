import React, { useState, useRef, useEffect } from 'react';

import axios from 'axios';
import { Card, ListGroup, Form, Button, InputGroup, Image, Spinner, Dropdown, Modal, Toast, Tabs, Tab } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import { FaCog, FaCopy,FaFileAlt } from 'react-icons/fa';
import dayjs from 'dayjs';

const ChatBot = ({ selectedSpace, selectedFile }) => {
    const [messages, setMessages] = useState([]);
    const [pastConversations, setPastConversations] = useState([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedModel, setSelectedModel] = useState('Gemini');
    const [showSettings, setShowSettings] = useState(false);
    const [showCopyButton, setShowCopyButton] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [expandedImage, setExpandedImage] = useState(null);
    const [expandedDates, setExpandedDates] = useState({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState('chat');
    const chatListRef = useRef(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setIsAdmin(params.has('admin'));
    }, []);

    const sendMessage = async () => {
        if (!input.trim() || !selectedSpace) {
            alert("Please provide a message and select a space.");
            return;
        }

        if (messages.length > 0 && messages[messages.length - 1].text === input.trim()) {
            alert("Please do not send the same message repeatedly.");
            return;
        }

        const userMessage = { sender: 'user', text: input.trim() };
        setMessages([...messages, userMessage]);
        setIsSending(true);

        try {
            let botMessageContent = '';
            let citations = [];
            let payload = {
                space: selectedSpace.name,
                query: input.trim(),
                model: selectedModel
            };

            if (selectedFile) {
                payload.filename = selectedFile.name;
            }

            const response = await axios.post(
                'http://192.168.1.3:5000/chat', // URL to the new API endpoint
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            botMessageContent = response?.data?.content || response?.data || response?.data?.text || 'No response';
            citations = response?.data?.citations || response?.data?.citations || [];

            const botMessage = { sender: 'bot', text: botMessageContent, citations: citations };
            setMessages(prevMessages => [...prevMessages, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = { sender: 'bot', text: 'Error processing your request.', citations: [] };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setInput('');
            setIsSending(false);
        }
    };

    const fetchPastConversations = async (spaceName, fileName) => {
        try {
            const response = await axios.get('http://192.168.1.3:5000/get_conversations', {
                params: { space: spaceName, filename: fileName },
                headers: { 'Content-Type': 'application/json' }
            });
            
            console.log('Response data:', response.data);
            const conversationsData = response.data.conversations;

            // Transform the conversations data to the expected format and remove space/filename prefix
            const conversations = conversationsData.map(conversation => {
                const text = conversation[1].replace(/^.*? - /, '');
                return {
                    sender: conversation[0],
                    text: text,
                    timestamp: conversation[2],
                    // You can add more fields here if needed
                };
            });

            console.log('Conversations array:', conversations);

            conversations.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setPastConversations(conversations);
        } catch (error) {
            console.error('Error fetching past conversations:', error);
            setPastConversations([]);
        }
    };

    useEffect(() => {
        if (selectedSpace) {
            fetchPastConversations(selectedSpace.name, selectedFile ? selectedFile.name : null);
        }
    }, [selectedSpace, selectedFile]);

    useEffect(() => {
        if (chatListRef.current) {
            chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
        }
    }, [messages, pastConversations]);

    useEffect(() => {
        const handleScroll = () => {
            if (chatListRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = chatListRef.current;
                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
                setShowCopyButton(isAtBottom);
            }
        };

        if (chatListRef.current) {
            chatListRef.current.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (chatListRef.current) {
                chatListRef.current.removeEventListener('scroll', handleScroll);
            }
        };
    }, [messages]);

    const handleModelChange = (model) => {
        setSelectedModel(model);
    };

    const handleSettingsClose = () => setShowSettings(false);
    const handleSettingsShow = () => setShowSettings(true);

    const handleCopyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        }).catch((err) => {
            console.error('Failed to copy text: ', err);
        });
    };

    const handleImageExpand = (imageSrc) => {
        setExpandedImage(imageSrc);
    };

    const handleImageClose = () => {
        setExpandedImage(null);
    };

    const toggleDateExpansion = (date) => {
        setExpandedDates(prevState => ({
            ...prevState,
            [date]: !prevState[date]
        }));
    };

    // Group messages by date
    const groupMessagesByDate = (messages) => {
        return messages.reduce((groups, message) => {
            const date = dayjs(message.timestamp).format('YYYY-MM-DD');
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
            return groups;
        }, {});
    };

    const groupedMessages = groupMessagesByDate([...pastConversations, ...messages]);

    return (
        <>
            <Card className="chat-panel">
                <Card.Header>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {isSending && <Spinner animation="border" size="sm" role="status" className="mr-2">
                                <span className="sr-only"></span>
                            </Spinner>}
                            {isAdmin && <FaCog style={{ cursor: 'pointer' }} onClick={handleSettingsShow} />}
                        </div>
                    </div>
                </Card.Header>
                <Card.Body style={{ display: 'flex', flexDirection: 'column', height: '85vh' }}>
                    <Tabs
                        id="chat-tabs"
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="mb-3"
                    >
                        <Tab eventKey="chat" title="Chat">
                            <ListGroup className="chat-list flex-grow-1" ref={chatListRef} style={{ overflowY: 'auto' }}>
                                {Object.keys(groupedMessages).map((date, index) => (
                                    <React.Fragment key={index}>
                                        <ListGroup.Item 
                                            className="text-center text-muted"
                                            onClick={() => toggleDateExpansion(date)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {dayjs(date).format('MMMM D, YYYY')}
                                        </ListGroup.Item>
                                        {expandedDates[date] && groupedMessages[date].map((message, index) => (
                                            <ListGroup.Item
                                                key={index}
                                                className={`d-flex ${message.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                                            >
                                                {(message.sender === 'bot' || message.sender === 'ai') && (
                                                    <Image src="./bot_avatar.png" roundedCircle style={{ width: '30px', height: '30px', marginRight: '10px' }} />
                                                )}
                                                <div style={{ position: 'relative', width: '100%' }}>
                                                    <span style={{ whiteSpace: 'pre-wrap' }}>
                                                        {(message.sender === 'bot' || message.sender === 'ai') ? (
                                                            <ReactMarkdown>{message.text}</ReactMarkdown>
                                                        ) : (
                                                            message.text
                                                        )}
                                                    </span>
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </ListGroup>
                        </Tab>
                        <Tab eventKey="documents" title="Preview">
                            {/* Document viewer content goes here */}
                            <div className="document-viewer">
                                {/* Placeholder for document viewer */}
                                <p>Document Viewer Content Here</p>
                            </div>
                        </Tab>
                    </Tabs>
                </Card.Body>
                <Card.Footer>
                    <Form onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
                        <InputGroup>
                            <Form.Control
                                type="text"
                                placeholder="Type a message"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <Button variant="primary" type="submit" disabled={isSending}>
                                Send
                            </Button>
                        </InputGroup>
                    </Form>
                </Card.Footer>
            </Card>
            <Modal show={showSettings} onHide={handleSettingsClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Dropdown>
                        <Dropdown.Toggle variant="success" id="dropdown-basic">
                            Model: {selectedModel}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleModelChange('Gemini')}>Gemini</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleModelChange('OpenAI')}>OpenAI</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleModelChange('Llama3')}>Llama3</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleSettingsClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
            <Toast
                style={{ position: 'fixed', bottom: '10px', right: '10px' }}
                show={showToast}
                onClose={() => setShowToast(false)}
                delay={2000}
                autohide
            >
                <Toast.Body>Text copied to clipboard!</Toast.Body>
            </Toast>
            <Modal show={!!expandedImage} onHide={handleImageClose}>
                <Modal.Body>
                    {expandedImage && <img src={expandedImage} alt="Expanded" style={{ width: '100%' }} />}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleImageClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ChatBot;
