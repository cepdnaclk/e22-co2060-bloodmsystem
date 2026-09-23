import React, { useState, useEffect } from 'react';
import { 
    PackagePlus, AlertTriangle, ListChecks, Activity, 
    Stethoscope, Clock, CheckCircle, XCircle 
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '../../components/layout/DashboardLayout';
import './StaffDashboard.scss';
import { getBloodStock } from '../../api/inventoryService';
import { 
    getAllBloodRequests, 
    updateBloodRequestStatus, 
    getInventoryChanges,
    createInventoryChange 
} from '../../api/adminInventoryService';

const StaffDashboard = () => {
    const [activeTab, setActiveTab] = useState('requests');
    const [inventory, setInventory] = useState({});
    const [requests, setRequests] = useState([]);
    const [changes, setChanges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Blood Stock
        const invRes = await getBloodStock();
        if (invRes.success) setInventory(invRes.data);

        // Fetch Doctor Blood Requests
        const reqRes = await getAllBloodRequests();
        if (reqRes.success) setRequests(reqRes.data);

        // Fetch pending changes (if any)
        const changesRes = await getInventoryChanges();
        if (changesRes.success) setChanges(changesRes.data);

        setLoading(false);
    };

    const handleAddPacket = () => {
        Swal.fire({
            title: 'Add New Blood Packet',
            html: `
                <div style="text-align: left; padding: 0 10px; box-sizing: border-box;">
                    <select id="swal-type" style="display: block; width: 100%; box-sizing: border-box; padding: 10px 14px; margin-bottom: 16px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-main); font-family: inherit; font-size: 0.95rem; outline: none;">
                        <option value="" disabled selected>Select Blood Group</option>
                        <option value="A+">A+</option><option value="A-">A-</option>
                        <option value="B+">B+</option><option value="B-">B-</option>
                        <option value="O+">O+</option><option value="O-">O-</option>
                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </select>
                    <input id="swal-units" type="number" min="1" placeholder="Number of Units" style="display: block; width: 100%; box-sizing: border-box; padding: 10px 14px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-main); font-family: inherit; font-size: 0.95rem; outline: none;" />
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#1976d2',
            confirmButtonText: 'Submit Request',
            preConfirm: () => {
                const type = document.getElementById('swal-type').value;
                const units = document.getElementById('swal-units').value;
                if (!type || !units) {
                    Swal.showValidationMessage('Please enter both Type and Units');
                }
                return { type, units: parseInt(units) }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const data = {
                    action: "ADD",
                    blood_type: result.value.type,
                    quantity_delta: result.value.units,
                    reason: "Routine collection"
                };
                
                const res = await createInventoryChange(data);
                if (res.success) {
                    Swal.fire('Added!', 'Packet added to pending inventory approval queue.', 'success');
                    fetchData();
                } else {
                    Swal.fire('Error', res.error.detail || 'Could not add packet', 'error');
                }
            }
        });
    };

    const handleApproveRequest = (id, requestedUnits) => {
        Swal.fire({
            title: 'Approve Request',
            html: `
                <div style="text-align: left; padding: 0 10px; box-sizing: border-box;">
                    <label style="font-weight: 600; font-size: 0.9em; color: var(--color-text-main); display: block; margin-bottom: 6px;">Units to Approve (Requested: ${requestedUnits})</label>
                    <input id="swal-units-app" type="number" value="${requestedUnits}" style="display: block; width: 100%; box-sizing: border-box; padding: 10px 14px; margin-bottom: 16px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-main); font-family: inherit; font-size: 0.95rem; outline: none;" />
                    
                    <label style="font-weight: 600; font-size: 0.9em; color: var(--color-text-main); display: block; margin-bottom: 6px;">Approval Note (Optional)</label>
                    <input id="swal-note-app" type="text" placeholder="e.g. Dispatched via cooler" style="display: block; width: 100%; box-sizing: border-box; padding: 10px 14px; margin-bottom: 10px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-main); font-family: inherit; font-size: 0.95rem; outline: none;" />
                </div>
            `,
            showCancelButton: true,
            confirmButtonColor: '#2e7d32',
            confirmButtonText: 'Approve & Allocate',
            preConfirm: () => {
                return {
                    status: 'APPROVED',
                    units_approved: parseInt(document.getElementById('swal-units-app').value),
                    approval_note: document.getElementById('swal-note-app').value
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await updateBloodRequestStatus(id, result.value);
                if (res.success) {
                    Swal.fire('Approved!', 'Request approved and units allocated.', 'success');
                    fetchData();
                } else {
                    Swal.fire('Error', 'Could not approve request.', 'error');
                }
            }
        });
    };

    const handleRejectRequest = (id) => {
        Swal.fire({
            title: 'Reject Request',
            input: 'text',
            inputLabel: 'Reason for Rejection',
            inputPlaceholder: 'e.g. Insufficient stock',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f',
            confirmButtonText: 'Reject Request',
            preConfirm: (note) => {
                if (!note) Swal.showValidationMessage('A reason is required to reject a request.');
                return { status: 'REJECTED', rejection_note: note };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await updateBloodRequestStatus(id, result.value);
                if (res.success) {
                    Swal.fire('Rejected', 'The request has been rejected.', 'info');
                    fetchData();
                } else {
                    Swal.fire('Error', 'Could not reject request.', 'error');
                }
            }
        });
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'requests':
                return (
                    <div className="card fade-in">
                        <div className="card-header">
                            <h2><Stethoscope size={20} /> Doctor Blood Requests</h2>
                        </div>
                        <div className="card-body p-0 data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Doctor / Hospital</th>
                                        <th>Blood Group</th>
                                        <th>Units</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No requests found.</td></tr>
                                    ) : requests.map(req => (
                                        <tr key={req.id}>
                                            <td>{new Date(req.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <strong>{req.doctor_name || `Dr. #${req.doctor}`}</strong><br/>
                                                <span style={{fontSize: '12px', color: '#666'}}>{req.hospital || '-'}</span>
                                            </td>
                                            <td><strong style={{fontSize: '16px'}}>{req.blood_group}</strong></td>
                                            <td>{req.units_requested}</td>
                                            <td><span className={`badge ${req.priority_level}`}>{req.priority_level}</span></td>
                                            <td><span className={`badge ${req.status}`}>{req.status}</span></td>
                                            <td>
                                                {req.status === 'PENDING' ? (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button className="btn btn-sm btn-success" onClick={() => handleApproveRequest(req.id, req.units_requested)}>Approve</button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleRejectRequest(req.id)}>Reject</button>
                                                    </div>
                                                ) : (
                                                    <span style={{fontSize: '12px', color: '#888'}}>
                                                        {req.status === 'REJECTED' ? `Note: ${req.rejection_note}` : `Allocated: ${req.units_approved}`}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'inventory':
                return (
                    <div className="card fade-in">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><ListChecks size={20} /> Live Blood Inventory</h2>
                            <button className="dashboard btn btn-primary" onClick={handleAddPacket}>
                                <PackagePlus size={18} /> Add Stock
                            </button>
                        </div>
                        <div className="card-body">
                            {Object.keys(inventory).length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#666' }}>No inventory data available.</p>
                            ) : (
                                <div className="blood-type-grid">
                                    {Object.entries(inventory).map(([group, data]) => (
                                        <div key={group} className={`stock-card status-${data.status}`}>
                                            <h3>{group}</h3>
                                            <div className="units">{data.units} Units</div>
                                            <div className="status">{data.status}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'pending-changes':
                return (
                    <div className="card fade-in">
                        <div className="card-header">
                            <h2><Clock size={20} /> Pending Stock Changes (Awaiting Admin Approval)</h2>
                        </div>
                        <div className="card-body p-0 data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Action</th>
                                        <th>Blood Type</th>
                                        <th>Quantity Delta</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {changes.length === 0 ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No pending changes.</td></tr>
                                    ) : changes.map(change => (
                                        <tr key={change.id}>
                                            <td>{new Date(change.created_at).toLocaleDateString()}</td>
                                            <td>{change.action}</td>
                                            <td>{change.blood_type || '-'}</td>
                                            <td>{change.quantity_delta > 0 ? `+${change.quantity_delta}` : change.quantity_delta}</td>
                                            <td><span className="badge warning">{change.status.replace(/_/g, ' ')}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const MENU_ITEMS = [
        { id: 'requests', icon: <Stethoscope size={20} />, label: 'Doctor Requests' },
        { id: 'inventory', icon: <ListChecks size={20} />, label: 'Live Inventory' },
        { id: 'pending-changes', icon: <Clock size={20} />, label: 'Stock Approvals' },
    ];

    return (
        <DashboardLayout
            title="Blood Bank Dashboard"
            subtitle="Manage stock and fulfill hospital requests."
            brandLabel={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.1em', textTransform: 'none' }}>
                        Blood Bank Admin
                    </span>
                    <span style={{ fontSize: '0.9em', letterSpacing: '0.5px' }}>STAFF PORTAL</span>
                </div>
            }
            menuItems={MENU_ITEMS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            <div className="staff-dashboard-page">
                {loading ? <p>Loading data...</p> : renderContent()}
            </div>
        </DashboardLayout>
    );
};

export default StaffDashboard;
