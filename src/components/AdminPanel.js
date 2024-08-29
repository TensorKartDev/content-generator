import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, ListGroup, Spinner, ProgressBar } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AiOutlineUpload } from 'react-icons/ai';
import './AdminPanel.css'; // Ensure this file exists and is correctly imported

const AdminPanel = ({ spaces = [], setSelectedSpace, selectedSpace, selectedFile, setSelectedFile, mode }) => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);
    const [selectedSpaceState, setSelectedSpaceState] = useState(null);

    useEffect(() => {
        if (spaces.length > 0) {
            const firstSpace = spaces[0];
            setSelectedSpace(firstSpace);
            setSelectedSpaceState(firstSpace);
        }
    }, [spaces, setSelectedSpace]);

    const fetchFiles = (space) => {
        setSelectedSpace(space);
        setSelectedSpaceState(space);
        setSelectedFile(null);
    };

    const uploadFile = async (file) => {
        if (file && selectedSpaceState) {
            if (file.type !== 'application/pdf') {
                toast.warn('Only PDF files are allowed');
                return;
            }
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await axios.post(`http://192.168.1.3:5000/upload_file/${selectedSpaceState.name}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    },
                });
                toast.success(response.data.message, {
                    position: "top-center",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: false,
                    progress: undefined,
                });
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''; // Clear file input
                }
                setFile(null); // Clear file state
                setUploadProgress(0); // Reset upload progress

                // Refresh file list after successful upload
                fetchFiles(selectedSpaceState);
            } catch (error) {
                toast.error('Error uploading file');
            }
        } else {
            toast.error('Please select a space and a file');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        if (selectedFile) {
            uploadFile(selectedFile);
        }
    };

    const convertPdf = async () => {
        if (selectedFile && selectedSpace) {
            setLoading(true);
            setProgress(0);
            try {
                const response = await axios.post(
                    `http://192.168.1.3:5000/convert_pdf/${selectedFile.name}`,
                    { space: selectedSpace.name },
                    {
                        onUploadProgress: (progressEvent) => {
                            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setProgress(percentCompleted);
                        }
                    }
                );
                toast.success(response.data.message, {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } catch (error) {
                toast.error('Error converting PDF', {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } finally {
                setLoading(false);
            }
        } else {
            toast.warn('No file selected or space selected', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <Card className={`admin-panel ${mode === 'Input' ? 'input-mode' : 'output-mode'}`}>
            <Card.Header>
                {mode === 'Input' ? 'Inputs' : 'Outputs'}
                {mode === 'Input' && (
                    <span>
                        <AiOutlineUpload onClick={handleUploadClick} />
                    </span>
                )}
            </Card.Header>
            <Card.Body>
                {selectedSpace ? (
                    <>
                        <p className="badge bg-primary">Total Files: {selectedSpace.files.length}</p>
                        <p className="badge bg-success">Indexed Files: {selectedSpace.files.filter(file => file.isIndexed).length}</p>
                        <p className="badge bg-warning">Not Indexed Files: {selectedSpace.files.filter(file => !file.isIndexed).length}</p>
                        <div className='file-list-container'>
                            <ListGroup className='list-group'>
                                {selectedSpace.files.map((file, index) => (
                                    <ListGroup.Item
                                        className='list-group-item list-group-item-action flex-column align-items-start'
                                        key={index}
                                        onClick={() => setSelectedFile(file)}
                                        active={selectedFile && selectedFile.name === file.name}
                                        aria-current={selectedFile && selectedFile.name === file.name}
                                    >
                                        {file.name}
                                        {file.isIndexed ? 
                                            <span className="badge rounded-pill bg-success">Indexed</span> 
                                            : <span className="badge rounded-pill bg-warning">Not Indexed</span>
                                        }
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </div>
                    </>
                ) : (
                    <p className='text-danger'>No project is loaded, create a new project or load an existing project.</p>
                )}
                {selectedFile && (
                    <>
                        {selectedFile.isIndexed ? (
                            <p className='alert alert-dismissible alert-success'>{selectedFile.name} is already indexed.</p>
                        ) : (
                            <>
                                {mode === 'Input' && (
                                    <Button className="mt-2 btn btn-warning" onClick={convertPdf} variant="primary" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                /> Converting...
                                            </>
                                        ) : (
                                            'Index this file'
                                        )}
                                    </Button>
                                )}
                                {loading && (
                                    <ProgressBar now={progress} label={`${progress}%`} className="mt-3" />
                                )}
                            </>
                        )}
                    </>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
            </Card.Body>
            <ToastContainer />
        </Card>
    );
};

export default AdminPanel;
