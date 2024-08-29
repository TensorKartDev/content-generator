import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button, Modal, Form, InputGroup } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaProjectDiagram, FaFilePdf, FaFilePowerpoint, FaFileWord, FaFile } from 'react-icons/fa'; // Import icons
import yaml from 'js-yaml';
import "./CreateSpace.css";
const fileIcons = {
    pdf: <FaFilePdf />,
    ppt: <FaFilePowerpoint />,
    docx: <FaFileWord />,
    // Add more file types as needed
};

const CreateSpace = ({ fetchSpaces, onLoadProject }) => {
    const [showModal, setShowModal] = useState(false);
    const [spaceName, setSpaceName] = useState('');
    const [files, setFiles] = useState([]);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [workspaceFiles, setWorkspaceFiles] = useState([]);
    const [userImage] = useState('https://via.placeholder.com/40'); // Replace with actual user image URL

    // Handle creation of new space
    const handleCreateSpace = async () => {
        try {
            // Create space and generate .sps file
            const response = await axios.post('http://192.168.1.3:5000/create_space', { spaceName, files });
            toast.success(response.data.message, {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setSpaceName(''); // Clear the input field after successful creation
            setFiles([]); // Clear the files after successful creation
            fetchSpaces(); // Refresh the list of spaces
            setShowModal(false); // Close the modal after successful creation
        } catch (error) {
            toast.error(error.message, {
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

    // Handle file upload
    const handleFileUpload = (event) => {
        const uploadedFiles = Array.from(event.target.files);
        setFiles(uploadedFiles);
    };

    // Handle loading of a project
    const handleLoadProject = useCallback(async () => {
        if (selectedSpace) {
            onLoadProject(selectedSpace); // Pass the selected space to the parent component

            try {
                // Fetch and parse workspace.yaml
                const response = await axios.get('http://192.168.1.3:5000/workspace.yaml');
                const workspaceData = yaml.load(response.data);
                if (workspaceData && workspaceData.inputs && workspaceData.outputs) {
                    // Map files and set state
                    const allFiles = [...workspaceData.inputs, ...workspaceData.outputs];
                    const filesWithIcons = allFiles.map(file => ({
                        name: file,
                        icon: fileIcons[file.split('.').pop()] || <FaFile />
                    }));
                    setWorkspaceFiles(filesWithIcons);
                }
            } catch (error) {
                console.error('Error fetching workspace.yaml:', error);
            }
        }
    }, [selectedSpace, onLoadProject]);

    useEffect(() => {
        fetchSpaces();
    }, [fetchSpaces]);

    return (
        <div>
            <div class="navbar bg-dark" data-bs-theme="dark">
                <div className="toolbar-section actions">
                    <Button 
                        variant="outline-primary" 
                        className="me-2"
                        onClick={() => setShowModal(true)}
                    >
                        <FaPlus /> Create New Project
                    </Button>
                    <Button 
                        variant="outline-secondary"
                        onClick={handleLoadProject} // Handle project load
                    >
                        <FaProjectDiagram /> Load Project
                    </Button>
                </div>
                <div className="toolbar-section user-info">
                    <span className="project-details text-body-emphasis">Project Details Here</span>
                    <img src={userImage} alt="User" className="user-image" />
                </div>
            </div>

            {/* Modal Dialog for Creating New Project */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create New Project</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <InputGroup className="mb-3">
                            <Form.Control 
                                type="text" 
                                placeholder="Enter project name" 
                                value={spaceName} 
                                onChange={(e) => setSpaceName(e.target.value)} 
                            />
                        </InputGroup>
                        <InputGroup className="mb-3">
                            <Form.Control 
                                type="file" 
                                multiple
                                onChange={handleFileUpload}
                            />
                        </InputGroup>
                        <div className="mt-3">
                            <Button variant="primary" onClick={handleCreateSpace}>
                                <FaPlus /> Create
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            <ToastContainer />

            {/* Display workspace files */}
            {workspaceFiles.length > 0 && (
                <div className="workspace-files">
                    {workspaceFiles.map(file => (
                        <div key={file.name} className="file-item">
                            {file.icon} {file.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CreateSpace;
